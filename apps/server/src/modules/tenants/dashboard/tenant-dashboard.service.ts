import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'src/platform/prisma';
import { RedisService } from 'src/platform/redis/redis.service';
import { Result } from 'src/shared/response';
import { DelFlagEnum, StatusEnum } from 'src/shared/enums/index';
import { IgnoreTenant } from 'src/core/tenancy/decorators/tenant.decorator';
import { TenantContext } from 'src/core/tenancy/context/tenant.context';
import {
  DashboardDataResponseDto,
  TenantStatsVo,
  TenantTrendDataVo,
  PackageDistributionVo,
  ExpiringTenantVo,
  QuotaTopTenantVo,
  DashboardDataVo,
} from './dto/index';

/**
 * 租户仪表盘服务
 *
 * 提供租户统计数据、趋势图表、套餐分布等仪表盘功能
 * Requirements: 4.1, 4.2, 4.3, 4.4, 4.5
 */
@Injectable()
export class TenantDashboardService {
  private readonly logger = new Logger(TenantDashboardService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly redisService: RedisService,
  ) {}

  /**
   * 获取租户统计数据
   * Requirements: 4.1, 4.2
   */
  @IgnoreTenant()
  async getStats(): Promise<Result<TenantStatsVo>> {
    this.logger.debug('获取租户仪表盘统计数据');

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

    // 并行查询所有统计数据
    const [totalTenants, activeTenants, newTenants, totalUsers, todayLoginUsers, storageStats, apiCallsStats] =
      await Promise.all([
        // 租户总数（排除超级管理员租户）
        this.prisma.sysTenant.count({
          where: {
            delFlag: '0',
            tenantId: { not: TenantContext.SUPER_TENANT_ID },
          },
        }),
        // 活跃租户数（状态正常）
        this.prisma.sysTenant.count({
          where: {
            delFlag: '0',
            status: StatusEnum.NORMAL,
            tenantId: { not: TenantContext.SUPER_TENANT_ID },
          },
        }),
        // 本月新增租户数
        this.prisma.sysTenant.count({
          where: {
            delFlag: '0',
            tenantId: { not: TenantContext.SUPER_TENANT_ID },
            createTime: { gte: monthStart },
          },
        }),
        // 用户总数
        this.prisma.sysUser.count({
          where: { delFlag: '0' },
        }),
        // 今日登录用户数（从登录日志统计）
        this.prisma.sysLogininfor.count({
          where: {
            loginTime: { gte: today },
            status: '0', // 登录成功
          },
        }),
        // 存储使用总量
        this.prisma.sysTenant.aggregate({
          where: {
            delFlag: '0',
            tenantId: { not: TenantContext.SUPER_TENANT_ID },
          },
          _sum: { storageUsed: true },
        }),
        // 今日API调用总量
        this.prisma.sysTenantUsage.aggregate({
          where: { date: today },
          _sum: { apiCalls: true },
        }),
      ]);

    // 获取在线用户数（从Redis）
    const onlineUsers = await this.getOnlineUserCount();

    const stats: TenantStatsVo = {
      totalTenants,
      activeTenants,
      newTenants,
      totalUsers,
      onlineUsers,
      todayLoginUsers,
      totalStorageUsed: storageStats._sum.storageUsed ?? 0,
      totalApiCalls: apiCallsStats._sum.apiCalls ?? 0,
    };

    return Result.ok(stats);
  }

  /**
   * 获取在线用户数
   */
  private async getOnlineUserCount(): Promise<number> {
    try {
      const keys = await this.redisService.keys('online_user:*');
      return keys.length;
    } catch {
      return 0;
    }
  }

  /**
   * 获取租户增长趋势
   * Requirements: 4.3
   */
  @IgnoreTenant()
  async getTrend(beginTime?: string, endTime?: string): Promise<Result<TenantTrendDataVo[]>> {
    const end = endTime ? new Date(endTime) : new Date();
    const begin = beginTime ? new Date(beginTime) : new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);

    // 获取时间范围内每天的新增租户数
    const tenants = await this.prisma.sysTenant.findMany({
      where: {
        delFlag: '0',
        tenantId: { not: TenantContext.SUPER_TENANT_ID },
        createTime: { gte: begin, lte: end },
      },
      select: { createTime: true },
      orderBy: { createTime: 'asc' },
    });

    // 获取开始日期之前的租户总数
    const previousTotal = await this.prisma.sysTenant.count({
      where: {
        delFlag: '0',
        tenantId: { not: TenantContext.SUPER_TENANT_ID },
        createTime: { lt: begin },
      },
    });

    // 按日期分组统计
    const dailyMap = new Map<string, number>();
    for (const tenant of tenants) {
      if (tenant.createTime) {
        const dateStr = tenant.createTime.toISOString().split('T')[0];
        dailyMap.set(dateStr, (dailyMap.get(dateStr) ?? 0) + 1);
      }
    }

    // 生成趋势数据
    const trend: TenantTrendDataVo[] = [];
    let cumulativeTotal = previousTotal;
    const current = new Date(begin);

    while (current <= end) {
      const dateStr = current.toISOString().split('T')[0];
      const newCount = dailyMap.get(dateStr) ?? 0;
      cumulativeTotal += newCount;

      trend.push({
        date: dateStr,
        newTenants: newCount,
        totalTenants: cumulativeTotal,
      });

      current.setDate(current.getDate() + 1);
    }

    return Result.ok(trend);
  }

  /**
   * 获取套餐分布
   * Requirements: 4.4
   */
  @IgnoreTenant()
  async getPackageDistribution(): Promise<Result<PackageDistributionVo[]>> {
    // 获取所有套餐
    const packages = await this.prisma.sysTenantPackage.findMany({
      where: { delFlag: '0' },
      select: { packageId: true, packageName: true },
    });

    // 统计每个套餐的租户数
    const distribution = await this.prisma.sysTenant.groupBy({
      by: ['packageId'],
      where: {
        delFlag: '0',
        tenantId: { not: TenantContext.SUPER_TENANT_ID },
      },
      _count: { packageId: true },
    });

    const total = distribution.reduce((sum, item) => sum + item._count.packageId, 0);
    const packageMap = new Map(packages.map((p) => [p.packageId, p.packageName]));

    const result: PackageDistributionVo[] = distribution.map((item) => ({
      packageId: item.packageId ?? 0,
      packageName: packageMap.get(item.packageId ?? 0) ?? '未知套餐',
      count: item._count.packageId,
      percentage: total > 0 ? Math.round((item._count.packageId / total) * 10000) / 100 : 0,
    }));

    return Result.ok(result);
  }

  /**
   * 获取即将到期租户列表
   * Requirements: 4.5
   */
  @IgnoreTenant()
  async getExpiringTenants(days: number = 30): Promise<Result<ExpiringTenantVo[]>> {
    const now = new Date();
    const futureDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

    const tenants = await this.prisma.sysTenant.findMany({
      where: {
        delFlag: '0',
        status: StatusEnum.NORMAL,
        tenantId: { not: TenantContext.SUPER_TENANT_ID },
        expireTime: { gte: now, lte: futureDate },
      },
      select: {
        tenantId: true,
        companyName: true,
        contactUserName: true,
        contactPhone: true,
        expireTime: true,
        packageId: true,
      },
      orderBy: { expireTime: 'asc' },
      take: 20,
    });

    // 获取套餐名称
    const packageIds = tenants.map((t) => t.packageId).filter((id): id is number => id !== null);
    const packages =
      packageIds.length > 0
        ? await this.prisma.sysTenantPackage.findMany({
            where: { packageId: { in: packageIds } },
            select: { packageId: true, packageName: true },
          })
        : [];
    const packageMap = new Map(packages.map((p) => [p.packageId, p.packageName]));

    const result: ExpiringTenantVo[] = tenants.map((tenant) => {
      const expireTime = tenant.expireTime as Date;
      const daysRemaining = Math.ceil((expireTime.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));
      return {
        tenantId: tenant.tenantId,
        companyName: tenant.companyName,
        contactUserName: tenant.contactUserName ?? '',
        contactPhone: tenant.contactPhone ?? '',
        expireTime,
        daysRemaining,
        packageName: packageMap.get(tenant.packageId ?? 0) ?? '',
      };
    });

    return Result.ok(result);
  }

  /**
   * 获取配额使用TOP10租户
   * Requirements: 4.5
   */
  @IgnoreTenant()
  async getQuotaTopTenants(): Promise<Result<QuotaTopTenantVo[]>> {
    // 获取所有租户及其配额信息
    const tenants = await this.prisma.sysTenant.findMany({
      where: {
        delFlag: '0',
        status: StatusEnum.NORMAL,
        tenantId: { not: TenantContext.SUPER_TENANT_ID },
      },
      select: {
        tenantId: true,
        companyName: true,
        accountCount: true,
        storageQuota: true,
        storageUsed: true,
        apiQuota: true,
      },
    });

    // 获取每个租户的用户数
    const tenantIds = tenants.map((t) => t.tenantId);
    const userCounts = await this.prisma.sysUser.groupBy({
      by: ['tenantId'],
      where: {
        delFlag: '0',
        tenantId: { in: tenantIds },
      },
      _count: { userId: true },
    });
    const userCountMap = new Map(userCounts.map((u) => [u.tenantId, u._count.userId]));

    // 获取今日API调用量
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const apiUsage = await this.prisma.sysTenantUsage.findMany({
      where: {
        date: today,
        tenantId: { in: tenantIds },
      },
      select: { tenantId: true, apiCalls: true },
    });
    const apiUsageMap = new Map(apiUsage.map((a) => [a.tenantId, a.apiCalls]));

    // 计算使用率
    const result: QuotaTopTenantVo[] = tenants.map((tenant) => {
      const userCount = userCountMap.get(tenant.tenantId) ?? 0;
      const apiCalls = apiUsageMap.get(tenant.tenantId) ?? 0;

      const userQuotaUsage =
        tenant.accountCount > 0
          ? Math.round((userCount / tenant.accountCount) * 10000) / 100
          : tenant.accountCount === -1
            ? 0
            : 100;

      const storageQuotaUsage =
        tenant.storageQuota > 0
          ? Math.round((tenant.storageUsed / tenant.storageQuota) * 10000) / 100
          : tenant.storageQuota === -1
            ? 0
            : 100;

      const apiQuotaUsage =
        tenant.apiQuota > 0 ? Math.round((apiCalls / tenant.apiQuota) * 10000) / 100 : tenant.apiQuota === -1 ? 0 : 100;

      const overallUsage = Math.round(((userQuotaUsage + storageQuotaUsage + apiQuotaUsage) / 3) * 100) / 100;

      return {
        tenantId: tenant.tenantId,
        companyName: tenant.companyName,
        userQuotaUsage,
        storageQuotaUsage,
        apiQuotaUsage,
        overallUsage,
      };
    });

    // 按综合使用率排序，取TOP10
    result.sort((a, b) => b.overallUsage - a.overallUsage);
    return Result.ok(result.slice(0, 10));
  }

  /**
   * 获取完整仪表盘数据
   */
  @IgnoreTenant()
  async getDashboardData(beginTime?: string, endTime?: string): Promise<Result<DashboardDataVo>> {
    const [stats, trend, packageDistribution, expiringTenants, quotaTopTenants] = await Promise.all([
      this.getStats(),
      this.getTrend(beginTime, endTime),
      this.getPackageDistribution(),
      this.getExpiringTenants(),
      this.getQuotaTopTenants(),
    ]);

    return Result.ok({
      stats: stats.data!,
      trend: trend.data!,
      packageDistribution: packageDistribution.data!,
      expiringTenants: expiringTenants.data!,
      quotaTopTenants: quotaTopTenants.data!,
    });
  }
}
