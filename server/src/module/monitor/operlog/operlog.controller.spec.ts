import { Test, TestingModule } from '@nestjs/testing';
import { plainToInstance } from 'class-transformer';
import { QueryOperLogDto } from './dto/operLog.dto';
import { OperlogController } from './operlog.controller';
import { OperlogService } from './operlog.service';
import { Result } from 'src/common/response';
import { Status } from '@prisma/client';

describe('OperlogController', () => {
  let controller: OperlogController;
  let service: jest.Mocked<OperlogService>;

  const mockOperLog = {
    tenantId: '000000',
    operId: 1,
    title: '测试操作',
    method: 'testMethod',
    operName: '测试用户',
    deptName: 'IT部门',
    operUrl: '/api/test',
    requestMethod: 'GET',
    operIp: '127.0.0.1',
    operLocation: '内网IP',
    operParam: '{}',
    jsonResult: '{}',
    status: Status.NORMAL,
    errorMsg: '',
    businessType: 0,
    operatorType: 1,
    costTime: 100,
    operTime: new Date(),
  };

  beforeEach(async () => {
    const mockService = {
      findAll: jest.fn(),
      findOne: jest.fn(),
      remove: jest.fn(),
      removeAll: jest.fn(),
      export: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [OperlogController],
      providers: [
        {
          provide: OperlogService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get<OperlogController>(OperlogController);
    service = module.get(OperlogService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return paginated operation log list', async () => {
      const mockResult = Result.page([mockOperLog], 1);
      service.findAll.mockResolvedValue(mockResult);

      const query = plainToInstance(QueryOperLogDto, { pageNum: 1, pageSize: 10 });
      const result = await controller.findAll(query);

      expect(result.code).toBe(200);
      expect(result.data.rows).toHaveLength(1);
      expect(result.data.total).toBe(1);
      expect(service.findAll).toHaveBeenCalledWith(query);
    });
  });

  describe('findOne', () => {
    it('should return operation log by id', async () => {
      const mockResult = Result.ok(mockOperLog);
      service.findOne.mockResolvedValue(mockResult);

      const result = await controller.findOne('1');

      expect(result.code).toBe(200);
      expect(result.data).toEqual(mockOperLog);
      expect(service.findOne).toHaveBeenCalledWith(1);
    });
  });

  describe('removeAll', () => {
    it('should remove all operation logs', async () => {
      const mockResult = Result.ok();
      service.removeAll.mockResolvedValue(mockResult);

      const result = await controller.removeAll();

      expect(result.code).toBe(200);
      expect(service.removeAll).toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('should remove operation log by id', async () => {
      const mockResult = Result.ok();
      service.remove.mockResolvedValue(mockResult);

      const result = await controller.remove('1');

      expect(result.code).toBe(200);
      expect(service.remove).toHaveBeenCalledWith(1);
    });
  });

  describe('exportData', () => {
    it('should export operation logs to xlsx', async () => {
      const mockResponse = {
        setHeader: jest.fn(),
        end: jest.fn(),
      } as any;

      const query = plainToInstance(QueryOperLogDto, { pageNum: 1, pageSize: 10 });
      service.export.mockResolvedValue(undefined);

      await controller.exportData(mockResponse, query);

      expect(service.export).toHaveBeenCalledWith(mockResponse, query);
    });
  });
});
