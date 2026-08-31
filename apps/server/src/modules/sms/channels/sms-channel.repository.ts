import { Injectable } from '@nestjs/common';
import { Prisma, SysSmsChannel } from '@prisma/client';
import { SoftDeleteRepository } from 'src/platform/repository';
import { PrismaService } from 'src/platform/prisma';

/**
 * 短信渠道仓储层
 */
@Injectable()
export class SmsChannelRepository extends SoftDeleteRepository<SysSmsChannel, Prisma.SysSmsChannelDelegate> {
  constructor(prisma: PrismaService) {
    super(prisma, 'sysSmsChannel');
  }

  /**
   * 根据渠道编码查询
   */
  async findByCode(code: string): Promise<SysSmsChannel | null> {
    return this.findOne({ code });
  }

  /**
   * 检查渠道编码是否存在
   */
  async existsByCode(code: string, excludeId?: number): Promise<boolean> {
    const where: Prisma.SysSmsChannelWhereInput = { code };

    if (excludeId) {
      where.id = { not: excludeId };
    }

    return this.exists(where);
  }

  /**
   * 分页查询短信渠道列表
   */
  async findPageWithFilter(
    where: Prisma.SysSmsChannelWhereInput,
    skip: number,
    take: number,
  ): Promise<{ list: SysSmsChannel[]; total: number }> {
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
   * 查询所有启用的渠道
   */
  async findAllEnabled(): Promise<SysSmsChannel[]> {
    return this.findMany({
      where: { status: '0', delFlag: '0' },
      orderBy: { createTime: 'desc' },
    });
  }

  /**
   * 根据渠道编码查询启用的渠道
   */
  async findEnabledByCode(code: string): Promise<SysSmsChannel | null> {
    return this.findOne({ code, status: '0' });
  }
}
