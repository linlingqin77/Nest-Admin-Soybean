import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ClsService } from 'nestjs-cls';
import { SysAuditLog, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * 审计日志数据接口
 */
export interface AuditLogData {
  /** 操作动作 */
  action: string;
  /** 模块名称 */
  module: string;
  /** 目标类型 */
  targetType?: string;
  /** 目标ID */
  targetId?: string;
  /** 旧值 (JSON字符串) */
  oldValue?: string;
  /** 新值 (JSON字符串) */
  newValue?: string;
  /** 操作状态: '0' 成功, '1' 失败 */
  status: '0' | '1';
  /** 错误信息 */
  errorMsg?: string;
  /** 操作耗时(ms) */
  duration?: number;
}

/**
 * 完整的审计日志记录接口
 */
export interface AuditLogRecord extends AuditLogData {
  /** 租户ID */
  tenantId: string;
  /** 用户ID */
  userId?: number;
  /** 用户名 */
  userName?: string;
  /** IP地址 */
  ip: string;
  /** User-Agent */
  userAgent?: string;
  /** 请求ID */
  requestId?: string;
}

/**
 * 审计日志服务
 *
 * @description 提供审计日志记录功能，支持异步写入以避免阻塞主业务流程
 */
@Injectable()
export class AuditService implements OnModuleDestroy {
  private readonly logger = new Logger(AuditService.name);
  private readonly writeQueue: AuditLogRecord[] = [];
  private flushTimer: NodeJS.Timeout | null = null;
  private readonly FLUSH_INTERVAL = 1000; // 1秒刷新一次
  private readonly BATCH_SIZE = 100; // 批量写入大小
  private isDestroyed = false;

  constructor(
    private readonly prisma: PrismaService,
    private readonly cls: ClsService,
  ) {
    // Only start timer in non-test environment
    if (process.env.NODE_ENV !== 'test') {
      this.startFlushTimer();
    }
  }

  /**
   * 记录审计日志（异步）
   *
   * @param data 审计日志数据
   */
  async log(data: AuditLogData): Promise<void> {
    const record = this.buildRecord(data);
    this.writeQueue.push(record);

    // 如果队列达到批量大小，立即刷新
    if (this.writeQueue.length >= this.BATCH_SIZE) {
      await this.flush();
    }
  }

  /**
   * 同步记录审计日志（立即写入）
   *
   * @param data 审计日志数据
   */
  async logSync(data: AuditLogData): Promise<void> {
    const record = this.buildRecord(data);
    try {
      await this.prisma.sysAuditLog.create({
        data: record,
      });
    } catch (error) {
      this.logger.error(`Failed to write audit log: ${error.message}`, error.stack);
    }
  }

  /**
   * 构建完整的审计日志记录
   */
  private buildRecord(data: AuditLogData): AuditLogRecord {
    // 从 CLS 上下文获取请求信息
    const requestId = this.cls.get('requestId') || '';
    const user = this.cls.get('user') as { userId?: number; userName?: string; tenantId?: string } | undefined;
    const request = this.cls.get('request') as { ip?: string; headers?: Record<string, string> } | undefined;

    return {
      ...data,
      tenantId: user?.tenantId || '000000',
      userId: user?.userId,
      userName: user?.userName,
      ip: request?.ip || '0.0.0.0',
      userAgent: request?.headers?.['user-agent'],
      requestId,
    };
  }

  /**
   * 启动定时刷新
   */
  private startFlushTimer(): void {
    this.flushTimer = setInterval(() => {
      this.flush().catch((error) => {
        this.logger.error(`Failed to flush audit logs: ${error.message}`, error.stack);
      });
    }, this.FLUSH_INTERVAL);
  }

  /**
   * 刷新队列，批量写入数据库
   */
  async flush(): Promise<void> {
    if (this.writeQueue.length === 0) {
      return;
    }

    const records = this.writeQueue.splice(0, this.BATCH_SIZE);

    try {
      await this.prisma.sysAuditLog.createMany({
        data: records,
      });
      this.logger.debug(`Flushed ${records.length} audit logs`);
    } catch (error) {
      this.logger.error(`Failed to batch write audit logs: ${error.message}`, error.stack);
      // 将失败的记录放回队列头部
      this.writeQueue.unshift(...records);
    }
  }

  /**
   * 模块销毁时刷新剩余日志
   */
  async onModuleDestroy(): Promise<void> {
    this.isDestroyed = true;
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }

    // 刷新所有剩余日志
    while (this.writeQueue.length > 0) {
      await this.flush();
    }
  }

  /**
   * 手动启动刷新定时器（用于测试）
   */
  startTimer(): void {
    if (!this.flushTimer && !this.isDestroyed) {
      this.startFlushTimer();
    }
  }

  /**
   * 手动停止刷新定时器（用于测试）
   */
  stopTimer(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }
  }

  /**
   * 查询审计日志
   */
  async findAll(params: {
    tenantId?: string;
    userId?: number;
    action?: string;
    module?: string;
    startTime?: Date;
    endTime?: Date;
    pageNum?: number;
    pageSize?: number;
  }): Promise<{ rows: SysAuditLog[]; total: number }> {
    const { tenantId, userId, action, module, startTime, endTime, pageNum = 1, pageSize = 10 } = params;

    const where: Prisma.SysAuditLogWhereInput = {};

    if (tenantId) {
      where.tenantId = tenantId;
    }
    if (userId) {
      where.userId = userId;
    }
    if (action) {
      where.action = { contains: action };
    }
    if (module) {
      where.module = module;
    }
    if (startTime || endTime) {
      where.createTime = {};
      if (startTime) {
        where.createTime.gte = startTime;
      }
      if (endTime) {
        where.createTime.lte = endTime;
      }
    }

    const [rows, total] = await Promise.all([
      this.prisma.sysAuditLog.findMany({
        where,
        orderBy: { createTime: 'desc' },
        skip: (pageNum - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.sysAuditLog.count({ where }),
    ]);

    return { rows, total };
  }

  /**
   * 获取队列长度（用于测试）
   */
  getQueueLength(): number {
    return this.writeQueue.length;
  }
}
