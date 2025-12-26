/**
 * API 版本管理
 * @description 统一管理项目 API 版本号
 */
export const API_VERSION = {
  /** 当前 API 版本 */
  CURRENT: 'v1',

  /** API 版本号 */
  V1: 'v1',
  V2: 'v2',

  /** 默认 API 前缀 */
  PREFIX: '/api',
} as const;

/**
 * 获取完整的 API 路径
 * @param path API 路径
 * @param version API 版本，默认使用当前版本
 */
export function getApiPath(path: string, version: string = API_VERSION.CURRENT): string {
  return `${API_VERSION.PREFIX}/${version}${path}`;
}

// Re-export for backward compatibility
export type { VersionOptions } from '../types/decorator';
