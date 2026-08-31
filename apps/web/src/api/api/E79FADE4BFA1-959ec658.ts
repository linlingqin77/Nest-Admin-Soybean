/**
 * @generated
 * Tag: 短信模板管理
 * Generated at: 2026-08-31T03:40:43.886Z
 */

/* eslint-disable */
import { apiRequest, buildUrl } from '@/service/request-adapter';
import type * as Types from '../types';

// ── Tag: 短信模板管理 ────────────────────────────────────────────────

// Referenced types: CreateSmsTemplateRequestDto, UpdateSmsTemplateRequestDto

/**
 * 短信模板-创建
 * @description 创建新的短信模板
 */
export function fetchSmsTemplateCreate(body: CreateSmsTemplateRequestDto): Promise<unknown> {
  return apiRequest<unknown>({
    method: 'POST',
    url: '/api/v1/system/sms/template',
    data: body,
    operationId: 'SmsTemplateController_create_v1',
  });
}

/**
 * 短信模板-更新
 * @description 修改短信模板信息
 */
export function fetchSmsTemplateUpdate(body: UpdateSmsTemplateRequestDto): Promise<unknown> {
  return apiRequest<unknown>({
    method: 'PUT',
    url: '/api/v1/system/sms/template',
    data: body,
    operationId: 'SmsTemplateController_update_v1',
  });
}

/**
 * 短信模板-删除
 * @description 批量删除短信模板，多个ID用逗号分隔
 */
export function fetchSmsTemplateRemove(id: string): Promise<unknown> {
  return apiRequest<unknown>({
    method: 'DELETE',
    url: buildUrl('/api/v1/system/sms/template/{id}', { id: id }),
    operationId: 'SmsTemplateController_remove_v1',
  });
}

/**
 * 短信模板-详情
 * @description 根据ID获取短信模板详情
 */
export function fetchSmsTemplateFindOne(id: number): Promise<unknown> {
  return apiRequest<unknown>({
    method: 'GET',
    url: buildUrl('/api/v1/system/sms/template/{id}', { id: id }),
    operationId: 'SmsTemplateController_findOne_v1',
  });
}

/**
 * 短信模板-列表
 * @description 分页查询短信模板列表
 */
export function fetchSmsTemplateFindAll(pageNum?: number, pageSize?: number, orderByColumn?: string, isAsc?: 'asc' | 'desc', params?: DateRangeDto, name?: string, code?: string, channelId?: number, type?: number, status?: StatusEnum): Promise<unknown> {
  return apiRequest<unknown>({
    method: 'GET',
    url: '/api/v1/system/sms/template/list',
    params: {
      pageNum: pageNum ?? undefined,
      pageSize: pageSize ?? undefined,
      orderByColumn: orderByColumn ?? undefined,
      isAsc: isAsc ?? undefined,
      params: params ?? undefined,
      name: name ?? undefined,
      code: code ?? undefined,
      channelId: channelId ?? undefined,
      type: type ?? undefined,
      status: status ?? undefined
    },
    operationId: 'SmsTemplateController_findAll_v1',
  });
}
