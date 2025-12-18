import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { Result, ResponseCode } from 'src/common/response';
import { DelFlagEnum, StatusEnum } from 'src/common/enum/index';
import { BusinessException } from 'src/common/exceptions';
import { CreateFolderDto, UpdateFolderDto, ListFolderDto, ListFileDto, MoveFileDto, RenameFileDto, CreateShareDto, GetShareDto } from './dto';
import { TenantContext } from 'src/common/tenant/tenant.context';
import { PaginationHelper } from 'src/common/utils/pagination.helper';
import { Prisma } from '@prisma/client';
import { GenerateUUID } from 'src/common/utils';
import * as crypto from 'crypto';
import * as path from 'path';

@Injectable()
export class FileManagerService {
  private readonly logger = new Logger(FileManagerService.name);

  constructor(private readonly prisma: PrismaService) { }

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

    BusinessException.throwIf(
      exists !== null,
      '同级目录下已存在相同名称的文件夹',
      ResponseCode.DATA_ALREADY_EXISTS
    );

    // 构建文件夹路径
    let folderPath = '/';
    if (parentId > 0) {
      const parent = await this.prisma.sysFileFolder.findUnique({
        where: { folderId: parentId },
      });
      BusinessException.throwIf(
        !parent || parent.delFlag === '1',
        '父文件夹不存在',
        ResponseCode.DATA_NOT_FOUND
      );
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

      BusinessException.throwIf(
        exists !== null,
        '同级目录下已存在相同名称的文件夹',
        ResponseCode.DATA_ALREADY_EXISTS
      );
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

    BusinessException.throwIf(
      hasChildren > 0,
      '该文件夹下存在子文件夹，无法删除',
      ResponseCode.DATA_IN_USE
    );

    // 检查是否有文件
    const hasFiles = await this.prisma.sysUpload.count({
      where: {
        tenantId,
        folderId,
        delFlag: DelFlagEnum.NORMAL,
      },
    });

    BusinessException.throwIf(
      hasFiles > 0,
      '该文件夹下存在文件，无法删除',
      ResponseCode.DATA_IN_USE
    );

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
      const extList = exts.split(',').map(e => e.trim().toLowerCase()).filter(Boolean);
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
  async deleteFiles(uploadIds: string[], username: string) {
    const tenantId = TenantContext.getTenantId();

    // 批量删除文件
    for (const uploadId of uploadIds) {
      await this.prisma.sysUpload.update({
        where: { uploadId },
        data: {
          delFlag: '1',
          updateBy: username,
          updateTime: new Date(),
        },
      });
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
}
