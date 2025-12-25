import { Controller, Get, Post, Put, Delete, Body, Query, Param, Res } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { Response } from 'express';
import { FileManagerService } from './file-manager.service';
import {
  CreateFolderDto,
  UpdateFolderDto,
  ListFolderDto,
  ListFileDto,
  MoveFileDto,
  RenameFileDto,
  CreateShareDto,
  GetShareDto,
} from './dto';
import { User, NotRequireAuth } from 'src/module/system/user/user.decorator';
import { RequirePermission } from 'src/common/decorators/require-premission.decorator';
import { Api } from 'src/common/decorators/api.decorator';
import { Operlog } from 'src/common/decorators/operlog.decorator';
import { BusinessType } from 'src/common/constant/business.constant';

@ApiTags('系统-文件管理')
@ApiBearerAuth('Authorization')
@Controller('system/file-manager')
export class FileManagerController {
  constructor(private readonly fileManagerService: FileManagerService) {}

  // ==================== 文件夹管理 ====================

  @Api({ summary: '创建文件夹' })
  @RequirePermission('system:file:add')
  @Operlog({ businessType: BusinessType.INSERT })
  @Post('folder')
  createFolder(@Body() createFolderDto: CreateFolderDto, @User('userName') username: string) {
    return this.fileManagerService.createFolder(createFolderDto, username);
  }

  @Api({ summary: '更新文件夹' })
  @RequirePermission('system:file:edit')
  @Operlog({ businessType: BusinessType.UPDATE })
  @Put('folder')
  updateFolder(@Body() updateFolderDto: UpdateFolderDto, @User('userName') username: string) {
    return this.fileManagerService.updateFolder(updateFolderDto, username);
  }

  @Api({ summary: '删除文件夹' })
  @RequirePermission('system:file:remove')
  @Operlog({ businessType: BusinessType.DELETE })
  @Delete('folder/:folderId')
  deleteFolder(@Param('folderId') folderId: string, @User('userName') username: string) {
    return this.fileManagerService.deleteFolder(+folderId, username);
  }

  @Api({ summary: '获取文件夹列表' })
  @RequirePermission('system:file:list')
  @Get('folder/list')
  listFolders(@Query() query: ListFolderDto) {
    return this.fileManagerService.listFolders(query);
  }

  @Api({ summary: '获取文件夹树' })
  @RequirePermission('system:file:list')
  @Get('folder/tree')
  getFolderTree() {
    return this.fileManagerService.getFolderTree();
  }

  // ==================== 文件管理 ====================

  @Api({ summary: '获取文件列表' })
  @RequirePermission('system:file:list')
  @Get('file/list')
  listFiles(@Query() query: ListFileDto) {
    return this.fileManagerService.listFiles(query);
  }

  @Api({ summary: '移动文件' })
  @RequirePermission('system:file:edit')
  @Operlog({ businessType: BusinessType.UPDATE })
  @Post('file/move')
  moveFiles(@Body() moveFileDto: MoveFileDto, @User('userName') username: string) {
    return this.fileManagerService.moveFiles(moveFileDto, username);
  }

  @Api({ summary: '重命名文件' })
  @RequirePermission('system:file:edit')
  @Operlog({ businessType: BusinessType.UPDATE })
  @Post('file/rename')
  renameFile(@Body() renameFileDto: RenameFileDto, @User('userName') username: string) {
    return this.fileManagerService.renameFile(renameFileDto, username);
  }

  @Api({ summary: '删除文件' })
  @RequirePermission('system:file:remove')
  @Operlog({ businessType: BusinessType.DELETE })
  @Delete('file')
  deleteFiles(@Body('uploadIds') uploadIds: string[], @User('userName') username: string) {
    return this.fileManagerService.deleteFiles(uploadIds, username);
  }

  @Api({ summary: '获取文件详情' })
  @RequirePermission('system:file:query')
  @Get('file/:uploadId')
  getFileDetail(@Param('uploadId') uploadId: string) {
    return this.fileManagerService.getFileDetail(uploadId);
  }

  // ==================== 文件分享 ====================

  @Api({ summary: '创建分享链接' })
  @RequirePermission('system:file:share')
  @Operlog({ businessType: BusinessType.OTHER })
  @Post('share')
  createShare(@Body() createShareDto: CreateShareDto, @User('userName') username: string) {
    return this.fileManagerService.createShare(createShareDto, username);
  }

  @Api({ summary: '获取分享信息（无需登录）' })
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
  cancelShare(@Param('shareId') shareId: string, @User('userName') username: string) {
    return this.fileManagerService.cancelShare(shareId, username);
  }

  @Api({ summary: '我的分享列表' })
  @RequirePermission('system:file:share')
  @Get('share/my/list')
  myShares(@User('userName') username: string) {
    return this.fileManagerService.myShares(username);
  }

  // ==================== 回收站管理 ====================

  @Api({ summary: '获取回收站文件列表' })
  @RequirePermission('system:file:recycle:list')
  @Get('recycle/list')
  getRecycleList(@Query() query: ListFileDto) {
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

  @Api({ summary: '获取文件版本历史' })
  @RequirePermission('system:file:query')
  @Get('file/:uploadId/versions')
  getFileVersions(@Param('uploadId') uploadId: string) {
    return this.fileManagerService.getFileVersions(uploadId);
  }

  @Api({ summary: '恢复到指定版本' })
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

  @Api({ summary: '获取文件访问令牌' })
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

  @Api({ summary: '获取存储使用统计' })
  @Get('storage/stats')
  getStorageStats() {
    return this.fileManagerService.getStorageStats();
  }
}
