/**
 * @file Main Controller Unit Tests
 * @description Migrated from src/modules/auth/main.controller.spec.ts
 */
import { Test, TestingModule } from '@nestjs/testing';
import { MainController } from '@/modules/auth/main.controller';
import { MainService } from '@/modules/auth/main.service';
import { RedisService } from '@/platform/redis/redis.service';
import { ConfigService } from '@/modules/configs/config.service';
import { Result } from '@/shared/response';

describe('MainController', () => {
  let controller: MainController;
  let mainServiceMock: any;
  let redisServiceMock: any;
  let configServiceMock: any;

  beforeEach(async () => {
    mainServiceMock = {
      login: jest.fn().mockResolvedValue(Result.ok({ token: 'jwt-token' })),
      logout: jest.fn().mockResolvedValue(Result.ok()),
      register: jest.fn().mockResolvedValue(Result.ok()),
      getRouters: jest.fn().mockResolvedValue(Result.ok([])),
    };

    redisServiceMock = {
      set: jest.fn().mockResolvedValue('OK'),
      del: jest.fn().mockResolvedValue(1),
    };

    configServiceMock = {
      getSystemConfigValue: jest.fn().mockResolvedValue('false'),
    };

    const modules: TestingModule = await Test.createTestingModule({
      controllers: [MainController],
      providers: [
        { provide: MainService, useValue: mainServiceMock },
        { provide: RedisService, useValue: redisServiceMock },
        { provide: ConfigService, useValue: configServiceMock },
      ],
    }).compile();

    controller = modules.get<MainController>(MainController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('login', () => {
    it('should login successfully', async () => {
      const loginDto = { userName: 'admin', password: 'password', code: '1234', uuid: 'test-uuid' };
      const clientInfo = { ipaddr: '127.0.0.1', browser: 'Chrome', os: 'Windows', loginLocation: '', deviceType: '0' };

      const result = await controller.login(loginDto, clientInfo);

      expect(result.code).toBe(200);
      expect(mainServiceMock.login).toHaveBeenCalledWith(loginDto, clientInfo);
    });
  });

  describe('logout', () => {
    it('should logout with token', async () => {
      const user = { token: 'test-token', user: { userId: 1 } };
      const clientInfo = { ipaddr: '127.0.0.1', browser: 'Chrome', os: 'Windows', loginLocation: '', deviceType: '0' };

      const result = await controller.logout(user as any, clientInfo);

      expect(result.code).toBe(200);
      expect(redisServiceMock.del).toHaveBeenCalled();
      expect(mainServiceMock.logout).toHaveBeenCalledWith(clientInfo);
    });

    it('should logout without token', async () => {
      const clientInfo = { ipaddr: '127.0.0.1', browser: 'Chrome', os: 'Windows', loginLocation: '', deviceType: '0' };

      const result = await controller.logout(null as any, clientInfo);

      expect(result.code).toBe(200);
      expect(redisServiceMock.del).not.toHaveBeenCalled();
    });
  });

  describe('register', () => {
    it('should register successfully', async () => {
      const registerDto = { userName: 'newuser', password: 'password', code: '1234', uuid: 'test-uuid' };

      const result = await controller.register(registerDto);

      expect(result.code).toBe(200);
      expect(mainServiceMock.register).toHaveBeenCalledWith(registerDto);
    });
  });

  describe('registerUser', () => {
    it('should return false when registration is disabled', async () => {
      configServiceMock.getSystemConfigValue.mockResolvedValue('false');

      const result = await controller.registerUser();

      expect(result.code).toBe(200);
      expect(result.data).toBe(false);
    });

    it('should return true when registration is enabled', async () => {
      configServiceMock.getSystemConfigValue.mockResolvedValue('true');

      const result = await controller.registerUser();

      expect(result.code).toBe(200);
      expect(result.data).toBe(true);
    });
  });

  describe('captchaImage', () => {
    it('should return disabled captcha', async () => {
      configServiceMock.getSystemConfigValue.mockResolvedValue('false');

      const result = await controller.captchaImage();

      expect(result.code).toBe(200);
      expect(result.data!.captchaEnabled).toBe(false);
      expect(result.data!.img).toBe('');
      expect(result.data!.uuid).toBe('');
    });

    it('should return captcha when enabled', async () => {
      configServiceMock.getSystemConfigValue.mockResolvedValue('true');

      const result = await controller.captchaImage();

      expect(result.code).toBe(200);
      expect(result.data!.captchaEnabled).toBe(true);
      expect(result.data!.img).toBeTruthy();
      expect(result.data!.uuid).toBeTruthy();
      expect(redisServiceMock.set).toHaveBeenCalled();
    });
  });

  describe('getInfo', () => {
    it('should return user info', async () => {
      const user = {
        permissions: ['*:*:*'],
        roles: ['admin'],
        user: { userId: 1, userName: 'admin' },
      };

      const result = await controller.getInfo(user as any);

      expect(result.code).toBe(200);
      expect(result.permissions).toEqual(['*:*:*']);
      expect(result.roles).toEqual(['admin']);
      expect(result.user.userId).toBe(1);
    });
  });

  describe('getRouters', () => {
    it('should return routers', async () => {
      const user = { user: { userId: 1 } };
      mainServiceMock.getRouters.mockResolvedValue(Result.ok([{ path: '/dashboard' }]));

      const result = await controller.getRouters(user as any);

      expect(result.code).toBe(200);
      expect(mainServiceMock.getRouters).toHaveBeenCalledWith(1);
    });
  });
});
