import { request } from '@/service/request';

/** 角色列表 */
export function fetchRoleFindAll(params?: Api.System.RoleSearchParams) {
  return request<Api.System.RoleList>({
    url: '/system/role/list',
    method: 'get',
    params
  });
}

/** 角色详情 */
export function fetchRoleFindOne(id: CommonType.IdType) {
  return request<Api.System.Role>({
    url: `/system/role/${id}`,
    method: 'get'
  });
}

/** 创建角色 */
export function fetchRoleCreate(data: Api.System.RoleOperateParams) {
  return request<void>({
    url: '/system/role',
    method: 'post',
    data
  });
}

/** 更新角色 */
export function fetchRoleUpdate(data: Api.System.RoleOperateParams) {
  return request<void>({
    url: '/system/role',
    method: 'put',
    data
  });
}

/** 删除角色 */
export function fetchRoleRemove(id: CommonType.IdType) {
  return request<void>({
    url: `/system/role/${id}`,
    method: 'delete'
  });
}

/** 修改角色状态 */
export function fetchRoleChangeStatus(data: { roleId: number; status: string }) {
  return request<void>({
    url: '/system/role/changeStatus',
    method: 'put',
    data
  });
}

/** 角色选择框列表 */
export function fetchRoleOptionselect() {
  return request<Api.System.Role[]>({
    url: '/system/role/optionselect',
    method: 'get'
  });
}

/** 角色部门树 */
export function fetchRoleDeptTree(roleId: CommonType.IdType) {
  return request<{ checkedKeys: number[]; depts: Api.System.DeptTreeNode[] }>({
    url: `/system/role/deptTree/${roleId}`,
    method: 'get'
  });
}

/** 修改角色数据权限 */
export function fetchRoleDataScope(data: Api.System.RoleDataScopeParams) {
  return request<void>({
    url: '/system/role/dataScope',
    method: 'put',
    data
  });
}

/** 已分配用户列表 */
export function fetchRoleAllocatedList(params: Api.System.RoleUserSearchParams) {
  return request<Api.System.UserList>({
    url: '/system/role/authUser/allocatedList',
    method: 'get',
    params
  });
}

/** 未分配用户列表 */
export function fetchRoleUnallocatedList(params: Api.System.RoleUserSearchParams) {
  return request<Api.System.UserList>({
    url: '/system/role/authUser/unallocatedList',
    method: 'get',
    params
  });
}

/** 解绑用户 */
export function fetchRoleCancelAuthUser(data: { roleId: number; userId: number }) {
  return request<void>({
    url: '/system/role/authUser/cancel',
    method: 'put',
    data
  });
}

/** 批量解绑用户 */
export function fetchRoleCancelAuthUserAll(data: { roleId: number; userIds: string }) {
  return request<void>({
    url: '/system/role/authUser/cancelAll',
    method: 'put',
    data
  });
}

/** 批量绑定用户 */
export function fetchRoleSelectAuthUserAll(data: { roleId: number; userIds: string }) {
  return request<void>({
    url: '/system/role/authUser/selectAll',
    method: 'put',
    data
  });
}

/** 导出角色 */
export function fetchRoleExport(params?: Api.System.RoleSearchParams) {
  return request<Blob, 'blob'>({
    url: '/system/role/export',
    method: 'post',
    params,
    responseType: 'blob'
  });
}
