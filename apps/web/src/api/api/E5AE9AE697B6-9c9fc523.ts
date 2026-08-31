/**
 * @generated
 * Tag: 定时任务管理
 * Generated at: 2026-08-31T03:40:43.884Z
 */

/* eslint-disable */
import { apiRequest, buildUrl } from '@/service/request-adapter';
import type * as Types from '../types';

// ── Tag: 定时任务管理 ────────────────────────────────────────────────

// Referenced types: CreateJobDto, ListJobDto

/**
 * 创建定时任务
 * @description 新增定时任务
 */
export function fetchJobAdd(body: CreateJobDto): Promise<unknown> {
  return apiRequest<unknown>({
    method: 'POST',
    url: '/api/v1/monitor/job',
    data: body,
    operationId: 'JobController_add_v1',
  });
}

/**
 * 修改定时任务
 * @description 更新定时任务信息
 */
export function fetchJobUpdate(): Promise<unknown> {
  return apiRequest<unknown>({
    method: 'PUT',
    url: '/api/v1/monitor/job',
    operationId: 'JobController_update_v1',
  });
}

/**
 * 获取定时任务详情
 * @description 根据任务ID获取定时任务详细信息
 */
export function fetchJobGetInfo(jobId: number): Promise<unknown> {
  return apiRequest<unknown>({
    method: 'GET',
    url: buildUrl('/api/v1/monitor/job/{jobId}', { jobId: jobId }),
    operationId: 'JobController_getInfo_v1',
  });
}

/**
 * 删除定时任务
 * @description 批量删除定时任务，多个ID用逗号分隔
 */
export function fetchJobRemove(jobIds: string): Promise<unknown> {
  return apiRequest<unknown>({
    method: 'DELETE',
    url: buildUrl('/api/v1/monitor/job/{jobIds}', { jobIds: jobIds }),
    operationId: 'JobController_remove_v1',
  });
}

/**
 * 修改任务状态
 * @description 启用或停用定时任务
 */
export function fetchJobChangeStatus(): Promise<unknown> {
  return apiRequest<unknown>({
    method: 'PUT',
    url: '/api/v1/monitor/job/changeStatus',
    operationId: 'JobController_changeStatus_v1',
  });
}

/**
 * 导出定时任务Excel
 * @description 导出定时任务数据为xlsx文件
 */
export function fetchJobExport(body: ListJobDto): Promise<unknown> {
  return apiRequest<unknown>({
    method: 'POST',
    url: '/api/v1/monitor/job/export',
    data: body,
    operationId: 'JobController_export_v1',
  });
}

/**
 * 获取定时任务列表
 * @description 分页查询定时任务列表
 */
export function fetchJobList(pageNum?: number, pageSize?: number, orderByColumn?: string, isAsc?: 'asc' | 'desc', params?: DateRangeDto, jobName?: string, jobGroup?: string, status?: string): Promise<unknown> {
  return apiRequest<unknown>({
    method: 'GET',
    url: '/api/v1/monitor/job/list',
    params: {
      pageNum: pageNum ?? undefined,
      pageSize: pageSize ?? undefined,
      orderByColumn: orderByColumn ?? undefined,
      isAsc: isAsc ?? undefined,
      params: params ?? undefined,
      jobName: jobName ?? undefined,
      jobGroup: jobGroup ?? undefined,
      status: status ?? undefined
    },
    operationId: 'JobController_list_v1',
  });
}

/**
 * 立即执行一次
 * @description 手动触发定时任务执行
 */
export function fetchJobRun(): Promise<unknown> {
  return apiRequest<unknown>({
    method: 'PUT',
    url: '/api/v1/monitor/job/run',
    operationId: 'JobController_run_v1',
  });
}
