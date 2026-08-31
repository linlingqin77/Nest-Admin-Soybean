/**
 * @generated
 * Tag: 租户审计日志
 * Generated at: 2026-08-31T03:40:43.887Z
 */

/* eslint-disable */
import { apiRequest, buildUrl } from '@/service/request-adapter';
import type * as Types from '../types';

// ── Tag: 租户审计日志 ────────────────────────────────────────────────

// Referenced types: ExportTenantAuditLogRequestDto

/**
 * 审计日志详情
 * @description 获取单条审计日志的详细信息，包含操作前后数据变化
 */
export function fetchTenantAuditFindOne(id: string): Promise<unknown> {
  return apiRequest<unknown>({
    method: 'GET',
    url: buildUrl('/api/v1/system/tenant/audit/{id}', { id: id }),
    operationId: 'TenantAuditController_findOne_v1',
  });
}

/**
 * 导出审计日志
 * @description 导出审计日志为Excel格式
 */
export function fetchTenantAuditExport(body: ExportTenantAuditLogRequestDto): Promise<unknown> {
  return apiRequest<unknown>({
    method: 'POST',
    url: '/api/v1/system/tenant/audit/export',
    data: body,
    operationId: 'TenantAuditController_export_v1',
  });
}

/**
 * 审计日志列表
 * @description 分页查询所有租户的审计日志
 */
export function fetchTenantAuditFindAll(pageNum?: number, pageSize?: number, orderByColumn?: string, isAsc?: 'asc' | 'desc', params?: DateRangeDto, tenantId?: string, operatorName?: string, actionType?: 'login' | 'logout' | 'create' | 'update' | 'delete' | 'permission_change' | 'config_change' | 'export' | 'other', module?: string, beginTime?: string, endTime?: string): Promise<unknown> {
  return apiRequest<unknown>({
    method: 'GET',
    url: '/api/v1/system/tenant/audit/list',
    params: {
      pageNum: pageNum ?? undefined,
      pageSize: pageSize ?? undefined,
      orderByColumn: orderByColumn ?? undefined,
      isAsc: isAsc ?? undefined,
      params: params ?? undefined,
      tenantId: tenantId ?? undefined,
      operatorName: operatorName ?? undefined,
      actionType: actionType ?? undefined,
      module: module ?? undefined,
      beginTime: beginTime ?? undefined,
      endTime: endTime ?? undefined
    },
    operationId: 'TenantAuditController_findAll_v1',
  });
}

/**
 * 审计日志统计
 * @description 获取审计日志统计数据
 */
export function fetchTenantAuditGetStats(tenantId: string): Promise<unknown> {
  return apiRequest<unknown>({
    method: 'GET',
    url: '/api/v1/system/tenant/audit/stats/summary',
    params: {
      tenantId: tenantId
    },
    operationId: 'TenantAuditController_getStats_v1',
  });
}
