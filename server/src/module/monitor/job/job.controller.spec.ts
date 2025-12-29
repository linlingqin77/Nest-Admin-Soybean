import { Test, TestingModule } from '@nestjs/testing';
import { JobController } from './job.controller';
import { JobService } from './job.service';
import { Result } from 'src/common/response';
import { Status } from '@prisma/client';
import { OperlogService } from '../operlog/operlog.service';
import { plainToInstance } from 'class-transformer';
import { ListJobDto } from './dto/create-job.dto';

describe('JobController', () => {
  let controller: JobController;
  let service: jest.Mocked<JobService>;

  const mockJob = {
    jobId: 1,
    tenantId: '000000',
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
    remark: '',
  };

  beforeEach(async () => {
    const mockService = {
      list: jest.fn(),
      getJob: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
      changeStatus: jest.fn(),
      run: jest.fn(),
      export: jest.fn(),
    };

    const mockOperlogService = {
      logAction: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [JobController],
      providers: [
        {
          provide: JobService,
          useValue: mockService,
        },
        {
          provide: OperlogService,
          useValue: mockOperlogService,
        },
      ],
    }).compile();

    controller = module.get<JobController>(JobController);
    service = module.get(JobService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('list', () => {
    it('should return paginated job list', async () => {
      const mockResult = Result.page([mockJob], 1);
      service.list.mockResolvedValue(mockResult);

      const query = plainToInstance(ListJobDto, { pageNum: 1, pageSize: 10 });
      const result = await controller.list(query);

      expect(result.code).toBe(200);
      expect(result.data.rows).toHaveLength(1);
      expect(result.data.total).toBe(1);
      expect(service.list).toHaveBeenCalledWith(query);
    });

    it('should handle empty list', async () => {
      const mockResult = Result.page([], 0);
      service.list.mockResolvedValue(mockResult);

      const query = plainToInstance(ListJobDto, { pageNum: 1, pageSize: 10 });
      const result = await controller.list(query);

      expect(result.code).toBe(200);
      expect(result.data.rows).toHaveLength(0);
      expect(result.data.total).toBe(0);
    });
  });

  describe('getInfo', () => {
    it('should return job details', async () => {
      const mockResult = Result.ok(mockJob);
      service.getJob.mockResolvedValue(mockResult);

      const result = await controller.getInfo(1);

      expect(result.code).toBe(200);
      expect(result.data).toEqual(mockJob);
      expect(service.getJob).toHaveBeenCalledWith(1);
    });
  });

  describe('add', () => {
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
      const mockResult = Result.ok();
      service.create.mockResolvedValue(mockResult);

      const result = await controller.add(createDto, 'admin');

      expect(result.code).toBe(200);
      expect(service.create).toHaveBeenCalledWith(createDto, 'admin');
    });
  });

  describe('changeStatus', () => {
    it('should change job status to enabled', async () => {
      const mockResult = Result.ok();
      service.changeStatus.mockResolvedValue(mockResult);

      const result = await controller.changeStatus(1, Status.NORMAL, 'admin');

      expect(result.code).toBe(200);
      expect(service.changeStatus).toHaveBeenCalledWith(1, Status.NORMAL, 'admin');
    });

    it('should change job status to disabled', async () => {
      const mockResult = Result.ok();
      service.changeStatus.mockResolvedValue(mockResult);

      const result = await controller.changeStatus(1, Status.DISABLED, 'admin');

      expect(result.code).toBe(200);
      expect(service.changeStatus).toHaveBeenCalledWith(1, Status.DISABLED, 'admin');
    });
  });

  describe('update', () => {
    it('should update a job', async () => {
      const updateDto = { jobName: 'updatedJob' };
      const mockResult = Result.ok();
      service.update.mockResolvedValue(mockResult);

      const result = await controller.update(1, updateDto, 'admin');

      expect(result.code).toBe(200);
      expect(service.update).toHaveBeenCalledWith(1, updateDto, 'admin');
    });

    it('should update job cron expression', async () => {
      const updateDto = { cronExpression: '0 0 12 * * ?' };
      const mockResult = Result.ok();
      service.update.mockResolvedValue(mockResult);

      const result = await controller.update(1, updateDto, 'admin');

      expect(result.code).toBe(200);
      expect(service.update).toHaveBeenCalledWith(1, updateDto, 'admin');
    });
  });

  describe('remove', () => {
    it('should remove a single job', async () => {
      const mockResult = Result.ok();
      service.remove.mockResolvedValue(mockResult);

      const result = await controller.remove('1');

      expect(result.code).toBe(200);
      expect(service.remove).toHaveBeenCalledWith([1]);
    });

    it('should remove multiple jobs', async () => {
      const mockResult = Result.ok();
      service.remove.mockResolvedValue(mockResult);

      const result = await controller.remove('1,2,3');

      expect(result.code).toBe(200);
      expect(service.remove).toHaveBeenCalledWith([1, 2, 3]);
    });
  });

  describe('run', () => {
    it('should execute a job immediately', async () => {
      const mockResult = Result.ok();
      service.run.mockResolvedValue(mockResult);

      const result = await controller.run(1);

      expect(result.code).toBe(200);
      expect(service.run).toHaveBeenCalledWith(1);
    });
  });

  describe('export', () => {
    it('should export jobs to xlsx', async () => {
      const mockResponse = {
        setHeader: jest.fn(),
        end: jest.fn(),
      } as any;

      const query = plainToInstance(ListJobDto, { pageNum: 1, pageSize: 10 });
      service.export.mockResolvedValue(undefined);

      await controller.export(mockResponse, query);

      expect(service.export).toHaveBeenCalledWith(mockResponse, query);
    });
  });
});
