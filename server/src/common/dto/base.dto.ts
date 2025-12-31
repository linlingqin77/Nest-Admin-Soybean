import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsInt, IsString, IsEnum, Min, Max, IsDateString, ValidateNested, IsBoolean } from 'class-validator';
import { Type, Transform } from 'class-transformer';

/**
 * 排序方向枚举
 */
export enum SortOrder {
  ASC = 'asc',
  DESC = 'desc',
}

/**
 * 时间范围 DTO
 */
export class DateRangeDto {
  @ApiPropertyOptional({ description: '开始时间', example: '2024-01-01' })
  @IsOptional()
  @IsDateString()
  beginTime?: string;

  @ApiPropertyOptional({ description: '结束时间', example: '2024-12-31' })
  @IsOptional()
  @IsDateString()
  endTime?: string;
}

/**
 * 基础分页 DTO
 *
 * @description 提供标准的分页参数，所有需要分页的接口都应继承此类
 * 统一分页参数命名规范：
 * - pageNum: 当前页码（从1开始）
 * - pageSize: 每页条数（默认10，最大100）
 * - orderByColumn: 排序字段
 * - isAsc: 排序方向（asc/desc）
 *
 * @example
 * ```typescript
 * export class ListUserDto extends PageQueryDto {
 *   @IsOptional()
 *   @IsString()
 *   userName?: string;
 * }
 * ```
 */
export class PageQueryDto {
  @ApiPropertyOptional({ description: '页码（从1开始）', default: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  pageNum?: number = 1;

  @ApiPropertyOptional({ description: '每页条数', default: 10, minimum: 1, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize?: number = 10;

  @ApiPropertyOptional({ description: '排序字段' })
  @IsOptional()
  @IsString()
  orderByColumn?: string;

  @ApiPropertyOptional({ description: '排序方向', enum: SortOrder })
  @IsOptional()
  @IsEnum(SortOrder)
  @Transform(({ value }) => value?.toLowerCase())
  isAsc?: SortOrder;

  @ApiPropertyOptional({ description: '时间范围', type: DateRangeDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => DateRangeDto)
  params?: DateRangeDto;

  /**
   * 获取分页偏移量
   */
  get skip(): number {
    return ((this.pageNum || 1) - 1) * (this.pageSize || 10);
  }

  /**
   * 获取每页条数
   */
  get take(): number {
    return this.pageSize || 10;
  }

  /**
   * 获取排序配置
   */
  getOrderBy(defaultField?: string): Record<string, 'asc' | 'desc'> | undefined {
    const field = this.orderByColumn || defaultField;
    if (!field) return undefined;
    return { [field]: this.isAsc || SortOrder.DESC };
  }

  /**
   * 获取时间范围条件
   */
  getDateRange(fieldName: string = 'createTime'): Record<string, { gte?: Date; lte?: Date }> | undefined {
    if (!this.params?.beginTime && !this.params?.endTime) {
      return undefined;
    }

    const condition: { gte?: Date; lte?: Date } = {};
    if (this.params.beginTime) {
      condition.gte = new Date(this.params.beginTime);
    }
    if (this.params.endTime) {
      condition.lte = new Date(this.params.endTime + ' 23:59:59');
    }

    return { [fieldName]: condition };
  }

  /**
   * 转换为标准分页参数对象
   */
  toPaginationParams(): { skip: number; take: number; pageNum: number; pageSize: number } {
    return {
      skip: this.skip,
      take: this.take,
      pageNum: this.pageNum || 1,
      pageSize: this.pageSize || 10,
    };
  }
}

/**
 * 游标分页 DTO
 *
 * @description 用于大数据集的游标分页，避免深度分页性能问题
 * 游标分页参数命名规范：
 * - cursor: 游标值（上一页最后一条记录的ID）
 * - limit: 每页条数（默认10，最大100）
 * - direction: 分页方向（forward/backward）
 *
 * @example
 * ```typescript
 * // 第一页请求
 * GET /api/users?limit=10
 *
 * // 下一页请求（使用上一页最后一条记录的ID作为游标）
 * GET /api/users?cursor=123&limit=10&direction=forward
 *
 * // 上一页请求
 * GET /api/users?cursor=123&limit=10&direction=backward
 * ```
 */
export class CursorPaginationDto {
  @ApiPropertyOptional({ description: '游标值（上一页最后一条记录的ID）', example: '123' })
  @IsOptional()
  @IsString()
  cursor?: string;

  @ApiPropertyOptional({ description: '每页条数', default: 10, minimum: 1, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 10;

  @ApiPropertyOptional({
    description: '分页方向',
    enum: ['forward', 'backward'],
    default: 'forward',
  })
  @IsOptional()
  @IsEnum(['forward', 'backward'])
  direction?: 'forward' | 'backward' = 'forward';

  @ApiPropertyOptional({ description: '排序字段', default: 'id' })
  @IsOptional()
  @IsString()
  orderByColumn?: string = 'id';

  @ApiPropertyOptional({ description: '排序方向', enum: SortOrder, default: SortOrder.DESC })
  @IsOptional()
  @IsEnum(SortOrder)
  @Transform(({ value }) => value?.toLowerCase())
  isAsc?: SortOrder = SortOrder.DESC;

  /**
   * 获取每页条数
   */
  get take(): number {
    return this.limit || 10;
  }

  /**
   * 获取排序配置
   */
  getOrderBy(): Record<string, 'asc' | 'desc'> {
    const field = this.orderByColumn || 'id';
    return { [field]: this.isAsc || SortOrder.DESC };
  }

  /**
   * 获取游标条件（用于 Prisma 查询）
   * @param cursorField 游标字段名，默认为 'id'
   */
  getCursorCondition(cursorField: string = 'id'): Record<string, any> | undefined {
    if (!this.cursor) return undefined;

    const cursorValue = this.parseCursorValue(this.cursor);
    const isAscending = this.isAsc === SortOrder.ASC;
    const isForward = this.direction === 'forward';

    // 根据排序方向和分页方向确定比较操作符
    // forward + asc: > cursor
    // forward + desc: < cursor
    // backward + asc: < cursor
    // backward + desc: > cursor
    const operator = (isForward && isAscending) || (!isForward && !isAscending) ? 'gt' : 'lt';

    return { [cursorField]: { [operator]: cursorValue } };
  }

  /**
   * 解析游标值（支持数字和字符串）
   */
  private parseCursorValue(cursor: string): number | string {
    const numValue = Number(cursor);
    return isNaN(numValue) ? cursor : numValue;
  }

  /**
   * 转换为标准游标分页参数对象
   */
  toCursorParams(): {
    cursor?: string;
    limit: number;
    direction: 'forward' | 'backward';
    orderByColumn: string;
    isAsc: SortOrder;
  } {
    return {
      cursor: this.cursor,
      limit: this.limit || 10,
      direction: this.direction || 'forward',
      orderByColumn: this.orderByColumn || 'id',
      isAsc: this.isAsc || SortOrder.DESC,
    };
  }
}

/**
 * 游标分页响应元数据
 */
export class CursorPaginationMeta {
  @ApiProperty({ description: '是否有下一页' })
  hasNextPage: boolean;

  @ApiProperty({ description: '是否有上一页' })
  hasPreviousPage: boolean;

  @ApiPropertyOptional({ description: '下一页游标' })
  nextCursor?: string;

  @ApiPropertyOptional({ description: '上一页游标' })
  previousCursor?: string;

  @ApiProperty({ description: '当前页数据条数' })
  count: number;

  constructor(data: Partial<CursorPaginationMeta>) {
    this.hasNextPage = data.hasNextPage ?? false;
    this.hasPreviousPage = data.hasPreviousPage ?? false;
    this.nextCursor = data.nextCursor;
    this.previousCursor = data.previousCursor;
    this.count = data.count ?? 0;
  }
}

/**
 * 标准分页响应 DTO
 *
 * @description 统一分页响应格式：{ rows: [], total: number, pageNum: number, pageSize: number, pages: number }
 */
export class PageResponseDto<T> {
  @ApiProperty({ description: '数据列表', isArray: true })
  rows: T[];

  @ApiProperty({ description: '总记录数', example: 100 })
  total: number;

  @ApiProperty({ description: '当前页码', example: 1 })
  pageNum: number;

  @ApiProperty({ description: '每页条数', example: 10 })
  pageSize: number;

  @ApiProperty({ description: '总页数', example: 10 })
  pages: number;

  constructor(rows: T[], total: number, pageNum: number, pageSize: number) {
    this.rows = rows;
    this.total = total;
    this.pageNum = pageNum;
    this.pageSize = pageSize;
    this.pages = pageSize > 0 ? Math.ceil(total / pageSize) : 0;
  }

  /**
   * 创建分页响应
   */
  static create<T>(rows: T[], total: number, pageNum: number, pageSize: number): PageResponseDto<T> {
    return new PageResponseDto(rows, total, pageNum, pageSize);
  }

  /**
   * 从查询参数创建分页响应
   */
  static fromQuery<T>(rows: T[], total: number, query: PageQueryDto): PageResponseDto<T> {
    return new PageResponseDto(rows, total, query.pageNum || 1, query.pageSize || 10);
  }
}

/**
 * 游标分页响应 DTO
 *
 * @description 游标分页响应格式，适用于大数据集
 */
export class CursorPageResponseDto<T> {
  @ApiProperty({ description: '数据列表', isArray: true })
  rows: T[];

  @ApiProperty({ description: '分页元数据', type: CursorPaginationMeta })
  meta: CursorPaginationMeta;

  constructor(rows: T[], meta: CursorPaginationMeta) {
    this.rows = rows;
    this.meta = meta;
  }

  /**
   * 创建游标分页响应
   * @param rows 数据列表
   * @param hasMore 是否有更多数据
   * @param cursorField 游标字段名
   * @param direction 分页方向
   */
  static create<T extends Record<string, any>>(
    rows: T[],
    hasMore: boolean,
    cursorField: string = 'id',
    direction: 'forward' | 'backward' = 'forward',
  ): CursorPageResponseDto<T> {
    const count = rows.length;
    const firstItem = rows[0];
    const lastItem = rows[count - 1];

    const meta = new CursorPaginationMeta({
      hasNextPage: direction === 'forward' ? hasMore : count > 0,
      hasPreviousPage: direction === 'backward' ? hasMore : count > 0,
      nextCursor: lastItem ? String(lastItem[cursorField]) : undefined,
      previousCursor: firstItem ? String(firstItem[cursorField]) : undefined,
      count,
    });

    return new CursorPageResponseDto(rows, meta);
  }
}

/**
 * 带状态筛选的分页 DTO
 */
export class PageQueryWithStatusDto extends PageQueryDto {
  @ApiPropertyOptional({ description: '状态', example: '0' })
  @IsOptional()
  @IsString()
  status?: string;
}

/**
 * ID 数组 DTO（用于批量操作）
 */
export class IdsDto {
  @ApiProperty({ description: 'ID 数组', example: [1, 2, 3], type: [Number] })
  @IsInt({ each: true })
  @Type(() => Number)
  ids: number[];
}

/**
 * 字符串 ID 数组 DTO
 */
export class StringIdsDto {
  @ApiProperty({ description: 'ID 数组', example: ['1', '2', '3'], type: [String] })
  @IsString({ each: true })
  ids: string[];
}

/**
 * 单个 ID 参数 DTO
 */
export class IdParamDto {
  @ApiProperty({ description: 'ID', example: 1 })
  @Type(() => Number)
  @IsInt()
  id: number;
}

/**
 * 基础实体 DTO（包含通用审计字段）
 */
export class BaseEntityDto {
  @ApiPropertyOptional({ description: '创建者' })
  createBy?: string;

  @ApiPropertyOptional({ description: '创建时间' })
  createTime?: Date;

  @ApiPropertyOptional({ description: '更新者' })
  updateBy?: string;

  @ApiPropertyOptional({ description: '更新时间' })
  updateTime?: Date;

  @ApiPropertyOptional({ description: '备注' })
  remark?: string;
}

/**
 * 带租户的基础实体 DTO
 */
export class TenantEntityDto extends BaseEntityDto {
  @ApiPropertyOptional({ description: '租户ID' })
  tenantId?: string;
}
