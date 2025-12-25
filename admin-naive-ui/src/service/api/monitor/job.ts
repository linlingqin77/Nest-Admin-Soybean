import { request } from '@/service/request';

/** 获取定时任务列表 */
export function fetchGetJobList(params?: Api.Monitor.JobSearchParams) {
  return request<Api.Monitor.JobList>({
    url: '/monitor/job/list',
    method: 'get',
    params,
  });
}

/** 获取定时任务详情 */
export function fetchGetJobDetail(jobId: CommonType.IdType) {
  return request<Api.Monitor.Job>({
    url: `/monitor/job/${jobId}`,
    method: 'get',
  });
}

/** 新增定时任务 */
export function fetchCreateJob(data: Api.Monitor.JobOperateParams) {
  return request<boolean>({
    url: '/monitor/job',
    method: 'post',
    data,
  });
}

/** 修改定时任务 */
export function fetchUpdateJob(data: Api.Monitor.JobOperateParams) {
  return request<boolean>({
    url: '/monitor/job',
    method: 'put',
    data,
  });
}

/** 删除定时任务 */
export function fetchDeleteJob(jobId: CommonType.IdType | CommonType.IdType[]) {
  return request<boolean>({
    url: `/monitor/job/${Array.isArray(jobId) ? jobId.join(',') : jobId}`,
    method: 'delete',
  });
}

/** 修改定时任务状态 */
export function fetchChangeJobStatus(jobId: CommonType.IdType, status: Api.Common.EnableStatus) {
  return request<boolean>({
    url: '/monitor/job/changeStatus',
    method: 'put',
    data: { jobId, status },
  });
}

/** 立即执行一次定时任务 */
export function fetchRunJob(jobId: CommonType.IdType, jobGroup: string) {
  return request<boolean>({
    url: '/monitor/job/run',
    method: 'put',
    data: { jobId, jobGroup },
  });
}
