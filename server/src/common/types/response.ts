/**
 * Response Type Definitions
 * API 响应类型定义
 */

/**
 * Unified response code enum
 * 统一响应码枚举
 */
export enum ResponseCode {
  // ========== Success ==========
  SUCCESS = 200,

  // ========== Client Errors 400-499 ==========
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
  METHOD_NOT_ALLOWED = 405,
  REQUEST_TIMEOUT = 408,
  CONFLICT = 409,
  GONE = 410,
  UNPROCESSABLE_ENTITY = 422,
  TOO_MANY_REQUESTS = 429,

  // ========== Server Errors 500-599 ==========
  INTERNAL_SERVER_ERROR = 500,
  NOT_IMPLEMENTED = 501,
  BAD_GATEWAY = 502,
  SERVICE_UNAVAILABLE = 503,
  GATEWAY_TIMEOUT = 504,

  // ========== Business Errors 1000+ ==========
  // General business errors (1000-1999)
  BUSINESS_ERROR = 1000,
  PARAM_INVALID = 1001,
  DATA_NOT_FOUND = 1002,
  DATA_ALREADY_EXISTS = 1003,
  DATA_IN_USE = 1004,
  OPERATION_FAILED = 1005,

  // Authentication errors (2000-2999)
  TOKEN_INVALID = 2001,
  TOKEN_EXPIRED = 2002,
  TOKEN_REFRESH_EXPIRED = 2003,
  ACCOUNT_DISABLED = 2004,
  ACCOUNT_LOCKED = 2005,
  PASSWORD_ERROR = 2006,
  CAPTCHA_ERROR = 2007,
  PERMISSION_DENIED = 2008,

  // User errors (3000-3999)
  USER_NOT_FOUND = 3001,
  USER_ALREADY_EXISTS = 3002,
  USER_DISABLED = 3003,
  PASSWORD_WEAK = 3004,
  OLD_PASSWORD_ERROR = 3005,

  // Tenant errors (4000-4999)
  TENANT_NOT_FOUND = 4001,
  TENANT_DISABLED = 4002,
  TENANT_EXPIRED = 4003,
  TENANT_QUOTA_EXCEEDED = 4004,

  // File errors (5000-5999)
  FILE_NOT_FOUND = 5001,
  FILE_TYPE_NOT_ALLOWED = 5002,
  FILE_SIZE_EXCEEDED = 5003,
  FILE_UPLOAD_FAILED = 5004,

  // External service errors (6000-6999)
  EXTERNAL_SERVICE_ERROR = 6001,
  REDIS_ERROR = 6002,
  DATABASE_ERROR = 6003,
}

/**
 * Response code message mapping
 * 响应码消息映射
 */
export const ResponseMessage: Record<ResponseCode, string> = {
  [ResponseCode.SUCCESS]: '操作成功',

  // Client errors
  [ResponseCode.BAD_REQUEST]: '请求参数错误',
  [ResponseCode.UNAUTHORIZED]: '未授权访问',
  [ResponseCode.FORBIDDEN]: '禁止访问',
  [ResponseCode.NOT_FOUND]: '资源不存在',
  [ResponseCode.METHOD_NOT_ALLOWED]: '请求方法不允许',
  [ResponseCode.REQUEST_TIMEOUT]: '请求超时',
  [ResponseCode.CONFLICT]: '数据冲突',
  [ResponseCode.GONE]: '资源已被删除',
  [ResponseCode.UNPROCESSABLE_ENTITY]: '请求数据无法处理',
  [ResponseCode.TOO_MANY_REQUESTS]: '请求过于频繁',

  // Server errors
  [ResponseCode.INTERNAL_SERVER_ERROR]: '服务器内部错误',
  [ResponseCode.NOT_IMPLEMENTED]: '功能未实现',
  [ResponseCode.BAD_GATEWAY]: '网关错误',
  [ResponseCode.SERVICE_UNAVAILABLE]: '服务暂不可用',
  [ResponseCode.GATEWAY_TIMEOUT]: '网关超时',

  // Business errors
  [ResponseCode.BUSINESS_ERROR]: '业务处理失败',
  [ResponseCode.PARAM_INVALID]: '参数验证失败',
  [ResponseCode.DATA_NOT_FOUND]: '数据不存在',
  [ResponseCode.DATA_ALREADY_EXISTS]: '数据已存在',
  [ResponseCode.DATA_IN_USE]: '数据正在使用中',
  [ResponseCode.OPERATION_FAILED]: '操作执行失败',

  // Authentication errors
  [ResponseCode.TOKEN_INVALID]: '无效的令牌',
  [ResponseCode.TOKEN_EXPIRED]: '令牌已过期',
  [ResponseCode.TOKEN_REFRESH_EXPIRED]: '刷新令牌已过期',
  [ResponseCode.ACCOUNT_DISABLED]: '账户已禁用',
  [ResponseCode.ACCOUNT_LOCKED]: '账户已锁定',
  [ResponseCode.PASSWORD_ERROR]: '密码错误',
  [ResponseCode.CAPTCHA_ERROR]: '验证码错误',
  [ResponseCode.PERMISSION_DENIED]: '权限不足',

  // User errors
  [ResponseCode.USER_NOT_FOUND]: '用户不存在',
  [ResponseCode.USER_ALREADY_EXISTS]: '用户已存在',
  [ResponseCode.USER_DISABLED]: '用户已禁用',
  [ResponseCode.PASSWORD_WEAK]: '密码强度不足',
  [ResponseCode.OLD_PASSWORD_ERROR]: '原密码错误',

  // Tenant errors
  [ResponseCode.TENANT_NOT_FOUND]: '租户不存在',
  [ResponseCode.TENANT_DISABLED]: '租户已禁用',
  [ResponseCode.TENANT_EXPIRED]: '租户已过期',
  [ResponseCode.TENANT_QUOTA_EXCEEDED]: '租户配额已超限',

  // File errors
  [ResponseCode.FILE_NOT_FOUND]: '文件不存在',
  [ResponseCode.FILE_TYPE_NOT_ALLOWED]: '文件类型不允许',
  [ResponseCode.FILE_SIZE_EXCEEDED]: '文件大小超限',
  [ResponseCode.FILE_UPLOAD_FAILED]: '文件上传失败',

  // External service errors
  [ResponseCode.EXTERNAL_SERVICE_ERROR]: '外部服务调用失败',
  [ResponseCode.REDIS_ERROR]: 'Redis服务异常',
  [ResponseCode.DATABASE_ERROR]: '数据库服务异常',
};

/**
 * Unified response structure
 * 统一响应结构
 */
export type ApiResponse<T = unknown> = {
  /** Response code */
  code: number;
  /** Response message */
  msg: string;
  /** Response data */
  data: T | null;
  /** Timestamp (optional, for debugging) */
  timestamp?: string;
  /** Request ID (optional, for tracing) */
  requestId?: string;
};

/**
 * Paginated data structure
 * 分页数据结构
 */
export type PaginatedData<T> = {
  /** Data list */
  rows: T[];
  /** Total records */
  total: number;
  /** Current page number */
  pageNum?: number;
  /** Page size */
  pageSize?: number;
  /** Total pages */
  pages?: number;
};

/**
 * Paginated response
 * 分页响应
 */
export type PaginatedResponse<T> = ApiResponse<PaginatedData<T>>;

/**
 * Success response
 * 成功响应
 */
export type SuccessResponse<T = unknown> = ApiResponse<T> & {
  code: ResponseCode.SUCCESS;
};

/**
 * Error response
 * 错误响应
 */
export type ErrorResponse = ApiResponse<null> & {
  code: Exclude<ResponseCode, ResponseCode.SUCCESS>;
};

/**
 * Get response message for a response code
 * 获取响应码对应的默认消息
 */
export function getResponseMessage(code: ResponseCode): string {
  return ResponseMessage[code] || '未知错误';
}
