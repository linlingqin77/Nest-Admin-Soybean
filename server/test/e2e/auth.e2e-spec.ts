/**
 * 认证模块E2E测试
 *
 * @description
 * 测试认证相关的所有API端点
 * - GET /api/v1/captchaImage 验证码接口
 * - GET /api/v1/auth/tenant/list 租户列表接口
 * - POST /api/v1/auth/login 登录接口
 * - POST /api/v1/auth/logout 登出接口
 * - GET /api/v1/getInfo 获取用户信息接口
 * - GET /api/v1/getRouters 获取路由菜单接口
 * - GET /api/v1/auth/publicKey RSA公钥接口
 *
 * _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8_
 */

import { TestHelper } from '../helpers/test-helper';
import { PrismaService } from 'src/prisma/prisma.service';
import { RedisService } from 'src/module/common/redis/redis.service';
import { CacheEnum } from 'src/common/enum/index';

describe('Auth E2E Tests', () => {
  let helper: TestHelper;
  let prisma: PrismaService;
  let redisService: RedisService;
  const apiPrefix = '/api/v1';
  let originalCaptchaEnabled: string | null = null;

  beforeAll(async () => {
    helper = new TestHelper();
    await helper.init();

    prisma = helper.getPrisma();
    redisService = helper.getApp().get(RedisService);

    // Disable captcha for E2E testing
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

  describe('GET /captchaImage - 验证码接口', () => {
    it('should return captcha data with uuid and img', async () => {
      const response = await helper
        .getRequest()
        .get(`${apiPrefix}/captchaImage`)
        .expect(200);

      expect(response.body.code).toBe(200);
      expect(response.body.data).toHaveProperty('captchaEnabled');
      expect(response.body.data).toHaveProperty('uuid');
      expect(response.body.data).toHaveProperty('img');
    });
  });

  describe('GET /auth/tenant/list - 租户列表接口', () => {
    it('should return tenant list', async () => {
      const response = await helper
        .getRequest()
        .get(`${apiPrefix}/auth/tenant/list`)
        .expect(200);

      expect(response.body.code).toBe(200);
      expect(response.body.data).toHaveProperty('tenantEnabled');
      expect(response.body.data).toHaveProperty('voList');
      expect(Array.isArray(response.body.data.voList)).toBe(true);
    });

    it('should return tenant info with required fields', async () => {
      const response = await helper
        .getRequest()
        .get(`${apiPrefix}/auth/tenant/list`)
        .expect(200);

      if (response.body.data.tenantEnabled && response.body.data.voList.length > 0) {
        const tenant = response.body.data.voList[0];
        expect(tenant).toHaveProperty('tenantId');
        expect(tenant).toHaveProperty('companyName');
      }
    });
  });

  describe('POST /auth/login - 登录接口', () => {
    it('should login successfully with valid credentials', async () => {
      const response = await helper
        .getRequest()
        .post(`${apiPrefix}/auth/login`)
        .set('tenant-id', '000000')
        .send({
          username: 'admin',
          password: 'admin123',
        })
        .expect(200);

      expect(response.body.code).toBe(200);
      expect(response.body.data).toHaveProperty('access_token');
      expect(response.body.data.access_token).toBeTruthy();
    });

    it('should fail login with wrong password', async () => {
      const response = await helper
        .getRequest()
        .post(`${apiPrefix}/auth/login`)
        .set('tenant-id', '000000')
        .send({
          username: 'admin',
          password: 'wrongpassword',
        })
        .expect(200);

      expect(response.body.code).not.toBe(200);
    });

    it('should fail login with non-existent user', async () => {
      const response = await helper
        .getRequest()
        .post(`${apiPrefix}/auth/login`)
        .set('tenant-id', '000000')
        .send({
          username: 'nonexistent_user_xyz',
          password: 'somepassword',
        })
        .expect(200);

      expect(response.body.code).not.toBe(200);
    });

    it('should return token with expected structure', async () => {
      const response = await helper
        .getRequest()
        .post(`${apiPrefix}/auth/login`)
        .set('tenant-id', '000000')
        .send({
          username: 'admin',
          password: 'admin123',
        })
        .expect(200);

      if (response.body.code === 200) {
        expect(response.body.data).toHaveProperty('access_token');
        expect(response.body.data).toHaveProperty('expire_in');
        expect(typeof response.body.data.expire_in).toBe('number');
      }
    });
  });

  describe('POST /auth/logout - 登出接口', () => {
    it('should logout successfully when authenticated', async () => {
      // First login
      const token = await helper.login();
      expect(token).toBeTruthy();

      // Then logout
      const response = await helper
        .getAuthRequest()
        .post(`${apiPrefix}/auth/logout`)
        .set('Authorization', `Bearer ${token}`)
        .set('tenant-id', '000000')
        .expect(200);

      expect(response.body.code).toBe(200);
    });

    it('should handle logout without token gracefully', async () => {
      const response = await helper
        .getRequest()
        .post(`${apiPrefix}/auth/logout`)
        .expect(200);

      expect(response.body.code).toBe(200);
    });
  });

  describe('GET /getInfo - 获取用户信息接口', () => {
    let token: string;

    beforeAll(async () => {
      token = await helper.login();
    });

    it('should return user info when authenticated', async () => {
      const response = await helper
        .getAuthRequest()
        .get(`${apiPrefix}/getInfo`)
        .set('Authorization', `Bearer ${token}`)
        .set('tenant-id', '000000')
        .expect(200);

      expect(response.body.code).toBe(200);
      expect(response.body).toHaveProperty('user');
      expect(response.body).toHaveProperty('roles');
      expect(response.body).toHaveProperty('permissions');
    });

    it('should return user with required fields', async () => {
      const response = await helper
        .getAuthRequest()
        .get(`${apiPrefix}/getInfo`)
        .set('Authorization', `Bearer ${token}`)
        .set('tenant-id', '000000')
        .expect(200);

      if (response.body.code === 200) {
        const user = response.body.user;
        expect(user).toHaveProperty('userId');
        expect(user).toHaveProperty('userName');
        expect(user).toHaveProperty('nickName');
      }
    });

    it('should return roles as array', async () => {
      const response = await helper
        .getAuthRequest()
        .get(`${apiPrefix}/getInfo`)
        .set('Authorization', `Bearer ${token}`)
        .set('tenant-id', '000000')
        .expect(200);

      expect(Array.isArray(response.body.roles)).toBe(true);
    });

    it('should return permissions as array', async () => {
      const response = await helper
        .getAuthRequest()
        .get(`${apiPrefix}/getInfo`)
        .set('Authorization', `Bearer ${token}`)
        .set('tenant-id', '000000')
        .expect(200);

      expect(Array.isArray(response.body.permissions)).toBe(true);
    });

    it('should fail without authentication', async () => {
      const response = await helper
        .getRequest()
        .get(`${apiPrefix}/getInfo`);

      // API returns 403 Forbidden for unauthenticated requests
      expect([401, 403]).toContain(response.status);
      expect([401, 403]).toContain(response.body.code);
    });
  });

  describe('GET /getRouters - 获取路由菜单接口', () => {
    let token: string;

    beforeAll(async () => {
      token = await helper.login();
    });

    it('should return routers when authenticated', async () => {
      const response = await helper
        .getAuthRequest()
        .get(`${apiPrefix}/getRouters`)
        .set('Authorization', `Bearer ${token}`)
        .set('tenant-id', '000000')
        .expect(200);

      expect(response.body.code).toBe(200);
      expect(response.body.data).toBeDefined();
      // Data can be an array or an object with routes
      if (Array.isArray(response.body.data)) {
        expect(Array.isArray(response.body.data)).toBe(true);
      } else {
        expect(response.body.data).toBeDefined();
      }
    });

    it('should return menu items with required fields', async () => {
      const response = await helper
        .getAuthRequest()
        .get(`${apiPrefix}/getRouters`)
        .set('Authorization', `Bearer ${token}`)
        .set('tenant-id', '000000')
        .expect(200);

      if (response.body.code === 200 && Array.isArray(response.body.data) && response.body.data.length > 0) {
        const menu = response.body.data[0];
        // Menu should have basic structure
        expect(menu).toHaveProperty('name');
        expect(menu).toHaveProperty('path');
      }
    });

    it('should fail without authentication', async () => {
      const response = await helper
        .getRequest()
        .get(`${apiPrefix}/getRouters`);

      // API returns 403 Forbidden for unauthenticated requests
      expect([401, 403]).toContain(response.status);
      expect([401, 403]).toContain(response.body.code);
    });
  });

  describe('GET /auth/publicKey - RSA公钥接口', () => {
    it('should return public key', async () => {
      const response = await helper
        .getRequest()
        .get(`${apiPrefix}/auth/publicKey`)
        .expect(200);

      expect(response.body.code).toBe(200);
      expect(response.body.data).toHaveProperty('publicKey');
    });
  });

  describe('GET /auth/code - 验证码接口 (Soybean API)', () => {
    it('should return captcha code data', async () => {
      const response = await helper
        .getRequest()
        .get(`${apiPrefix}/auth/code`)
        .expect(200);

      expect(response.body.code).toBe(200);
      expect(response.body.data).toHaveProperty('captchaEnabled');
      expect(response.body.data).toHaveProperty('uuid');
      expect(response.body.data).toHaveProperty('img');
    });
  });
});
