import { Injectable } from '@nestjs/common';
import { Prisma, SysFileFolder } from '@prisma/client';
import { BaseRepository } from 'src/platform/repository';
import { PrismaService } from 'src/platform/prisma';

/**
 * 文件夹仓储层
 */
@Injectable()
export class FileFolderRepository extends BaseRepository<SysFileFolder, Prisma.SysFileFolderDelegate> {
  constructor(prisma: PrismaService) {
    super(prisma, 'sysFileFolder');
  }

  /**
   * 检查同级目录下是否存在同名文件夹
   */
  async existsByName(folderName: string, parentId: number, tenantId: string, excludeId?: number): Promise<boolean> {
    const where: Prisma.SysFileFolderWhereInput = {
      folderName,
      parentId,
      tenantId,
      delFlag: '0',
    };
    if (excludeId) {
      where.folderId = { not: excludeId };
    }
    return this.exists(where);
  }

  /**
   * 查询子文件夹列表
   */
  async findChildren(parentId: number, tenantId: string): Promise<SysFileFolder[]> {
    return this.delegate.findMany({
      where: {
        parentId,
        tenantId,
        delFlag: '0',
      },
      orderBy: { createTime: 'desc' },
    });
  }

  /**
   * 统计子文件夹数量
   */
  async countChildren(parentId: number): Promise<number> {
    return this.delegate.count({
      where: {
        parentId,
        delFlag: '0',
      },
    });
  }
}
