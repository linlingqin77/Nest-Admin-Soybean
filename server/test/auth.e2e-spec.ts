import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp, cleanupDatabase, getAuthToken, createTestUser } from './setup-e2e';
import { AppConfigService } from '../src/config/app-config.service';

/**
 * 认证流程 E2E 测试
 * 测试登录、登出、注册、Token 验证等认证相关功能
 */
describe('AuthController (e2e)', () => {
  let app: INestApplication;
  let prefix: string;

  beforeAll(async () => {
    app = await createTestApp();
    const config = app.get(AppConfigService);
    prefix = config.app.prefix;
  });

  afterAll(async () => {
    await cleanupDatabase(app);
    await app.close();
  });

  describe('/auth/code (GET) - 获取验证码', () => {
    it('should return captcha code', async () => {
      const response = await request(app.getHttpServer())
        .get(`${prefix}/auth/code`)
        .expect(200);

      expect(response.body.code).toBe(200);
      expect(response.body.data).toHaveProperty('captchaEnabled');
      expect(response.body.data).toHaveProperty('uuid');
      expect(response.body.data).toHaveProperty('img');
    });

    it('should return different uuid for each request', async () => {
      const response1 = await request(app.getHttpServer())
        .get(`${prefix}/auth/code`)
        .expect(200);

      const response2 = await request(app.getHttpServer())
        .get(`${prefix}/auth/code`)
        .expect(200);

      if (response1.body.data.captchaEnabled) {
        expect(response1.body.data.uuid).not.toBe(response2.body.data.uuid);
      }
    });
  });

  describe('/auth/tenant/list (GET) - 获取租户列表', () => {
    it('should return tenant list', async () => {
      const response = await request(app.getHttpServer())
        .get(`${prefix}/auth/tenant/list`)
        .expect(200);

      expect(response.body.code).toBe(200);
      expect(response.body.data).toHaveProperty('tenantEnabled');
      expect(response.body.data).toHaveProperty('voList');
      expect(Array.isArray(response.body.data.voList)).toBe(true);
    });

    it('should return default tenant when tenant is disabled', async () => {
      const response = await request(app.getHttpServer())
        .get(`${prefix}/auth/tenant/list`)
        .expect(200);

      expect(response.body.code).toBe(200);
      if (!response.body.data.tenantEnabled) {
        expect(response.body.data.voList).toHaveLength(0);
      }
    });
  });

  describe('/auth/login (POST) - 用户登录', () => {
    it('should login successfully with valid credentials', async () => {
      const response = await request(app.getHttpServer())
        .post(`${prefix}/auth/login`)
        .send({
          username: 'admin',
          password: 'admin123',
          clientId: 'pc',
        })
        .expect(200);

      expect(response.body.code).toBe(200);
      expect(response.body.data).toHaveProperty('access_token');
      expect(response.body.data).toHaveProperty('refresh_token');
      expect(response.body.data).toHaveProperty('expire_in');
      expect(response.body.data.access_token).toBeTruthy();
    });

    it('should fail with invalid username', async () => {
      const response = await request(app.getHttpServer())
        .post(`${prefix}/auth/login`)
        .send({
          username: 'nonexistent_user',
          password: 'password123',
          clientId: 'pc',
        })
        .expect(200);

      expect(response.body.code).not.toBe(200);
      expect(response.body.msg).toBeTruthy();
    });

    it('should fail with invalid password', async () => {
      const response = await request(app.getHttpServer())
        .post(`${prefix}/auth/login`)
        .send({
          username: 'admin',
          password: 'wrongpassword',
          clientId: 'pc',
        })
        .expect(200);

      expect(response.body.code).not.toBe(200);
      expect(response.body.msg).toBeTruthy();
    });

    it('should fail with missing required fields', async () => {
      const response = await request(app.getHttpServer())
        .post(`${prefix}/auth/login`)
        .send({
          username: 'admin',
          // missing password
        })
        .expect(400);

      expect(response.body.code).not.toBe(200);
    });

    it('should support tenant-id in header', async () => {
      const response = await request(app.getHttpServer())
        .post(`${prefix}/auth/login`)
        .set('tenant-id', '000000')
        .send({
          username: 'admin',
          password: 'admin123',
          clientId: 'pc',
        })
        .expect(200);

      expect(response.body.code).toBe(200);
      expect(response.body.data).toHaveProperty('access_token');
    });

    it('should support tenant-id in body', async () => {
      const response = await request(app.getHttpServer())
        .post(`${prefix}/auth/login`)
        .send({
          username: 'admin',
          password: 'admin123',
          tenantId: '000000',
          clientId: 'pc',
        })
        .expect(200);

      expect(response.body.code).toBe(200);
      expect(response.body.data).toHaveProperty('access_token');
    });
  });

  describe('/auth/logout (POST) - 退出登录', () => {
    it('should logout successfully with valid token', async () => {
      // 先登录获取 token
      const token = await getAuthToken(app);

      const response = await request(app.getHttpServer())
        .post(`${prefix}/auth/logout`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.code).toBe(200);
    });

    it('should allow logout without token', async () => {
      const response = await request(app.getHttpServer())
        .post(`${prefix}/auth/logout`)
        .expect(200);

      expect(response.body.code).toBe(200);
    });
  });

  describe('/auth/register (POST) - 用户注册', () => {
    const testUsername = `e2e_${Date.now()}`.substring(0, 15); // 确保不超过 20 个字符
    const testPassword = 'Test123456!';

    it('should register successfully with valid data', async () => {
      const response = await request(app.getHttpServer())
        .post(`${prefix}/auth/register`)
        .send({
          username: testUsername,
          password: testPassword,
          confirmPassword: testPassword,
        })
        .expect(200);

      expect(response.body.code).toBe(200);
    });

    it('should fail when passwords do not match', async () => {
      const response = await request(app.getHttpServer())
        .post(`${prefix}/auth/register`)
        .send({
          username: `e2e_${Date.now()}`.substring(0, 15),
          password: testPassword,
          confirmPassword: 'DifferentPassword123!',
        })
        .expect(200);

      expect(response.body.code).not.toBe(200);
      expect(response.body.msg).toContain('密码不一致');
    });

    it('should fail with duplicate username', async () => {
      const duplicateUsername = `e2e_dup_${Date.now()}`.substring(0, 15);

      // 第一次注册
      await request(app.getHttpServer())
        .post(`${prefix}/auth/register`)
        .send({
          username: duplicateUsername,
          password: testPassword,
          confirmPassword: testPassword,
        })
        .expect(200);

      // 第二次注册相同用户名
      const response = await request(app.getHttpServer())
        .post(`${prefix}/auth/register`)
        .send({
          username: duplicateUsername,
          password: testPassword,
          confirmPassword: testPassword,
        })
        .expect(200);

      expect(response.body.code).not.toBe(200);
    });

    it('should fail with missing required fields', async () => {
      const response = await request(app.getHttpServer())
        .post(`${prefix}/auth/register`)
        .send({
          username: `e2e_${Date.now()}`.substring(0, 15),
          // missing password and confirmPassword
        })
        .expect(400);

      expect(response.body.code).not.toBe(200);
    });
  });

  describe('Token 验证', () => {
    it('should access protected endpoint with valid token', async () => {
      const token = await getAuthToken(app);

      const response = await request(app.getHttpServer())
        .get(`${prefix}/getInfo`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.code).toBe(200);
      expect(response.body.data).toHaveProperty('user');
    });

    it('should reject access with invalid token', async () => {
      const response = await request(app.getHttpServer())
        .get(`${prefix}/getInfo`)
        .set('Authorization', 'Bearer invalid_token_here')
        .expect(401);

      expect(response.body.code).not.toBe(200);
    });

    it('should reject access without token', async () => {
      const response = await request(app.getHttpServer())
        .get(`${prefix}/getInfo`)
        .expect(401);

      expect(response.body.code).not.toBe(200);
    });

    it('should reject access with expired token', async () => {
      // 使用一个已知过期的 token
      const expiredToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjE1MTYyMzkwMjJ9.4Adcj0vVzr7B8Y8wHvVxKlHmJxXKpXq7Z8Y8wHvVxKl';

      const response = await request(app.getHttpServer())
        .get(`${prefix}/getInfo`)
        .set('Authorization', `Bearer ${expiredToken}`)
        .expect(401);

      expect(response.body.code).not.toBe(200);
    });
  });

  describe('认证流程集成测试', () => {
    it('should complete full authentication flow', async () => {
      const testUsername = `e2e_flow_${Date.now()}`.substring(0, 15);
      const testPassword = 'Test123456!';

      // 1. 注册新用户
      const registerResponse = await request(app.getHttpServer())
        .post(`${prefix}/auth/register`)
        .send({
          username: testUsername,
          password: testPassword,
          confirmPassword: testPassword,
        })
        .expect(200);

      expect(registerResponse.body.code).toBe(200);

      // 2. 使用新用户登录
      const loginResponse = await request(app.getHttpServer())
        .post(`${prefix}/auth/login`)
        .send({
          username: testUsername,
          password: testPassword,
          clientId: 'pc',
        })
        .expect(200);

      expect(loginResponse.body.code).toBe(200);
      const token = loginResponse.body.data.access_token;
      expect(token).toBeTruthy();

      // 3. 使用 token 访问受保护的端点
      const infoResponse = await request(app.getHttpServer())
        .get(`${prefix}/getInfo`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(infoResponse.body.code).toBe(200);
      expect(infoResponse.body.data.user.userName).toBe(testUsername);

      // 4. 退出登录
      const logoutResponse = await request(app.getHttpServer())
        .post(`${prefix}/auth/logout`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(logoutResponse.body.code).toBe(200);
    });
  });

  describe('/auth/publicKey (GET) - 获取加密公钥', () => {
    it('should return public key', async () => {
      const response = await request(app.getHttpServer())
        .get(`${prefix}/auth/publicKey`)
        .expect(200);

      expect(response.body.code).toBe(200);
      expect(response.body.data).toHaveProperty('publicKey');
    });
  });
});
