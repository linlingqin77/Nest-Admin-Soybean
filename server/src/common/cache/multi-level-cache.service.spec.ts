import { Test, TestingModule } from '@nestjs/testing';
import { MultiLevelCacheService, CacheStats } from './multi-level-cache.service';
import { RedisService } from 'src/module/common/redis/redis.service';

describe('MultiLevelCacheService', () => {
  let service: MultiLevelCacheService;
  let redisService: jest.Mocked<RedisService>;

  beforeEach(async () => {
    const mockRedisService = {
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MultiLevelCacheService,
        {
          provide: RedisService,
          useValue: mockRedisService,
        },
      ],
    }).compile();

    service = module.get<MultiLevelCacheService>(MultiLevelCacheService);
    redisService = module.get(RedisService);

    // Reset stats before each test
    service.resetStats();
    service.flushL1();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('get', () => {
    it('should return value from L1 cache if present', async () => {
      const key = 'test-key';
      const value = { data: 'test-value' };

      // Set value in L1 first
      await service.set(key, value);

      // Get should return from L1 without hitting L2
      const result = await service.get(key);

      expect(result).toEqual(value);
      expect(redisService.get).not.toHaveBeenCalled();
    });

    it('should return value from L2 cache and backfill L1 if L1 misses', async () => {
      const key = 'test-key';
      const value = { data: 'test-value' };

      redisService.get.mockResolvedValue(value);

      const result = await service.get(key);

      expect(result).toEqual(value);
      expect(redisService.get).toHaveBeenCalledWith(key);

      // Verify L1 was backfilled - next get should not hit L2
      redisService.get.mockClear();
      const result2 = await service.get(key);
      expect(result2).toEqual(value);
      expect(redisService.get).not.toHaveBeenCalled();
    });

    it('should return null if key not found in both caches', async () => {
      const key = 'non-existent-key';

      redisService.get.mockResolvedValue(null);

      const result = await service.get(key);

      expect(result).toBeNull();
      expect(redisService.get).toHaveBeenCalledWith(key);
    });

    it('should handle L2 errors gracefully', async () => {
      const key = 'test-key';

      redisService.get.mockRejectedValue(new Error('Redis connection error'));

      const result = await service.get(key);

      expect(result).toBeNull();
    });

    it('should skip L1 when enableL1 is false', async () => {
      const key = 'test-key';
      const value = { data: 'test-value' };

      // Set value in L1
      await service.set(key, value);

      redisService.get.mockResolvedValue(value);

      // Get with L1 disabled should hit L2
      const result = await service.get(key, { enableL1: false });

      expect(result).toEqual(value);
      expect(redisService.get).toHaveBeenCalledWith(key);
    });

    it('should skip L2 when enableL2 is false', async () => {
      const key = 'test-key';

      const result = await service.get(key, { enableL2: false });

      expect(result).toBeNull();
      expect(redisService.get).not.toHaveBeenCalled();
    });
  });

  describe('set', () => {
    it('should set value in both L1 and L2 caches', async () => {
      const key = 'test-key';
      const value = { data: 'test-value' };
      const ttl = 120;

      await service.set(key, value, ttl);

      // Verify L1 was set
      const l1Value = await service.get(key, { enableL2: false });
      expect(l1Value).toEqual(value);

      // Verify L2 was set (TTL in milliseconds)
      expect(redisService.set).toHaveBeenCalledWith(key, value, ttl * 1000);
    });

    it('should use default TTL when not specified', async () => {
      const key = 'test-key';
      const value = { data: 'test-value' };

      await service.set(key, value);

      // Default L2 TTL is 300 seconds = 300000 ms
      expect(redisService.set).toHaveBeenCalledWith(key, value, 300000);
    });

    it('should cap L1 TTL at 60 seconds', async () => {
      const key = 'test-key';
      const value = { data: 'test-value' };
      const ttl = 600; // 10 minutes

      await service.set(key, value, ttl);

      // L1 TTL should be capped at 60 seconds
      const l1Ttl = service.getL1Ttl(key);
      expect(l1Ttl).toBeDefined();
      // TTL should be around 60 seconds (with some tolerance for test execution time)
      const remainingTtl = (l1Ttl! - Date.now()) / 1000;
      expect(remainingTtl).toBeLessThanOrEqual(60);
      expect(remainingTtl).toBeGreaterThan(55);
    });

    it('should skip L1 when enableL1 is false', async () => {
      const key = 'test-key';
      const value = { data: 'test-value' };

      await service.set(key, value, 60, { enableL1: false });

      // L1 should not have the value
      const l1Value = await service.get(key, { enableL2: false });
      expect(l1Value).toBeNull();

      // L2 should have been called
      expect(redisService.set).toHaveBeenCalled();
    });

    it('should skip L2 when enableL2 is false', async () => {
      const key = 'test-key';
      const value = { data: 'test-value' };

      await service.set(key, value, 60, { enableL2: false });

      // L1 should have the value
      const l1Value = await service.get(key, { enableL2: false });
      expect(l1Value).toEqual(value);

      // L2 should not have been called
      expect(redisService.set).not.toHaveBeenCalled();
    });

    it('should handle L2 errors gracefully', async () => {
      const key = 'test-key';
      const value = { data: 'test-value' };

      redisService.set.mockRejectedValue(new Error('Redis connection error'));

      // Should not throw
      await expect(service.set(key, value)).resolves.not.toThrow();

      // L1 should still have the value
      const l1Value = await service.get(key, { enableL2: false });
      expect(l1Value).toEqual(value);
    });
  });

  describe('del', () => {
    it('should delete from both L1 and L2 caches', async () => {
      const key = 'test-key';
      const value = { data: 'test-value' };

      await service.set(key, value);
      await service.del(key);

      // Verify L1 was deleted
      const l1Value = await service.get(key, { enableL2: false });
      expect(l1Value).toBeNull();

      // Verify L2 del was called
      expect(redisService.del).toHaveBeenCalledWith([key]);
    });

    it('should handle array of keys', async () => {
      const keys = ['key1', 'key2', 'key3'];

      await service.del(keys);

      expect(redisService.del).toHaveBeenCalledWith(keys);
    });

    it('should handle L2 errors gracefully', async () => {
      const key = 'test-key';

      redisService.del.mockRejectedValue(new Error('Redis connection error'));

      // Should not throw
      await expect(service.del(key)).resolves.not.toThrow();
    });
  });

  describe('getOrSet', () => {
    it('should return cached value if present', async () => {
      const key = 'test-key';
      const value = { data: 'cached-value' };
      const factory = jest.fn().mockResolvedValue({ data: 'new-value' });

      await service.set(key, value);
      const result = await service.getOrSet(key, factory);

      expect(result).toEqual(value);
      expect(factory).not.toHaveBeenCalled();
    });

    it('should call factory and cache result if not present', async () => {
      const key = 'test-key';
      const value = { data: 'new-value' };
      const factory = jest.fn().mockResolvedValue(value);

      redisService.get.mockResolvedValue(null);

      const result = await service.getOrSet(key, factory, 60);

      expect(result).toEqual(value);
      expect(factory).toHaveBeenCalled();
      expect(redisService.set).toHaveBeenCalled();
    });

    it('should not cache null values from factory', async () => {
      const key = 'test-key';
      const factory = jest.fn().mockResolvedValue(null);

      redisService.get.mockResolvedValue(null);

      const result = await service.getOrSet(key, factory);

      expect(result).toBeNull();
      expect(redisService.set).not.toHaveBeenCalled();
    });
  });

  describe('has', () => {
    it('should return true if key exists in L1', async () => {
      const key = 'test-key';
      await service.set(key, 'value', 60, { enableL2: false });

      const result = await service.has(key);

      expect(result).toBe(true);
      expect(redisService.get).not.toHaveBeenCalled();
    });

    it('should return true if key exists in L2', async () => {
      const key = 'test-key';
      redisService.get.mockResolvedValue('value');

      const result = await service.has(key);

      expect(result).toBe(true);
    });

    it('should return false if key does not exist', async () => {
      const key = 'non-existent-key';
      redisService.get.mockResolvedValue(null);

      const result = await service.has(key);

      expect(result).toBe(false);
    });

    it('should return false on L2 error', async () => {
      const key = 'test-key';
      redisService.get.mockRejectedValue(new Error('Redis error'));

      const result = await service.has(key);

      expect(result).toBe(false);
    });
  });

  describe('flush', () => {
    it('should clear L1 cache', async () => {
      await service.set('key1', 'value1', 60, { enableL2: false });
      await service.set('key2', 'value2', 60, { enableL2: false });

      await service.flush();

      expect(service.getL1Keys()).toHaveLength(0);
    });
  });

  describe('flushL1', () => {
    it('should clear only L1 cache', async () => {
      await service.set('key1', 'value1');

      service.flushL1();

      expect(service.getL1Keys()).toHaveLength(0);
      // L2 del should not have been called
      expect(redisService.del).not.toHaveBeenCalled();
    });
  });

  describe('getStats', () => {
    it('should return correct statistics', async () => {
      const key1 = 'key1';
      const key2 = 'key2';
      const value = { data: 'value' };

      // Set a value
      await service.set(key1, value);

      // L1 hit
      await service.get(key1);

      // L1 miss, L2 hit
      redisService.get.mockResolvedValue(value);
      await service.get(key2);

      // L1 miss, L2 miss
      redisService.get.mockResolvedValue(null);
      await service.get('non-existent');

      const stats = service.getStats();

      expect(stats.l1Hits).toBe(1);
      expect(stats.l1Misses).toBe(2);
      expect(stats.l2Hits).toBe(1);
      expect(stats.l2Misses).toBe(1);
      expect(stats.l1Keys).toBeGreaterThanOrEqual(1);
      expect(stats.hitRate).toBeGreaterThan(0);
    });

    it('should calculate hit rate correctly', async () => {
      // 2 L1 hits, 1 L2 hit, 1 miss = 3/5 = 60%
      // (totalHits = l1Hits + l2Hits, totalRequests = totalHits + l1Misses)
      await service.set('key1', 'value');
      await service.set('key2', 'value');

      await service.get('key1'); // L1 hit
      await service.get('key2'); // L1 hit

      redisService.get.mockResolvedValue('value');
      await service.get('key3'); // L1 miss, L2 hit

      redisService.get.mockResolvedValue(null);
      await service.get('key4'); // L1 miss, L2 miss

      const stats = service.getStats();
      // l1Hits=2, l2Hits=1, l1Misses=2, l2Misses=1
      // totalHits = 3, totalRequests = 3 + 2 = 5
      // hitRate = 3/5 = 60%
      expect(stats.hitRate).toBe(60);
    });
  });

  describe('resetStats', () => {
    it('should reset all statistics', async () => {
      await service.set('key', 'value');
      await service.get('key');

      service.resetStats();

      const stats = service.getStats();
      expect(stats.l1Hits).toBe(0);
      expect(stats.l1Misses).toBe(0);
      expect(stats.l2Hits).toBe(0);
      expect(stats.l2Misses).toBe(0);
    });
  });

  describe('getL1Keys', () => {
    it('should return all L1 cache keys', async () => {
      await service.set('key1', 'value1', 60, { enableL2: false });
      await service.set('key2', 'value2', 60, { enableL2: false });

      const keys = service.getL1Keys();

      expect(keys).toContain('key1');
      expect(keys).toContain('key2');
    });
  });

  describe('getL1Ttl', () => {
    it('should return TTL for existing key', async () => {
      await service.set('key', 'value', 60, { enableL2: false });

      const ttl = service.getL1Ttl('key');

      expect(ttl).toBeDefined();
      expect(ttl).toBeGreaterThan(Date.now());
    });

    it('should return undefined for non-existent key', () => {
      const ttl = service.getL1Ttl('non-existent');

      expect(ttl).toBeUndefined();
    });
  });
});
