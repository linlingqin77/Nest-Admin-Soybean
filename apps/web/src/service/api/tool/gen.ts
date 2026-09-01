import { request } from '@/service/request';

/** 数据表列表 */
export function fetchToolFindAll(params?: Api.Tool.GenTableSearchParams) {
  return request<Api.Tool.GenTableList>({
    url: '/tool/gen/list',
    method: 'get',
    params
  });
}

/** 查询数据库表列表 */
export function fetchToolGenDbList(params?: Api.Tool.GenTableSearchParams) {
  return request<Api.Tool.GenTableList>({
    url: '/tool/gen/db/list',
    method: 'get',
    params
  });
}

/** 查询数据源名称列表 */
export function fetchToolGetDataNames() {
  return request<string[]>({
    url: '/tool/gen/getDataNames',
    method: 'get'
  });
}

/** 导入表 */
export function fetchToolGenImportTable(data: { tables: string; dataName?: string }) {
  return request<void>({
    url: '/tool/gen/importTable',
    method: 'post',
    data
  });
}

/** 同步表结构 */
export function fetchToolSynchDb(tableName: string) {
  return request<void>({
    url: `/tool/gen/synchDb/${tableName}`,
    method: 'get'
  });
}

/** 查询表详细信息 */
export function fetchToolFindOne(id: CommonType.IdType) {
  return request<Api.Tool.GenTableDetail>({
    url: `/tool/gen/${id}`,
    method: 'get'
  });
}

/** 修改代码生成信息 */
export function fetchToolGenUpdate(data: Api.Tool.GenTableUpdate) {
  return request<void>({
    url: '/tool/gen',
    method: 'put',
    data
  });
}

/** 删除表数据 */
export function fetchToolRemove(id: CommonType.IdType) {
  return request<void>({
    url: `/tool/gen/${id}`,
    method: 'delete'
  });
}

/** 预览生成代码 */
export function fetchToolPreview(id: CommonType.IdType) {
  return request<Api.Tool.PreviewFile[]>({
    url: `/tool/gen/preview/${id}`,
    method: 'get'
  });
}

/** 批量生成代码（通过表名） */
export function fetchToolBatchGenCodeByNames(tables: string) {
  return request<Blob, 'blob'>({
    url: '/tool/gen/batchGenCode/zip',
    method: 'get',
    params: { tables },
    responseType: 'blob'
  });
}

/** 批量生成代码（通过表ID） */
export function fetchToolGen(tableIds: number[]) {
  return request<Blob, 'blob'>({
    url: '/tool/gen/batchGenCode',
    method: 'post',
    data: { tableIds },
    responseType: 'blob'
  });
}

/** GenTableUpdate 类型导出 */
export type GenTableUpdate = Api.Tool.GenTableUpdate;
