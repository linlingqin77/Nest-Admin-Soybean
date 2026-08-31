import { Injectable } from '@nestjs/common';
import { Prisma, SysSmsTemplate } from '@prisma/client';
import { SoftDeleteRepository } from 'src/platform/repository';
import { PrismaService } from 'src/platform/prisma';

/**
 * 短信模板仓储层
 */
@Injectable()
export class SmsTemplateRepository extends SoftDeleteRepository<SysSmsTemplate, Prisma.SysSmsTemplateDelegate> {
  constructor(prisma: PrismaService) {
    super(prisma, 'sysSmsTemplate');
  }

  /**
   * 根据模板编码查询
   */
  async findByCode(code: string): Promise<SysSmsTemplate | null> {
    return this.findOne({ code });
  }

  /**
   * 检查模板编码是否存在
   */
  async existsByCode(code: string, excludeId?: number): Promise<boolean> {
    const where: Prisma.SysSmsTemplateWhereInput = { code };

    if (excludeId) {
      where.id = { not: excludeId };
    }

    return this.exists(where);
  }

  /**
   * 分页查询短信模板列表（包含渠道信息）
   */
  async findPageWithFilter(
    where: Prisma.SysSmsTemplateWhereInput,
    skip: number,
    take: number,
  ): Promise<{ list: (SysSmsTemplate & { channel?: { code: string; name: string } })[]; total: number }> {
    const [list, total] = await this.prisma.$transaction([
      this.delegate.findMany({
        where,
        skip,
        take,
        orderBy: { createTime: 'desc' },
        include: {
          channel: {
            select: {
              code: true,
              name: true,
            },
          },
        },
      }),
      this.delegate.count({ where }),
    ]);

    return { list, total };
  }

  /**
   * 根据模板编码查询启用的模板（包含渠道信息）
   */
  async findEnabledByCode(code: string): Promise<
    | (SysSmsTemplate & {
        channel: { code: string; name: string; signature: string; apiKey: string; apiSecret: string };
      })
    | null
  > {
    return this.delegate.findFirst({
      where: { code, status: '0', delFlag: '0' },
      include: {
        channel: {
          select: {
            code: true,
            name: true,
            signature: true,
            apiKey: true,
            apiSecret: true,
          },
        },
      },
    });
  }

  /**
   * 根据渠道ID查询模板列表
   */
  async findByChannelId(channelId: number): Promise<SysSmsTemplate[]> {
    return this.findMany({
      where: { channelId, delFlag: '0' },
      orderBy: { createTime: 'desc' },
    });
  }
}
