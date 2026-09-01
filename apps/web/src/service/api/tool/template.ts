import { request } from '@/service/request';

// ==================== 模板组 ====================

/** 模板组列表 */
export function fetchTemplateListGroups(params?: Api.Tool.TemplateGroupSearchParams) {
  return request<Api.Tool.TemplateGroupList>({
    url: '/tool/gen/template/group/list',
    method: 'get',
    params
  });
}

/** 模板组详情 */
export function fetchTemplateGetGroup(id: CommonType.IdType) {
  return request<Api.Tool.TemplateGroup>({
    url: `/tool/gen/template/group/${id}`,
    method: 'get'
  });
}

/** 创建模板组 */
export function fetchTemplateCreateGroup(data: Api.Tool.TemplateGroupOperateParams) {
  return request<void>({
    url: '/tool/gen/template/group',
    method: 'post',
    data
  });
}

/** 更新模板组 */
export function fetchTemplateUpdateGroup(id: number, data: Api.Tool.TemplateGroupOperateParams) {
  return request<void>({
    url: `/tool/gen/template/group/${id}`,
    method: 'put',
    data
  });
}

/** 删除模板组 */
export function fetchTemplateDeleteGroup(id: CommonType.IdType) {
  return request<void>({
    url: `/tool/gen/template/group/${id}`,
    method: 'delete'
  });
}

/** 获取默认模板组 */
export function fetchTemplateGetDefaultGroup() {
  return request<Api.Tool.TemplateGroup>({
    url: '/tool/gen/template/group/default',
    method: 'get'
  });
}

/** 导出模板组 */
export function fetchTemplateExportGroup(id: CommonType.IdType) {
  return request<Blob, 'blob'>({
    url: `/tool/gen/template/group/${id}/export`,
    method: 'get',
    responseType: 'blob'
  });
}

/** 导入模板组 */
export function fetchTemplateImportGroup(data: Api.Tool.ImportTemplateGroupParams) {
  return request<void>({
    url: '/tool/gen/template/group/import',
    method: 'post',
    data
  });
}

// ==================== 模板 ====================

/** 模板列表 */
export function fetchTemplateList(params?: Api.Tool.TemplateSearchParams) {
  return request<Api.Tool.TemplateList>({
    url: '/tool/gen/template/list',
    method: 'get',
    params
  });
}

/** 模板详情 */
export function fetchTemplateGetOne(id: CommonType.IdType) {
  return request<Api.Tool.Template>({
    url: `/tool/gen/template/${id}`,
    method: 'get'
  });
}

/** 创建模板 */
export function fetchTemplateCreateTemplate(data: Api.Tool.TemplateOperateParams) {
  return request<void>({
    url: '/tool/gen/template',
    method: 'post',
    data
  });
}

/** 更新模板 */
export function fetchTemplateUpdateTemplate(id: number, data: Api.Tool.TemplateOperateParams) {
  return request<void>({
    url: `/tool/gen/template/${id}`,
    method: 'put',
    data
  });
}

/** 删除模板 */
export function fetchTemplateDeleteTemplate(id: CommonType.IdType) {
  return request<void>({
    url: `/tool/gen/template/${id}`,
    method: 'delete'
  });
}

/** 验证模板语法 */
export function fetchTemplateValidateTemplate(data: { content: string }) {
  return request<{ valid: boolean; error?: string }>({
    url: '/tool/gen/template/validate',
    method: 'post',
    data
  });
}
