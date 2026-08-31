/**
 * @generated
 * Tag: 系统监控-服务监控
 * Generated at: 2026-08-31T03:40:43.888Z
 */

/* eslint-disable */
import { apiRequest, buildUrl } from '@/service/request-adapter';
import type * as Types from '../types';

// ── Tag: 系统监控-服务监控 ────────────────────────────────────────────────

/**
 * 服务器信息
 * @description 获取服务器CPU、内存、系统等监控信息
 */
export function fetchServerGetInfo(): Promise<unknown> {
  return apiRequest<unknown>({
    method: 'GET',
    url: '/api/v1/monitor/server',
    operationId: 'ServerController_getInfo_v1',
  });
}
