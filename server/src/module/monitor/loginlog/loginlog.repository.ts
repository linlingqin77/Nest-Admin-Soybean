import { Injectable } from '@nestjs/common';
import { Prisma, SysLogininfor } from '@prisma/client';
import { BaseRepository } from 'src/common/repository/base.repository';
import { PrismaService } from 'src/prisma/prisma.service';

/**
 * 登录日志仓储层
 *
 * @description 封装登录日志的数据访问逻辑
 */
@Injectable()
export class LoginlogRepository extends BaseRepository<SysLogininfor, Prisma.SysLogininforDelegate> {
  constructor(prisma: PrismaService) {
    super(prisma, 'sysLogininfor');
  }

  /**
   * 分页查询登录日志
   */
  async findPageWithFilter(
    where: Prisma.SysLogininforWhereInput,
    skip: number,
    take: number,
    orderBy?: Prisma.SysLogininforOrderByWithRelationInput,
  ): Promise<{ list: SysLogininfor[]; total: number }> {
    const [list, total] = await this.prisma.$transaction([
      this.delegate.findMany({
        where,
        skip,
        take,
        orderBy: orderBy || { loginTime: 'desc' },
      }),
      this.delegate.count({ where }),
    ]);

    return { list, total };
  }

  /**
   * 清空登录日志
   */
  async truncate(): Promise<void> {
    await this.prisma.$executeRawUnsafe('TRUNCATE TABLE "SysLogininfor" RESTART IDENTITY CASCADE');
  }

  /**
   * 批量删除指定天数之前的日志
   */
  async deleteByDays(days: number): Promise<number> {
    const beforeDate = new Date();
    beforeDate.setDate(beforeDate.getDate() - days);

    const result = await this.prisma.sysLogininfor.deleteMany({
      where: {
        loginTime: {
          lt: beforeDate,
        },
      },
    });

    return result.count;
  }

  /**
   * 根据用户名查询登录历史
   */
  async findByUserName(userName: string, limit: number = 10): Promise<SysLogininfor[]> {
    return this.delegate.findMany({
      where: { userName },
      take: limit,
      orderBy: { loginTime: 'desc' },
    });
  }

  /**
   * 根据IP地址查询登录历史
   */
  async findByIpaddr(ipaddr: string, limit: number = 10): Promise<SysLogininfor[]> {
    return this.delegate.findMany({
      where: { ipaddr },
      take: limit,
      orderBy: { loginTime: 'desc' },
    });
  }

  /**
   * 统计登录成功次数
   */
  async countSuccessLogin(userName?: string): Promise<number> {
    const where: Prisma.SysLogininforWhereInput = {
      status: '0', // 0表示成功
    };

    if (userName) {
      where.userName = userName;
    }

    return this.delegate.count({ where });
  }

  /**
   * 统计登录失败次数
   */
  async countFailedLogin(userName?: string): Promise<number> {
    const where: Prisma.SysLogininforWhereInput = {
      status: '1', // 1表示失败
    };

    if (userName) {
      where.userName = userName;
    }

    return this.delegate.count({ where });
  }

  /**
   * 查询最近的登录日志
   */
  async findRecentLogins(limit: number = 10): Promise<SysLogininfor[]> {
    return this.delegate.findMany({
      take: limit,
      orderBy: { loginTime: 'desc' },
    });
  }
}
