/**
 * @generated
 * Tag: 租户套餐管理
 * Generated at: 2026-08-31T03:40:43.886Z
 */

/* eslint-disable */
import { apiRequest, buildUrl } from '@/service/request-adapter';
import type * as Types from '../types';

// ── Tag: 租户套餐管理 ────────────────────────────────────────────────

// Referenced types: CreateTenantPackageRequestDto, ListTenantPackageRequestDto, UpdateTenantPackageRequestDto

/**
 * 租户套餐管理-创建
 * @description 创建新租户套餐
 */
export function fetchTenantPackageCreate(body: CreateTenantPackageRequestDto): Promise<unknown> {
  return apiRequest<unknown>({
    method: 'POST',
    url: '/api/v1/system/tenant/package',
    data: body,
    operationId: 'TenantPackageController_create_v1',
  });
}

/**
 * 租户套餐管理-更新
 * @description 修改租户套餐信息
 */
export function fetchTenantPackageUpdate(body: UpdateTenantPackageRequestDto): Promise<unknown> {
  return apiRequest<unknown>({
    method: 'PUT',
    url: '/api/v1/system/tenant/package',
    data: body,
    operationId: 'TenantPackageController_update_v1',
  });
}

/**
 * 租户套餐管理-详情
 * @description 根据ID获取租户套餐详情
 */
export function fetchTenantPackageFindOne(id: number): Promise<unknown> {
  return apiRequest<unknown>({
    method: 'GET',
    url: buildUrl('/api/v1/system/tenant/package/{id}', { id: id }),
    operationId: 'TenantPackageController_findOne_v1',
  });
}

/**
 * 租户套餐管理-删除
 * @description 批量删除租户套餐
 */
export function fetchTenantPackageRemove(ids: string): Promise<unknown> {
  return apiRequest<unknown>({
    method: 'DELETE',
    url: buildUrl('/api/v1/system/tenant/package/{ids}', { ids: ids }),
    operationId: 'TenantPackageController_remove_v1',
  });
}

/**
 * 租户套餐管理-导出
 * @description 导出租户套餐数据为Excel文件
 */
export function fetchTenantPackageExport(body: ListTenantPackageRequestDto): Promise<unknown> {
  return apiRequest<unknown>({
    method: 'POST',
    url: '/api/v1/system/tenant/package/export',
    data: body,
    operationId: 'TenantPackageController_export_v1',
  });
}

/**
 * 租户套餐管理-列表
 * @description 分页查询租户套餐列表
 */
export function fetchTenantPackageFindAll(pageNum?: number, pageSize?: number, orderByColumn?: string, isAsc?: 'asc' | 'desc', params?: DateRangeDto, packageName?: string, status?: string): Promise<unknown> {
  return apiRequest<unknown>({
    method: 'GET',
    url: '/api/v1/system/tenant/package/list',
    params: {
      pageNum: pageNum ?? undefined,
      pageSize: pageSize ?? undefined,
      orderByColumn: orderByColumn ?? undefined,
      isAsc: isAsc ?? undefined,
      params: params ?? undefined,
      packageName: packageName ?? undefined,
      status: status ?? undefined
    },
    operationId: 'TenantPackageController_findAll_v1',
  });
}

/**
 * 租户套餐管理-选择框列表
 * @description 获取租户套餐选择框列表
 */
export function fetchTenantPackageSelectList(): Promise<unknown> {
  return apiRequest<unknown>({
    method: 'GET',
    url: '/api/v1/system/tenant/package/selectList',
    operationId: 'TenantPackageController_selectList_v1',
  });
}
