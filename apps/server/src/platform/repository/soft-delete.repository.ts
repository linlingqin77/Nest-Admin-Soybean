import { PrismaClient } from '@prisma/client';
import { BaseRepository, PrismaDelegate, FindOptions, QueryOptions } from './base.repository';
import { PrismaService } from 'src/platform/prisma';
import { IPaginatedData } from 'src/shared/response/response.interface';
import { BusinessException } from 'src/shared/exceptions';
import { ResponseCode } from 'src/shared/response';
import { DelFlagEnum } from 'src/shared/enums';

/**
 * 软删除仓储基类
 * 自动处理软删除逻辑（DelFlagEnum.NORMAL 表示正常，DelFlagEnum.DELETE 表示已删除）
 */
export abstract class SoftDeleteRepository<T, D extends PrismaDelegate> extends BaseRepository<T, D> {
  constructor(prisma: PrismaService, modelName: keyof PrismaClient) {
    super(prisma, modelName);
  }

  /**
   * 获取模型的ID字段名
   * @deprecated 使用 getPrimaryKeyName() 代替
   */
  protected getIdField(): string {
    return this.getPrimaryKeyName();
  }

  /**
   * 软删除单条记录
   */
  override async softDelete(id: number | string): Promise<T> {
    const idField = this.getIdField();
    return await this.delegate.update({
      where: { [idField]: id },
      data: { delFlag: DelFlagEnum.DELETE },
    });
  }

  /**
   * 批量软删除
   */
  async softDeleteBatch(ids: number[]): Promise<number> {
    const idField = this.getIdField();
    if (!this.delegate.updateMany) {
      throw new BusinessException(ResponseCode.INTERNAL_SERVER_ERROR, 'updateMany not supported for this model');
    }
    const result = await this.delegate.updateMany({
      where: {
        [idField]: { in: ids },
      },
      data: { delFlag: DelFlagEnum.DELETE },
    });

    return result.count;
  }

  /**
   * 查询所有未删除的记录
   * 重写 findMany 以自动过滤软删除的记录
   */
  async findMany(args?: { where?: Record<string, unknown>; [key: string]: unknown }): Promise<T[]> {
    const where = args?.where || {};
    // 只有在 where 中没有显式设置 delFlag 时才添加默认过滤
    if (!('delFlag' in where)) {
      (where as Record<string, unknown>).delFlag = DelFlagEnum.NORMAL;
    }

    return await this.delegate.findMany({
      ...args,
      where,
    });
  }

  /**
   * 查询单条未删除的记录
   */
  override async findOne(where: Record<string, unknown>, options?: FindOptions): Promise<T | null> {
    // 添加软删除过滤
    if (!('delFlag' in where)) {
      where.delFlag = DelFlagEnum.NORMAL;
    }

    return await this.delegate.findFirst({ where, ...options });
  }

  /**
   * 根据ID查询（过滤软删除）
   */
  override async findById(id: number | string, options?: FindOptions): Promise<T | null> {
    const idField = this.getIdField();
    return this.findOne({ [idField]: id }, options);
  }

  /**
   * 查询所有记录（过滤软删除）
   */
  override async findAll(options?: Omit<QueryOptions, 'pageNum' | 'pageSize'>): Promise<T[]> {
    const { where = {}, include, select, orderBy, order } = options || {};

    // 添加软删除过滤
    if (!('delFlag' in where)) {
      (where as Record<string, unknown>).delFlag = DelFlagEnum.NORMAL;
    }

    return this.delegate.findMany({
      where,
      include,
      select,
      orderBy: orderBy ? { [orderBy]: order || 'asc' } : undefined,
    });
  }

  /**
   * 分页查询（过滤软删除）
   */
  override async findPage(options: QueryOptions): Promise<IPaginatedData<T>> {
    const { pageNum = 1, pageSize = 10, where = {}, include, select, orderBy, order } = options;
    const skip = (pageNum - 1) * pageSize;

    // 添加软删除过滤
    if (!('delFlag' in where)) {
      (where as Record<string, unknown>).delFlag = DelFlagEnum.NORMAL;
    }

    const [rows, total] = await Promise.all([
      this.delegate.findMany({
        where,
        include,
        select,
        orderBy: orderBy ? { [orderBy]: order || 'asc' } : undefined,
        skip,
        take: pageSize,
      }),
      this.delegate.count({ where }),
    ]);

    return {
      rows,
      total,
      pageNum,
      pageSize,
      pages: Math.ceil(total / pageSize),
    };
  }

  /**
   * 统计记录数（过滤软删除）
   */
  override async count(where?: Record<string, unknown>): Promise<number> {
    const whereClause = where || {};
    // 添加软删除过滤
    if (!('delFlag' in whereClause)) {
      (whereClause as Record<string, unknown>).delFlag = DelFlagEnum.NORMAL;
    }
    return this.delegate.count({ where: whereClause });
  }

  /**
   * 检查记录是否存在（过滤软删除）
   */
  override async exists(where: Record<string, unknown>): Promise<boolean> {
    if (!('delFlag' in where)) {
      where.delFlag = DelFlagEnum.NORMAL;
    }

    const count = await this.delegate.count({ where });
    return count > 0;
  }
}
