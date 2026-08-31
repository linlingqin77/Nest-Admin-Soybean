/**
 * @generated
 * Tag: 短信发送
 * Generated at: 2026-08-31T03:40:43.886Z
 */

/* eslint-disable */
import { apiRequest, buildUrl } from '@/service/request-adapter';
import type * as Types from '../types';

// ── Tag: 短信发送 ────────────────────────────────────────────────

// Referenced types: BatchSendSmsDto, SendSmsDto

/**
 * 短信发送-单发
 * @description 发送单条短信
 */
export function fetchSmsSendSend(body: SendSmsDto): Promise<unknown> {
  return apiRequest<unknown>({
    method: 'POST',
    url: '/api/v1/system/sms/send',
    data: body,
    operationId: 'SmsSendController_send_v1',
  });
}

/**
 * 短信发送-批量
 * @description 批量发送短信
 */
export function fetchSmsSendBatchSend(body: BatchSendSmsDto): Promise<unknown> {
  return apiRequest<unknown>({
    method: 'POST',
    url: '/api/v1/system/sms/send/batch',
    data: body,
    operationId: 'SmsSendController_batchSend_v1',
  });
}

/**
 * 短信发送-重发
 * @description 重发失败的短信
 */
export function fetchSmsSendResend(logId: string): Promise<unknown> {
  return apiRequest<unknown>({
    method: 'POST',
    url: buildUrl('/api/v1/system/sms/send/resend/{logId}', { logId: logId }),
    operationId: 'SmsSendController_resend_v1',
  });
}
