import { Prisma, PrismaClient } from '@prisma/client';
import { CursorPaginationDto, CursorPaginationMeta, CursorPageResponseDto, PageQueryDto, PageResponseDto, SortOrder } from '../dto/base.dto';

export interface PaginatedResult<T> {
  rows: T[];
  total: number;
}

export interface PaginationParams {
  pageNum?: number | string;
  pageSize?: number | string;
}

export interface PaginationQuery {
  skip: number;
  take: number;
  pageNum: number;
  pageSize: number;
}

/**
 * 游标分页结果
 */
export interface CursorPaginatedResult<T> {
  rows: T[];
  meta: CursorPaginationMeta;
}

/**
 * 分页工具类
 *
 * @description 提供标准分页和游标分页的工具方法
 * 支持两种分页模式：
 * 1. 标准分页（offset-based）：适用于小数据集，支持跳页
 * 2. 游标分页（cursor-based）：适用于大数据集，性能更好
 */
export class PaginationHelper {
  /**
   * 获取标准分页参数
   * @param params 分页参数
   * @returns 分页查询参数
   */
  static getPagination(params: PaginationParams = {}): PaginationQuery {
    const pageSize = Number(params.pageSize ?? 10);
    const pageNum = Number(params.pageNum ?? 1);
    const take = pageSize > 0 ? pageSize : 10;
    const skip = take * (pageNum > 0 ? pageNum - 1 : 0);
    return { skip, take, pageNum: pageNum > 0 ? pageNum : 1, pageSize: take };
  }

  /**
   * 从 PageQueryDto 获取分页参数
   * @param query 分页查询 DTO
   * @returns 分页查询参数
   */
  static fromPageQuery(query: PageQueryDto): PaginationQuery {
    return query.toPaginationParams();
  }

  /**
   * 执行分页查询
   * @param findMany 查询函数
   * @param count 计数函数
   * @returns 分页结果
   */
  static async paginate<T>(findMany: () => Promise<T[]>, count: () => Promise<number>): Promise<PaginatedResult<T>> {
    const [rows, total] = await Promise.all([findMany(), count()]);
    return { rows, total };
  }

  /**
   * 使用事务执行分页查询
   * @param prisma Prisma 客户端
   * @param model 模型名称
   * @param findManyArgs 查询参数
   * @param countArgs 计数参数
   * @returns 分页结果
   */
  static async paginateWithTransaction<T>(
    prisma: PrismaClient,
    model: string,
    findManyArgs: Prisma.Args<any, 'findMany'>,
    countArgs?: Prisma.Args<any, 'count'>,
  ): Promise<PaginatedResult<T>> {
    const [rows, total] = await prisma.$transaction([
      prisma[model].findMany(findManyArgs),
      prisma[model].count(countArgs || { where: findManyArgs?.where }),
    ]);
    return { rows, total };
  }

  /**
   * 创建标准分页响应
   * @param rows 数据列表
   * @param total 总记录数
   * @param query 分页查询参数
   * @returns 分页响应 DTO
   */
  static createPageResponse<T>(rows: T[], total: number, query: PageQueryDto | PaginationParams): PageResponseDto<T> {
    const pageNum = Number(query.pageNum ?? 1);
    const pageSize = Number(query.pageSize ?? 10);
    return PageResponseDto.create(rows, total, pageNum, pageSize);
  }

  // ==================== 游标分页方法 ====================

  /**
   * 获取游标分页参数
   * @param query 游标分页 DTO
   * @returns 游标分页参数
   */
  static getCursorPagination(query: CursorPaginationDto): {
    take: number;
    cursor?: Record<string, any>;
    orderBy: Record<string, 'asc' | 'desc'>;
    skip?: number;
  } {
    const take = query.take;
    const orderBy = query.getOrderBy();
    const cursorField = query.orderByColumn || 'id';

    // 如果有游标，需要跳过游标本身
    if (query.cursor) {
      const cursorValue = PaginationHelper.parseCursorValue(query.cursor);
      return {
        take: take + 1, // 多取一条用于判断是否有更多数据
        cursor: { [cursorField]: cursorValue },
        skip: 1, // 跳过游标本身
        orderBy,
      };
    }

    return {
      take: take + 1, // 多取一条用于判断是否有更多数据
      orderBy,
    };
  }

  /**
   * 执行游标分页查询
   * @param findMany 查询函数（应返回 limit + 1 条数据）
   * @param query 游标分页参数
   * @param cursorField 游标字段名
   * @returns 游标分页结果
   */
  static async cursorPaginate<T extends Record<string, any>>(
    findMany: () => Promise<T[]>,
    query: CursorPaginationDto,
    cursorField: string = 'id',
  ): Promise<CursorPaginatedResult<T>> {
    const limit = query.limit || 10;
    const allRows = await findMany();

    // 判断是否有更多数据
    const hasMore = allRows.length > limit;
    const rows = hasMore ? allRows.slice(0, limit) : allRows;

    // 如果是反向分页，需要反转结果
    if (query.direction === 'backward') {
      rows.reverse();
    }

    const response = CursorPageResponseDto.create(rows, hasMore, cursorField, query.direction);
    return { rows: response.rows, meta: response.meta };
  }

  /**
   * 使用事务执行游标分页查询
   * @param prisma Prisma 客户端
   * @param model 模型名称
   * @param findManyArgs 查询参数
   * @param query 游标分页参数
   * @param cursorField 游标字段名
   * @returns 游标分页结果
   */
  static async cursorPaginateWithTransaction<T extends Record<string, any>>(
    prisma: PrismaClient,
    model: string,
    findManyArgs: Omit<Prisma.Args<any, 'findMany'>, 'take' | 'cursor' | 'skip'>,
    query: CursorPaginationDto,
    cursorField: string = 'id',
  ): Promise<CursorPaginatedResult<T>> {
    const limit = query.limit || 10;
    const orderBy = query.getOrderBy();
    const cursorCondition = query.getCursorCondition(cursorField);

    // 构建查询条件
    const where = {
      ...findManyArgs.where,
      ...(cursorCondition && cursorCondition),
    };

    const allRows = await prisma[model].findMany({
      ...findManyArgs,
      where,
      take: limit + 1,
      orderBy,
    });

    // 判断是否有更多数据
    const hasMore = allRows.length > limit;
    const rows: T[] = hasMore ? allRows.slice(0, limit) : allRows;

    // 如果是反向分页，需要反转结果
    if (query.direction === 'backward') {
      rows.reverse();
    }

    const response = CursorPageResponseDto.create(rows, hasMore, cursorField, query.direction);
    return { rows: response.rows as T[], meta: response.meta };
  }

  /**
   * 创建游标分页响应
   * @param rows 数据列表
   * @param hasMore 是否有更多数据
   * @param cursorField 游标字段名
   * @param direction 分页方向
   * @returns 游标分页响应 DTO
   */
  static createCursorResponse<T extends Record<string, any>>(
    rows: T[],
    hasMore: boolean,
    cursorField: string = 'id',
    direction: 'forward' | 'backward' = 'forward',
  ): CursorPageResponseDto<T> {
    return CursorPageResponseDto.create(rows, hasMore, cursorField, direction);
  }

  // ==================== 工具方法 ====================

  /**
   * 构建日期范围条件
   * @param params 日期范围参数
   * @returns Prisma 日期过滤条件
   */
  static buildDateRange(params?: { beginTime?: string; endTime?: string }): Prisma.DateTimeFilter | undefined {
    if (!params?.beginTime && !params?.endTime) return undefined;
    const filter: Prisma.DateTimeFilter = {} as any;
    if (params.beginTime) filter.gte = new Date(params.beginTime);
    if (params.endTime) filter.lte = new Date(params.endTime);
    return filter;
  }

  /**
   * 构建字符串模糊查询条件
   * @param value 查询值
   * @returns Prisma 字符串过滤条件
   */
  static buildStringFilter(value?: string): Prisma.StringFilter | undefined {
    if (!value) return undefined;
    return { contains: value } as Prisma.StringFilter;
  }

  /**
   * 构建 IN 查询条件
   * @param values 值数组
   * @returns Prisma IN 过滤条件
   */
  static buildInFilter<T>(values?: T[]): { in: T[] } | undefined {
    if (!values || values.length === 0) return undefined;
    return { in: values };
  }

  /**
   * 解析游标值（支持数字和字符串）
   * @param cursor 游标字符串
   * @returns 解析后的游标值
   */
  static parseCursorValue(cursor: string): number | string {
    const numValue = Number(cursor);
    return isNaN(numValue) ? cursor : numValue;
  }

  /**
   * 计算总页数
   * @param total 总记录数
   * @param pageSize 每页条数
   * @returns 总页数
   */
  static calculatePages(total: number, pageSize: number): number {
    return pageSize > 0 ? Math.ceil(total / pageSize) : 0;
  }

  /**
   * 验证分页参数
   * @param pageNum 页码
   * @param pageSize 每页条数
   * @returns 验证后的分页参数
   */
  static validatePaginationParams(
    pageNum?: number | string,
    pageSize?: number | string,
  ): { pageNum: number; pageSize: number } {
    const validPageNum = Math.max(1, Number(pageNum) || 1);
    const validPageSize = Math.min(100, Math.max(1, Number(pageSize) || 10));
    return { pageNum: validPageNum, pageSize: validPageSize };
  }
}
