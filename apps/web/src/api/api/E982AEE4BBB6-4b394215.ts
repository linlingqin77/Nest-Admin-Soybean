/**
 * @generated
 * Tag: 邮件日志
 * Generated at: 2026-08-31T03:40:43.888Z
 */

/* eslint-disable */
import { apiRequest, buildUrl } from '@/service/request-adapter';
import type * as Types from '../types';

// ── Tag: 邮件日志 ────────────────────────────────────────────────

/**
 * 邮件日志-详情
 * @description 根据ID获取邮件日志详情
 */
export function fetchMailLogFindOne(id: string): Promise<unknown> {
  return apiRequest<unknown>({
    method: 'GET',
    url: buildUrl('/api/v1/system/mail/log/{id}', { id: id }),
    operationId: 'MailLogController_findOne_v1',
  });
}

/**
 * 邮件日志-列表
 * @description 分页查询邮件日志列表
 */
export function fetchMailLogFindAll(pageNum?: number, pageSize?: number, orderByColumn?: string, isAsc?: 'asc' | 'desc', params?: DateRangeDto, toMail?: string, templateCode?: string, accountId?: number, sendStatus?: number): Promise<unknown> {
  return apiRequest<unknown>({
    method: 'GET',
    url: '/api/v1/system/mail/log/list',
    params: {
      pageNum: pageNum ?? undefined,
      pageSize: pageSize ?? undefined,
      orderByColumn: orderByColumn ?? undefined,
      isAsc: isAsc ?? undefined,
      params: params ?? undefined,
      toMail: toMail ?? undefined,
      templateCode: templateCode ?? undefined,
      accountId: accountId ?? undefined,
      sendStatus: sendStatus ?? undefined
    },
    operationId: 'MailLogController_findAll_v1',
  });
}

/**
 * 邮件日志-统计
 * @description 获取邮件发送状态统计
 */
export function fetchMailLogGetStats(): Promise<unknown> {
  return apiRequest<unknown>({
    method: 'GET',
    url: '/api/v1/system/mail/log/stats',
    operationId: 'MailLogController_getStats_v1',
  });
}
