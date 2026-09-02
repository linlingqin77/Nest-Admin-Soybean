/**
 * @file Auth Controller Unit Tests
 * @description Migrated from src/modules/auth/auth.controller.spec.ts
 */
import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from '@/modules/auth/auth.controller';
import { MainService } from '@/modules/auth/main.service';
import { RedisService } from '@/platform/redis/redis.service';
import { ConfigService as SysConfigService } from '@/modules/configs/config.service';
import { AppConfigService } from '@/platform/config/app-config.service';
import { PrismaService } from '@/platform/prisma';
import { TokenBlacklistService } from '@/core/auth/token-blacklist.service';
import { Result, ResponseCode } from '@/shared/response';

describe('AuthController', () => {
  let controller: AuthController;
  let mainServiceMock: any;
  let redisServiceMock: any;
  let sysConfigServiceMock: any;
  let configMock: any;
  let prismaMock: any;
  let tokenBlacklistMock: any;

  beforeEach(async () => {
    mainServiceMock = {
      login: jest.fn(),
      register: jest.fn(),
      logout: jest.fn().mockResolvedValue(Result.ok()),
    };

    redisServiceMock = {
      set: jest.fn().mockResolvedValue('OK'),
      del: jest.fn().mockResolvedValue(1),
    };

    sysConfigServiceMock = {
      getSystemConfigValue: jest.fn().mockResolvedValue('false'),
    };

    configMock = {
      tenant: { enabled: false },
      jwt: { expiresin: '2h', refreshExpiresIn: '7d' },
    };

    prismaMock = {
      sysTenant: {
        findMany: jest.fn().mockResolvedValue([]),
      },
    };

    tokenBlacklistMock = {
      addToBlacklist: jest.fn().mockResolvedValue(undefined),
    };

    const modules: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        { provide: MainService, useValue: mainServiceMock },
        { provide: RedisService, useValue: redisServiceMock },
        { provide: SysConfigService, useValue: sysConfigServiceMock },
        { provide: AppConfigService, useValue: configMock },
        { provide: PrismaService, useValue: prismaMock },
        { provide: TokenBlacklistService, useValue: tokenBlacklistMock },
      ],
    }).compile();

    controller = modules.get<AuthController>(AuthController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getTenantList', () => {
    it('should return empty list when tenant is disabled', async () => {
      configMock.tenant.enabled = false;

      const result = await controller.getTenantList();

      expect(result.code).toBe(200);
      expect(result.data.tenantEnabled).toBe(false);
      expect(result.data.voList).toEqual([]);
    });

    it('should return tenant list when tenant is enabled', async () => {
      configMock.tenant.enabled = true;
      prismaMock.sysTenant.findMany.mockResolvedValue([
        { tenantId: '001', companyName: 'Company A', domain: 'a.com' },
        { tenantId: '002', companyName: 'Company B', domain: null },
      ]);

      const result = await controller.getTenantList();

      expect(result.code).toBe(200);
      expect(result.data.tenantEnabled).toBe(true);
      expect(result.data.voList).toHaveLength(2);
      expect(result.data.voList[0].tenantId).toBe('001');
      expect(result.data.voList[1].domain).toBe('');
    });

    it('should return default tenant on database error', async () => {
      configMock.tenant.enabled = true;
      prismaMock.sysTenant.findMany.mockRejectedValue(new Error('DB error'));

      const result = await controller.getTenantList();

      expect(result.code).toBe(200);
      expect(result.data.voList).toHaveLength(1);
      expect(result.data.voList[0].companyName).toBe('默认租户');
    });
  });

  describe('getCaptchaCode', () => {
    it('should return disabled captcha when platform/config is false', async () => {
      sysConfigServiceMock.getSystemConfigValue.mockResolvedValue('false');

      const result = await controller.getCaptchaCode();

      expect(result.code).toBe(200);
      expect(result.data.captchaEnabled).toBe(false);
      expect(result.data.uuid).toBe('');
      expect(result.data.img).toBe('');
    });

    it('should return captcha when enabled', async () => {
      sysConfigServiceMock.getSystemConfigValue.mockResolvedValue('true');

      const result = await controller.getCaptchaCode();

      expect(result.code).toBe(200);
      expect(result.data.captchaEnabled).toBe(true);
      expect(result.data.uuid).toBeTruthy();
      expect(result.data.img).toBeTruthy();
      expect(redisServiceMock.set).toHaveBeenCalled();
    });
  });

  describe('login', () => {
    const loginDto = {
      username: 'admin',
      password: 'password123',
      code: '1234',
      uuid: 'test-uuid',
    };
    const clientInfo = {
      ipaddr: '127.0.0.1',
      browser: 'Chrome',
      os: 'Windows',
      loginLocation: '',
      deviceType: '0',
    };

    it('should login successfully', async () => {
      mainServiceMock.login.mockResolvedValue(Result.ok({ token: 'jwt-token' }));

      const result = await controller.login(loginDto, clientInfo);

      expect(result.code).toBe(200);
      expect(result.data.access_token).toBe('jwt-token');
      expect(result.data.expire_in).toBe(7200); // 2h = 7200s
    });

    it('should use header tenant-id over body', async () => {
      mainServiceMock.login.mockResolvedValue(Result.ok({ token: 'jwt-token' }));

      await controller.login({ ...loginDto, tenantId: 'body-tenant' }, clientInfo, 'header-tenant');

      expect(mainServiceMock.login).toHaveBeenCalled();
    });

    it('should return error on login failure', async () => {
      mainServiceMock.login.mockResolvedValue(Result.fail(ResponseCode.ACCOUNT_LOCKED, '账号已锁定'));

      const result = await controller.login(loginDto, clientInfo);

      expect(result.code).toBe(ResponseCode.ACCOUNT_LOCKED);
    });
  });

  describe('register', () => {
    const registerDto = {
      username: 'newuser',
      password: 'password123',
      confirmPassword: 'password123',
      code: '1234',
      uuid: 'test-uuid',
    };

    it('should register successfully', async () => {
      mainServiceMock.register.mockResolvedValue(Result.ok());

      const result = await controller.register(registerDto);

      expect(result.code).toBe(200);
    });

    it('should fail when passwords do not match', async () => {
      const result = await controller.register({
        ...registerDto,
        confirmPassword: 'different',
      });

      expect(result.code).toBe(ResponseCode.BAD_REQUEST);
      expect(result.msg).toContain('密码不一致');
    });
  });

  describe('logout', () => {
    it('should logout successfully with token', async () => {
      const user = { userId: 1, token: 'test-token' };
      const clientInfo = { ipaddr: '127.0.0.1', browser: 'Chrome', os: 'Windows', loginLocation: '', deviceType: '0' };

      const result = await controller.logout(user as any, clientInfo);

      expect(redisServiceMock.del).toHaveBeenCalled();
      expect(tokenBlacklistMock.addToBlacklist).toHaveBeenCalledWith('test-token');
      expect(result.code).toBe(200);
    });

    it('should logout without token', async () => {
      const clientInfo = { ipaddr: '127.0.0.1', browser: 'Chrome', os: 'Windows', loginLocation: '', deviceType: '0' };

      const result = await controller.logout(null as any, clientInfo);

      expect(redisServiceMock.del).not.toHaveBeenCalled();
      expect(result.code).toBe(200);
    });
  });

  describe('socialCallback', () => {
    it('should return not implemented', async () => {
      const result = await controller.socialCallback({
        source: 'github',
        socialCode: 'auth-code',
        socialState: 'state',
      });

      expect(result.code).toBe(ResponseCode.NOT_IMPLEMENTED);
    });
  });

  describe('getPublicKey', () => {
    it('should return public key', async () => {
      const result = await controller.getPublicKey();

      expect(result.code).toBe(200);
      expect(result.data).toHaveProperty('publicKey');
    });
  });

  describe('parseExpiresIn', () => {
    it('should parse hours correctly', async () => {
      configMock.jwt.expiresin = '2h';
      mainServiceMock.login.mockResolvedValue(Result.ok({ token: 'token' }));

      const result = await controller.login({ username: 'test', password: 'test' }, {} as any);

      expect(result.data.expire_in).toBe(7200);
    });

    it('should parse days correctly', async () => {
      configMock.jwt.refreshExpiresIn = '7d';
      mainServiceMock.login.mockResolvedValue(Result.ok({ token: 'token' }));

      const result = await controller.login({ username: 'test', password: 'test' }, {} as any);

      expect(result.data.refresh_expire_in).toBe(604800);
    });

    it('should parse minutes correctly', async () => {
      configMock.jwt.expiresin = '30m';
      mainServiceMock.login.mockResolvedValue(Result.ok({ token: 'token' }));

      const result = await controller.login({ username: 'test', password: 'test' }, {} as any);

      expect(result.data.expire_in).toBe(1800);
    });

    it('should parse seconds correctly', async () => {
      configMock.jwt.expiresin = '3600s';
      mainServiceMock.login.mockResolvedValue(Result.ok({ token: 'token' }));

      const result = await controller.login({ username: 'test', password: 'test' }, {} as any);

      expect(result.data.expire_in).toBe(3600);
    });

    it('should default to 3600 for invalid format', async () => {
      configMock.jwt.expiresin = 'invalid';
      mainServiceMock.login.mockResolvedValue(Result.ok({ token: 'token' }));

      const result = await controller.login({ username: 'test', password: 'test' }, {} as any);

      expect(result.data.expire_in).toBe(3600);
    });
  });
});
