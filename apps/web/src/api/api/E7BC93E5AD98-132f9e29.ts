/**
 * @generated
 * Tag: 缓存管理
 * Generated at: 2026-08-31T03:40:43.888Z
 */

/* eslint-disable */
import { apiRequest, buildUrl } from '@/service/request-adapter';
import type * as Types from '../types';

// ── Tag: 缓存管理 ────────────────────────────────────────────────

/**
 * 缓存监控信息
 * @description 获取Redis缓存监控信息
 */
export function fetchCacheGetInfo(): Promise<unknown> {
  return apiRequest<unknown>({
    method: 'GET',
    url: '/api/v1/monitor/cache',
    operationId: 'CacheController_getInfo_v1',
  });
}

/**
 * 清理全部缓存
 * @description 清除所有缓存数据
 */
export function fetchCacheClearCacheAll(): Promise<unknown> {
  return apiRequest<unknown>({
    method: 'DELETE',
    url: '/api/v1/monitor/cache/clearCacheAll',
    operationId: 'CacheController_clearCacheAll_v1',
  });
}

/**
 * 清理缓存键名
 * @description 清除指定的缓存键
 */
export function fetchCacheClearCacheKey(cacheKey: string): Promise<unknown> {
  return apiRequest<unknown>({
    method: 'DELETE',
    url: buildUrl('/api/v1/monitor/cache/clearCacheKey/{cacheKey}', { cacheKey: cacheKey }),
    operationId: 'CacheController_clearCacheKey_v1',
  });
}

/**
 * 清理缓存名称
 * @description 清除指定分类下的所有缓存
 */
export function fetchCacheClearCacheName(cacheName: string): Promise<unknown> {
  return apiRequest<unknown>({
    method: 'DELETE',
    url: buildUrl('/api/v1/monitor/cache/clearCacheName/{cacheName}', { cacheName: cacheName }),
    operationId: 'CacheController_clearCacheName_v1',
  });
}

/**
 * 缓存键名列表
 * @description 根据缓存名称获取所有键名
 */
export function fetchCacheGetKeys(id: string): Promise<unknown> {
  return apiRequest<unknown>({
    method: 'GET',
    url: buildUrl('/api/v1/monitor/cache/getKeys/{id}', { id: id }),
    operationId: 'CacheController_getKeys_v1',
  });
}

/**
 * 缓存名称列表
 * @description 获取所有缓存分类名称
 */
export function fetchCacheGetNames(): Promise<unknown> {
  return apiRequest<unknown>({
    method: 'GET',
    url: '/api/v1/monitor/cache/getNames',
    operationId: 'CacheController_getNames_v1',
  });
}

/**
 * 缓存内容
 * @description 获取指定缓存的内容
 */
export function fetchCacheGetValue(cacheName: string, cacheKey: string): Promise<unknown> {
  return apiRequest<unknown>({
    method: 'GET',
    url: buildUrl('/api/v1/monitor/cache/getValue/{cacheName}/{cacheKey}', { cacheName: cacheName, cacheKey: cacheKey }),
    operationId: 'CacheController_getValue_v1',
  });
}
