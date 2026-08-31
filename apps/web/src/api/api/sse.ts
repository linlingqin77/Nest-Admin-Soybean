/**
 * @generated
 * Tag: SSE消息推送
 * Generated at: 2026-08-31T03:40:43.884Z
 */

/* eslint-disable */
import { apiRequest, buildUrl } from '@/service/request-adapter';
import type * as Types from '../types';

// ── Tag: SSE消息推送 ────────────────────────────────────────────────

/**
 * SSE连接
 */
export function fetchSseSse(Authorization: string, clientid: string): Promise<unknown> {
  return apiRequest<unknown>({
    method: 'GET',
    url: '/api/v1/resource/sse',
    params: {
      Authorization: Authorization,
      clientid: clientid
    },
    operationId: 'SseController_sse_v1',
  });
}

/**
 * 广播消息给所有用户
 */
export function fetchSseBroadcast(): Promise<unknown> {
  return apiRequest<unknown>({
    method: 'POST',
    url: '/api/v1/resource/sse/broadcast',
    operationId: 'SseController_broadcast_v1',
  });
}

/**
 * 关闭SSE连接
 */
export function fetchSseCloseSse(): Promise<unknown> {
  return apiRequest<unknown>({
    method: 'GET',
    url: '/api/v1/resource/sse/close',
    operationId: 'SseController_closeSse_v1',
  });
}

/**
 * 获取在线连接数
 */
export function fetchSseGetCount(): Promise<unknown> {
  return apiRequest<unknown>({
    method: 'POST',
    url: '/api/v1/resource/sse/count',
    operationId: 'SseController_getCount_v1',
  });
}

/**
 * 发送消息给指定用户
 */
export function fetchSseSendMessage(): Promise<unknown> {
  return apiRequest<unknown>({
    method: 'POST',
    url: '/api/v1/resource/sse/send',
    operationId: 'SseController_sendMessage_v1',
  });
}
