/**
 * @generated
 * Tag: 系统监控-在线用户
 * Generated at: 2026-08-31T03:40:43.887Z
 */

/* eslint-disable */
import { apiRequest, buildUrl } from '@/service/request-adapter';
import type * as Types from '../types';

// ── Tag: 系统监控-在线用户 ────────────────────────────────────────────────

/**
 * 在线用户-强退
 * @description 强制用户下线
 */
export function fetchOnlineDelete(token: string): Promise<unknown> {
  return apiRequest<unknown>({
    method: 'DELETE',
    url: buildUrl('/api/v1/monitor/online/{token}', { token: token }),
    operationId: 'OnlineController_delete_v1',
  });
}

/**
 * 在线用户-列表
 * @description 查询当前在线用户列表
 */
export function fetchOnlineFindAll(pageNum?: string, pageSize?: string, ipaddr?: string, userName?: string): Promise<unknown> {
  return apiRequest<unknown>({
    method: 'GET',
    url: '/api/v1/monitor/online/list',
    params: {
      pageNum: pageNum ?? undefined,
      pageSize: pageSize ?? undefined,
      ipaddr: ipaddr ?? undefined,
      userName: userName ?? undefined
    },
    operationId: 'OnlineController_findAll_v1',
  });
}
