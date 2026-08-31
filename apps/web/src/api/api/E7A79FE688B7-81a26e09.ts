/**
 * @generated
 * Tag: 租户仪表盘
 * Generated at: 2026-08-31T03:40:43.886Z
 */

/* eslint-disable */
import { apiRequest, buildUrl } from '@/service/request-adapter';
import type * as Types from '../types';

// ── Tag: 租户仪表盘 ────────────────────────────────────────────────

/**
 * 租户仪表盘-完整数据
 * @description 获取仪表盘所有数据（统计、趋势、分布、到期列表、TOP10）
 */
export function fetchTenantDashboardGetDashboardData(beginTime?: string, endTime?: string): Promise<unknown> {
  return apiRequest<unknown>({
    method: 'GET',
    url: '/api/v1/system/tenant/dashboard',
    params: {
      beginTime: beginTime ?? undefined,
      endTime: endTime ?? undefined
    },
    operationId: 'TenantDashboardController_getDashboardData_v1',
  });
}

/**
 * 租户仪表盘-即将到期租户
 * @description 获取指定天数内即将到期的租户列表
 */
export function fetchTenantDashboardGetExpiringTenants(days?: number): Promise<unknown> {
  return apiRequest<unknown>({
    method: 'GET',
    url: '/api/v1/system/tenant/dashboard/expiring-tenants',
    params: {
      days: days ?? undefined
    },
    operationId: 'TenantDashboardController_getExpiringTenants_v1',
  });
}

/**
 * 租户仪表盘-套餐分布
 * @description 获取租户套餐分布饼图数据
 */
export function fetchTenantDashboardGetPackageDistribution(): Promise<unknown> {
  return apiRequest<unknown>({
    method: 'GET',
    url: '/api/v1/system/tenant/dashboard/package-distribution',
    operationId: 'TenantDashboardController_getPackageDistribution_v1',
  });
}

/**
 * 租户仪表盘-配额使用TOP10
 * @description 获取配额使用率最高的10个租户
 */
export function fetchTenantDashboardGetQuotaTopTenants(): Promise<unknown> {
  return apiRequest<unknown>({
    method: 'GET',
    url: '/api/v1/system/tenant/dashboard/quota-top',
    operationId: 'TenantDashboardController_getQuotaTopTenants_v1',
  });
}

/**
 * 租户仪表盘-统计数据
 * @description 获取租户总数、活跃数、用户数等统计卡片数据
 */
export function fetchTenantDashboardGetStats(): Promise<unknown> {
  return apiRequest<unknown>({
    method: 'GET',
    url: '/api/v1/system/tenant/dashboard/stats',
    operationId: 'TenantDashboardController_getStats_v1',
  });
}

/**
 * 租户仪表盘-增长趋势
 * @description 获取指定时间范围内的租户增长趋势数据
 */
export function fetchTenantDashboardGetTrend(beginTime?: string, endTime?: string): Promise<unknown> {
  return apiRequest<unknown>({
    method: 'GET',
    url: '/api/v1/system/tenant/dashboard/trend',
    params: {
      beginTime: beginTime ?? undefined,
      endTime: endTime ?? undefined
    },
    operationId: 'TenantDashboardController_getTrend_v1',
  });
}
