/**
 * @generated
 * Tag: Prometheus
 * Generated at: 2026-08-31T03:40:43.884Z
 */

/* eslint-disable */
import { apiRequest, buildUrl } from '@/service/request-adapter';
import type * as Types from '../types';

// ── Tag: Prometheus ────────────────────────────────────────────────

export function fetchPrometheusIndex(): Promise<unknown> {
  return apiRequest<unknown>({
    method: 'GET',
    url: '/api/v1/metrics',
    operationId: 'PrometheusController_index_v1',
  });
}
