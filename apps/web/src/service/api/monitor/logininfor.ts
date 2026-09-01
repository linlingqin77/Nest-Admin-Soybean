import { request } from '@/service/request';

/** 登录日志列表 */
export function fetchLogininforFindAll(params?: Api.Monitor.LoginInforSearchParams) {
  return request<Api.Monitor.LoginInforList>({
    url: '/monitor/logininfor/list',
    method: 'get',
    params
  });
}

/** 删除登录日志 */
export function fetchLogininforRemove(id: CommonType.IdType) {
  return request<void>({
    url: `/monitor/logininfor/${id}`,
    method: 'delete'
  });
}

/** 清除全部登录日志 */
export function fetchLogininforClean() {
  return request<void>({
    url: '/monitor/logininfor/clean',
    method: 'delete'
  });
}

/** 清除全部登录日志 (alias) */
export const fetchLogininforRemoveAll = fetchLogininforClean;

/** 解锁用户 */
export function fetchLogininforUnlock(username: string) {
  return request<void>({
    url: `/monitor/logininfor/unlock/${username}`,
    method: 'get'
  });
}

/** 导出登录日志 */
export function fetchLogininforExport(params?: Api.Monitor.LoginInforSearchParams) {
  return request<Blob, 'blob'>({
    url: '/monitor/logininfor/export',
    method: 'post',
    params,
    responseType: 'blob'
  });
}
