import { Injectable } from '@nestjs/common';
import { Prisma, SysNotifyTemplate } from '@prisma/client';
import { SoftDeleteRepository } from 'src/platform/repository';
import { PrismaService } from 'src/platform/prisma';

/**
 * 站内信模板仓储层
 */
@Injectable()
export class NotifyTemplateRepository extends SoftDeleteRepository<
  SysNotifyTemplate,
  Prisma.SysNotifyTemplateDelegate
> {
  constructor(prisma: PrismaService) {
    super(prisma, 'sysNotifyTemplate');
  }

  /**
   * 根据模板编码查询
   */
  async findByCode(code: string): Promise<SysNotifyTemplate | null> {
    return this.findOne({ code });
  }

  /**
   * 检查模板编码是否存在
   */
  async existsByCode(code: string, excludeId?: number): Promise<boolean> {
    const where: Prisma.SysNotifyTemplateWhereInput = { code };

    if (excludeId) {
      where.id = { not: excludeId };
    }

    return this.exists(where);
  }

  /**
   * 分页查询站内信模板列表
   */
  async findPageWithFilter(
    where: Prisma.SysNotifyTemplateWhereInput,
    skip: number,
    take: number,
  ): Promise<{ list: SysNotifyTemplate[]; total: number }> {
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
   * 根据模板编码查询启用的模板
   */
  async findEnabledByCode(code: string): Promise<SysNotifyTemplate | null> {
    return this.delegate.findFirst({
      where: { code, status: '0', delFlag: '0' },
    });
  }

  /**
   * 获取所有启用的模板（用于下拉选择）
   */
  async findAllEnabled(): Promise<Pick<SysNotifyTemplate, 'id' | 'name' | 'code'>[]> {
    return this.delegate.findMany({
      where: { status: '0', delFlag: '0' },
      select: {
        id: true,
        name: true,
        code: true,
      },
      orderBy: { createTime: 'desc' },
    });
  }
}
