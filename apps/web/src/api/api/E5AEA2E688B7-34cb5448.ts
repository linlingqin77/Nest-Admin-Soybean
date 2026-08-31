/**
 * @generated
 * Tag: 客户端管理
 * Generated at: 2026-08-31T03:40:43.884Z
 */

/* eslint-disable */
import { apiRequest, buildUrl } from '@/service/request-adapter';
import type * as Types from '../types';

// ── Tag: 客户端管理 ────────────────────────────────────────────────

// Referenced types: ChangeClientStatusRequestDto, CreateClientRequestDto, UpdateClientRequestDto

/**
 * 客户端管理-创建
 * @description 创建客户端
 */
export function fetchClientCreate(body: CreateClientRequestDto): Promise<unknown> {
  return apiRequest<unknown>({
    method: 'POST',
    url: '/api/v1/system/client',
    data: body,
    operationId: 'ClientController_create_v1',
  });
}

/**
 * 客户端管理-更新
 * @description 修改客户端
 */
export function fetchClientUpdate(body: UpdateClientRequestDto): Promise<unknown> {
  return apiRequest<unknown>({
    method: 'PUT',
    url: '/api/v1/system/client',
    data: body,
    operationId: 'ClientController_update_v1',
  });
}

/**
 * 客户端管理-详情
 * @description 根据ID获取客户端详情
 */
export function fetchClientFindOne(id: number): Promise<unknown> {
  return apiRequest<unknown>({
    method: 'GET',
    url: buildUrl('/api/v1/system/client/{id}', { id: id }),
    operationId: 'ClientController_findOne_v1',
  });
}

/**
 * 客户端管理-删除
 * @description 批量删除客户端，多个ID用逗号分隔
 */
export function fetchClientRemove(ids: string): Promise<unknown> {
  return apiRequest<unknown>({
    method: 'DELETE',
    url: buildUrl('/api/v1/system/client/{ids}', { ids: ids }),
    operationId: 'ClientController_remove_v1',
  });
}

/**
 * 客户端管理-修改状态
 * @description 修改客户端状态
 */
export function fetchClientChangeStatus(body: ChangeClientStatusRequestDto): Promise<unknown> {
  return apiRequest<unknown>({
    method: 'PUT',
    url: '/api/v1/system/client/changeStatus',
    data: body,
    operationId: 'ClientController_changeStatus_v1',
  });
}

/**
 * 客户端管理-列表
 * @description 分页查询客户端列表
 */
export function fetchClientFindAll(pageNum?: number, pageSize?: number, orderByColumn?: string, isAsc?: 'asc' | 'desc', params?: DateRangeDto, clientKey?: string, clientSecret?: string, status?: StatusEnum): Promise<unknown> {
  return apiRequest<unknown>({
    method: 'GET',
    url: '/api/v1/system/client/list',
    params: {
      pageNum: pageNum ?? undefined,
      pageSize: pageSize ?? undefined,
      orderByColumn: orderByColumn ?? undefined,
      isAsc: isAsc ?? undefined,
      params: params ?? undefined,
      clientKey: clientKey ?? undefined,
      clientSecret: clientSecret ?? undefined,
      status: status ?? undefined
    },
    operationId: 'ClientController_findAll_v1',
  });
}
