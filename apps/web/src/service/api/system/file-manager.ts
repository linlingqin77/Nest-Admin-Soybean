import { request } from '@/service/request';

// ==================== 文件夹管理 ====================

/** 创建文件夹 */
export function fetchFileManagerCreateFolder(data: Api.System.FolderOperateParams) {
  return request<void>({
    url: '/system/file-manager/folder',
    method: 'post',
    data
  });
}

/** 更新文件夹 */
export function fetchFileManagerUpdateFolder(data: Api.System.FolderOperateParams) {
  return request<void>({
    url: '/system/file-manager/folder',
    method: 'put',
    data
  });
}

/** 删除文件夹 */
export function fetchFileManagerDeleteFolder(folderId: number) {
  return request<void>({
    url: `/system/file-manager/folder/${folderId}`,
    method: 'delete'
  });
}

/** 获取文件夹列表 */
export function fetchFileManagerGetFolderList(params?: Api.System.FolderSearchParams) {
  return request<Api.System.FolderList>({
    url: '/system/file-manager/folder/list',
    method: 'get',
    params
  });
}

/** 获取文件夹树 */
export function fetchFileManagerGetFolderTree() {
  return request<Api.System.FileFolderTreeNode[]>({
    url: '/system/file-manager/folder/tree',
    method: 'get'
  });
}

// ==================== 文件管理 ====================

/** 上传文件到指定文件夹 */
export function fetchUploadFile(file: File, folderId?: number) {
  const formData = new FormData();
  formData.append('file', file);
  if (folderId !== undefined && folderId !== 0) {
    formData.append('folderId', String(folderId));
  }
  return request<Api.System.FileInfo>({
    url: '/common/upload',
    method: 'post',
    data: formData,
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
}

/** 获取文件列表 */
export function fetchFileManagerListFiles(params?: Api.System.FileSearchParams) {
  return request<Api.System.FileList>({
    url: '/system/file-manager/file/list',
    method: 'get',
    params
  });
}

/** 移动文件 */
export function fetchFileManagerMoveFiles(data: Api.System.MoveFilesParams) {
  return request<void>({
    url: '/system/file-manager/file/move',
    method: 'post',
    data
  });
}

/** 重命名文件 */
export function fetchFileManagerRenameFile(data: Api.System.RenameFileParams) {
  return request<void>({
    url: '/system/file-manager/file/rename',
    method: 'post',
    data
  });
}

/** 批量删除文件 */
export function fetchBatchDeleteFiles(uploadIds: string[]) {
  return request<boolean>({
    url: '/system/file-manager/file',
    method: 'delete',
    data: { uploadIds }
  });
}

/** 获取文件详情 */
export function fetchFileManagerGetFileDetail(uploadId: string) {
  return request<Api.System.FileDetail>({
    url: `/system/file-manager/file/${uploadId}`,
    method: 'get'
  });
}

// ==================== 文件分享 ====================

/** 创建分享链接 */
export function fetchFileManagerCreateShare(data: Api.System.CreateShareParams) {
  return request<Api.System.ShareInfo>({
    url: '/system/file-manager/share',
    method: 'post',
    data
  });
}

/** 获取分享信息（无需登录） */
export function fetchFileManagerGetShareInfo(shareId: number) {
  return request<Api.System.ShareDetail>({
    url: `/system/file-manager/share/${shareId}`,
    method: 'get'
  });
}

/** 下载分享文件（无需登录） */
export function fetchFileManagerDownloadShareFile(shareId: number, password?: string) {
  return request<Blob, 'blob'>({
    url: `/system/file-manager/share/${shareId}/download`,
    method: 'post',
    data: { password },
    responseType: 'blob'
  });
}

/** 取消分享 */
export function fetchFileManagerDeleteShare(shareId: number) {
  return request<void>({
    url: `/system/file-manager/share/${shareId}`,
    method: 'delete'
  });
}

/** 我的分享列表 */
export function fetchFileManagerGetMyShareList(params?: Api.System.ShareSearchParams) {
  return request<Api.System.ShareList>({
    url: '/system/file-manager/share/my/list',
    method: 'get',
    params
  });
}

// ==================== 回收站 ====================

/** 获取回收站文件列表 */
export function fetchFileManagerGetRecycleList(params?: Api.System.FileManager.RecycleSearchParams) {
  return request<Api.System.FileManager.RecycleList>({
    url: '/system/file-manager/recycle/list',
    method: 'get',
    params
  });
}

/** 恢复回收站文件 */
export function fetchFileManagerRestoreFiles(uploadIds: string[]) {
  return request<void>({
    url: '/system/file-manager/recycle/restore',
    method: 'put',
    data: { uploadIds }
  });
}

/** 彻底删除回收站文件 */
export function fetchFileManagerClearRecycle(uploadIds?: string[]) {
  return request<void>({
    url: '/system/file-manager/recycle/clear',
    method: 'delete',
    data: uploadIds ? { uploadIds } : undefined
  });
}

// ==================== 文件版本 ====================

/** 获取文件版本历史 */
export function fetchFileManagerGetFileVersions(uploadId: string) {
  return request<Api.System.FileManager.FileVersions>({
    url: `/system/file-manager/file/${uploadId}/versions`,
    method: 'get'
  });
}

/** 恢复到指定版本 */
export function fetchFileManagerRestoreVersion(data: Api.System.FileManager.RestoreVersionParams) {
  return request<Api.System.FileManager.RestoreVersionResult>({
    url: '/system/file-manager/file/restore-version',
    method: 'post',
    data
  });
}

// ==================== 文件访问 ====================

/** 获取文件访问令牌 */
export function fetchFileManagerGetAccessToken(uploadId: string) {
  return request<Api.System.FileManager.FileAccessToken>({
    url: `/system/file-manager/file/${uploadId}/access-token`,
    method: 'get'
  });
}

/** 下载文件 */
export function fetchFileManagerDownloadFile(uploadId: string, token: string) {
  return request<Blob, 'blob'>({
    url: `/system/file-manager/file/${uploadId}/download`,
    method: 'get',
    params: { token },
    responseType: 'blob'
  });
}

/** 批量下载文件 */
export function fetchFileManagerBatchDownload(uploadIds: string[]) {
  return request<Blob, 'blob'>({
    url: '/system/file-manager/file/batch-download',
    method: 'post',
    data: { uploadIds },
    responseType: 'blob'
  });
}

// ==================== 存储统计 ====================

/** 获取存储使用统计 */
export function fetchFileManagerGetStorageStats() {
  return request<Api.System.FileManager.StorageStats>({
    url: '/system/file-manager/storage/stats',
    method: 'get'
  });
}
