/**
 * @generated
 * Tag: 站内信模板管理
 * Generated at: 2026-08-31T03:40:43.887Z
 */

/* eslint-disable */
import { apiRequest, buildUrl } from '@/service/request-adapter';
import type * as Types from '../types';

// ── Tag: 站内信模板管理 ────────────────────────────────────────────────

// Referenced types: CreateNotifyTemplateRequestDto, UpdateNotifyTemplateRequestDto

/**
 * 站内信模板-创建
 * @description 创建新的站内信模板
 */
export function fetchNotifyTemplateCreate(body: CreateNotifyTemplateRequestDto): Promise<unknown> {
  return apiRequest<unknown>({
    method: 'POST',
    url: '/api/v1/system/notify/template',
    data: body,
    operationId: 'NotifyTemplateController_create_v1',
  });
}

/**
 * 站内信模板-更新
 * @description 修改站内信模板信息
 */
export function fetchNotifyTemplateUpdate(body: UpdateNotifyTemplateRequestDto): Promise<unknown> {
  return apiRequest<unknown>({
    method: 'PUT',
    url: '/api/v1/system/notify/template',
    data: body,
    operationId: 'NotifyTemplateController_update_v1',
  });
}

/**
 * 站内信模板-删除
 * @description 批量删除站内信模板，多个ID用逗号分隔
 */
export function fetchNotifyTemplateRemove(id: string): Promise<unknown> {
  return apiRequest<unknown>({
    method: 'DELETE',
    url: buildUrl('/api/v1/system/notify/template/{id}', { id: id }),
    operationId: 'NotifyTemplateController_remove_v1',
  });
}

/**
 * 站内信模板-详情
 * @description 根据ID获取站内信模板详情
 */
export function fetchNotifyTemplateFindOne(id: number): Promise<unknown> {
  return apiRequest<unknown>({
    method: 'GET',
    url: buildUrl('/api/v1/system/notify/template/{id}', { id: id }),
    operationId: 'NotifyTemplateController_findOne_v1',
  });
}

/**
 * 站内信模板-列表
 * @description 分页查询站内信模板列表
 */
export function fetchNotifyTemplateFindAll(pageNum?: number, pageSize?: number, orderByColumn?: string, isAsc?: 'asc' | 'desc', params?: DateRangeDto, name?: string, code?: string, type?: number, status?: StatusEnum): Promise<unknown> {
  return apiRequest<unknown>({
    method: 'GET',
    url: '/api/v1/system/notify/template/list',
    params: {
      pageNum: pageNum ?? undefined,
      pageSize: pageSize ?? undefined,
      orderByColumn: orderByColumn ?? undefined,
      isAsc: isAsc ?? undefined,
      params: params ?? undefined,
      name: name ?? undefined,
      code: code ?? undefined,
      type: type ?? undefined,
      status: status ?? undefined
    },
    operationId: 'NotifyTemplateController_findAll_v1',
  });
}

/**
 * 站内信模板-下拉选择
 * @description 获取所有启用的站内信模板（用于下拉选择）
 */
export function fetchNotifyTemplateGetSelectList(): Promise<unknown> {
  return apiRequest<unknown>({
    method: 'GET',
    url: '/api/v1/system/notify/template/select',
    operationId: 'NotifyTemplateController_getSelectList_v1',
  });
}
