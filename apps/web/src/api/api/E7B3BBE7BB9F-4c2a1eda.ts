/**
 * @generated
 * Tag: 系统健康检查
 * Generated at: 2026-08-31T03:40:43.887Z
 */

/* eslint-disable */
import { apiRequest, buildUrl } from '@/service/request-adapter';
import type * as Types from '../types';

// ── Tag: 系统健康检查 ────────────────────────────────────────────────

/**
 * 综合健康检查
 */
export function fetchHealthCheck(): Promise<unknown> {
  return apiRequest<unknown>({
    method: 'GET',
    url: '/api/v1/health',
    operationId: 'HealthController_check_v1',
  });
}

/**
 * 应用信息
 */
export function fetchHealthGetInfo(): Promise<unknown> {
  return apiRequest<unknown>({
    method: 'GET',
    url: '/api/v1/health/info',
    operationId: 'HealthController_getInfo_v1',
  });
}

/**
 * 存活探针 (Kubernetes Liveness Probe)
 */
export function fetchHealthCheckLive(): Promise<unknown> {
  return apiRequest<unknown>({
    method: 'GET',
    url: '/api/v1/health/live',
    operationId: 'HealthController_checkLive_v1',
  });
}

/**
 * 存活探针 (Kubernetes Liveness Probe) - 别名
 */
export function fetchHealthCheckLiveness(): Promise<unknown> {
  return apiRequest<unknown>({
    method: 'GET',
    url: '/api/v1/health/liveness',
    operationId: 'HealthController_checkLiveness_v1',
  });
}

/**
 * 就绪探针 (Kubernetes Readiness Probe) - 别名
 */
export function fetchHealthCheckReadiness(): Promise<unknown> {
  return apiRequest<unknown>({
    method: 'GET',
    url: '/api/v1/health/readiness',
    operationId: 'HealthController_checkReadiness_v1',
  });
}

/**
 * 就绪探针 (Kubernetes Readiness Probe)
 */
export function fetchHealthCheckReady(): Promise<unknown> {
  return apiRequest<unknown>({
    method: 'GET',
    url: '/api/v1/health/ready',
    operationId: 'HealthController_checkReady_v1',
  });
}
