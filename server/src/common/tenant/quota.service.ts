import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { RedisService } from 'src/module/common/redis/redis.service';
import { BusinessException } from 'src/common/exceptions';
import { ResponseCode } from 'src/common/response';

/**
 * 配额资源类型枚举
 */
export enum QuotaResource {
  /** 用户数量 */
  USERS = 'users',
  /** 存储空间 (MB) */
  STORAGE = 'storage',
  /** API 日调用量 */
  API_CALLS = 'api_calls',
}

/**
 * 配额检查结果接口
 */
export interface QuotaCheckResult {
  /** 是否在配额内 */
  allowed: boolean;
  /** 当前使用量 */
  currentUsage: number;
  /** 配额上限 (-1 表示无限制) */
  quota: number;
  /** 剩余配额 (-1 表示无限制) */
  remaining: number;
}

/**
 * 租户使用统计接口
 */
export interface TenantUsageStats {
  /** 租户ID */
  tenantId: string;
  /** 日期 */
  date: Date;
  /** API 调用次数 */
  apiCalls: number;
  /** 已使用存储 (MB) */
  storageUsed: number;
  /** 用户数量 */
  userCount: number;
}

/**
 * 租户配额缓存键前缀
 */
const TENANT_QUOTA_CACHE_PREFIX = 'tenant:quota:';
const TENANT_USAGE_CACHE_PREFIX = 'tenant:usage:';

/**
 * 缓存过期时间（秒）
 */
const QUOTA_CACHE_TTL = 300; // 5 minutes
const USAGE_CACHE_TTL = 60; // 1 minute for real-time usage

/**
 * 租户配额管理服务 (需求 5.5, 5.6)
 *
 * 实现租户配额检查和使用量统计功能：
 * - 用户数上限检查
 * - 存储空间上限检查
 * - API 日调用量上限检查
 * - 资源使用统计记录
 */
@Injectable()
export class TenantQuotaService {
  private readonly logger = new Logger(TenantQuotaService.name);

  constructor(
    private readonly prismaService: PrismaService,
    private readonly redisService: RedisService,
  ) {}

  /**
   * 获取配额缓存键
   */
  private getQuotaCacheKey(tenantId: string): string {
    return `${TENANT_QUOTA_CACHE_PREFIX}${tenantId}`;
  }

  /**
   * 获取使用量缓存键
   */
  private getUsageCacheKey(tenantId: string, resource: QuotaResource): string {
    const today = new Date().toISOString().split('T')[0];
    return `${TENANT_USAGE_CACHE_PREFIX}${tenantId}:${resource}:${today}`;
  }

  /**
   * 检查租户配额
   *
   * @param tenantId 租户ID
   * @param resource 资源类型
   * @returns 配额检查结果
   */
  async checkQuota(tenantId: string, resource: QuotaResource): Promise<QuotaCheckResult> {
    if (!tenantId) {
      throw new BusinessException(ResponseCode.BAD_REQUEST, '租户ID不能为空');
    }

    const tenant = await this.getTenantWithQuota(tenantId);
    if (!tenant) {
      throw new BusinessException(ResponseCode.NOT_FOUND, '租户不存在');
    }

    const currentUsage = await this.getResourceUsage(tenantId, resource);
    const quota = this.getQuotaLimit(tenant, resource);

    // -1 表示无限制
    const allowed = quota === -1 || currentUsage < quota;
    const remaining = quota === -1 ? -1 : Math.max(0, quota - currentUsage);

    return {
      allowed,
      currentUsage,
      quota,
      remaining,
    };
  }

  /**
   * 获取租户配额信息（带缓存）
   */
  private async getTenantWithQuota(tenantId: string): Promise<{
    accountCount: number;
    storageQuota: number;
    apiQuota: number;
  } | null> {
    const cacheKey = this.getQuotaCacheKey(tenantId);

    try {
      // 尝试从缓存获取
      const cached = await this.redisService.get(cacheKey);
      if (cached) {
        return JSON.parse(cached as string);
      }
    } catch {
      // 缓存读取失败，继续从数据库获取
    }

    // 从数据库获取
    const tenant = await this.prismaService.sysTenant.findUnique({
      where: { tenantId },
      select: {
        accountCount: true,
        storageQuota: true,
        apiQuota: true,
      },
    });

    if (tenant) {
      // 写入缓存
      try {
        await this.redisService.set(cacheKey, JSON.stringify(tenant), QUOTA_CACHE_TTL);
      } catch {
        // 缓存写入失败，不影响主流程
      }
    }

    return tenant;
  }

  /**
   * 获取配额上限
   */
  private getQuotaLimit(
    tenant: { accountCount: number; storageQuota: number; apiQuota: number },
    resource: QuotaResource,
  ): number {
    switch (resource) {
      case QuotaResource.USERS:
        return tenant.accountCount;
      case QuotaResource.STORAGE:
        return tenant.storageQuota;
      case QuotaResource.API_CALLS:
        return tenant.apiQuota;
      default:
        return -1;
    }
  }

  /**
   * 获取资源使用量
   *
   * @param tenantId 租户ID
   * @param resource 资源类型
   * @returns 当前使用量
   */
  async getResourceUsage(tenantId: string, resource: QuotaResource): Promise<number> {
    const cacheKey = this.getUsageCacheKey(tenantId, resource);

    try {
      // 尝试从缓存获取
      const cached = await this.redisService.get(cacheKey);
      if (cached !== null && cached !== undefined) {
        return parseInt(cached as string, 10);
      }
    } catch {
      // 缓存读取失败，继续从数据库获取
    }

    let usage = 0;

    switch (resource) {
      case QuotaResource.USERS:
        usage = await this.getUserCount(tenantId);
        break;
      case QuotaResource.STORAGE:
        usage = await this.getStorageUsage(tenantId);
        break;
      case QuotaResource.API_CALLS:
        usage = await this.getApiCallsToday(tenantId);
        break;
    }

    // 写入缓存
    try {
      await this.redisService.set(cacheKey, String(usage), USAGE_CACHE_TTL);
    } catch {
      // 缓存写入失败，不影响主流程
    }

    return usage;
  }

  /**
   * 获取租户用户数量
   */
  private async getUserCount(tenantId: string): Promise<number> {
    return this.prismaService.sysUser.count({
      where: {
        tenantId,
        delFlag: '0',
      },
    });
  }

  /**
   * 获取租户存储使用量 (MB)
   */
  private async getStorageUsage(tenantId: string): Promise<number> {
    // 从租户表获取已使用存储
    const tenant = await this.prismaService.sysTenant.findUnique({
      where: { tenantId },
      select: { storageUsed: true },
    });
    return tenant?.storageUsed ?? 0;
  }

  /**
   * 获取今日 API 调用次数
   */
  private async getApiCallsToday(tenantId: string): Promise<number> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const usage = await this.prismaService.sysTenantUsage.findUnique({
      where: {
        tenantId_date: {
          tenantId,
          date: today,
        },
      },
      select: { apiCalls: true },
    });

    return usage?.apiCalls ?? 0;
  }

  /**
   * 增加资源使用量
   *
   * @param tenantId 租户ID
   * @param resource 资源类型
   * @param amount 增加量（默认为1）
   */
  async incrementUsage(tenantId: string, resource: QuotaResource, amount: number = 1): Promise<void> {
    if (!tenantId || amount <= 0) {
      return;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    try {
      // 更新数据库中的使用统计
      await this.prismaService.sysTenantUsage.upsert({
        where: {
          tenantId_date: {
            tenantId,
            date: today,
          },
        },
        update: {
          [this.getUsageField(resource)]: {
            increment: amount,
          },
        },
        create: {
          tenantId,
          date: today,
          [this.getUsageField(resource)]: amount,
        },
      });

      // 更新缓存
      const cacheKey = this.getUsageCacheKey(tenantId, resource);
      try {
        const client = this.redisService.getClient();
        await client.incrby(cacheKey, amount);
      } catch {
        // 缓存更新失败，删除缓存让下次重新获取
        await this.redisService.del(cacheKey);
      }

      this.logger.debug(`Incremented ${resource} usage for tenant ${tenantId} by ${amount}`);
    } catch (error) {
      this.logger.error(`Failed to increment ${resource} usage for tenant ${tenantId}: ${error.message}`);
      throw error;
    }
  }

  /**
   * 获取使用量字段名
   */
  private getUsageField(resource: QuotaResource): string {
    switch (resource) {
      case QuotaResource.USERS:
        return 'userCount';
      case QuotaResource.STORAGE:
        return 'storageUsed';
      case QuotaResource.API_CALLS:
        return 'apiCalls';
      default:
        return 'apiCalls';
    }
  }

  /**
   * 获取租户使用统计
   *
   * @param tenantId 租户ID
   * @param startDate 开始日期
   * @param endDate 结束日期
   * @returns 使用统计列表
   */
  async getUsageStats(tenantId: string, startDate: Date, endDate: Date): Promise<TenantUsageStats[]> {
    if (!tenantId) {
      return [];
    }

    const usageRecords = await this.prismaService.sysTenantUsage.findMany({
      where: {
        tenantId,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: { date: 'asc' },
    });

    return usageRecords.map((record) => ({
      tenantId: record.tenantId,
      date: record.date,
      apiCalls: record.apiCalls,
      storageUsed: record.storageUsed,
      userCount: record.userCount,
    }));
  }

  /**
   * 获取今日使用统计
   *
   * @param tenantId 租户ID
   * @returns 今日使用统计
   */
  async getTodayUsage(tenantId: string): Promise<TenantUsageStats | null> {
    if (!tenantId) {
      return null;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const usage = await this.prismaService.sysTenantUsage.findUnique({
      where: {
        tenantId_date: {
          tenantId,
          date: today,
        },
      },
    });

    if (!usage) {
      return {
        tenantId,
        date: today,
        apiCalls: 0,
        storageUsed: 0,
        userCount: await this.getUserCount(tenantId),
      };
    }

    return {
      tenantId: usage.tenantId,
      date: usage.date,
      apiCalls: usage.apiCalls,
      storageUsed: usage.storageUsed,
      userCount: usage.userCount,
    };
  }

  /**
   * 更新存储使用量
   *
   * @param tenantId 租户ID
   * @param storageMB 存储使用量 (MB)
   */
  async updateStorageUsage(tenantId: string, storageMB: number): Promise<void> {
    if (!tenantId) {
      return;
    }

    try {
      // 更新租户表中的存储使用量
      await this.prismaService.sysTenant.update({
        where: { tenantId },
        data: { storageUsed: storageMB },
      });

      // 更新今日统计
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      await this.prismaService.sysTenantUsage.upsert({
        where: {
          tenantId_date: {
            tenantId,
            date: today,
          },
        },
        update: {
          storageUsed: storageMB,
        },
        create: {
          tenantId,
          date: today,
          storageUsed: storageMB,
        },
      });

      // 清除缓存
      const cacheKey = this.getUsageCacheKey(tenantId, QuotaResource.STORAGE);
      await this.redisService.del(cacheKey);

      this.logger.debug(`Updated storage usage for tenant ${tenantId} to ${storageMB} MB`);
    } catch (error) {
      this.logger.error(`Failed to update storage usage for tenant ${tenantId}: ${error.message}`);
      throw error;
    }
  }

  /**
   * 同步用户数量到使用统计
   *
   * @param tenantId 租户ID
   */
  async syncUserCount(tenantId: string): Promise<void> {
    if (!tenantId) {
      return;
    }

    try {
      const userCount = await this.getUserCount(tenantId);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      await this.prismaService.sysTenantUsage.upsert({
        where: {
          tenantId_date: {
            tenantId,
            date: today,
          },
        },
        update: {
          userCount,
        },
        create: {
          tenantId,
          date: today,
          userCount,
        },
      });

      // 清除缓存
      const cacheKey = this.getUsageCacheKey(tenantId, QuotaResource.USERS);
      await this.redisService.del(cacheKey);

      this.logger.debug(`Synced user count for tenant ${tenantId}: ${userCount}`);
    } catch (error) {
      this.logger.error(`Failed to sync user count for tenant ${tenantId}: ${error.message}`);
    }
  }

  /**
   * 清除租户配额缓存
   *
   * @param tenantId 租户ID
   */
  async clearQuotaCache(tenantId: string): Promise<void> {
    if (!tenantId) {
      return;
    }

    try {
      const quotaCacheKey = this.getQuotaCacheKey(tenantId);
      await this.redisService.del(quotaCacheKey);

      // 清除所有资源使用量缓存
      for (const resource of Object.values(QuotaResource)) {
        const usageCacheKey = this.getUsageCacheKey(tenantId, resource);
        await this.redisService.del(usageCacheKey);
      }

      this.logger.debug(`Cleared quota cache for tenant ${tenantId}`);
    } catch (error) {
      this.logger.error(`Failed to clear quota cache for tenant ${tenantId}: ${error.message}`);
    }
  }

  /**
   * 检查并抛出配额超限异常
   *
   * @param tenantId 租户ID
   * @param resource 资源类型
   * @throws BusinessException 当配额超限时
   */
  async checkQuotaOrThrow(tenantId: string, resource: QuotaResource): Promise<void> {
    const result = await this.checkQuota(tenantId, resource);

    if (!result.allowed) {
      const resourceName = this.getResourceDisplayName(resource);
      throw new BusinessException(
        ResponseCode.BAD_REQUEST,
        `租户${resourceName}配额已用尽，当前使用: ${result.currentUsage}，配额上限: ${result.quota}`,
      );
    }
  }

  /**
   * 获取资源显示名称
   */
  private getResourceDisplayName(resource: QuotaResource): string {
    switch (resource) {
      case QuotaResource.USERS:
        return '用户数';
      case QuotaResource.STORAGE:
        return '存储空间';
      case QuotaResource.API_CALLS:
        return 'API调用量';
      default:
        return '资源';
    }
  }
}
