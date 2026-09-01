import { request } from '@/service/request';

/** 历史记录列表 */
export function fetchHistoryList(params?: Api.Tool.GenHistorySearchParams) {
  return request<Api.Tool.GenHistoryList>({
    url: '/tool/gen/history/list',
    method: 'get',
    params
  });
}

/** 历史记录详情 */
export function fetchHistoryFindOne(id: CommonType.IdType) {
  return request<Api.Tool.GenHistory>({
    url: `/tool/gen/history/${id}`,
    method: 'get'
  });
}

/** 下载历史版本代码 */
export function fetchHistoryDownload(id: CommonType.IdType) {
  return request<Blob, 'blob'>({
    url: `/tool/gen/history/${id}/download`,
    method: 'get',
    responseType: 'blob'
  });
}

/** 删除历史记录 */
export function fetchHistoryDelete(id: CommonType.IdType) {
  return request<void>({
    url: `/tool/gen/history/${id}`,
    method: 'delete'
  });
}

/** 批量删除历史记录 */
export function fetchHistoryBatchDelete(ids: number[]) {
  return request<void>({
    url: '/tool/gen/history/batch',
    method: 'delete',
    data: { ids }
  });
}

/** 清理过期历史记录 */
export function fetchHistoryCleanup(days?: number) {
  return request<{ deletedCount: number }>({
    url: '/tool/gen/history/cleanup',
    method: 'post',
    data: { days }
  });
}
