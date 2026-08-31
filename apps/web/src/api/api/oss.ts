/**
 * @generated
 * Tag: OSS配置管理
 * Generated at: 2026-08-31T03:40:43.884Z
 */

/* eslint-disable */
import { apiRequest, buildUrl } from '@/service/request-adapter';
import type * as Types from '../types';

// ── Tag: OSS配置管理 ────────────────────────────────────────────────

// Referenced types: ChangeOssConfigStatusRequestDto, CreateOssConfigRequestDto, UpdateOssConfigRequestDto

/**
 * OSS配置管理-创建
 * @description 创建OSS配置
 */
export function fetchOssConfigCreate(body: CreateOssConfigRequestDto): Promise<unknown> {
  return apiRequest<unknown>({
    method: 'POST',
    url: '/api/v1/resource/oss/config',
    data: body,
    operationId: 'OssConfigController_create_v1',
  });
}

/**
 * OSS配置管理-更新
 * @description 修改OSS配置
 */
export function fetchOssConfigUpdate(body: UpdateOssConfigRequestDto): Promise<unknown> {
  return apiRequest<unknown>({
    method: 'PUT',
    url: '/api/v1/resource/oss/config',
    data: body,
    operationId: 'OssConfigController_update_v1',
  });
}

/**
 * OSS配置管理-详情
 * @description 根据ID获取OSS配置详情
 */
export function fetchOssConfigFindOne(id: number): Promise<unknown> {
  return apiRequest<unknown>({
    method: 'GET',
    url: buildUrl('/api/v1/resource/oss/config/{id}', { id: id }),
    operationId: 'OssConfigController_findOne_v1',
  });
}

/**
 * OSS配置管理-删除
 * @description 批量删除OSS配置，多个ID用逗号分隔
 */
export function fetchOssConfigRemove(ids: string): Promise<unknown> {
  return apiRequest<unknown>({
    method: 'DELETE',
    url: buildUrl('/api/v1/resource/oss/config/{ids}', { ids: ids }),
    operationId: 'OssConfigController_remove_v1',
  });
}

/**
 * OSS配置管理-修改状态
 * @description 修改OSS配置状态
 */
export function fetchOssConfigChangeStatus(body: ChangeOssConfigStatusRequestDto): Promise<unknown> {
  return apiRequest<unknown>({
    method: 'PUT',
    url: '/api/v1/resource/oss/config/changeStatus',
    data: body,
    operationId: 'OssConfigController_changeStatus_v1',
  });
}

/**
 * OSS配置管理-列表
 * @description 分页查询OSS配置列表
 */
export function fetchOssConfigFindAll(pageNum?: number, pageSize?: number, orderByColumn?: string, isAsc?: 'asc' | 'desc', params?: DateRangeDto, configKey?: string, bucketName?: string, region?: string, status?: StatusEnum): Promise<unknown> {
  return apiRequest<unknown>({
    method: 'GET',
    url: '/api/v1/resource/oss/config/list',
    params: {
      pageNum: pageNum ?? undefined,
      pageSize: pageSize ?? undefined,
      orderByColumn: orderByColumn ?? undefined,
      isAsc: isAsc ?? undefined,
      params: params ?? undefined,
      configKey: configKey ?? undefined,
      bucketName: bucketName ?? undefined,
      region: region ?? undefined,
      status: status ?? undefined
    },
    operationId: 'OssConfigController_findAll_v1',
  });
}
