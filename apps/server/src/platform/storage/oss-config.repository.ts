import { Injectable } from '@nestjs/common';
import { Prisma, SysOssConfig } from '@prisma/client';
import { SoftDeleteRepository } from 'src/platform/repository';
import { PrismaService } from 'src/platform/prisma';

/**
 * OSS配置仓储层
 */
@Injectable()
export class OssConfigRepository extends SoftDeleteRepository<SysOssConfig, Prisma.SysOssConfigDelegate> {
  constructor(prisma: PrismaService) {
    super(prisma, 'sysOssConfig');
  }

  /**
   * 根据配置key查询
   */
  async findByConfigKey(configKey: string): Promise<SysOssConfig | null> {
    return this.findOne({ configKey });
  }

  /**
   * 检查配置key是否存在
   */
  async existsByConfigKey(configKey: string, excludeId?: number): Promise<boolean> {
    const where: Prisma.SysOssConfigWhereInput = { configKey };

    if (excludeId) {
      where.ossConfigId = { not: excludeId };
    }

    return this.exists(where);
  }

  /**
   * 分页查询OSS配置列表
   */
  async findPageWithFilter(
    where: Prisma.SysOssConfigWhereInput,
    skip: number,
    take: number,
  ): Promise<{ list: SysOssConfig[]; total: number }> {
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

  /**
   * 获取默认配置（status=0）
   */
  async findDefaultConfig(): Promise<SysOssConfig | null> {
    return this.findOne({ status: '0' });
  }
}
