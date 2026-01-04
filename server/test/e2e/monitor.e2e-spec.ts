/**
 * 监控模块E2E测试
 *
 * @description
 * 测试监控相关的所有API端点
 * - GET /api/v1/monitor/online/list 在线用户列表
 * - DELETE /api/v1/monitor/online/:tokenId 强制下线
 * - GET /api/v1/monitor/operlog/list 操作日志列表
 * - GET /api/v1/monitor/operlog/:id 操作日志详情
 * - DELETE /api/v1/monitor/operlog/:ids 删除操作日志
 * - DELETE /api/v1/monitor/operlog/clean 清空操作日志
 * - GET /api/v1/monitor/logininfor/list 登录日志列表
 * - DELETE /api/v1/monitor/logininfor/:ids 删除登录日志
 * - GET /api/v1/monitor/logininfor/unlock/:userName 解锁用户
 * - GET /api/v1/monitor/server 服务器信息
 * - GET /api/v1/monitor/cache 缓存信息
 * - DELETE /api/v1/monitor/cache/clearCacheName/:name 清除缓存
 *
 * _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6, 10.7, 10.8, 10.9, 10.10, 10.11, 10.12_
 */

import { TestHelper } from '../helpers/test-helper';
import { PrismaService } from 'src/prisma/prisma.service';
import { RedisService } from 'src/module/common/redis/redis.service';
import { CacheEnum } from 'src/common/enum/index';

describe('Monitor E2E Tests', () => {
  let helper: TestHelper;
  let prisma: PrismaService;
  let redisService: RedisService;
  const apiPrefix = '/api/v1';
  let token: string;

  beforeAll(async () => {
    helper = new TestHelper();
    await helper.init();
    prisma = helper.getPrisma();
    redisService = helper.getApp().get(RedisService);
    token = await helper.login();
  }, 60000);

  afterAll(async () => {
    await helper.cleanup();
    await helper.close();
  });

  describe('GET /monitor/online/list - 在线用户列表', () => {
    it('should return online user list', async () => {
      const response = await helper
        .authGet(`${apiPrefix}/monitor/online/list`)
        .query({ pageNum: 1, pageSize: 10 })
        .expect(200);

      expect(response.body.code).toBe(200);
      expect(response.body.data).toHaveProperty('rows');
      expect(response.body.data).toHaveProperty('total');
      expect(Array.isArray(response.body.data.rows)).toBe(true);
    });

    it('should return online users with required fields', async () => {
      const response = await helper
        .authGet(`${apiPrefix}/monitor/online/list`)
        .query({ pageNum: 1, pageSize: 10 })
        .expect(200);

      if (response.body.data.rows.length > 0) {
        const user = response.body.data.rows[0];
        expect(user).toHaveProperty('tokenId');
        expect(user).toHaveProperty('userName');
      }
    });

    it('should fail without authentication', async () => {
      const response = await helper
        .getRequest()
        .get(`${apiPrefix}/monitor/online/list`)
        .query({ pageNum: 1, pageSize: 10 });

      expect([401, 403]).toContain(response.status);
    });
  });

  describe('DELETE /monitor/online/:token - 强制下线', () => {
    it('should force logout user by token', async () => {
      // Create a test session
      const testToken = `test_force_logout_${Date.now()}`;
      const sessionData = {
        token: testToken,
        userName: 'test_user',
        ipaddr: '127.0.0.1',
        loginTime: new Date().toISOString(),
      };
      await redisService.set(`${CacheEnum.LOGIN_TOKEN_KEY}${testToken}`, sessionData);

      const response = await helper
        .authDelete(`${apiPrefix}/monitor/online/${testToken}`)
        .expect(200);

      expect(response.body.code).toBe(200);

      // Verify session is deleted
      const afterDelete = await redisService.get(`${CacheEnum.LOGIN_TOKEN_KEY}${testToken}`);
      expect(afterDelete).toBeNull();
    });

    it('should handle non-existent token gracefully', async () => {
      const response = await helper
        .authDelete(`${apiPrefix}/monitor/online/non_existent_token_xyz`)
        .expect(200);

      expect(response.body.code).toBe(200);
    });
  });

  describe('GET /monitor/operlog/list - 操作日志列表', () => {
    it('should return operation log list', async () => {
      const response = await helper
        .authGet(`${apiPrefix}/monitor/operlog/list`)
        .query({ pageNum: 1, pageSize: 10 })
        .expect(200);

      expect(response.body.code).toBe(200);
      expect(response.body.data).toHaveProperty('rows');
      expect(response.body.data).toHaveProperty('total');
      expect(Array.isArray(response.body.data.rows)).toBe(true);
    });

    it('should filter operation logs by title', async () => {
      const response = await helper
        .authGet(`${apiPrefix}/monitor/operlog/list`)
        .query({ pageNum: 1, pageSize: 10, title: '登录' })
        .expect(200);

      expect(response.body.code).toBe(200);
    });

    it('should filter operation logs by operName', async () => {
      const response = await helper
        .authGet(`${apiPrefix}/monitor/operlog/list`)
        .query({ pageNum: 1, pageSize: 10, operName: 'admin' })
        .expect(200);

      expect(response.body.code).toBe(200);
    });

    it('should filter operation logs by status', async () => {
      const response = await helper
        .authGet(`${apiPrefix}/monitor/operlog/list`)
        .query({ pageNum: 1, pageSize: 10, status: '0' })
        .expect(200);

      expect(response.body.code).toBe(200);
      response.body.data.rows.forEach((log: any) => {
        expect(log.status).toBe('0');
      });
    });
  });

  describe('GET /monitor/operlog/:operId - 操作日志详情', () => {
    it('should return operation log detail', async () => {
      // First get a log ID
      const listResponse = await helper
        .authGet(`${apiPrefix}/monitor/operlog/list`)
        .query({ pageNum: 1, pageSize: 1 })
        .expect(200);

      if (listResponse.body.data.rows.length > 0) {
        const operId = listResponse.body.data.rows[0].operId;

        const response = await helper
          .authGet(`${apiPrefix}/monitor/operlog/${operId}`)
          .expect(200);

        expect(response.body.code).toBe(200);
        expect(response.body.data).toHaveProperty('operId');
        expect(response.body.data.operId).toBe(operId);
      }
    });

    it('should return null for non-existent log', async () => {
      const response = await helper
        .authGet(`${apiPrefix}/monitor/operlog/999999999`)
        .expect(200);

      expect(response.body.code).toBe(200);
      expect(response.body.data).toBeNull();
    });
  });

  describe('DELETE /monitor/operlog/:operId - 删除操作日志', () => {
    let testLogId: number;

    beforeAll(async () => {
      // Create a test operation log
      const log = await prisma.sysOperLog.create({
        data: {
          title: 'E2E Test Log',
          method: 'TestController.testMethod',
          operName: 'e2e_test',
          deptName: 'Test Dept',
          operUrl: '/api/v1/test',
          requestMethod: 'GET',
          operIp: '127.0.0.1',
          operLocation: 'Test',
          operParam: '{}',
          jsonResult: '{}',
          errorMsg: '',
          status: '0',
          operTime: new Date(),
          costTime: 10,
          businessType: 0,
          operatorType: 1,
        },
      });
      testLogId = log.operId;
    });

    it('should delete operation log by id', async () => {
      const response = await helper
        .authDelete(`${apiPrefix}/monitor/operlog/${testLogId}`)
        .expect(200);

      expect(response.body.code).toBe(200);

      // Verify deletion
      const deleted = await prisma.sysOperLog.findUnique({
        where: { operId: testLogId },
      });
      expect(deleted).toBeNull();
    });
  });

  describe('DELETE /monitor/operlog/clean - 清空操作日志', () => {
    it('should clean all operation logs', async () => {
      // Create a test log first
      await prisma.sysOperLog.create({
        data: {
          title: 'E2E Clean Test Log',
          method: 'TestController.cleanTest',
          operName: 'e2e_clean_test',
          deptName: 'Test Dept',
          operUrl: '/api/v1/clean-test',
          requestMethod: 'DELETE',
          operIp: '127.0.0.1',
          operLocation: 'Test',
          operParam: '{}',
          jsonResult: '{}',
          errorMsg: '',
          status: '0',
          operTime: new Date(),
          costTime: 5,
          businessType: 0,
          operatorType: 1,
        },
      });

      const response = await helper
        .authDelete(`${apiPrefix}/monitor/operlog/clean`)
        .expect(200);

      expect(response.body.code).toBe(200);

      // Verify all logs are deleted
      const count = await prisma.sysOperLog.count();
      expect(count).toBe(0);
    });
  });


  describe('GET /monitor/logininfor/list - 登录日志列表', () => {
    it('should return login log list', async () => {
      const response = await helper
        .authGet(`${apiPrefix}/monitor/logininfor/list`)
        .query({ pageNum: 1, pageSize: 10 })
        .expect(200);

      expect(response.body.code).toBe(200);
      expect(response.body.data).toHaveProperty('rows');
      expect(response.body.data).toHaveProperty('total');
      expect(Array.isArray(response.body.data.rows)).toBe(true);
    });

    it('should filter login logs by userName', async () => {
      const response = await helper
        .authGet(`${apiPrefix}/monitor/logininfor/list`)
        .query({ pageNum: 1, pageSize: 10, userName: 'admin' })
        .expect(200);

      expect(response.body.code).toBe(200);
    });

    it('should filter login logs by status', async () => {
      const response = await helper
        .authGet(`${apiPrefix}/monitor/logininfor/list`)
        .query({ pageNum: 1, pageSize: 10, status: '0' })
        .expect(200);

      expect(response.body.code).toBe(200);
      response.body.data.rows.forEach((log: any) => {
        expect(log.status).toBe('0');
      });
    });

    it('should filter login logs by ipaddr', async () => {
      const response = await helper
        .authGet(`${apiPrefix}/monitor/logininfor/list`)
        .query({ pageNum: 1, pageSize: 10, ipaddr: '127' })
        .expect(200);

      expect(response.body.code).toBe(200);
    });
  });

  describe('DELETE /monitor/logininfor/:ids - 删除登录日志', () => {
    let testLogId: number;

    beforeAll(async () => {
      // Create a test login log
      const log = await prisma.sysLogininfor.create({
        data: {
          userName: 'e2e_test_user',
          ipaddr: '192.168.1.100',
          loginLocation: 'E2E Test',
          browser: 'Jest',
          os: 'Test OS',
          msg: 'E2E test login log',
          status: '0',
          delFlag: '0',
        },
      });
      testLogId = log.infoId;
    });

    it('should delete login log by id', async () => {
      const response = await helper
        .authDelete(`${apiPrefix}/monitor/logininfor/${testLogId}`)
        .expect(200);

      expect(response.body.code).toBe(200);

      // Verify soft deletion
      const deleted = await prisma.sysLogininfor.findUnique({
        where: { infoId: testLogId },
      });
      expect(deleted?.delFlag).toBe('1');
    });

    it('should delete multiple login logs', async () => {
      // Create multiple test logs
      const log1 = await prisma.sysLogininfor.create({
        data: {
          userName: 'e2e_multi_test_1',
          ipaddr: '192.168.1.101',
          loginLocation: 'E2E Test',
          browser: 'Jest',
          os: 'Test OS',
          msg: 'E2E test login log 1',
          status: '0',
          delFlag: '0',
        },
      });
      const log2 = await prisma.sysLogininfor.create({
        data: {
          userName: 'e2e_multi_test_2',
          ipaddr: '192.168.1.102',
          loginLocation: 'E2E Test',
          browser: 'Jest',
          os: 'Test OS',
          msg: 'E2E test login log 2',
          status: '0',
          delFlag: '0',
        },
      });

      const response = await helper
        .authDelete(`${apiPrefix}/monitor/logininfor/${log1.infoId},${log2.infoId}`)
        .expect(200);

      expect(response.body.code).toBe(200);
    });
  });

  describe('GET /monitor/logininfor/unlock/:username - 解锁用户', () => {
    it('should unlock user by username', async () => {
      const response = await helper
        .authGet(`${apiPrefix}/monitor/logininfor/unlock/test_locked_user`)
        .expect(200);

      expect(response.body.code).toBe(200);
    });
  });

  describe('GET /monitor/server - 服务器信息', () => {
    it('should return server info', async () => {
      const response = await helper
        .authGet(`${apiPrefix}/monitor/server`)
        .expect(200);

      expect(response.body.code).toBe(200);
      expect(response.body.data).toHaveProperty('cpu');
      expect(response.body.data).toHaveProperty('mem');
      expect(response.body.data).toHaveProperty('sys');
      expect(response.body.data).toHaveProperty('sysFiles');
    });

    it('should return CPU info with required fields', async () => {
      const response = await helper
        .authGet(`${apiPrefix}/monitor/server`)
        .expect(200);

      const cpu = response.body.data.cpu;
      expect(cpu).toHaveProperty('cpuNum');
      expect(cpu).toHaveProperty('used');
      expect(cpu).toHaveProperty('free');
    });

    it('should return memory info with required fields', async () => {
      const response = await helper
        .authGet(`${apiPrefix}/monitor/server`)
        .expect(200);

      const mem = response.body.data.mem;
      expect(mem).toHaveProperty('total');
      expect(mem).toHaveProperty('used');
      expect(mem).toHaveProperty('free');
      expect(mem).toHaveProperty('usage');
    });

    it('should return system info with required fields', async () => {
      const response = await helper
        .authGet(`${apiPrefix}/monitor/server`)
        .expect(200);

      const sys = response.body.data.sys;
      expect(sys).toHaveProperty('computerName');
      expect(sys).toHaveProperty('osName');
      expect(sys).toHaveProperty('osArch');
    });

    it('should return disk info as array', async () => {
      const response = await helper
        .authGet(`${apiPrefix}/monitor/server`)
        .expect(200);

      expect(Array.isArray(response.body.data.sysFiles)).toBe(true);
      if (response.body.data.sysFiles.length > 0) {
        const disk = response.body.data.sysFiles[0];
        expect(disk).toHaveProperty('dirName');
        expect(disk).toHaveProperty('total');
        expect(disk).toHaveProperty('used');
        expect(disk).toHaveProperty('free');
      }
    });
  });

  describe('GET /monitor/cache - 缓存信息', () => {
    it('should return cache info', async () => {
      const response = await helper
        .authGet(`${apiPrefix}/monitor/cache`)
        .expect(200);

      expect(response.body.code).toBe(200);
      expect(response.body.data).toHaveProperty('dbSize');
      expect(response.body.data).toHaveProperty('info');
      expect(response.body.data).toHaveProperty('commandStats');
    });

    it('should return Redis info object', async () => {
      const response = await helper
        .authGet(`${apiPrefix}/monitor/cache`)
        .expect(200);

      expect(response.body.data.info).toBeDefined();
    });

    it('should return command stats', async () => {
      const response = await helper
        .authGet(`${apiPrefix}/monitor/cache`)
        .expect(200);

      expect(response.body.data.commandStats).toBeDefined();
    });
  });

  describe('GET /monitor/cache/getNames - 缓存名称列表', () => {
    it('should return cache names list', async () => {
      const response = await helper
        .authGet(`${apiPrefix}/monitor/cache/getNames`)
        .expect(200);

      expect(response.body.code).toBe(200);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
    });

    it('should return cache names with required fields', async () => {
      const response = await helper
        .authGet(`${apiPrefix}/monitor/cache/getNames`)
        .expect(200);

      const cacheItem = response.body.data[0];
      expect(cacheItem).toHaveProperty('cacheName');
      expect(cacheItem).toHaveProperty('remark');
    });
  });

  describe('GET /monitor/cache/getKeys/:id - 缓存键名列表', () => {
    it('should return cache keys by name', async () => {
      const response = await helper
        .authGet(`${apiPrefix}/monitor/cache/getKeys/sys_config:`)
        .expect(200);

      expect(response.body.code).toBe(200);
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  describe('DELETE /monitor/cache/clearCacheName/:cacheName - 清除缓存', () => {
    it('should clear cache by name', async () => {
      // Set test cache keys
      const prefix = 'e2e_test_cache_';
      await redisService.set(`${prefix}key1`, 'value1');
      await redisService.set(`${prefix}key2`, 'value2');

      const response = await helper
        .authDelete(`${apiPrefix}/monitor/cache/clearCacheName/${prefix}`)
        .expect(200);

      expect(response.body.code).toBe(200);

      // Verify deletion
      const afterClear1 = await redisService.get(`${prefix}key1`);
      const afterClear2 = await redisService.get(`${prefix}key2`);
      expect(afterClear1).toBeNull();
      expect(afterClear2).toBeNull();
    });
  });

  describe('DELETE /monitor/cache/clearCacheKey/:cacheKey - 清除缓存键', () => {
    it('should clear cache by key', async () => {
      // Set test cache key
      const testKey = 'e2e_test_single_cache_key';
      await redisService.set(testKey, 'test_value');

      const response = await helper
        .authDelete(`${apiPrefix}/monitor/cache/clearCacheKey/${testKey}`)
        .expect(200);

      expect(response.body.code).toBe(200);

      // Verify deletion
      const afterClear = await redisService.get(testKey);
      expect(afterClear).toBeNull();
    });
  });

  describe('Authentication and Authorization', () => {
    it('should require authentication for online list', async () => {
      const response = await helper
        .getRequest()
        .get(`${apiPrefix}/monitor/online/list`);

      expect([401, 403]).toContain(response.status);
    });

    it('should require authentication for operlog list', async () => {
      const response = await helper
        .getRequest()
        .get(`${apiPrefix}/monitor/operlog/list`);

      expect([401, 403]).toContain(response.status);
    });

    it('should require authentication for logininfor list', async () => {
      const response = await helper
        .getRequest()
        .get(`${apiPrefix}/monitor/logininfor/list`);

      expect([401, 403]).toContain(response.status);
    });

    it('should require authentication for server info', async () => {
      const response = await helper
        .getRequest()
        .get(`${apiPrefix}/monitor/server`);

      expect([401, 403]).toContain(response.status);
    });

    it('should require authentication for cache info', async () => {
      const response = await helper
        .getRequest()
        .get(`${apiPrefix}/monitor/cache`);

      expect([401, 403]).toContain(response.status);
    });
  });
});
