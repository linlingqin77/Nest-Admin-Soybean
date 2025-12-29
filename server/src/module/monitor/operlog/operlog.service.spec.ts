import { Test, TestingModule } from '@nestjs/testing';
import { OperlogService } from './operlog.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { AxiosService } from 'src/module/common/axios/axios.service';
import { DictService } from 'src/module/system/dict/dict.service';
import { createPrismaMock } from 'src/test-utils/prisma-mock';
import { REQUEST } from '@nestjs/core';
import { Status } from '@prisma/client';
import { QueryOperLogDto } from './dto/operLog.dto';
import { plainToInstance } from 'class-transformer';
import { SortOrder } from 'src/common/dto/base.dto';

describe('OperlogService', () => {
  let service: OperlogService;
  let prisma: jest.Mocked<PrismaService>;
  let axiosService: jest.Mocked<AxiosService>;
  let dictService: jest.Mocked<DictService>;

  const mockRequest = {
    originalUrl: '/api/test',
    method: 'GET',
    ip: '127.0.0.1',
    body: {},
    query: {},
    user: {
      user: {
        userName: 'testuser',
        nickName: '测试用户',
        deptName: 'IT部门',
      },
    },
  };

  const mockOperLog = {
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
    const mockAxiosService = {
      getIpAddress: jest.fn().mockResolvedValue('内网IP'),
    };

    const mockDictService = {
      findOneDataType: jest.fn().mockResolvedValue({
        data: [
          { dictValue: '0', dictLabel: '其他' },
          { dictValue: '1', dictLabel: '新增' },
        ],
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OperlogService,
        {
          provide: PrismaService,
          useValue: createPrismaMock(),
        },
        {
          provide: AxiosService,
          useValue: mockAxiosService,
        },
        {
          provide: DictService,
          useValue: mockDictService,
        },
        {
          provide: REQUEST,
          useValue: mockRequest,
        },
      ],
    }).compile();

    service = await module.resolve<OperlogService>(OperlogService);
    prisma = module.get(PrismaService);
    axiosService = module.get(AxiosService);
    dictService = module.get(DictService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return paginated operation log list', async () => {
      const mockLogs = [mockOperLog];
      (prisma.$transaction as jest.Mock).mockResolvedValue([mockLogs, 1]);

      const query = plainToInstance(QueryOperLogDto, { pageNum: 1, pageSize: 10 });
      const result = await service.findAll(query);

      expect(result.code).toBe(200);
      expect(result.data.rows).toHaveLength(1);
      expect(result.data.total).toBe(1);
    });

    it('should filter by multiple criteria', async () => {
      (prisma.$transaction as jest.Mock).mockResolvedValue([[], 0]);

      const query = plainToInstance(QueryOperLogDto, {
        operId: 1,
        title: '测试',
        operName: 'test',
        status: Status.NORMAL,
        pageNum: 1,
        pageSize: 10,
      });
      await service.findAll(query);

      expect(prisma.$transaction).toHaveBeenCalled();
    });

    it('should handle date range filter', async () => {
      (prisma.$transaction as jest.Mock).mockResolvedValue([[], 0]);

      const query = plainToInstance(QueryOperLogDto, {
        params: {
          beginTime: '2024-01-01',
          endTime: '2024-12-31',
        },
        pageNum: 1,
        pageSize: 10,
      });
      await service.findAll(query);

      expect(prisma.$transaction).toHaveBeenCalled();
    });

    it('should handle ordering', async () => {
      (prisma.$transaction as jest.Mock).mockResolvedValue([[], 0]);

      const query = plainToInstance(QueryOperLogDto, {
        orderByColumn: 'operTime',
        isAsc: SortOrder.DESC,
        pageNum: 1,
        pageSize: 10,
      });
      await service.findAll(query);

      expect(prisma.$transaction).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return operation log by id', async () => {
      (prisma.sysOperLog.findUnique as jest.Mock).mockResolvedValue(mockOperLog as any);

      const result = await service.findOne(1);

      expect(result.code).toBe(200);
      expect(result.data).toEqual(mockOperLog);
    });
  });

  describe('removeAll', () => {
    it('should delete all operation logs', async () => {
      (prisma.sysOperLog.deleteMany as jest.Mock).mockResolvedValue({ count: 100 });

      const result = await service.removeAll();

      expect(result.code).toBe(200);
      expect(prisma.sysOperLog.deleteMany).toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('should delete operation log by id', async () => {
      (prisma.sysOperLog.deleteMany as jest.Mock).mockResolvedValue({ count: 1 });

      const result = await service.remove(1);

      expect(result.code).toBe(200);
      expect(prisma.sysOperLog.deleteMany).toHaveBeenCalledWith({
        where: { operId: 1 },
      });
    });
  });

  describe('logAction', () => {
    it('should create operation log', async () => {
      (prisma.sysOperLog.create as jest.Mock).mockResolvedValue(mockOperLog as any);

      await service.logAction({
        title: '测试操作',
        handlerName: 'testMethod',
        costTime: 100,
      });

      expect(prisma.sysOperLog.create).toHaveBeenCalled();
      expect(axiosService.getIpAddress).toHaveBeenCalledWith('127.0.0.1');
    });

    it('should handle error message', async () => {
      (prisma.sysOperLog.create as jest.Mock).mockResolvedValue(mockOperLog as any);

      await service.logAction({
        title: '测试操作',
        handlerName: 'testMethod',
        costTime: 100,
        errorMsg: 'Test error',
      });

      expect(prisma.sysOperLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          errorMsg: 'Test error',
          status: Status.DISABLED,
        }),
      });
    });

    it('should handle object error message', async () => {
      (prisma.sysOperLog.create as jest.Mock).mockResolvedValue(mockOperLog as any);

      await service.logAction({
        title: '测试操作',
        handlerName: 'testMethod',
        costTime: 100,
        errorMsg: { message: 'error' } as any,
      });

      expect(prisma.sysOperLog.create).toHaveBeenCalled();
    });
  });

  describe('export', () => {
    it('should export operation logs to xlsx', async () => {
      const mockResponse = {
        setHeader: jest.fn(),
        end: jest.fn(),
      } as any;

      (prisma.$transaction as jest.Mock).mockResolvedValue([[mockOperLog], 1]);

      const query = plainToInstance(QueryOperLogDto, { pageNum: 1, pageSize: 10 });
      await service.export(mockResponse, query);

      expect(prisma.$transaction).toHaveBeenCalled();
      expect(dictService.findOneDataType).toHaveBeenCalledWith('sys_oper_type');
    });
  });
});
