/**
 * 定时任务模块集成测试
 *
 * @description
 * 测试定时任务模块的完整流程，包括任务执行和日志记录
 * 使用真实的数据库连接
 *
 * _Requirements: 11.7, 11.8_
 */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe, VersioningType } from '@nestjs/common';
import { AppModule } from 'src/app.module';
import { PrismaService } from 'src/prisma/prisma.service';
import { JobService } from 'src/module/monitor/job/job.service';
import { JobLogService } from 'src/module/monitor/job/job-log.service';
import { TaskService } from 'src/module/monitor/job/task.service';
import { StatusEnum } from 'src/common/enum/index';

describe('Job Integration Tests', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let jobService: JobService;
  let jobLogService: JobLogService;
  let taskService: TaskService;
  let createdJobIds: number[] = [];
  let createdLogIds: number[] = [];

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.enableVersioning({
      type: VersioningType.URI,
      defaultVersion: '1',
      prefix: 'v',
    });
    app.useGlobalPipes(
      new ValidationPipe({
        transform: true,
        whitelist: true,
        transformOptions: { enableImplicitConversion: true },
      }),
    );

    await app.init();

    prisma = app.get(PrismaService);
    jobService = app.get(JobService);
    jobLogService = app.get(JobLogService);
    taskService = app.get(TaskService);
  }, 60000);

  afterAll(async () => {
    // Cleanup created test jobs
    if (createdJobIds.length > 0) {
      await prisma.sysJob.deleteMany({
        where: { jobId: { in: createdJobIds } },
      }).catch(() => {});
    }
    // Cleanup created test logs
    if (createdLogIds.length > 0) {
      await prisma.sysJobLog.deleteMany({
        where: { jobLogId: { in: createdLogIds } },
      }).catch(() => {});
    }
    await app.close();
  });

  describe('Task Execution Flow Integration', () => {
    it('should execute registered task and record success log', async () => {
      // Get registered tasks
      const tasks = taskService.getTasks();
      expect(tasks.length).toBeGreaterThan(0);

      // Execute a known task (task.noParams is registered in TaskService)
      const result = await taskService.executeTask('task.noParams', 'Integration Test Job', 'DEFAULT');
      expect(result).toBe(true);

      // Verify log was created
      const logs = await prisma.sysJobLog.findMany({
        where: { jobName: 'Integration Test Job' },
        orderBy: { createTime: 'desc' },
        take: 1,
      });

      expect(logs.length).toBe(1);
      expect(logs[0].status).toBe(StatusEnum.NORMAL);
      expect(logs[0].jobGroup).toBe('DEFAULT');
      expect(logs[0].invokeTarget).toBe('task.noParams');

      // Track for cleanup
      createdLogIds.push(logs[0].jobLogId);
    });

    it('should execute task with parameters and record log', async () => {
      const result = await taskService.executeTask(
        "task.params('hello', 123, true)",
        'Params Test Job',
        'SYSTEM',
      );
      expect(result).toBe(true);

      // Verify log was created
      const logs = await prisma.sysJobLog.findMany({
        where: { jobName: 'Params Test Job' },
        orderBy: { createTime: 'desc' },
        take: 1,
      });

      expect(logs.length).toBe(1);
      expect(logs[0].status).toBe(StatusEnum.NORMAL);
      expect(logs[0].invokeTarget).toBe("task.params('hello', 123, true)");

      createdLogIds.push(logs[0].jobLogId);
    });

    it('should record failure log when task does not exist', async () => {
      const result = await taskService.executeTask(
        'nonExistentTask',
        'Failed Task Job',
        'DEFAULT',
      );
      expect(result).toBe(false);

      // Verify failure log was created
      const logs = await prisma.sysJobLog.findMany({
        where: { jobName: 'Failed Task Job' },
        orderBy: { createTime: 'desc' },
        take: 1,
      });

      expect(logs.length).toBe(1);
      expect(logs[0].status).toBe(StatusEnum.STOP);
      expect(logs[0].exceptionInfo).toBeTruthy();

      createdLogIds.push(logs[0].jobLogId);
    });

    it('should record execution time in log message', async () => {
      await taskService.executeTask('task.noParams', 'Timing Test Job', 'DEFAULT');

      const logs = await prisma.sysJobLog.findMany({
        where: { jobName: 'Timing Test Job' },
        orderBy: { createTime: 'desc' },
        take: 1,
      });

      expect(logs.length).toBe(1);
      expect(logs[0].jobMessage).toMatch(/耗时 \d+ms/);

      createdLogIds.push(logs[0].jobLogId);
    });
  });

  describe('Job Log Recording Integration', () => {
    it('should add job log with all fields', async () => {
      const logData = {
        jobName: 'Integration Log Test',
        jobGroup: 'SYSTEM',
        invokeTarget: 'task.test',
        status: StatusEnum.NORMAL,
        jobMessage: '测试日志记录',
        exceptionInfo: '',
        createTime: new Date(),
      };

      const result = await jobLogService.addJobLog(logData);
      expect(result.code).toBe(200);

      // Verify log was created
      const logs = await prisma.sysJobLog.findMany({
        where: { jobName: 'Integration Log Test' },
        orderBy: { createTime: 'desc' },
        take: 1,
      });

      expect(logs.length).toBe(1);
      expect(logs[0].jobGroup).toBe('SYSTEM');
      expect(logs[0].invokeTarget).toBe('task.test');
      expect(logs[0].status).toBe(StatusEnum.NORMAL);

      createdLogIds.push(logs[0].jobLogId);
    });

    it('should query job logs with pagination', async () => {
      const result = await jobLogService.list({
        pageNum: 1,
        pageSize: 10,
        skip: 0,
        take: 10,
      } as any);

      expect(result.code).toBe(200);
      expect(result.data).toHaveProperty('rows');
      expect(result.data).toHaveProperty('total');
      expect(Array.isArray(result.data.rows)).toBe(true);
    });

    it('should filter job logs by jobName', async () => {
      // First create a log with specific name
      await jobLogService.addJobLog({
        jobName: 'FilterTestJob',
        jobGroup: 'DEFAULT',
        invokeTarget: 'task.filter',
        status: StatusEnum.NORMAL,
        jobMessage: 'Filter test',
        createTime: new Date(),
      });

      const result = await jobLogService.list({
        pageNum: 1,
        pageSize: 10,
        skip: 0,
        take: 10,
        jobName: 'FilterTestJob',
      } as any);

      expect(result.code).toBe(200);
      result.data.rows.forEach((log: any) => {
        expect(log.jobName).toContain('FilterTestJob');
      });

      // Cleanup
      const logs = await prisma.sysJobLog.findMany({
        where: { jobName: 'FilterTestJob' },
      });
      createdLogIds.push(...logs.map((l) => l.jobLogId));
    });

    it('should filter job logs by jobGroup', async () => {
      const result = await jobLogService.list({
        pageNum: 1,
        pageSize: 10,
        skip: 0,
        take: 10,
        jobGroup: 'DEFAULT',
      } as any);

      expect(result.code).toBe(200);
      result.data.rows.forEach((log: any) => {
        expect(log.jobGroup).toBe('DEFAULT');
      });
    });

    it('should filter job logs by status', async () => {
      const result = await jobLogService.list({
        pageNum: 1,
        pageSize: 10,
        skip: 0,
        take: 10,
        status: StatusEnum.NORMAL,
      } as any);

      expect(result.code).toBe(200);
      result.data.rows.forEach((log: any) => {
        expect(log.status).toBe(StatusEnum.NORMAL);
      });
    });
  });

  describe('Job CRUD Integration', () => {
    it('should list jobs with pagination', async () => {
      const result = await jobService.list({
        pageNum: 1,
        pageSize: 10,
        skip: 0,
        take: 10,
      } as any);

      expect(result.code).toBe(200);
      expect(result.data).toHaveProperty('rows');
      expect(result.data).toHaveProperty('total');
      expect(Array.isArray(result.data.rows)).toBe(true);
    });

    it('should filter jobs by jobName', async () => {
      const result = await jobService.list({
        pageNum: 1,
        pageSize: 10,
        skip: 0,
        take: 10,
        jobName: 'task',
      } as any);

      expect(result.code).toBe(200);
      expect(result.data).toHaveProperty('rows');
    });

    it('should filter jobs by jobGroup', async () => {
      const result = await jobService.list({
        pageNum: 1,
        pageSize: 10,
        skip: 0,
        take: 10,
        jobGroup: 'DEFAULT',
      } as any);

      expect(result.code).toBe(200);
      result.data.rows.forEach((job: any) => {
        expect(job.jobGroup).toBe('DEFAULT');
      });
    });

    it('should filter jobs by status', async () => {
      const result = await jobService.list({
        pageNum: 1,
        pageSize: 10,
        skip: 0,
        take: 10,
        status: StatusEnum.NORMAL,
      } as any);

      expect(result.code).toBe(200);
      result.data.rows.forEach((job: any) => {
        expect(job.status).toBe(StatusEnum.NORMAL);
      });
    });

    it('should get existing job by id', async () => {
      // First get a job from the list
      const listResult = await jobService.list({
        pageNum: 1,
        pageSize: 1,
        skip: 0,
        take: 1,
      } as any);

      if (listResult.data.rows.length > 0) {
        const jobId = listResult.data.rows[0].jobId;
        const result = await jobService.getJob(jobId);
        expect(result.code).toBe(200);
        expect(result.data.jobId).toBe(jobId);
      }
    });

    it('should throw error for non-existent job', async () => {
      await expect(jobService.getJob(999999)).rejects.toThrow();
    });
  });

  describe('Job Log Cleanup Integration', () => {
    it('should clean all job logs', async () => {
      // First create some test logs
      await jobLogService.addJobLog({
        jobName: 'CleanupTestJob1',
        jobGroup: 'DEFAULT',
        invokeTarget: 'task.cleanup1',
        status: StatusEnum.NORMAL,
        jobMessage: 'Cleanup test 1',
        createTime: new Date(),
      });

      await jobLogService.addJobLog({
        jobName: 'CleanupTestJob2',
        jobGroup: 'DEFAULT',
        invokeTarget: 'task.cleanup2',
        status: StatusEnum.NORMAL,
        jobMessage: 'Cleanup test 2',
        createTime: new Date(),
      });

      // Clean all logs
      const result = await jobLogService.clean();
      expect(result.code).toBe(200);

      // Verify all logs are deleted
      const count = await prisma.sysJobLog.count();
      expect(count).toBe(0);

      // Clear the tracked log IDs since they're all deleted
      createdLogIds = [];
    });
  });
});
