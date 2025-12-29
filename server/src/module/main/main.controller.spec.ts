import { Test, TestingModule } from '@nestjs/testing';
import { MainController } from './main.controller';
import { MainService } from './main.service';
import { RedisService } from 'src/module/common/redis/redis.service';
import { ConfigService } from 'src/module/system/config/config.service';
import { createPrismaMock } from 'src/test-utils/prisma-mock';

describe('MainController', () => {
  let controller: MainController;
  let mainService: jest.Mocked<MainService>;
  let redisService: jest.Mocked<RedisService>;
  let configService: jest.Mocked<ConfigService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MainController],
      providers: [
        {
          provide: MainService,
          useValue: {
            login: jest.fn(),
            logout: jest.fn(),
            register: jest.fn(),
            getRouters: jest.fn(),
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
          provide: ConfigService,
          useValue: {
            getSystemConfigValue: jest.fn(),
          },
        },
      
      ],
      }).compile();

    controller = module.get<MainController>(MainController);
    mainService = module.get(MainService);
    redisService = module.get(RedisService);
    configService = module.get(ConfigService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('login', () => {
    it('should login successfully', async () => {
      const loginDto = {
        userName: 'admin',
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

      const result = await controller.login(loginDto, clientInfo as any);

      expect(result.code).toBe(200);
      expect(result.data.token).toBe('test-token');
      expect(mainService.login).toHaveBeenCalledWith(loginDto, clientInfo);
    });

    it('should return error when login fails', async () => {
      const loginDto = {
        userName: 'admin',
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

  describe('logout', () => {
    it('should logout successfully with token', async () => {
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

  describe('register', () => {
    it('should register successfully', async () => {
      const registerDto = {
        userName: 'newuser',
        password: 'password123',
        code: '1234',
        uuid: 'test-uuid',
      };

      mainService.register.mockResolvedValue({
        code: 200,
        msg: '注册成功',
      } as any);

      const result = await controller.register(registerDto as any);

      expect(result.code).toBe(200);
      expect(mainService.register).toHaveBeenCalledWith(registerDto);
    });

    it('should return error when registration fails', async () => {
      const registerDto = {
        userName: 'existinguser',
        password: 'password123',
        code: '1234',
        uuid: 'test-uuid',
      };

      mainService.register.mockResolvedValue({
        code: 400,
        msg: '用户名已存在',
      } as any);

      const result = await controller.register(registerDto as any);

      expect(result.code).toBe(400);
      expect(result.msg).toContain('用户名已存在');
    });
  });

  describe('registerUser', () => {
    it('should return true when registration is enabled', async () => {
      configService.getSystemConfigValue.mockResolvedValue('true');

      const result = await controller.registerUser();

      expect(result.code).toBe(200);
      expect(result.data).toBe(true);
    });

    it('should return false when registration is disabled', async () => {
      configService.getSystemConfigValue.mockResolvedValue('false');

      const result = await controller.registerUser();

      expect(result.code).toBe(200);
      expect(result.data).toBe(false);
    });
  });

  describe('captchaImage', () => {
    it('should return captcha when enabled', async () => {
      configService.getSystemConfigValue.mockResolvedValue('true');
      redisService.set.mockResolvedValue('OK');

      const result = await controller.captchaImage();

      expect(result.code).toBe(200);
      expect(result.data.captchaEnabled).toBe(true);
      expect(result.data.uuid).toBeTruthy();
      expect(result.data.img).toBeTruthy();
      expect(redisService.set).toHaveBeenCalled();
    });

    it('should return empty captcha when disabled', async () => {
      configService.getSystemConfigValue.mockResolvedValue('false');

      const result = await controller.captchaImage();

      expect(result.code).toBe(200);
      expect(result.data.captchaEnabled).toBe(false);
      expect(result.data.uuid).toBe('');
      expect(result.data.img).toBe('');
      expect(redisService.set).not.toHaveBeenCalled();
    });

    it('should handle captcha generation error', async () => {
      configService.getSystemConfigValue.mockResolvedValue('true');
      redisService.set.mockRejectedValue(new Error('Redis error'));

      const result = await controller.captchaImage();

      expect(result.code).toBe(500);
      expect(result.msg).toContain('生成验证码错误');
    });
  });

  describe('getInfo', () => {
    it('should return user info', async () => {
      const user = {
        user: {
          userId: 1,
          userName: 'admin',
          nickName: '管理员',
        },
        permissions: ['*:*:*'],
        roles: ['admin'],
      };

      const result = await controller.getInfo(user as any);

      expect(result.code).toBe(200);
      expect(result.data.user).toEqual(user.user);
      expect(result.data.permissions).toEqual(user.permissions);
      expect(result.data.roles).toEqual(user.roles);
    });
  });

  describe('getRouters', () => {
    it('should return user routers', async () => {
      const user = {
        user: { userId: 1 },
      };

      const mockRouters = [
        {
          path: '/system',
          name: 'System',
          component: 'Layout',
          children: [],
        },
      ];

      mainService.getRouters.mockResolvedValue({
        code: 200,
        data: mockRouters,
      } as any);

      const result = await controller.getRouters(user as any);

      expect(result.code).toBe(200);
      expect(result.data).toEqual(mockRouters);
      expect(mainService.getRouters).toHaveBeenCalledWith(1);
    });
  });
});
