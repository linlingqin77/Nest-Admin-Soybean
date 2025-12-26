/**
 * Common Type Definitions
 * 通用类型定义
 */

/**
 * Pagination parameters
 * 分页参数
 */
export type PaginationParams = {
  pageNum?: number | string;
  pageSize?: number | string;
};

/**
 * Pagination query with calculated values
 * 计算后的分页查询参数
 */
export type PaginationQuery = {
  skip: number;
  take: number;
  pageNum: number;
  pageSize: number;
};

/**
 * Paginated result
 * 分页结果
 */
export type PaginatedResult<T> = {
  rows: T[];
  total: number;
};

/**
 * Sort options
 * 排序选项
 */
export type SortOptions = {
  orderBy?: string;
  order?: 'asc' | 'desc';
};

/**
 * Query options combining pagination and sorting
 * 查询选项（包含分页和排序）
 */
export type QueryOptions = PaginationParams &
  SortOptions & {
    where?: Record<string, unknown>;
    include?: Record<string, unknown>;
    select?: Record<string, unknown>;
  };

/**
 * Client information
 * 客户端信息
 */
export type ClientInfo = {
  ipaddr: string;
  browser: string;
  os: string;
  loginLocation?: string;
  userName?: string;
  deviceType?: string;
};

/**
 * Date range filter
 * 日期范围过滤
 */
export type DateRangeFilter = {
  beginTime?: string;
  endTime?: string;
};

/**
 * Generic ID type
 * 通用 ID 类型
 */
export type ID = string | number;

/**
 * Generic key-value pair
 * 通用键值对
 */
export type KeyValue<K extends string | number | symbol = string, V = unknown> = Record<K, V>;

/**
 * Nullable type
 * 可空类型
 */
export type Nullable<T> = T | null;

/**
 * Optional type
 * 可选类型
 */
export type Optional<T> = T | undefined;

/**
 * Deep partial type
 * 深度可选类型
 */
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

/**
 * Timestamp fields
 * 时间戳字段
 */
export type TimestampFields = {
  createTime: Date;
  updateTime: Date;
};

/**
 * Soft delete fields
 * 软删除字段
 */
export type SoftDeleteFields = {
  delFlag: string;
};

/**
 * Status fields
 * 状态字段
 */
export type StatusFields = {
  status: string;
};

/**
 * Base entity with common fields
 * 基础实体（包含通用字段）
 */
export type BaseEntity = TimestampFields & SoftDeleteFields & StatusFields;
