/**
 * @generated
 * Tag: 系统工具
 * Generated at: 2026-08-31T03:40:43.887Z
 */

/* eslint-disable */
import { apiRequest, buildUrl } from '@/service/request-adapter';
import type * as Types from '../types';

// ── Tag: 系统工具 ────────────────────────────────────────────────

// Referenced types: GenTableUpdate, GenerateCodeDto, TableName

/**
 * 修改代码生成信息
 * @description 修改表的代码生成配置
 */
export function fetchToolGenUpdate(body: GenTableUpdate): Promise<unknown> {
  return apiRequest<unknown>({
    method: 'PUT',
    url: '/api/v1/tool/gen',
    data: body,
    operationId: 'ToolController_genUpdate_v1',
  });
}

/**
 * 删除表数据
 * @description 从代码生成列表中删除表
 */
export function fetchToolRemove(id: number): Promise<unknown> {
  return apiRequest<unknown>({
    method: 'DELETE',
    url: buildUrl('/api/v1/tool/gen/{id}', { id: id }),
    operationId: 'ToolController_remove_v1',
  });
}

/**
 * 查询表详细信息
 * @description 获取代码生成表详情，包含字段信息
 */
export function fetchToolGen(id: number): Promise<unknown> {
  return apiRequest<unknown>({
    method: 'GET',
    url: buildUrl('/api/v1/tool/gen/{id}', { id: id }),
    operationId: 'ToolController_gen_v1',
  });
}

/**
 * 批量生成代码（通过表ID）
 * @description 根据表ID列表生成代码并下载为zip压缩包，文件名格式：{projectName}_{timestamp}.zip
 */
export function fetchToolBatchGenCodeByIds(body: GenerateCodeDto): Promise<unknown> {
  return apiRequest<unknown>({
    method: 'POST',
    url: '/api/v1/tool/gen/batchGenCode',
    data: body,
    operationId: 'ToolController_batchGenCodeByIds_v1',
  });
}

/**
 * 批量生成代码（通过表名）
 * @description 根据表名生成代码并下载为zip压缩包，文件名格式：{projectName}_{timestamp}.zip
 */
export function fetchToolBatchGenCode(tableNames: string, projectName?: string): Promise<unknown> {
  return apiRequest<unknown>({
    method: 'GET',
    url: '/api/v1/tool/gen/batchGenCode/zip',
    params: {
      tableNames: tableNames,
      projectName: projectName ?? undefined
    },
    operationId: 'ToolController_batchGenCode_v1',
  });
}

/**
 * 查询数据库表列表
 * @description 查询数据库中未导入的表
 */
export function fetchToolGenDbList(pageNum?: number, pageSize?: number, orderByColumn?: string, isAsc?: 'asc' | 'desc', params?: DateRangeDto, dataName?: string): Promise<unknown> {
  return apiRequest<unknown>({
    method: 'GET',
    url: '/api/v1/tool/gen/db/list',
    params: {
      pageNum: pageNum ?? undefined,
      pageSize: pageSize ?? undefined,
      orderByColumn: orderByColumn ?? undefined,
      isAsc: isAsc ?? undefined,
      params: params ?? undefined,
      dataName: dataName ?? undefined
    },
    operationId: 'ToolController_genDbList_v1',
  });
}

/**
 * 查询数据源名称列表
 * @description 获取可用的数据源名称
 */
export function fetchToolGetDataNames(): Promise<unknown> {
  return apiRequest<unknown>({
    method: 'GET',
    url: '/api/v1/tool/gen/getDataNames',
    operationId: 'ToolController_getDataNames_v1',
  });
}

/**
 * 导入表
 * @description 将数据库表导入到代码生成列表
 */
export function fetchToolGenImportTable(body: TableName): Promise<unknown> {
  return apiRequest<unknown>({
    method: 'POST',
    url: '/api/v1/tool/gen/importTable',
    data: body,
    operationId: 'ToolController_genImportTable_v1',
  });
}

/**
 * 数据表列表
 * @description 分页查询已导入的数据表列表
 */
export function fetchToolFindAll(pageNum?: number, pageSize?: number, orderByColumn?: string, isAsc?: 'asc' | 'desc', params?: DateRangeDto): Promise<unknown> {
  return apiRequest<unknown>({
    method: 'GET',
    url: '/api/v1/tool/gen/list',
    params: {
      pageNum: pageNum ?? undefined,
      pageSize: pageSize ?? undefined,
      orderByColumn: orderByColumn ?? undefined,
      isAsc: isAsc ?? undefined,
      params: params ?? undefined
    },
    operationId: 'ToolController_findAll_v1',
  });
}

/**
 * 预览生成代码
 * @description 在线预览生成的代码内容
 */
export function fetchToolPreview(id: number): Promise<unknown> {
  return apiRequest<unknown>({
    method: 'GET',
    url: buildUrl('/api/v1/tool/gen/preview/{id}', { id: id }),
    operationId: 'ToolController_preview_v1',
  });
}

/**
 * 同步表结构
 * @description 从数据库同步表字段结构
 */
export function fetchToolSynchDb(tableName: string): Promise<unknown> {
  return apiRequest<unknown>({
    method: 'GET',
    url: buildUrl('/api/v1/tool/gen/synchDb/{tableName}', { tableName: tableName }),
    operationId: 'ToolController_synchDb_v1',
  });
}
