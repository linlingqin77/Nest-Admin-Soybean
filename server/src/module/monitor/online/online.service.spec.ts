import { Test, TestingModule } from '@nestjs/testing';
import { OnlineService } from './online.service';
import { RedisService } from 'src/module/common/redis/redis.service';
import { MockServiceFactory } from 'src/test-utils/mocks/service.mock';

describe('OnlineService', () => {
  let service: OnlineService;
  let redisService: jest.Mocked<RedisService>;

  const mockOnlineUser = {
    token: 'test-token-123',
    userName: 'testuser',
    ipaddr: '127.0.0.1',
    loginLocation: '内网IP',
    browser: 'Chrome',
    os: 'Windows 10',
    loginTime: new Date(),
    deviceType: '0',
    user: {
      deptName: 'IT部门',
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OnlineService,
        {
          provide: RedisService,
          useValue: MockServiceFactory.createRedisService(),
        },
      ],
    }).compile();

    service = module.get<OnlineService>(OnlineService);
    redisService = module.get(RedisService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return paginated online user list', async () => {
      const mockKeys = ['login_tokens:token1', 'login_tokens:token2'];
      redisService.keys.mockResolvedValue(mockKeys);
      redisService.mget.mockResolvedValue([mockOnlineUser, mockOnlineUser]);

      const result = await service.findAll({ pageNum: 1, pageSize: 10 });

      expect(result.code).toBe(200);
      expect(result.data.rows).toHaveLength(2);
      expect(result.data.total).toBe(2);
      expect(redisService.keys).toHaveBeenCalledWith('login_tokens:*');
    });

    it('should return empty list when no online users', async () => {
      redisService.keys.mockResolvedValue([]);

      const result = await service.findAll({ pageNum: 1, pageSize: 10 });

      expect(result.code).toBe(200);
      expect(result.data.rows).toHaveLength(0);
      expect(result.data.total).toBe(0);
    });

    it('should filter out null values', async () => {
      const mockKeys = ['login_tokens:token1', 'login_tokens:token2'];
      redisService.keys.mockResolvedValue(mockKeys);
      redisService.mget.mockResolvedValue([mockOnlineUser, null]);

      const result = await service.findAll({ pageNum: 1, pageSize: 10 });

      expect(result.code).toBe(200);
      expect(result.data.rows).toHaveLength(1);
    });

    it('should filter out users without token', async () => {
      const mockKeys = ['login_tokens:token1'];
      redisService.keys.mockResolvedValue(mockKeys);
      redisService.mget.mockResolvedValue([{ ...mockOnlineUser, token: null }]);

      const result = await service.findAll({ pageNum: 1, pageSize: 10 });

      expect(result.code).toBe(200);
      expect(result.data.rows).toHaveLength(0);
    });

    it('should handle pagination', async () => {
      const mockKeys = Array.from({ length: 15 }, (_, i) => `login_tokens:token${i}`);
      const mockUsers = Array.from({ length: 15 }, () => mockOnlineUser);
      redisService.keys.mockResolvedValue(mockKeys);
      redisService.mget.mockResolvedValue(mockUsers);

      const result = await service.findAll({ pageNum: 1, pageSize: 10 });

      expect(result.code).toBe(200);
      expect(result.data.total).toBe(15);
    });

    it('should handle users without deptName', async () => {
      const userWithoutDept = { ...mockOnlineUser, user: null };
      const mockKeys = ['login_tokens:token1'];
      redisService.keys.mockResolvedValue(mockKeys);
      redisService.mget.mockResolvedValue([userWithoutDept]);

      const result = await service.findAll({ pageNum: 1, pageSize: 10 });

      expect(result.code).toBe(200);
      expect(result.data.rows[0].deptName).toBe('');
    });
  });

  describe('delete', () => {
    it('should delete online user by token', async () => {
      redisService.del.mockResolvedValue(1);

      const result = await service.delete('test-token-123');

      expect(result.code).toBe(200);
      expect(redisService.del).toHaveBeenCalledWith('login_tokens:test-token-123');
    });

    it('should handle non-existent token', async () => {
      redisService.del.mockResolvedValue(0);

      const result = await service.delete('nonexistent-token');

      expect(result.code).toBe(200);
    });
  });
});
