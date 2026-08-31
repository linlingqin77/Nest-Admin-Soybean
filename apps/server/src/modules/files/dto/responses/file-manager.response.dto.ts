import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { BaseResponseDto } from 'src/shared/dto/base.response.dto';

// ==================== 文件夹相关 Response DTO ====================

/**
 * 文件夹信息响应 DTO
 */
export class FolderResponseDto extends BaseResponseDto {
  @Expose()
  @ApiProperty({ description: '文件夹ID' })
  folderId: number;

  @Expose()
  @ApiProperty({ description: '父文件夹ID' })
  parentId: number;

  @Expose()
  @ApiProperty({ description: '文件夹名称' })
  folderName: string;

  @Expose()
  @ApiProperty({ description: '文件夹路径' })
  folderPath: string;

  @Expose()
  @ApiProperty({ description: '排序' })
  orderNum: number;
}

/**
 * 文件夹树节点响应 DTO
 */
export class FolderTreeNodeResponseDto extends BaseResponseDto {
  @Expose()
  @ApiProperty({ description: '文件夹ID' })
  folderId: number;

  @Expose()
  @ApiProperty({ description: '父文件夹ID' })
  parentId: number;

  @Expose()
  @ApiProperty({ description: '文件夹名称' })
  folderName: string;

  @Expose()
  @ApiProperty({ description: '文件夹路径' })
  folderPath: string;

  @Expose()
  @ApiProperty({ description: '排序' })
  orderNum: number;

  @Expose()
  @Type(() => FolderTreeNodeResponseDto)
  @ApiProperty({ description: '子文件夹', type: [FolderTreeNodeResponseDto], required: false })
  children?: FolderTreeNodeResponseDto[];
}

/**
 * 文件夹列表响应 DTO
 */
export class FolderListResponseDto {
  @ApiProperty({ description: '文件夹列表', type: [FolderResponseDto] })
  rows: FolderResponseDto[];

  @ApiProperty({ description: '总数量' })
  total: number;
}

// ==================== 文件相关 Response DTO ====================

/**
 * 文件信息响应 DTO
 */
export class FileResponseDto extends BaseResponseDto {
  @Expose()
  @ApiProperty({ description: '上传ID' })
  uploadId: string;

  @Expose()
  @ApiProperty({ description: '原始文件名' })
  fileName: string;

  @Expose()
  @ApiProperty({ description: '存储文件名' })
  newFileName: string;

  @Expose()
  @ApiProperty({ description: '文件大小（字节）' })
  size: number;

  @Expose()
  @ApiProperty({ description: '文件MIME类型' })
  mimeType: string;

  @Expose()
  @ApiProperty({ description: '文件扩展名' })
  ext: string;

  @Expose()
  @ApiProperty({ description: '所属文件夹ID' })
  folderId: number;

  @Expose()
  @ApiProperty({ description: '文件访问URL' })
  url: string;

  @Expose()
  @ApiProperty({ description: '缩略图URL', required: false })
  thumbnail: string;

  @Expose()
  @ApiProperty({ description: '存储类型' })
  storageType: string;

  @Expose()
  @ApiProperty({ description: '文件MD5' })
  fileMd5: string;

  @Expose()
  @ApiProperty({ description: '版本号' })
  version: number;

  @Expose()
  @ApiProperty({ description: '是否最新版本' })
  isLatest: boolean;

  @Expose()
  @ApiProperty({ description: '下载次数' })
  downloadCount: number;
}

/**
 * 文件列表响应 DTO
 */
export class FileListResponseDto {
  @ApiProperty({ description: '文件列表', type: [FileResponseDto] })
  rows: FileResponseDto[];

  @ApiProperty({ description: '总数量' })
  total: number;
}

// ==================== 文件版本相关 Response DTO ====================

/**
 * 文件版本信息响应 DTO
 */
export class FileVersionResponseDto {
  @Expose()
  @ApiProperty({ description: '上传ID' })
  uploadId: string;

  @Expose()
  @ApiProperty({ description: '文件名' })
  fileName: string;

  @Expose()
  @ApiProperty({ description: '文件大小' })
  size: number;

  @Expose()
  @ApiProperty({ description: '版本号' })
  version: number;

  @Expose()
  @ApiProperty({ description: '是否最新版本' })
  isLatest: boolean;

  @Expose()
  @ApiProperty({ description: '文件扩展名' })
  ext: string;

  @Expose()
  @ApiProperty({ description: '文件URL' })
  url: string;

  @Expose()
  @ApiProperty({ description: '创建者' })
  createBy: string;
}

/**
 * 文件版本列表响应 DTO
 */
export class FileVersionListResponseDto {
  @ApiProperty({ description: '当前版本号' })
  currentVersion: number;

  @ApiProperty({ description: '版本列表', type: [FileVersionResponseDto] })
  versions: FileVersionResponseDto[];
}

/**
 * 恢复版本结果响应 DTO
 */
export class RestoreVersionResultResponseDto {
  @Expose()
  @ApiProperty({ description: '新版本号' })
  newVersion: number;

  @Expose()
  @ApiProperty({ description: '新上传ID' })
  uploadId: string;
}

// ==================== 分享相关 Response DTO ====================

/**
 * 分享信息响应 DTO
 */
export class ShareResponseDto extends BaseResponseDto {
  @Expose()
  @ApiProperty({ description: '分享ID' })
  shareId: string;

  @Expose()
  @ApiProperty({ description: '上传ID' })
  uploadId: string;

  @Expose()
  @ApiProperty({ description: '分享码', required: false })
  shareCode: string;

  @Expose()
  @ApiProperty({ description: '过期时间', required: false })
  expireTime: Date;

  @Expose()
  @ApiProperty({ description: '最大下载次数' })
  maxDownload: number;

  @Expose()
  @ApiProperty({ description: '下载次数' })
  downloadCount: number;

  @Expose()
  @ApiProperty({ description: '状态' })
  status: string;

  @Expose()
  @Type(() => FileResponseDto)
  @ApiProperty({ description: '关联的文件信息', type: FileResponseDto, required: false })
  upload?: FileResponseDto;
}

/**
 * 创建分享结果响应 DTO
 */
export class CreateShareResultResponseDto {
  @Expose()
  @ApiProperty({ description: '分享ID' })
  shareId: string;

  @Expose()
  @ApiProperty({ description: '分享链接' })
  shareUrl: string;

  @Expose()
  @ApiProperty({ description: '分享码', required: false })
  shareCode: string;

  @Expose()
  @ApiProperty({ description: '过期时间', required: false })
  expireTime: Date;
}

/**
 * 分享详情响应 DTO（包含文件信息）
 */
export class ShareInfoResponseDto {
  @ApiProperty({ description: '分享信息' })
  shareInfo: ShareResponseDto;

  @ApiProperty({ description: '文件信息', type: FileResponseDto })
  fileInfo: FileResponseDto;
}

/**
 * 分享列表响应 DTO
 */
export class ShareListResponseDto {
  @ApiProperty({ description: '分享列表', type: [ShareResponseDto] })
  rows: ShareResponseDto[];

  @ApiProperty({ description: '总数量' })
  total: number;
}

// ==================== 存储统计相关 Response DTO ====================

/**
 * 存储使用统计响应 DTO
 */
export class StorageStatsResponseDto {
  @Expose()
  @ApiProperty({ description: '已使用存储空间（MB）' })
  used: number;

  @Expose()
  @ApiProperty({ description: '总存储空间（MB）' })
  quota: number;

  @Expose()
  @ApiProperty({ description: '使用百分比' })
  percentage: number;

  @Expose()
  @ApiProperty({ description: '剩余空间（MB）' })
  remaining: number;

  @Expose()
  @ApiProperty({ description: '公司名称' })
  companyName: string;
}

// ==================== 文件下载相关 Response DTO ====================

/**
 * 文件访问令牌响应 DTO
 */
export class AccessTokenResponseDto {
  @Expose()
  @ApiProperty({ description: '访问令牌' })
  token: string;

  @Expose()
  @ApiProperty({ description: '过期时间（秒）' })
  expiresIn: number;
}
