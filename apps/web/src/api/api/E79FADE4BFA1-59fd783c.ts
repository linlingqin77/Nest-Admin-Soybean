/**
 * @generated
 * Tag: 短信渠道管理
 * Generated at: 2026-08-31T03:40:43.886Z
 */

/* eslint-disable */
import { apiRequest, buildUrl } from '@/service/request-adapter';
import type * as Types from '../types';

// ── Tag: 短信渠道管理 ────────────────────────────────────────────────

// Referenced types: CreateSmsChannelRequestDto, UpdateSmsChannelRequestDto

/**
 * 短信渠道-创建
 * @description 创建新的短信渠道
 */
export function fetchSmsChannelCreate(body: CreateSmsChannelRequestDto): Promise<unknown> {
  return apiRequest<unknown>({
    method: 'POST',
    url: '/api/v1/system/sms/channel',
    data: body,
    operationId: 'SmsChannelController_create_v1',
  });
}

/**
 * 短信渠道-更新
 * @description 修改短信渠道信息
 */
export function fetchSmsChannelUpdate(body: UpdateSmsChannelRequestDto): Promise<unknown> {
  return apiRequest<unknown>({
    method: 'PUT',
    url: '/api/v1/system/sms/channel',
    data: body,
    operationId: 'SmsChannelController_update_v1',
  });
}

/**
 * 短信渠道-删除
 * @description 批量删除短信渠道，多个ID用逗号分隔
 */
export function fetchSmsChannelRemove(id: string): Promise<unknown> {
  return apiRequest<unknown>({
    method: 'DELETE',
    url: buildUrl('/api/v1/system/sms/channel/{id}', { id: id }),
    operationId: 'SmsChannelController_remove_v1',
  });
}

/**
 * 短信渠道-详情
 * @description 根据ID获取短信渠道详情
 */
export function fetchSmsChannelFindOne(id: number): Promise<unknown> {
  return apiRequest<unknown>({
    method: 'GET',
    url: buildUrl('/api/v1/system/sms/channel/{id}', { id: id }),
    operationId: 'SmsChannelController_findOne_v1',
  });
}

/**
 * 短信渠道-启用列表
 * @description 获取所有启用的短信渠道（用于下拉选择）
 */
export function fetchSmsChannelGetEnabledChannels(): Promise<unknown> {
  return apiRequest<unknown>({
    method: 'GET',
    url: '/api/v1/system/sms/channel/enabled',
    operationId: 'SmsChannelController_getEnabledChannels_v1',
  });
}

/**
 * 短信渠道-列表
 * @description 分页查询短信渠道列表
 */
export function fetchSmsChannelFindAll(pageNum?: number, pageSize?: number, orderByColumn?: string, isAsc?: 'asc' | 'desc', params?: DateRangeDto, name?: string, code?: string, status?: StatusEnum): Promise<unknown> {
  return apiRequest<unknown>({
    method: 'GET',
    url: '/api/v1/system/sms/channel/list',
    params: {
      pageNum: pageNum ?? undefined,
      pageSize: pageSize ?? undefined,
      orderByColumn: orderByColumn ?? undefined,
      isAsc: isAsc ?? undefined,
      params: params ?? undefined,
      name: name ?? undefined,
      code: code ?? undefined,
      status: status ?? undefined
    },
    operationId: 'SmsChannelController_findAll_v1',
  });
}
