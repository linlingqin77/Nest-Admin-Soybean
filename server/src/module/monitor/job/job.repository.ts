import { Injectable } from '@nestjs/common';
import { Prisma, SysJob } from '@prisma/client';
import { BaseRepository } from 'src/common/repository/base.repository';
import { PrismaService } from 'src/prisma/prisma.service';
import { StatusEnum } from 'src/common/enum';

/**
 * 定时任务仓储层
 *
 * @description 封装定时任务的数据访问逻辑
 */
@Injectable()
export class JobRepository extends BaseRepository<SysJob, Prisma.SysJobDelegate> {
  constructor(prisma: PrismaService) {
    super(prisma, 'sysJob');
  }

  /**
   * 分页查询任务列表
   */
  async findPageWithFilter(
    where: Prisma.SysJobWhereInput,
    skip: number,
    take: number,
    orderBy?: Prisma.SysJobOrderByWithRelationInput,
  ): Promise<{ list: SysJob[]; total: number }> {
    const [list, total] = await this.prisma.$transaction([
      this.delegate.findMany({
        where,
        skip,
        take,
        orderBy: orderBy || { createTime: 'desc' },
      }),
      this.delegate.count({ where }),
    ]);

    return { list, total };
  }

  /**
   * 查询所有正常状态的任务（用于启动时初始化）
   */
  async findAllActiveJobs(): Promise<SysJob[]> {
    return this.delegate.findMany({
      where: { status: StatusEnum.NORMAL },
      orderBy: { createTime: 'desc' },
    });
  }

  /**
   * 根据任务名称查询
   */
  async findByJobName(jobName: string): Promise<SysJob | null> {
    return this.delegate.findFirst({
      where: { jobName },
    });
  }

  /**
   * 根据任务组查询
   */
  async findByJobGroup(jobGroup: string): Promise<SysJob[]> {
    return this.delegate.findMany({
      where: { jobGroup },
      orderBy: { createTime: 'desc' },
    });
  }

  /**
   * 批量更新任务状态
   */
  async updateStatusByIds(jobIds: number[], status: string, updateBy: string): Promise<number> {
    const result = await this.prisma.sysJob.updateMany({
      where: {
        jobId: { in: jobIds },
      },
      data: {
        status,
        updateBy,
        updateTime: new Date(),
      },
    });

    return result.count;
  }

  /**
   * 检查任务名称是否已存在
   */
  async existsByJobName(jobName: string, excludeId?: number): Promise<boolean> {
    const where: Prisma.SysJobWhereInput = { jobName };

    if (excludeId) {
      where.jobId = { not: excludeId };
    }

    const count = await this.delegate.count({ where });
    return count > 0;
  }
}
