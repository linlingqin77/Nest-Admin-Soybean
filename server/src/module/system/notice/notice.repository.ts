import { Injectable } from '@nestjs/common';
import { Prisma, SysNotice } from '@prisma/client';
import { SoftDeleteRepository } from '../../../common/repository/soft-delete.repository';
import { PrismaService } from '../../../prisma/prisma.service';

/**
 * 通知公告仓储层
 */
@Injectable()
export class NoticeRepository extends SoftDeleteRepository<SysNotice, Prisma.SysNoticeDelegate> {
  constructor(prisma: PrismaService) {
    super(prisma, 'sysNotice');
  }

  /**
   * 根据通知标题查询
   */
  async findByNoticeTitle(noticeTitle: string): Promise<SysNotice | null> {
    return this.findOne({ noticeTitle });
  }

  /**
   * 检查通知标题是否存在
   */
  async existsByNoticeTitle(noticeTitle: string, excludeNoticeId?: number): Promise<boolean> {
    const where: Prisma.SysNoticeWhereInput = { noticeTitle };

    if (excludeNoticeId) {
      where.noticeId = { not: excludeNoticeId };
    }

    return this.exists(where);
  }

  /**
   * 分页查询通知公告列表
   */
  async findPageWithFilter(
    where: Prisma.SysNoticeWhereInput,
    skip: number,
    take: number,
  ): Promise<{ list: SysNotice[]; total: number }> {
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
   * 根据通知类型查询通知列表
   */
  async findByNoticeType(noticeType: string): Promise<SysNotice[]> {
    return this.findMany({
      where: { noticeType },
      orderBy: { createTime: 'desc' },
    });
  }

  /**
   * 统计某个状态的通知数量
   */
  async countByStatus(status: string): Promise<number> {
    return this.delegate.count({
      where: { status },
    });
  }
}
