/**
 * @generated
 * Tag: 应用信息
 * Generated at: 2026-08-31T03:40:43.885Z
 */

/* eslint-disable */
import { apiRequest, buildUrl } from '@/service/request-adapter';
import type * as Types from '../types';

// ── Tag: 应用信息 ────────────────────────────────────────────────

/**
 * 获取应用信息
 */
export function fetchInfoGetInfo(): Promise<unknown> {
  return apiRequest<unknown>({
    method: 'GET',
    url: '/api/v1/info',
    operationId: 'InfoController_getInfo_v1',
  });
}
