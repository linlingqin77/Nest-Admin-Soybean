import { Test, TestingModule } from '@nestjs/testing';
import { JobService } from './job.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { SchedulerRegistry } from '@nestjs/schedule';
import { TaskService } from './task.service';
import { createPrismaMock } from 'src/test-utils/prisma-mock';
import { Status } from '@prisma/client';
import { BusinessException } from 'src/common/exceptions';
import { plainToInstance } from 'class-transformer';
import { ListJobDto } from './dto/create-job.dto';

describe('JobService', () => {
  let service: JobService;
  let prisma: jest.Mocked<PrismaService>;
  let schedulerRegistry: jest.Mocked<SchedulerRegistry>;
  let taskService: jest.Mocked<TaskService>;

  const mockJob = {
    jobId: 1,
    jobName: 'testJob',
    jobGroup: 'DEFAULT',
    invokeTarget: 'testTask',
    cronExpression: '0 0 * * * ?',
    misfirePolicy: '1',
    concurrent: '1',
    status: Status.NORMAL,
    createBy: 'admin',
    createTime: new Date(),
    updateBy: 'admin',
    updateTime: new Date(),
    remark: null,
  };

  beforeEach(async () => {
    const mockSchedulerRegistry = {
      addCronJob: jest.fn(),
      deleteCronJob: jest.fn(),
      getCronJob: jest.fn(),
    };

    const mockTaskService = {
      executeTask: jest.fn().mockResolvedValue(undefined),
    };

    const mockPrisma = createPrismaMock();
    // Mock the initialization before module creation
    (mockPrisma.sysJob.findMany as jest.Mock).mockResolvedValue([]);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JobService,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
        {
          provide: SchedulerRegistry,
          useValue: mockSchedulerRegistry,
        },
        {
          provide: TaskService,
          useValue: mockTaskService,
        },
      ],
    }).compile();

    service = module.get<JobService>(JobService);
    prisma = module.get(PrismaService);
    schedulerRegistry = module.get(SchedulerRegistry);
    taskService = module.get(TaskService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('list', () => {
    it('should return paginated job list', async () => {
      const mockJobs = [mockJob];
      const query = plainToInstance(ListJobDto, { pageNum: 1, pageSize: 10 });
      (prisma.$transaction as jest.Mock).mockResolvedValue([mockJobs, 1]);

      const result = await service.list(query);

      expect(result.code).toBe(200);
      expect(result.data.rows).toHaveLength(1);
      expect(result.data.total).toBe(1);
    });

    it('should filter by job name', async () => {
      const query = plainToInstance(ListJobDto, { jobName: 'test', pageNum: 1, pageSize: 10 });
      (prisma.$transaction as jest.Mock).mockResolvedValue([[], 0]);

      await service.list(query);

      expect(prisma.$transaction).toHaveBeenCalled();
    });

    it('should filter by job group', async () => {
      const query = plainToInstance(ListJobDto, { jobGroup: 'DEFAULT', pageNum: 1, pageSize: 10 });
      (prisma.$transaction as jest.Mock).mockResolvedValue([[], 0]);

      await service.list(query);

      expect(prisma.$transaction).toHaveBeenCalled();
    });

    it('should filter by status', async () => {
      const query = plainToInstance(ListJobDto, { status: Status.NORMAL, pageNum: 1, pageSize: 10 });
      (prisma.$transaction as jest.Mock).mockResolvedValue([[], 0]);

      await service.list(query);

      expect(prisma.$transaction).toHaveBeenCalled();
    });
  });

  describe('getJob', () => {
    it('should return a job by id', async () => {
      (prisma.sysJob.findUnique as jest.Mock).mockResolvedValue(mockJob);

      const result = await service.getJob(1);

      expect(result.code).toBe(200);
      expect(result.data).toEqual(mockJob);
      expect(prisma.sysJob.findUnique).toHaveBeenCalledWith({ where: { jobId: 1 } });
    });

    it('should throw exception when job not found', async () => {
      (prisma.sysJob.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.getJob(999)).rejects.toThrow(BusinessException);
    });
  });

  describe('create', () => {
    it('should create a new job', async () => {
      const createDto = {
        jobName: 'newJob',
        jobGroup: 'DEFAULT',
        invokeTarget: 'newTask',
        cronExpression: '0 0 * * * ?',
        misfirePolicy: '1',
        concurrent: '1',
        status: Status.NORMAL,
      };

      (prisma.sysJob.create as jest.Mock).mockResolvedValue({ ...mockJob, ...createDto });

      const result = await service.create(createDto, 'admin');

      expect(result.code).toBe(200);
      expect(prisma.sysJob.create).toHaveBeenCalled();
      expect(schedulerRegistry.addCronJob).toHaveBeenCalled();
    });

    it('should not add to scheduler when status is disabled', async () => {
      const createDto = {
        jobName: 'newJob',
        jobGroup: 'DEFAULT',
        invokeTarget: 'newTask',
        cronExpression: '0 0 * * * ?',
        misfirePolicy: '1',
        concurrent: '1',
        status: Status.DISABLED,
      };

      (prisma.sysJob.create as jest.Mock).mockResolvedValue({ ...mockJob, ...createDto, status: Status.DISABLED });

      await service.create(createDto, 'admin');

      expect(schedulerRegistry.addCronJob).not.toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('should update a job', async () => {
      (prisma.sysJob.findUnique as jest.Mock).mockResolvedValue(mockJob);
      (prisma.sysJob.update as jest.Mock).mockResolvedValue(mockJob);
      schedulerRegistry.getCronJob.mockReturnValue(null);

      const updateDto = { jobName: 'updatedJob' };
      const result = await service.update(1, updateDto, 'admin');

      expect(result.code).toBe(200);
      expect(prisma.sysJob.update).toHaveBeenCalled();
    });

    it('should throw exception when job not found', async () => {
      (prisma.sysJob.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.update(999, {}, 'admin')).rejects.toThrow(BusinessException);
    });

    it('should reschedule when cron expression changes', async () => {
      const mockCronJob = { stop: jest.fn(), start: jest.fn() };
      (prisma.sysJob.findUnique as jest.Mock).mockResolvedValue(mockJob);
      (prisma.sysJob.update as jest.Mock).mockResolvedValue(mockJob);
      schedulerRegistry.getCronJob.mockReturnValue(mockCronJob as any);

      const updateDto = { cronExpression: '0 0 12 * * ?' };
      await service.update(1, updateDto, 'admin');

      expect(schedulerRegistry.deleteCronJob).toHaveBeenCalledWith(mockJob.jobName);
      expect(schedulerRegistry.addCronJob).toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('should remove a single job', async () => {
      (prisma.sysJob.findMany as jest.Mock).mockResolvedValue([mockJob]);
      (prisma.sysJob.deleteMany as jest.Mock).mockResolvedValue({ count: 1 });

      const result = await service.remove(1);

      expect(result.code).toBe(200);
      expect(prisma.sysJob.deleteMany).toHaveBeenCalledWith({
        where: { jobId: { in: [1] } },
      });
    });

    it('should remove multiple jobs', async () => {
      (prisma.sysJob.findMany as jest.Mock).mockResolvedValue([mockJob, { ...mockJob, jobId: 2 }]);
      (prisma.sysJob.deleteMany as jest.Mock).mockResolvedValue({ count: 2 });

      const result = await service.remove([1, 2]);

      expect(result.code).toBe(200);
      expect(prisma.sysJob.deleteMany).toHaveBeenCalledWith({
        where: { jobId: { in: [1, 2] } },
      });
    });

    it('should remove jobs from scheduler', async () => {
      (prisma.sysJob.findMany as jest.Mock).mockResolvedValue([mockJob]);
      (prisma.sysJob.deleteMany as jest.Mock).mockResolvedValue({ count: 1 });

      await service.remove(1);

      expect(schedulerRegistry.deleteCronJob).toHaveBeenCalledWith(mockJob.jobName);
    });
  });

  describe('changeStatus', () => {
    it('should enable a job', async () => {
      const mockCronJob = { start: jest.fn(), stop: jest.fn() };
      (prisma.sysJob.findUnique as jest.Mock).mockResolvedValue(mockJob);
      (prisma.sysJob.update as jest.Mock).mockResolvedValue(mockJob);
      schedulerRegistry.getCronJob.mockReturnValue(mockCronJob as any);

      const result = await service.changeStatus(1, Status.NORMAL, 'admin');

      expect(result.code).toBe(200);
      expect(mockCronJob.start).toHaveBeenCalled();
    });

    it('should disable a job', async () => {
      const mockCronJob = { start: jest.fn(), stop: jest.fn() };
      (prisma.sysJob.findUnique as jest.Mock).mockResolvedValue(mockJob);
      (prisma.sysJob.update as jest.Mock).mockResolvedValue(mockJob);
      schedulerRegistry.getCronJob.mockReturnValue(mockCronJob as any);

      const result = await service.changeStatus(1, Status.DISABLED, 'admin');

      expect(result.code).toBe(200);
      expect(mockCronJob.stop).toHaveBeenCalled();
    });

    it('should throw exception when job not found', async () => {
      (prisma.sysJob.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.changeStatus(999, Status.NORMAL, 'admin')).rejects.toThrow(BusinessException);
    });
  });

  describe('run', () => {
    it('should execute a job immediately', async () => {
      (prisma.sysJob.findUnique as jest.Mock).mockResolvedValue(mockJob);

      const result = await service.run(1);

      expect(result.code).toBe(200);
      expect(taskService.executeTask).toHaveBeenCalledWith(
        mockJob.invokeTarget,
        mockJob.jobName,
        mockJob.jobGroup,
      );
    });

    it('should throw exception when job not found', async () => {
      (prisma.sysJob.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.run(999)).rejects.toThrow(BusinessException);
    });
  });

  describe('export', () => {
    it('should export jobs to xlsx', async () => {
      const mockResponse = {
        setHeader: jest.fn(),
        end: jest.fn(),
      } as any;

      const query = plainToInstance(ListJobDto, { pageNum: 1, pageSize: 10 });
      (prisma.$transaction as jest.Mock).mockResolvedValue([[mockJob], 1]);

      await service.export(mockResponse, query);

      expect(prisma.$transaction).toHaveBeenCalled();
    });
  });
});
