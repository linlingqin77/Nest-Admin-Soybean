/**
 * @generated
 * Tag: 操作日志
 * Generated at: 2026-08-31T03:40:43.885Z
 */

/* eslint-disable */
import { apiRequest, buildUrl } from '@/service/request-adapter';
import type * as Types from '../types';

// ── Tag: 操作日志 ────────────────────────────────────────────────

// Referenced types: QueryOperLogDto

/**
 * 操作日志-删除
 * @description 删除指定操作日志记录
 */
export function fetchOperlogRemove(operId: number): Promise<unknown> {
  return apiRequest<unknown>({
    method: 'DELETE',
    url: buildUrl('/api/v1/monitor/operlog/{operId}', { operId: operId }),
    operationId: 'OperlogController_remove_v1',
  });
}

/**
 * 操作日志-详情
 * @description 根据日志ID获取操作日志详情
 */
export function fetchOperlogFindOne(operId: number): Promise<unknown> {
  return apiRequest<unknown>({
    method: 'GET',
    url: buildUrl('/api/v1/monitor/operlog/{operId}', { operId: operId }),
    operationId: 'OperlogController_findOne_v1',
  });
}

/**
 * 操作日志-清除全部日志
 * @description 清空所有操作日志记录
 */
export function fetchOperlogRemoveAll(): Promise<unknown> {
  return apiRequest<unknown>({
    method: 'DELETE',
    url: '/api/v1/monitor/operlog/clean',
    operationId: 'OperlogController_removeAll_v1',
  });
}

/**
 * 操作日志-导出Excel
 * @description 导出操作日志数据为xlsx文件
 */
export function fetchOperlogExportData(body: QueryOperLogDto): Promise<unknown> {
  return apiRequest<unknown>({
    method: 'POST',
    url: '/api/v1/monitor/operlog/export',
    data: body,
    operationId: 'OperlogController_exportData_v1',
  });
}

/**
 * 操作日志-列表
 * @description 分页查询操作日志列表
 */
export function fetchOperlogFindAll(operId?: number, title?: string, businessType?: number, requestMethod?: string, operatorType?: number, operName?: string, deptName?: string, operUrl?: string, operLocation?: string, operParam?: string, jsonResult?: string, errorMsg?: string, method?: string, operIp?: string, operTime?: string, status?: '0' | '1', costTime?: number, pageNum?: number, pageSize?: number, orderByColumn?: string, isAsc?: 'asc' | 'desc', params?: DateRangeDto): Promise<unknown> {
  return apiRequest<unknown>({
    method: 'GET',
    url: '/api/v1/monitor/operlog/list',
    params: {
      operId: operId ?? undefined,
      title: title ?? undefined,
      businessType: businessType ?? undefined,
      requestMethod: requestMethod ?? undefined,
      operatorType: operatorType ?? undefined,
      operName: operName ?? undefined,
      deptName: deptName ?? undefined,
      operUrl: operUrl ?? undefined,
      operLocation: operLocation ?? undefined,
      operParam: operParam ?? undefined,
      jsonResult: jsonResult ?? undefined,
      errorMsg: errorMsg ?? undefined,
      method: method ?? undefined,
      operIp: operIp ?? undefined,
      operTime: operTime ?? undefined,
      status: status ?? undefined,
      costTime: costTime ?? undefined,
      pageNum: pageNum ?? undefined,
      pageSize: pageSize ?? undefined,
      orderByColumn: orderByColumn ?? undefined,
      isAsc: isAsc ?? undefined,
      params: params ?? undefined
    },
    operationId: 'OperlogController_findAll_v1',
  });
}
