import { Injectable } from '@nestjs/common';
import { Prisma, SysMailTemplate } from '@prisma/client';
import { SoftDeleteRepository } from 'src/platform/repository';
import { PrismaService } from 'src/platform/prisma';

/**
 * 邮件模板仓储层
 */
@Injectable()
export class MailTemplateRepository extends SoftDeleteRepository<SysMailTemplate, Prisma.SysMailTemplateDelegate> {
  constructor(prisma: PrismaService) {
    super(prisma, 'sysMailTemplate');
  }

  /**
   * 根据模板编码查询
   */
  async findByCode(code: string): Promise<SysMailTemplate | null> {
    return this.findOne({ code });
  }

  /**
   * 检查模板编码是否存在
   */
  async existsByCode(code: string, excludeId?: number): Promise<boolean> {
    const where: Prisma.SysMailTemplateWhereInput = { code };

    if (excludeId) {
      where.id = { not: excludeId };
    }

    return this.exists(where);
  }

  /**
   * 分页查询邮件模板列表（包含账号信息）
   */
  async findPageWithFilter(
    where: Prisma.SysMailTemplateWhereInput,
    skip: number,
    take: number,
  ): Promise<{ list: (SysMailTemplate & { account?: { mail: string } })[]; total: number }> {
    const [list, total] = await this.prisma.$transaction([
      this.delegate.findMany({
        where,
        skip,
        take,
        orderBy: { createTime: 'desc' },
        include: {
          account: {
            select: {
              mail: true,
            },
          },
        },
      }),
      this.delegate.count({ where }),
    ]);

    return { list, total };
  }

  /**
   * 根据模板编码查询启用的模板（包含账号信息）
   */
  async findEnabledByCode(code: string): Promise<
    | (SysMailTemplate & {
        account: {
          id: number;
          mail: string;
          username: string;
          password: string;
          host: string;
          port: number;
          sslEnable: boolean;
        };
      })
    | null
  > {
    return this.delegate.findFirst({
      where: { code, status: '0', delFlag: '0' },
      include: {
        account: {
          select: {
            id: true,
            mail: true,
            username: true,
            password: true,
            host: true,
            port: true,
            sslEnable: true,
          },
        },
      },
    });
  }

  /**
   * 根据账号ID查询模板列表
   */
  async findByAccountId(accountId: number): Promise<SysMailTemplate[]> {
    return this.findMany({
      where: { accountId, delFlag: '0' },
      orderBy: { createTime: 'desc' },
    });
  }
}
