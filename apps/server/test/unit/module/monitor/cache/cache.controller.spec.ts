/**
 * @file Cache Controller Unit Tests
 * @description Migrated from src/modules/monitors/cache/cache.controller.spec.ts
 */
import { Test, TestingModule } from '@nestjs/testing';
import { CacheController } from '@/modules/monitors/cache/cache.controller';
import { CacheService } from '@/modules/monitors/cache/cache.service';
import { Result } from '@/shared/response';
import { APP_INTERCEPTOR } from '@nestjs/core';

// Mock the Operlog decorator
jest.mock('@/core/audit/decorators/operlog.decorator', () => ({
  Operlog: () => () => {},
}));

describe('CacheController', () => {
  let controller: CacheController;
  let cacheServiceMock: any;

  beforeEach(async () => {
    cacheServiceMock = {
      getInfo: jest.fn().mockResolvedValue(
        Result.ok({
          info: { redis_version: '7.0.0' },
          dbSize: 100,
          commandStats: [],
        }),
      ),
      getNames: jest.fn().mockResolvedValue(Result.ok(['sys_dict', 'sys_config'])),
      getKeys: jest.fn().mockResolvedValue(Result.ok(['key1', 'key2'])),
      getValue: jest.fn().mockResolvedValue(Result.ok({ cacheName: 'test', cacheKey: 'key1', cacheValue: 'value1' })),
      clearCacheName: jest.fn().mockResolvedValue(Result.ok()),
      clearCacheKey: jest.fn().mockResolvedValue(Result.ok()),
      clearCacheAll: jest.fn().mockResolvedValue(Result.ok()),
    };

    const modules: TestingModule = await Test.createTestingModule({
      controllers: [CacheController],
      providers: [{ provide: CacheService, useValue: cacheServiceMock }],
    }).compile();

    controller = modules.get<CacheController>(CacheController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getInfo', () => {
    it('should return cache info', async () => {
      const result = await controller.getInfo();

      expect(result.code).toBe(200);
      expect(result.data).toHaveProperty('info');
      expect(result.data).toHaveProperty('dbSize');
      expect(cacheServiceMock.getInfo).toHaveBeenCalled();
    });
  });

  describe('getNames', () => {
    it('should return cache names', async () => {
      const result = await controller.getNames();

      expect(result.code).toBe(200);
      expect(result.data).toContain('sys_dict');
      expect(cacheServiceMock.getNames).toHaveBeenCalled();
    });
  });

  describe('getKeys', () => {
    it('should return cache keys by name', async () => {
      const result = await controller.getKeys('sys_dict');

      expect(result.code).toBe(200);
      expect(result.data).toContain('key1');
      expect(cacheServiceMock.getKeys).toHaveBeenCalledWith('sys_dict');
    });
  });

  describe('getValue', () => {
    it('should return cache value', async () => {
      const result = await controller.getValue(['test', 'key1'] as any);

      expect(result.code).toBe(200);
      expect(result.data.cacheValue).toBe('value1');
      expect(cacheServiceMock.getValue).toHaveBeenCalled();
    });
  });

  describe('clearCacheName', () => {
    it('should clear cache by name', async () => {
      const result = await controller.clearCacheName('sys_dict');

      expect(result.code).toBe(200);
      expect(cacheServiceMock.clearCacheName).toHaveBeenCalledWith('sys_dict');
    });
  });

  describe('clearCacheKey', () => {
    it('should clear cache by key', async () => {
      const result = await controller.clearCacheKey('sys_dict:key1');

      expect(result.code).toBe(200);
      expect(cacheServiceMock.clearCacheKey).toHaveBeenCalledWith('sys_dict:key1');
    });
  });

  describe('clearCacheAll', () => {
    it('should clear all cache', async () => {
      const result = await controller.clearCacheAll();

      expect(result.code).toBe(200);
      expect(cacheServiceMock.clearCacheAll).toHaveBeenCalled();
    });
  });
});
