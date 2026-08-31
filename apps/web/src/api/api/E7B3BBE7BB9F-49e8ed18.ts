/**
 * @generated
 * Tag: 系统-文件管理
 * Generated at: 2026-08-31T03:40:43.887Z
 */

/* eslint-disable */
import { apiRequest, buildUrl } from '@/service/request-adapter';
import type * as Types from '../types';

// ── Tag: 系统-文件管理 ────────────────────────────────────────────────

// Referenced types: CreateFolderRequestDto, CreateShareRequestDto, MoveFileRequestDto, RenameFileRequestDto, UpdateFolderRequestDto

/**
 * 删除文件
 */
export function fetchFileManagerDeleteFiles(): Promise<unknown> {
  return apiRequest<unknown>({
    method: 'DELETE',
    url: '/api/v1/system/file-manager/file',
    operationId: 'FileManagerController_deleteFiles_v1',
  });
}

/**
 * 获取文件详情
 */
export function fetchFileManagerGetFileDetail(uploadId: string): Promise<unknown> {
  return apiRequest<unknown>({
    method: 'GET',
    url: buildUrl('/api/v1/system/file-manager/file/{uploadId}', { uploadId: uploadId }),
    operationId: 'FileManagerController_getFileDetail_v1',
  });
}

/**
 * 获取文件访问令牌
 */
export function fetchFileManagerGetAccessToken(uploadId: string): Promise<unknown> {
  return apiRequest<unknown>({
    method: 'GET',
    url: buildUrl('/api/v1/system/file-manager/file/{uploadId}/access-token', { uploadId: uploadId }),
    operationId: 'FileManagerController_getAccessToken_v1',
  });
}

/**
 * 下载文件（需要令牌）
 */
export function fetchFileManagerDownloadFile(uploadId: string, token: string): Promise<unknown> {
  return apiRequest<unknown>({
    method: 'GET',
    url: buildUrl('/api/v1/system/file-manager/file/{uploadId}/download', { uploadId: uploadId }),
    params: {
      token: token
    },
    operationId: 'FileManagerController_downloadFile_v1',
  });
}

/**
 * 获取文件版本历史
 */
export function fetchFileManagerGetFileVersions(uploadId: string): Promise<unknown> {
  return apiRequest<unknown>({
    method: 'GET',
    url: buildUrl('/api/v1/system/file-manager/file/{uploadId}/versions', { uploadId: uploadId }),
    operationId: 'FileManagerController_getFileVersions_v1',
  });
}

/**
 * 批量下载文件（打包为zip）
 */
export function fetchFileManagerBatchDownload(): Promise<unknown> {
  return apiRequest<unknown>({
    method: 'POST',
    url: '/api/v1/system/file-manager/file/batch-download',
    operationId: 'FileManagerController_batchDownload_v1',
  });
}

/**
 * 获取文件列表
 */
export function fetchFileManagerListFiles(folderId?: number, fileName?: string, ext?: string, exts?: string, storageType?: string, pageNum?: number, pageSize?: number): Promise<unknown> {
  return apiRequest<unknown>({
    method: 'GET',
    url: '/api/v1/system/file-manager/file/list',
    params: {
      folderId: folderId ?? undefined,
      fileName: fileName ?? undefined,
      ext: ext ?? undefined,
      exts: exts ?? undefined,
      storageType: storageType ?? undefined,
      pageNum: pageNum ?? undefined,
      pageSize: pageSize ?? undefined
    },
    operationId: 'FileManagerController_listFiles_v1',
  });
}

/**
 * 移动文件
 */
export function fetchFileManagerMoveFiles(body: MoveFileRequestDto): Promise<unknown> {
  return apiRequest<unknown>({
    method: 'POST',
    url: '/api/v1/system/file-manager/file/move',
    data: body,
    operationId: 'FileManagerController_moveFiles_v1',
  });
}

/**
 * 重命名文件
 */
export function fetchFileManagerRenameFile(body: RenameFileRequestDto): Promise<unknown> {
  return apiRequest<unknown>({
    method: 'POST',
    url: '/api/v1/system/file-manager/file/rename',
    data: body,
    operationId: 'FileManagerController_renameFile_v1',
  });
}

/**
 * 恢复到指定版本
 */
export function fetchFileManagerRestoreVersion(): Promise<unknown> {
  return apiRequest<unknown>({
    method: 'POST',
    url: '/api/v1/system/file-manager/file/restore-version',
    operationId: 'FileManagerController_restoreVersion_v1',
  });
}

/**
 * 创建文件夹
 */
export function fetchFileManagerCreateFolder(body: CreateFolderRequestDto): Promise<unknown> {
  return apiRequest<unknown>({
    method: 'POST',
    url: '/api/v1/system/file-manager/folder',
    data: body,
    operationId: 'FileManagerController_createFolder_v1',
  });
}

/**
 * 更新文件夹
 */
export function fetchFileManagerUpdateFolder(body: UpdateFolderRequestDto): Promise<unknown> {
  return apiRequest<unknown>({
    method: 'PUT',
    url: '/api/v1/system/file-manager/folder',
    data: body,
    operationId: 'FileManagerController_updateFolder_v1',
  });
}

/**
 * 删除文件夹
 */
export function fetchFileManagerDeleteFolder(folderId: string): Promise<unknown> {
  return apiRequest<unknown>({
    method: 'DELETE',
    url: buildUrl('/api/v1/system/file-manager/folder/{folderId}', { folderId: folderId }),
    operationId: 'FileManagerController_deleteFolder_v1',
  });
}

/**
 * 获取文件夹列表
 */
export function fetchFileManagerListFolders(parentId?: number, folderName?: string): Promise<unknown> {
  return apiRequest<unknown>({
    method: 'GET',
    url: '/api/v1/system/file-manager/folder/list',
    params: {
      parentId: parentId ?? undefined,
      folderName: folderName ?? undefined
    },
    operationId: 'FileManagerController_listFolders_v1',
  });
}

/**
 * 获取文件夹树
 */
export function fetchFileManagerGetFolderTree(): Promise<unknown> {
  return apiRequest<unknown>({
    method: 'GET',
    url: '/api/v1/system/file-manager/folder/tree',
    operationId: 'FileManagerController_getFolderTree_v1',
  });
}

/**
 * 彻底删除回收站文件
 */
export function fetchFileManagerClearRecycle(): Promise<unknown> {
  return apiRequest<unknown>({
    method: 'DELETE',
    url: '/api/v1/system/file-manager/recycle/clear',
    operationId: 'FileManagerController_clearRecycle_v1',
  });
}

/**
 * 获取回收站文件列表
 */
export function fetchFileManagerGetRecycleList(folderId?: number, fileName?: string, ext?: string, exts?: string, storageType?: string, pageNum?: number, pageSize?: number): Promise<unknown> {
  return apiRequest<unknown>({
    method: 'GET',
    url: '/api/v1/system/file-manager/recycle/list',
    params: {
      folderId: folderId ?? undefined,
      fileName: fileName ?? undefined,
      ext: ext ?? undefined,
      exts: exts ?? undefined,
      storageType: storageType ?? undefined,
      pageNum: pageNum ?? undefined,
      pageSize: pageSize ?? undefined
    },
    operationId: 'FileManagerController_getRecycleList_v1',
  });
}

/**
 * 恢复回收站文件
 */
export function fetchFileManagerRestoreFiles(): Promise<unknown> {
  return apiRequest<unknown>({
    method: 'PUT',
    url: '/api/v1/system/file-manager/recycle/restore',
    operationId: 'FileManagerController_restoreFiles_v1',
  });
}

/**
 * 创建分享链接
 */
export function fetchFileManagerCreateShare(body: CreateShareRequestDto): Promise<unknown> {
  return apiRequest<unknown>({
    method: 'POST',
    url: '/api/v1/system/file-manager/share',
    data: body,
    operationId: 'FileManagerController_createShare_v1',
  });
}

/**
 * 取消分享
 */
export function fetchFileManagerCancelShare(shareId: string): Promise<unknown> {
  return apiRequest<unknown>({
    method: 'DELETE',
    url: buildUrl('/api/v1/system/file-manager/share/{shareId}', { shareId: shareId }),
    operationId: 'FileManagerController_cancelShare_v1',
  });
}

/**
 * 获取分享信息（无需登录）
 */
export function fetchFileManagerGetShare(shareId: string, shareCode: string): Promise<unknown> {
  return apiRequest<unknown>({
    method: 'GET',
    url: buildUrl('/api/v1/system/file-manager/share/{shareId}', { shareId: shareId }),
    params: {
      shareCode: shareCode
    },
    operationId: 'FileManagerController_getShare_v1',
  });
}

/**
 * 下载分享文件（无需登录）
 */
export function fetchFileManagerDownloadShare(shareId: string): Promise<unknown> {
  return apiRequest<unknown>({
    method: 'POST',
    url: buildUrl('/api/v1/system/file-manager/share/{shareId}/download', { shareId: shareId }),
    operationId: 'FileManagerController_downloadShare_v1',
  });
}

/**
 * 我的分享列表
 */
export function fetchFileManagerMyShares(): Promise<unknown> {
  return apiRequest<unknown>({
    method: 'GET',
    url: '/api/v1/system/file-manager/share/my/list',
    operationId: 'FileManagerController_myShares_v1',
  });
}

/**
 * 获取存储使用统计
 */
export function fetchFileManagerGetStorageStats(): Promise<unknown> {
  return apiRequest<unknown>({
    method: 'GET',
    url: '/api/v1/system/file-manager/storage/stats',
    operationId: 'FileManagerController_getStorageStats_v1',
  });
}
