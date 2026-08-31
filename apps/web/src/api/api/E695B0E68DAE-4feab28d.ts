/**
 * @generated
 * Tag: 数据源管理
 * Generated at: 2026-08-31T03:40:43.885Z
 */

/* eslint-disable */
import { apiRequest, buildUrl } from '@/service/request-adapter';
import type * as Types from '../types';

// ── Tag: 数据源管理 ────────────────────────────────────────────────

// Referenced types: CreateDataSourceDto, DataSourceResponseDto, DbColumnDto, DbTableDto, TestConnectionDto, UpdateDataSourceDto

/**
 * 创建数据源
 * @description 创建新的数据库连接配置
 */
export function fetchDataSourceCreate(body: CreateDataSourceDto): Promise<DataSourceResponseDto> {
  return apiRequest<DataSourceResponseDto>({
    method: 'POST',
    url: '/api/v1/tool/gen/datasource',
    data: body,
    operationId: 'DataSourceController_create_v1',
  });
}

/**
 * 删除数据源
 * @description 删除数据库连接配置（软删除）
 */
export function fetchDataSourceDelete(id: number): Promise<unknown> {
  return apiRequest<unknown>({
    method: 'DELETE',
    url: buildUrl('/api/v1/tool/gen/datasource/{id}', { id: id }),
    operationId: 'DataSourceController_delete_v1',
  });
}

/**
 * 查询数据源详情
 * @description 根据ID查询数据源详情
 */
export function fetchDataSourceFindOne(id: number): Promise<DataSourceResponseDto> {
  return apiRequest<DataSourceResponseDto>({
    method: 'GET',
    url: buildUrl('/api/v1/tool/gen/datasource/{id}', { id: id }),
    operationId: 'DataSourceController_findOne_v1',
  });
}

/**
 * 更新数据源
 * @description 更新数据库连接配置
 */
export function fetchDataSourceUpdate(id: number, body: UpdateDataSourceDto): Promise<DataSourceResponseDto> {
  return apiRequest<DataSourceResponseDto>({
    method: 'PUT',
    url: buildUrl('/api/v1/tool/gen/datasource/{id}', { id: id }),
    data: body,
    operationId: 'DataSourceController_update_v1',
  });
}

/**
 * 获取数据源的表列表
 * @description 获取指定数据源中的所有表
 */
export function fetchDataSourceGetTables(id: number): Promise<DbTableDto[]> {
  return apiRequest<DbTableDto[]>({
    method: 'GET',
    url: buildUrl('/api/v1/tool/gen/datasource/{id}/tables', { id: id }),
    operationId: 'DataSourceController_getTables_v1',
  });
}

/**
 * 获取表的列信息
 * @description 获取指定表的所有列信息
 */
export function fetchDataSourceGetColumns(id: number, tableName: string): Promise<DbColumnDto[]> {
  return apiRequest<DbColumnDto[]>({
    method: 'GET',
    url: buildUrl('/api/v1/tool/gen/datasource/{id}/tables/{tableName}/columns', { id: id, tableName: tableName }),
    operationId: 'DataSourceController_getColumns_v1',
  });
}

/**
 * 测试已保存的数据源连接
 * @description 测试已保存的数据库连接是否可用
 */
export function fetchDataSourceTestConnectionById(id: number): Promise<unknown> {
  return apiRequest<unknown>({
    method: 'GET',
    url: buildUrl('/api/v1/tool/gen/datasource/{id}/test', { id: id }),
    operationId: 'DataSourceController_testConnectionById_v1',
  });
}

/**
 * 查询数据源列表
 * @description 分页查询数据源列表
 */
export function fetchDataSourceList(pageNum?: number, pageSize?: number, orderByColumn?: string, isAsc?: 'asc' | 'desc', params?: DateRangeDto, name?: string, type?: 'postgresql' | 'mysql' | 'sqlite', status?: string): Promise<unknown> {
  return apiRequest<unknown>({
    method: 'GET',
    url: '/api/v1/tool/gen/datasource/list',
    params: {
      pageNum: pageNum ?? undefined,
      pageSize: pageSize ?? undefined,
      orderByColumn: orderByColumn ?? undefined,
      isAsc: isAsc ?? undefined,
      params: params ?? undefined,
      name: name ?? undefined,
      type: type ?? undefined,
      status: status ?? undefined
    },
    operationId: 'DataSourceController_list_v1',
  });
}

/**
 * 测试数据源连接
 * @description 测试数据库连接是否可用
 */
export function fetchDataSourceTestConnection(body: TestConnectionDto): Promise<unknown> {
  return apiRequest<unknown>({
    method: 'POST',
    url: '/api/v1/tool/gen/datasource/test',
    data: body,
    operationId: 'DataSourceController_testConnection_v1',
  });
}
