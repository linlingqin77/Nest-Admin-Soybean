import { request } from '@/service/request';

/** 获取部门树列表 */
export function fetchUserDeptTree() {
  return request<Api.Common.CommonTreeRecord>({
    url: '/system/user/deptTree',
    method: 'get'
  });
}

/** 修改用户头像 - 需要 FormData 上传 */
export function fetchUpdateUserAvatar(formData: FormData) {
  return request<boolean>({
    url: '/system/user/profile/avatar',
    method: 'post',
    data: formData
  });
}

/** 用户列表 */
export function fetchUserFindAll(params?: Api.System.UserSearchParams) {
  return request<Api.System.UserList>({
    url: '/system/user/list',
    method: 'get',
    params
  });
}

/** 用户详情 */
export function fetchUserFindOne(userId: CommonType.IdType) {
  return request<{
    userId: CommonType.IdType;
    userName: string;
    nickName: string;
    email: string;
    phonenumber: string;
    sex: string;
    status: CommonType.EnableStatus;
    deptId: CommonType.IdType;
    remark?: string;
    roleIds: CommonType.IdType[];
    postIds: CommonType.IdType[];
    roles: Array<{ roleId: CommonType.IdType; roleName: string }>;
    posts: Array<{ postId: CommonType.IdType; postName: string }>;
  }>({
    url: `/system/user/${userId}`,
    method: 'get'
  });
}

/** 创建用户 */
export function fetchUserCreate(data: Api.System.UserOperateParams) {
  return request<void>({
    url: '/system/user',
    method: 'post',
    data,
    headers: {
      isEncrypt: 'true'
    }
  });
}

/** 更新用户 */
export function fetchUserUpdate(data: Api.System.UserOperateParams) {
  return request<void>({
    url: '/system/user',
    method: 'put',
    data
  });
}

/** 删除用户 */
export function fetchUserRemove(id: CommonType.IdType) {
  return request<void>({
    url: `/system/user/${id}`,
    method: 'delete'
  });
}

/** 修改用户状态 */
export function fetchUserChangeStatus(data: { userId: number; status: string }) {
  return request<void>({
    url: '/system/user/changeStatus',
    method: 'put',
    data
  });
}

/** 重置用户密码 */
export function fetchUserResetPwd(data: { userId: number; password: string }) {
  return request<void>({
    url: '/system/user/resetPwd',
    method: 'put',
    data,
    headers: {
      isEncrypt: 'true'
    }
  });
}

/** 获取角色和岗位列表 */
export function fetchUserFindPostAndRoleAll() {
  return request<{
    posts: Api.System.Post[];
    roles: Api.System.Role[];
  }>({
    url: '/system/user',
    method: 'get'
  });
}

/** 获取部门下的用户 */
export function fetchUserFindByDeptId(deptId: CommonType.IdType) {
  return request<Api.System.User[]>({
    url: `/system/user/list/dept/${deptId}`,
    method: 'get'
  });
}

/** 用户选择框列表 */
export function fetchUserOptionselect() {
  return request<Api.System.User[]>({
    url: '/system/user/optionselect',
    method: 'get'
  });
}

/** 获取用户分配角色详情 */
export function fetchUserAuthRole(userId: CommonType.IdType) {
  return request<{
    user: Api.System.User;
    roles: Api.System.Role[];
  }>({
    url: `/system/user/authRole/${userId}`,
    method: 'get'
  });
}

/** 更新用户角色分配 */
export function fetchUserUpdateAuthRole(data: { userId: number; roleIds: string }) {
  return request<void>({
    url: '/system/user/authRole',
    method: 'put',
    data
  });
}

/** 导出用户 */
export function fetchUserExport(params?: Api.System.UserSearchParams) {
  return request<Blob>({
    url: '/system/user/export',
    method: 'post',
    params,
    responseType: 'blob' as any
  });
}

/** 个人中心 - 用户信息 */
export function fetchUserProfile() {
  return request<Api.System.UserProfile>({
    url: '/system/user/profile',
    method: 'get'
  });
}

/** 个人中心 - 修改用户信息 */
export function fetchUserUpdateProfile(data: Api.System.UserProfileUpdateParams) {
  return request<void>({
    url: '/system/user/profile',
    method: 'put',
    data
  });
}

/** 个人中心 - 修改密码 */
export function fetchUserUpdatePwd(data: { oldPassword: string; newPassword: string }) {
  return request<void>({
    url: '/system/user/profile/updatePwd',
    method: 'put',
    data,
    headers: {
      isEncrypt: 'true'
    }
  });
}
