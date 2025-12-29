import { Test, TestingModule } from '@nestjs/testing';
import { JobLogController } from './job-log.controller';
import { JobLogService } from './job-log.service';
import { Result } from 'src/common/response';
import { Status } from '@prisma/client';
import { OperlogService } from '../operlog/operlog.service';

describe('JobLogController', () => {
  let controller: JobLogController;
  let service: jest.Mocked<JobLogService>;

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
    const mockService = {
      list: jest.fn(),
      addJobLog: jest.fn(),
      clean: jest.fn(),
      export: jest.fn(),
    };

    const mockOperlogService = {
      logAction: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [JobLogController],
      providers: [
        {
          provide: JobLogService,
          useValue: mockService,
        },
        {
          provide: OperlogService,
          useValue: mockOperlogService,
        },
      ],
    }).compile();

    controller = module.get<JobLogController>(JobLogController);
    service = module.get(JobLogService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('list', () => {
    it('should return paginated job log list', async () => {
      const mockResult = Result.ok({ rows: [mockJobLog], total: 1 });
      service.list.mockResolvedValue(mockResult);

      const query = {
        skip: 0,
        take: 10,
        getOrderBy: jest.fn(),
        getDateRange: jest.fn(),
      };
      const result = await controller.list(query as any);

      expect(result.code).toBe(200);
      expect(result.data.rows).toHaveLength(1);
      expect(result.data.total).toBe(1);
      expect(service.list).toHaveBeenCalledWith(query);
    });

    it('should handle empty list', async () => {
      const mockResult = Result.ok({ rows: [], total: 0 });
      service.list.mockResolvedValue(mockResult);

      const query = {
        skip: 0,
        take: 10,
        getOrderBy: jest.fn(),
        getDateRange: jest.fn(),
      };
      const result = await controller.list(query as any);

      expect(result.code).toBe(200);
      expect(result.data.rows).toHaveLength(0);
      expect(result.data.total).toBe(0);
    });

    it('should filter by job name', async () => {
      const mockResult = Result.ok({ rows: [], total: 0 });
      service.list.mockResolvedValue(mockResult);

      const query = {
        jobName: 'test',
        skip: 0,
        take: 10,
        getOrderBy: jest.fn(),
        getDateRange: jest.fn(),
      };
      await controller.list(query as any);

      expect(service.list).toHaveBeenCalledWith(query);
    });
  });

  describe('clean', () => {
    it('should clean all job logs', async () => {
      const mockResult = Result.ok();
      service.clean.mockResolvedValue(mockResult);

      const result = await controller.clean();

      expect(result.code).toBe(200);
      expect(service.clean).toHaveBeenCalled();
    });
  });

  describe('export', () => {
    it('should export job logs to xlsx', async () => {
      const mockResponse = {
        setHeader: jest.fn(),
        end: jest.fn(),
      } as any;

      const query = {
        skip: 0,
        take: 10,
        getOrderBy: jest.fn(),
        getDateRange: jest.fn(),
      };
      service.export.mockResolvedValue(undefined);

      await controller.export(mockResponse, query as any);

      expect(service.export).toHaveBeenCalledWith(mockResponse, query);
    });
  });
});
