/**
 * @generated
 * Tag: 生成历史管理
 * Generated at: 2026-08-31T03:40:43.886Z
 */

/* eslint-disable */
import { apiRequest, buildUrl } from '@/service/request-adapter';
import type * as Types from '../types';

// ── Tag: 生成历史管理 ────────────────────────────────────────────────

/**
 * 删除历史记录
 * @description 删除指定的历史记录
 */
export function fetchHistoryDelete(id: number): Promise<unknown> {
  return apiRequest<unknown>({
    method: 'DELETE',
    url: buildUrl('/api/v1/tool/gen/history/{id}', { id: id }),
    operationId: 'HistoryController_delete_v1',
  });
}

/**
 * 查询历史记录详情
 * @description 根据ID查询历史记录详情，包含生成的代码快照
 */
export function fetchHistoryFindOne(id: number): Promise<unknown> {
  return apiRequest<unknown>({
    method: 'GET',
    url: buildUrl('/api/v1/tool/gen/history/{id}', { id: id }),
    operationId: 'HistoryController_findOne_v1',
  });
}

/**
 * 下载历史版本代码
 * @description 下载指定历史版本的生成代码（ZIP格式）
 */
export function fetchHistoryDownload(id: number): Promise<unknown> {
  return apiRequest<unknown>({
    method: 'GET',
    url: buildUrl('/api/v1/tool/gen/history/{id}/download', { id: id }),
    operationId: 'HistoryController_download_v1',
  });
}

/**
 * 批量删除历史记录
 * @description 批量删除多条历史记录
 */
export function fetchHistoryBatchDelete(body: unknown): Promise<unknown> {
  return apiRequest<unknown>({
    method: 'DELETE',
    url: '/api/v1/tool/gen/history/batch',
    data: body,
    operationId: 'HistoryController_batchDelete_v1',
  });
}

/**
 * 清理过期历史记录
 * @description 清理指定天数之前的历史记录（默认30天）
 */
export function fetchHistoryCleanup(days?: number): Promise<unknown> {
  return apiRequest<unknown>({
    method: 'POST',
    url: '/api/v1/tool/gen/history/cleanup',
    params: {
      days: days ?? undefined
    },
    operationId: 'HistoryController_cleanup_v1',
  });
}

/**
 * 查询历史记录列表
 * @description 分页查询代码生成历史记录列表
 */
export function fetchHistoryList(tableId?: number, tableName?: string, pageNum?: number, pageSize?: number): Promise<unknown> {
  return apiRequest<unknown>({
    method: 'GET',
    url: '/api/v1/tool/gen/history/list',
    params: {
      tableId: tableId ?? undefined,
      tableName: tableName ?? undefined,
      pageNum: pageNum ?? undefined,
      pageSize: pageSize ?? undefined
    },
    operationId: 'HistoryController_list_v1',
  });
}
