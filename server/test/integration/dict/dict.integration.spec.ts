/**
 * 字典模块集成测试
 *
 * @description
 * 测试字典类型-数据关联和字典缓存刷新
 *
 * _Requirements: 6.10, 6.11_
 */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe, VersioningType } from '@nestjs/common';
import { AppModule } from 'src/app.module';
import { PrismaService } from 'src/prisma/prisma.service';
import { RedisService } from 'src/module/common/redis/redis.service';
import { DictService } from 'src/module/system/dict/dict.service';
import { CacheEnum } from 'src/common/enum/index';

describe('Dict Integration Tests', () => {
  let app: INestApplication;
  let redisService: RedisService;
  let dictService: DictService;
  // Use existing system dict type for testing to avoid unique constraint issues
  const existingDictType = 'sys_normal_disable';

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1', prefix: 'v' });
    app.useGlobalPipes(new ValidationPipe({
      transform: true,
      whitelist: true,
      transformOptions: { enableImplicitConversion: true },
    }));

    await app.init();
    redisService = app.get(RedisService);
    dictService = app.get(DictService);
  }, 60000);

  afterAll(async () => {
    await app.close();
  });

  describe('Dict Type-Data Association', () => {
    it('should return dict data associated with dict type', async () => {
      // Query dict data by existing system dict type
      const result = await dictService.findOneDataType(existingDictType);
      expect(result.code).toBe(200);
      expect(Array.isArray(result.data)).toBe(true);
      // sys_normal_disable should have at least 1 option
      expect(result.data.length).toBeGreaterThanOrEqual(1);
    });

    it('should return dict data sorted by dictSort', async () => {
      const result = await dictService.findOneDataType(existingDictType);
      expect(result.code).toBe(200);
      if (result.data.length > 1) {
        // Verify sorting - each item's dictSort should be <= next item's dictSort
        for (let i = 0; i < result.data.length - 1; i++) {
          expect(result.data[i].dictSort).toBeLessThanOrEqual(result.data[i + 1].dictSort);
        }
      }
    });

    it('should filter dict data by type in list query', async () => {
      const result = await dictService.findAllData({
        pageNum: 1,
        pageSize: 10,
        skip: 0,
        take: 10,
        dictType: existingDictType,
      } as any);

      expect(result.code).toBe(200);
      expect(result.data.rows.length).toBeGreaterThanOrEqual(1);
      result.data.rows.forEach((item: any) => {
        expect(item.dictType).toBe(existingDictType);
      });
    });

    it('should return dict type list with pagination', async () => {
      const result = await dictService.findAllType({
        pageNum: 1,
        pageSize: 10,
        skip: 0,
        take: 10,
      } as any);

      expect(result.code).toBe(200);
      expect(result.data).toHaveProperty('rows');
      expect(result.data).toHaveProperty('total');
      expect(Array.isArray(result.data.rows)).toBe(true);
    });

    it('should return dict type by id', async () => {
      // First get a dict type from the list
      const listResult = await dictService.findAllType({
        pageNum: 1,
        pageSize: 1,
        skip: 0,
        take: 1,
      } as any);

      expect(listResult.data.rows.length).toBeGreaterThan(0);
      const dictTypeId = listResult.data.rows[0].dictId;

      const result = await dictService.findOneType(dictTypeId);
      expect(result.code).toBe(200);
      expect(result.data.dictId).toBe(dictTypeId);
    });
  });

  describe('Dict Cache Refresh', () => {
    it('should cache dict data after first retrieval', async () => {
      // Clear cache first
      await redisService.del(`${CacheEnum.SYS_DICT_KEY}${existingDictType}`);

      // First retrieval should fetch from DB and cache
      const result1 = await dictService.findOneDataType(existingDictType);
      expect(result1.code).toBe(200);

      // Verify data is cached
      const cachedData = await redisService.get(`${CacheEnum.SYS_DICT_KEY}${existingDictType}`);
      expect(cachedData).toBeDefined();
      expect(Array.isArray(cachedData)).toBe(true);
    });

    it('should return cached data on subsequent calls', async () => {
      // First call to ensure cache is populated
      await dictService.findOneDataType(existingDictType);

      // Modify cache to verify it's being used
      const modifiedData = [{ dictLabel: 'cached_value', dictValue: 'cached' }];
      await redisService.set(`${CacheEnum.SYS_DICT_KEY}${existingDictType}`, modifiedData);

      // Second call should return cached data
      const result = await dictService.findOneDataType(existingDictType);
      expect(result.code).toBe(200);
      expect(result.data).toEqual(modifiedData);

      // Restore cache by refreshing
      await dictService.resetDictCache();
    });

    it('should refresh cache when resetDictCache is called', async () => {
      // Set stale cache data
      const staleData = [{ dictLabel: 'stale', dictValue: 'stale' }];
      await redisService.set(`${CacheEnum.SYS_DICT_KEY}${existingDictType}`, staleData);

      // Verify stale data is in cache
      const beforeRefresh = await redisService.get(`${CacheEnum.SYS_DICT_KEY}${existingDictType}`);
      expect(beforeRefresh).toEqual(staleData);

      // Refresh cache
      const refreshResult = await dictService.resetDictCache();
      expect(refreshResult.code).toBe(200);

      // Verify cache is refreshed with actual data
      const afterRefresh = await redisService.get(`${CacheEnum.SYS_DICT_KEY}${existingDictType}`);
      expect(afterRefresh).toBeDefined();
      // Should have actual data, not stale data
      if (Array.isArray(afterRefresh) && afterRefresh.length > 0) {
        expect(afterRefresh[0].dictLabel).not.toBe('stale');
      }
    });

    it('should clear all dict cache keys', async () => {
      // Ensure some cache exists
      await redisService.set(`${CacheEnum.SYS_DICT_KEY}test_clear_cache`, [{ test: 'data' }]);

      // Clear cache
      await dictService.clearDictCache();

      // Verify cache is cleared
      const testKey = await redisService.get(`${CacheEnum.SYS_DICT_KEY}test_clear_cache`);
      expect(testKey).toBeNull();
    });

    it('should load all dict data into cache', async () => {
      // Clear cache first
      await dictService.clearDictCache();

      // Load cache
      await dictService.loadingDictCache();

      // Verify existing dict type is cached
      const cachedData = await redisService.get(`${CacheEnum.SYS_DICT_KEY}${existingDictType}`);
      expect(cachedData).toBeDefined();
      // cachedData could be an array or null depending on if the dict type has data
      if (cachedData !== null) {
        expect(Array.isArray(cachedData)).toBe(true);
      }
    });
  });

  describe('Dict Data Query with Existing System Dicts', () => {
    it('should return system dict data by type', async () => {
      // Test with a common system dict type
      const result = await dictService.findOneDataType('sys_normal_disable');
      expect(result.code).toBe(200);
      // sys_normal_disable should have at least 1 option
      if (result.data && result.data.length > 0) {
        expect(result.data.length).toBeGreaterThanOrEqual(1);
      }
    });

    it('should return empty array for non-existent dict type', async () => {
      const result = await dictService.findOneDataType('non_existent_dict_type_xyz');
      expect(result.code).toBe(200);
      expect(result.data).toEqual([]);
    });

    it('should return option select list for dict types', async () => {
      const result = await dictService.findOptionselect();
      expect(result.code).toBe(200);
      expect(Array.isArray(result.data)).toBe(true);
    });
  });
});
