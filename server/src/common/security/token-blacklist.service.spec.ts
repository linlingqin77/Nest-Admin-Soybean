import { Test, TestingModule } from '@nestjs/testing';
import { TokenBlacklistService } from './token-blacklist.service';
import { RedisService } from 'src/module/common/redis/redis.service';

describe('TokenBlacklistService', () => {
  let service: TokenBlacklistService;
  let redisService: jest.Mocked<RedisService>;

  beforeEach(async () => {
    const mockRedisService = {
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TokenBlacklistService,
        {
          provide: RedisService,
          useValue: mockRedisService,
        },
      ],
    }).compile();

    service = module.get<TokenBlacklistService>(TokenBlacklistService);
    redisService = module.get(RedisService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('addToBlacklist', () => {
    it('should add token to blacklist with default TTL', async () => {
      const tokenUuid = 'test-token-uuid';
      redisService.set.mockResolvedValue('OK');

      await service.addToBlacklist(tokenUuid);

      expect(redisService.set).toHaveBeenCalledWith(
        `token_blacklist:${tokenUuid}`,
        expect.any(String),
        24 * 60 * 60 * 1000, // default TTL
      );
    });

    it('should add token to blacklist with custom TTL', async () => {
      const tokenUuid = 'test-token-uuid';
      const customTtl = 3600000; // 1 hour
      redisService.set.mockResolvedValue('OK');

      await service.addToBlacklist(tokenUuid, customTtl);

      expect(redisService.set).toHaveBeenCalledWith(
        `token_blacklist:${tokenUuid}`,
        expect.any(String),
        customTtl,
      );
    });
  });

  describe('isBlacklisted', () => {
    it('should return true if token is in blacklist', async () => {
      const tokenUuid = 'test-token-uuid';
      redisService.get.mockResolvedValue(Date.now().toString());

      const result = await service.isBlacklisted(tokenUuid);

      expect(result).toBe(true);
      expect(redisService.get).toHaveBeenCalledWith(`token_blacklist:${tokenUuid}`);
    });

    it('should return false if token is not in blacklist', async () => {
      const tokenUuid = 'test-token-uuid';
      redisService.get.mockResolvedValue(null);

      const result = await service.isBlacklisted(tokenUuid);

      expect(result).toBe(false);
    });
  });

  describe('removeFromBlacklist', () => {
    it('should remove token from blacklist', async () => {
      const tokenUuid = 'test-token-uuid';
      redisService.del.mockResolvedValue(1);

      await service.removeFromBlacklist(tokenUuid);

      expect(redisService.del).toHaveBeenCalledWith(`token_blacklist:${tokenUuid}`);
    });
  });

  describe('getUserTokenVersion', () => {
    it('should return token version if exists', async () => {
      const userId = 1;
      redisService.get.mockResolvedValue('5');

      const result = await service.getUserTokenVersion(userId);

      expect(result).toBe(5);
      expect(redisService.get).toHaveBeenCalledWith(`user_token_version:${userId}`);
    });

    it('should return 0 if token version does not exist', async () => {
      const userId = 1;
      redisService.get.mockResolvedValue(null);

      const result = await service.getUserTokenVersion(userId);

      expect(result).toBe(0);
    });
  });

  describe('incrementUserTokenVersion', () => {
    it('should increment token version from 0', async () => {
      const userId = 1;
      redisService.get.mockResolvedValue(null);
      redisService.set.mockResolvedValue('OK');

      const result = await service.incrementUserTokenVersion(userId);

      expect(result).toBe(1);
      expect(redisService.set).toHaveBeenCalledWith(
        `user_token_version:${userId}`,
        '1',
        7 * 24 * 60 * 60 * 1000, // default TTL
      );
    });

    it('should increment existing token version', async () => {
      const userId = 1;
      redisService.get.mockResolvedValue('3');
      redisService.set.mockResolvedValue('OK');

      const result = await service.incrementUserTokenVersion(userId);

      expect(result).toBe(4);
      expect(redisService.set).toHaveBeenCalledWith(
        `user_token_version:${userId}`,
        '4',
        7 * 24 * 60 * 60 * 1000,
      );
    });

    it('should use custom TTL when provided', async () => {
      const userId = 1;
      const customTtl = 3600000;
      redisService.get.mockResolvedValue(null);
      redisService.set.mockResolvedValue('OK');

      await service.incrementUserTokenVersion(userId, customTtl);

      expect(redisService.set).toHaveBeenCalledWith(
        `user_token_version:${userId}`,
        '1',
        customTtl,
      );
    });
  });

  describe('isTokenVersionValid', () => {
    it('should return true if no version is set (version is 0)', async () => {
      const userId = 1;
      redisService.get.mockResolvedValue(null);

      const result = await service.isTokenVersionValid(userId, 0);

      expect(result).toBe(true);
    });

    it('should return true if token version >= current version', async () => {
      const userId = 1;
      redisService.get.mockResolvedValue('3');

      const result = await service.isTokenVersionValid(userId, 3);

      expect(result).toBe(true);
    });

    it('should return true if token version > current version', async () => {
      const userId = 1;
      redisService.get.mockResolvedValue('3');

      const result = await service.isTokenVersionValid(userId, 5);

      expect(result).toBe(true);
    });

    it('should return false if token version < current version', async () => {
      const userId = 1;
      redisService.get.mockResolvedValue('5');

      const result = await service.isTokenVersionValid(userId, 3);

      expect(result).toBe(false);
    });
  });

  describe('invalidateAllUserTokens', () => {
    it('should increment token version to invalidate all tokens', async () => {
      const userId = 1;
      redisService.get.mockResolvedValue('2');
      redisService.set.mockResolvedValue('OK');

      await service.invalidateAllUserTokens(userId, 'password_change');

      expect(redisService.set).toHaveBeenCalledWith(
        `user_token_version:${userId}`,
        '3',
        expect.any(Number),
      );
    });
  });

  describe('invalidateMultipleUsersTokens', () => {
    it('should invalidate tokens for multiple users', async () => {
      const userIds = [1, 2, 3];
      redisService.get.mockResolvedValue(null);
      redisService.set.mockResolvedValue('OK');

      await service.invalidateMultipleUsersTokens(userIds, 'batch_reset');

      expect(redisService.set).toHaveBeenCalledTimes(3);
    });
  });

  describe('clearUserTokenVersion', () => {
    it('should clear user token version', async () => {
      const userId = 1;
      redisService.del.mockResolvedValue(1);

      await service.clearUserTokenVersion(userId);

      expect(redisService.del).toHaveBeenCalledWith(`user_token_version:${userId}`);
    });
  });
});
