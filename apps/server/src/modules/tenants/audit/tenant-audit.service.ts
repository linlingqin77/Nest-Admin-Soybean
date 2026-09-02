import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'src/platform/prisma';
import { Result, ResponseCode } from 'src/shared/response';
import { BusinessException } from 'src/shared/exceptions';
import { IgnoreTenant } from 'src/core/tenancy/decorators/tenant.decorator';
import { toDtoList } from 'src/shared/utils/index';
import {
  ListTenantAuditLogDto,
  CreateTenantAuditLogDto,
  ExportTenantAuditLogDto,
  TenantAuditLogResponseDto,
  TenantAuditLogStatsResponseDto,
  TenantAuditLogVo,
  TenantAuditLogDetailVo,
  TenantAuditLogListVo,
  TenantAuditLogStatsVo,
} from './dto/index';

/**
 * 租户审计日志服务
 *
 * 提供租户审计日志管理功能，包括：
 * - 日志查询、筛选
 * - 日志详情查看
 * - 日志导出
 * - 日志自动记录
 *
 * Requirements: 6.1, 6.2, 6.3, 6.4, 6.5
 */
@Injectable()
export class TenantAuditService {
  private readonly logger = new Logger(TenantAuditService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * 构建时间范围查询条件
   * Requirements: 6.2 - 支持按时间范围筛选
   */
  buildTimeRangeCondition(beginTime?: string, endTime?: string): { gte?: Date; lte?: Date } | undefined {
    if (!beginTime && !endTime) {
      return undefined;
    }

    const condition: { gte?: Date; lte?: Date } = {};
    if (beginTime) {
      condition.gte = new Date(beginTime);
    }
    if (endTime) {
      // 设置为当天结束时间
      const end = new Date(endTime);
      end.setHours(23, 59, 59, 999);
      condition.lte = end;
    }

    return condition;
  }

  /**
   * 分页查询租户审计日志列表
   * Requirements: 6.1, 6.2
   */
  @IgnoreTenant()
  async findAll(query: ListTenantAuditLogDto): Promise<Result<{ rows: TenantAuditLogResponseDto[]; total: number }>> {
    this.logger.debug('查询租户审计日志列表', query);

    // 构建查询条件
    const where: any = {};

    if (query.tenantId) {
      where.tenantId = { contains: query.tenantId };
    }

    if (query.operatorName) {
      where.operatorName = { contains: query.operatorName };
    }

    if (query.actionType) {
      where.actionType = query.actionType;
    }

    if (query.modules) {
      where.module = { contains: query.modules };
    }

    // 时间范围筛选
    const timeCondition = this.buildTimeRangeCondition(query.beginTime, query.endTime);
    if (timeCondition) {
      where.operateTime = timeCondition;
    }

    // 并行查询日志列表和总数
    const [logs, total] = await Promise.all([
      this.prisma.sysTenantAuditLog.findMany({
        where,
        skip: query.skip,
        take: query.take,
        orderBy: { operateTime: 'desc' },
        select: {
          id: true,
          tenantId: true,
          operatorId: true,
          operatorName: true,
          actionType: true,
          actionDesc: true,
          module: true,
          ipAddress: true,
          userAgent: true,
          requestUrl: true,
          requestMethod: true,
          operateTime: true,
        },
      }),
      this.prisma.sysTenantAuditLog.count({ where }),
    ]);

    // 获取租户名称
    const tenantIds: string[] = [...new Set(logs.map((log) => log.tenantId))];
    const tenants =
      tenantIds.length > 0
        ? await this.prisma.sysTenant.findMany({
            where: { tenantId: { in: tenantIds } },
            select: { tenantId: true, companyName: true },
          })
        : [];
    const tenantMap = new Map(tenants.map((t) => [t.tenantId, t.companyName]));

    // 构建VO列表
    const rows: TenantAuditLogVo[] = logs.map((log: any) => ({
      id: Number(log.id),
      tenantId: log.tenantId,
      companyName: tenantMap.get(log.tenantId) ?? '',
      operatorId: log.operatorId,
      operatorName: log.operatorName,
      actionType: log.actionType,
      actionDesc: log.actionDesc,
      modules: log.module,
      ipAddress: log.ipAddress,
      userAgent: log.userAgent ?? undefined,
      requestUrl: log.requestUrl ?? undefined,
      requestMethod: log.requestMethod ?? undefined,
      operateTime: log.operateTime,
    }));

    return Result.ok({
      rows: toDtoList(TenantAuditLogResponseDto, rows),
      total,
    });
  }

  /**
   * 获取审计日志详情
   * Requirements: 6.3
   */
  @IgnoreTenant()
  async findOne(id: number): Promise<Result<TenantAuditLogDetailVo>> {
    this.logger.debug(`获取审计日志详情: ${id}`);

    const log = await this.prisma.sysTenantAuditLog.findUnique({
      where: { id: Number(id) },
    });

    if (!log) {
      throw new BusinessException(ResponseCode.NOT_FOUND, '审计日志不存在');
    }

    // 获取租户名称
    const tenant = await this.prisma.sysTenant.findUnique({
      where: { tenantId: log.tenantId },
      select: { companyName: true },
    });

    const detail: TenantAuditLogDetailVo = {
      id: Number(log.id),
      tenantId: log.tenantId,
      companyName: tenant?.companyName ?? '',
      operatorId: log.operatorId,
      operatorName: log.operatorName,
      actionType: log.actionType,
      actionDesc: log.actionDesc,
      modules: log.module,
      ipAddress: log.ipAddress,
      userAgent: log.userAgent ?? undefined,
      requestUrl: log.requestUrl ?? undefined,
      requestMethod: log.requestMethod ?? undefined,
      operateTime: log.operateTime,
      requestParams: log.requestParams ?? undefined,
      beforeData: log.beforeData ?? undefined,
      afterData: log.afterData ?? undefined,
      responseData: log.responseData ?? undefined,
    };

    return Result.ok(detail);
  }

  /**
   * 创建审计日志
   * Requirements: 6.4
   */
  @IgnoreTenant()
  async create(dto: CreateTenantAuditLogDto): Promise<Result<{ id: number }>> {
    this.logger.debug('创建审计日志', dto);

    const log = await this.prisma.sysTenantAuditLog.create({
      data: {
        tenantId: dto.tenantId,
        operatorId: dto.operatorId,
        operatorName: dto.operatorName,
        actionType: dto.actionType,
        actionDesc: dto.actionDesc,
        module: dto.modules,
        ipAddress: dto.ipAddress,
        userAgent: dto.userAgent,
        requestUrl: dto.requestUrl,
        requestMethod: dto.requestMethod,
        requestParams: dto.requestParams,
        beforeData: dto.beforeData,
        afterData: dto.afterData,
        responseData: dto.responseData,
      },
    });

    return Result.ok({ id: Number(log.id) });
  }

  /**
   * 获取审计日志统计
   */
  @IgnoreTenant()
  async getStats(tenantId?: string): Promise<Result<TenantAuditLogStatsVo>> {
    this.logger.debug('获取审计日志统计', { tenantId });

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay());
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const baseWhere: any = {};
    if (tenantId) {
      baseWhere.tenantId = tenantId;
    }

    // 并行查询统计数据
    const [todayCount, weekCount, monthCount, byActionType, byModule] = await Promise.all([
      // 今日操作数
      this.prisma.sysTenantAuditLog.count({
        where: { ...baseWhere, operateTime: { gte: today } },
      }),
      // 本周操作数
      this.prisma.sysTenantAuditLog.count({
        where: { ...baseWhere, operateTime: { gte: weekStart } },
      }),
      // 本月操作数
      this.prisma.sysTenantAuditLog.count({
        where: { ...baseWhere, operateTime: { gte: monthStart } },
      }),
      // 按操作类型统计
      this.prisma.sysTenantAuditLog.groupBy({
        by: ['actionType'],
        where: { ...baseWhere, operateTime: { gte: monthStart } },
        _count: { actionType: true },
      }),
      // 按模块统计
      this.prisma.sysTenantAuditLog.groupBy({
        by: ['module'],
        where: { ...baseWhere, operateTime: { gte: monthStart } },
        _count: { module: true },
      }),
    ]);

    const stats: TenantAuditLogStatsVo = {
      todayCount,
      weekCount,
      monthCount,
      byActionType: byActionType.map((item: any) => ({
        actionType: item.actionType,
        count: item._count.actionType,
      })),
      byModule: byModule.map((item: any) => ({
        module: item.module,
        count: item._count.module,
      })),
    };

    return Result.ok(stats);
  }

  /**
   * 导出审计日志数据
   * Requirements: 6.5
   */
  @IgnoreTenant()
  async export(query: ExportTenantAuditLogDto): Promise<TenantAuditLogVo[]> {
    this.logger.debug('导出审计日志', query);

    // 构建查询条件
    const where: any = {};

    if (query.tenantId) {
      where.tenantId = { contains: query.tenantId };
    }

    if (query.operatorName) {
      where.operatorName = { contains: query.operatorName };
    }

    if (query.actionType) {
      where.actionType = query.actionType;
    }

    if (query.modules) {
      where.module = { contains: query.modules };
    }

    // 时间范围筛选
    const timeCondition = this.buildTimeRangeCondition(query.beginTime, query.endTime);
    if (timeCondition) {
      where.operateTime = timeCondition;
    }

    // 查询日志（限制最大导出数量为10000条）
    const logs = await this.prisma.sysTenantAuditLog.findMany({
      where,
      take: 10000,
      orderBy: { operateTime: 'desc' },
      select: {
        id: true,
        tenantId: true,
        operatorId: true,
        operatorName: true,
        actionType: true,
        actionDesc: true,
        module: true,
        ipAddress: true,
        userAgent: true,
        requestUrl: true,
        requestMethod: true,
        operateTime: true,
      },
    });

    // 获取租户名称
    const tenantIds: string[] = [...new Set(logs.map((log) => log.tenantId))];
    const tenants =
      tenantIds.length > 0
        ? await this.prisma.sysTenant.findMany({
            where: { tenantId: { in: tenantIds } },
            select: { tenantId: true, companyName: true },
          })
        : [];
    const tenantMap = new Map(tenants.map((t) => [t.tenantId, t.companyName]));

    // 构建导出数据
    return logs.map((log: any) => ({
      id: Number(log.id),
      tenantId: log.tenantId,
      companyName: tenantMap.get(log.tenantId) ?? '',
      operatorId: log.operatorId,
      operatorName: log.operatorName,
      actionType: log.actionType,
      actionDesc: log.actionDesc,
      modules: log.module,
      ipAddress: log.ipAddress,
      userAgent: log.userAgent ?? undefined,
      requestUrl: log.requestUrl ?? undefined,
      requestMethod: log.requestMethod ?? undefined,
      operateTime: log.operateTime,
    }));
  }

  /**
   * 批量创建审计日志
   * 用于内部批量记录操作
   */
  @IgnoreTenant()
  async createMany(dtos: CreateTenantAuditLogDto[]): Promise<Result<{ count: number }>> {
    this.logger.debug(`批量创建审计日志: ${dtos.length}条`);

    const result = await this.prisma.sysTenantAuditLog.createMany({
      data: dtos.map((dto) => ({
        tenantId: dto.tenantId,
        operatorId: dto.operatorId,
        operatorName: dto.operatorName,
        actionType: dto.actionType,
        actionDesc: dto.actionDesc,
        module: dto.modules,
        ipAddress: dto.ipAddress,
        userAgent: dto.userAgent,
        requestUrl: dto.requestUrl,
        requestMethod: dto.requestMethod,
        requestParams: dto.requestParams,
        beforeData: dto.beforeData,
        afterData: dto.afterData,
        responseData: dto.responseData,
      })),
    });

    return Result.ok({ count: result.count });
  }

  /**
   * 清理历史审计日志
   * 用于定时任务，清理超过指定天数的日志
   */
  @IgnoreTenant()
  async cleanupOldLogs(retentionDays: number = 90): Promise<Result<{ count: number }>> {
    this.logger.log(`清理${retentionDays}天前的审计日志`);

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    const result = await this.prisma.sysTenantAuditLog.deleteMany({
      where: {
        operateTime: { lt: cutoffDate },
      },
    });

    this.logger.log(`已清理 ${result.count} 条历史审计日志`);

    return Result.ok({ count: result.count });
  }
}
