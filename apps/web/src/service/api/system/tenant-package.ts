import { request } from '@/service/request';

/** 租户套餐列表 */
export function fetchTenantPackageFindAll(params?: Api.System.TenantPackageSearchParams) {
  return request<Api.System.TenantPackageList>({
    url: '/system/tenant/package/list',
    method: 'get',
    params
  });
}

/** 租户套餐详情 */
export function fetchTenantPackageFindOne(id: CommonType.IdType) {
  return request<Api.System.TenantPackage>({
    url: `/system/tenant/package/${id}`,
    method: 'get'
  });
}

/** 创建租户套餐 */
export function fetchTenantPackageCreate(data: Api.System.TenantPackageOperateParams) {
  return request<void>({
    url: '/system/tenant/package/',
    method: 'post',
    data
  });
}

/** 更新租户套餐 */
export function fetchTenantPackageUpdate(data: Api.System.TenantPackageOperateParams) {
  return request<void>({
    url: '/system/tenant/package/',
    method: 'put',
    data
  });
}

/** 删除租户套餐 */
export function fetchTenantPackageRemove(ids: CommonType.IdType | string) {
  return request<void>({
    url: `/system/tenant/package/${ids}`,
    method: 'delete'
  });
}

/** 租户套餐选择列表 */
export function fetchTenantPackageSelectList() {
  return request<Api.System.TenantPackage[]>({
    url: '/system/tenant/package/selectList',
    method: 'get'
  });
}

/** 修改租户套餐状态 */
export function fetchUpdateTenantPackageStatus(data: {
  packageId: CommonType.IdType;
  status: Api.Common.EnableStatus;
}) {
  return request<boolean>({
    url: '/system/tenant/package/changeStatus',
    method: 'put',
    data
  });
}

/** 导出租户套餐 */
export function fetchTenantPackageExport(params?: Api.System.TenantPackageSearchParams) {
  return request<Blob, 'blob'>({
    url: '/system/tenant/package/export',
    method: 'post',
    params,
    responseType: 'blob'
  });
}
