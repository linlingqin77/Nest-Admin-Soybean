import { Body, Controller, Delete, Get, Param, Post, Put, Query, Res } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { FileManagerService } from './file-manager.service';
import {
  CreateFolderRequestDto,
  CreateShareRequestDto,
  ListFileRequestDto,
  ListFolderRequestDto,
  MoveFileRequestDto,
  RenameFileRequestDto,
  UpdateFolderRequestDto,
} from './dto/requests';
import { NotRequireAuth, User } from 'src/modules/users/user.decorator';
import { RequirePermission } from 'src/core/http/decorators/require-permission.decorator';
import { Api } from 'src/core/http/decorators/api.decorator';
import { Operlog } from 'src/core/audit/decorators/operlog.decorator';
import { BusinessType } from 'src/shared/constants/business.constant';
import {
  AccessTokenResponseDto,
  CreateShareResultResponseDto,
  FileListResponseDto,
  FileResponseDto,
  FileVersionListResponseDto,
  FolderResponseDto,
  FolderTreeNodeResponseDto,
  RestoreVersionResultResponseDto,
  ShareInfoResponseDto,
  ShareListResponseDto,
  StorageStatsResponseDto,
} from './dto/responses';

@ApiTags('系统-文件管理')
@ApiBearerAuth('Authorization')
@Controller('system/file-manager')
export class FileManagerController {
  constructor(private readonly fileManagerService: FileManagerService) {}

  // ==================== 文件夹管理 ====================

  @Api({ summary: '创建文件夹', type: FolderResponseDto })
  @RequirePermission('system:file:add')
  @Operlog({ businessType: BusinessType.INSERT })
  @Post('folder')
  createFolder(@Body() createFolderDto: CreateFolderRequestDto, @User('userName') username: string) {
    return this.fileManagerService.createFolder(createFolderDto, username);
  }

  @Api({ summary: '更新文件夹', type: FolderResponseDto })
  @RequirePermission('system:file:edit')
  @Operlog({ businessType: BusinessType.UPDATE })
  @Put('folder')
  updateFolder(@Body() updateFolderDto: UpdateFolderRequestDto, @User('userName') username: string) {
    return this.fileManagerService.updateFolder(updateFolderDto, username);
  }

  @Api({ summary: '删除文件夹' })
  @RequirePermission('system:file:remove')
  @Operlog({ businessType: BusinessType.DELETE })
  @Delete('folder/:folderId')
  deleteFolder(@Param('folderId') folderId: string, @User('userName') username: string) {
    return this.fileManagerService.deleteFolder(+folderId, username);
  }

  @Api({ summary: '获取文件夹列表', type: FolderResponseDto, isArray: true })
  @RequirePermission('system:file:list')
  @Get('folder/list')
  listFolders(@Query() query: ListFolderRequestDto) {
    return this.fileManagerService.listFolders(query);
  }

  @Api({ summary: '获取文件夹树', type: FolderTreeNodeResponseDto, isArray: true })
  @RequirePermission('system:file:list')
  @Get('folder/tree')
  getFolderTree() {
    return this.fileManagerService.getFolderTree();
  }

  // ==================== 文件管理 ====================

  @Api({ summary: '获取文件列表', type: FileListResponseDto })
  @RequirePermission('system:file:list')
  @Get('file/list')
  listFiles(@Query() query: ListFileRequestDto) {
    return this.fileManagerService.listFiles(query);
  }

  @Api({ summary: '移动文件' })
  @RequirePermission('system:file:edit')
  @Operlog({ businessType: BusinessType.UPDATE })
  @Post('file/move')
  moveFiles(@Body() moveFileDto: MoveFileRequestDto, @User('userName') username: string) {
    return this.fileManagerService.moveFiles(moveFileDto, username);
  }

  @Api({ summary: '重命名文件', type: FileResponseDto })
  @RequirePermission('system:file:edit')
  @Operlog({ businessType: BusinessType.UPDATE })
  @Post('file/rename')
  renameFile(@Body() renameFileDto: RenameFileRequestDto, @User('userName') username: string) {
    return this.fileManagerService.renameFile(renameFileDto, username);
  }

  @Api({ summary: '删除文件' })
  @RequirePermission('system:file:remove')
  @Operlog({ businessType: BusinessType.DELETE })
  @Delete('file')
  deleteFiles(@Body('uploadIds') uploadIds: string[], @User('userName') username: string) {
    return this.fileManagerService.deleteFiles(uploadIds, username);
  }

  @Api({ summary: '获取文件详情', type: FileResponseDto })
  @RequirePermission('system:file:query')
  @Get('file/:uploadId')
  getFileDetail(@Param('uploadId') uploadId: string) {
    return this.fileManagerService.getFileDetail(uploadId);
  }

  // ==================== 文件分享 ====================

  @Api({ summary: '创建分享链接', type: CreateShareResultResponseDto })
  @RequirePermission('system:file:share')
  @Operlog({ businessType: BusinessType.OTHER })
  @Post('share')
  createShare(@Body() createShareDto: CreateShareRequestDto, @User('userName') username: string) {
    return this.fileManagerService.createShare(createShareDto, username);
  }

  @Api({ summary: '获取分享信息（无需登录）', type: ShareInfoResponseDto })
  @NotRequireAuth()
  @Get('share/:shareId')
  getShare(@Param('shareId') shareId: string, @Query('shareCode') shareCode?: string) {
    return this.fileManagerService.getShare({ shareId, shareCode });
  }

  @Api({ summary: '下载分享文件（无需登录）' })
  @NotRequireAuth()
  @Post('share/:shareId/download')
  downloadShare(@Param('shareId') shareId: string) {
    return this.fileManagerService.downloadShare(shareId);
  }

  @Api({ summary: '取消分享' })
  @RequirePermission('system:file:share')
  @Delete('share/:shareId')
  @Operlog({ businessType: BusinessType.DELETE })
  cancelShare(@Param('shareId') shareId: string, @User('userName') username: string) {
    return this.fileManagerService.cancelShare(shareId, username);
  }

  @Api({ summary: '我的分享列表', type: ShareListResponseDto })
  @RequirePermission('system:file:share')
  @Get('share/my/list')
  myShares(@User('userName') username: string) {
    return this.fileManagerService.myShares(username);
  }

  // ==================== 回收站管理 ====================

  @Api({ summary: '获取回收站文件列表', type: FileListResponseDto })
  @RequirePermission('system:file:recycle:list')
  @Get('recycle/list')
  getRecycleList(@Query() query: ListFileRequestDto) {
    return this.fileManagerService.getRecycleList(query);
  }

  @Api({ summary: '恢复回收站文件' })
  @RequirePermission('system:file:recycle:restore')
  @Operlog({ businessType: BusinessType.UPDATE })
  @Put('recycle/restore')
  restoreFiles(@Body('uploadIds') uploadIds: string[], @User('userName') username: string) {
    return this.fileManagerService.restoreFiles(uploadIds, username);
  }

  @Api({ summary: '彻底删除回收站文件' })
  @RequirePermission('system:file:recycle:remove')
  @Operlog({ businessType: BusinessType.DELETE })
  @Delete('recycle/clear')
  clearRecycle(@Body('uploadIds') uploadIds: string[], @User('userName') username: string) {
    return this.fileManagerService.clearRecycle(uploadIds, username);
  }

  // ==================== 文件版本管理 ====================

  @Api({ summary: '获取文件版本历史', type: FileVersionListResponseDto })
  @RequirePermission('system:file:query')
  @Get('file/:uploadId/versions')
  getFileVersions(@Param('uploadId') uploadId: string) {
    return this.fileManagerService.getFileVersions(uploadId);
  }

  @Api({ summary: '恢复到指定版本', type: RestoreVersionResultResponseDto })
  @RequirePermission('system:file:edit')
  @Operlog({ businessType: BusinessType.UPDATE })
  @Post('file/restore-version')
  restoreVersion(
    @Body('fileId') fileId: string,
    @Body('targetVersionId') targetVersionId: string,
    @User('userName') username: string,
  ) {
    return this.fileManagerService.restoreVersion(fileId, targetVersionId, username);
  }

  // ==================== 文件下载 ====================

  @Api({ summary: '获取文件访问令牌', type: AccessTokenResponseDto })
  @RequirePermission('system:file:query')
  @Get('file/:uploadId/access-token')
  getAccessToken(@Param('uploadId') uploadId: string) {
    return this.fileManagerService.getAccessToken(uploadId);
  }

  @Api({ summary: '下载文件（需要令牌）' })
  @NotRequireAuth()
  @Get('file/:uploadId/download')
  async downloadFile(@Param('uploadId') uploadId: string, @Query('token') token: string, @Res() res: Response) {
    return this.fileManagerService.downloadFile(uploadId, token, res);
  }

  @Api({ summary: '批量下载文件（打包为zip）' })
  @RequirePermission('system:file:query')
  @Post('file/batch-download')
  async batchDownload(@Body('uploadIds') uploadIds: string[], @Res() res: Response) {
    return this.fileManagerService.batchDownload(uploadIds, res);
  }

  // ==================== 租户存储统计 ====================

  @Api({ summary: '获取存储使用统计', type: StorageStatsResponseDto })
  @Get('storage/stats')
  getStorageStats() {
    return this.fileManagerService.getStorageStats();
  }
}
