import { request } from '@/service/request';

/** 参数配置列表 */
export function fetchConfigFindAll(params?: Api.System.ConfigSearchParams) {
  return request<Api.System.ConfigList>({
    url: '/system/config/list',
    method: 'get',
    params
  });
}

/** 参数配置详情 */
export function fetchConfigFindOne(id: CommonType.IdType) {
  return request<Api.System.Config>({
    url: `/system/config/${id}`,
    method: 'get'
  });
}

/** 创建参数配置 */
export function fetchConfigCreate(data: Api.System.ConfigOperateParams) {
  return request<void>({
    url: '/system/config',
    method: 'post',
    data
  });
}

/** 更新参数配置 */
export function fetchConfigUpdate(data: Api.System.ConfigOperateParams) {
  return request<void>({
    url: '/system/config',
    method: 'put',
    data
  });
}

/** 删除参数配置 */
export function fetchConfigRemove(id: CommonType.IdType) {
  return request<void>({
    url: `/system/config/${id}`,
    method: 'delete'
  });
}

/** 根据参数键名查询参数值 */
export function fetchGetConfigByKey(configKey: string) {
  return request<string>({
    url: `/system/config/configKey/${configKey}`,
    method: 'get'
  });
}

/** 根据参数键名修改参数值 */
export function fetchUpdateConfigByKey(configKey: string, configValue: string) {
  return request<boolean>({
    url: '/system/config/updateByKey',
    method: 'put',
    data: { configKey, configValue }
  });
}

/** 刷新参数缓存 */
export function fetchConfigRefreshCache() {
  return request<void>({
    url: '/system/config/refreshCache',
    method: 'delete'
  });
}

/** 导出参数配置 */
export function fetchConfigExport(params?: Api.System.ConfigSearchParams) {
  return request<Blob, 'blob'>({
    url: '/system/config/export',
    method: 'post',
    params,
    responseType: 'blob'
  });
}
