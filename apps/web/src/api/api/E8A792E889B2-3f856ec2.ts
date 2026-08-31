/**
 * @generated
 * Tag: 角色管理
 * Generated at: 2026-08-31T03:40:43.888Z
 */

/* eslint-disable */
import { apiRequest, buildUrl } from '@/service/request-adapter';
import type * as Types from '../types';

// ── Tag: 角色管理 ────────────────────────────────────────────────

// Referenced types: AuthUserCancelAllRequestDto, AuthUserCancelRequestDto, AuthUserSelectAllRequestDto, ChangeRoleStatusRequestDto, CreateRoleRequestDto, ListRoleRequestDto, UpdateRoleRequestDto

/**
 * 角色管理-创建
 * @description 创建新角色并分配权限
 */
export function fetchRoleCreate(body: CreateRoleRequestDto): Promise<unknown> {
  return apiRequest<unknown>({
    method: 'POST',
    url: '/api/v1/system/role',
    data: body,
    operationId: 'RoleController_create_v1',
  });
}

/**
 * 角色管理-修改
 * @description 修改角色信息及权限
 */
export function fetchRoleUpdate(body: UpdateRoleRequestDto): Promise<unknown> {
  return apiRequest<unknown>({
    method: 'PUT',
    url: '/api/v1/system/role',
    data: body,
    operationId: 'RoleController_update_v1',
  });
}

/**
 * 角色管理-删除
 * @description 批量删除角色，多个ID用逗号分隔
 */
export function fetchRoleRemove(id: string): Promise<unknown> {
  return apiRequest<unknown>({
    method: 'DELETE',
    url: buildUrl('/api/v1/system/role/{id}', { id: id }),
    operationId: 'RoleController_remove_v1',
  });
}

/**
 * 角色管理-详情
 * @description 根据角色ID获取角色详情
 */
export function fetchRoleFindOne(id: number): Promise<unknown> {
  return apiRequest<unknown>({
    method: 'GET',
    url: buildUrl('/api/v1/system/role/{id}', { id: id }),
    operationId: 'RoleController_findOne_v1',
  });
}

/**
 * 角色管理-已分配用户列表
 * @description 获取角色已分配的用户列表
 */
export function fetchRoleAuthUserAllocatedList(pageNum?: number, pageSize?: number, orderByColumn?: string, isAsc?: 'asc' | 'desc', params?: DateRangeDto, userName?: string, phonenumber?: string, roleId?: string): Promise<unknown> {
  return apiRequest<unknown>({
    method: 'GET',
    url: '/api/v1/system/role/authUser/allocatedList',
    params: {
      pageNum: pageNum ?? undefined,
      pageSize: pageSize ?? undefined,
      orderByColumn: orderByColumn ?? undefined,
      isAsc: isAsc ?? undefined,
      params: params ?? undefined,
      userName: userName ?? undefined,
      phonenumber: phonenumber ?? undefined,
      roleId: roleId ?? undefined
    },
    operationId: 'RoleController_authUserAllocatedList_v1',
  });
}

/**
 * 角色管理-解绑用户
 * @description 取消用户与角色的绑定关系
 */
export function fetchRoleAuthUserCancel(body: AuthUserCancelRequestDto): Promise<unknown> {
  return apiRequest<unknown>({
    method: 'PUT',
    url: '/api/v1/system/role/authUser/cancel',
    data: body,
    operationId: 'RoleController_authUserCancel_v1',
  });
}

/**
 * 角色管理-批量解绑用户
 * @description 批量取消用户与角色的绑定关系
 */
export function fetchRoleAuthUserCancelAll(body: AuthUserCancelAllRequestDto): Promise<unknown> {
  return apiRequest<unknown>({
    method: 'PUT',
    url: '/api/v1/system/role/authUser/cancelAll',
    data: body,
    operationId: 'RoleController_authUserCancelAll_v1',
  });
}

/**
 * 角色管理-批量绑定用户
 * @description 批量将用户绑定到角色
 */
export function fetchRoleAuthUserSelectAll(body: AuthUserSelectAllRequestDto): Promise<unknown> {
  return apiRequest<unknown>({
    method: 'PUT',
    url: '/api/v1/system/role/authUser/selectAll',
    data: body,
    operationId: 'RoleController_authUserSelectAll_v1',
  });
}

/**
 * 角色管理-未分配用户列表
 * @description 获取角色未分配的用户列表
 */
export function fetchRoleAuthUserUnAllocatedList(pageNum?: number, pageSize?: number, orderByColumn?: string, isAsc?: 'asc' | 'desc', params?: DateRangeDto, userName?: string, phonenumber?: string, roleId?: string): Promise<unknown> {
  return apiRequest<unknown>({
    method: 'GET',
    url: '/api/v1/system/role/authUser/unallocatedList',
    params: {
      pageNum: pageNum ?? undefined,
      pageSize: pageSize ?? undefined,
      orderByColumn: orderByColumn ?? undefined,
      isAsc: isAsc ?? undefined,
      params: params ?? undefined,
      userName: userName ?? undefined,
      phonenumber: phonenumber ?? undefined,
      roleId: roleId ?? undefined
    },
    operationId: 'RoleController_authUserUnAllocatedList_v1',
  });
}

/**
 * 角色管理-修改状态
 * @description 启用或停用角色
 */
export function fetchRoleChangeStatus(body: ChangeRoleStatusRequestDto): Promise<unknown> {
  return apiRequest<unknown>({
    method: 'PUT',
    url: '/api/v1/system/role/changeStatus',
    data: body,
    operationId: 'RoleController_changeStatus_v1',
  });
}

/**
 * 角色管理-数据权限修改
 * @description 修改角色的数据权限范围
 */
export function fetchRoleDataScope(body: UpdateRoleRequestDto): Promise<unknown> {
  return apiRequest<unknown>({
    method: 'PUT',
    url: '/api/v1/system/role/dataScope',
    data: body,
    operationId: 'RoleController_dataScope_v1',
  });
}

/**
 * 角色管理-部门树
 * @description 获取角色数据权限的部门树
 */
export function fetchRoleDeptTree(id: number): Promise<unknown> {
  return apiRequest<unknown>({
    method: 'GET',
    url: buildUrl('/api/v1/system/role/deptTree/{id}', { id: id }),
    operationId: 'RoleController_deptTree_v1',
  });
}

/**
 * 角色管理-导出Excel
 * @description 导出角色管理数据为xlsx文件
 */
export function fetchRoleExport(body: ListRoleRequestDto): Promise<unknown> {
  return apiRequest<unknown>({
    method: 'POST',
    url: '/api/v1/system/role/export',
    data: body,
    operationId: 'RoleController_export_v1',
  });
}

/**
 * 角色管理-列表
 * @description 分页查询角色列表
 */
export function fetchRoleFindAll(pageNum?: number, pageSize?: number, orderByColumn?: string, isAsc?: 'asc' | 'desc', params?: DateRangeDto, roleName?: string, roleKey?: string, status?: StatusEnum, roleId?: string): Promise<unknown> {
  return apiRequest<unknown>({
    method: 'GET',
    url: '/api/v1/system/role/list',
    params: {
      pageNum: pageNum ?? undefined,
      pageSize: pageSize ?? undefined,
      orderByColumn: orderByColumn ?? undefined,
      isAsc: isAsc ?? undefined,
      params: params ?? undefined,
      roleName: roleName ?? undefined,
      roleKey: roleKey ?? undefined,
      status: status ?? undefined,
      roleId: roleId ?? undefined
    },
    operationId: 'RoleController_findAll_v1',
  });
}

/**
 * 角色管理-选择框列表
 * @description 获取角色选择框列表
 */
export function fetchRoleOptionselect(roleIds: string): Promise<unknown> {
  return apiRequest<unknown>({
    method: 'GET',
    url: '/api/v1/system/role/optionselect',
    params: {
      roleIds: roleIds
    },
    operationId: 'RoleController_optionselect_v1',
  });
}
