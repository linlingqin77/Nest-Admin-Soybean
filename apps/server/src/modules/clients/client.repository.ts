import { Injectable } from '@nestjs/common';
import { Prisma, SysClient } from '@prisma/client';
import { SoftDeleteRepository } from 'src/platform/repository';
import { PrismaService } from 'src/platform/prisma';

/**
 * 客户端仓储层
 */
@Injectable()
export class ClientRepository extends SoftDeleteRepository<SysClient, Prisma.SysClientDelegate> {
  constructor(prisma: PrismaService) {
    super(prisma, 'sysClient');
  }

  /**
   * 根据客户端key查询
   */
  async findByClientKey(clientKey: string): Promise<SysClient | null> {
    return this.findOne({ clientKey });
  }

  /**
   * 根据客户端ID查询
   */
  async findByClientId(clientId: string): Promise<SysClient | null> {
    return this.findOne({ clientId });
  }

  /**
   * 检查客户端key是否存在
   */
  async existsByClientKey(clientKey: string, excludeId?: number): Promise<boolean> {
    const where: Prisma.SysClientWhereInput = { clientKey };

    if (excludeId) {
      where.id = { not: excludeId };
    }

    return this.exists(where);
  }

  /**
   * 分页查询客户端列表
   */
  async findPageWithFilter(
    where: Prisma.SysClientWhereInput,
    skip: number,
    take: number,
  ): Promise<{ list: SysClient[]; total: number }> {
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
