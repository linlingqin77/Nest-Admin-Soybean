import { request } from '@/service/request';

/** 操作日志列表 */
export function fetchOperlogFindAll(params?: Api.Monitor.OperLogSearchParams) {
  return request<Api.Monitor.OperLogList>({
    url: '/monitor/operlog/list',
    method: 'get',
    params
  });
}

/** 操作日志详情 */
export function fetchOperlogFindOne(operId: CommonType.IdType) {
  return request<Api.Monitor.OperLog>({
    url: `/monitor/operlog/${operId}`,
    method: 'get'
  });
}

/** 删除操作日志 */
export function fetchOperlogRemove(operId: CommonType.IdType) {
  return request<void>({
    url: `/monitor/operlog/${operId}`,
    method: 'delete'
  });
}

/** 清除全部操作日志 */
export function fetchOperlogClean() {
  return request<void>({
    url: '/monitor/operlog/clean',
    method: 'delete'
  });
}

/** 导出操作日志 */
export function fetchOperlogExport(params?: Api.Monitor.OperLogSearchParams) {
  return request<Blob, 'blob'>({
    url: '/monitor/operlog/export',
    method: 'post',
    params,
    responseType: 'blob'
  });
}
