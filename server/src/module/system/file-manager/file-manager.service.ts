import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { Result, ResponseCode } from 'src/common/response';
import { DelFlagEnum, StatusEnum } from 'src/common/enum/index';
import { BusinessException } from 'src/common/exceptions';
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
import { TenantContext } from 'src/common/tenant/tenant.context';
import { PaginationHelper } from 'src/common/utils/pagination.helper';
import { Prisma } from '@prisma/client';
import { GenerateUUID } from 'src/common/utils';
import * as crypto from 'crypto';
import * as path from 'path';
import * as fs from 'fs';
import archiver from 'archiver';
import { Response } from 'express';
import { FileAccessService } from './services/file-access.service';
import { VersionService } from '../../upload/services/version.service';
import { AppConfigService } from 'src/config/app-config.service';
import { Transactional } from 'src/common/decorators/transactional.decorator';

@Injectable()
export class FileManagerService {
  private readonly logger = new Logger(FileManagerService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly fileAccessService: FileAccessService,
    private readonly versionService: VersionService,
    private readonly config: AppConfigService,
  ) {}

  // ==================== 文件夹管理 ====================

  /**
   * 创建文件夹
   */
  async createFolder(createFolderDto: CreateFolderDto, username: string) {
    const tenantId = TenantContext.getTenantId();
    const { parentId = 0, folderName, orderNum = 0, remark } = createFolderDto;

    // 检查同级文件夹名称是否重复
    const exists = await this.prisma.sysFileFolder.findFirst({
      where: {
        tenantId,
        parentId,
        folderName,
        delFlag: DelFlagEnum.NORMAL,
      },
    });

    BusinessException.throwIf(exists !== null, '同级目录下已存在相同名称的文件夹', ResponseCode.DATA_ALREADY_EXISTS);

    // 构建文件夹路径
    let folderPath = '/';
    if (parentId > 0) {
      const parent = await this.prisma.sysFileFolder.findUnique({
        where: { folderId: parentId },
      });
      BusinessException.throwIf(!parent || parent.delFlag === '1', '父文件夹不存在', ResponseCode.DATA_NOT_FOUND);
      folderPath = `${parent.folderPath}${parent.folderName}/`;
    }

    const folder = await this.prisma.sysFileFolder.create({
      data: {
        tenantId,
        parentId,
        folderName,
        folderPath,
        orderNum,
        remark,
        createBy: username,
        updateBy: username,
      },
    });

    return Result.ok(folder);
  }

  /**
   * 更新文件夹
   */
  async updateFolder(updateFolderDto: UpdateFolderDto, username: string) {
    const tenantId = TenantContext.getTenantId();
    const { folderId, folderName, orderNum, remark } = updateFolderDto;

    const folder = await this.prisma.sysFileFolder.findUnique({
      where: { folderId },
    });

    if (!folder || folder.tenantId !== tenantId) {
      return Result.fail(ResponseCode.INTERNAL_SERVER_ERROR, '文件夹不存在');
    }

    // 如果修改了名称，检查是否重复
    if (folderName && folderName !== folder.folderName) {
      const exists = await this.prisma.sysFileFolder.findFirst({
        where: {
          tenantId,
          parentId: folder.parentId,
          folderName,
          delFlag: DelFlagEnum.NORMAL,
          folderId: { not: folderId },
        },
      });

      BusinessException.throwIf(exists !== null, '同级目录下已存在相同名称的文件夹', ResponseCode.DATA_ALREADY_EXISTS);
    }

    const updated = await this.prisma.sysFileFolder.update({
      where: { folderId },
      data: {
        ...(folderName && { folderName }),
        ...(orderNum !== undefined && { orderNum }),
        ...(remark !== undefined && { remark }),
        updateBy: username,
        updateTime: new Date(),
      },
    });

    return Result.ok(updated);
  }

  /**
   * 删除文件夹
   */
  async deleteFolder(folderId: number, username: string) {
    const tenantId = TenantContext.getTenantId();

    const folder = await this.prisma.sysFileFolder.findUnique({
      where: { folderId },
    });

    if (!folder || folder.tenantId !== tenantId) {
      return Result.fail(ResponseCode.INTERNAL_SERVER_ERROR, '文件夹不存在');
    }

    // 检查是否有子文件夹
    const hasChildren = await this.prisma.sysFileFolder.count({
      where: {
        tenantId,
        parentId: folderId,
        delFlag: DelFlagEnum.NORMAL,
      },
    });

    BusinessException.throwIf(hasChildren > 0, '该文件夹下存在子文件夹，无法删除', ResponseCode.DATA_IN_USE);

    // 检查是否有文件
    const hasFiles = await this.prisma.sysUpload.count({
      where: {
        tenantId,
        folderId,
        delFlag: DelFlagEnum.NORMAL,
      },
    });

    // 添加详细日志以便调试
    if (hasFiles > 0) {
      const files = await this.prisma.sysUpload.findMany({
        where: {
          tenantId,
          folderId,
          delFlag: DelFlagEnum.NORMAL,
        },
        select: {
          uploadId: true,
          fileName: true,
          delFlag: true,
        },
      });
      this.logger.warn(`文件夹 ${folderId} 下有 ${hasFiles} 个文件，详细信息:`, files);
    }

    BusinessException.throwIf(hasFiles > 0, '该文件夹下存在文件，无法删除', ResponseCode.DATA_IN_USE);

    await this.prisma.sysFileFolder.update({
      where: { folderId },
      data: {
        delFlag: '1',
        updateBy: username,
        updateTime: new Date(),
      },
    });

    return Result.ok();
  }

  /**
   * 获取文件夹列表
   */
  async listFolders(query: ListFolderDto) {
    const tenantId = TenantContext.getTenantId();
    const { parentId, folderName } = query;

    const where: Prisma.SysFileFolderWhereInput = {
      tenantId,
      delFlag: DelFlagEnum.NORMAL,
    };

    if (parentId !== undefined) {
      where.parentId = parentId;
    }

    if (folderName) {
      where.folderName = { contains: folderName };
    }

    const folders = await this.prisma.sysFileFolder.findMany({
      where,
      orderBy: [{ orderNum: 'asc' }, { createTime: 'desc' }],
    });

    return Result.ok(folders);
  }

  /**
   * 获取文件夹树
   */
  async getFolderTree() {
    const tenantId = TenantContext.getTenantId();

    const folders = await this.prisma.sysFileFolder.findMany({
      where: {
        tenantId,
        delFlag: DelFlagEnum.NORMAL,
      },
      orderBy: [{ orderNum: 'asc' }, { createTime: 'desc' }],
    });

    // 构建树形结构
    const buildTree = (parentId: number = 0): any[] => {
      return folders
        .filter((f) => f.parentId === parentId)
        .map((folder) => ({
          ...folder,
          children: buildTree(folder.folderId),
        }));
    };

    return Result.ok(buildTree());
  }

  // ==================== 文件管理 ====================

  /**
   * 获取文件列表
   */
  async listFiles(query: ListFileDto) {
    const tenantId = TenantContext.getTenantId();
    const { folderId, fileName, ext, exts, storageType } = query;

    const where: Prisma.SysUploadWhereInput = {
      tenantId,
      delFlag: DelFlagEnum.NORMAL,
    };

    // folderId 筛选：支持 0 表示根目录，undefined 表示所有文件
    if (folderId !== undefined) {
      where.folderId = folderId;
      this.logger.debug('[文件筛选] 按文件夹ID筛选:', folderId);
    }

    if (fileName) {
      where.fileName = { contains: fileName };
    }

    // 支持单个扩展名或多个扩展名筛选
    if (exts) {
      // 逗号分隔的扩展名列表，使用 IN 查询
      const extList = exts
        .split(',')
        .map((e) => e.trim().toLowerCase())
        .filter(Boolean);
      if (extList.length > 0) {
        where.ext = { in: extList };
        this.logger.debug('[文件筛选] 按扩展名筛选:', extList);
      }
    } else if (ext) {
      // 单个扩展名
      where.ext = ext;
      this.logger.debug('[文件筛选] 按单个扩展名:', ext);
    }

    if (storageType) {
      where.storageType = storageType;
    }

    this.logger.debug('[文件查询] 查询条件:', JSON.stringify(where, null, 2));

    const { skip, take } = PaginationHelper.getPagination(query);

    const { rows, total } = await PaginationHelper.paginateWithTransaction(
      this.prisma,
      'sysUpload',
      {
        where,
        skip,
        take,
        orderBy: { createTime: 'desc' },
      },
      { where },
    );

    return Result.ok({ rows, total });
  }

  /**
   * 移动文件
   */
  async moveFiles(moveFileDto: MoveFileDto, username: string) {
    const tenantId = TenantContext.getTenantId();
    const { uploadIds, targetFolderId } = moveFileDto;

    // 验证目标文件夹
    if (targetFolderId > 0) {
      const targetFolder = await this.prisma.sysFileFolder.findUnique({
        where: { folderId: targetFolderId },
      });

      if (!targetFolder || targetFolder.tenantId !== tenantId || targetFolder.delFlag === '1') {
        return Result.fail(ResponseCode.INTERNAL_SERVER_ERROR, '目标文件夹不存在');
      }
    }

    await this.prisma.sysUpload.updateMany({
      where: {
        uploadId: { in: uploadIds },
        tenantId,
      },
      data: {
        folderId: targetFolderId,
        updateBy: username,
        updateTime: new Date(),
      },
    });

    return Result.ok();
  }

  /**
   * 重命名文件
   */
  async renameFile(renameFileDto: RenameFileDto, username: string) {
    const tenantId = TenantContext.getTenantId();
    const { uploadId, newFileName } = renameFileDto;

    const file = await this.prisma.sysUpload.findUnique({
      where: { uploadId },
    });

    if (!file || file.tenantId !== tenantId) {
      return Result.fail(ResponseCode.INTERNAL_SERVER_ERROR, '文件不存在');
    }

    const updated = await this.prisma.sysUpload.update({
      where: { uploadId },
      data: {
        fileName: newFileName,
        updateBy: username,
        updateTime: new Date(),
      },
    });

    return Result.ok(updated);
  }

  /**
   * 删除文件
   */
  @Transactional()
  async deleteFiles(uploadIds: string[], username: string) {
    const tenantId = TenantContext.getTenantId();

    // 计算总文件大小（用于更新存储用量）
    let totalSizeMB = 0;

    // 批量删除文件
    for (const uploadId of uploadIds) {
      // 先获取文件信息以计算大小
      const file = await this.prisma.sysUpload.findUnique({
        where: { uploadId },
        select: { size: true, delFlag: true, fileName: true },
      });

      // 只有未删除的文件才需要计算大小和更新
      if (file && file.delFlag !== '1') {
        // 将字节转换为MB（向上取整，与上传时保持一致）
        const fileSizeMB = Math.ceil(file.size / 1024 / 1024);
        totalSizeMB += fileSizeMB;

        // 标记为已删除
        await this.prisma.sysUpload.update({
          where: { uploadId },
          data: {
            delFlag: '1',
            updateBy: username,
            updateTime: new Date(),
          },
        });

        this.logger.log(`删除文件: ${file.fileName}, 大小: ${fileSizeMB}MB`);
      }
    }

    // 更新租户存储用量（减少）
    if (totalSizeMB > 0) {
      await this.prisma.sysTenant.update({
        where: { tenantId },
        data: {
          storageUsed: { decrement: totalSizeMB },
        },
      });
      this.logger.log(`租户${tenantId}存储使用量减少${totalSizeMB}MB`);
    }

    return Result.ok();
  }

  /**
   * 获取文件详情
   */
  async getFileDetail(uploadId: string) {
    const tenantId = TenantContext.getTenantId();

    const file = await this.prisma.sysUpload.findUnique({
      where: { uploadId },
    });

    if (!file || file.tenantId !== tenantId || file.delFlag === '1') {
      return Result.fail(ResponseCode.INTERNAL_SERVER_ERROR, '文件不存在');
    }

    return Result.ok(file);
  }

  // ==================== 文件分享 ====================

  /**
   * 创建分享链接
   */
  async createShare(createShareDto: CreateShareDto, username: string) {
    const tenantId = TenantContext.getTenantId();
    const { uploadId, shareCode, expireHours = -1, maxDownload = -1 } = createShareDto;

    // 验证文件
    const file = await this.prisma.sysUpload.findUnique({
      where: { uploadId },
    });

    if (!file || file.tenantId !== tenantId || file.delFlag === '1') {
      return Result.fail(ResponseCode.INTERNAL_SERVER_ERROR, '文件不存在');
    }

    // 计算过期时间
    let expireTime: Date | null = null;
    if (expireHours > 0) {
      expireTime = new Date();
      expireTime.setHours(expireTime.getHours() + expireHours);
    }

    const share = await this.prisma.sysFileShare.create({
      data: {
        shareId: GenerateUUID(),
        tenantId,
        uploadId,
        shareCode,
        expireTime,
        maxDownload,
        createBy: username,
      },
    });

    return Result.ok({
      shareId: share.shareId,
      shareUrl: `/share/${share.shareId}`,
      shareCode: share.shareCode,
      expireTime: share.expireTime,
    });
  }

  /**
   * 获取分享信息
   */
  async getShare(getShareDto: GetShareDto) {
    const { shareId, shareCode } = getShareDto;

    const share = await this.prisma.sysFileShare.findUnique({
      where: { shareId },
    });

    if (!share || share.status === '1') {
      return Result.fail(ResponseCode.INTERNAL_SERVER_ERROR, '分享不存在或已失效');
    }

    // 验证分享码
    if (share.shareCode && share.shareCode !== shareCode) {
      return Result.fail(ResponseCode.INTERNAL_SERVER_ERROR, '分享码错误');
    }

    // 验证是否过期
    if (share.expireTime && share.expireTime < new Date()) {
      return Result.fail(ResponseCode.INTERNAL_SERVER_ERROR, '分享已过期');
    }

    // 验证下载次数
    if (share.maxDownload > 0 && share.downloadCount >= share.maxDownload) {
      return Result.fail(ResponseCode.INTERNAL_SERVER_ERROR, '下载次数已达上限');
    }

    // 获取文件信息
    const file = await this.prisma.sysUpload.findUnique({
      where: { uploadId: share.uploadId },
    });

    if (!file || file.delFlag === '1') {
      return Result.fail(ResponseCode.INTERNAL_SERVER_ERROR, '文件不存在');
    }

    return Result.ok({
      shareInfo: share,
      fileInfo: file,
    });
  }

  /**
   * 下载分享文件（增加下载次数）
   */
  async downloadShare(shareId: string) {
    await this.prisma.sysFileShare.update({
      where: { shareId },
      data: {
        downloadCount: { increment: 1 },
      },
    });

    return Result.ok();
  }

  /**
   * 取消分享
   */
  async cancelShare(shareId: string, username: string) {
    const tenantId = TenantContext.getTenantId();

    const share = await this.prisma.sysFileShare.findUnique({
      where: { shareId },
    });

    if (!share || share.tenantId !== tenantId) {
      return Result.fail(ResponseCode.INTERNAL_SERVER_ERROR, '分享不存在');
    }

    await this.prisma.sysFileShare.update({
      where: { shareId },
      data: { status: StatusEnum.STOP },
    });

    return Result.ok();
  }

  /**
   * 获取我的分享列表
   */
  async myShares(username: string) {
    const tenantId = TenantContext.getTenantId();

    const shares = await this.prisma.sysFileShare.findMany({
      where: {
        tenantId,
        createBy: username,
      },
      include: {
        upload: true,
      },
      orderBy: { createTime: 'desc' },
    });

    return Result.ok(shares);
  }

  // ==================== 回收站管理 ====================

  /**
   * 获取回收站文件列表
   */
  async getRecycleList(query: ListFileDto) {
    const tenantId = TenantContext.getTenantId();
    const { pageNum = 1, pageSize = 10, fileName } = query;

    const where: Prisma.SysUploadWhereInput = {
      tenantId,
      delFlag: '1', // 只查询已删除的文件
    };

    if (fileName) {
      where.fileName = { contains: fileName };
    }

    const skip = (pageNum - 1) * pageSize;
    const [files, total] = await Promise.all([
      this.prisma.sysUpload.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { updateTime: 'desc' },
      }),
      this.prisma.sysUpload.count({ where }),
    ]);

    return Result.ok({
      rows: files,
      total,
      pageNum,
      pageSize,
    });
  }

  /**
   * 恢复回收站文件
   */
  @Transactional()
  async restoreFiles(uploadIds: string[], username: string) {
    const tenantId = TenantContext.getTenantId();

    // 恢复文件并增加租户存储使用量
    for (const uploadId of uploadIds) {
      const file = await this.prisma.sysUpload.findUnique({
        where: { uploadId },
      });

      if (!file || file.tenantId !== tenantId || file.delFlag !== '1') {
        continue;
      }

      // 恢复文件
      await this.prisma.sysUpload.update({
        where: { uploadId },
        data: {
          delFlag: '0',
          updateBy: username,
          updateTime: new Date(),
        },
      });

      // 增加存储使用量
      const fileSizeMB = Math.ceil(file.size / 1024 / 1024);
      await this.prisma.sysTenant.update({
        where: { tenantId },
        data: {
          storageUsed: { increment: fileSizeMB },
        },
      });

      this.logger.log(`恢复文件: ${file.fileName}, 大小: ${fileSizeMB}MB`);
    }

    return Result.ok();
  }

  /**
   * 彻底删除回收站文件
   */
  @Transactional()
  async clearRecycle(uploadIds: string[], username: string) {
    const tenantId = TenantContext.getTenantId();

    for (const uploadId of uploadIds) {
      const file = await this.prisma.sysUpload.findUnique({
        where: { uploadId },
      });

      if (!file || file.tenantId !== tenantId || file.delFlag !== '1') {
        continue;
      }

      // 删除物理文件
      await this.versionService.deletePhysicalFile(file);

      // 删除数据库记录
      await this.prisma.sysUpload.delete({
        where: { uploadId },
      });

      this.logger.log(`彻底删除文件: ${file.fileName}`);
    }

    return Result.ok();
  }

  // ==================== 文件版本管理 ====================

  /**
   * 获取文件版本历史
   */
  async getFileVersions(uploadId: string) {
    const tenantId = TenantContext.getTenantId();

    // 获取当前文件
    const currentFile = await this.prisma.sysUpload.findUnique({
      where: { uploadId },
    });

    if (!currentFile || currentFile.tenantId !== tenantId) {
      return Result.fail(ResponseCode.INTERNAL_SERVER_ERROR, '文件不存在');
    }

    // 确定基础ID
    const baseId = currentFile.parentFileId || currentFile.uploadId;

    // 查询所有版本
    const versions = await this.prisma.sysUpload.findMany({
      where: {
        OR: [{ uploadId: baseId }, { parentFileId: baseId }],
        tenantId,
        delFlag: '0',
      },
      orderBy: { version: 'desc' },
      select: {
        uploadId: true,
        fileName: true,
        size: true,
        version: true,
        isLatest: true,
        createTime: true,
        createBy: true,
        updateTime: true,
        url: true,
        ext: true,
      },
    });

    return Result.ok({
      currentVersion: currentFile.version,
      versions,
    });
  }

  /**
   * 恢复到指定版本
   */
  async restoreVersion(fileId: string, targetVersionId: string, username: string) {
    const tenantId = TenantContext.getTenantId();

    // 获取目标版本文件
    const targetVersion = await this.prisma.sysUpload.findUnique({
      where: { uploadId: targetVersionId },
    });

    if (!targetVersion || targetVersion.tenantId !== tenantId || targetVersion.delFlag !== '0') {
      throw new BusinessException(ResponseCode.DATA_NOT_FOUND, '目标版本不存在');
    }

    // 获取当前最新版本
    const baseId = targetVersion.parentFileId || targetVersion.uploadId;
    const latestFile = await this.prisma.sysUpload.findFirst({
      where: {
        OR: [{ uploadId: baseId }, { parentFileId: baseId }],
        isLatest: true,
        delFlag: '0',
      },
    });

    if (!latestFile) {
      throw new BusinessException(ResponseCode.DATA_NOT_FOUND, '当前最新版本不存在');
    }

    // 检查isLatest状态（冲突检测）
    if (!latestFile.isLatest) {
      throw new BusinessException(ResponseCode.DATA_IN_USE, '文件已被修改，请刷新后重试');
    }

    // 使用事务创建新版本
    const newVersion = latestFile.version + 1;
    const newUploadId = GenerateUUID();

    await this.prisma.$transaction([
      // 更新旧版本的isLatest标志
      this.prisma.sysUpload.updateMany({
        where: {
          OR: [{ uploadId: baseId }, { parentFileId: baseId }],
          isLatest: true,
        },
        data: { isLatest: false },
      }),
      // 创建新版本（复制目标版本的内容）
      this.prisma.sysUpload.create({
        data: {
          uploadId: newUploadId,
          tenantId,
          fileName: targetVersion.fileName,
          newFileName: targetVersion.newFileName,
          url: targetVersion.url,
          folderId: latestFile.folderId,
          ext: targetVersion.ext,
          size: targetVersion.size,
          mimeType: targetVersion.mimeType,
          storageType: targetVersion.storageType,
          fileMd5: targetVersion.fileMd5,
          thumbnail: targetVersion.thumbnail,
          version: newVersion,
          parentFileId: baseId,
          isLatest: true,
          downloadCount: 0,
          status: '0',
          delFlag: '0',
          createBy: username,
          updateBy: username,
        },
      }),
    ]);

    // 增加存储使用量
    const fileSizeMB = Math.ceil(targetVersion.size / 1024 / 1024);
    await this.prisma.sysTenant.update({
      where: { tenantId },
      data: {
        storageUsed: { increment: fileSizeMB },
      },
    });

    // 检查并清理旧版本
    await this.versionService.checkAndCleanOldVersions(baseId);

    this.logger.log(`恢复版本: 从版本${targetVersion.version}创建新版本${newVersion}`);

    return Result.ok({
      newVersion,
      uploadId: newUploadId,
    });
  }

  // ==================== 文件下载 ====================

  /**
   * 获取文件访问令牌
   */
  async getAccessToken(uploadId: string) {
    const tenantId = TenantContext.getTenantId();

    const file = await this.prisma.sysUpload.findUnique({
      where: { uploadId },
    });

    if (!file || file.tenantId !== tenantId || file.delFlag !== '0') {
      return Result.fail(ResponseCode.INTERNAL_SERVER_ERROR, '文件不存在');
    }

    const token = this.fileAccessService.generateAccessToken(uploadId, tenantId);

    return Result.ok({
      token,
      expiresIn: 1800, // 30分钟
    });
  }

  /**
   * 下载文件（需要令牌验证）
   */
  async downloadFile(uploadId: string, token: string, res: Response) {
    // 验证令牌
    const { fileId, tenantId } = this.fileAccessService.verifyAccessToken(token);

    if (fileId !== uploadId) {
      throw new BusinessException(ResponseCode.PARAM_INVALID, '令牌与文件不匹配');
    }

    // 获取文件信息
    const file = await this.prisma.sysUpload.findUnique({
      where: { uploadId },
    });

    if (!file || file.tenantId !== tenantId || file.delFlag !== '0') {
      throw new BusinessException(ResponseCode.DATA_NOT_FOUND, '文件不存在');
    }

    // 增加下载次数
    await this.prisma.sysUpload.update({
      where: { uploadId },
      data: { downloadCount: { increment: 1 } },
    });

    // 根据存储类型返回文件
    if (file.storageType === 'local') {
      // 本地文件流式传输
      const baseDir = path.join(process.cwd(), this.config.app.file.location);
      const serveRoot = this.config.app.file.serveRoot;
      const relativePath = file.url.split(serveRoot)[1];

      if (!relativePath) {
        throw new BusinessException(ResponseCode.PARAM_INVALID, '文件路径无效');
      }

      const filePath = path.join(baseDir, relativePath);

      if (!fs.existsSync(filePath)) {
        throw new BusinessException(ResponseCode.DATA_NOT_FOUND, '文件不存在');
      }

      res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(file.fileName)}"`);
      res.setHeader('Content-Type', file.mimeType || 'application/octet-stream');

      const fileStream = fs.createReadStream(filePath);
      fileStream.pipe(res);
    } else {
      // COS文件重定向
      res.redirect(302, file.url);
    }
  }

  /**
   * 批量下载文件（打包为zip）
   */
  async batchDownload(uploadIds: string[], res: Response) {
    const tenantId = TenantContext.getTenantId();

    // 获取所有文件信息
    const files = await this.prisma.sysUpload.findMany({
      where: {
        uploadId: { in: uploadIds },
        tenantId,
        delFlag: '0',
      },
    });

    if (files.length === 0) {
      throw new BusinessException(ResponseCode.DATA_NOT_FOUND, '没有可下载的文件');
    }

    // 创建zip压缩流
    const archive = archiver('zip', {
      zlib: { level: 9 },
    });

    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="files_${Date.now()}.zip"`);

    archive.pipe(res);

    const baseDir = path.join(process.cwd(), this.config.app.file.location);
    const serveRoot = this.config.app.file.serveRoot;

    // 添加文件到压缩包
    for (const file of files) {
      if (file.storageType === 'local') {
        const relativePath = file.url.split(serveRoot)[1];
        if (relativePath) {
          const filePath = path.join(baseDir, relativePath);
          if (fs.existsSync(filePath)) {
            archive.file(filePath, { name: file.fileName });
            this.logger.log(`添加文件到压缩包: ${file.fileName}`);
          }
        }
      }
      // COS文件暂不支持批量下载
    }

    await archive.finalize();
    this.logger.log(`批量下载完成: ${files.length}个文件`);
  }

  // ==================== 租户存储统计 ====================

  /**
   * 获取租户存储使用统计
   */
  async getStorageStats() {
    const tenantId = TenantContext.getTenantId();

    const tenant = await this.prisma.sysTenant.findUnique({
      where: { tenantId },
      select: {
        storageQuota: true,
        storageUsed: true,
        companyName: true,
      },
    });

    if (!tenant) {
      return Result.fail(ResponseCode.INTERNAL_SERVER_ERROR, '租户不存在');
    }

    const { storageQuota, storageUsed, companyName } = tenant;
    const percentage = storageQuota > 0 ? (storageUsed / storageQuota) * 100 : 0;

    return Result.ok({
      used: storageUsed,
      quota: storageQuota,
      percentage: parseFloat(percentage.toFixed(2)),
      remaining: storageQuota - storageUsed,
      companyName,
    });
  }
}
