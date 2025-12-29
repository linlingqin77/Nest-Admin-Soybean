import { Test, TestingModule } from '@nestjs/testing';
import { CacheService } from './cache.service';
import { RedisService } from 'src/module/common/redis/redis.service';
import { MockServiceFactory } from 'src/test-utils/mocks/service.mock';

describe('CacheService', () => {
  let service: CacheService;
  let redisService: jest.Mocked<RedisService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CacheService,
        {
          provide: RedisService,
          useValue: MockServiceFactory.createRedisService(),
        },
      ],
    }).compile();

    service = module.get<CacheService>(CacheService);
    redisService = module.get(RedisService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getNames', () => {
    it('should return all cache names', async () => {
      const result = await service.getNames();

      expect(result.code).toBe(200);
      expect(result.data).toBeInstanceOf(Array);
      expect(result.data.length).toBeGreaterThan(0);
      expect(result.data[0]).toHaveProperty('cacheName');
      expect(result.data[0]).toHaveProperty('remark');
    });

    it('should include standard cache categories', async () => {
      const result = await service.getNames();

      const cacheNames = result.data.map((cache) => cache.cacheName);
      expect(cacheNames).toContain('login_tokens:');
      expect(cacheNames).toContain('sys_config:');
      expect(cacheNames).toContain('sys_dict:');
      expect(cacheNames).toContain('captcha_codes:');
    });
  });

  describe('getKeys', () => {
    it('should return keys matching the pattern', async () => {
      const mockKeys = ['login_tokens:user1', 'login_tokens:user2'];
      redisService.keys.mockResolvedValue(mockKeys);

      const result = await service.getKeys('login_tokens:');

      expect(result.code).toBe(200);
      expect(result.data).toEqual(mockKeys);
      expect(redisService.keys).toHaveBeenCalledWith('login_tokens:*');
    });

    it('should return empty array when no keys match', async () => {
      redisService.keys.mockResolvedValue([]);

      const result = await service.getKeys('nonexistent:');

      expect(result.code).toBe(200);
      expect(result.data).toEqual([]);
    });
  });

  describe('clearCacheKey', () => {
    it('should delete a specific cache key', async () => {
      redisService.del.mockResolvedValue(1);

      const result = await service.clearCacheKey('login_tokens:user1');

      expect(result.code).toBe(200);
      expect(result.data).toBe(1);
      expect(redisService.del).toHaveBeenCalledWith('login_tokens:user1');
    });

    it('should return 0 when key does not exist', async () => {
      redisService.del.mockResolvedValue(0);

      const result = await service.clearCacheKey('nonexistent:key');

      expect(result.code).toBe(200);
      expect(result.data).toBe(0);
    });
  });

  describe('clearCacheName', () => {
    it('should delete all keys matching the pattern', async () => {
      const mockKeys = ['login_tokens:user1', 'login_tokens:user2'];
      redisService.keys.mockResolvedValue(mockKeys);
      redisService.del.mockResolvedValue(2);

      const result = await service.clearCacheName('login_tokens:');

      expect(result.code).toBe(200);
      expect(result.data).toBe(2);
      expect(redisService.keys).toHaveBeenCalledWith('login_tokens:*');
      expect(redisService.del).toHaveBeenCalledWith(mockKeys);
    });

    it('should handle empty key list', async () => {
      redisService.keys.mockResolvedValue([]);
      redisService.del.mockResolvedValue(0);

      const result = await service.clearCacheName('nonexistent:');

      expect(result.code).toBe(200);
      expect(result.data).toBe(0);
    });
  });

  describe('clearCacheAll', () => {
    it('should clear all cache', async () => {
      redisService.reset.mockResolvedValue(100);

      const result = await service.clearCacheAll();

      expect(result.code).toBe(200);
      expect(result.data).toBe(100);
      expect(redisService.reset).toHaveBeenCalled();
    });
  });

  describe('getValue', () => {
    it('should return cache value for a specific key', async () => {
      const mockValue = { userId: 1, userName: 'testuser' };
      redisService.get.mockResolvedValue(mockValue);

      const params = {
        cacheName: 'login_tokens:',
        cacheKey: 'login_tokens:user1',
      };

      const result = await service.getValue(params);

      expect(result.code).toBe(200);
      expect(result.data).toHaveProperty('cacheName', 'login_tokens:');
      expect(result.data).toHaveProperty('cacheKey', 'login_tokens:user1');
      expect(result.data).toHaveProperty('cacheValue');
      expect(result.data.cacheValue).toBe(JSON.stringify(mockValue));
      expect(redisService.get).toHaveBeenCalledWith('login_tokens:user1');
    });

    it('should handle null cache value', async () => {
      redisService.get.mockResolvedValue(null);

      const params = {
        cacheName: 'sys_config:',
        cacheKey: 'sys_config:test',
      };

      const result = await service.getValue(params);

      expect(result.code).toBe(200);
      expect(result.data.cacheValue).toBe('null');
    });
  });

  describe('getInfo', () => {
    it('should return cache monitoring information', async () => {
      const mockInfo = {
        redis_version: '6.2.0',
        used_memory: '1024000',
        connected_clients: '5',
      };
      const mockDbSize = 150;
      const mockCommandStats = [
        { name: 'get', calls: 1000 },
        { name: 'set', calls: 500 },
      ];

      redisService.getInfo.mockResolvedValue(mockInfo);
      redisService.getDbSize.mockResolvedValue(mockDbSize);
      redisService.commandStats.mockResolvedValue(mockCommandStats);

      const result = await service.getInfo();

      expect(result.code).toBe(200);
      expect(result.data).toHaveProperty('dbSize', mockDbSize);
      expect(result.data).toHaveProperty('info', mockInfo);
      expect(result.data).toHaveProperty('commandStats', mockCommandStats);
      expect(redisService.getInfo).toHaveBeenCalled();
      expect(redisService.getDbSize).toHaveBeenCalled();
      expect(redisService.commandStats).toHaveBeenCalled();
    });

    it('should handle empty monitoring data', async () => {
      redisService.getInfo.mockResolvedValue({});
      redisService.getDbSize.mockResolvedValue(0);
      redisService.commandStats.mockResolvedValue([]);

      const result = await service.getInfo();

      expect(result.code).toBe(200);
      expect(result.data.dbSize).toBe(0);
      expect(result.data.commandStats).toEqual([]);
    });
  });
});
