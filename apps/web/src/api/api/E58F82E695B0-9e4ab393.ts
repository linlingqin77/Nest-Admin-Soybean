/**
 * @generated
 * Tag: 参数设置
 * Generated at: 2026-08-31T03:40:43.884Z
 */

/* eslint-disable */
import { apiRequest, buildUrl } from '@/service/request-adapter';
import type * as Types from '../types';

// ── Tag: 参数设置 ────────────────────────────────────────────────

// Referenced types: CreateConfigRequestDto, ListConfigRequestDto, UpdateConfigRequestDto

/**
 * 参数设置-创建
 * @description 创建系统参数配置
 */
export function fetchConfigCreate(body: CreateConfigRequestDto): Promise<unknown> {
  return apiRequest<unknown>({
    method: 'POST',
    url: '/api/v1/system/config',
    data: body,
    operationId: 'ConfigController_create_v1',
  });
}

/**
 * 参数设置-更新
 * @description 修改系统参数配置
 */
export function fetchConfigUpdate(body: UpdateConfigRequestDto): Promise<unknown> {
  return apiRequest<unknown>({
    method: 'PUT',
    url: '/api/v1/system/config',
    data: body,
    operationId: 'ConfigController_update_v1',
  });
}

/**
 * 参数设置-删除
 * @description 批量删除参数配置，多个ID用逗号分隔
 */
export function fetchConfigRemove(id: string): Promise<unknown> {
  return apiRequest<unknown>({
    method: 'DELETE',
    url: buildUrl('/api/v1/system/config/{id}', { id: id }),
    operationId: 'ConfigController_remove_v1',
  });
}

/**
 * 参数设置-详情
 * @description 根据ID获取参数详情
 */
export function fetchConfigFindOne(id: number): Promise<unknown> {
  return apiRequest<unknown>({
    method: 'GET',
    url: buildUrl('/api/v1/system/config/{id}', { id: id }),
    operationId: 'ConfigController_findOne_v1',
  });
}

/**
 * 参数设置-按Key查询（缓存）
 * @description 根据参数键获取参数值，优先使用缓存
 */
export function fetchConfigFindOneByconfigKey(id: string): Promise<unknown> {
  return apiRequest<unknown>({
    method: 'GET',
    url: buildUrl('/api/v1/system/config/configKey/{id}', { id: id }),
    operationId: 'ConfigController_findOneByconfigKey_v1',
  });
}

/**
 * 参数设置-导出Excel
 * @description 导出参数管理数据为xlsx文件
 */
export function fetchConfigExport(body: ListConfigRequestDto): Promise<unknown> {
  return apiRequest<unknown>({
    method: 'POST',
    url: '/api/v1/system/config/export',
    data: body,
    operationId: 'ConfigController_export_v1',
  });
}

/**
 * 参数设置-列表
 * @description 分页查询系统参数列表
 */
export function fetchConfigFindAll(pageNum?: number, pageSize?: number, orderByColumn?: string, isAsc?: 'asc' | 'desc', params?: DateRangeDto, configName?: string, configKey?: string, configType?: ConfigTypeEnum): Promise<unknown> {
  return apiRequest<unknown>({
    method: 'GET',
    url: '/api/v1/system/config/list',
    params: {
      pageNum: pageNum ?? undefined,
      pageSize: pageSize ?? undefined,
      orderByColumn: orderByColumn ?? undefined,
      isAsc: isAsc ?? undefined,
      params: params ?? undefined,
      configName: configName ?? undefined,
      configKey: configKey ?? undefined,
      configType: configType ?? undefined
    },
    operationId: 'ConfigController_findAll_v1',
  });
}

/**
 * 参数设置-刷新缓存
 * @description 清除并重新加载参数配置缓存
 */
export function fetchConfigRefreshCache(): Promise<unknown> {
  return apiRequest<unknown>({
    method: 'DELETE',
    url: '/api/v1/system/config/refreshCache',
    operationId: 'ConfigController_refreshCache_v1',
  });
}

/**
 * 参数设置-按Key更新
 * @description 根据参数键名修改参数值
 */
export function fetchConfigUpdateByKey(body: UpdateConfigRequestDto): Promise<unknown> {
  return apiRequest<unknown>({
    method: 'PUT',
    url: '/api/v1/system/config/updateByKey',
    data: body,
    operationId: 'ConfigController_updateByKey_v1',
  });
}
