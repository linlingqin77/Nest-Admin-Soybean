import { Test, TestingModule } from '@nestjs/testing';
import { plainToInstance } from 'class-transformer';
import { ListLoginlogDto } from './dto/list-loginlog.dto';
import { LoginlogController } from './loginlog.controller';
import { LoginlogService } from './loginlog.service';
import { Result } from 'src/common/response';
import { Status } from '@prisma/client';
import { OperlogService } from '../operlog/operlog.service';

describe('LoginlogController', () => {
  let controller: LoginlogController;
  let service: jest.Mocked<LoginlogService>;

  const mockLoginLog = {
    tenantId: '000000',
    infoId: 1,
    userName: 'testuser',
    ipaddr: '127.0.0.1',
    loginLocation: '内网IP',
    browser: 'Chrome',
    os: 'Windows 10',
    status: Status.NORMAL,
    deviceType: 'PC' as any,
    msg: '登录成功',
    loginTime: new Date(),
    delFlag: 'NORMAL' as any,
  };

  beforeEach(async () => {
    const mockService = {
      findAll: jest.fn(),
      create: jest.fn(),
      remove: jest.fn(),
      removeAll: jest.fn(),
      unlock: jest.fn(),
      export: jest.fn(),
    };

    const mockOperlogService = {
      logAction: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [LoginlogController],
      providers: [
        {
          provide: LoginlogService,
          useValue: mockService,
        },
        {
          provide: OperlogService,
          useValue: mockOperlogService,
        },
      ],
    }).compile();

    controller = module.get<LoginlogController>(LoginlogController);
    service = module.get(LoginlogService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return paginated login log list', async () => {
      const mockResult = Result.page([mockLoginLog], 1);
      service.findAll.mockResolvedValue(mockResult);

      const query = plainToInstance(ListLoginlogDto, { pageNum: 1, pageSize: 10 });
      const result = await controller.findAll(query);

      expect(result.code).toBe(200);
      expect(result.data.rows).toHaveLength(1);
      expect(result.data.total).toBe(1);
      expect(service.findAll).toHaveBeenCalledWith(query);
    });

    it('should handle empty list', async () => {
      const mockResult = Result.page([], 0);
      service.findAll.mockResolvedValue(mockResult);

      const result = await controller.findAll(plainToInstance(ListLoginlogDto, { pageNum: 1, pageSize: 10 }));

      expect(result.code).toBe(200);
      expect(result.data.rows).toHaveLength(0);
    });
  });

  describe('removeAll', () => {
    it('should remove all login logs', async () => {
      const mockResult = Result.ok();
      service.removeAll.mockResolvedValue(mockResult);

      const result = await controller.removeAll();

      expect(result.code).toBe(200);
      expect(service.removeAll).toHaveBeenCalled();
    });
  });

  describe('unlock', () => {
    it('should unlock a user', async () => {
      const mockResult = Result.ok();
      service.unlock.mockResolvedValue(mockResult);

      const result = await controller.unlock('testuser');

      expect(result.code).toBe(200);
      expect(service.unlock).toHaveBeenCalledWith('testuser');
    });
  });

  describe('remove', () => {
    it('should remove login logs by ids', async () => {
      const mockResult = Result.ok(2);
      service.remove.mockResolvedValue(mockResult);

      const result = await controller.remove('1,2');

      expect(result.code).toBe(200);
      expect(service.remove).toHaveBeenCalledWith(['1', '2']);
    });

    it('should handle single id', async () => {
      const mockResult = Result.ok(1);
      service.remove.mockResolvedValue(mockResult);

      const result = await controller.remove('1');

      expect(result.code).toBe(200);
      expect(service.remove).toHaveBeenCalledWith(['1']);
    });
  });

  describe('export', () => {
    it('should export login logs to xlsx', async () => {
      const mockResponse = {
        setHeader: jest.fn(),
        end: jest.fn(),
      } as any;

      const query = plainToInstance(ListLoginlogDto, { pageNum: 1, pageSize: 10 });
      service.export.mockResolvedValue(undefined);

      await controller.export(mockResponse, query);

      expect(service.export).toHaveBeenCalledWith(mockResponse, query);
    });
  });
});
