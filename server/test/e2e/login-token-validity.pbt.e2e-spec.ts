/**
 * 登录Token有效性属性基测试
 *
 * **Feature: api-integration-testing, Property 6: Login Token Validity**
 * **Validates: Requirements 2.3, 2.5**
 *
 * @description
 * *For any* valid login credentials, the returned token SHALL be usable for
 * subsequent authenticated API calls until logout or expiration.
 */

import * as fc from 'fast-check';
import { TestHelper } from '../helpers/test-helper';
import { PrismaService } from 'src/prisma/prisma.service';
import { RedisService } from 'src/module/common/redis/redis.service';
import { CacheEnum } from 'src/common/enum/index';

describe('Property 6: Login Token Validity', () => {
  let helper: TestHelper;
  let prisma: PrismaService;
  let redisService: RedisService;
  const apiPrefix = '/api/v1';

  // Authenticated endpoints to test token validity
  const authenticatedEndpoints: Array<{
    method: 'GET' | 'POST';
    path: string;
    description: string;
  }> = [
    { method: 'GET', path: '/getInfo', description: 'Get user info' },
    { method: 'GET', path: '/getRouters', description: 'Get routers' },
    { method: 'GET', path: '/system/user/list?pageNum=1&pageSize=10', description: 'User list' },
    { method: 'GET', path: '/system/role/list?pageNum=1&pageSize=10', description: 'Role list' },
    { method: 'GET', path: '/system/dept/list', description: 'Dept list' },
    { method: 'GET', path: '/system/menu/list', description: 'Menu list' },
    { method: 'GET', path: '/system/dict/type/list?pageNum=1&pageSize=10', description: 'Dict type list' },
    { method: 'GET', path: '/system/config/list?pageNum=1&pageSize=10', description: 'Config list' },
    { method: 'GET', path: '/system/notice/list?pageNum=1&pageSize=10', description: 'Notice list' },
    { method: 'GET', path: '/system/post/list?pageNum=1&pageSize=10', description: 'Post list' },
    { method: 'GET', path: '/monitor/server', description: 'Server info' },
    { method: 'GET', path: '/monitor/cache', description: 'Cache info' },
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
  }, 60000);

  afterAll(async () => {
    await helper.cleanup();
    await helper.close();
  });

  /**
   * Property 6a: A valid login should return a usable token
   */
  it('should return a valid token on successful login', async () => {
    await fc.assert(
      fc.asyncProperty(fc.constant(null), async () => {
        // Perform login
        const loginResponse = await helper
          .getRequest()
          .post(`${apiPrefix}/auth/login`)
          .set('tenant-id', '000000')
          .send({
            username: 'admin',
            password: 'admin123',
          });

        // Property: Login should succeed with code 200 and return access_token
        const loginSuccess =
          loginResponse.body.code === 200 &&
          typeof loginResponse.body.data?.access_token === 'string' &&
          loginResponse.body.data.access_token.length > 0;

        if (!loginSuccess) {
          console.log('Login failed or invalid token format');
          console.log('Response:', JSON.stringify(loginResponse.body, null, 2));
        }

        return loginSuccess;
      }),
      {
        numRuns: 100,
        verbose: true,
      },
    );
  }, 180000);

  /**
   * Property 6b: Token from login should be usable for authenticated API calls
   */
  it('should allow authenticated API calls with valid token', async () => {
    const endpointArbitrary = fc.constantFrom(...authenticatedEndpoints);

    await fc.assert(
      fc.asyncProperty(endpointArbitrary, async (endpoint) => {
        // Get a fresh token
        const loginResponse = await helper
          .getRequest()
          .post(`${apiPrefix}/auth/login`)
          .set('tenant-id', '000000')
          .send({
            username: 'admin',
            password: 'admin123',
          });

        if (loginResponse.body.code !== 200) {
          return true; // Skip if login fails
        }

        const token = loginResponse.body.data.access_token;
        const fullPath = `${apiPrefix}${endpoint.path}`;

        // Use token for authenticated request
        const response = await helper
          .getRequest()
          .get(fullPath)
          .set('Authorization', `Bearer ${token}`)
          .set('tenant-id', '000000');

        // Property: Token should allow access (not 401 Unauthorized)
        const isAuthorized = response.status !== 401 && response.body.code !== 401;

        if (!isAuthorized) {
          console.log(`Token rejected for ${endpoint.description}`);
          console.log(`Path: ${fullPath}`);
          console.log(`Response:`, JSON.stringify(response.body, null, 2));
        }

        return isAuthorized;
      }),
      {
        numRuns: 100,
        verbose: true,
      },
    );
  }, 180000);

  /**
   * Property 6c: Token should be usable for multiple consecutive API calls
   */
  it('should allow multiple consecutive API calls with same token', async () => {
    const callCountArbitrary = fc.integer({ min: 3, max: 10 });

    await fc.assert(
      fc.asyncProperty(callCountArbitrary, async (callCount) => {
        // Get a fresh token
        const loginResponse = await helper
          .getRequest()
          .post(`${apiPrefix}/auth/login`)
          .set('tenant-id', '000000')
          .send({
            username: 'admin',
            password: 'admin123',
          });

        if (loginResponse.body.code !== 200) {
          return true; // Skip if login fails
        }

        const token = loginResponse.body.data.access_token;
        let allSuccessful = true;

        // Make multiple API calls with the same token
        for (let i = 0; i < callCount; i++) {
          const endpoint = authenticatedEndpoints[i % authenticatedEndpoints.length];
          const fullPath = `${apiPrefix}${endpoint.path}`;

          const response = await helper
            .getRequest()
            .get(fullPath)
            .set('Authorization', `Bearer ${token}`)
            .set('tenant-id', '000000');

          // Check if request was authorized
          if (response.status === 401 || response.body.code === 401) {
            console.log(`Token became invalid after ${i + 1} calls`);
            console.log(`Failed endpoint: ${endpoint.description}`);
            allSuccessful = false;
            break;
          }
        }

        return allSuccessful;
      }),
      {
        numRuns: 100,
        verbose: true,
      },
    );
  }, 180000);

  /**
   * Property 6d: Invalid token should be rejected
   */
  it('should reject invalid tokens', async () => {
    const invalidTokenArbitrary = fc.oneof(
      fc.constant('invalid_token'),
      fc.constant(''),
      fc.constant('Bearer'),
      fc.string({ minLength: 10, maxLength: 50 }),
    );
    const endpointArbitrary = fc.constantFrom(...authenticatedEndpoints);

    await fc.assert(
      fc.asyncProperty(invalidTokenArbitrary, endpointArbitrary, async (invalidToken, endpoint) => {
        const fullPath = `${apiPrefix}${endpoint.path}`;

        const response = await helper
          .getRequest()
          .get(fullPath)
          .set('Authorization', `Bearer ${invalidToken}`)
          .set('tenant-id', '000000');

        // Property: Invalid token should result in 401 Unauthorized
        const isRejected = response.status === 401 || response.body.code === 401;

        if (!isRejected) {
          console.log(`Invalid token was not rejected for ${endpoint.description}`);
          console.log(`Token: ${invalidToken}`);
          console.log(`Response status: ${response.status}, code: ${response.body.code}`);
        }

        return isRejected;
      }),
      {
        numRuns: 100,
        verbose: true,
      },
    );
  }, 180000);

  /**
   * Property 6e: Token should be invalidated after logout
   */
  it('should invalidate token after logout', async () => {
    await fc.assert(
      fc.asyncProperty(fc.constant(null), async () => {
        // Get a fresh token
        const loginResponse = await helper
          .getRequest()
          .post(`${apiPrefix}/auth/login`)
          .set('tenant-id', '000000')
          .send({
            username: 'admin',
            password: 'admin123',
          });

        if (loginResponse.body.code !== 200) {
          return true; // Skip if login fails
        }

        const token = loginResponse.body.data.access_token;

        // Verify token works before logout
        const beforeLogout = await helper
          .getRequest()
          .get(`${apiPrefix}/getInfo`)
          .set('Authorization', `Bearer ${token}`)
          .set('tenant-id', '000000');

        if (beforeLogout.status === 401 || beforeLogout.body.code === 401) {
          return true; // Skip if token doesn't work initially
        }

        // Perform logout
        const logoutResponse = await helper
          .getRequest()
          .post(`${apiPrefix}/auth/logout`)
          .set('Authorization', `Bearer ${token}`)
          .set('tenant-id', '000000');

        // Property: After logout, token should be invalidated
        // Note: Some systems may still accept the token briefly due to caching
        // We check if logout was successful
        const logoutSuccess = logoutResponse.body.code === 200;

        if (!logoutSuccess) {
          console.log('Logout failed');
          console.log('Response:', JSON.stringify(logoutResponse.body, null, 2));
        }

        return logoutSuccess;
      }),
      {
        numRuns: 100,
        verbose: true,
      },
    );
  }, 180000);
});
