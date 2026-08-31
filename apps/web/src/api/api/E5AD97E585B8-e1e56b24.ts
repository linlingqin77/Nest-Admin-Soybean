/**
 * @generated
 * Tag: 字典管理
 * Generated at: 2026-08-31T03:40:43.884Z
 */

/* eslint-disable */
import { apiRequest, buildUrl } from '@/service/request-adapter';
import type * as Types from '../types';

// ── Tag: 字典管理 ────────────────────────────────────────────────

// Referenced types: CreateDictDataRequestDto, CreateDictTypeRequestDto, ListDictTypeRequestDto, UpdateDictDataRequestDto, UpdateDictTypeRequestDto

/**
 * 字典数据-创建
 * @description 在指定字典类型下创建字典数据
 */
export function fetchDictCreateDictData(body: CreateDictDataRequestDto): Promise<unknown> {
  return apiRequest<unknown>({
    method: 'POST',
    url: '/api/v1/system/dict/data',
    data: body,
    operationId: 'DictController_createDictData_v1',
  });
}

/**
 * 字典数据-修改
 * @description 修改字典数据
 */
export function fetchDictUpdateDictData(body: UpdateDictDataRequestDto): Promise<unknown> {
  return apiRequest<unknown>({
    method: 'PUT',
    url: '/api/v1/system/dict/data',
    data: body,
    operationId: 'DictController_updateDictData_v1',
  });
}

/**
 * 字典数据-删除
 * @description 批量删除字典数据，多个ID用逗号分隔
 */
export function fetchDictDeleteDictData(id: string): Promise<unknown> {
  return apiRequest<unknown>({
    method: 'DELETE',
    url: buildUrl('/api/v1/system/dict/data/{id}', { id: id }),
    operationId: 'DictController_deleteDictData_v1',
  });
}

/**
 * 字典数据-详情
 * @description 根据字典编码获取字典数据详情
 */
export function fetchDictFindOneDictData(id: number): Promise<unknown> {
  return apiRequest<unknown>({
    method: 'GET',
    url: buildUrl('/api/v1/system/dict/data/{id}', { id: id }),
    operationId: 'DictController_findOneDictData_v1',
  });
}

/**
 * 字典数据-导出Excel
 * @description 导出字典数据为xlsx文件
 */
export function fetchDictExportData(body: ListDictTypeRequestDto): Promise<unknown> {
  return apiRequest<unknown>({
    method: 'POST',
    url: '/api/v1/system/dict/data/export',
    data: body,
    operationId: 'DictController_exportData_v1',
  });
}

/**
 * 字典数据-列表
 * @description 查询指定字典类型下的数据列表
 */
export function fetchDictFindAllData(pageNum?: number, pageSize?: number, orderByColumn?: string, isAsc?: 'asc' | 'desc', params?: DateRangeDto, dictLabel?: string, dictType?: string, status?: string): Promise<unknown> {
  return apiRequest<unknown>({
    method: 'GET',
    url: '/api/v1/system/dict/data/list',
    params: {
      pageNum: pageNum ?? undefined,
      pageSize: pageSize ?? undefined,
      orderByColumn: orderByColumn ?? undefined,
      isAsc: isAsc ?? undefined,
      params: params ?? undefined,
      dictLabel: dictLabel ?? undefined,
      dictType: dictType ?? undefined,
      status: status ?? undefined
    },
    operationId: 'DictController_findAllData_v1',
  });
}

/**
 * 字典数据-按类型查询（缓存）
 * @description 根据字典类型获取字典数据列表，优先使用缓存
 */
export function fetchDictFindOneDataType(id: string): Promise<unknown> {
  return apiRequest<unknown>({
    method: 'GET',
    url: buildUrl('/api/v1/system/dict/data/type/{id}', { id: id }),
    operationId: 'DictController_findOneDataType_v1',
  });
}

/**
 * 字典类型-创建
 * @description 创建字典类型
 */
export function fetchDictCreateType(body: CreateDictTypeRequestDto): Promise<unknown> {
  return apiRequest<unknown>({
    method: 'POST',
    url: '/api/v1/system/dict/type',
    data: body,
    operationId: 'DictController_createType_v1',
  });
}

/**
 * 字典类型-修改
 * @description 修改字典类型信息
 */
export function fetchDictUpdateType(body: UpdateDictTypeRequestDto): Promise<unknown> {
  return apiRequest<unknown>({
    method: 'PUT',
    url: '/api/v1/system/dict/type',
    data: body,
    operationId: 'DictController_updateType_v1',
  });
}

/**
 * 字典类型-删除
 * @description 批量删除字典类型，多个ID用逗号分隔
 */
export function fetchDictDeleteType(id: string): Promise<unknown> {
  return apiRequest<unknown>({
    method: 'DELETE',
    url: buildUrl('/api/v1/system/dict/type/{id}', { id: id }),
    operationId: 'DictController_deleteType_v1',
  });
}

/**
 * 字典类型-详情
 * @description 根据ID获取字典类型详情
 */
export function fetchDictFindOneType(id: number): Promise<unknown> {
  return apiRequest<unknown>({
    method: 'GET',
    url: buildUrl('/api/v1/system/dict/type/{id}', { id: id }),
    operationId: 'DictController_findOneType_v1',
  });
}

/**
 * 字典类型-导出Excel
 * @description 导出字典类型为xlsx文件
 */
export function fetchDictExport(body: ListDictTypeRequestDto): Promise<unknown> {
  return apiRequest<unknown>({
    method: 'POST',
    url: '/api/v1/system/dict/type/export',
    data: body,
    operationId: 'DictController_export_v1',
  });
}

/**
 * 字典类型-列表
 * @description 分页查询字典类型列表
 */
export function fetchDictFindAllType(pageNum?: number, pageSize?: number, orderByColumn?: string, isAsc?: 'asc' | 'desc', params?: DateRangeDto, dictName?: string, dictType?: string, status?: StatusEnum): Promise<unknown> {
  return apiRequest<unknown>({
    method: 'GET',
    url: '/api/v1/system/dict/type/list',
    params: {
      pageNum: pageNum ?? undefined,
      pageSize: pageSize ?? undefined,
      orderByColumn: orderByColumn ?? undefined,
      isAsc: isAsc ?? undefined,
      params: params ?? undefined,
      dictName: dictName ?? undefined,
      dictType: dictType ?? undefined,
      status: status ?? undefined
    },
    operationId: 'DictController_findAllType_v1',
  });
}

/**
 * 字典类型-下拉选项
 * @description 获取全部字典类型用于下拉选择
 */
export function fetchDictFindOptionselect(): Promise<unknown> {
  return apiRequest<unknown>({
    method: 'GET',
    url: '/api/v1/system/dict/type/optionselect',
    operationId: 'DictController_findOptionselect_v1',
  });
}

/**
 * 字典数据-刷新缓存
 * @description 清除并重新加载字典数据缓存
 */
export function fetchDictRefreshCache(): Promise<unknown> {
  return apiRequest<unknown>({
    method: 'DELETE',
    url: '/api/v1/system/dict/type/refreshCache',
    operationId: 'DictController_refreshCache_v1',
  });
}
