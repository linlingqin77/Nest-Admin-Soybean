import { Test, TestingModule } from '@nestjs/testing';
import { LoginSecurityService, LoginSecurityConfig } from './login-security.service';
import { RedisService } from 'src/module/common/redis/redis.service';
import { CacheEnum } from 'src/common/enum/index';

describe('LoginSecurityService', () => {
  let service: LoginSecurityService;
  let redisService: jest.Mocked<RedisService>;

  const mockRedisService = {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    ttl: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LoginSecurityService,
        {
          provide: RedisService,
          useValue: mockRedisService,
        },
      ],
    }).compile();

    service = module.get<LoginSecurityService>(LoginSecurityService);
    redisService = module.get(RedisService);
  });

  describe('isAccountLocked', () => {
    it('should return true when account is locked', async () => {
      mockRedisService.get.mockResolvedValue('1234567890');

      const result = await service.isAccountLocked('testuser');

      expect(result).toBe(true);
      expect(mockRedisService.get).toHaveBeenCalledWith(`${CacheEnum.PWD_ERR_CNT_KEY}lock:testuser`);
    });

    it('should return false when account is not locked', async () => {
      mockRedisService.get.mockResolvedValue(null);

      const result = await service.isAccountLocked('testuser');

      expect(result).toBe(false);
    });
  });

  describe('getRemainingLockTime', () => {
    it('should return remaining lock time in milliseconds', async () => {
      mockRedisService.ttl.mockResolvedValue(300); // 300 seconds

      const result = await service.getRemainingLockTime('testuser');

      expect(result).toBe(300000); // 300 * 1000 ms
    });

    it('should return 0 when key does not exist', async () => {
      mockRedisService.ttl.mockResolvedValue(-2);

      const result = await service.getRemainingLockTime('testuser');

      expect(result).toBe(0);
    });

    it('should return 0 when ttl is null', async () => {
      mockRedisService.ttl.mockResolvedValue(null);

      const result = await service.getRemainingLockTime('testuser');

      expect(result).toBe(0);
    });
  });

  describe('getFailedAttempts', () => {
    it('should return the current failed attempts count', async () => {
      mockRedisService.get.mockResolvedValue('3');

      const result = await service.getFailedAttempts('testuser');

      expect(result).toBe(3);
      expect(mockRedisService.get).toHaveBeenCalledWith(`${CacheEnum.PWD_ERR_CNT_KEY}testuser`);
    });

    it('should return 0 when no failed attempts recorded', async () => {
      mockRedisService.get.mockResolvedValue(null);

      const result = await service.getFailedAttempts('testuser');

      expect(result).toBe(0);
    });
  });

  describe('getSecurityStatus', () => {
    it('should return complete security status', async () => {
      mockRedisService.get
        .mockResolvedValueOnce('1234567890') // lock check
        .mockResolvedValueOnce('3'); // failed attempts
      mockRedisService.ttl.mockResolvedValue(600); // 10 minutes remaining

      const result = await service.getSecurityStatus('testuser');

      expect(result).toEqual({
        isLocked: true,
        failedAttempts: 3,
        remainingLockTimeMs: 600000,
        remainingAttempts: 2,
      });
    });

    it('should calculate remaining attempts correctly', async () => {
      mockRedisService.get
        .mockResolvedValueOnce(null) // not locked
        .mockResolvedValueOnce('4'); // 4 failed attempts
      mockRedisService.ttl.mockResolvedValue(-2);

      const result = await service.getSecurityStatus('testuser');

      expect(result.remainingAttempts).toBe(1);
    });

    it('should not return negative remaining attempts', async () => {
      mockRedisService.get
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce('10'); // more than max
      mockRedisService.ttl.mockResolvedValue(-2);

      const result = await service.getSecurityStatus('testuser');

      expect(result.remainingAttempts).toBe(0);
    });
  });

  describe('recordLoginFailure', () => {
    it('should increment failed attempts count', async () => {
      mockRedisService.get
        .mockResolvedValueOnce('2') // current count
        .mockResolvedValueOnce(null) // lock check for status
        .mockResolvedValueOnce('3'); // updated count for status
      mockRedisService.ttl.mockResolvedValue(-2);
      mockRedisService.set.mockResolvedValue('OK');

      const result = await service.recordLoginFailure('testuser');

      expect(mockRedisService.set).toHaveBeenCalledWith(
        `${CacheEnum.PWD_ERR_CNT_KEY}testuser`,
        3,
        15 * 60 * 1000,
      );
      expect(result.failedAttempts).toBe(3);
    });

    it('should lock account after max failed attempts', async () => {
      mockRedisService.get
        .mockResolvedValueOnce('4') // current count (will become 5)
        .mockResolvedValueOnce('1234567890') // lock check for status
        .mockResolvedValueOnce('5'); // updated count for status
      mockRedisService.ttl.mockResolvedValue(900); // 15 minutes
      mockRedisService.set.mockResolvedValue('OK');

      const result = await service.recordLoginFailure('testuser');

      // Should set both count and lock
      expect(mockRedisService.set).toHaveBeenCalledTimes(2);
      expect(mockRedisService.set).toHaveBeenCalledWith(
        `${CacheEnum.PWD_ERR_CNT_KEY}lock:testuser`,
        expect.any(String),
        15 * 60 * 1000,
      );
      expect(result.isLocked).toBe(true);
    });

    it('should use custom config when provided', async () => {
      const customConfig: Partial<LoginSecurityConfig> = {
        maxFailedAttempts: 3,
        lockDurationMs: 5 * 60 * 1000,
        failedCountTtlMs: 5 * 60 * 1000,
      };

      mockRedisService.get
        .mockResolvedValueOnce('2') // current count (will become 3)
        .mockResolvedValueOnce('1234567890') // lock check
        .mockResolvedValueOnce('3'); // updated count
      mockRedisService.ttl.mockResolvedValue(300);
      mockRedisService.set.mockResolvedValue('OK');

      await service.recordLoginFailure('testuser', customConfig);

      expect(mockRedisService.set).toHaveBeenCalledWith(
        `${CacheEnum.PWD_ERR_CNT_KEY}testuser`,
        3,
        5 * 60 * 1000,
      );
    });
  });

  describe('lockAccount', () => {
    it('should lock account with default duration', async () => {
      mockRedisService.set.mockResolvedValue('OK');

      await service.lockAccount('testuser');

      expect(mockRedisService.set).toHaveBeenCalledWith(
        `${CacheEnum.PWD_ERR_CNT_KEY}lock:testuser`,
        expect.any(String),
        15 * 60 * 1000,
      );
    });

    it('should lock account with custom duration', async () => {
      mockRedisService.set.mockResolvedValue('OK');

      await service.lockAccount('testuser', 30 * 60 * 1000);

      expect(mockRedisService.set).toHaveBeenCalledWith(
        `${CacheEnum.PWD_ERR_CNT_KEY}lock:testuser`,
        expect.any(String),
        30 * 60 * 1000,
      );
    });
  });

  describe('unlockAccount', () => {
    it('should remove both lock and count keys', async () => {
      mockRedisService.del.mockResolvedValue(1);

      await service.unlockAccount('testuser');

      expect(mockRedisService.del).toHaveBeenCalledWith(`${CacheEnum.PWD_ERR_CNT_KEY}lock:testuser`);
      expect(mockRedisService.del).toHaveBeenCalledWith(`${CacheEnum.PWD_ERR_CNT_KEY}testuser`);
    });
  });

  describe('clearFailedAttempts', () => {
    it('should clear failed attempts count', async () => {
      mockRedisService.del.mockResolvedValue(1);

      await service.clearFailedAttempts('testuser');

      expect(mockRedisService.del).toHaveBeenCalledWith(`${CacheEnum.PWD_ERR_CNT_KEY}testuser`);
    });
  });

  describe('validateBeforeLogin', () => {
    it('should return locked status when account is locked', async () => {
      mockRedisService.get.mockResolvedValue('1234567890');
      mockRedisService.ttl.mockResolvedValue(600); // 10 minutes

      const result = await service.validateBeforeLogin('testuser');

      expect(result.locked).toBe(true);
      expect(result.remainingTimeMs).toBe(600000);
      expect(result.message).toContain('10');
    });

    it('should return not locked when account is not locked', async () => {
      mockRedisService.get.mockResolvedValue(null);

      const result = await service.validateBeforeLogin('testuser');

      expect(result.locked).toBe(false);
      expect(result.message).toBe('');
      expect(result.remainingTimeMs).toBe(0);
    });
  });
});
