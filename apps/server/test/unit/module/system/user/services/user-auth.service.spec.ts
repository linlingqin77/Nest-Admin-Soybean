/**
 * @file user-auth.service.spec.ts
 * @description Migrated from src/modules/users/services/user-auth.service.spec.ts
 * Unit tests for UserAuthService
 */
import { BusinessException } from '@/shared/exceptions';
import * as bcrypt from 'bcryptjs';

// Mock 装饰器 - 必须在导入 UserAuthService 之前
jest.mock('@/core/auth/decorators/redis.decorator', () => ({
  CacheEvict: () => () => {},
  Cacheable: () => () => {},
}));

jest.mock('@/core/auth/decorators/captcha.decorator', () => ({
  Captcha: () => () => {},
}));

// Mock bcrypt
jest.mock('bcryptjs', () => ({
  compareSync: jest.fn(),
  genSaltSync: jest.fn().mockReturnValue('salt'),
  hashSync: jest.fn().mockReturnValue('hashed-password'),
}));

// Mock GenerateUUID
jest.mock('@/shared/utils/index', () => ({
  GenerateUUID: jest.fn().mockReturnValue('test-uuid-123'),
  Uniq: jest.fn((arr) => [...new Set(arr)]),
}));

// 现在导入服务
import { Test, TestingModule } from '@nestjs/testing';
import { UserAuthService } from '@/modules/users/services/user-auth.service';
import { PrismaService } from '@/platform/prisma';
import { UserRepository } from '@/modules/users/user.repository';
import { JwtService } from '@nestjs/jwt';
import { RedisService } from '@/platform/redis/redis.service';
import { RoleService } from '@/modules/roles/role.service';
import { LoginSecurityService } from '@/core/auth/login-core.service';
import { TokenBlacklistService } from '@/core/auth/token-blacklist.service';

describe('UserAuthService', () => {
  let service: UserAuthService;
  let prismaMock: any;
  let userRepoMock: any;
  let jwtServiceMock: any;
  let redisServiceMock: any;
  let roleServiceMock: any;
  let loginSecurityServiceMock: any;
  let tokenBlacklistServiceMock: any;

  beforeEach(async () => {
    prismaMock = {
      sysUser: {
        update: jest.fn(),
        findFirst: jest.fn(),
      },
      sysDept: {
        findFirst: jest.fn(),
      },
      sysUserRole: {
        findMany: jest.fn(),
      },
      sysUserPost: {
        findMany: jest.fn(),
      },
      sysPost: {
        findMany: jest.fn(),
      },
    };

    userRepoMock = {
      findByUserName: jest.fn(),
      findById: jest.fn(),
      updateLoginTime: jest.fn(),
      create: jest.fn(),
    };

    jwtServiceMock = {
      sign: jest.fn().mockReturnValue('jwt-token'),
      verify: jest.fn(),
    };

    redisServiceMock = {
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
    };

    roleServiceMock = {
      getPermissionsByRoleIds: jest.fn(),
      findRoles: jest.fn(),
    };

    loginSecurityServiceMock = {
      validateBeforeLogin: jest.fn(),
      recordLoginFailure: jest.fn(),
      clearFailedAttempts: jest.fn(),
    };

    tokenBlacklistServiceMock = {
      getUserTokenVersion: jest.fn(),
      isBlacklisted: jest.fn(),
      isTokenVersionValid: jest.fn(),
    };

    const modules: TestingModule = await Test.createTestingModule({
      providers: [
        UserAuthService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: UserRepository, useValue: userRepoMock },
        { provide: JwtService, useValue: jwtServiceMock },
        { provide: RedisService, useValue: redisServiceMock },
        { provide: RoleService, useValue: roleServiceMock },
        { provide: LoginSecurityService, useValue: loginSecurityServiceMock },
        { provide: TokenBlacklistService, useValue: tokenBlacklistServiceMock },
      ],
    }).compile();

    service = modules.get<UserAuthService>(UserAuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('login', () => {
    const mockLoginDto = {
      userName: 'admin',
      password: 'password123',
      code: '1234',
      uuid: 'captcha-uuid',
    };

    const mockClientInfo = {
      browser: 'Chrome',
      ipaddr: '127.0.0.1',
      loginLocation: 'Local',
      os: 'Windows',
      deviceType: 'PC',
    };

    const mockUser = {
      userId: 1,
      userName: 'admin',
      password: 'hashed-password',
      status: '0',
      delFlag: '0',
      deptId: 1,
    };

    it('should return locked message when account is locked', async () => {
      loginSecurityServiceMock.validateBeforeLogin.mockResolvedValue({
        locked: true,
        message: '账户已被锁定',
      });

      const result = await service.login(mockLoginDto, mockClientInfo);

      expect(result.code).toBe(2005);
      expect(result.msg).toBe('账户已被锁定');
    });

    it('should return error when user not found', async () => {
      loginSecurityServiceMock.validateBeforeLogin.mockResolvedValue({ locked: false });
      userRepoMock.findByUserName.mockResolvedValue(null);
      loginSecurityServiceMock.recordLoginFailure.mockResolvedValue({
        isLocked: false,
        remainingAttempts: 4,
      });

      const result = await service.login(mockLoginDto, mockClientInfo);

      expect(result.code).toBe(1000);
    });

    it('should return error when password is wrong', async () => {
      loginSecurityServiceMock.validateBeforeLogin.mockResolvedValue({ locked: false });
      userRepoMock.findByUserName.mockResolvedValue(mockUser);
      (bcrypt.compareSync as jest.Mock).mockReturnValue(false);
      loginSecurityServiceMock.recordLoginFailure.mockResolvedValue({
        isLocked: false,
        remainingAttempts: 3,
      });

      const result = await service.login(mockLoginDto, mockClientInfo);

      expect(result.code).toBe(1000);
      expect(result.msg).toContain('还剩 3 次尝试机会');
    });

    it('should lock account after too many failed attempts', async () => {
      loginSecurityServiceMock.validateBeforeLogin.mockResolvedValue({ locked: false });
      userRepoMock.findByUserName.mockResolvedValue(mockUser);
      (bcrypt.compareSync as jest.Mock).mockReturnValue(false);
      loginSecurityServiceMock.recordLoginFailure.mockResolvedValue({
        isLocked: true,
        remainingAttempts: 0,
      });

      const result = await service.login(mockLoginDto, mockClientInfo);

      expect(result.code).toBe(2005);
    });

    it('should login successfully with valid credentials', async () => {
      loginSecurityServiceMock.validateBeforeLogin.mockResolvedValue({ locked: false });
      userRepoMock.findByUserName.mockResolvedValue(mockUser);
      (bcrypt.compareSync as jest.Mock).mockReturnValue(true);
      userRepoMock.findById.mockResolvedValue(mockUser);
      prismaMock.sysDept.findFirst.mockResolvedValue({ deptName: 'IT' });
      prismaMock.sysUserRole.findMany.mockResolvedValue([{ roleId: 1 }]);
      prismaMock.sysUserPost.findMany.mockResolvedValue([]);
      roleServiceMock.getPermissionsByRoleIds.mockResolvedValue([{ perms: 'system:user:list' }]);
      roleServiceMock.findRoles.mockResolvedValue([{ roleKey: 'admin' }]);
      tokenBlacklistServiceMock.getUserTokenVersion.mockResolvedValue(1);
      redisServiceMock.get.mockResolvedValue(null);

      const result = await service.login(mockLoginDto, mockClientInfo);

      expect(result.code).toBe(200);
      expect(result.data.token).toBe('jwt-token');
      expect(loginSecurityServiceMock.clearFailedAttempts).toHaveBeenCalledWith('admin');
    });

    it('should return error when user is deleted', async () => {
      loginSecurityServiceMock.validateBeforeLogin.mockResolvedValue({ locked: false });
      userRepoMock.findByUserName.mockResolvedValue(mockUser);
      (bcrypt.compareSync as jest.Mock).mockReturnValue(true);
      userRepoMock.findById.mockResolvedValue({ ...mockUser, delFlag: '1' });
      prismaMock.sysUserRole.findMany.mockResolvedValue([]);
      prismaMock.sysUserPost.findMany.mockResolvedValue([]);

      const result = await service.login(mockLoginDto, mockClientInfo);

      expect(result.code).toBe(1000);
      expect(result.msg).toContain('禁用');
    });

    it('should return error when user is stopped', async () => {
      loginSecurityServiceMock.validateBeforeLogin.mockResolvedValue({ locked: false });
      userRepoMock.findByUserName.mockResolvedValue(mockUser);
      (bcrypt.compareSync as jest.Mock).mockReturnValue(true);
      userRepoMock.findById.mockResolvedValue({ ...mockUser, status: '1' });
      prismaMock.sysUserRole.findMany.mockResolvedValue([]);
      prismaMock.sysUserPost.findMany.mockResolvedValue([]);

      const result = await service.login(mockLoginDto, mockClientInfo);

      expect(result.code).toBe(1000);
      expect(result.msg).toContain('停用');
    });
  });

  describe('register', () => {
    const mockRegisterDto = {
      userName: 'newuser',
      password: 'password123',
    };

    it('should register user successfully', async () => {
      userRepoMock.findByUserName.mockResolvedValue(null);
      userRepoMock.create.mockResolvedValue({ userId: 1 });

      const result = await service.register(mockRegisterDto);

      expect(result.code).toBe(200);
      expect(userRepoMock.create).toHaveBeenCalled();
    });

    it('should return error when username already exists', async () => {
      userRepoMock.findByUserName.mockResolvedValue({ userId: 1 });

      const result = await service.register(mockRegisterDto);

      expect(result.code).toBe(1000);
      expect(result.msg).toContain('注册账号已存在');
    });
  });

  describe('createToken', () => {
    it('should create JWT token', () => {
      const payload = { uuid: 'test-uuid', userId: 1, tokenVersion: 1 };

      const token = service.createToken(payload);

      expect(token).toBe('jwt-token');
      expect(jwtServiceMock.sign).toHaveBeenCalledWith(payload);
    });
  });

  describe('parseToken', () => {
    it('should parse valid token', () => {
      jwtServiceMock.verify.mockReturnValue({ userId: 1, uuid: 'test-uuid' });

      const result = service.parseToken('Bearer jwt-token');

      expect(result).toEqual({ userId: 1, uuid: 'test-uuid' });
    });

    it('should return null for empty token', () => {
      const result = service.parseToken('');

      expect(result).toBeNull();
    });

    it('should return null for invalid token', () => {
      jwtServiceMock.verify.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      const result = service.parseToken('Bearer invalid-token');

      expect(result).toBeNull();
    });
  });

  describe('updateRedisToken', () => {
    it('should create new token entry', async () => {
      redisServiceMock.get.mockResolvedValue(null);

      await service.updateRedisToken('token-uuid', { userId: 1 });

      expect(redisServiceMock.set).toHaveBeenCalled();
    });

    it('should merge with existing token data', async () => {
      redisServiceMock.get.mockResolvedValue({ userId: 1, userName: 'admin' });

      await service.updateRedisToken('token-uuid', { permissions: ['read'] });

      expect(redisServiceMock.set).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ userId: 1, userName: 'admin', permissions: ['read'] }),
        expect.any(Number),
      );
    });
  });

  describe('getRoleIds', () => {
    it('should return empty array for empty user ids', async () => {
      const result = await service.getRoleIds([]);

      expect(result).toEqual([]);
    });

    it('should return unique role ids', async () => {
      prismaMock.sysUserRole.findMany.mockResolvedValue([{ roleId: 1 }, { roleId: 2 }, { roleId: 1 }]);

      const result = await service.getRoleIds([1, 2]);

      expect(result).toEqual([1, 2]);
    });
  });

  describe('getUserPermissions', () => {
    it('should return user permissions', async () => {
      prismaMock.sysUserRole.findMany.mockResolvedValue([{ roleId: 1 }]);
      roleServiceMock.getPermissionsByRoleIds.mockResolvedValue([
        { perms: 'system:user:list' },
        { perms: 'system:user:add' },
      ]);

      const result = await service.getUserPermissions(1);

      expect(result).toContain('system:user:list');
      expect(result).toContain('system:user:add');
    });
  });

  describe('getUserinfo', () => {
    it('should return user with relations', async () => {
      userRepoMock.findById.mockResolvedValue({
        userId: 1,
        userName: 'admin',
        deptId: 1,
      });
      prismaMock.sysDept.findFirst.mockResolvedValue({ deptId: 1, deptName: 'IT' });
      prismaMock.sysUserRole.findMany.mockResolvedValue([{ roleId: 1 }]);
      prismaMock.sysUserPost.findMany.mockResolvedValue([{ postId: 1 }]);
      prismaMock.sysPost.findMany.mockResolvedValue([{ postId: 1, postName: 'Manager' }]);
      roleServiceMock.findRoles.mockResolvedValue([{ roleId: 1, roleName: 'Admin' }]);

      const result = await service.getUserinfo(1);

      expect(result.userId).toBe(1);
      expect(result.dept).toBeDefined();
      expect(result.roles).toHaveLength(1);
      expect(result.posts).toHaveLength(1);
    });

    it('should throw error when user not found', async () => {
      userRepoMock.findById.mockResolvedValue(null);

      await expect(service.getUserinfo(999)).rejects.toThrow(BusinessException);
    });

    it('should handle user without dept', async () => {
      userRepoMock.findById.mockResolvedValue({
        userId: 1,
        userName: 'admin',
        deptId: null,
      });
      prismaMock.sysUserRole.findMany.mockResolvedValue([]);
      prismaMock.sysUserPost.findMany.mockResolvedValue([]);

      const result = await service.getUserinfo(1);

      expect(result.dept).toBeNull();
    });
  });
});
