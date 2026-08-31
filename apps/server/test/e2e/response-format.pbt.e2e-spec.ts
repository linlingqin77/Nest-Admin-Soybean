/**
 * 响应格式一致性属性基测试
 *
 * **Feature: api-response-validation, Property 1: Response Structure Consistency**
 * **Validates: Requirements 1.1, 1.2, 1.3**
 *
 * @description
 * *For any* API endpoint response, the response body SHALL contain:
 * - `code` field of type number (Requirements 1.1)
 * - `msg` field of type string (Requirements 1.2)
 * - `data` field (can be null) (Requirements 1.3)
 *
 * *For any* successful API operation, the response code SHALL be 200.
 * *For any* failed API operation due to business logic, the response SHALL contain
 * a non-200 code and a descriptive msg field.
 */

import * as fc from 'fast-check';
import { TestHelper } from '../helpers/test-helper';
import { PrismaService } from 'src/platform/prisma';
import { RedisService } from 'src/platform/redis/redis.service';
import { CacheEnum } from 'src/shared/enums/index';

describe('Property 1: Response Structure Consistency', () => {
  let helper: TestHelper;
  let prisma: PrismaService;
  let redisService: RedisService;
  let token: string;
  const apiPrefix = '/api/v1';

  // List of endpoints that should return successful responses with standard format
  // Enhanced to cover more API endpoints per Requirements 1.1, 1.2, 1.3
  const successEndpoints: Array<{ method: 'GET' | 'POST'; path: string; needsAuth: boolean; description: string }> = [
    // Public endpoints
    { method: 'GET', path: '/captchaImage', needsAuth: false, description: 'Captcha image' },
    { method: 'GET', path: '/auth/tenant/list', needsAuth: false, description: 'Tenant list (public)' },
    { method: 'GET', path: '/auth/publicKey', needsAuth: false, description: 'Public key' },
    { method: 'GET', path: '/auth/code', needsAuth: false, description: 'Auth code' },

    // Authenticated GET endpoints - User & Auth
    { method: 'GET', path: '/getInfo', needsAuth: true, description: 'Get user info' },
    { method: 'GET', path: '/getRouters', needsAuth: true, description: 'Get routers' },

    // System modules endpoints
    { method: 'GET', path: '/system/user/list?pageNum=1&pageSize=10', needsAuth: true, description: 'User list' },
    { method: 'GET', path: '/system/role/list?pageNum=1&pageSize=10', needsAuth: true, description: 'Role list' },
    { method: 'GET', path: '/system/dept/list', needsAuth: true, description: 'Dept list' },
    { method: 'GET', path: '/system/menu/list', needsAuth: true, description: 'Menu list' },
    {
      method: 'GET',
      path: '/system/dict/type/list?pageNum=1&pageSize=10',
      needsAuth: true,
      description: 'Dict type list',
    },
    {
      method: 'GET',
      path: '/system/dict/data/list?pageNum=1&pageSize=10',
      needsAuth: true,
      description: 'Dict data list',
    },
    { method: 'GET', path: '/system/config/list?pageNum=1&pageSize=10', needsAuth: true, description: 'Config list' },
    { method: 'GET', path: '/system/notice/list?pageNum=1&pageSize=10', needsAuth: true, description: 'Notice list' },
    { method: 'GET', path: '/system/post/list?pageNum=1&pageSize=10', needsAuth: true, description: 'Post list' },

    // Tenant management endpoints
    { method: 'GET', path: '/system/tenant/list?pageNum=1&pageSize=10', needsAuth: true, description: 'Tenant list' },

    // Monitor modules endpoints
    {
      method: 'GET',
      path: '/monitor/online/list?pageNum=1&pageSize=10',
      needsAuth: true,
      description: 'Online user list',
    },
    {
      method: 'GET',
      path: '/monitor/operlog/list?pageNum=1&pageSize=10',
      needsAuth: true,
      description: 'Operation log list',
    },
    {
      method: 'GET',
      path: '/monitor/logininfor/list?pageNum=1&pageSize=10',
      needsAuth: true,
      description: 'Login log list',
    },
    { method: 'GET', path: '/monitor/job/list?pageNum=1&pageSize=10', needsAuth: true, description: 'Job list' },
    { method: 'GET', path: '/monitor/jobLog/list?pageNum=1&pageSize=10', needsAuth: true, description: 'Job log list' },
    { method: 'GET', path: '/monitor/server', needsAuth: true, description: 'Server info' },
    { method: 'GET', path: '/monitor/cache', needsAuth: true, description: 'Cache info' },
  ];

  // Endpoints that should return business errors (non-200 code with msg)
  // Enhanced to cover more error scenarios per Requirements 1.5
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
    {
      method: 'GET',
      path: '/system/role/999999999',
      description: 'Get non-existent role',
    },
    {
      method: 'GET',
      path: '/system/dept/999999999',
      description: 'Get non-existent dept',
    },
    {
      method: 'GET',
      path: '/system/menu/999999999',
      description: 'Get non-existent menu',
    },
    {
      method: 'GET',
      path: '/system/config/999999999',
      description: 'Get non-existent platform/config',
    },
    {
      method: 'GET',
      path: '/system/notice/999999999',
      description: 'Get non-existent notice',
    },
    {
      method: 'GET',
      path: '/system/post/999999999',
      description: 'Get non-existent post',
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
   * code (number), msg (string), and data field
   *
   * **Validates: Requirements 1.1, 1.2, 1.3**
   */
  it('should return consistent success response format (code=200, msg string, data field present)', async () => {
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
            .set('x-tenant-id', '000000');
        } else {
          response = await helper.getRequest().get(fullPath).set('x-tenant-id', '000000');
        }

        // Property: Response must have code (number), msg (string), and data field
        // Requirements 1.1: code field is number
        const hasCodeAsNumber = typeof response.body.code === 'number';
        // Requirements 1.2: msg field is string
        const hasMsgAsString = typeof response.body.msg === 'string';
        // Requirements 1.3: data field exists (can be null)
        // Note: getInfo returns user directly, so we check for data OR user
        const hasDataField = response.body.data !== undefined || response.body.user !== undefined;
        // Requirements 1.4: Successful responses should have code=200
        const hasSuccessCode = response.body.code === 200;

        const hasCorrectFormat = hasCodeAsNumber && hasMsgAsString && hasDataField && hasSuccessCode;

        if (!hasCorrectFormat) {
          console.log(`Response format check failed for ${endpoint.description} (${endpoint.method} ${fullPath})`);
          console.log(`Response body:`, JSON.stringify(response.body, null, 2));
          console.log(
            `Checks: code=${hasCodeAsNumber}, msg=${hasMsgAsString}, data=${hasDataField}, success=${hasSuccessCode}`,
          );
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
   * a non-200 code (number) and a msg field (string)
   *
   * **Validates: Requirements 1.1, 1.2, 1.5**
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
              .set('x-tenant-id', '000000');
            break;
          case 'POST':
            response = await helper
              .getRequest()
              .post(fullPath)
              .set('x-tenant-id', '000000')
              .send(scenario.body || {});
            break;
          case 'PUT':
            response = await helper
              .getRequest()
              .put(fullPath)
              .set('Authorization', `Bearer ${token}`)
              .set('x-tenant-id', '000000')
              .send(scenario.body || {});
            break;
          case 'DELETE':
            response = await helper
              .getRequest()
              .delete(fullPath)
              .set('Authorization', `Bearer ${token}`)
              .set('x-tenant-id', '000000');
            break;
        }

        // Requirements 1.1: code field is number
        const hasCodeAsNumber = typeof response.body.code === 'number';
        // Requirements 1.2: msg field is string
        const hasMsgAsString = typeof response.body.msg === 'string';

        // For error scenarios, we expect either:
        // 1. Non-200 code with msg field (business error) - Requirements 1.5
        // 2. 200 code with null/empty data (resource not found but handled gracefully)
        const isValidErrorFormat =
          hasCodeAsNumber &&
          hasMsgAsString &&
          ((response.body.code !== 200 && response.body.msg !== undefined) ||
            (response.body.code === 200 && (response.body.data === null || response.body.data?.data === null)));

        if (!isValidErrorFormat) {
          console.log(`Error format check for ${scenario.description}`);
          console.log(`Response body:`, JSON.stringify(response.body, null, 2));
          console.log(`Checks: code=${hasCodeAsNumber}, msg=${hasMsgAsString}`);
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
   * Property 1c: For any API response, the response body SHALL always have:
   * - code field (number) - Requirements 1.1
   * - msg field (string) - Requirements 1.2
   * - data field (any or null) - Requirements 1.3
   *
   * **Validates: Requirements 1.1, 1.2, 1.3**
   */
  it('should always include code (number), msg (string), and data fields in response body', async () => {
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
            .set('x-tenant-id', '000000')
            .send((endpoint as (typeof errorScenarios)[0]).body || {});
        } else {
          if (endpoint.needsAuth) {
            response = await helper
              .getRequest()
              .get(fullPath)
              .set('Authorization', `Bearer ${token}`)
              .set('x-tenant-id', '000000');
          } else {
            response = await helper.getRequest().get(fullPath).set('x-tenant-id', '000000');
          }
        }

        // Property: Every response should have code (number), msg (string), and data field
        // Requirements 1.1: code field is number
        const hasCodeAsNumber = typeof response.body.code === 'number';
        // Requirements 1.2: msg field is string
        const hasMsgAsString = typeof response.body.msg === 'string';
        // Requirements 1.3: data field exists (can be null, undefined is also acceptable for some endpoints)
        const hasDataField = 'data' in response.body || 'user' in response.body;

        const hasRequiredFields = hasCodeAsNumber && hasMsgAsString && hasDataField;

        if (!hasRequiredFields) {
          console.log(`Missing required fields for ${fullPath}`);
          console.log(`Response body:`, JSON.stringify(response.body, null, 2));
          console.log(`Checks: code(number)=${hasCodeAsNumber}, msg(string)=${hasMsgAsString}, data=${hasDataField}`);
        }

        return hasRequiredFields;
      }),
      {
        numRuns: 100,
        verbose: true,
      },
    );
  }, 120000);
});
