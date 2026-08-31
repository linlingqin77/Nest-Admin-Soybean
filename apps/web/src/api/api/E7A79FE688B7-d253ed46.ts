/**
 * @generated
 * Tag: 租户配额管理
 * Generated at: 2026-08-31T03:40:43.887Z
 */

/* eslint-disable */
import { apiRequest, buildUrl } from '@/service/request-adapter';
import type * as Types from '../types';

// ── Tag: 租户配额管理 ────────────────────────────────────────────────

// Referenced types: CheckQuotaRequestDto, UpdateTenantQuotaRequestDto

/**
 * 更新租户配额
 * @description 修改租户的配额限制值
 */
export function fetchTenantQuotaUpdate(body: UpdateTenantQuotaRequestDto): Promise<unknown> {
  return apiRequest<unknown>({
    method: 'PUT',
    url: '/api/v1/system/tenant/quota',
    data: body,
    operationId: 'TenantQuotaController_update_v1',
  });
}

/**
 * 租户配额详情
 * @description 获取单个租户的配额详情，包含变更历史
 */
export function fetchTenantQuotaFindOne(tenantId: string): Promise<unknown> {
  return apiRequest<unknown>({
    method: 'GET',
    url: buildUrl('/api/v1/system/tenant/quota/{tenantId}', { tenantId: tenantId }),
    operationId: 'TenantQuotaController_findOne_v1',
  });
}

/**
 * 检查配额
 * @description 检查指定租户的配额是否允许操作
 */
export function fetchTenantQuotaCheckQuota(body: CheckQuotaRequestDto): Promise<unknown> {
  return apiRequest<unknown>({
    method: 'POST',
    url: '/api/v1/system/tenant/quota/check',
    data: body,
    operationId: 'TenantQuotaController_checkQuota_v1',
  });
}

/**
 * 租户配额列表
 * @description 分页查询所有租户的配额使用情况
 */
export function fetchTenantQuotaFindAll(pageNum?: number, pageSize?: number, orderByColumn?: string, isAsc?: 'asc' | 'desc', params?: DateRangeDto, tenantId?: string, companyName?: string, status?: 'normal' | 'warning' | 'danger'): Promise<unknown> {
  return apiRequest<unknown>({
    method: 'GET',
    url: '/api/v1/system/tenant/quota/list',
    params: {
      pageNum: pageNum ?? undefined,
      pageSize: pageSize ?? undefined,
      orderByColumn: orderByColumn ?? undefined,
      isAsc: isAsc ?? undefined,
      params: params ?? undefined,
      tenantId: tenantId ?? undefined,
      companyName: companyName ?? undefined,
      status: status ?? undefined
    },
    operationId: 'TenantQuotaController_findAll_v1',
  });
}
