/**
 * @generated
 * Tag: 通用-文件上传
 * Generated at: 2026-08-31T03:40:43.888Z
 */

/* eslint-disable */
import { apiRequest, buildUrl } from '@/service/request-adapter';
import type * as Types from '../types';

// ── Tag: 通用-文件上传 ────────────────────────────────────────────────

// Referenced types: ChunkMergeFileDto

/**
 * 文件上传
 * @description 上传单个文件
 */
export function fetchUploadSingleFileUpload(): Promise<unknown> {
  return apiRequest<unknown>({
    method: 'POST',
    url: '/api/v1/common/upload',
    operationId: 'UploadController_singleFileUpload_v1',
  });
}

/**
 * 文件分片上传
 * @description 上传文件分片
 */
export function fetchUploadChunkFileUpload(): Promise<unknown> {
  return apiRequest<unknown>({
    method: 'POST',
    url: '/api/v1/common/upload/chunk',
    operationId: 'UploadController_chunkFileUpload_v1',
  });
}

/**
 * 文件分片合并
 * @description 合并所有分片为完整文件
 */
export function fetchUploadChunkMergeFile(body: ChunkMergeFileDto): Promise<unknown> {
  return apiRequest<unknown>({
    method: 'POST',
    url: '/api/v1/common/upload/chunk/merge',
    data: body,
    operationId: 'UploadController_chunkMergeFile_v1',
  });
}

/**
 * 获取切片上传任务结果
 * @description 查询切片上传任务的状态
 */
export function fetchUploadGetChunkUploadResult(uploadId: string): Promise<unknown> {
  return apiRequest<unknown>({
    method: 'GET',
    url: '/api/v1/common/upload/chunk/result',
    params: {
      uploadId: uploadId
    },
    operationId: 'UploadController_getChunkUploadResult_v1',
  });
}

/**
 * 获取切片上传任务Id
 * @description 初始化切片上传，获取任务ID
 */
export function fetchUploadGetChunkUploadId(): Promise<unknown> {
  return apiRequest<unknown>({
    method: 'GET',
    url: '/api/v1/common/upload/chunk/uploadId',
    operationId: 'UploadController_getChunkUploadId_v1',
  });
}

/**
 * 获取cos授权
 * @description 获取腾讯云COS上传临时授权密钥
 */
export function fetchUploadGetAuthorization(key: string): Promise<unknown> {
  return apiRequest<unknown>({
    method: 'GET',
    url: '/api/v1/common/upload/cos/authorization',
    params: {
      key: key
    },
    operationId: 'UploadController_getAuthorization_v1',
  });
}
