import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'src/platform/prisma';
import { Result, ResponseCode } from 'src/shared/response';
import { BusinessException } from 'src/shared/exceptions/business.exception';
import { TenantContext } from 'src/core/tenancy/context/tenant.context';
import { GenHistory, Prisma } from '@prisma/client';
import { PreviewResponseDto } from '../dto/responses/preview.response.dto';
import { UserDto } from 'src/modules/users/user.decorator';

/**
 * 每个表的最大历史记录数
 * Requirements: 9.2
 */
const MAX_HISTORY_PER_TABLE = 10;

/**
 * 历史记录默认保留天数
 * Requirements: 9.5
 */
const DEFAULT_RETENTION_DAYS = 30;

/**
 * 生成历史查询 DTO
 */
export interface QueryHistoryDto {
  tableId?: number;
  tableName?: string;
  pageNum?: number;
  pageSize?: number;
}

/**
 * 历史记录详情（包含解析后的快照）
 */
export interface HistoryDetailDto extends GenHistory {
  snapshotData: PreviewResponseDto;
}

/**
 * 生成历史管理服务
 *
 * @description 提供代码生成历史的记录、查询、清理等功能
 * Requirements: 9.1, 9.2, 9.5
 */
@Injectable()
export class HistoryService {
  private readonly logger = new Logger(HistoryService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * 记录生成历史
   * Requirements: 9.1
   *
   * @param tableId 表ID
   * @param tableName 表名
   * @param templateGroupId 模板组ID
   * @param snapshot 生成的代码快照
   * @param user 操作用户
   */
  async record(
    tableId: number,
    tableName: string,
    templateGroupId: number,
    snapshot: PreviewResponseDto,
    user: UserDto,
  ): Promise<Result<GenHistory>> {
    const tenantId = TenantContext.getTenantId() || TenantContext.SUPER_TENANT_ID;

    try {
      // 序列化快照为 JSON
      const snapshotJson = JSON.stringify(snapshot);

      // 创建历史记录
      const history = await this.prisma.genHistory.create({
        data: {
          tenantId,
          tableId,
          tableName,
          templateGroupId,
          snapshot: snapshotJson,
          generatedBy: user.userName,
          generatedAt: new Date(),
        },
      });

      this.logger.log(`生成历史记录成功: 表 ${tableName} (ID: ${tableId}), 历史ID: ${history.id}`);

      // 清理超出限制的历史记录
      await this.enforceHistoryLimit(tableId, tenantId);

      return Result.ok(history, '记录成功');
    } catch (error) {
      this.logger.error(`生成历史记录失败: ${error.message}`, error.stack);
      throw new BusinessException(ResponseCode.OPERATION_FAILED, '记录生成历史失败');
    }
  }

  /**
   * 强制执行历史记录数量限制
   * Requirements: 9.2
   *
   * @param tableId 表ID
   * @param tenantId 租户ID
   */
  private async enforceHistoryLimit(tableId: number, tenantId: string): Promise<void> {
    // 获取该表的所有历史记录，按时间降序排列
    const histories = await this.prisma.genHistory.findMany({
      where: {
        tableId,
        tenantId,
      },
      orderBy: {
        generatedAt: 'desc',
      },
      select: {
        id: true,
      },
    });

    // 如果超出限制，删除最旧的记录
    if (histories.length > MAX_HISTORY_PER_TABLE) {
      const idsToDelete = histories.slice(MAX_HISTORY_PER_TABLE).map((h) => h.id);

      await this.prisma.genHistory.deleteMany({
        where: {
          id: { in: idsToDelete },
        },
      });

      this.logger.log(`清理超出限制的历史记录: 表ID ${tableId}, 删除 ${idsToDelete.length} 条`);
    }
  }

  /**
   * 获取历史记录列表
   * Requirements: 9.3
   *
   * @param query 查询参数
   */
  async getHistory(query: QueryHistoryDto): Promise<Result> {
    const tenantId = TenantContext.getTenantId() || TenantContext.SUPER_TENANT_ID;

    const where: Prisma.GenHistoryWhereInput = {
      tenantId,
    };

    if (query.tableId) {
      where.tableId = query.tableId;
    }

    if (query.tableName) {
      where.tableName = { contains: query.tableName };
    }

    const pageNum = query.pageNum || 1;
    const pageSize = query.pageSize || 10;
    const skip = (pageNum - 1) * pageSize;

    const [rows, total] = await Promise.all([
      this.prisma.genHistory.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: {
          generatedAt: 'desc',
        },
        include: {
          table: {
            select: {
              tableName: true,
              tableComment: true,
              className: true,
            },
          },
          templateGroup: {
            select: {
              name: true,
            },
          },
        },
      }),
      this.prisma.genHistory.count({ where }),
    ]);

    return Result.page(rows, total, pageNum, pageSize);
  }

  /**
   * 获取历史记录详情
   * Requirements: 9.3
   *
   * @param historyId 历史记录ID
   */
  async getHistoryDetail(historyId: number): Promise<Result<HistoryDetailDto>> {
    const tenantId = TenantContext.getTenantId() || TenantContext.SUPER_TENANT_ID;

    const history = await this.prisma.genHistory.findFirst({
      where: {
        id: historyId,
        tenantId,
      },
      include: {
        table: {
          select: {
            tableName: true,
            tableComment: true,
            className: true,
          },
        },
        templateGroup: {
          select: {
            name: true,
          },
        },
      },
    });

    BusinessException.throwIfNull(history, '历史记录不存在', ResponseCode.DATA_NOT_FOUND);

    try {
      // 解析快照 JSON
      const snapshotData = JSON.parse(history.snapshot) as PreviewResponseDto;

      return Result.ok({
        ...history,
        snapshotData,
      });
    } catch (error) {
      this.logger.error(`解析历史快照失败: ${error.message}`, error.stack);
      throw new BusinessException(ResponseCode.OPERATION_FAILED, '解析历史快照失败');
    }
  }

  /**
   * 获取表的历史记录数量
   * Requirements: 9.2
   *
   * @param tableId 表ID
   */
  async getHistoryCount(tableId: number): Promise<number> {
    const tenantId = TenantContext.getTenantId() || TenantContext.SUPER_TENANT_ID;

    return this.prisma.genHistory.count({
      where: {
        tableId,
        tenantId,
      },
    });
  }

  /**
   * 清理过期历史记录
   * Requirements: 9.5
   *
   * @param days 保留天数（默认30天）
   * @returns 删除的记录数
   */
  async cleanupOldHistory(days: number = DEFAULT_RETENTION_DAYS): Promise<Result<number>> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    try {
      const result = await this.prisma.genHistory.deleteMany({
        where: {
          generatedAt: {
            lt: cutoffDate,
          },
        },
      });

      this.logger.log(`清理过期历史记录: 删除 ${result.count} 条 (${days} 天前)`);
      return Result.ok(result.count, `成功清理 ${result.count} 条过期记录`);
    } catch (error) {
      this.logger.error(`清理过期历史记录失败: ${error.message}`, error.stack);
      throw new BusinessException(ResponseCode.OPERATION_FAILED, '清理过期历史记录失败');
    }
  }

  /**
   * 删除指定历史记录
   * Requirements: 9.3
   *
   * @param historyId 历史记录ID
   */
  async deleteHistory(historyId: number): Promise<Result<void>> {
    const tenantId = TenantContext.getTenantId() || TenantContext.SUPER_TENANT_ID;

    const history = await this.prisma.genHistory.findFirst({
      where: {
        id: historyId,
        tenantId,
      },
    });

    BusinessException.throwIfNull(history, '历史记录不存在', ResponseCode.DATA_NOT_FOUND);

    try {
      await this.prisma.genHistory.delete({
        where: { id: historyId },
      });

      this.logger.log(`删除历史记录成功: ID ${historyId}`);
      return Result.ok(null, '删除成功');
    } catch (error) {
      this.logger.error(`删除历史记录失败: ${error.message}`, error.stack);
      throw new BusinessException(ResponseCode.OPERATION_FAILED, '删除历史记录失败');
    }
  }

  /**
   * 批量删除历史记录
   * Requirements: 9.3
   *
   * @param historyIds 历史记录ID列表
   */
  async batchDeleteHistory(historyIds: number[]): Promise<Result<number>> {
    const tenantId = TenantContext.getTenantId() || TenantContext.SUPER_TENANT_ID;

    try {
      const result = await this.prisma.genHistory.deleteMany({
        where: {
          id: { in: historyIds },
          tenantId,
        },
      });

      this.logger.log(`批量删除历史记录成功: 删除 ${result.count} 条`);
      return Result.ok(result.count, `成功删除 ${result.count} 条记录`);
    } catch (error) {
      this.logger.error(`批量删除历史记录失败: ${error.message}`, error.stack);
      throw new BusinessException(ResponseCode.OPERATION_FAILED, '批量删除历史记录失败');
    }
  }

  /**
   * 获取最大历史记录数限制
   * Requirements: 9.2
   */
  getMaxHistoryLimit(): number {
    return MAX_HISTORY_PER_TABLE;
  }
}
