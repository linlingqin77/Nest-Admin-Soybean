/**
 * 认证强制执行属性基测试
 *
 * **Feature: api-integration-testing, Property 2: Authentication Enforcement**
 * **Validates: Requirements 16.3**
 *
 * @description
 * *For any* protected API endpoint, when accessed without a valid authentication token,
 * the response SHALL return HTTP status 401 or 403 with an appropriate error message.
 *
 * This property test verifies that all protected endpoints properly enforce authentication.
 */

import * as fc from 'fast-check';
import { TestHelper } from '../helpers/test-helper';
import { PrismaService } from 'src/prisma/prisma.service';
import { RedisService } from 'src/module/common/redis/redis.service';
import { CacheEnum } from 'src/common/enum/index';

describe('Property 2: Authentication Enforcement', () => {
  let helper: TestHelper;
  let prisma: PrismaService;
  let redisService: RedisService;
  let originalCaptchaEnabled: string | null = null;
  const apiPrefix = '/api/v1';

  // List of protected endpoints that require authentication
  // These endpoints should return 401/403 when accessed without a valid token
  const protectedEndpoints: Array<{ method: 'GET' | 'POST' | 'PUT' | 'DELETE'; path: string }> = [
    // User info endpoints
    { method: 'GET', path: '/getInfo' },
    { method: 'GET', path: '/getRouters' },

    // System user endpoints
    { method: 'GET', path: '/system/user/list' },
    { method: 'GET', path: '/system/user/1' },
    { method: 'POST', path: '/system/user' },
    { method: 'PUT', path: '/system/user' },
    { method: 'DELETE', path: '/system/user/999' },

    // System role endpoints
    { method: 'GET', path: '/system/role/list' },
    { method: 'GET', path: '/system/role/1' },
    { method: 'POST', path: '/system/role' },
    { method: 'PUT', path: '/system/role' },
    { method: 'DELETE', path: '/system/role/999' },

    // System dept endpoints
    { method: 'GET', path: '/system/dept/list' },
    { method: 'GET', path: '/system/dept/1' },
    { method: 'POST', path: '/system/dept' },
    { method: 'PUT', path: '/system/dept' },
    { method: 'DELETE', path: '/system/dept/999' },

    // System menu endpoints
    { method: 'GET', path: '/system/menu/list' },
    { method: 'GET', path: '/system/menu/1' },
    { method: 'POST', path: '/system/menu' },
    { method: 'PUT', path: '/system/menu' },
    { method: 'DELETE', path: '/system/menu/999' },

    // System dict endpoints
    { method: 'GET', path: '/system/dict/type/list' },
    { method: 'GET', path: '/system/dict/data/list' },

    // System config endpoints
    { method: 'GET', path: '/system/config/list' },

    // Monitor endpoints
    { method: 'GET', path: '/monitor/online/list' },
    { method: 'GET', path: '/monitor/operlog/list' },
    { method: 'GET', path: '/monitor/logininfor/list' },
    { method: 'GET', path: '/monitor/server' },
    { method: 'GET', path: '/monitor/cache' },
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
      originalCaptchaEnabled = captchaConfig.configValue;
      await prisma.sysConfig.update({
        where: { configId: captchaConfig.configId },
        data: { configValue: 'false' },
      });
      // Clear config cache
      await redisService.del(`${CacheEnum.SYS_CONFIG_KEY}sys.account.captchaEnabled`);
    }
  }, 60000);

  afterAll(async () => {
    // Note: We don't restore captcha setting to avoid race conditions
    // when multiple test files run in parallel. The test database
    // should be reset between test runs anyway.

    await helper.cleanup();
    await helper.close();
  });

  /**
   * Property: For any protected endpoint, accessing without authentication
   * should return 401 Unauthorized or 403 Forbidden
   */
  it('should enforce authentication on all protected endpoints', async () => {
    // Create an arbitrary that selects from protected endpoints
    const endpointArbitrary = fc.constantFrom(...protectedEndpoints);

    // Create an arbitrary for invalid tokens
    const invalidTokenArbitrary = fc.oneof(
      fc.constant(''), // Empty token
      fc.constant('invalid-token'), // Invalid format
      fc.constant('Bearer invalid'), // Invalid bearer token
      fc.string({ minLength: 10, maxLength: 50 }), // Random string
    );

    await fc.assert(
      fc.asyncProperty(
        endpointArbitrary,
        invalidTokenArbitrary,
        async (endpoint, invalidToken) => {
          const fullPath = `${apiPrefix}${endpoint.path}`;
          let response;

          // Make request based on method
          switch (endpoint.method) {
            case 'GET':
              response = await helper
                .getRequest()
                .get(fullPath)
                .set('Authorization', invalidToken ? `Bearer ${invalidToken}` : '');
              break;
            case 'POST':
              response = await helper
                .getRequest()
                .post(fullPath)
                .set('Authorization', invalidToken ? `Bearer ${invalidToken}` : '')
                .send({});
              break;
            case 'PUT':
              response = await helper
                .getRequest()
                .put(fullPath)
                .set('Authorization', invalidToken ? `Bearer ${invalidToken}` : '')
                .send({});
              break;
            case 'DELETE':
              response = await helper
                .getRequest()
                .delete(fullPath)
                .set('Authorization', invalidToken ? `Bearer ${invalidToken}` : '');
              break;
          }

          // Property: Response should indicate authentication failure
          // Accept both 401 (Unauthorized) and 403 (Forbidden) as valid auth failure responses
          const isAuthFailure =
            response.status === 401 ||
            response.status === 403 ||
            response.body.code === 401 ||
            response.body.code === 403;

          if (!isAuthFailure) {
            // Log failure details for debugging
            console.log(`Auth enforcement failed for ${endpoint.method} ${fullPath}`);
            console.log(`Status: ${response.status}, Body code: ${response.body.code}`);
          }

          return isAuthFailure;
        },
      ),
      {
        numRuns: 100, // Run 100 iterations as per design requirements
        verbose: true,
      },
    );
  }, 120000); // Extended timeout for property tests

  /**
   * Property: For any protected endpoint, accessing with a valid token
   * should NOT return 401/403 (unless permission denied)
   */
  it('should allow access to protected endpoints with valid token', async () => {
    // Login to get a valid token
    const token = await helper.login();
    expect(token).toBeTruthy();

    // Test a subset of GET endpoints that should work with valid auth
    const readOnlyEndpoints = protectedEndpoints.filter(
      (e) => e.method === 'GET' && !e.path.includes('/999') && !e.path.includes('/1'),
    );

    const endpointArbitrary = fc.constantFrom(...readOnlyEndpoints);

    await fc.assert(
      fc.asyncProperty(endpointArbitrary, async (endpoint) => {
        const fullPath = `${apiPrefix}${endpoint.path}`;

        const response = await helper
          .getRequest()
          .get(fullPath)
          .set('Authorization', `Bearer ${token}`)
          .set('tenant-id', '000000');

        // Property: With valid token, should not get 401 Unauthorized
        // (403 Forbidden is acceptable if user lacks specific permissions)
        const isNotUnauthorized = response.status !== 401 && response.body.code !== 401;

        if (!isNotUnauthorized) {
          console.log(`Unexpected 401 for ${endpoint.method} ${fullPath} with valid token`);
        }

        return isNotUnauthorized;
      }),
      {
        numRuns: 50, // Fewer runs since we're testing with valid token
        verbose: true,
      },
    );
  }, 120000);
});
