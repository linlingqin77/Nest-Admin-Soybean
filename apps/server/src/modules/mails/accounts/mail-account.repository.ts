import { Injectable } from '@nestjs/common';
import { Prisma, SysMailAccount } from '@prisma/client';
import { SoftDeleteRepository } from 'src/platform/repository';
import { PrismaService } from 'src/platform/prisma';

/**
 * 邮箱账号仓储层
 */
@Injectable()
export class MailAccountRepository extends SoftDeleteRepository<SysMailAccount, Prisma.SysMailAccountDelegate> {
  constructor(prisma: PrismaService) {
    super(prisma, 'sysMailAccount');
  }

  /**
   * 根据邮箱地址查询
   */
  async findByMail(mail: string): Promise<SysMailAccount | null> {
    return this.findOne({ mail });
  }

  /**
   * 检查邮箱地址是否存在
   */
  async existsByMail(mail: string, excludeId?: number): Promise<boolean> {
    const where: Prisma.SysMailAccountWhereInput = { mail };

    if (excludeId) {
      where.id = { not: excludeId };
    }

    return this.exists(where);
  }

  /**
   * 分页查询邮箱账号列表
   */
  async findPageWithFilter(
    where: Prisma.SysMailAccountWhereInput,
    skip: number,
    take: number,
  ): Promise<{ list: SysMailAccount[]; total: number }> {
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
   * 查询所有启用的账号
   */
  async findAllEnabled(): Promise<SysMailAccount[]> {
    return this.findMany({
      where: { status: '0', delFlag: '0' },
      orderBy: { createTime: 'desc' },
    });
  }

  /**
   * 根据ID查询启用的账号
   */
  async findEnabledById(id: number): Promise<SysMailAccount | null> {
    return this.findOne({ id, status: '0' });
  }
}
