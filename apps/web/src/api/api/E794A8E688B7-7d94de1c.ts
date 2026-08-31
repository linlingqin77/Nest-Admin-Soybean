/**
 * @generated
 * Tag: 用户管理
 * Generated at: 2026-08-31T03:40:43.886Z
 */

/* eslint-disable */
import { apiRequest, buildUrl } from '@/service/request-adapter';
import type * as Types from '../types';

// ── Tag: 用户管理 ────────────────────────────────────────────────

// Referenced types: BatchCreateUserDto, BatchDeleteUserDto, ChangeUserStatusDto, CreateUserDto, ListUserDto, ResetPwdDto, UpdateProfileDto, UpdatePwdDto, UpdateUserDto

/**
 * 用户-角色和岗位列表
 * @description 获取所有角色和岗位列表，用于新建/编辑用户时选择
 */
export function fetchUserFindPostAndRoleAll(): Promise<unknown> {
  return apiRequest<unknown>({
    method: 'GET',
    url: '/api/v1/system/user',
    operationId: 'UserController_findPostAndRoleAll_v1',
  });
}

/**
 * 用户-创建
 * @description 创建新用户，可分配角色和岗位
 */
export function fetchUserCreate(body: CreateUserDto): Promise<unknown> {
  return apiRequest<unknown>({
    method: 'POST',
    url: '/api/v1/system/user',
    data: body,
    operationId: 'UserController_create_v1',
  });
}

/**
 * 用户-更新
 * @description 更新用户基本信息
 */
export function fetchUserUpdate(body: UpdateUserDto): Promise<unknown> {
  return apiRequest<unknown>({
    method: 'PUT',
    url: '/api/v1/system/user',
    data: body,
    operationId: 'UserController_update_v1',
  });
}

/**
 * 用户-删除
 * @description 批量删除用户，多个ID用逗号分隔
 */
export function fetchUserRemove(id: string): Promise<unknown> {
  return apiRequest<unknown>({
    method: 'DELETE',
    url: buildUrl('/api/v1/system/user/{id}', { id: id }),
    operationId: 'UserController_remove_v1',
  });
}

/**
 * 用户-详情
 * @description 根据用户ID获取用户详细信息
 */
export function fetchUserFindOne(userId: number): Promise<unknown> {
  return apiRequest<unknown>({
    method: 'GET',
    url: buildUrl('/api/v1/system/user/{userId}', { userId: userId }),
    operationId: 'UserController_findOne_v1',
  });
}

/**
 * 用户-更新角色分配
 * @description 更新用户的角色分配
 */
export function fetchUserUpdateAuthRole(userId: number, roleIds: string): Promise<unknown> {
  return apiRequest<unknown>({
    method: 'PUT',
    url: '/api/v1/system/user/authRole',
    params: {
      userId: userId,
      roleIds: roleIds
    },
    operationId: 'UserController_updateAuthRole_v1',
  });
}

/**
 * 用户-分配角色详情
 * @description 获取用户已分配的角色信息
 */
export function fetchUserAuthRole(id: number): Promise<unknown> {
  return apiRequest<unknown>({
    method: 'GET',
    url: buildUrl('/api/v1/system/user/authRole/{id}', { id: id }),
    operationId: 'UserController_authRole_v1',
  });
}

/**
 * 用户-批量删除
 * @description 批量删除用户，单次最多100个，返回每个用户的删除结果
 */
export function fetchUserBatchDelete(body: BatchDeleteUserDto): Promise<unknown> {
  return apiRequest<unknown>({
    method: 'DELETE',
    url: '/api/v1/system/user/batch',
    data: body,
    operationId: 'UserController_batchDelete_v1',
  });
}

/**
 * 用户-批量创建
 * @description 批量创建用户，单次最多100个，返回每个用户的创建结果
 */
export function fetchUserBatchCreate(body: BatchCreateUserDto): Promise<unknown> {
  return apiRequest<unknown>({
    method: 'POST',
    url: '/api/v1/system/user/batch',
    data: body,
    operationId: 'UserController_batchCreate_v1',
  });
}

/**
 * 用户-修改状态
 * @description 启用或停用用户账号
 */
export function fetchUserChangeStatus(body: ChangeUserStatusDto): Promise<unknown> {
  return apiRequest<unknown>({
    method: 'PUT',
    url: '/api/v1/system/user/changeStatus',
    data: body,
    operationId: 'UserController_changeStatus_v1',
  });
}

/**
 * 用户-部门树
 * @description 获取部门树形结构，用于用户筛选
 */
export function fetchUserDeptTree(): Promise<unknown> {
  return apiRequest<unknown>({
    method: 'GET',
    url: '/api/v1/system/user/deptTree',
    operationId: 'UserController_deptTree_v1',
  });
}

/**
 * 用户-导出Excel
 * @description 导出用户信息数据为xlsx文件
 */
export function fetchUserExport(body: ListUserDto): Promise<unknown> {
  return apiRequest<unknown>({
    method: 'POST',
    url: '/api/v1/system/user/export',
    data: body,
    operationId: 'UserController_export_v1',
  });
}

/**
 * 获取当前登录用户信息 - 供 Soybean 前端调用
GET /system/user/getInfo
 * @description 获取当前登录用户的详细信息、角色和权限
 */
export function fetchUserGetInfo(): Promise<unknown> {
  return apiRequest<unknown>({
    method: 'GET',
    url: '/api/v1/system/user/getInfo',
    operationId: 'UserController_getInfo_v1',
  });
}

/**
 * 用户-列表
 * @description 分页查询用户列表，支持多条件筛选
 */
export function fetchUserFindAll(pageNum?: number, pageSize?: number, orderByColumn?: string, isAsc?: 'asc' | 'desc', params?: DateRangeDto, deptId?: string, nickName?: string, email?: string, userName?: string, phonenumber?: string, status?: StatusEnum): Promise<unknown> {
  return apiRequest<unknown>({
    method: 'GET',
    url: '/api/v1/system/user/list',
    params: {
      pageNum: pageNum ?? undefined,
      pageSize: pageSize ?? undefined,
      orderByColumn: orderByColumn ?? undefined,
      isAsc: isAsc ?? undefined,
      params: params ?? undefined,
      deptId: deptId ?? undefined,
      nickName: nickName ?? undefined,
      email: email ?? undefined,
      userName: userName ?? undefined,
      phonenumber: phonenumber ?? undefined,
      status: status ?? undefined
    },
    operationId: 'UserController_findAll_v1',
  });
}

/**
 * 用户-部门用户列表
 * @description 获取指定部门的用户列表
 */
export function fetchUserFindByDeptId(deptId: number): Promise<unknown> {
  return apiRequest<unknown>({
    method: 'GET',
    url: buildUrl('/api/v1/system/user/list/dept/{deptId}', { deptId: deptId }),
    operationId: 'UserController_findByDeptId_v1',
  });
}

/**
 * 用户-选择框列表
 * @description 获取用户选择框列表
 */
export function fetchUserOptionselect(): Promise<unknown> {
  return apiRequest<unknown>({
    method: 'GET',
    url: '/api/v1/system/user/optionselect',
    operationId: 'UserController_optionselect_v1',
  });
}

/**
 * 个人中心-用户信息
 * @description 获取当前登录用户的个人信息
 */
export function fetchUserProfile(): Promise<unknown> {
  return apiRequest<unknown>({
    method: 'GET',
    url: '/api/v1/system/user/profile',
    operationId: 'UserController_profile_v1',
  });
}

/**
 * 个人中心-修改用户信息
 * @description 修改当前用户的个人基本信息
 */
export function fetchUserUpdateProfile(body: UpdateProfileDto): Promise<unknown> {
  return apiRequest<unknown>({
    method: 'PUT',
    url: '/api/v1/system/user/profile',
    data: body,
    operationId: 'UserController_updateProfile_v1',
  });
}

/**
 * 个人中心-上传用户头像
 * @description 上传并更新当前用户头像
 */
export function fetchUserAvatar(): Promise<unknown> {
  return apiRequest<unknown>({
    method: 'POST',
    url: '/api/v1/system/user/profile/avatar',
    operationId: 'UserController_avatar_v1',
  });
}

/**
 * 个人中心-修改密码
 * @description 修改当前用户的登录密码
 */
export function fetchUserUpdatePwd(body: UpdatePwdDto): Promise<unknown> {
  return apiRequest<unknown>({
    method: 'PUT',
    url: '/api/v1/system/user/profile/updatePwd',
    data: body,
    operationId: 'UserController_updatePwd_v1',
  });
}

/**
 * 用户-重置密码
 * @description 管理员重置用户密码
 */
export function fetchUserResetPwd(body: ResetPwdDto): Promise<unknown> {
  return apiRequest<unknown>({
    method: 'PUT',
    url: '/api/v1/system/user/resetPwd',
    data: body,
    operationId: 'UserController_resetPwd_v1',
  });
}
