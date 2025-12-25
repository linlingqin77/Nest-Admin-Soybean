import { Prisma, PrismaClient } from '@prisma/client';
import { DelFlagEnum } from 'src/common/enum/index';
import { PrismaService } from '../../prisma/prisma.service';
import { IPaginatedData } from '../response/response.interface';

/**
 * 分页查询选项
 */
export interface PaginationOptions {
  pageNum?: number;
  pageSize?: number;
}

/**
 * 排序选项
 */
export interface SortOptions {
  orderBy?: string;
  order?: 'asc' | 'desc';
}

/**
 * 查询选项
 */
export interface QueryOptions extends PaginationOptions, SortOptions {
  /** 查询条件 */
  where?: Record<string, any>;
  /** 关联查询 */
  include?: Record<string, any>;
  /** 字段选择 */
  select?: Record<string, any>;
}

/**
 * Prisma Delegate 类型约束
 */
export type PrismaDelegate = {
  findUnique: Function;
  findFirst: Function;
  findMany: Function;
  create: Function;
  update: Function;
  delete: Function;
  count: Function;
  createMany?: Function;
  updateMany?: Function;
  deleteMany?: Function;
};

/**
 * 基础仓储抽象类
 *
 * @description 提供通用的 CRUD 操作封装，减少 Service 层的样板代码
 *
 * @example
 * ```typescript
 * @Injectable()
 * export class UserRepository extends BaseRepository<SysUser, Prisma.SysUserDelegate> {
 *   constructor(prisma: PrismaService) {
 *     super(prisma, 'sysUser');
 *   }
 * }
 * ```
 */
export abstract class BaseRepository<T, D extends PrismaDelegate = PrismaDelegate> {
  protected readonly delegate: D;

  constructor(
    protected readonly prisma: PrismaService,
    protected readonly modelName: keyof PrismaClient,
  ) {
    this.delegate = (prisma as any)[modelName] as D;
  }

  /**
   * 根据主键查询单条记录
   */
  async findById(id: number | string, options?: { include?: any; select?: any }): Promise<T | null> {
    return this.delegate.findUnique({
      where: { [this.getPrimaryKeyName()]: id },
      ...options,
    });
  }

  /**
   * 根据条件查询单条记录
   */
  async findOne(where: any, options?: { include?: any; select?: any }): Promise<T | null> {
    return this.delegate.findFirst({
      where,
      ...options,
    });
  }

  /**
   * 查询所有记录
   */
  async findAll(options?: Omit<QueryOptions, 'pageNum' | 'pageSize'>): Promise<T[]> {
    const { where, include, select, orderBy, order } = options || {};

    return this.delegate.findMany({
      where,
      include,
      select,
      orderBy: orderBy ? { [orderBy]: order || 'asc' } : undefined,
    });
  }

  /**
   * 分页查询
   */
  async findPage(options: QueryOptions): Promise<IPaginatedData<T>> {
    const { pageNum = 1, pageSize = 10, where, include, select, orderBy, order } = options;
    const skip = (pageNum - 1) * pageSize;

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
   * 创建记录
   */
  async create(data: any, options?: { include?: any; select?: any }): Promise<T> {
    return this.delegate.create({
      data,
      ...options,
    });
  }

  /**
   * 批量创建
   */
  async createMany(data: any[]): Promise<{ count: number }> {
    if (!this.delegate.createMany) {
      throw new Error('createMany not supported for this model');
    }
    return this.delegate.createMany({
      data,
      skipDuplicates: true,
    });
  }

  /**
   * 更新记录
   */
  async update(id: number | string, data: any, options?: { include?: any; select?: any }): Promise<T> {
    return this.delegate.update({
      where: { [this.getPrimaryKeyName()]: id },
      data,
      ...options,
    });
  }

  /**
   * 根据条件更新
   */
  async updateMany(where: any, data: any): Promise<{ count: number }> {
    if (!this.delegate.updateMany) {
      throw new Error('updateMany not supported for this model');
    }
    return this.delegate.updateMany({
      where,
      data,
    });
  }

  /**
   * 删除记录
   */
  async delete(id: number | string): Promise<T> {
    return this.delegate.delete({
      where: { [this.getPrimaryKeyName()]: id },
    });
  }

  /**
   * 批量删除
   */
  async deleteMany(where: any): Promise<{ count: number }> {
    if (!this.delegate.deleteMany) {
      throw new Error('deleteMany not supported for this model');
    }
    return this.delegate.deleteMany({ where });
  }

  /**
   * 根据主键批量删除
   */
  async deleteByIds(ids: (number | string)[]): Promise<{ count: number }> {
    return this.deleteMany({
      [this.getPrimaryKeyName()]: { in: ids },
    });
  }

  /**
   * 统计记录数
   */
  async count(where?: any): Promise<number> {
    return this.delegate.count({ where });
  }

  /**
   * 检查是否存在
   */
  async exists(where: any): Promise<boolean> {
    const count = await this.count(where);
    return count > 0;
  }

  /**
   * 根据主键检查是否存在
   */
  async existsById(id: number | string): Promise<boolean> {
    return this.exists({ [this.getPrimaryKeyName()]: id });
  }

  /**
   * 软删除（设置 delFlag）
   */
  async softDelete(id: number | string): Promise<T> {
    return this.update(id, { delFlag: '1' });
  }

  /**
   * 批量软删除
   */
  async softDeleteMany(ids: (number | string)[]): Promise<{ count: number }> {
    return this.updateMany({ [this.getPrimaryKeyName()]: { in: ids } }, { delFlag: '1' });
  }

  /**
   * 获取主键字段名（子类可覆盖）
   */
  protected getPrimaryKeyName(): string {
    // 默认使用 id，子类可以覆盖此方法
    return 'id';
  }

  /**
   * 获取 Prisma 原始客户端（用于复杂查询）
   */
  protected get client(): PrismaService {
    return this.prisma;
  }
}

/**
 * 带软删除的仓储基类
 *
 * @description 自动在查询条件中添加 delFlag = '0' 过滤
 */
export abstract class SoftDeleteRepository<T, D extends PrismaDelegate = PrismaDelegate> extends BaseRepository<T, D> {
  /**
   * 获取默认的查询条件（排除已删除）
   */
  protected getDefaultWhere(): Record<string, any> {
    return { delFlag: DelFlagEnum.NORMAL };
  }

  /**
   * 合并默认查询条件
   */
  protected mergeWhere(where?: Record<string, any>): Record<string, any> {
    return { ...this.getDefaultWhere(), ...where };
  }

  async findOne(where: any, options?: { include?: any; select?: any }): Promise<T | null> {
    return super.findOne(this.mergeWhere(where), options);
  }

  async findAll(options?: Omit<QueryOptions, 'pageNum' | 'pageSize'>): Promise<T[]> {
    return super.findAll({
      ...options,
      where: this.mergeWhere(options?.where),
    });
  }

  async findPage(options: QueryOptions): Promise<IPaginatedData<T>> {
    return super.findPage({
      ...options,
      where: this.mergeWhere(options.where),
    });
  }

  async count(where?: any): Promise<number> {
    return super.count(this.mergeWhere(where));
  }

  async exists(where: any): Promise<boolean> {
    return super.exists(this.mergeWhere(where));
  }
}
