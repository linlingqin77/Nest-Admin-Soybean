/**
 * @generated
 * Tag: 模板管理
 * Generated at: 2026-08-31T03:40:43.885Z
 */

/* eslint-disable */
import { apiRequest, buildUrl } from '@/service/request-adapter';
import type * as Types from '../types';

// ── Tag: 模板管理 ────────────────────────────────────────────────

// Referenced types: CreateTemplateDto, CreateTemplateGroupDto, ExportTemplateGroupDto, ImportTemplateGroupDto, TemplateGroupResponseDto, TemplateResponseDto, UpdateTemplateDto, UpdateTemplateGroupDto, ValidateTemplateDto

/**
 * 创建模板
 * @description 在指定模板组中创建新模板
 */
export function fetchTemplateCreateTemplate(body: CreateTemplateDto): Promise<TemplateResponseDto> {
  return apiRequest<TemplateResponseDto>({
    method: 'POST',
    url: '/api/v1/tool/gen/template',
    data: body,
    operationId: 'TemplateController_createTemplate_v1',
  });
}

/**
 * 删除模板
 * @description 删除模板（软删除）
 */
export function fetchTemplateDeleteTemplate(id: number): Promise<unknown> {
  return apiRequest<unknown>({
    method: 'DELETE',
    url: buildUrl('/api/v1/tool/gen/template/{id}', { id: id }),
    operationId: 'TemplateController_deleteTemplate_v1',
  });
}

/**
 * 查询模板详情
 * @description 根据ID查询模板详情
 */
export function fetchTemplateFindOneTemplate(id: number): Promise<TemplateResponseDto> {
  return apiRequest<TemplateResponseDto>({
    method: 'GET',
    url: buildUrl('/api/v1/tool/gen/template/{id}', { id: id }),
    operationId: 'TemplateController_findOneTemplate_v1',
  });
}

/**
 * 更新模板
 * @description 更新模板信息
 */
export function fetchTemplateUpdateTemplate(id: number, body: UpdateTemplateDto): Promise<TemplateResponseDto> {
  return apiRequest<TemplateResponseDto>({
    method: 'PUT',
    url: buildUrl('/api/v1/tool/gen/template/{id}', { id: id }),
    data: body,
    operationId: 'TemplateController_updateTemplate_v1',
  });
}

/**
 * 创建模板组
 * @description 创建新的模板组
 */
export function fetchTemplateCreateGroup(body: CreateTemplateGroupDto): Promise<TemplateGroupResponseDto> {
  return apiRequest<TemplateGroupResponseDto>({
    method: 'POST',
    url: '/api/v1/tool/gen/template/group',
    data: body,
    operationId: 'TemplateController_createGroup_v1',
  });
}

/**
 * 删除模板组
 * @description 删除模板组及其所有模板（软删除）
 */
export function fetchTemplateDeleteGroup(id: number): Promise<unknown> {
  return apiRequest<unknown>({
    method: 'DELETE',
    url: buildUrl('/api/v1/tool/gen/template/group/{id}', { id: id }),
    operationId: 'TemplateController_deleteGroup_v1',
  });
}

/**
 * 查询模板组详情
 * @description 根据ID查询模板组详情，包含所有模板
 */
export function fetchTemplateFindOneGroup(id: number): Promise<TemplateGroupResponseDto> {
  return apiRequest<TemplateGroupResponseDto>({
    method: 'GET',
    url: buildUrl('/api/v1/tool/gen/template/group/{id}', { id: id }),
    operationId: 'TemplateController_findOneGroup_v1',
  });
}

/**
 * 更新模板组
 * @description 更新模板组信息
 */
export function fetchTemplateUpdateGroup(id: number, body: UpdateTemplateGroupDto): Promise<TemplateGroupResponseDto> {
  return apiRequest<TemplateGroupResponseDto>({
    method: 'PUT',
    url: buildUrl('/api/v1/tool/gen/template/group/{id}', { id: id }),
    data: body,
    operationId: 'TemplateController_updateGroup_v1',
  });
}

/**
 * 导出模板组
 * @description 将模板组导出为 JSON 文件
 */
export function fetchTemplateExportGroup(id: number): Promise<ExportTemplateGroupDto> {
  return apiRequest<ExportTemplateGroupDto>({
    method: 'GET',
    url: buildUrl('/api/v1/tool/gen/template/group/{id}/export', { id: id }),
    operationId: 'TemplateController_exportGroup_v1',
  });
}

/**
 * 获取默认模板组
 * @description 获取当前租户或系统级的默认模板组
 */
export function fetchTemplateGetDefaultGroup(): Promise<TemplateGroupResponseDto> {
  return apiRequest<TemplateGroupResponseDto>({
    method: 'GET',
    url: '/api/v1/tool/gen/template/group/default',
    operationId: 'TemplateController_getDefaultGroup_v1',
  });
}

/**
 * 导入模板组
 * @description 从 JSON 数据导入模板组
 */
export function fetchTemplateImportGroup(body: ImportTemplateGroupDto): Promise<TemplateGroupResponseDto> {
  return apiRequest<TemplateGroupResponseDto>({
    method: 'POST',
    url: '/api/v1/tool/gen/template/group/import',
    data: body,
    operationId: 'TemplateController_importGroup_v1',
  });
}

/**
 * 查询模板组列表
 * @description 分页查询模板组列表，包含当前租户和系统级模板组
 */
export function fetchTemplateListGroups(pageNum?: number, pageSize?: number, orderByColumn?: string, isAsc?: 'asc' | 'desc', params?: DateRangeDto, name?: string, status?: string, systemOnly?: boolean): Promise<unknown> {
  return apiRequest<unknown>({
    method: 'GET',
    url: '/api/v1/tool/gen/template/group/list',
    params: {
      pageNum: pageNum ?? undefined,
      pageSize: pageSize ?? undefined,
      orderByColumn: orderByColumn ?? undefined,
      isAsc: isAsc ?? undefined,
      params: params ?? undefined,
      name: name ?? undefined,
      status: status ?? undefined,
      systemOnly: systemOnly ?? undefined
    },
    operationId: 'TemplateController_listGroups_v1',
  });
}

/**
 * 查询模板列表
 * @description 分页查询模板列表
 */
export function fetchTemplateListTemplates(pageNum?: number, pageSize?: number, orderByColumn?: string, isAsc?: 'asc' | 'desc', params?: DateRangeDto, groupId?: number, name?: string, language?: 'typescript' | 'vue' | 'sql', status?: string): Promise<unknown> {
  return apiRequest<unknown>({
    method: 'GET',
    url: '/api/v1/tool/gen/template/list',
    params: {
      pageNum: pageNum ?? undefined,
      pageSize: pageSize ?? undefined,
      orderByColumn: orderByColumn ?? undefined,
      isAsc: isAsc ?? undefined,
      params: params ?? undefined,
      groupId: groupId ?? undefined,
      name: name ?? undefined,
      language: language ?? undefined,
      status: status ?? undefined
    },
    operationId: 'TemplateController_listTemplates_v1',
  });
}

/**
 * 验证模板语法
 * @description 验证模板内容的语法是否正确，并返回使用的变量列表
 */
export function fetchTemplateValidateTemplate(body: ValidateTemplateDto): Promise<unknown> {
  return apiRequest<unknown>({
    method: 'POST',
    url: '/api/v1/tool/gen/template/validate',
    data: body,
    operationId: 'TemplateController_validateTemplate_v1',
  });
}
