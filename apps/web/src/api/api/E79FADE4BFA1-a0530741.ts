/**
 * @generated
 * Tag: 短信日志
 * Generated at: 2026-08-31T03:40:43.886Z
 */

/* eslint-disable */
import { apiRequest, buildUrl } from '@/service/request-adapter';
import type * as Types from '../types';

// ── Tag: 短信日志 ────────────────────────────────────────────────

/**
 * 短信日志-详情
 * @description 根据ID获取短信日志详情
 */
export function fetchSmsLogFindOne(id: number): Promise<unknown> {
  return apiRequest<unknown>({
    method: 'GET',
    url: buildUrl('/api/v1/system/sms/log/{id}', { id: id }),
    operationId: 'SmsLogController_findOne_v1',
  });
}

/**
 * 短信日志-列表
 * @description 分页查询短信日志列表
 */
export function fetchSmsLogFindAll(pageNum?: number, pageSize?: number, orderByColumn?: string, isAsc?: 'asc' | 'desc', params?: DateRangeDto, mobile?: string, channelId?: number, templateId?: number, sendStatus?: number, beginTime?: string, endTime?: string): Promise<unknown> {
  return apiRequest<unknown>({
    method: 'GET',
    url: '/api/v1/system/sms/log/list',
    params: {
      pageNum: pageNum ?? undefined,
      pageSize: pageSize ?? undefined,
      orderByColumn: orderByColumn ?? undefined,
      isAsc: isAsc ?? undefined,
      params: params ?? undefined,
      mobile: mobile ?? undefined,
      channelId: channelId ?? undefined,
      templateId: templateId ?? undefined,
      sendStatus: sendStatus ?? undefined,
      beginTime: beginTime ?? undefined,
      endTime: endTime ?? undefined
    },
    operationId: 'SmsLogController_findAll_v1',
  });
}

/**
 * 短信日志-按手机号查询
 * @description 根据手机号查询短信日志
 */
export function fetchSmsLogFindByMobile(mobile: string): Promise<unknown> {
  return apiRequest<unknown>({
    method: 'GET',
    url: buildUrl('/api/v1/system/sms/log/mobile/{mobile}', { mobile: mobile }),
    operationId: 'SmsLogController_findByMobile_v1',
  });
}
