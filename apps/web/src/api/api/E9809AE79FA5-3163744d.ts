/**
 * @generated
 * Tag: 通知公告
 * Generated at: 2026-08-31T03:40:43.888Z
 */

/* eslint-disable */
import { apiRequest, buildUrl } from '@/service/request-adapter';
import type * as Types from '../types';

// ── Tag: 通知公告 ────────────────────────────────────────────────

// Referenced types: CreateNoticeRequestDto, UpdateNoticeRequestDto

/**
 * 通知公告-创建
 * @description 发布新的通知公告
 */
export function fetchNoticeCreate(body: CreateNoticeRequestDto): Promise<unknown> {
  return apiRequest<unknown>({
    method: 'POST',
    url: '/api/v1/system/notice',
    data: body,
    operationId: 'NoticeController_create_v1',
  });
}

/**
 * 通知公告-更新
 * @description 修改通知公告内容
 */
export function fetchNoticeUpdate(body: UpdateNoticeRequestDto): Promise<unknown> {
  return apiRequest<unknown>({
    method: 'PUT',
    url: '/api/v1/system/notice',
    data: body,
    operationId: 'NoticeController_update_v1',
  });
}

/**
 * 通知公告-删除
 * @description 批量删除通知公告，多个ID用逗号分隔
 */
export function fetchNoticeRemove(id: string): Promise<unknown> {
  return apiRequest<unknown>({
    method: 'DELETE',
    url: buildUrl('/api/v1/system/notice/{id}', { id: id }),
    operationId: 'NoticeController_remove_v1',
  });
}

/**
 * 通知公告-详情
 * @description 根据ID获取通知公告详情
 */
export function fetchNoticeFindOne(id: number): Promise<unknown> {
  return apiRequest<unknown>({
    method: 'GET',
    url: buildUrl('/api/v1/system/notice/{id}', { id: id }),
    operationId: 'NoticeController_findOne_v1',
  });
}

/**
 * 通知公告-列表
 * @description 分页查询通知公告列表
 */
export function fetchNoticeFindAll(pageNum?: number, pageSize?: number, orderByColumn?: string, isAsc?: 'asc' | 'desc', params?: DateRangeDto, noticeTitle?: string, noticeType?: NoticeTypeEnum, createBy?: string): Promise<unknown> {
  return apiRequest<unknown>({
    method: 'GET',
    url: '/api/v1/system/notice/list',
    params: {
      pageNum: pageNum ?? undefined,
      pageSize: pageSize ?? undefined,
      orderByColumn: orderByColumn ?? undefined,
      isAsc: isAsc ?? undefined,
      params: params ?? undefined,
      noticeTitle: noticeTitle ?? undefined,
      noticeType: noticeType ?? undefined,
      createBy: createBy ?? undefined
    },
    operationId: 'NoticeController_findAll_v1',
  });
}
