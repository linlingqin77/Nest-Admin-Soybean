import { Injectable } from '@nestjs/common';
import { Prisma, SysConfig } from '@prisma/client';
import { SoftDeleteRepository } from '../../../common/repository/soft-delete.repository';
import { PrismaService } from '../../../prisma/prisma.service';

/**
 * 配置仓储层
 */
@Injectable()
export class ConfigRepository extends SoftDeleteRepository<SysConfig, Prisma.SysConfigDelegate> {
  constructor(prisma: PrismaService) {
    super(prisma, 'sysConfig');
  }

  /**
   * 根据配置键查询
   */
  async findByConfigKey(configKey: string): Promise<SysConfig | null> {
    return this.findOne({ configKey });
  }

  /**
   * 检查配置键是否存在
   */
  async existsByConfigKey(configKey: string, excludeConfigId?: number): Promise<boolean> {
    const where: Prisma.SysConfigWhereInput = { configKey };

    if (excludeConfigId) {
      where.configId = { not: excludeConfigId };
    }

    return this.exists(where);
  }

  /**
   * 分页查询配置列表
   */
  async findPageWithFilter(
    where: Prisma.SysConfigWhereInput,
    skip: number,
    take: number,
  ): Promise<{ list: SysConfig[]; total: number }> {
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
   * 批量查询配置（用于同步租户配置）
   */
  async findByTenantId(tenantId: string): Promise<SysConfig[]> {
    return this.findMany({
      where: { tenantId },
      orderBy: { configId: 'asc' },
    });
  }

  /**
   * 批量创建配置
   */
  async createMany(data: Prisma.SysConfigCreateManyInput[]): Promise<{ count: number }> {
    const result = await this.prisma.sysConfig.createMany({
      data,
      skipDuplicates: true,
    });

    return { count: result.count };
  }
}
