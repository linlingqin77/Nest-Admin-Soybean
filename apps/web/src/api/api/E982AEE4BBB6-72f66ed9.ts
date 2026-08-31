/**
 * @generated
 * Tag: 邮件发送
 * Generated at: 2026-08-31T03:40:43.888Z
 */

/* eslint-disable */
import { apiRequest, buildUrl } from '@/service/request-adapter';
import type * as Types from '../types';

// ── Tag: 邮件发送 ────────────────────────────────────────────────

// Referenced types: BatchSendMailDto, SendMailDto, TestMailDto

/**
 * 邮件发送-单发
 * @description 使用模板发送单封邮件
 */
export function fetchMailSendSend(body: SendMailDto): Promise<unknown> {
  return apiRequest<unknown>({
    method: 'POST',
    url: '/api/v1/system/mail/send',
    data: body,
    operationId: 'MailSendController_send_v1',
  });
}

/**
 * 邮件发送-批量
 * @description 使用模板批量发送邮件
 */
export function fetchMailSendBatchSend(body: BatchSendMailDto): Promise<unknown> {
  return apiRequest<unknown>({
    method: 'POST',
    url: '/api/v1/system/mail/send/batch',
    data: body,
    operationId: 'MailSendController_batchSend_v1',
  });
}

/**
 * 邮件发送-重发
 * @description 重新发送失败的邮件
 */
export function fetchMailSendResend(logId: string): Promise<unknown> {
  return apiRequest<unknown>({
    method: 'POST',
    url: buildUrl('/api/v1/system/mail/send/resend/{logId}', { logId: logId }),
    operationId: 'MailSendController_resend_v1',
  });
}

/**
 * 邮件发送-测试
 * @description 测试邮箱账号是否可用
 */
export function fetchMailSendTestSend(body: TestMailDto): Promise<unknown> {
  return apiRequest<unknown>({
    method: 'POST',
    url: '/api/v1/system/mail/send/test',
    data: body,
    operationId: 'MailSendController_testSend_v1',
  });
}
