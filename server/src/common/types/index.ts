/**
 * Type Definitions Index
 * 类型定义统一导出
 */

// Common types
export type {
  PaginationParams,
  PaginationQuery,
  PaginatedResult,
  SortOptions,
  QueryOptions,
  ClientInfo,
  DateRangeFilter,
  ID,
  KeyValue,
  Nullable,
  Optional,
  DeepPartial,
  TimestampFields,
  SoftDeleteFields,
  StatusFields,
  BaseEntity,
} from './common';

// Response types
export type { ApiResponse, PaginatedData, PaginatedResponse, SuccessResponse, ErrorResponse } from './response';

export { ResponseCode, ResponseMessage, getResponseMessage } from './response';

// Validation types
export type {
  PasswordValidationConfig,
  PasswordValidationResult,
  ValidationError,
  ValidationResult,
} from './validation';

// Decorator types
export type {
  ApiParamOption,
  ApiQueryOption,
  ApiHeaderOption,
  ApiResponseOption,
  FileUploadOption,
  ApiOptions,
  TaskMetadata,
  OperlogConfig,
  TransactionalOptions,
  VersionOptions,
} from './decorator';

// Export types
export type { ExportHeader, ExportOptions } from './export';

// Tenant types
export type { TenantContext } from './tenant';

// SSE types
export type { SseMessage } from './sse';
