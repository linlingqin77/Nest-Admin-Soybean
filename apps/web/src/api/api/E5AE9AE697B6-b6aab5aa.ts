/**
 * @generated
 * Tag: 定时任务日志管理
 * Generated at: 2026-08-31T03:40:43.884Z
 */

/* eslint-disable */
import { apiRequest, buildUrl } from '@/service/request-adapter';
import type * as Types from '../types';

// ── Tag: 定时任务日志管理 ────────────────────────────────────────────────

// Referenced types: ListJobLogDto

/**
 * 清空定时任务日志
 * @description 清除所有定时任务执行日志
 */
export function fetchJobLogClean(): Promise<unknown> {
  return apiRequest<unknown>({
    method: 'DELETE',
    url: '/api/v1/monitor/jobLog/clean',
    operationId: 'JobLogController_clean_v1',
  });
}

/**
 * 导出调度日志Excel
 * @description 导出定时任务执行日志为xlsx文件
 */
export function fetchJobLogExport(body: ListJobLogDto): Promise<unknown> {
  return apiRequest<unknown>({
    method: 'POST',
    url: '/api/v1/monitor/jobLog/export',
    data: body,
    operationId: 'JobLogController_export_v1',
  });
}

/**
 * 获取定时任务日志列表
 * @description 分页查询定时任务执行日志
 */
export function fetchJobLogList(pageNum?: number, pageSize?: number, orderByColumn?: string, isAsc?: 'asc' | 'desc', params?: DateRangeDto, jobName?: string, jobGroup?: string, status?: string): Promise<unknown> {
  return apiRequest<unknown>({
    method: 'GET',
    url: '/api/v1/monitor/jobLog/list',
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
    operationId: 'JobLogController_list_v1',
  });
}
