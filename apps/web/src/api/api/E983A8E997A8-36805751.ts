/**
 * @generated
 * Tag: 部门管理
 * Generated at: 2026-08-31T03:40:43.889Z
 */

/* eslint-disable */
import { apiRequest, buildUrl } from '@/service/request-adapter';
import type * as Types from '../types';

// ── Tag: 部门管理 ────────────────────────────────────────────────

// Referenced types: CreateDeptRequestDto, UpdateDeptRequestDto

/**
 * 部门管理-创建
 * @description 创建新部门，需要指定父部门ID
 */
export function fetchDeptCreate(body: CreateDeptRequestDto): Promise<unknown> {
  return apiRequest<unknown>({
    method: 'POST',
    url: '/api/v1/system/dept',
    data: body,
    operationId: 'DeptController_create_v1',
  });
}

/**
 * 部门管理-更新
 * @description 更新部门信息
 */
export function fetchDeptUpdate(body: UpdateDeptRequestDto): Promise<unknown> {
  return apiRequest<unknown>({
    method: 'PUT',
    url: '/api/v1/system/dept',
    data: body,
    operationId: 'DeptController_update_v1',
  });
}

/**
 * 部门管理-删除
 * @description 根据ID删除部门，如果存在子部门则无法删除
 */
export function fetchDeptRemove(id: number): Promise<unknown> {
  return apiRequest<unknown>({
    method: 'DELETE',
    url: buildUrl('/api/v1/system/dept/{id}', { id: id }),
    operationId: 'DeptController_remove_v1',
  });
}

/**
 * 部门管理-详情
 * @description 根据部门ID获取部门详细信息
 */
export function fetchDeptFindOne(id: number): Promise<unknown> {
  return apiRequest<unknown>({
    method: 'GET',
    url: buildUrl('/api/v1/system/dept/{id}', { id: id }),
    operationId: 'DeptController_findOne_v1',
  });
}

/**
 * 部门管理-列表
 * @description 获取部门列表，支持按名称和状态筛选
 */
export function fetchDeptFindAll(deptName?: string, status?: StatusEnum): Promise<unknown> {
  return apiRequest<unknown>({
    method: 'GET',
    url: '/api/v1/system/dept/list',
    params: {
      deptName: deptName ?? undefined,
      status: status ?? undefined
    },
    operationId: 'DeptController_findAll_v1',
  });
}

/**
 * 部门管理-排除节点列表
 * @description 查询部门列表（排除指定节点及其子节点），用于编辑时选择父部门
 */
export function fetchDeptFindListExclude(id: number): Promise<unknown> {
  return apiRequest<unknown>({
    method: 'GET',
    url: buildUrl('/api/v1/system/dept/list/exclude/{id}', { id: id }),
    operationId: 'DeptController_findListExclude_v1',
  });
}

/**
 * 部门管理-选择框列表
 * @description 获取部门选择框列表
 */
export function fetchDeptOptionselect(): Promise<unknown> {
  return apiRequest<unknown>({
    method: 'GET',
    url: '/api/v1/system/dept/optionselect',
    operationId: 'DeptController_optionselect_v1',
  });
}
