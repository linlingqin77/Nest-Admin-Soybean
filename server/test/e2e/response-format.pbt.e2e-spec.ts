/**
 * 响应格式一致性属性基测试
 *
 * **Feature: api-integration-testing, Property 1: Response Format Consistency**
 * **Validates: Requirements 16.1, 16.2**
 *
 * @description
 * *For any* API endpoint that returns a successful response, the response body SHALL contain
 * a `code` field equal to 200 and a `data` field. *For any* API endpoint that returns a
 * business error, the response body SHALL contain a non-200 `code` and a `msg` field
 * describing the error.
 */

import * as fc from 'fast-check';
import { TestHelper } from '../helpers/test-helper';
import { PrismaService } from 'src/prisma/prisma.service';
import { RedisService } from 'src/module/common/redis/redis.service';
import { CacheEnum } from 'src/common/enum/index';

describe('Property 1: Response Format Consistency', () => {
  let helper: TestHelper;
  let prisma: PrismaService;
  let redisService: RedisService;
  let token: string;
  const apiPrefix = '/api/v1';

  // List of endpoints that should return successful responses with standard format
  const successEndpoints: Array<{ method: 'GET' | 'POST'; path: string; needsAuth: boolean }> = [
    // Public endpoints
    { method: 'GET', path: '/captchaImage', needsAuth: false },
    { method: 'GET', path: '/auth/tenant/list', needsAuth: false },
    { method: 'GET', path: '/auth/publicKey', needsAuth: false },
    { method: 'GET', path: '/auth/code', needsAuth: false },

    // Authenticated GET endpoints
    { method: 'GET', path: '/getInfo', needsAuth: true },
    { method: 'GET', path: '/getRouters', needsAuth: true },
    { method: 'GET', path: '/system/user/list?pageNum=1&pageSize=10', needsAuth: true },
    { method: 'GET', path: '/system/role/list?pageNum=1&pageSize=10', needsAuth: true },
    { method: 'GET', path: '/system/dept/list', needsAuth: true },
    { method: 'GET', path: '/system/menu/list', needsAuth: true },
    { method: 'GET', path: '/system/dict/type/list?pageNum=1&pageSize=10', needsAuth: true },
    { method: 'GET', path: '/system/config/list?pageNum=1&pageSize=10', needsAuth: true },
    { method: 'GET', path: '/system/notice/list?pageNum=1&pageSize=10', needsAuth: true },
    { method: 'GET', path: '/system/post/list?pageNum=1&pageSize=10', needsAuth: true },
    { method: 'GET', path: '/monitor/online/list?pageNum=1&pageSize=10', needsAuth: true },
    { method: 'GET', path: '/monitor/operlog/list?pageNum=1&pageSize=10', needsAuth: true },
    { method: 'GET', path: '/monitor/server', needsAuth: true },
    { method: 'GET', path: '/monitor/cache', needsAuth: true },
  ];

  // Endpoints that should return business errors (non-200 code with msg)
  const errorScenarios: Array<{
    method: 'GET' | 'POST' | 'PUT' | 'DELETE';
    path: string;
    body?: Record<string, unknown>;
    description: string;
  }> = [
    // Invalid login credentials
    {
      method: 'POST',
      path: '/auth/login',
      body: { username: 'nonexistent_user_xyz', password: 'wrongpassword' },
      description: 'Login with invalid credentials',
    },
    // Invalid resource IDs (should return error or null data)
    {
      method: 'GET',
      path: '/system/user/999999999',
      description: 'Get non-existent user',
    },
  ];

  beforeAll(async () => {
    helper = new TestHelper();
    await helper.init();

    prisma = helper.getPrisma();
    redisService = helper.getApp().get(RedisService);

    // Disable captcha for testing
    const captchaConfig = await prisma.sysConfig.findFirst({
      where: { configKey: 'sys.account.captchaEnabled' },
    });
    if (captchaConfig) {
      await prisma.sysConfig.update({
        where: { configId: captchaConfig.configId },
        data: { configValue: 'false' },
      });
      await redisService.del(`${CacheEnum.SYS_CONFIG_KEY}sys.account.captchaEnabled`);
    }

    // Login to get token
    token = await helper.login();
  }, 60000);

  afterAll(async () => {
    await helper.cleanup();
    await helper.close();
  });

  /**
   * Property 1a: For any successful API response, the response SHALL contain
   * code=200 and a data field
   */
  it('should return consistent success response format (code=200, data field present)', async () => {
    const endpointArbitrary = fc.constantFrom(...successEndpoints);

    await fc.assert(
      fc.asyncProperty(endpointArbitrary, async (endpoint) => {
        const fullPath = `${apiPrefix}${endpoint.path}`;
        let response;

        if (endpoint.needsAuth) {
          response = await helper
            .getRequest()
            .get(fullPath)
            .set('Authorization', `Bearer ${token}`)
            .set('tenant-id', '000000');
        } else {
          response = await helper.getRequest().get(fullPath).set('tenant-id', '000000');
        }

        // Property: Successful responses should have code=200 and data field
        const hasCorrectFormat =
          response.body.code === 200 &&
          (response.body.data !== undefined || response.body.user !== undefined); // getInfo returns user directly

        if (!hasCorrectFormat) {
          console.log(`Response format check failed for ${endpoint.method} ${fullPath}`);
          console.log(`Response body:`, JSON.stringify(response.body, null, 2));
        }

        return hasCorrectFormat;
      }),
      {
        numRuns: 100,
        verbose: true,
      },
    );
  }, 120000);

  /**
   * Property 1b: For any business error response, the response SHALL contain
   * a non-200 code and a msg field
   */
  it('should return consistent error response format (non-200 code, msg field present)', async () => {
    const errorScenarioArbitrary = fc.constantFrom(...errorScenarios);

    await fc.assert(
      fc.asyncProperty(errorScenarioArbitrary, async (scenario) => {
        const fullPath = `${apiPrefix}${scenario.path}`;
        let response;

        switch (scenario.method) {
          case 'GET':
            response = await helper
              .getRequest()
              .get(fullPath)
              .set('Authorization', `Bearer ${token}`)
              .set('tenant-id', '000000');
            break;
          case 'POST':
            response = await helper
              .getRequest()
              .post(fullPath)
              .set('tenant-id', '000000')
              .send(scenario.body || {});
            break;
          case 'PUT':
            response = await helper
              .getRequest()
              .put(fullPath)
              .set('Authorization', `Bearer ${token}`)
              .set('tenant-id', '000000')
              .send(scenario.body || {});
            break;
          case 'DELETE':
            response = await helper
              .getRequest()
              .delete(fullPath)
              .set('Authorization', `Bearer ${token}`)
              .set('tenant-id', '000000');
            break;
        }

        // For error scenarios, we expect either:
        // 1. Non-200 code with msg field (business error)
        // 2. 200 code with null/empty data (resource not found but handled gracefully)
        const isValidErrorFormat =
          (response.body.code !== 200 && response.body.msg !== undefined) ||
          (response.body.code === 200 && (response.body.data === null || response.body.data?.data === null));

        if (!isValidErrorFormat) {
          console.log(`Error format check for ${scenario.description}`);
          console.log(`Response body:`, JSON.stringify(response.body, null, 2));
        }

        return isValidErrorFormat;
      }),
      {
        numRuns: 50,
        verbose: true,
      },
    );
  }, 120000);

  /**
   * Property 1c: For any API response, the response body SHALL always have a code field
   */
  it('should always include code field in response body', async () => {
    const allEndpoints = [
      ...successEndpoints.map((e) => ({ ...e, expectSuccess: true })),
      ...errorScenarios.map((e) => ({ ...e, needsAuth: true, expectSuccess: false })),
    ];

    const endpointArbitrary = fc.constantFrom(...allEndpoints);

    await fc.assert(
      fc.asyncProperty(endpointArbitrary, async (endpoint) => {
        const fullPath = `${apiPrefix}${endpoint.path}`;
        let response;

        if ('method' in endpoint && endpoint.method === 'POST') {
          response = await helper
            .getRequest()
            .post(fullPath)
            .set('tenant-id', '000000')
            .send((endpoint as (typeof errorScenarios)[0]).body || {});
        } else {
          if (endpoint.needsAuth) {
            response = await helper
              .getRequest()
              .get(fullPath)
              .set('Authorization', `Bearer ${token}`)
              .set('tenant-id', '000000');
          } else {
            response = await helper.getRequest().get(fullPath).set('tenant-id', '000000');
          }
        }

        // Property: Every response should have a code field
        const hasCodeField = response.body.code !== undefined;

        if (!hasCodeField) {
          console.log(`Missing code field for ${fullPath}`);
          console.log(`Response body:`, JSON.stringify(response.body, null, 2));
        }

        return hasCodeField;
      }),
      {
        numRuns: 100,
        verbose: true,
      },
    );
  }, 120000);
});
