import { Injectable } from '@nestjs/common';
import { StructuredLoggerService } from 'src/platform/logger/structured-logger.service';
import { SchedulerRegistry } from '@nestjs/schedule';
import { CronJob } from 'cron';
import { Prisma } from '@prisma/client';
import { CreateJobDto, ListJobRequestDto } from './dto/create-job.dto';
import { JobResponseDto } from './dto/job.response.dto';
import { Result, ResponseCode } from 'src/shared/response';
import { BusinessException } from 'src/shared/exceptions';
import { toDtoList, toDto } from 'src/shared/utils';
import { TaskService } from './task.service';
import { ExportTable } from 'src/shared/utils/export';
import { StatusEnum } from 'src/shared/enums/index';
import { Response } from 'express';
import { InjectTransactionHost, Transactional, PrismaTransactionHost } from 'src/core/http/decorators/transactional.decorator';

@Injectable()
export class JobService {
  constructor(
    private schedulerRegistry: SchedulerRegistry,
    @InjectTransactionHost() private readonly txHost: PrismaTransactionHost,
    private taskService: TaskService,
    private readonly logger: StructuredLoggerService,
  ) {
    this.logger.setContext(JobService.name);
    void this.initializeJobs();
  }

  private get prisma() {
    return this.txHost.tx;
  }

  // 初始化任务
  private async initializeJobs() {
    const jobs = await this.prisma.sysJob.findMany({ where: { status: StatusEnum.NORMAL } });
    jobs.forEach((job) => {
      this.addCronJob(job.jobName, job.cronExpression ?? "", job.invokeTarget ?? "");
    });
  }

  // 查询任务列表
  async findAll(query: ListJobRequestDto) {
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

    return Result.page(toDtoList(JobResponseDto, list), total, query.pageNum, query.pageSize);
  }

  // 获取单个任务
  async findOne(jobId: number) {
    const job = await this.prisma.sysJob.findUnique({ where: { jobId: Number(jobId) } });
    BusinessException.throwIfNull(job, '任务不存在', ResponseCode.DATA_NOT_FOUND);
    return Result.ok(toDto(JobResponseDto, job));
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
    if (job.status === StatusEnum.NORMAL) {
      this.addCronJob(job.jobName, job.cronExpression ?? '', createJobDto.invokeTarget ?? '');
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

      if (nextStatus === StatusEnum.NORMAL) {
        this.addCronJob(job.jobName, nextCron ?? '', nextInvokeTarget ?? '');
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
        this.logger.warn(`删除调度任务 ${job.jobName} 失败`, {
          action: 'job.remove',
          error: error instanceof Error ? error.message : String(error),
        });
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

    if (status === StatusEnum.NORMAL) {
      // 启用
      if (!cronJob) {
        this.addCronJob(job.jobName, job.cronExpression ?? "", job.invokeTarget ?? "");
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
      this.logger.info({ action: 'job.executing', message: `定时任务 ${name} 正在执行`, invokeTarget });
      await this.taskService.executeTask(invokeTarget, name);
    });

    // CronJob 类型与 @nestjs/schedule 的 CronJob 类型不完全兼容
    // 使用类型断言将 cron 库的 CronJob 适配为 SchedulerRegistry 期望的类型
    this.schedulerRegistry.addCronJob(name, job as unknown as Parameters<SchedulerRegistry['addCronJob']>[1]);
    job.start();
  }

  // 从调度器中删除定时任务
  private deleteCronJob(name: string) {
    this.schedulerRegistry.deleteCronJob(name);
  }

  // 获取 cron 任务
  private getCronJob(name: string): CronJob | null {
    try {
      return this.schedulerRegistry.getCronJob(name) as unknown as CronJob;
    } catch {
      return null;
    }
  }

  /**
   * 导出定时任务为xlsx文件
   * @param res
   */
  async export(res: Response, body: ListJobRequestDto) {
    const list = await this.findAll(body);
    const options = {
      sheetName: '定时任务',
      data: ((list.data as { rows?: unknown[] })?.rows ?? []) as unknown as Record<string, unknown>[],
      header: [
        { title: '任务编号', dataIndex: 'jobId' },
        { title: '任务名称', dataIndex: 'jobName' },
        { title: '任务组名', dataIndex: 'jobGroup' },
        { title: '调用目标字符串', dataIndex: 'invokeTarget' },
        { title: 'cron执行表达式', dataIndex: 'cronExpression' },
      ],
      dictMap: {
        status: {
          [StatusEnum.NORMAL]: '成功',
          [StatusEnum.STOP]: '失败',
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
