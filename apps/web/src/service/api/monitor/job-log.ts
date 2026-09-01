import { request } from '@/service/request';

/** 调度日志列表 */
export function fetchJobLogFindAll(params?: Api.Monitor.JobLogSearchParams) {
  return request<Api.Monitor.JobLogList>({
    url: '/monitor/jobLog/list',
    method: 'get',
    params
  });
}

/** 删除调度日志 */
export function fetchDeleteJobLog(jobLogId: CommonType.IdType | CommonType.IdType[]) {
  return request<boolean>({
    url: `/monitor/jobLog/${Array.isArray(jobLogId) ? jobLogId.join(',') : jobLogId}`,
    method: 'delete'
  });
}

/** 清空调度日志 */
export function fetchJobLogClean() {
  return request<void>({
    url: '/monitor/jobLog/clean',
    method: 'delete'
  });
}

/** 导出调度日志 */
export function fetchJobLogExport(params?: Api.Monitor.JobLogSearchParams) {
  return request<Blob, 'blob'>({
    url: '/monitor/jobLog/export',
    method: 'post',
    params,
    responseType: 'blob'
  });
}
