/**
 * @generated
 * Tag: 邮箱账号管理
 * Generated at: 2026-08-31T03:40:43.888Z
 */

/* eslint-disable */
import { apiRequest, buildUrl } from '@/service/request-adapter';
import type * as Types from '../types';

// ── Tag: 邮箱账号管理 ────────────────────────────────────────────────

// Referenced types: CreateMailAccountRequestDto, UpdateMailAccountRequestDto

/**
 * 邮箱账号-创建
 * @description 创建新的邮箱账号
 */
export function fetchMailAccountCreate(body: CreateMailAccountRequestDto): Promise<unknown> {
  return apiRequest<unknown>({
    method: 'POST',
    url: '/api/v1/system/mail/account',
    data: body,
    operationId: 'MailAccountController_create_v1',
  });
}

/**
 * 邮箱账号-更新
 * @description 修改邮箱账号信息
 */
export function fetchMailAccountUpdate(body: UpdateMailAccountRequestDto): Promise<unknown> {
  return apiRequest<unknown>({
    method: 'PUT',
    url: '/api/v1/system/mail/account',
    data: body,
    operationId: 'MailAccountController_update_v1',
  });
}

/**
 * 邮箱账号-删除
 * @description 批量删除邮箱账号，多个ID用逗号分隔
 */
export function fetchMailAccountRemove(id: string): Promise<unknown> {
  return apiRequest<unknown>({
    method: 'DELETE',
    url: buildUrl('/api/v1/system/mail/account/{id}', { id: id }),
    operationId: 'MailAccountController_remove_v1',
  });
}

/**
 * 邮箱账号-详情
 * @description 根据ID获取邮箱账号详情
 */
export function fetchMailAccountFindOne(id: number): Promise<unknown> {
  return apiRequest<unknown>({
    method: 'GET',
    url: buildUrl('/api/v1/system/mail/account/{id}', { id: id }),
    operationId: 'MailAccountController_findOne_v1',
  });
}

/**
 * 邮箱账号-启用列表
 * @description 获取所有启用的邮箱账号（用于下拉选择）
 */
export function fetchMailAccountGetEnabledAccounts(): Promise<unknown> {
  return apiRequest<unknown>({
    method: 'GET',
    url: '/api/v1/system/mail/account/enabled',
    operationId: 'MailAccountController_getEnabledAccounts_v1',
  });
}

/**
 * 邮箱账号-列表
 * @description 分页查询邮箱账号列表
 */
export function fetchMailAccountFindAll(pageNum?: number, pageSize?: number, orderByColumn?: string, isAsc?: 'asc' | 'desc', params?: DateRangeDto, mail?: string, username?: string, status?: StatusEnum): Promise<unknown> {
  return apiRequest<unknown>({
    method: 'GET',
    url: '/api/v1/system/mail/account/list',
    params: {
      pageNum: pageNum ?? undefined,
      pageSize: pageSize ?? undefined,
      orderByColumn: orderByColumn ?? undefined,
      isAsc: isAsc ?? undefined,
      params: params ?? undefined,
      mail: mail ?? undefined,
      username: username ?? undefined,
      status: status ?? undefined
    },
    operationId: 'MailAccountController_findAll_v1',
  });
}
