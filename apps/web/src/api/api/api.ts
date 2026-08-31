/**
 * @generated
 * Tag: API 文档
 * Generated at: 2026-08-31T03:40:43.883Z
 */

/* eslint-disable */
import { apiRequest, buildUrl } from '@/service/request-adapter';
import type * as Types from '../types';

// ── Tag: API 文档 ────────────────────────────────────────────────

/**
 * 获取所有错误码
 * @description 返回系统中所有的错误码及其含义，按错误码排序
 */
export function fetchDocsGetErrorCodes(): Promise<unknown[]> {
  return apiRequest<unknown[]>({
    method: 'GET',
    url: '/api/v1/system/docs/error-codes',
    operationId: 'DocsController_getErrorCodes_v1',
  });
}

/**
 * 按分类获取错误码
 * @description 返回按分类组织的错误码列表
 */
export function fetchDocsGetErrorCodesByCategory(): Promise<unknown> {
  return apiRequest<unknown>({
    method: 'GET',
    url: '/api/v1/system/docs/error-codes/by-category',
    operationId: 'DocsController_getErrorCodesByCategory_v1',
  });
}

/**
 * 获取 JSON 格式错误码文档
 * @description 返回 JSON 格式的完整错误码文档，包含分类和详细说明
 */
export function fetchDocsGetErrorCodesJson(): Promise<unknown> {
  return apiRequest<unknown>({
    method: 'GET',
    url: '/api/v1/system/docs/error-codes/json',
    operationId: 'DocsController_getErrorCodesJson_v1',
  });
}

/**
 * 获取 Markdown 格式错误码文档
 * @description 返回 Markdown 格式的完整错误码文档，可用于生成文档
 */
export function fetchDocsGetErrorCodesMarkdown(): Promise<unknown> {
  return apiRequest<unknown>({
    method: 'GET',
    url: '/api/v1/system/docs/error-codes/markdown',
    operationId: 'DocsController_getErrorCodesMarkdown_v1',
  });
}
