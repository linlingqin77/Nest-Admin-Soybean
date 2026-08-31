/**
 * @generated
 * Tag: 岗位管理
 * Generated at: 2026-08-31T03:40:43.885Z
 */

/* eslint-disable */
import { apiRequest, buildUrl } from '@/service/request-adapter';
import type * as Types from '../types';

// ── Tag: 岗位管理 ────────────────────────────────────────────────

// Referenced types: CreatePostRequestDto, ListPostRequestDto, UpdatePostRequestDto

/**
 * 岗位管理-创建
 * @description 创建新岗位
 */
export function fetchPostCreate(body: CreatePostRequestDto): Promise<unknown> {
  return apiRequest<unknown>({
    method: 'POST',
    url: '/api/v1/system/post',
    data: body,
    operationId: 'PostController_create_v1',
  });
}

/**
 * 岗位管理-更新
 * @description 修改岗位信息
 */
export function fetchPostUpdate(body: UpdatePostRequestDto): Promise<unknown> {
  return apiRequest<unknown>({
    method: 'PUT',
    url: '/api/v1/system/post',
    data: body,
    operationId: 'PostController_update_v1',
  });
}

/**
 * 岗位管理-详情
 * @description 根据ID获取岗位详情
 */
export function fetchPostFindOne(id: number): Promise<unknown> {
  return apiRequest<unknown>({
    method: 'GET',
    url: buildUrl('/api/v1/system/post/{id}', { id: id }),
    operationId: 'PostController_findOne_v1',
  });
}

/**
 * 岗位管理-删除
 * @description 批量删除岗位，多个ID用逗号分隔
 */
export function fetchPostRemove(ids: string): Promise<unknown> {
  return apiRequest<unknown>({
    method: 'DELETE',
    url: buildUrl('/api/v1/system/post/{ids}', { ids: ids }),
    operationId: 'PostController_remove_v1',
  });
}

/**
 * 岗位管理-部门树
 * @description 获取部门树形结构
 */
export function fetchPostDeptTree(): Promise<unknown> {
  return apiRequest<unknown>({
    method: 'GET',
    url: '/api/v1/system/post/deptTree',
    operationId: 'PostController_deptTree_v1',
  });
}

/**
 * 岗位管理-导出Excel
 * @description 导出岗位数据为xlsx文件
 */
export function fetchPostExport(body: ListPostRequestDto): Promise<unknown> {
  return apiRequest<unknown>({
    method: 'POST',
    url: '/api/v1/system/post/export',
    data: body,
    operationId: 'PostController_export_v1',
  });
}

/**
 * 岗位管理-列表
 * @description 分页查询岗位列表
 */
export function fetchPostFindAll(pageNum?: number, pageSize?: number, orderByColumn?: string, isAsc?: 'asc' | 'desc', params?: DateRangeDto, postName?: string, postCode?: string, status?: StatusEnum, belongDeptId?: string): Promise<unknown> {
  return apiRequest<unknown>({
    method: 'GET',
    url: '/api/v1/system/post/list',
    params: {
      pageNum: pageNum ?? undefined,
      pageSize: pageSize ?? undefined,
      orderByColumn: orderByColumn ?? undefined,
      isAsc: isAsc ?? undefined,
      params: params ?? undefined,
      postName: postName ?? undefined,
      postCode: postCode ?? undefined,
      status: status ?? undefined,
      belongDeptId: belongDeptId ?? undefined
    },
    operationId: 'PostController_findAll_v1',
  });
}

/**
 * 岗位管理-选择框列表
 * @description 获取岗位选择框列表
 */
export function fetchPostOptionselect(deptId: string, postIds: string): Promise<unknown> {
  return apiRequest<unknown>({
    method: 'GET',
    url: '/api/v1/system/post/optionselect',
    params: {
      deptId: deptId,
      postIds: postIds
    },
    operationId: 'PostController_optionselect_v1',
  });
}
