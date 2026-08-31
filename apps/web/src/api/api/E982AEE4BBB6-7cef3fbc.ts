/**
 * @generated
 * Tag: 邮件模板管理
 * Generated at: 2026-08-31T03:40:43.888Z
 */

/* eslint-disable */
import { apiRequest, buildUrl } from '@/service/request-adapter';
import type * as Types from '../types';

// ── Tag: 邮件模板管理 ────────────────────────────────────────────────

// Referenced types: CreateMailTemplateRequestDto, UpdateMailTemplateRequestDto

/**
 * 邮件模板-创建
 * @description 创建新的邮件模板
 */
export function fetchMailTemplateCreate(body: CreateMailTemplateRequestDto): Promise<unknown> {
  return apiRequest<unknown>({
    method: 'POST',
    url: '/api/v1/system/mail/template',
    data: body,
    operationId: 'MailTemplateController_create_v1',
  });
}

/**
 * 邮件模板-更新
 * @description 修改邮件模板信息
 */
export function fetchMailTemplateUpdate(body: UpdateMailTemplateRequestDto): Promise<unknown> {
  return apiRequest<unknown>({
    method: 'PUT',
    url: '/api/v1/system/mail/template',
    data: body,
    operationId: 'MailTemplateController_update_v1',
  });
}

/**
 * 邮件模板-删除
 * @description 批量删除邮件模板，多个ID用逗号分隔
 */
export function fetchMailTemplateRemove(id: string): Promise<unknown> {
  return apiRequest<unknown>({
    method: 'DELETE',
    url: buildUrl('/api/v1/system/mail/template/{id}', { id: id }),
    operationId: 'MailTemplateController_remove_v1',
  });
}

/**
 * 邮件模板-详情
 * @description 根据ID获取邮件模板详情
 */
export function fetchMailTemplateFindOne(id: number): Promise<unknown> {
  return apiRequest<unknown>({
    method: 'GET',
    url: buildUrl('/api/v1/system/mail/template/{id}', { id: id }),
    operationId: 'MailTemplateController_findOne_v1',
  });
}

/**
 * 邮件模板-列表
 * @description 分页查询邮件模板列表
 */
export function fetchMailTemplateFindAll(pageNum?: number, pageSize?: number, orderByColumn?: string, isAsc?: 'asc' | 'desc', params?: DateRangeDto, name?: string, code?: string, accountId?: number, status?: StatusEnum): Promise<unknown> {
  return apiRequest<unknown>({
    method: 'GET',
    url: '/api/v1/system/mail/template/list',
    params: {
      pageNum: pageNum ?? undefined,
      pageSize: pageSize ?? undefined,
      orderByColumn: orderByColumn ?? undefined,
      isAsc: isAsc ?? undefined,
      params: params ?? undefined,
      name: name ?? undefined,
      code: code ?? undefined,
      accountId: accountId ?? undefined,
      status: status ?? undefined
    },
    operationId: 'MailTemplateController_findAll_v1',
  });
}
