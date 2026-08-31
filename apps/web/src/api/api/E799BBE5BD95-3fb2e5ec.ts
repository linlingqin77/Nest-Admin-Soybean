/**
 * @generated
 * Tag: 登录日志
 * Generated at: 2026-08-31T03:40:43.886Z
 */

/* eslint-disable */
import { apiRequest, buildUrl } from '@/service/request-adapter';
import type * as Types from '../types';

// ── Tag: 登录日志 ────────────────────────────────────────────────

// Referenced types: ListLoginlogDto

/**
 * 登录日志-删除日志
 * @description 批量删除登录日志，多个ID用逗号分隔
 */
export function fetchLoginlogRemove(id: string): Promise<unknown> {
  return apiRequest<unknown>({
    method: 'DELETE',
    url: buildUrl('/api/v1/monitor/logininfor/{id}', { id: id }),
    operationId: 'LoginlogController_remove_v1',
  });
}

/**
 * 登录日志-清除全部日志
 * @description 清空所有登录日志记录
 */
export function fetchLoginlogRemoveAll(): Promise<unknown> {
  return apiRequest<unknown>({
    method: 'DELETE',
    url: '/api/v1/monitor/logininfor/clean',
    operationId: 'LoginlogController_removeAll_v1',
  });
}

/**
 * 登录日志-导出Excel
 * @description 导出登录日志数据为xlsx文件
 */
export function fetchLoginlogExport(body: ListLoginlogDto): Promise<unknown> {
  return apiRequest<unknown>({
    method: 'POST',
    url: '/api/v1/monitor/logininfor/export',
    data: body,
    operationId: 'LoginlogController_export_v1',
  });
}

/**
 * 登录日志-列表
 * @description 分页查询登录日志列表
 */
export function fetchLoginlogFindAll(pageNum?: number, pageSize?: number, orderByColumn?: string, isAsc?: 'asc' | 'desc', params?: DateRangeDto, ipaddr?: string, userName?: string, status?: StatusEnum): Promise<unknown> {
  return apiRequest<unknown>({
    method: 'GET',
    url: '/api/v1/monitor/logininfor/list',
    params: {
      pageNum: pageNum ?? undefined,
      pageSize: pageSize ?? undefined,
      orderByColumn: orderByColumn ?? undefined,
      isAsc: isAsc ?? undefined,
      params: params ?? undefined,
      ipaddr: ipaddr ?? undefined,
      userName: userName ?? undefined,
      status: status ?? undefined
    },
    operationId: 'LoginlogController_findAll_v1',
  });
}

/**
 * 登录日志-解锁用户
 * @description 解锁被锁定的用户账号
 */
export function fetchLoginlogUnlock(username: string): Promise<unknown> {
  return apiRequest<unknown>({
    method: 'GET',
    url: buildUrl('/api/v1/monitor/logininfor/unlock/{username}', { username: username }),
    operationId: 'LoginlogController_unlock_v1',
  });
}
