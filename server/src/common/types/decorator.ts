/**
 * Decorator Type Definitions
 * 装饰器相关类型定义
 */

import { BusinessType } from '../constant/business.constant';
import { Type } from '@nestjs/common';

/**
 * API parameter option
 * 路径参数配置
 */
export type ApiParamOption = {
  /** Parameter name */
  name: string;
  /** Parameter description */
  description?: string;
  /** Parameter type */
  type?: 'string' | 'number' | 'boolean';
  /** Is required, default true */
  required?: boolean;
  /** Example value */
  example?: unknown;
  /** Enum values */
  enum?: unknown[];
};

/**
 * API query option
 * 查询参数配置
 */
export type ApiQueryOption = {
  /** Parameter name */
  name: string;
  /** Parameter description */
  description?: string;
  /** Parameter type */
  type?: 'string' | 'number' | 'boolean' | 'array';
  /** Is required, default false */
  required?: boolean;
  /** Example value */
  example?: unknown;
  /** Enum values */
  enum?: unknown[];
  /** Allow empty value */
  allowEmptyValue?: boolean;
};

/**
 * API header option
 * 请求头配置
 */
export type ApiHeaderOption = {
  /** Header name */
  name: string;
  /** Header description */
  description?: string;
  /** Is required */
  required?: boolean;
  /** Example value */
  example?: string;
};

/**
 * API response option
 * 自定义响应配置
 */
export type ApiResponseOption = {
  /** Response description */
  description: string;
  /** Response status code */
  status?: number;
  /** Response data type */
  type?: Type<unknown>;
  /** Is array */
  isArray?: boolean;
};

/**
 * File upload option
 * 文件上传配置
 */
export type FileUploadOption = {
  /** File field name, default 'file' */
  fieldName?: string;
  /** Is multiple files, default false */
  multiple?: boolean;
  /** File description */
  description?: string;
  /** Allowed file types */
  allowedTypes?: string[];
  /** Max file size description */
  maxSize?: string;
};

/**
 * API decorator options
 * API 装饰器配置选项
 */
export type ApiOptions = {
  /** API summary (required) */
  summary: string;
  /** API description */
  description?: string;
  /** Request body type */
  body?: Type<unknown>;
  /** Response data type */
  type?: Type<unknown>;
  /** Is response array */
  isArray?: boolean;
  /** Is pager format { rows: T[], total: number } */
  isPager?: boolean;
  /** API tags */
  tags?: string[];
  /** Path parameters */
  params?: ApiParamOption[];
  /** Query parameters */
  queries?: ApiQueryOption[];
  /** Request headers */
  headers?: ApiHeaderOption[];
  /** Custom responses */
  responses?: Record<number, ApiResponseOption>;
  /** File upload configuration */
  fileUpload?: boolean | FileUploadOption;
  /** Is deprecated */
  deprecated?: boolean;
  /** Security requirements */
  security?: boolean;
  /** Consumes content types */
  consumes?: string[];
  /** Produces content types */
  produces?: string[];
  /** Operation ID */
  operationId?: string;
  /** Request example */
  requestExample?: unknown;
  /** Response example */
  responseExample?: unknown;
};

/**
 * Task metadata
 * 任务元数据
 */
export type TaskMetadata = {
  name: string;
  description?: string;
};

/**
 * Operation log configuration
 * 操作日志配置
 */
export type OperlogConfig =
  | Partial<{
      businessType?: (typeof BusinessType)[keyof Omit<typeof BusinessType, 'prototype'>];
      title?: string;
      isSaveRequestData?: boolean;
      isSaveResponseData?: boolean;
    }>
  | undefined;

/**
 * Transactional options
 * 事务选项
 */
export type TransactionalOptions = {
  /** Isolation level */
  isolationLevel?: 'ReadUncommitted' | 'ReadCommitted' | 'RepeatableRead' | 'Serializable';
  /** Propagation behavior */
  propagation?: 'REQUIRED' | 'REQUIRES_NEW' | 'SUPPORTS' | 'NOT_SUPPORTED' | 'MANDATORY' | 'NEVER';
  /** Timeout in milliseconds */
  timeout?: number;
  /** Read-only transaction */
  readOnly?: boolean;
  /** Exception types to rollback for */
  rollbackFor?: (new (...args: unknown[]) => Error)[];
  /** Exception types not to rollback for */
  noRollbackFor?: (new (...args: unknown[]) => Error)[];
};

/**
 * Version options
 * API 版本装饰器参数
 */
export type VersionOptions = {
  /** API version */
  version?: string;
  /** Is deprecated */
  deprecated?: boolean;
  /** Deprecation message */
  deprecationMessage?: string;
};
