import { request } from '@/service/request';

/** 岗位列表 */
export function fetchPostFindAll(params?: Api.System.PostSearchParams) {
  return request<Api.System.PostList>({
    url: '/system/post/list',
    method: 'get',
    params
  });
}

/** 岗位详情 */
export function fetchPostFindOne(id: CommonType.IdType) {
  return request<Api.System.Post>({
    url: `/system/post/${id}`,
    method: 'get'
  });
}

/** 创建岗位 */
export function fetchPostCreate(data: Api.System.PostOperateParams) {
  return request<void>({
    url: '/system/post/',
    method: 'post',
    data
  });
}

/** 更新岗位 */
export function fetchPostUpdate(data: Api.System.PostOperateParams) {
  return request<void>({
    url: '/system/post/',
    method: 'put',
    data
  });
}

/** 删除岗位 */
export function fetchPostRemove(ids: CommonType.IdType | string) {
  return request<void>({
    url: `/system/post/${ids}`,
    method: 'delete'
  });
}

/** 岗位选择框列表 */
export function fetchPostOptionselect(params?: { deptId?: CommonType.IdType }) {
  return request<Api.System.Post[]>({
    url: '/system/post/optionselect',
    method: 'get',
    params
  });
}

/** 岗位部门树 */
export function fetchPostDeptTree() {
  return request<Api.System.DeptTreeNode[]>({
    url: '/system/post/deptTree',
    method: 'get'
  });
}

/** 导出岗位 */
export function fetchPostExport(params?: Api.System.PostSearchParams) {
  return request<Blob, 'blob'>({
    url: '/system/post/export',
    method: 'post',
    params,
    responseType: 'blob'
  });
}
