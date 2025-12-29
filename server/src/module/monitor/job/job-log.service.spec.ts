import { Test, TestingModule } from '@nestjs/testing';
import { JobLogService } from './job-log.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { Status } from '@prisma/client';
import { ListJobLogDto } from './dto/create-job.dto';
import { plainToInstance } from 'class-transformer';
import { createPrismaMock } from 'src/test-utils/prisma-mock';

describe('JobLogService', () => {
  let service: JobLogService;
  let prisma: jest.Mocked<PrismaService>;

  const mockJobLog = {
    jobLogId: 1,
    jobName: 'testJob',
    jobGroup: 'DEFAULT',
    invokeTarget: 'testTask',
    jobMessage: '执行成功',
    status: Status.NORMAL,
    exceptionInfo: null,
    createTime: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JobLogService,
        {
          provide: PrismaService,
          useValue: createPrismaMock(),
        },
      ],
    }).compile();

    service = module.get<JobLogService>(JobLogService);
    prisma = module.get(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('list', () => {
    it('should return paginated job log list', async () => {
      const mockLogs = [mockJobLog];
      (prisma.$transaction as jest.Mock).mockResolvedValue([mockLogs, 1]);

      const query = plainToInstance(ListJobLogDto, { pageNum: 1, pageSize: 10 });
      const result = await service.list(query);

      expect(result.code).toBe(200);
      expect(result.data.rows).toHaveLength(1);
      expect(result.data.total).toBe(1);
    });

    it('should filter by job name', async () => {
      (prisma.$transaction as jest.Mock).mockResolvedValue([[], 0]);

      const query = plainToInstance(ListJobLogDto, { jobName: 'test', pageNum: 1, pageSize: 10 });
      await service.list(query);

      expect(prisma.$transaction).toHaveBeenCalled();
    });

    it('should filter by job group', async () => {
      (prisma.$transaction as jest.Mock).mockResolvedValue([[], 0]);

      const query = plainToInstance(ListJobLogDto, { jobGroup: 'DEFAULT', pageNum: 1, pageSize: 10 });
      await service.list(query);

      expect(prisma.$transaction).toHaveBeenCalled();
    });

    it('should filter by status', async () => {
      (prisma.$transaction as jest.Mock).mockResolvedValue([[], 0]);

      const query = plainToInstance(ListJobLogDto, { status: Status.NORMAL, pageNum: 1, pageSize: 10 });
      await service.list(query);

      expect(prisma.$transaction).toHaveBeenCalled();
    });

    it('should filter by date range', async () => {
      const query = plainToInstance(ListJobLogDto, {
        pageNum: 1,
        pageSize: 10,
        params: {
          beginTime: '2024-01-01',
          endTime: '2024-12-31',
        },
      });

      (prisma.$transaction as jest.Mock).mockResolvedValue([[], 0]);

      await service.list(query);

      expect(prisma.$transaction).toHaveBeenCalled();
    });
  });

  describe('addJobLog', () => {
    it('should add a job log', async () => {
      const jobLog = {
        jobName: 'testJob',
        jobGroup: 'DEFAULT',
        invokeTarget: 'testTask',
        jobMessage: '执行成功',
        status: Status.NORMAL,
        createTime: new Date(),
      };

      (prisma.sysJobLog.create as jest.Mock).mockResolvedValue({ ...mockJobLog, ...jobLog });

      const result = await service.addJobLog(jobLog);

      expect(result.code).toBe(200);
      expect(prisma.sysJobLog.create).toHaveBeenCalledWith({ data: jobLog });
    });

    it('should add job log with exception info', async () => {
      const jobLog = {
        jobName: 'testJob',
        jobGroup: 'DEFAULT',
        invokeTarget: 'testTask',
        jobMessage: '执行失败',
        status: Status.DISABLED,
        exceptionInfo: 'Error: Task failed',
        createTime: new Date(),
      };

      (prisma.sysJobLog.create as jest.Mock).mockResolvedValue({ ...mockJobLog, ...jobLog });

      const result = await service.addJobLog(jobLog);

      expect(result.code).toBe(200);
    });
  });

  describe('clean', () => {
    it('should delete all job logs', async () => {
      (prisma.sysJobLog.deleteMany as jest.Mock).mockResolvedValue({ count: 100 });

      const result = await service.clean();

      expect(result.code).toBe(200);
      expect(prisma.sysJobLog.deleteMany).toHaveBeenCalled();
    });

    it('should handle empty log table', async () => {
      (prisma.sysJobLog.deleteMany as jest.Mock).mockResolvedValue({ count: 0 });

      const result = await service.clean();

      expect(result.code).toBe(200);
    });
  });

  describe('export', () => {
    it('should export job logs to xlsx', async () => {
      const mockResponse = {
        setHeader: jest.fn(),
        end: jest.fn(),
      } as any;

      (prisma.$transaction as jest.Mock).mockResolvedValue([[mockJobLog], 1]);

      const query = plainToInstance(ListJobLogDto, { pageNum: 1, pageSize: 10 });
      await service.export(mockResponse, query);

      expect(prisma.$transaction).toHaveBeenCalled();
    });
  });
});
