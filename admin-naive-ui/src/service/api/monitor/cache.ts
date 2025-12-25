import { request } from '@/service/request';

// ===================== 缓存监控 =====================

/** 获取缓存监控信息 */
export function fetchGetMonitorCacheInfo() {
  return request<Api.Monitor.CacheInfo>({
    url: '/monitor/cache',
    method: 'get',
  });
}

// ===================== 缓存列表 =====================

/** 获取缓存名称列表 */
export function fetchGetCacheNames() {
  return request<Api.Monitor.CacheName[]>({
    url: '/monitor/cache/getNames',
    method: 'get',
  });
}

/** 获取缓存键名列表 */
export function fetchGetCacheKeys(cacheName: string) {
  return request<string[]>({
    url: `/monitor/cache/getKeys/${cacheName}`,
    method: 'get',
  });
}

/** 获取缓存内容 */
export function fetchGetCacheValue(cacheName: string, cacheKey: string) {
  return request<Api.Monitor.CacheContent>({
    url: `/monitor/cache/getValue/${cacheName}/${cacheKey}`,
    method: 'get',
  });
}

/** 清理指定名称缓存 */
export function fetchClearCacheName(cacheName: string) {
  return request<void>({
    url: `/monitor/cache/clearCacheName/${cacheName}`,
    method: 'delete',
  });
}

/** 清理指定键名缓存 */
export function fetchClearCacheKey(cacheKey: string) {
  return request<void>({
    url: `/monitor/cache/clearCacheKey/${cacheKey}`,
    method: 'delete',
  });
}

/** 清理全部缓存 */
export function fetchClearCacheAll() {
  return request<void>({
    url: '/monitor/cache/clearCacheAll',
    method: 'delete',
  });
}
