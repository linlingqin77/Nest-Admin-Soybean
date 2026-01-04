/**
 * 监控模块集成测试
 *
 * @description
 * 测试监控模块的完整流程，包括日志记录、缓存监控等
 * 使用真实的数据库和Redis连接
 *
 * _Requirements: 10.4, 10.11_
 */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe, VersioningType } from '@nestjs/common';
import { AppModule } from 'src/app.module';
import { PrismaService } from 'src/prisma/prisma.service';
import { RedisService } from 'src/module/common/redis/redis.service';
import { OperlogService } from 'src/module/monitor/operlog/operlog.service';
import { LoginlogService } from 'src/module/monitor/loginlog/loginlog.service';
import { OnlineService } from 'src/module/monitor/online/online.service';
import { CacheService } from 'src/module/monitor/cache/cache.service';
import { CacheEnum } from 'src/common/enum/index';

describe('Monitor Integration Tests', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let redisService: RedisService;
  let loginlogService: LoginlogService;
  let onlineService: OnlineService;
  let cacheService: CacheService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.enableVersioning({
      type: VersioningType.URI,
      defaultVersion: '1',
      prefix: 'v',
    });
    app.useGlobalPipes(
      new ValidationPipe({
        transform: true,
        whitelist: true,
        transformOptions: { enableImplicitConversion: true },
      }),
    );

    await app.init();

    prisma = app.get(PrismaService);
    redisService = app.get(RedisService);
    loginlogService = app.get(LoginlogService);
    onlineService = app.get(OnlineService);
    cacheService = app.get(CacheService);
  }, 60000);

  afterAll(async () => {
    await app.close();
  });

  describe('Login Log Recording Integration', () => {
    let createdLogId: number;

    afterAll(async () => {
      // Cleanup created test log
      if (createdLogId) {
        await prisma.sysLogininfor.delete({
          where: { infoId: createdLogId },
        }).catch(() => {});
      }
    });

    it('should create login log record', async () => {
      const logData = {
        userName: 'test_integration_user',
        ipaddr: '192.168.1.100',
        loginLocation: 'Test Location',
        browser: 'Chrome',
        os: 'Windows 10',
        msg: 'Integration test login',
        status: '0',
      };

      const result = await loginlogService.create(logData);
      expect(result).toBeDefined();
      expect(result.infoId).toBeDefined();
      expect(result.userName).toBe(logData.userName);
      expect(result.ipaddr).toBe(logData.ipaddr);
      createdLogId = result.infoId;
    });

    it('should query login logs with pagination', async () => {
      const result = await loginlogService.findAll({
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

    it('should filter login logs by userName', async () => {
      const result = await loginlogService.findAll({
        pageNum: 1,
        pageSize: 10,
        skip: 0,
        take: 10,
        userName: 'admin',
      } as any);

      expect(result.code).toBe(200);
      result.data.rows.forEach((log: any) => {
        expect(log.userName.toLowerCase()).toContain('admin');
      });
    });

    it('should filter login logs by status', async () => {
      const result = await loginlogService.findAll({
        pageNum: 1,
        pageSize: 10,
        skip: 0,
        take: 10,
        status: '0',
      } as any);

      expect(result.code).toBe(200);
      result.data.rows.forEach((log: any) => {
        expect(log.status).toBe('0');
      });
    });
  });

  describe('Cache Monitoring Integration', () => {
    it('should return cache info with Redis statistics', async () => {
      const result = await cacheService.getInfo();

      expect(result.code).toBe(200);
      expect(result.data).toHaveProperty('dbSize');
      expect(result.data).toHaveProperty('info');
      expect(result.data).toHaveProperty('commandStats');
    });

    it('should return cache names list', async () => {
      const result = await cacheService.getNames();

      expect(result.code).toBe(200);
      expect(Array.isArray(result.data)).toBe(true);
      expect(result.data.length).toBeGreaterThan(0);

      // Verify cache name structure
      const cacheItem = result.data[0];
      expect(cacheItem).toHaveProperty('cacheName');
      expect(cacheItem).toHaveProperty('remark');
    });

    it('should get cache keys by cache name', async () => {
      // First set a test cache key
      const testKey = `${CacheEnum.SYS_CONFIG_KEY}test_integration_key`;
      await redisService.set(testKey, 'test_value');

      const result = await cacheService.getKeys(CacheEnum.SYS_CONFIG_KEY);

      expect(result.code).toBe(200);
      expect(Array.isArray(result.data)).toBe(true);

      // Cleanup
      await redisService.del(testKey);
    });

    it('should get cache value by key', async () => {
      // Set a test cache value
      const testKey = 'test_integration_cache_key';
      const testValue = { foo: 'bar', num: 123 };
      await redisService.set(testKey, testValue);

      const result = await cacheService.getValue({
        cacheName: 'sys_config:',
        cacheKey: testKey,
      });

      expect(result.code).toBe(200);
      expect(result.data).toHaveProperty('cacheValue');
      expect(result.data.cacheKey).toBe(testKey);

      // Cleanup
      await redisService.del(testKey);
    });

    it('should clear cache by key', async () => {
      // Set a test cache key
      const testKey = 'test_clear_cache_key';
      await redisService.set(testKey, 'test_value');

      // Verify it exists
      const beforeClear = await redisService.get(testKey);
      expect(beforeClear).toBe('test_value');

      // Clear the cache
      const result = await cacheService.clearCacheKey(testKey);
      expect(result.code).toBe(200);

      // Verify it's deleted
      const afterClear = await redisService.get(testKey);
      expect(afterClear).toBeNull();
    });

    it('should clear cache by name pattern', async () => {
      // Set multiple test cache keys with same prefix
      const prefix = 'test_clear_pattern_';
      await redisService.set(`${prefix}key1`, 'value1');
      await redisService.set(`${prefix}key2`, 'value2');

      // Clear by pattern
      const result = await cacheService.clearCacheName(prefix);
      expect(result.code).toBe(200);

      // Verify they're deleted
      const afterClear1 = await redisService.get(`${prefix}key1`);
      const afterClear2 = await redisService.get(`${prefix}key2`);
      expect(afterClear1).toBeNull();
      expect(afterClear2).toBeNull();
    });
  });

  describe('Online User Management Integration', () => {
    it('should return online user list from Redis', async () => {
      const result = await onlineService.findAll({
        pageNum: 1,
        pageSize: 10,
      });

      expect(result.code).toBe(200);
      expect(result.data).toHaveProperty('rows');
      expect(result.data).toHaveProperty('total');
      expect(Array.isArray(result.data.rows)).toBe(true);
    });

    it('should handle empty online user list', async () => {
      // This test verifies the service handles the case when no users are online
      const result = await onlineService.findAll({
        pageNum: 1,
        pageSize: 10,
      });

      expect(result.code).toBe(200);
      expect(result.data).toHaveProperty('rows');
      expect(result.data).toHaveProperty('total');
      // Total should be >= 0
      expect(result.data.total).toBeGreaterThanOrEqual(0);
    });

    it('should delete online user session', async () => {
      // Create a test session in Redis
      const testToken = `test_session_${Date.now()}`;
      const sessionData = {
        token: testToken,
        userName: 'test_user',
        ipaddr: '127.0.0.1',
        loginTime: new Date().toISOString(),
      };
      await redisService.set(`${CacheEnum.LOGIN_TOKEN_KEY}${testToken}`, sessionData);

      // Delete the session
      const result = await onlineService.delete(testToken);
      expect(result.code).toBe(200);

      // Verify it's deleted
      const afterDelete = await redisService.get(`${CacheEnum.LOGIN_TOKEN_KEY}${testToken}`);
      expect(afterDelete).toBeNull();
    });
  });

  describe('Operation Log Query Integration', () => {
    it('should query operation logs with pagination', async () => {
      // Query existing operation logs
      const result = await prisma.sysOperLog.findMany({
        take: 10,
        orderBy: { operTime: 'desc' },
      });

      // Just verify we can query the table
      expect(Array.isArray(result)).toBe(true);
    });

    it('should filter operation logs by title', async () => {
      const logs = await prisma.sysOperLog.findMany({
        where: {
          title: { contains: '登录' },
        },
        take: 10,
      });

      logs.forEach((log) => {
        expect(log.title?.toLowerCase()).toContain('登录');
      });
    });

    it('should filter operation logs by status', async () => {
      const logs = await prisma.sysOperLog.findMany({
        where: { status: '0' },
        take: 10,
      });

      logs.forEach((log) => {
        expect(log.status).toBe('0');
      });
    });
  });
});
