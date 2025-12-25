import { Injectable } from '@nestjs/common';
import { Prisma, SysOperLog } from '@prisma/client';
import { BaseRepository } from 'src/common/repository/base.repository';
import { PrismaService } from 'src/prisma/prisma.service';

/**
 * 操作日志仓储层
 *
 * @description 封装操作日志的数据访问逻辑
 */
@Injectable()
export class OperlogRepository extends BaseRepository<SysOperLog, Prisma.SysOperLogDelegate> {
  constructor(prisma: PrismaService) {
    super(prisma, 'sysOperLog');
  }

  /**
   * 分页查询操作日志
   */
  async findPageWithFilter(
    where: Prisma.SysOperLogWhereInput,
    skip: number,
    take: number,
    orderBy?: Prisma.SysOperLogOrderByWithRelationInput,
  ): Promise<{ list: SysOperLog[]; total: number }> {
    const [list, total] = await this.prisma.$transaction([
      this.delegate.findMany({
        where,
        skip,
        take,
        orderBy: orderBy || { operTime: 'desc' },
      }),
      this.delegate.count({ where }),
    ]);

    return { list, total };
  }

  /**
   * 清空操作日志
   */
  async truncate(): Promise<void> {
    await this.prisma.$executeRawUnsafe('TRUNCATE TABLE "SysOperLog" RESTART IDENTITY CASCADE');
  }

  /**
   * 批量删除指定天数之前的日志
   */
  async deleteByDays(days: number): Promise<number> {
    const beforeDate = new Date();
    beforeDate.setDate(beforeDate.getDate() - days);

    const result = await this.prisma.sysOperLog.deleteMany({
      where: {
        operTime: {
          lt: beforeDate,
        },
      },
    });

    return result.count;
  }

  /**
   * 根据操作类型统计
   */
  async countByBusinessType(businessType: number): Promise<number> {
    return this.delegate.count({
      where: { businessType },
    });
  }

  /**
   * 根据操作人统计
   */
  async countByOperName(operName: string): Promise<number> {
    return this.delegate.count({
      where: { operName },
    });
  }

  /**
   * 查询最近的操作日志
   */
  async findRecentLogs(limit: number = 10): Promise<SysOperLog[]> {
    return this.delegate.findMany({
      take: limit,
      orderBy: { operTime: 'desc' },
    });
  }
}
