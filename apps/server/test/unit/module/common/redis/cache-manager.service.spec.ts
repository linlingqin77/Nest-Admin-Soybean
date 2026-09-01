/**
 * @file Cache Manager Service Unit Tests
 * @description Migrated from src/platform/redis/cache-manager.service.spec.ts
 */
import { Test, TestingModule } from '@nestjs/testing';
import { CacheManagerService } from '@/platform/redis/cache-manager.service';
import { RedisService } from '@/platform/redis/redis.service';
import { PrismaService } from '@/platform/prisma';

describe('CacheManagerService', () => {
  let service: CacheManagerService;
  let redisMock: any;
  let prismaMock: any;

  beforeEach(async () => {
    redisMock = {
      set: jest.fn().mockResolvedValue('OK'),
      get: jest.fn().mockResolvedValue(null),
      del: jest.fn().mockResolvedValue(1),
      keys: jest.fn().mockResolvedValue([]),
    };

    prismaMock = {
      sysDictType: {
        findMany: jest.fn().mockResolvedValue([]),
      },
      sysDictData: {
        findMany: jest.fn().mockResolvedValue([]),
      },
      sysConfig: {
        findMany: jest.fn().mockResolvedValue([]),
      },
    };

    const modules: TestingModule = await Test.createTestingModule({
      providers: [
        CacheManagerService,
        { provide: RedisService, useValue: redisMock },
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();

    service = modules.get<CacheManagerService>(CacheManagerService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('onModuleInit', () => {
    it('should warmup all caches on init', async () => {
      prismaMock.sysDictType.findMany.mockResolvedValue([{ dictType: 'sys_user_sex' }]);
      prismaMock.sysDictData.findMany.mockResolvedValue([{ dictValue: '0', dictLabel: '男' }]);
      prismaMock.sysConfig.findMany.mockResolvedValue([{ configKey: 'sys.index.title', configValue: 'Admin' }]);

      await service.onModuleInit();

      expect(prismaMock.sysDictType.findMany).toHaveBeenCalled();
      expect(prismaMock.sysConfig.findMany).toHaveBeenCalled();
    });
  });

  describe('warmupAll', () => {
    it('should warmup all registered configs', async () => {
      prismaMock.sysDictType.findMany.mockResolvedValue([]);
      prismaMock.sysConfig.findMany.mockResolvedValue([]);

      await service.warmupAll();

      expect(prismaMock.sysDictType.findMany).toHaveBeenCalled();
      expect(prismaMock.sysConfig.findMany).toHaveBeenCalled();
    });

    it('should handle errors during warmup', async () => {
      prismaMock.sysDictType.findMany.mockRejectedValue(new Error('DB error'));
      prismaMock.sysConfig.findMany.mockResolvedValue([]);

      // Should not throw
      await expect(service.warmupAll()).resolves.not.toThrow();
    });
  });

  describe('warmup', () => {
    it('should warmup dict cache', async () => {
      prismaMock.sysDictType.findMany.mockResolvedValue([
        { dictType: 'sys_user_sex' },
        { dictType: 'sys_normal_disable' },
      ]);
      prismaMock.sysDictData.findMany.mockResolvedValue([{ dictValue: '0', dictLabel: '男' }]);

      await service.warmup('dict');

      expect(redisMock.set).toHaveBeenCalledTimes(2);
    });

    it('should warmup platform/config cache', async () => {
      prismaMock.sysConfig.findMany.mockResolvedValue([
        { configKey: 'sys.index.title', configValue: 'Admin' },
        { configKey: 'sys.index.skinName', configValue: 'skin-blue' },
      ]);

      await service.warmup('platform/config');

      expect(redisMock.set).toHaveBeenCalledTimes(2);
    });

    it('should log warning for unknown cache name', async () => {
      await service.warmup('unknown');

      expect(redisMock.set).not.toHaveBeenCalled();
    });
  });

  describe('set', () => {
    it('should set cache with jitter', async () => {
      await service.set('test:key', { data: 'value' }, 3600);

      expect(redisMock.set).toHaveBeenCalledWith('test:key', { data: 'value' }, expect.any(Number));
      // TTL should be between 3600 and 3900 (base + jitter range)
      const ttl = redisMock.set.mock.calls[0][2];
      expect(ttl).toBeGreaterThanOrEqual(3600);
      expect(ttl).toBeLessThanOrEqual(3900);
    });
  });

  describe('get', () => {
    it('should get cache value', async () => {
      redisMock.get.mockResolvedValue({ data: 'cached' });

      const result = await service.get('test:key');

      expect(result).toEqual({ data: 'cached' });
      expect(redisMock.get).toHaveBeenCalledWith('test:key');
    });

    it('should return null for missing key', async () => {
      redisMock.get.mockResolvedValue(null);

      const result = await service.get('missing:key');

      expect(result).toBeNull();
    });
  });

  describe('del', () => {
    it('should delete cache key', async () => {
      await service.del('test:key');

      expect(redisMock.del).toHaveBeenCalledWith('test:key');
    });
  });

  describe('delByPrefix', () => {
    it('should delete all keys with prefix', async () => {
      redisMock.keys.mockResolvedValue(['prefix:key1', 'prefix:key2', 'prefix:key3']);

      await service.delByPrefix('prefix:');

      expect(redisMock.keys).toHaveBeenCalledWith('prefix:*');
      expect(redisMock.del).toHaveBeenCalledWith(['prefix:key1', 'prefix:key2', 'prefix:key3']);
    });

    it('should not call del when no keys found', async () => {
      redisMock.keys.mockResolvedValue([]);

      await service.delByPrefix('empty:');

      expect(redisMock.keys).toHaveBeenCalledWith('empty:*');
      expect(redisMock.del).not.toHaveBeenCalled();
    });
  });

  describe('refresh', () => {
    it('should refresh dict cache', async () => {
      redisMock.keys.mockResolvedValue(['sys_dict:key1']);
      prismaMock.sysDictType.findMany.mockResolvedValue([{ dictType: 'test' }]);
      prismaMock.sysDictData.findMany.mockResolvedValue([]);

      await service.refresh('dict');

      expect(redisMock.del).toHaveBeenCalled();
      expect(prismaMock.sysDictType.findMany).toHaveBeenCalled();
    });

    it('should log warning for unknown cache name', async () => {
      await service.refresh('unknown');

      expect(redisMock.del).not.toHaveBeenCalled();
    });
  });

  describe('getStats', () => {
    it('should return cache statistics', async () => {
      redisMock.keys.mockResolvedValueOnce(['dict:key1', 'dict:key2']).mockResolvedValueOnce(['platform/config:key1']);

      const stats = await service.getStats();

      expect(stats).toHaveProperty('dict');
      expect(stats).toHaveProperty('platform/config');
      expect(stats.dict.count).toBe(2);
      expect(stats.mockConfig.count).toBe(1);
    });
  });
});
