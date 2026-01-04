import { CacheService } from './cache/cache.service';
import { JobLogService } from './job/job-log.service';
import { JobService } from './job/job.service';
import { TaskService } from './job/task.service';
import { LoginlogService } from './loginlog/loginlog.service';
import { OnlineService } from './online/online.service';
import { OperlogService } from './operlog/operlog.service';
import { ServerService } from './server/server.service';
import { createPrismaMock, PrismaMock } from 'src/test-utils/prisma-mock';
import { Result } from 'src/common/response';
import { ExportTable } from 'src/common/utils/export';
import { ModuleRef } from '@nestjs/core';
import * as nodeDiskInfo from 'node-disk-info';

jest.mock('src/common/utils/export', () => ({
  ExportTable: jest.fn(),
}));

const cronJobs: Array<{ start: jest.Mock; stop: jest.Mock; fire?: () => void }> = [];
jest.mock('cron', () => ({
  CronJob: jest.fn().mockImplementation((_expr, callback) => {
    const instance = {
      start: jest.fn(),
      stop: jest.fn(),
      fire: callback,
    };
    cronJobs.push(instance);
    return instance;
  }),
}));

jest.mock('node-disk-info', () => ({
  getDiskInfoSync: jest
    .fn()
    .mockReturnValue([{ _mounted: '/', _filesystem: 'apfs', _blocks: 1024, _used: 256, _available: 768 }]),
}));

describe('Monitor module services', () => {
  describe('CacheService', () => {
    const redisService = {
      keys: jest.fn(),
      del: jest.fn(),
      reset: jest.fn(),
      get: jest.fn(),
    };
    const service = new CacheService(redisService as any);

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should return cache metadata list', async () => {
      const result = await service.getNames();
      expect(result.data).toHaveLength(7);
    });

    it('should resolve cache value by key', async () => {
      redisService.get.mockResolvedValue({ foo: 'bar' });
      const result = await service.getValue({ cacheName: 'login_tokens:', cacheKey: 'key' });
      expect(redisService.get).toHaveBeenCalledWith('key');
      expect(result.data.cacheValue).toBe(JSON.stringify({ foo: 'bar' }));
    });
  });

  describe('JobLogService', () => {
    let prisma: PrismaMock;
    let service: JobLogService;

    beforeEach(() => {
      prisma = createPrismaMock();
      service = new JobLogService(prisma);
    });

    it('should list job logs with pagination', async () => {
      prisma.$transaction.mockResolvedValue([[{ jobLogId: 1 }], 1]);
      const res = await service.list({ skip: 0, take: 10 } as any);
      expect(prisma.$transaction).toHaveBeenCalled();
      expect(res.data).toEqual({ rows: [{ jobLogId: 1 }], total: 1 });
    });

    it('should filter job logs by jobName', async () => {
      prisma.$transaction.mockResolvedValue([[{ jobLogId: 1, jobName: 'test' }], 1]);
      const res = await service.list({ skip: 0, take: 10, jobName: 'test' } as any);
      expect(res.data.total).toBe(1);
    });

    it('should filter job logs by jobGroup', async () => {
      prisma.$transaction.mockResolvedValue([[{ jobLogId: 1, jobGroup: 'SYSTEM' }], 1]);
      const res = await service.list({ skip: 0, take: 10, jobGroup: 'SYSTEM' } as any);
      expect(res.data.total).toBe(1);
    });

    it('should filter job logs by status', async () => {
      prisma.$transaction.mockResolvedValue([[{ jobLogId: 1, status: '0' }], 1]);
      const res = await service.list({ skip: 0, take: 10, status: '0' } as any);
      expect(res.data.total).toBe(1);
    });

    it('should add a job log record', async () => {
      await service.addJobLog({ jobName: 'demo' });
      expect(prisma.sysJobLog.create).toHaveBeenCalled();
    });

    it('should add job log with all fields', async () => {
      const logData = {
        jobName: 'demo',
        jobGroup: 'DEFAULT',
        invokeTarget: 'task.demo',
        status: '0',
        jobMessage: '执行成功',
        exceptionInfo: '',
        createTime: new Date(),
      };
      await service.addJobLog(logData);
      expect(prisma.sysJobLog.create).toHaveBeenCalledWith({ data: logData });
    });

    it('should clean all job logs', async () => {
      await service.clean();
      expect(prisma.sysJobLog.deleteMany).toHaveBeenCalled();
    });

    it('should export job logs to excel', async () => {
      jest.spyOn(service, 'list').mockResolvedValue(Result.ok({ rows: [], total: 0 }));
      await service.export({} as any, {} as any);
      expect(ExportTable).toHaveBeenCalled();
    });
  });

  describe('JobService', () => {
    let prisma: PrismaMock;
    let service: JobService;
    const schedulerRegistry = {
      addCronJob: jest.fn(),
      deleteCronJob: jest.fn(),
      getCronJob: jest.fn(),
    };
    const taskService = {
      executeTask: jest.fn().mockResolvedValue(true),
    };

    beforeEach(() => {
      jest.clearAllMocks();
      prisma = createPrismaMock();
      (prisma.sysJob.findMany as jest.Mock).mockResolvedValue([]);
      service = new JobService(schedulerRegistry as any, prisma, taskService as any);
    });

    it('should list jobs via prisma transaction', async () => {
      prisma.$transaction.mockResolvedValue([[{ jobId: 1 }], 1]);
      const res = await service.list({ pageNum: 1, pageSize: 5 } as any);
      expect(res.data.total).toBe(1);
    });

    it('should filter jobs by jobName', async () => {
      prisma.$transaction.mockResolvedValue([[{ jobId: 1, jobName: 'test' }], 1]);
      const res = await service.list({ pageNum: 1, pageSize: 5, jobName: 'test' } as any);
      expect(prisma.$transaction).toHaveBeenCalled();
      expect(res.data.total).toBe(1);
    });

    it('should filter jobs by jobGroup', async () => {
      prisma.$transaction.mockResolvedValue([[{ jobId: 1, jobGroup: 'SYSTEM' }], 1]);
      const res = await service.list({ pageNum: 1, pageSize: 5, jobGroup: 'SYSTEM' } as any);
      expect(res.data.total).toBe(1);
    });

    it('should filter jobs by status', async () => {
      prisma.$transaction.mockResolvedValue([[{ jobId: 1, status: '0' }], 1]);
      const res = await service.list({ pageNum: 1, pageSize: 5, status: '0' } as any);
      expect(res.data.total).toBe(1);
    });

    it('should get single job by id', async () => {
      (prisma.sysJob.findUnique as jest.Mock).mockResolvedValue({
        jobId: 1,
        jobName: 'demo',
        cronExpression: '* * * * * *',
      });
      const res = await service.getJob(1);
      expect(res.data.jobId).toBe(1);
      expect(prisma.sysJob.findUnique).toHaveBeenCalledWith({ where: { jobId: 1 } });
    });

    it('should throw error when job not found', async () => {
      (prisma.sysJob.findUnique as jest.Mock).mockResolvedValue(null);
      await expect(service.getJob(999)).rejects.toThrow();
    });

    it('should create job and register cron when status is normal', async () => {
      (prisma.sysJob.create as jest.Mock).mockResolvedValue({
        jobName: 'demo',
        status: '0',
        cronExpression: '* * * * * *',
        invokeTarget: 'task',
      });
      await service.create(
        { jobName: 'demo', cronExpression: '* * * * * *', invokeTarget: 'task', status: '0' } as any,
        'admin',
      );
      expect(prisma.sysJob.create).toHaveBeenCalled();
      expect(schedulerRegistry.addCronJob).toHaveBeenCalledWith('demo', expect.any(Object));
    });

    it('should create job without registering cron when status is stopped', async () => {
      (prisma.sysJob.create as jest.Mock).mockResolvedValue({
        jobName: 'demo',
        status: '1',
        cronExpression: '* * * * * *',
        invokeTarget: 'task',
      });
      await service.create(
        { jobName: 'demo', cronExpression: '* * * * * *', invokeTarget: 'task', status: '1' } as any,
        'admin',
      );
      expect(prisma.sysJob.create).toHaveBeenCalled();
      expect(schedulerRegistry.addCronJob).not.toHaveBeenCalled();
    });

    it('should update job and reschedule when cron expression changes', async () => {
      (prisma.sysJob.findUnique as jest.Mock).mockResolvedValue({
        jobId: 1,
        jobName: 'demo',
        cronExpression: '0 * * * * *',
        invokeTarget: 'task',
        status: '0',
      });
      const cronRef = { start: jest.fn(), stop: jest.fn() };
      schedulerRegistry.getCronJob.mockReturnValue(cronRef);

      await service.update(1, { cronExpression: '*/5 * * * * *' }, 'admin');

      expect(schedulerRegistry.deleteCronJob).toHaveBeenCalledWith('demo');
      expect(schedulerRegistry.addCronJob).toHaveBeenCalledWith('demo', expect.any(Object));
      expect(prisma.sysJob.update).toHaveBeenCalled();
    });

    it('should update job and reschedule when invokeTarget changes', async () => {
      (prisma.sysJob.findUnique as jest.Mock).mockResolvedValue({
        jobId: 1,
        jobName: 'demo',
        cronExpression: '* * * * * *',
        invokeTarget: 'oldTask',
        status: '0',
      });
      const cronRef = { start: jest.fn(), stop: jest.fn() };
      schedulerRegistry.getCronJob.mockReturnValue(cronRef);

      await service.update(1, { invokeTarget: 'newTask' }, 'admin');

      expect(schedulerRegistry.deleteCronJob).toHaveBeenCalledWith('demo');
      expect(schedulerRegistry.addCronJob).toHaveBeenCalled();
    });

    it('should throw error when updating non-existent job', async () => {
      (prisma.sysJob.findUnique as jest.Mock).mockResolvedValue(null);
      await expect(service.update(999, { jobName: 'test' }, 'admin')).rejects.toThrow();
    });

    it('should delete single job and remove from scheduler', async () => {
      (prisma.sysJob.findMany as jest.Mock).mockResolvedValue([{ jobId: 1, jobName: 'demo' }]);
      await service.remove(1);
      expect(schedulerRegistry.deleteCronJob).toHaveBeenCalledWith('demo');
      expect(prisma.sysJob.deleteMany).toHaveBeenCalledWith({ where: { jobId: { in: [1] } } });
    });

    it('should delete multiple jobs', async () => {
      (prisma.sysJob.findMany as jest.Mock).mockResolvedValue([
        { jobId: 1, jobName: 'demo1' },
        { jobId: 2, jobName: 'demo2' },
      ]);
      await service.remove([1, 2]);
      expect(schedulerRegistry.deleteCronJob).toHaveBeenCalledTimes(2);
      expect(prisma.sysJob.deleteMany).toHaveBeenCalledWith({ where: { jobId: { in: [1, 2] } } });
    });

    it('should change status by controlling cron job', async () => {
      (prisma.sysJob.findUnique as jest.Mock).mockResolvedValue({
        jobId: 1,
        jobName: 'demo',
        cronExpression: '* * * * * *',
        invokeTarget: 'task',
        status: '0',
      });
      const cronRef = { start: jest.fn(), stop: jest.fn() };
      schedulerRegistry.getCronJob.mockReturnValue(cronRef);
      await service.changeStatus(1, '1', 'admin');
      expect(cronRef.stop).toHaveBeenCalled();
    });

    it('should start cron job when changing status to normal', async () => {
      (prisma.sysJob.findUnique as jest.Mock).mockResolvedValue({
        jobId: 1,
        jobName: 'demo',
        cronExpression: '* * * * * *',
        invokeTarget: 'task',
        status: '1',
      });
      const cronRef = { start: jest.fn(), stop: jest.fn() };
      schedulerRegistry.getCronJob.mockReturnValue(cronRef);
      await service.changeStatus(1, '0', 'admin');
      expect(cronRef.start).toHaveBeenCalled();
    });

    it('should create new cron job when enabling and no existing job', async () => {
      (prisma.sysJob.findUnique as jest.Mock).mockResolvedValue({
        jobId: 1,
        jobName: 'demo',
        cronExpression: '* * * * * *',
        invokeTarget: 'task',
        status: '1',
      });
      schedulerRegistry.getCronJob.mockReturnValue(null);
      await service.changeStatus(1, '0', 'admin');
      expect(schedulerRegistry.addCronJob).toHaveBeenCalledWith('demo', expect.any(Object));
    });

    it('should throw error when changing status of non-existent job', async () => {
      (prisma.sysJob.findUnique as jest.Mock).mockResolvedValue(null);
      await expect(service.changeStatus(999, '0', 'admin')).rejects.toThrow();
    });

    it('should run job immediately via task service', async () => {
      (prisma.sysJob.findUnique as jest.Mock).mockResolvedValue({
        jobId: 1,
        jobName: 'demo',
        jobGroup: 'DEFAULT',
        invokeTarget: 'task',
      });
      await service.run(1);
      expect(taskService.executeTask).toHaveBeenCalledWith('task', 'demo', 'DEFAULT');
    });

    it('should throw error when running non-existent job', async () => {
      (prisma.sysJob.findUnique as jest.Mock).mockResolvedValue(null);
      await expect(service.run(999)).rejects.toThrow();
    });

    it('should export job list to excel', async () => {
      jest.spyOn(service, 'list').mockResolvedValue(Result.ok({ rows: [], total: 0 }));
      await service.export({} as any, {} as any);
      expect(ExportTable).toHaveBeenCalled();
    });
  });

  describe('TaskService', () => {
    let service: TaskService;
    const moduleRef = {
      get: jest.fn(),
    } as unknown as ModuleRef;
    const jobLogService = {
      addJobLog: jest.fn().mockResolvedValue(Result.ok()),
    };
    const prisma = createPrismaMock();
    const noticeService = {
      sendBatchNotice: jest.fn(),
      create: jest.fn().mockResolvedValue(Result.ok()),
    };
    const versionService = {
      cleanExpiredVersions: jest.fn(),
      deletePhysicalFile: jest.fn().mockResolvedValue(undefined),
    };

    beforeEach(() => {
      jest.clearAllMocks();
      service = new TaskService(
        moduleRef,
        jobLogService as any,
        prisma as any,
        noticeService as any,
        versionService as any,
      );
      (service as any).taskMap.set('demoTask', jest.fn());
      (service as any).taskMap.set('task.noParams', jest.fn());
      (service as any).taskMap.set('task.params', jest.fn());
    });

    it('should execute existing task and record success log', async () => {
      const handler = (service as any).taskMap.get('demoTask');
      handler.mockResolvedValue(undefined);
      const result = await service.executeTask('demoTask');
      expect(result).toBe(true);
      expect(jobLogService.addJobLog).toHaveBeenCalledWith(expect.objectContaining({ status: '0' }));
    });

    it('should log failure when task is missing', async () => {
      const result = await service.executeTask('missingTask');
      expect(result).toBe(false);
      expect(jobLogService.addJobLog).toHaveBeenCalledWith(expect.objectContaining({ status: '1' }));
    });

    it('should expose registered task keys', () => {
      const tasks = service.getTasks();
      expect(tasks).toContain('demoTask');
    });

    it('should execute task with parameters', async () => {
      const handler = (service as any).taskMap.get('task.params');
      handler.mockResolvedValue(undefined);
      const result = await service.executeTask("task.params('hello', 123, true)");
      expect(result).toBe(true);
      expect(handler).toHaveBeenCalledWith('hello', 123, true);
    });

    it('should execute task without parameters', async () => {
      const handler = (service as any).taskMap.get('task.noParams');
      handler.mockResolvedValue(undefined);
      const result = await service.executeTask('task.noParams');
      expect(result).toBe(true);
      expect(handler).toHaveBeenCalled();
    });

    it('should handle task execution error and log failure', async () => {
      const handler = (service as any).taskMap.get('demoTask');
      handler.mockRejectedValue(new Error('Task execution failed'));
      const result = await service.executeTask('demoTask');
      expect(result).toBe(false);
      expect(jobLogService.addJobLog).toHaveBeenCalledWith(
        expect.objectContaining({
          status: '1',
          exceptionInfo: 'Task execution failed',
        }),
      );
    });

    it('should record job name and group in log', async () => {
      const handler = (service as any).taskMap.get('demoTask');
      handler.mockResolvedValue(undefined);
      await service.executeTask('demoTask', 'TestJob', 'SYSTEM');
      expect(jobLogService.addJobLog).toHaveBeenCalledWith(
        expect.objectContaining({
          jobName: 'TestJob',
          jobGroup: 'SYSTEM',
        }),
      );
    });

    it('should use default values when job name and group not provided', async () => {
      const handler = (service as any).taskMap.get('demoTask');
      handler.mockResolvedValue(undefined);
      await service.executeTask('demoTask');
      expect(jobLogService.addJobLog).toHaveBeenCalledWith(
        expect.objectContaining({
          jobName: '未知任务',
          jobGroup: 'DEFAULT',
        }),
      );
    });

    it('should fail for invalid invoke target format', async () => {
      const result = await service.executeTask('');
      expect(result).toBe(false);
    });

    it('should parse array parameters correctly', async () => {
      const handler = jest.fn().mockResolvedValue(undefined);
      (service as any).taskMap.set('arrayTask', handler);
      const result = await service.executeTask("arrayTask([1, 2, 3])");
      expect(result).toBe(true);
      expect(handler).toHaveBeenCalledWith([1, 2, 3]);
    });

    it('should parse object parameters correctly', async () => {
      const handler = jest.fn().mockResolvedValue(undefined);
      (service as any).taskMap.set('objectTask', handler);
      const result = await service.executeTask("objectTask({a: 1, b: 'test'})");
      expect(result).toBe(true);
      expect(handler).toHaveBeenCalledWith({ a: 1, b: 'test' });
    });
  });

  describe('LoginlogService', () => {
    let prisma: PrismaMock;
    let service: LoginlogService;

    beforeEach(() => {
      prisma = createPrismaMock();
      service = new LoginlogService(prisma);
    });

    it('should query login logs via prisma transaction', async () => {
      prisma.$transaction.mockResolvedValue([[{ infoId: 1 }], 1]);
      const res = await service.findAll({ skip: 0, take: 10 } as any);
      expect(res.data.total).toBe(1);
    });

    it('should soft delete log entries', async () => {
      (prisma.sysLogininfor.updateMany as jest.Mock).mockResolvedValue({ count: 1 });
      await service.remove(['1']);
      expect(prisma.sysLogininfor.updateMany).toHaveBeenCalled();
    });
  });

  describe('OnlineService', () => {
    const redisService = {
      keys: jest.fn(),
      mget: jest.fn(),
      del: jest.fn(),
    };
    const service = new OnlineService(redisService as any);

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should build online list from redis sessions', async () => {
      redisService.keys.mockResolvedValue(['login_tokens:1']);
      redisService.mget.mockResolvedValue([
        {
          token: '1',
          user: { deptName: '研发部' },
          userName: 'admin',
          ipaddr: '127.0.0.1',
          loginLocation: 'local',
          browser: 'chrome',
          os: 'mac',
          loginTime: 'now',
        },
      ]);
      const res = await service.findAll({ pageNum: 1, pageSize: 10 });
      expect(res.data.total).toBe(1);
      expect(res.data.rows[0].tokenId).toBe('1');
    });

    it('should delete session token from redis', async () => {
      await service.delete('abc');
      expect(redisService.del).toHaveBeenCalledWith('login_tokens:abc');
    });
  });

  describe('OperlogService', () => {
    let prisma: PrismaMock;
    let service: OperlogService;
    const request = {
      originalUrl: '/test',
      method: 'post',
      ip: '127.0.0.1',
      body: {},
      query: {},
      user: { user: { userName: 'admin', deptName: 'dev' } },
    } as any;
    const axiosService = { getIpAddress: jest.fn().mockResolvedValue('Beijing') };
    const dictService = {
      findOneDataType: jest.fn().mockResolvedValue(Result.ok([{ dictValue: '1', dictLabel: '系统' }])),
    };

    beforeEach(() => {
      prisma = createPrismaMock();
      service = new OperlogService(request, prisma, axiosService as any, dictService as any);
    });

    it('should record operation log', async () => {
      await service.logAction({ costTime: 5, title: '查询', handlerName: 'handler' });
      expect(prisma.sysOperLog.create).toHaveBeenCalled();
    });

    it('should export logs via ExportTable', async () => {
      jest.spyOn(service, 'findAll').mockResolvedValue(Result.ok({ rows: [], total: 0 }));
      await service.export({} as any, {} as any);
      expect(ExportTable).toHaveBeenCalled();
    });
  });

  describe('ServerService', () => {
    const service = new ServerService();

    beforeEach(() => {
      (nodeDiskInfo.getDiskInfoSync as jest.Mock).mockReturnValue([
        { mounted: '/', filesystem: 'apfs', blocks: 1024 * 4, used: 1024, available: 1024 * 3 },
      ]);
    });

    it('should convert bytes to gigabytes', () => {
      expect(service.bytesToGB(1024 * 1024 * 1024)).toBe('1.00');
    });

    it('should format disk info output', async () => {
      const disks = await service.getDiskStatus();
      expect(disks[0]).toMatchObject({ dirName: '/', typeName: 'apfs' });
    });
  });
});
