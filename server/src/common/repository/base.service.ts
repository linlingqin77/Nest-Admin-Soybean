import { Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Result } from '../response';
import { FormatDateFields } from '../utils/index';
import { QueryBuilder } from '../utils/query-builder.helper';
import { PaginationHelper, PaginatedResult } from '../utils/pagination.helper';
import { SoftDeleteRepository } from './soft-delete.repository';
import { PrismaDelegate } from './base.repository';

/**
 * 列表查询配置
 */
export interface ListQueryConfig {
  /** 模糊搜索字段 */
  containsFields?: string[];
  /** 精确匹配字段 */
  equalsFields?: string[];
  /** 数字字段 */
  numberFields?: string[];
  /** 日期范围字段 */
  dateRangeField?: string;
  /** 默认排序 */
  defaultOrderBy?: Record<string, 'asc' | 'desc'>;
}

/**
 * 基础服务抽象类
 *
 * @description 提供通用的 CRUD 操作封装，减少 Service 层的样板代码
 * 子类只需要实现特定的业务逻辑
 *
 * @example
 * ```typescript
 * @Injectable()
 * export class NoticeService extends BaseService<SysNotice, NoticeRepository> {
 *   constructor(
 *     private readonly noticeRepo: NoticeRepository,
 *     private readonly prisma: PrismaService,
 *   ) {
 *     super(noticeRepo, {
 *       containsFields: ['noticeTitle', 'createBy'],
 *       equalsFields: ['noticeType'],
 *       dateRangeField: 'createTime',
 *     });
 *   }
 * }
 * ```
 */
export abstract class BaseService<
  T,
  R extends SoftDeleteRepository<T, PrismaDelegate>,
> {
  protected readonly logger: Logger;

  constructor(
    protected readonly repository: R,
    protected readonly listQueryConfig?: ListQueryConfig,
  ) {
    this.logger = new Logger(this.constructor.name);
  }

  /**
   * 创建记录
   * @param createDto 创建数据
   */
  async create(createDto: Partial<T>): Promise<Result<T>> {
    const data = await this.repository.create(createDto);
    return Result.ok(data);
  }

  /**
   * 分页查询列表
   * @param query 查询参数
   */
  async findAll(query: Record<string, unknown>): Promise<Result<PaginatedResult<T>>> {
    const where = this.buildListWhere(query);
    const { skip, take } = PaginationHelper.getPagination(query as { pageNum?: number; pageSize?: number });
    const orderBy = this.listQueryConfig?.defaultOrderBy || { createTime: 'desc' as const };

    const result = await this.repository.findPage({
      where,
      pageNum: (query.pageNum as number) || 1,
      pageSize: (query.pageSize as number) || 10,
      orderBy: Object.keys(orderBy)[0],
      order: Object.values(orderBy)[0],
    });

    return Result.ok({
      rows: FormatDateFields(result.rows),
      total: result.total,
    });
  }

  /**
   * 根据 ID 查询详情
   * @param id 记录 ID
   */
  async findOne(id: number | string): Promise<Result<T | null>> {
    const numId = typeof id === 'string' ? parseInt(id, 10) : id;
    const data = await this.repository.findById(numId);
    return Result.ok(data ? FormatDateFields(data) : null);
  }

  /**
   * 更新记录
   * @param id 记录 ID
   * @param updateDto 更新数据
   */
  async update(id: number | string, updateDto: Partial<T>): Promise<Result<T>> {
    const data = await this.repository.update(id, updateDto);
    return Result.ok(data);
  }

  /**
   * 删除记录（软删除）
   * @param id 记录 ID
   */
  async remove(id: number | string): Promise<Result<T>> {
    const numId = typeof id === 'string' ? parseInt(id, 10) : id;
    const data = await this.repository.softDelete(numId);
    return Result.ok(data);
  }

  /**
   * 批量删除记录（软删除）
   * @param ids 记录 ID 数组
   */
  async removeBatch(ids: (number | string)[]): Promise<Result<{ count: number }>> {
    const numIds = ids.map(id => typeof id === 'string' ? parseInt(id, 10) : id);
    const count = await this.repository.softDeleteBatch(numIds);
    return Result.ok({ count });
  }

  /**
   * 构建列表查询条件
   * @param query 查询参数
   */
  protected buildListWhere(query: Record<string, unknown>): Record<string, unknown> {
    const builder = QueryBuilder.create().addDelFlag();

    if (this.listQueryConfig) {
      // 处理模糊搜索字段
      this.listQueryConfig.containsFields?.forEach((field) => {
        builder.addContains(field, query[field] as string);
      });

      // 处理精确匹配字段
      this.listQueryConfig.equalsFields?.forEach((field) => {
        builder.addEquals(field, query[field]);
      });

      // 处理数字字段
      this.listQueryConfig.numberFields?.forEach((field) => {
        builder.addNumber(field, query[field] as number | string);
      });

      // 处理日期范围
      if (this.listQueryConfig.dateRangeField) {
        builder.addDateRange(
          this.listQueryConfig.dateRangeField,
          query.params as { beginTime?: string; endTime?: string },
        );
      }
    }

    return builder.build();
  }

  /**
   * 检查记录是否存在
   * @param where 查询条件
   */
  async exists(where: Record<string, unknown>): Promise<boolean> {
    return this.repository.exists(where);
  }

  /**
   * 根据 ID 检查记录是否存在
   * @param id 记录 ID
   */
  async existsById(id: number | string): Promise<boolean> {
    return this.repository.existsById(id);
  }
}
