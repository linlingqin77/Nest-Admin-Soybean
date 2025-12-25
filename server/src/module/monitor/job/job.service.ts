import { Injectable, Logger } from '@nestjs/common';
import { SchedulerRegistry } from '@nestjs/schedule';
import { CronJob } from 'cron';
import { Prisma } from '@prisma/client';
import { CreateJobDto, ListJobDto } from './dto/create-job.dto';
import { Result, ResponseCode } from 'src/common/response';
import { BusinessException } from 'src/common/exceptions';
import { FormatDateFields } from 'src/common/utils/index';
import { TaskService } from './task.service';
import { ExportTable } from 'src/common/utils/export';
import { StatusEnum } from 'src/common/enum/index';
import { Response } from 'express';
import { PrismaService } from 'src/prisma/prisma.service';
import { Transactional } from 'src/common/decorators/transactional.decorator';

@Injectable()
export class JobService {
  private readonly logger = new Logger(JobService.name);

  constructor(
    private schedulerRegistry: SchedulerRegistry,
    private readonly prisma: PrismaService,
    private taskService: TaskService,
  ) {
    void this.initializeJobs();
  }

  // 初始化任务
  private async initializeJobs() {
    const jobs = await this.prisma.sysJob.findMany({ where: { status: StatusEnum.NORMAL } });
    jobs.forEach((job) => {
      this.addCronJob(job.jobName, job.cronExpression, job.invokeTarget);
    });
  }

  // 查询任务列表
  async list(query: ListJobDto) {
    const where: Prisma.SysJobWhereInput = {};

    if (query.jobName) {
      where.jobName = { contains: query.jobName };
    }
    if (query.jobGroup) {
      where.jobGroup = query.jobGroup;
    }
    if (query.status) {
      where.status = query.status;
    }

    const [list, total] = await this.prisma.$transaction([
      this.prisma.sysJob.findMany({
        where,
        skip: query.skip,
        take: query.take,
        orderBy: {
          createTime: 'desc',
        },
      }),
      this.prisma.sysJob.count({ where }),
    ]);

    return Result.page(FormatDateFields(list), total);
  }

  // 获取单个任务
  async getJob(jobId: number) {
    const job = await this.prisma.sysJob.findUnique({ where: { jobId: Number(jobId) } });
    BusinessException.throwIfNull(job, '任务不存在', ResponseCode.DATA_NOT_FOUND);
    return Result.ok(job);
  }

  // 创建任务
  @Transactional()
  async create(createJobDto: CreateJobDto, userName: string) {
    const job = await this.prisma.sysJob.create({
      data: {
        ...createJobDto,
        createBy: userName,
        updateBy: userName,
      },
    });

    // 如果状态为正常，则添加到调度器
    if (job.status === '0') {
      this.addCronJob(job.jobName, job.cronExpression, createJobDto.invokeTarget);
    }

    return Result.ok();
  }

  @Transactional()
  // 更新任务
  async update(jobId: number, updateJobDto: Partial<CreateJobDto>, userName: string) {
    const job = await this.prisma.sysJob.findUnique({ where: { jobId: Number(jobId) } });
    BusinessException.throwIfNull(job, '任务不存在', ResponseCode.DATA_NOT_FOUND);

    const nextStatus = updateJobDto.status ?? job.status;
    const nextCron = updateJobDto.cronExpression ?? job.cronExpression;
    const nextInvokeTarget = updateJobDto.invokeTarget ?? job.invokeTarget;

    // 如果更新了cron表达式或状态，需要重新调度
    const hasJobConfigChanged =
      nextCron !== job.cronExpression || nextStatus !== job.status || nextInvokeTarget !== job.invokeTarget;

    if (hasJobConfigChanged) {
      const cronJob = this.getCronJob(job.jobName);
      if (cronJob) {
        this.deleteCronJob(job.jobName);
      }

      if (nextStatus === '0') {
        this.addCronJob(job.jobName, nextCron, nextInvokeTarget);
      }
    }

    await this.prisma.sysJob.update({
      where: { jobId: Number(jobId) },
      data: {
        ...updateJobDto,
        updateBy: userName,
        updateTime: new Date(),
      },
    });

    return Result.ok();
  }

  @Transactional()
  // 删除任务
  async remove(jobIds: number | number[]) {
    const ids = Array.isArray(jobIds) ? jobIds : [jobIds];
    const jobs = await this.prisma.sysJob.findMany({ where: { jobId: { in: ids } } });

    // 从调度器中删除
    for (const job of jobs) {
      try {
        this.deleteCronJob(job.jobName);
      } catch (error) {
        // 忽略未找到的错误
      }
    }

    await this.prisma.sysJob.deleteMany({
      where: {
        jobId: { in: ids },
      },
    });
    return Result.ok();
  }

  // 改变任务状态
  async changeStatus(jobId: number, status: string, userName: string) {
    const job = await this.prisma.sysJob.findUnique({ where: { jobId: Number(jobId) } });
    BusinessException.throwIfNull(job, '任务不存在', ResponseCode.DATA_NOT_FOUND);

    const cronJob = this.getCronJob(job.jobName);

    if (status === '0') {
      // 启用
      if (!cronJob) {
        this.addCronJob(job.jobName, job.cronExpression, job.invokeTarget);
      } else {
        cronJob.start();
      }
    } else {
      // 停用
      if (cronJob) {
        cronJob.stop();
      }
    }

    await this.prisma.sysJob.update({
      where: { jobId: Number(jobId) },
      data: {
        status,
        updateBy: userName,
        updateTime: new Date(),
      },
    });

    return Result.ok();
  }

  // 立即执行一次
  async run(jobId: number) {
    const job = await this.prisma.sysJob.findUnique({ where: { jobId: Number(jobId) } });
    BusinessException.throwIfNull(job, '任务不存在', ResponseCode.DATA_NOT_FOUND);

    // 执行任务
    await this.taskService.executeTask(job.invokeTarget, job.jobName, job.jobGroup);
    return Result.ok();
  }

  // 添加定时任务到调度器
  private addCronJob(name: string, cronTime: string, invokeTarget: string) {
    cronTime = cronTime.replace('?', '*'); // 不支持问号，则将cron的问号转成*
    const job = new CronJob(cronTime, async () => {
      this.logger.warn(`定时任务 ${name} 正在执行，调用方法: ${invokeTarget}`);
      await this.taskService.executeTask(invokeTarget, name);
    });

    this.schedulerRegistry.addCronJob(name, job as any);
    job.start();
  }

  // 从调度器中删除定时任务
  private deleteCronJob(name: string) {
    this.schedulerRegistry.deleteCronJob(name);
  }

  // 获取 cron 任务
  private getCronJob(name: string): CronJob | null {
    try {
      return this.schedulerRegistry.getCronJob(name) as any;
    } catch (error) {
      return null;
    }
  }

  /**
   * 导出定时任务为xlsx文件
   * @param res
   */
  async export(res: Response, body: ListJobDto) {
    const list = await this.list(body);
    const options = {
      sheetName: '定时任务',
      data: list.data.rows,
      header: [
        { title: '任务编号', dataIndex: 'jobId' },
        { title: '任务名称', dataIndex: 'jobName' },
        { title: '任务组名', dataIndex: 'jobGroup' },
        { title: '调用目标字符串', dataIndex: 'invokeTarget' },
        { title: 'cron执行表达式', dataIndex: 'cronExpression' },
      ],
      dictMap: {
        status: {
          '0': '成功',
          '1': '失败',
        },
        jobGroup: {
          SYSTEM: '系统',
          DEFAULT: '默认',
        },
      },
    };
    return await ExportTable(options, res);
  }
}
