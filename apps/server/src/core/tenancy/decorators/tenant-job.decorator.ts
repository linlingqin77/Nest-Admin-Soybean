import { SetMetadata, Injectable, Logger } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from 'src/platform/prisma';

export const TENANT_JOB_KEY = 'TENANT_JOB';

/**
 * 租户定时任务配置选项
 */
export interface TenantJobOptions {
  /** 是否并行执行，默认false（串行执行） */
  parallel?: boolean;
  /** 错误时是否继续执行其他租户，默认true */
  continueOnError?: boolean;
  /** 并行执行时的最大并发数，默认5 */
  maxConcurrency?: number;
}

/**
 * 租户任务执行结果
 */
export interface TenantJobResult {
  tenantId: string;
  success: boolean;
  error?: Error;
  duration: number;
}

/**
 * 租户任务执行上下文
 */
export interface TenantJobContext {
  tenantId: string;
  tenantName: string;
}

/**
 * 默认配置
 */
const DEFAULT_OPTIONS: Required<TenantJobOptions> = {
  parallel: false,
  continueOnError: true,
  maxConcurrency: 5,
};

/**
 * 租户定时任务装饰器
 *
 * @description
 * 用于遍历所有正常状态的租户执行定时任务
 * 每个租户的执行都在正确的租户上下文中
 *
 * @example
 * ```typescript
 * // 基本用法 - 串行执行
 * @Cron('0 0 2 * * *')
 * @TenantJob()
 * async dailyStatistics(context: TenantJobContext) {
 *   // 此方法会为每个租户执行一次
 *   console.log(`Processing tenant: ${context.tenantId}`);
 * }
 *
 * // 并行执行
 * @Cron('0 0 3 * * *')
 * @TenantJob({ parallel: true, maxConcurrency: 10 })
 * async parallelTask(context: TenantJobContext) {
 *   // 并行处理多个租户
 * }
 *
 * // 错误时停止
 * @Cron('0 0 4 * * *')
 * @TenantJob({ continueOnError: false })
 * async criticalTask(context: TenantJobContext) {
 *   // 任何租户失败都会停止执行
 * }
 * ```
 *
 * @param options 租户任务配置
 */
export function TenantJob(options: TenantJobOptions = {}): MethodDecorator {
  const mergedOptions = { ...DEFAULT_OPTIONS, ...options };
  return (target, propertyKey, descriptor) => {
    SetMetadata(TENANT_JOB_KEY, mergedOptions)(target, propertyKey, descriptor);
    return descriptor;
  };
}

/**
 * 租户任务执行器
 * 用于在Service中执行租户遍历任务
 */
@Injectable()
export class TenantJobExecutor {
  private readonly logger = new Logger(TenantJobExecutor.name);

  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * 执行租户任务
   * @param handler 任务处理函数
   * @param options 执行选项
   * @returns 执行结果列表
   */
  async execute(
    handler: (context: TenantJobContext) => Promise<void>,
    options: TenantJobOptions = {},
  ): Promise<TenantJobResult[]> {
    const mergedOptions = { ...DEFAULT_OPTIONS, ...options };
    const tenants = await this.getActiveTenants();

    this.logger.log(`Starting tenant job for ${tenants.length} tenants`);

    if (mergedOptions.parallel) {
      return this.executeParallel(tenants, handler, mergedOptions);
    } else {
      return this.executeSerial(tenants, handler, mergedOptions);
    }
  }

  /**
   * 获取所有正常状态的租户
   */
  private async getActiveTenants(): Promise<Array<{ tenantId: string; companyName: string }>> {
    const tenants = await this.prisma.sysTenant.findMany({
      where: {
        status: '0', // 正常状态 (字符串类型)
        delFlag: '0', // 未删除 (字符串类型)
      },
      select: {
        tenantId: true,
        companyName: true,
      },
    });

    return tenants;
  }

  /**
   * 串行执行租户任务
   */
  private async executeSerial(
    tenants: Array<{ tenantId: string; companyName: string }>,
    handler: (context: TenantJobContext) => Promise<void>,
    options: Required<TenantJobOptions>,
  ): Promise<TenantJobResult[]> {
    const results: TenantJobResult[] = [];

    for (const tenant of tenants) {
      const startTime = Date.now();
      const context: TenantJobContext = {
        tenantId: tenant.tenantId,
        tenantName: tenant.companyName,
      };

      try {
        await handler(context);
        results.push({
          tenantId: tenant.tenantId,
          success: true,
          duration: Date.now() - startTime,
        });
        this.logger.debug(`Tenant ${tenant.tenantId} completed successfully`);
      } catch (error) {
        const result: TenantJobResult = {
          tenantId: tenant.tenantId,
          success: false,
          error: error as Error,
          duration: Date.now() - startTime,
        };
        results.push(result);
        this.logger.error(`Tenant ${tenant.tenantId} failed: ${error instanceof Error ? error.message : String(error)}`);

        if (!options.continueOnError) {
          this.logger.warn('Stopping execution due to error');
          break;
        }
      }
    }

    return results;
  }

  /**
   * 并行执行租户任务
   */
  private async executeParallel(
    tenants: Array<{ tenantId: string; companyName: string }>,
    handler: (context: TenantJobContext) => Promise<void>,
    options: Required<TenantJobOptions>,
  ): Promise<TenantJobResult[]> {
    const results: TenantJobResult[] = [];
    const { maxConcurrency, continueOnError } = options;

    // 分批执行
    for (let i = 0; i < tenants.length; i += maxConcurrency) {
      const batch = tenants.slice(i, i + maxConcurrency);

      const batchPromises = batch.map(async (tenant) => {
        const startTime = Date.now();
        const context: TenantJobContext = {
          tenantId: tenant.tenantId,
          tenantName: tenant.companyName,
        };

        try {
          await handler(context);
          return {
            tenantId: tenant.tenantId,
            success: true,
            duration: Date.now() - startTime,
          } as TenantJobResult;
        } catch (error) {
          this.logger.error(`Tenant ${tenant.tenantId} failed: ${error instanceof Error ? error.message : String(error)}`);
          return {
            tenantId: tenant.tenantId,
            success: false,
            error: error as Error,
            duration: Date.now() - startTime,
          } as TenantJobResult;
        }
      });

      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);

      // 检查是否需要停止
      if (!continueOnError && batchResults.some((r) => !r.success)) {
        this.logger.warn('Stopping execution due to error in batch');
        break;
      }
    }

    return results;
  }

  /**
   * 获取任务执行摘要
   */
  getSummary(results: TenantJobResult[]): {
    total: number;
    success: number;
    failed: number;
    totalDuration: number;
    averageDuration: number;
  } {
    const total = results.length;
    const success = results.filter((r) => r.success).length;
    const failed = results.filter((r) => !r.success).length;
    const totalDuration = results.reduce((sum, r) => sum + r.duration, 0);
    const averageDuration = total > 0 ? totalDuration / total : 0;

    return {
      total,
      success,
      failed,
      totalDuration,
      averageDuration,
    };
  }
}
