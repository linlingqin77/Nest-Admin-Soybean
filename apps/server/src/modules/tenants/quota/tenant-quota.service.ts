import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'src/platform/prisma';
import { Result, ResponseCode } from 'src/shared/response';
import { BusinessException } from 'src/shared/exceptions';
import { DelFlagEnum, StatusEnum } from 'src/shared/enums/index';
import { IgnoreTenant } from 'src/core/tenancy/decorators/tenant.decorator';
import { TenantContext } from 'src/core/tenancy/context/tenant.context';
import { toDtoList } from 'src/shared/utils/index';
import {
  ListTenantQuotaDto,
  UpdateTenantQuotaDto,
  CheckQuotaDto,
  IncrementQuotaUsageDto,
  TenantQuotaResponseDto,
  TenantQuotaVo,
  TenantQuotaDetailVo,
  QuotaChangeRecordVo,
  QuotaCheckResultVo,
  QuotaStatus,
} from './dto/index';

/**
 * 租户配额服务
 *
 * 提供租户配额管理功能，包括：
 * - 配额查询、更新
 * - 配额检查（是否超限）
 * - 配额使用量增减
 * - 配额变更记录
 *
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6
 */
@Injectable()
export class TenantQuotaService {
  private readonly logger = new Logger(TenantQuotaService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * 计算配额使用率
   * @param used 已使用量
   * @param quota 配额限制，-1表示无限制
   * @returns 使用率百分比，无限制时返回0
   */
  calculateUsageRate(used: number, quota: number): number {
    if (quota === -1) return 0; // 无限制
    if (quota === 0) return used > 0 ? 100 : 0;
    return Math.round((used / quota) * 10000) / 100;
  }

  /**
   * 根据使用率计算配额状态
   * Requirements: 5.5, 5.6
   * @param usageRates 各项配额使用率数组
   * @returns 配额状态
   */
  calculateQuotaStatus(usageRates: number[]): QuotaStatus {
    const maxRate = Math.max(...usageRates);
    if (maxRate >= 100) return QuotaStatus.DANGER;
    if (maxRate >= 80) return QuotaStatus.WARNING;
    return QuotaStatus.NORMAL;
  }

  /**
   * 分页查询租户配额列表
   * Requirements: 5.1
   */
  @IgnoreTenant()
  async findAll(query: ListTenantQuotaDto) {
    this.logger.debug('查询租户配额列表', query);

    // 构建租户查询条件
    const tenantWhere: any = {
      delFlag: '0',
      tenantId: { not: TenantContext.SUPER_TENANT_ID },
    };

    if (query.tenantId) {
      tenantWhere.tenantId = { contains: query.tenantId };
    }

    if (query.companyName) {
      tenantWhere.companyName = { contains: query.companyName };
    }

    // 获取租户列表
    const [tenants, total] = await Promise.all([
      this.prisma.sysTenant.findMany({
        where: tenantWhere,
        skip: query.skip,
        take: query.take,
        orderBy: { createTime: 'desc' },
        select: {
          tenantId: true,
          companyName: true,
          accountCount: true,
          storageQuota: true,
          storageUsed: true,
          apiQuota: true,
          createTime: true,
          updateTime: true,
        },
      }),
      this.prisma.sysTenant.count({ where: tenantWhere }),
    ]);

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

    // 构建配额VO列表
    const rows: TenantQuotaVo[] = tenants.map((tenant, index) => {
      const userUsed = userCountMap.get(tenant.tenantId) ?? 0;
      const apiUsed = apiUsageMap.get(tenant.tenantId) ?? 0;

      const userUsageRate = this.calculateUsageRate(userUsed, tenant.accountCount);
      const storageUsageRate = this.calculateUsageRate(tenant.storageUsed, tenant.storageQuota);
      const apiUsageRate = this.calculateUsageRate(apiUsed, tenant.apiQuota);

      const status = this.calculateQuotaStatus([userUsageRate, storageUsageRate, apiUsageRate]);

      return {
        id: index + 1, // 虚拟ID
        tenantId: tenant.tenantId,
        companyName: tenant.companyName,
        userQuota: tenant.accountCount,
        userUsed,
        userUsageRate,
        storageQuota: tenant.storageQuota,
        storageUsed: tenant.storageUsed,
        storageUsageRate,
        apiQuota: tenant.apiQuota,
        apiUsed,
        apiUsageRate,
        status,
        createTime: tenant.createTime!,
        updateTime: tenant.updateTime!,
      };
    });

    // 按状态筛选
    let filteredRows = rows;
    if (query.status) {
      filteredRows = rows.filter((r) => r.status === query.status);
    }

    return Result.ok({
      rows: toDtoList(TenantQuotaResponseDto, filteredRows),
      total: query.status ? filteredRows.length : total,
    });
  }

  /**
   * 获取单个租户配额详情
   * Requirements: 5.2
   */
  @IgnoreTenant()
  async findOne(tenantId: string): Promise<Result<TenantQuotaDetailVo>> {
    this.logger.debug(`获取租户配额详情: ${tenantId}`);

    const tenant = await this.prisma.sysTenant.findUnique({
      where: { tenantId },
      select: {
        tenantId: true,
        companyName: true,
        accountCount: true,
        storageQuota: true,
        storageUsed: true,
        apiQuota: true,
        createTime: true,
        updateTime: true,
      },
    });

    if (!tenant) {
      throw new BusinessException(ResponseCode.NOT_FOUND, '租户不存在');
    }

    // 获取用户数
    const userCount = await this.prisma.sysUser.count({
      where: {
        tenantId,
        delFlag: '0',
      },
    });

    // 获取今日API调用量
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const apiUsage = await this.prisma.sysTenantUsage.findFirst({
      where: { tenantId, date: today },
      select: { apiCalls: true },
    });
    const apiUsed = apiUsage?.apiCalls ?? 0;

    // 获取配额变更历史
    const quotaLogs = await this.prisma.sysTenantQuotaLog.findMany({
      where: { tenantId },
      orderBy: { changeTime: 'desc' },
      take: 20,
    });

    const userUsageRate = this.calculateUsageRate(userCount, tenant.accountCount);
    const storageUsageRate = this.calculateUsageRate(tenant.storageUsed, tenant.storageQuota);
    const apiUsageRate = this.calculateUsageRate(apiUsed, tenant.apiQuota);
    const status = this.calculateQuotaStatus([userUsageRate, storageUsageRate, apiUsageRate]);

    const quotaHistory: QuotaChangeRecordVo[] = quotaLogs.map((log) => ({
      id: log.id,
      quotaType: log.quotaType,
      oldValue: Number(log.oldValue),
      newValue: Number(log.newValue),
      changeBy: log.changeBy,
      changeTime: log.changeTime,
    }));

    const detail: TenantQuotaDetailVo = {
      id: 1,
      tenantId: tenant.tenantId,
      companyName: tenant.companyName,
      userQuota: tenant.accountCount,
      userUsed: userCount,
      userUsageRate,
      storageQuota: tenant.storageQuota,
      storageUsed: tenant.storageUsed,
      storageUsageRate,
      apiQuota: tenant.apiQuota,
      apiUsed,
      apiUsageRate,
      status,
      createTime: tenant.createTime!,
      updateTime: tenant.updateTime!,
      quotaHistory,
    };

    return Result.ok(detail);
  }

  /**
   * 更新租户配额
   * Requirements: 5.3, 5.5
   */
  @IgnoreTenant()
  async update(dto: UpdateTenantQuotaDto, operatorName: string = 'system'): Promise<Result<void>> {
    this.logger.debug(`更新租户配额: ${dto.tenantId}`, dto);

    const tenant = await this.prisma.sysTenant.findUnique({
      where: { tenantId: dto.tenantId },
      select: {
        tenantId: true,
        accountCount: true,
        storageQuota: true,
        apiQuota: true,
      },
    });

    if (!tenant) {
      throw new BusinessException(ResponseCode.NOT_FOUND, '租户不存在');
    }

    const updateData: any = {};
    const quotaLogs: any[] = [];

    // 记录用户配额变更
    if (dto.userQuota !== undefined && dto.userQuota !== tenant.accountCount) {
      updateData.accountCount = dto.userQuota;
      quotaLogs.push({
        tenantId: dto.tenantId,
        quotaType: 'user',
        oldValue: tenant.accountCount,
        newValue: dto.userQuota,
        changeBy: operatorName,
      });
    }

    // 记录存储配额变更
    if (dto.storageQuota !== undefined && dto.storageQuota !== tenant.storageQuota) {
      updateData.storageQuota = dto.storageQuota;
      quotaLogs.push({
        tenantId: dto.tenantId,
        quotaType: 'storage',
        oldValue: tenant.storageQuota,
        newValue: dto.storageQuota,
        changeBy: operatorName,
      });
    }

    // 记录API配额变更
    if (dto.apiQuota !== undefined && dto.apiQuota !== tenant.apiQuota) {
      updateData.apiQuota = dto.apiQuota;
      quotaLogs.push({
        tenantId: dto.tenantId,
        quotaType: 'api',
        oldValue: tenant.apiQuota,
        newValue: dto.apiQuota,
        changeBy: operatorName,
      });
    }

    if (Object.keys(updateData).length === 0) {
      return Result.ok();
    }

    // 使用事务更新配额和记录日志
    await this.prisma.$transaction([
      this.prisma.sysTenant.update({
        where: { tenantId: dto.tenantId },
        data: updateData,
      }),
      ...quotaLogs.map((log) => this.prisma.sysTenantQuotaLog.create({ data: log })),
    ]);

    return Result.ok();
  }

  /**
   * 检查配额是否允许操作
   * Requirements: 5.4, 5.6, 5.8
   */
  @IgnoreTenant()
  async checkQuota(dto: CheckQuotaDto): Promise<Result<QuotaCheckResultVo>> {
    this.logger.debug(`检查配额: ${dto.tenantId}, ${dto.quotaType}`);

    const tenant = await this.prisma.sysTenant.findUnique({
      where: { tenantId: dto.tenantId },
      select: {
        tenantId: true,
        accountCount: true,
        storageQuota: true,
        storageUsed: true,
        apiQuota: true,
      },
    });

    if (!tenant) {
      throw new BusinessException(ResponseCode.NOT_FOUND, '租户不存在');
    }

    const increment = dto.increment ?? 1;
    let used: number;
    let limit: number;
    let quotaName: string;

    switch (dto.quotaType) {
      case 'user':
        used = await this.prisma.sysUser.count({
          where: { tenantId: dto.tenantId, delFlag: '0' },
        });
        limit = tenant.accountCount;
        quotaName = '用户数量';
        break;

      case 'storage':
        used = tenant.storageUsed;
        limit = tenant.storageQuota;
        quotaName = '存储空间';
        break;

      case 'api':
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const apiUsage = await this.prisma.sysTenantUsage.findFirst({
          where: { tenantId: dto.tenantId, date: today },
          select: { apiCalls: true },
        });
        used = apiUsage?.apiCalls ?? 0;
        limit = tenant.apiQuota;
        quotaName = 'API调用次数';
        break;

      default:
        throw new BusinessException(ResponseCode.BAD_REQUEST, '无效的配额类型');
    }

    const usageRate = this.calculateUsageRate(used, limit);

    // -1 表示无限制
    const allowed = limit === -1 || used + increment <= limit;

    const result: QuotaCheckResultVo = {
      allowed,
      quotaType: dto.quotaType,
      used,
      limit,
      usageRate,
      message: allowed
        ? `${quotaName}配额充足`
        : `${quotaName}配额已用尽，当前使用 ${used}/${limit === -1 ? '无限制' : limit}`,
    };

    return Result.ok(result);
  }

  /**
   * 增加配额使用量
   * 用于内部调用，如创建用户时增加用户使用量
   */
  @IgnoreTenant()
  async incrementUsage(dto: IncrementQuotaUsageDto): Promise<Result<void>> {
    this.logger.debug(`增加配额使用量: ${dto.tenantId}, ${dto.quotaType}, ${dto.increment}`);

    switch (dto.quotaType) {
      case 'storage':
        await this.prisma.sysTenant.update({
          where: { tenantId: dto.tenantId },
          data: { storageUsed: { increment: dto.increment } },
        });
        break;

      case 'api':
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        await this.prisma.sysTenantUsage.upsert({
          where: { tenantId_date: { tenantId: dto.tenantId, date: today } },
          create: {
            tenantId: dto.tenantId,
            date: today,
            apiCalls: dto.increment,
          },
          update: {
            apiCalls: { increment: dto.increment },
          },
        });
        break;

      case 'user':
        // 用户数量由实际用户记录决定，不需要手动增加
        break;

      default:
        throw new BusinessException(ResponseCode.BAD_REQUEST, '无效的配额类型');
    }

    return Result.ok();
  }

  /**
   * 减少配额使用量
   * 用于内部调用，如删除文件时减少存储使用量
   */
  @IgnoreTenant()
  async decrementUsage(dto: IncrementQuotaUsageDto): Promise<Result<void>> {
    this.logger.debug(`减少配额使用量: ${dto.tenantId}, ${dto.quotaType}, ${dto.increment}`);

    switch (dto.quotaType) {
      case 'storage':
        await this.prisma.sysTenant.update({
          where: { tenantId: dto.tenantId },
          data: { storageUsed: { decrement: dto.increment } },
        });
        break;

      case 'api':
        // API调用次数不支持减少
        break;

      case 'user':
        // 用户数量由实际用户记录决定，不需要手动减少
        break;

      default:
        throw new BusinessException(ResponseCode.BAD_REQUEST, '无效的配额类型');
    }

    return Result.ok();
  }

  /**
   * 重置月度API配额使用量
   * 用于定时任务，每月1日重置
   */
  @IgnoreTenant()
  async resetMonthlyApiUsage(): Promise<Result<{ count: number }>> {
    this.logger.log('重置月度API配额使用量');

    // 获取上个月的日期范围
    const now = new Date();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // 删除上个月之前的使用记录（保留最近2个月）
    const result = await this.prisma.sysTenantUsage.deleteMany({
      where: {
        date: { lt: lastMonth },
      },
    });

    this.logger.log(`已清理 ${result.count} 条历史使用记录`);

    return Result.ok({ count: result.count });
  }
}
