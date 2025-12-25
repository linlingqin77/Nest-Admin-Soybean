import { request } from '@/service/request';

/** 获取调度日志列表 */
export function fetchGetJobLogList(params?: Api.Monitor.JobLogSearchParams) {
  return request<Api.Monitor.JobLogList>({
    url: '/monitor/jobLog/list',
    method: 'get',
    params,
  });
}

/** 获取调度日志详情 */
export function fetchGetJobLogDetail(jobLogId: CommonType.IdType) {
  return request<Api.Monitor.JobLog>({
    url: `/monitor/jobLog/${jobLogId}`,
    method: 'get',
  });
}

/** 删除调度日志 */
export function fetchDeleteJobLog(jobLogId: CommonType.IdType | CommonType.IdType[]) {
  return request<boolean>({
    url: `/monitor/jobLog/${Array.isArray(jobLogId) ? jobLogId.join(',') : jobLogId}`,
    method: 'delete',
  });
}

/** 清空调度日志 */
export function fetchCleanJobLog() {
  return request<boolean>({
    url: '/monitor/jobLog/clean',
    method: 'delete',
  });
}
