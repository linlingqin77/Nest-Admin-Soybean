/**
 * @generated
 * Tag: 租户管理
 * Generated at: 2026-08-31T03:40:43.887Z
 */

/* eslint-disable */
import { apiRequest, buildUrl } from '@/service/request-adapter';
import type * as Types from '../types';

// ── Tag: 租户管理 ────────────────────────────────────────────────

// Referenced types: CreateTenantRequestDto, ListTenantRequestDto, UpdateTenantRequestDto

/**
 * 租户管理-创建
 * @description 创建新租户并创建租户管理员账号
 */
export function fetchTenantCreate(body: CreateTenantRequestDto): Promise<unknown> {
  return apiRequest<unknown>({
    method: 'POST',
    url: '/api/v1/system/tenant',
    data: body,
    operationId: 'TenantController_create_v1',
  });
}

/**
 * 租户管理-更新
 * @description 修改租户信息
 */
export function fetchTenantUpdate(body: UpdateTenantRequestDto): Promise<unknown> {
  return apiRequest<unknown>({
    method: 'PUT',
    url: '/api/v1/system/tenant',
    data: body,
    operationId: 'TenantController_update_v1',
  });
}

/**
 * 租户管理-详情
 * @description 根据ID获取租户详情
 */
export function fetchTenantFindOne(id: number): Promise<unknown> {
  return apiRequest<unknown>({
    method: 'GET',
    url: buildUrl('/api/v1/system/tenant/{id}', { id: id }),
    operationId: 'TenantController_findOne_v1',
  });
}

/**
 * 租户管理-删除
 * @description 批量删除租户
 */
export function fetchTenantRemove(ids: string): Promise<unknown> {
  return apiRequest<unknown>({
    method: 'DELETE',
    url: buildUrl('/api/v1/system/tenant/{ids}', { ids: ids }),
    operationId: 'TenantController_remove_v1',
  });
}

/**
 * 租户管理-切换租户
 * @description 切换到指定租户（仅超级管理员可用）
 */
export function fetchTenantSwitchTenant(tenantId: string): Promise<unknown> {
  return apiRequest<unknown>({
    method: 'GET',
    url: buildUrl('/api/v1/system/tenant/dynamic/{tenantId}', { tenantId: tenantId }),
    operationId: 'TenantController_switchTenant_v1',
  });
}

/**
 * 租户管理-恢复原租户
 * @description 清除租户切换状态，恢复到原租户
 */
export function fetchTenantRestoreTenant(): Promise<unknown> {
  return apiRequest<unknown>({
    method: 'GET',
    url: '/api/v1/system/tenant/dynamic/clear',
    operationId: 'TenantController_restoreTenant_v1',
  });
}

/**
 * 租户管理-导出
 * @description 导出租户数据为Excel文件
 */
export function fetchTenantExport(body: ListTenantRequestDto): Promise<unknown> {
  return apiRequest<unknown>({
    method: 'POST',
    url: '/api/v1/system/tenant/export',
    data: body,
    operationId: 'TenantController_export_v1',
  });
}

/**
 * 租户管理-列表
 * @description 分页查询租户列表
 */
export function fetchTenantFindAll(pageNum?: number, pageSize?: number, orderByColumn?: string, isAsc?: 'asc' | 'desc', params?: DateRangeDto, tenantId?: string, contactUserName?: string, contactPhone?: string, companyName?: string, status?: string, beginTime?: string, endTime?: string): Promise<unknown> {
  return apiRequest<unknown>({
    method: 'GET',
    url: '/api/v1/system/tenant/list',
    params: {
      pageNum: pageNum ?? undefined,
      pageSize: pageSize ?? undefined,
      orderByColumn: orderByColumn ?? undefined,
      isAsc: isAsc ?? undefined,
      params: params ?? undefined,
      tenantId: tenantId ?? undefined,
      contactUserName: contactUserName ?? undefined,
      contactPhone: contactPhone ?? undefined,
      companyName: companyName ?? undefined,
      status: status ?? undefined,
      beginTime: beginTime ?? undefined,
      endTime: endTime ?? undefined
    },
    operationId: 'TenantController_findAll_v1',
  });
}

/**
 * 租户管理-可切换租户列表
 * @description 获取可切换的租户列表（仅超级管理员可用）
 */
export function fetchTenantGetSelectList(): Promise<unknown> {
  return apiRequest<unknown>({
    method: 'GET',
    url: '/api/v1/system/tenant/select-list',
    operationId: 'TenantController_getSelectList_v1',
  });
}

/**
 * 租户管理-获取切换状态
 * @description 获取当前租户切换状态
 */
export function fetchTenantGetSwitchStatus(): Promise<unknown> {
  return apiRequest<unknown>({
    method: 'GET',
    url: '/api/v1/system/tenant/switch-status',
    operationId: 'TenantController_getSwitchStatus_v1',
  });
}

/**
 * 租户管理-同步租户配置
 * @description 将超级管理员的配置同步到所有租户
 */
export function fetchTenantSyncTenantConfig(): Promise<unknown> {
  return apiRequest<unknown>({
    method: 'GET',
    url: '/api/v1/system/tenant/syncTenantConfig',
    operationId: 'TenantController_syncTenantConfig_v1',
  });
}

/**
 * 租户管理-同步租户字典
 * @description 将超级管理员的字典数据同步到所有租户
 */
export function fetchTenantSyncTenantDict(): Promise<unknown> {
  return apiRequest<unknown>({
    method: 'GET',
    url: '/api/v1/system/tenant/syncTenantDict',
    operationId: 'TenantController_syncTenantDict_v1',
  });
}

/**
 * 租户管理-同步租户套餐
 * @description 同步租户套餐菜单权限
 */
export function fetchTenantSyncTenantPackage(tenantId: string, packageId: number): Promise<unknown> {
  return apiRequest<unknown>({
    method: 'GET',
    url: '/api/v1/system/tenant/syncTenantPackage',
    params: {
      tenantId: tenantId,
      packageId: packageId
    },
    operationId: 'TenantController_syncTenantPackage_v1',
  });
}
