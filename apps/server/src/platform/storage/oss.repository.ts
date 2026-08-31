import { Injectable } from '@nestjs/common';
import { Prisma, SysOss } from '@prisma/client';
import { SoftDeleteRepository } from 'src/platform/repository';
import { PrismaService } from 'src/platform/prisma';
import { DelFlagEnum } from 'src/shared/enums/index';

/**
 * OSS文件仓储层
 */
@Injectable()
export class OssRepository extends SoftDeleteRepository<SysOss, Prisma.SysOssDelegate> {
  constructor(prisma: PrismaService) {
    super(prisma, 'sysOss');
  }

  /**
   * 根据文件名查询
   */
  async findByFileName(fileName: string): Promise<SysOss | null> {
    return this.findOne({ fileName });
  }

  /**
   * 根据 ossId 查询（bigint 类型）
   */
  async findByOssId(ossId: bigint): Promise<SysOss | null> {
    return this.delegate.findFirst({
      where: {
        ossId,
        delFlag: DelFlagEnum.NORMAL,
      },
    });
  }

  /**
   * 根据ID列表查询
   */
  async findByIds(ossIds: bigint[]): Promise<SysOss[]> {
    return this.delegate.findMany({
      where: {
        ossId: { in: ossIds },
        delFlag: DelFlagEnum.NORMAL,
      },
    });
  }

  /**
   * 批量软删除（bigint 类型）
   */
  async softDeleteByOssIds(ossIds: bigint[]): Promise<number> {
    const result = await this.delegate.updateMany({
      where: {
        ossId: { in: ossIds },
      },
      data: { delFlag: '1' },
    });
    return result.count;
  }

  /**
   * 分页查询OSS文件列表
   */
  async findPageWithFilter(
    where: Prisma.SysOssWhereInput,
    skip: number,
    take: number,
  ): Promise<{ list: SysOss[]; total: number }> {
    const [list, total] = await this.prisma.$transaction([
      this.delegate.findMany({
        where,
        skip,
        take,
        orderBy: { createTime: 'desc' },
      }),
      this.delegate.count({ where }),
    ]);

    return { list, total };
  }
}
