import { Test, TestingModule } from '@nestjs/testing';
import { OnlineController } from './online.controller';
import { OnlineService } from './online.service';
import { Result } from 'src/common/response';
import { OperlogService } from '../operlog/operlog.service';

describe('OnlineController', () => {
  let controller: OnlineController;
  let service: jest.Mocked<OnlineService>;

  const mockOnlineUser = {
    tokenId: 'test-token-123',
    userName: 'testuser',
    deptName: 'IT部门',
    ipaddr: '127.0.0.1',
    loginLocation: '内网IP',
    browser: 'Chrome',
    os: 'Windows 10',
    loginTime: new Date(),
    deviceType: '0',
  };

  beforeEach(async () => {
    const mockService = {
      findAll: jest.fn(),
      delete: jest.fn(),
    };

    const mockOperlogService = {
      logAction: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [OnlineController],
      providers: [
        {
          provide: OnlineService,
          useValue: mockService,
        },
        {
          provide: OperlogService,
          useValue: mockOperlogService,
        },
      ],
    }).compile();

    controller = module.get<OnlineController>(OnlineController);
    service = module.get(OnlineService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return paginated online user list', async () => {
      const mockResult = Result.page([mockOnlineUser], 1);
      service.findAll.mockResolvedValue(mockResult);

      const query = { pageNum: '1', pageSize: '10' };
      const result = await controller.findAll(query as any);

      expect(result.code).toBe(200);
      expect(result.data.rows).toHaveLength(1);
      expect(result.data.total).toBe(1);
      expect(service.findAll).toHaveBeenCalledWith(query);
    });

    it('should handle empty list', async () => {
      const mockResult = Result.page([], 0);
      service.findAll.mockResolvedValue(mockResult);

      const result = await controller.findAll({ pageNum: '1', pageSize: '10' } as any);

      expect(result.code).toBe(200);
      expect(result.data.rows).toHaveLength(0);
    });
  });

  describe('delete', () => {
    it('should force logout a user', async () => {
      const mockResult = Result.ok();
      service.delete.mockResolvedValue(mockResult);

      const result = await controller.delete('test-token-123');

      expect(result.code).toBe(200);
      expect(service.delete).toHaveBeenCalledWith('test-token-123');
    });
  });
});
