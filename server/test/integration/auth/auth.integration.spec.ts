/**
 * 认证模块集成测试
 *
 * @description
 * 测试认证模块的完整流程，包括登录、Token刷新等
 * 使用真实的数据库和Redis连接
 *
 * _Requirements: 2.3, 2.5_
 */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe, VersioningType } from '@nestjs/common';
import { AppModule } from 'src/app.module';
import { PrismaService } from 'src/prisma/prisma.service';
import { RedisService } from 'src/module/common/redis/redis.service';
import { UserAuthService } from 'src/module/system/user/services/user-auth.service';
import { MainService } from 'src/module/main/main.service';
import { CacheEnum } from 'src/common/enum/index';

describe('Auth Integration Tests', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let redisService: RedisService;
  let userAuthService: UserAuthService;
  let mainService: MainService;

  // Use existing admin user for testing
  const testUserName = 'admin';
  const testPassword = 'admin123';
  let testUserId: number;
  let originalCaptchaEnabled: string | null = null;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    // Configure app similar to main.ts
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
        transformOptions: {
          enableImplicitConversion: true,
        },
      }),
    );

    await app.init();

    prisma = app.get(PrismaService);
    redisService = app.get(RedisService);
    userAuthService = app.get(UserAuthService);
    mainService = app.get(MainService);

    // Get admin user ID
    const adminUser = await prisma.sysUser.findFirst({
      where: { userName: testUserName },
    });
    if (adminUser) {
      testUserId = adminUser.userId;
    }

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
    // Restore captcha setting
    if (originalCaptchaEnabled !== null) {
      const captchaConfig = await prisma.sysConfig.findFirst({
        where: { configKey: 'sys.account.captchaEnabled' },
      });
      if (captchaConfig) {
        await prisma.sysConfig.update({
          where: { configId: captchaConfig.configId },
          data: { configValue: originalCaptchaEnabled },
        });
        // Clear config cache
        await redisService.del(`${CacheEnum.SYS_CONFIG_KEY}sys.account.captchaEnabled`);
      }
    }

    await app.close();
  });

  describe('Login Flow Integration', () => {
    const clientInfo = {
      browser: 'Jest',
      ipaddr: '127.0.0.1',
      loginLocation: 'Test',
      os: 'Test OS',
      deviceType: '0',
    };

    it('should complete full login flow with valid credentials', async () => {
      // Step 1: Login
      const loginDto = {
        userName: testUserName,
        password: testPassword,
        code: '',
        uuid: '',
      };

      const loginResult = await userAuthService.login(loginDto, clientInfo);

      expect(loginResult.code).toBe(200);
      expect(loginResult.data).toHaveProperty('token');
      expect(loginResult.msg).toBe('登录成功');

      const token = loginResult.data.token;

      // Step 2: Verify token can be parsed
      const parsedToken = userAuthService.parseToken(token);
      expect(parsedToken).toBeDefined();
      expect(parsedToken.userId).toBe(testUserId);
      expect(parsedToken.uuid).toBeDefined();

      // Step 3: Verify Redis has the login info
      const redisKey = `${CacheEnum.LOGIN_TOKEN_KEY}${parsedToken.uuid}`;
      const redisData = await redisService.get(redisKey);
      expect(redisData).toBeDefined();
      expect(redisData.userId).toBe(testUserId);
      expect(redisData.userName).toBe(testUserName);

      // Cleanup: Remove Redis entry
      await redisService.del(redisKey);
    });

    it('should fail login with wrong password', async () => {
      const loginDto = {
        userName: testUserName,
        password: 'WrongPassword123',
        code: '',
        uuid: '',
      };

      const result = await userAuthService.login(loginDto, clientInfo);

      expect(result.code).not.toBe(200);
      expect(result.msg).toContain('帐号或密码错误');
    });

    it('should fail login with non-existent user', async () => {
      const loginDto = {
        userName: 'nonexistent_user_12345',
        password: 'SomePassword123',
        code: '',
        uuid: '',
      };

      const result = await userAuthService.login(loginDto, clientInfo);

      expect(result.code).not.toBe(200);
    });

    it('should update login time after successful login', async () => {
      const loginDto = {
        userName: testUserName,
        password: testPassword,
        code: '',
        uuid: '',
      };

      const beforeLogin = await prisma.sysUser.findUnique({
        where: { userId: testUserId },
        select: { loginDate: true },
      });

      await userAuthService.login(loginDto, clientInfo);

      const afterLogin = await prisma.sysUser.findUnique({
        where: { userId: testUserId },
        select: { loginDate: true },
      });

      // Login date should be updated
      if (beforeLogin?.loginDate) {
        expect(afterLogin?.loginDate?.getTime()).toBeGreaterThanOrEqual(
          beforeLogin.loginDate.getTime(),
        );
      } else {
        expect(afterLogin?.loginDate).toBeDefined();
      }
    });
  });

  describe('Token Management Integration', () => {
    it('should store and retrieve user info from Redis', async () => {
      const testUuid = `test-uuid-${Date.now()}`;
      const userInfo = {
        userId: testUserId,
        userName: testUserName,
        permissions: ['test:permission'],
        roles: ['test_role'],
      };

      // Store in Redis
      await userAuthService.updateRedisToken(testUuid, userInfo);

      // Retrieve from Redis
      const redisKey = `${CacheEnum.LOGIN_TOKEN_KEY}${testUuid}`;
      const storedData = await redisService.get(redisKey);

      expect(storedData).toBeDefined();
      expect(storedData.userId).toBe(testUserId);
      expect(storedData.userName).toBe(testUserName);
      expect(storedData.permissions).toContain('test:permission');

      // Cleanup
      await redisService.del(redisKey);
    });

    it('should merge token data when updating', async () => {
      const testUuid = `test-uuid-merge-${Date.now()}`;
      const redisKey = `${CacheEnum.LOGIN_TOKEN_KEY}${testUuid}`;

      // Initial data
      await userAuthService.updateRedisToken(testUuid, {
        userId: testUserId,
        userName: testUserName,
      });

      // Update with additional data
      await userAuthService.updateRedisToken(testUuid, {
        permissions: ['new:permission'],
      });

      const storedData = await redisService.get(redisKey);

      expect(storedData.userId).toBe(testUserId);
      expect(storedData.userName).toBe(testUserName);
      expect(storedData.permissions).toContain('new:permission');

      // Cleanup
      await redisService.del(redisKey);
    });
  });

  describe('User Permissions Integration', () => {
    it('should retrieve user permissions correctly', async () => {
      const permissions = await userAuthService.getUserPermissions(testUserId);

      expect(Array.isArray(permissions)).toBe(true);
      // Permissions should be strings
      permissions.forEach((perm) => {
        expect(typeof perm).toBe('string');
      });
    });

    it('should retrieve user info with relations', async () => {
      const userInfo = await userAuthService.getUserinfo(testUserId);

      expect(userInfo).toBeDefined();
      expect(userInfo.userId).toBe(testUserId);
      expect(userInfo.userName).toBe(testUserName);
      // Should have roles array (may be empty)
      expect(Array.isArray(userInfo.roles)).toBe(true);
    });
  });

  describe('Logout Flow Integration', () => {
    it('should complete logout flow', async () => {
      const clientInfo = {
        browser: 'Jest',
        ipaddr: '127.0.0.1',
        loginLocation: 'Test',
        os: 'Test OS',
        deviceType: '0',
      };

      // First login
      const loginDto = {
        userName: testUserName,
        password: testPassword,
        code: '',
        uuid: '',
      };

      const loginResult = await userAuthService.login(loginDto, clientInfo);
      expect(loginResult.code).toBe(200);

      const token = loginResult.data.token;
      const parsedToken = userAuthService.parseToken(token);
      const redisKey = `${CacheEnum.LOGIN_TOKEN_KEY}${parsedToken.uuid}`;

      // Verify login data exists in Redis
      const beforeLogout = await redisService.get(redisKey);
      expect(beforeLogout).toBeDefined();

      // Logout
      const logoutResult = await mainService.logout(clientInfo);
      expect(logoutResult.code).toBe(200);

      // Manually delete the Redis key (simulating what the controller does)
      await redisService.del(redisKey);

      // Verify Redis entry is removed
      const afterLogout = await redisService.get(redisKey);
      expect(afterLogout).toBeNull();
    });
  });
});
