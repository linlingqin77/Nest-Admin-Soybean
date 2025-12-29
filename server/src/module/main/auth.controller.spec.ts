import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { MainService } from './main.service';
import { RedisService } from 'src/module/common/redis/redis.service';
import { ConfigService as SysConfigService } from 'src/module/system/config/config.service';
import { AppConfigService } from 'src/config/app-config.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { createPrismaMock } from 'src/test-utils/prisma-mock';
import { StatusEnum } from 'src/common/enum';
import { TenantContext } from 'src/common/tenant';

describe('AuthController', () => {
  let controller: AuthController;
  let mainService: jest.Mocked<MainService>;
  let redisService: jest.Mocked<RedisService>;
  let sysConfigService: jest.Mocked<SysConfigService>;
  let appConfigService: jest.Mocked<AppConfigService>;
  let prisma: jest.Mocked<PrismaService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: MainService,
          useValue: {
            login: jest.fn(),
            logout: jest.fn(),
            register: jest.fn(),
          },
        },
        {
          provide: RedisService,
          useValue: {
            del: jest.fn(),
            set: jest.fn(),
            get: jest.fn(),
          },
        },
        {
          provide: SysConfigService,
          useValue: {
            getSystemConfigValue: jest.fn(),
          },
        },
        {
          provide: AppConfigService,
          useValue: {
            tenant: { enabled: false },
            jwt: { expiresin: '7d', refreshExpiresIn: '30d' },
          },
        },
        {
          provide: PrismaService,
          useValue: createPrismaMock(),
        },
      
      ],
      }).compile();

    controller = module.get<AuthController>(AuthController);
    mainService = module.get(MainService);
    redisService = module.get(RedisService);
    sysConfigService = module.get(SysConfigService);
    appConfigService = module.get(AppConfigService);
    prisma = module.get(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getTenantList', () => {
    it('should return tenant list when tenant is enabled', async () => {
      appConfigService.tenant.enabled = true;
      const mockTenants = [
        {
          tenantId: '000000',
          companyName: '默认租户',
          domain: 'default.com',
        },
        {
          tenantId: '000001',
          companyName: '测试租户',
          domain: 'test.com',
        },
      ];

      (prisma.sysTenant.findMany as jest.Mock).mockResolvedValue(mockTenants as any);

      const result = await controller.getTenantList();

      expect(result.code).toBe(200);
      expect(result.data.tenantEnabled).toBe(true);
      expect(result.data.voList).toHaveLength(2);
      expect(result.data.voList[0].tenantId).toBe('000000');
    });

    it('should return empty list when tenant is disabled', async () => {
      appConfigService.tenant.enabled = false;

      const result = await controller.getTenantList();

      expect(result.code).toBe(200);
      expect(result.data.tenantEnabled).toBe(false);
      expect(result.data.voList).toHaveLength(0);
    });

    it('should return default tenant when table does not exist', async () => {
      appConfigService.tenant.enabled = true;
      (prisma.sysTenant.findMany as jest.Mock).mockRejectedValue(new Error('Table does not exist'));

      const result = await controller.getTenantList();

      expect(result.code).toBe(200);
      expect(result.data.voList).toHaveLength(1);
      expect(result.data.voList[0].tenantId).toBe(TenantContext.SUPER_TENANT_ID);
      expect(result.data.voList[0].companyName).toBe('默认租户');
    });
  });

  describe('getCaptchaCode', () => {
    it('should return captcha when enabled', async () => {
      sysConfigService.getSystemConfigValue.mockResolvedValue('true');
      redisService.set.mockResolvedValue('OK');

      const result = await controller.getCaptchaCode();

      expect(result.code).toBe(200);
      expect(result.data.captchaEnabled).toBe(true);
      expect(result.data.uuid).toBeTruthy();
      expect(result.data.img).toBeTruthy();
      expect(redisService.set).toHaveBeenCalled();
    });

    it('should return empty captcha when disabled', async () => {
      sysConfigService.getSystemConfigValue.mockResolvedValue('false');

      const result = await controller.getCaptchaCode();

      expect(result.code).toBe(200);
      expect(result.data.captchaEnabled).toBe(false);
      expect(result.data.uuid).toBe('');
      expect(result.data.img).toBe('');
      expect(redisService.set).not.toHaveBeenCalled();
    });

    it('should handle captcha generation error', async () => {
      sysConfigService.getSystemConfigValue.mockResolvedValue('true');
      redisService.set.mockRejectedValue(new Error('Redis error'));

      const result = await controller.getCaptchaCode();

      expect(result.code).toBe(500);
      expect(result.msg).toContain('生成验证码错误');
    });
  });

  describe('login', () => {
    it('should login successfully with valid credentials', async () => {
      const loginDto = {
        username: 'admin',
        password: 'admin123',
        code: '1234',
        uuid: 'test-uuid',
        clientId: 'pc',
      };

      const clientInfo = {
        ipaddr: '127.0.0.1',
        browser: 'Chrome',
        os: 'Windows',
      };

      mainService.login.mockResolvedValue({
        code: 200,
        data: { token: 'test-token' },
        msg: '登录成功',
      } as any);

      appConfigService.jwt.expiresin = '7d';
      appConfigService.jwt.refreshExpiresIn = '30d';

      const result = await controller.login(loginDto, clientInfo as any);

      expect(result.code).toBe(200);
      expect(result.data.access_token).toBe('test-token');
      expect(result.data.refresh_token).toBe('test-token');
      expect(result.data.client_id).toBe('pc');
    });

    it('should use tenant from header', async () => {
      const loginDto = {
        username: 'admin',
        password: 'admin123',
        code: '1234',
        uuid: 'test-uuid',
      };

      const clientInfo = {
        ipaddr: '127.0.0.1',
        browser: 'Chrome',
        os: 'Windows',
      };

      mainService.login.mockResolvedValue({
        code: 200,
        data: { token: 'test-token' },
        msg: '登录成功',
      } as any);

      const result = await controller.login(loginDto, clientInfo as any, '000001');

      expect(result.code).toBe(200);
      expect(mainService.login).toHaveBeenCalled();
    });

    it('should return error when login fails', async () => {
      const loginDto = {
        username: 'admin',
        password: 'wrong-password',
        code: '1234',
        uuid: 'test-uuid',
      };

      const clientInfo = {
        ipaddr: '127.0.0.1',
        browser: 'Chrome',
        os: 'Windows',
      };

      mainService.login.mockResolvedValue({
        code: 401,
        msg: '用户名或密码错误',
      } as any);

      const result = await controller.login(loginDto, clientInfo as any);

      expect(result.code).toBe(401);
      expect(result.msg).toContain('用户名或密码错误');
    });
  });

  describe('register', () => {
    it('should register successfully', async () => {
      const registerDto = {
        username: 'newuser',
        password: 'password123',
        confirmPassword: 'password123',
        code: '1234',
        uuid: 'test-uuid',
      };

      mainService.register.mockResolvedValue({
        code: 200,
        msg: '注册成功',
      } as any);

      const result = await controller.register(registerDto);

      expect(result.code).toBe(200);
      expect(mainService.register).toHaveBeenCalled();
    });

    it('should fail when passwords do not match', async () => {
      const registerDto = {
        username: 'newuser',
        password: 'password123',
        confirmPassword: 'different-password',
        code: '1234',
        uuid: 'test-uuid',
      };

      const result = await controller.register(registerDto);

      expect(result.code).toBe(400);
      expect(result.msg).toContain('两次输入的密码不一致');
      expect(mainService.register).not.toHaveBeenCalled();
    });

    it('should use tenant from header', async () => {
      const registerDto = {
        username: 'newuser',
        password: 'password123',
        confirmPassword: 'password123',
        code: '1234',
        uuid: 'test-uuid',
      };

      mainService.register.mockResolvedValue({
        code: 200,
        msg: '注册成功',
      } as any);

      const result = await controller.register(registerDto, '000001');

      expect(result.code).toBe(200);
      expect(mainService.register).toHaveBeenCalled();
    });
  });

  describe('logout', () => {
    it('should logout successfully', async () => {
      const user = {
        token: 'test-token',
        user: { userId: 1 },
      };

      const clientInfo = {
        ipaddr: '127.0.0.1',
        browser: 'Chrome',
        os: 'Windows',
      };

      mainService.logout.mockResolvedValue({
        code: 200,
        msg: '退出成功',
      } as any);

      redisService.del.mockResolvedValue(1);

      const result = await controller.logout(user as any, clientInfo as any);

      expect(result.code).toBe(200);
      expect(redisService.del).toHaveBeenCalled();
      expect(mainService.logout).toHaveBeenCalledWith(clientInfo);
    });

    it('should logout without token', async () => {
      const user = {
        user: { userId: 1 },
      };

      const clientInfo = {
        ipaddr: '127.0.0.1',
        browser: 'Chrome',
        os: 'Windows',
      };

      mainService.logout.mockResolvedValue({
        code: 200,
        msg: '退出成功',
      } as any);

      const result = await controller.logout(user as any, clientInfo as any);

      expect(result.code).toBe(200);
      expect(redisService.del).not.toHaveBeenCalled();
      expect(mainService.logout).toHaveBeenCalledWith(clientInfo);
    });
  });

  describe('socialCallback', () => {
    it('should return not implemented error', async () => {
      const socialDto = {
        provider: 'github',
        code: 'auth-code',
      };

      const result = await controller.socialCallback(socialDto as any);

      expect(result.code).toBe(501);
      expect(result.msg).toContain('社交登录功能暂未实现');
    });
  });

  describe('getPublicKey', () => {
    it('should return public key', async () => {
      const result = await controller.getPublicKey();

      expect(result.code).toBe(200);
      expect(result.data).toHaveProperty('publicKey');
    });
  });
});
