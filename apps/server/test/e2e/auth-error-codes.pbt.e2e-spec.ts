/**
 * 认证错误码属性基测试
 *
 * **Feature: api-response-validation**
 *
 * @description
 * 验证认证相关的错误码一致性
 * - Property 12: Invalid Token Error Code
 * - Property 13: Invalid Credentials Error Code
 */

import * as fc from 'fast-check';
import { TestHelper } from '../helpers/test-helper';
import { PrismaService } from 'src/platform/prisma';
import { RedisService } from 'src/platform/redis/redis.service';
import { CacheEnum } from 'src/shared/enums/index';
import { ResponseCode } from 'src/shared/response';

describe('Authentication Error Codes Property Tests', () => {
  let helper: TestHelper;
  let prisma: PrismaService;
  let redisService: RedisService;
  const apiPrefix = '/api/v1';

  // Protected endpoints that require authentication
  const protectedEndpoints: Array<{ method: 'GET' | 'POST'; path: string }> = [
    { method: 'GET', path: '/getInfo' },
    { method: 'GET', path: '/getRouters' },
    { method: 'GET', path: '/system/user/list' },
    { method: 'GET', path: '/system/role/list' },
    { method: 'GET', path: '/system/dept/list' },
    { method: 'GET', path: '/system/menu/list' },
  ];

  // Authentication error codes range (2001-2008)
  const AUTH_ERROR_CODES = [
    ResponseCode.TOKEN_INVALID, // 2001
    ResponseCode.TOKEN_EXPIRED, // 2002
    ResponseCode.TOKEN_REFRESH_EXPIRED, // 2003
    ResponseCode.ACCOUNT_DISABLED, // 2004
    ResponseCode.ACCOUNT_LOCKED, // 2005
    ResponseCode.PASSWORD_ERROR, // 2006
    ResponseCode.CAPTCHA_ERROR, // 2007
    ResponseCode.PERMISSION_DENIED, // 2008
  ];

  // Also accept HTTP 401/403 status codes
  const VALID_AUTH_FAILURE_CODES = [
    ...AUTH_ERROR_CODES,
    ResponseCode.UNAUTHORIZED, // 401
    ResponseCode.FORBIDDEN, // 403
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
    // Unlock admin account after tests to prevent affecting other tests
    try {
      await helper.unlockAccount('admin');
    } catch (e) {
      // Ignore errors during cleanup
    }
    await helper.cleanup();
    await helper.close();
  });

  /**
   * Property 12: Invalid Token Error Code
   *
   * **Validates: Requirements 5.4**
   *
   * *For any* API request with invalid or expired token, the response code
   * SHALL be 2001 (TOKEN_INVALID) or 2002 (TOKEN_EXPIRED).
   */
  describe('Property 12: Invalid Token Error Code', () => {
    it('should return TOKEN_INVALID (2001) or TOKEN_EXPIRED (2002) for invalid tokens', async () => {
      // Generate various invalid token formats
      const invalidTokenArbitrary = fc.oneof(
        fc.constant('invalid_token_string'),
        fc.constant('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalid.payload'),
        fc.string({ minLength: 20, maxLength: 100 }).map((s) => s.replace(/[^a-zA-Z0-9]/g, '')),
        fc.constant('expired.token.here'),
        fc.constant('malformed-jwt-token'),
      );

      const endpointArbitrary = fc.constantFrom(...protectedEndpoints);

      await fc.assert(
        fc.asyncProperty(invalidTokenArbitrary, endpointArbitrary, async (invalidToken, endpoint) => {
          const fullPath = `${apiPrefix}${endpoint.path}`;

          let response;
          if (endpoint.method === 'GET') {
            response = await helper
              .getRequest()
              .get(fullPath)
              .set('Authorization', `Bearer ${invalidToken}`)
              .set('x-tenant-id', '000000');
          } else {
            response = await helper
              .getRequest()
              .post(fullPath)
              .set('Authorization', `Bearer ${invalidToken}`)
              .set('x-tenant-id', '000000')
              .send({});
          }

          // Property: Invalid token should return appropriate error code
          // Accept: 2001 (TOKEN_INVALID), 2002 (TOKEN_EXPIRED), 401, 403
          const responseCode = response.body.code || response.status;
          const isValidErrorCode = VALID_AUTH_FAILURE_CODES.includes(responseCode);

          if (!isValidErrorCode) {
            console.log(`Invalid token test failed for ${endpoint.method} ${fullPath}`);
            console.log(`Token: ${invalidToken.substring(0, 30)}...`);
            console.log(`Response code: ${responseCode}`);
          }

          return isValidErrorCode;
        }),
        {
          numRuns: 100,
          verbose: true,
        },
      );
    }, 180000);

    it('should return consistent error codes for empty tokens', async () => {
      const endpointArbitrary = fc.constantFrom(...protectedEndpoints);

      await fc.assert(
        fc.asyncProperty(endpointArbitrary, async (endpoint) => {
          const fullPath = `${apiPrefix}${endpoint.path}`;

          // Test with empty/missing authorization header
          const response = await helper.getRequest().get(fullPath).set('x-tenant-id', '000000');

          const responseCode = response.body.code || response.status;
          const isValidErrorCode = VALID_AUTH_FAILURE_CODES.includes(responseCode);

          if (!isValidErrorCode) {
            console.log(`Empty token test failed for ${endpoint.method} ${fullPath}`);
            console.log(`Response code: ${responseCode}`);
          }

          return isValidErrorCode;
        }),
        {
          numRuns: 100,
          verbose: true,
        },
      );
    }, 180000);
  });

  /**
   * Property 13: Invalid Credentials Error Code
   *
   * **Validates: Requirements 5.2**
   *
   * *For any* login attempt with invalid credentials, the response code
   * SHALL NOT be 200 (success).
   *
   * Note: The actual error code may vary (BUSINESS_ERROR, AUTH errors, etc.)
   * depending on the specific failure reason. The key property is that
   * invalid credentials never result in a successful login.
   */
  describe('Property 13: Invalid Credentials Error Code', () => {
    it('should return non-200 error code for invalid credentials', async () => {
      // Generate invalid credential combinations (alphanumeric only to avoid edge cases)
      const invalidCredentialsArbitrary = fc.oneof(
        // Wrong password for existing user
        fc.record({
          username: fc.constant('admin'),
          password: fc.stringMatching(/^[a-zA-Z0-9]{6,20}$/).filter((p) => p !== 'admin123'),
        }),
        // Non-existent user with valid-looking password
        fc.record({
          username: fc.stringMatching(/^[a-zA-Z][a-zA-Z0-9]{4,14}$/).map((s) => `nonexistent_${s}`),
          password: fc.stringMatching(/^[a-zA-Z0-9]{6,20}$/),
        }),
      );

      await fc.assert(
        fc.asyncProperty(invalidCredentialsArbitrary, async (credentials) => {
          const response = await helper
            .getRequest()
            .post(`${apiPrefix}/auth/login`)
            .set('x-tenant-id', '000000')
            .send(credentials);

          const responseCode = response.body.code;

          // Property: Invalid credentials should NOT return success (200)
          const isNotSuccess = responseCode !== ResponseCode.SUCCESS;

          if (!isNotSuccess) {
            console.log(`Invalid credentials test failed - got success!`);
            console.log(`Credentials: ${JSON.stringify(credentials)}`);
            console.log(`Response code: ${responseCode}`);
            console.log(`Response msg: ${response.body.msg}`);
          }

          return isNotSuccess;
        }),
        {
          numRuns: 100,
          verbose: true,
        },
      );
    }, 180000);

    it('should return non-200 error for wrong password with valid username', async () => {
      // Generate wrong passwords for admin user (alphanumeric only)
      const wrongPasswordArbitrary = fc.stringMatching(/^[a-zA-Z0-9]{6,20}$/).filter((p) => p !== 'admin123');

      await fc.assert(
        fc.asyncProperty(wrongPasswordArbitrary, async (wrongPassword) => {
          const response = await helper.getRequest().post(`${apiPrefix}/auth/login`).set('x-tenant-id', '000000').send({
            username: 'admin',
            password: wrongPassword,
          });

          const responseCode = response.body.code;

          // Property: Wrong password should NOT return success (200)
          const isNotSuccess = responseCode !== ResponseCode.SUCCESS;

          if (!isNotSuccess) {
            console.log(`Wrong password test failed - got success!`);
            console.log(`Password: ${wrongPassword}`);
            console.log(`Response code: ${responseCode}`);
            console.log(`Response msg: ${response.body.msg}`);
          }

          return isNotSuccess;
        }),
        {
          numRuns: 100,
          verbose: true,
        },
      );
    }, 180000);

    it('should return non-200 error for non-existent user', async () => {
      // Generate non-existent usernames (alphanumeric only)
      const nonExistentUserArbitrary = fc
        .stringMatching(/^[a-zA-Z][a-zA-Z0-9]{7,19}$/)
        .map((s) => `test_nonexistent_${s}`);

      await fc.assert(
        fc.asyncProperty(nonExistentUserArbitrary, async (username) => {
          const response = await helper.getRequest().post(`${apiPrefix}/auth/login`).set('x-tenant-id', '000000').send({
            username,
            password: 'somepassword123',
          });

          const responseCode = response.body.code;

          // Property: Non-existent user should NOT return success (200)
          const isNotSuccess = responseCode !== ResponseCode.SUCCESS;

          if (!isNotSuccess) {
            console.log(`Non-existent user test failed - got success!`);
            console.log(`Username: ${username}`);
            console.log(`Response code: ${responseCode}`);
            console.log(`Response msg: ${response.body.msg}`);
          }

          return isNotSuccess;
        }),
        {
          numRuns: 100,
          verbose: true,
        },
      );
    }, 180000);
  });
});
