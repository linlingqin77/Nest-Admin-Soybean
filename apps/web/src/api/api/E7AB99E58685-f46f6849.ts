/**
 * @generated
 * Tag: 站内信消息管理
 * Generated at: 2026-08-31T03:40:43.887Z
 */

/* eslint-disable */
import { apiRequest, buildUrl } from '@/service/request-adapter';
import type * as Types from '../types';

// ── Tag: 站内信消息管理 ────────────────────────────────────────────────

// Referenced types: SendNotifyAllRequestDto, SendNotifyMessageRequestDto

/**
 * 站内信-删除
 * @description 删除单条站内信（软删除）
 */
export function fetchNotifyMessageRemove(id: string): Promise<unknown> {
  return apiRequest<unknown>({
    method: 'DELETE',
    url: buildUrl('/api/v1/system/notify/message/{id}', { id: id }),
    operationId: 'NotifyMessageController_remove_v1',
  });
}

/**
 * 站内信-详情
 * @description 根据ID获取站内信详情
 */
export function fetchNotifyMessageFindOne(id: string): Promise<unknown> {
  return apiRequest<unknown>({
    method: 'GET',
    url: buildUrl('/api/v1/system/notify/message/{id}', { id: id }),
    operationId: 'NotifyMessageController_findOne_v1',
  });
}

/**
 * 站内信-批量删除
 * @description 批量删除站内信（软删除），多个ID用逗号分隔
 */
export function fetchNotifyMessageRemoveBatch(ids: string): Promise<unknown> {
  return apiRequest<unknown>({
    method: 'DELETE',
    url: buildUrl('/api/v1/system/notify/message/batch/{ids}', { ids: ids }),
    operationId: 'NotifyMessageController_removeBatch_v1',
  });
}

/**
 * 站内信-列表（管理员）
 * @description 分页查询所有站内信消息列表
 */
export function fetchNotifyMessageFindAll(pageNum?: number, pageSize?: number, orderByColumn?: string, isAsc?: 'asc' | 'desc', params?: DateRangeDto, userId?: number, templateCode?: string, readStatus?: boolean): Promise<unknown> {
  return apiRequest<unknown>({
    method: 'GET',
    url: '/api/v1/system/notify/message/list',
    params: {
      pageNum: pageNum ?? undefined,
      pageSize: pageSize ?? undefined,
      orderByColumn: orderByColumn ?? undefined,
      isAsc: isAsc ?? undefined,
      params: params ?? undefined,
      userId: userId ?? undefined,
      templateCode: templateCode ?? undefined,
      readStatus: readStatus ?? undefined
    },
    operationId: 'NotifyMessageController_findAll_v1',
  });
}

/**
 * 站内信-我的消息列表
 * @description 分页查询当前用户的站内信列表
 */
export function fetchNotifyMessageFindMyMessages(pageNum?: number, pageSize?: number, orderByColumn?: string, isAsc?: 'asc' | 'desc', params?: DateRangeDto, readStatus?: boolean): Promise<unknown> {
  return apiRequest<unknown>({
    method: 'GET',
    url: '/api/v1/system/notify/message/my-list',
    params: {
      pageNum: pageNum ?? undefined,
      pageSize: pageSize ?? undefined,
      orderByColumn: orderByColumn ?? undefined,
      isAsc: isAsc ?? undefined,
      params: params ?? undefined,
      readStatus: readStatus ?? undefined
    },
    operationId: 'NotifyMessageController_findMyMessages_v1',
  });
}

/**
 * 站内信-全部标记已读
 * @description 标记当前用户所有站内信为已读
 */
export function fetchNotifyMessageMarkAllAsRead(): Promise<unknown> {
  return apiRequest<unknown>({
    method: 'PUT',
    url: '/api/v1/system/notify/message/read-all',
    operationId: 'NotifyMessageController_markAllAsRead_v1',
  });
}

/**
 * 站内信-批量标记已读
 * @description 批量标记站内信为已读，多个ID用逗号分隔
 */
export function fetchNotifyMessageMarkAsReadBatch(ids: string): Promise<unknown> {
  return apiRequest<unknown>({
    method: 'PUT',
    url: buildUrl('/api/v1/system/notify/message/read-batch/{ids}', { ids: ids }),
    operationId: 'NotifyMessageController_markAsReadBatch_v1',
  });
}

/**
 * 站内信-标记已读
 * @description 标记单条站内信为已读
 */
export function fetchNotifyMessageMarkAsRead(id: string): Promise<unknown> {
  return apiRequest<unknown>({
    method: 'PUT',
    url: buildUrl('/api/v1/system/notify/message/read/{id}', { id: id }),
    operationId: 'NotifyMessageController_markAsRead_v1',
  });
}

/**
 * 站内信-最近消息
 * @description 获取当前用户最近的站内信列表（用于通知铃铛下拉）
 */
export function fetchNotifyMessageGetRecentMessages(limit: string): Promise<unknown> {
  return apiRequest<unknown>({
    method: 'GET',
    url: '/api/v1/system/notify/message/recent',
    params: {
      limit: limit
    },
    operationId: 'NotifyMessageController_getRecentMessages_v1',
  });
}

/**
 * 站内信-发送
 * @description 发送站内信给指定用户（单发/群发）
 */
export function fetchNotifyMessageSend(body: SendNotifyMessageRequestDto): Promise<unknown> {
  return apiRequest<unknown>({
    method: 'POST',
    url: '/api/v1/system/notify/message/send',
    data: body,
    operationId: 'NotifyMessageController_send_v1',
  });
}

/**
 * 站内信-群发所有用户
 * @description 发送站内信给所有用户
 */
export function fetchNotifyMessageSendAll(body: SendNotifyAllRequestDto): Promise<unknown> {
  return apiRequest<unknown>({
    method: 'POST',
    url: '/api/v1/system/notify/message/send-all',
    data: body,
    operationId: 'NotifyMessageController_sendAll_v1',
  });
}

/**
 * 站内信-未读数量
 * @description 获取当前用户的未读站内信数量
 */
export function fetchNotifyMessageGetUnreadCount(): Promise<unknown> {
  return apiRequest<unknown>({
    method: 'GET',
    url: '/api/v1/system/notify/message/unread-count',
    operationId: 'NotifyMessageController_getUnreadCount_v1',
  });
}
