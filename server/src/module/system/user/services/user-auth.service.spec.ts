import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { UserAuthService } from './user-auth.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { RedisService } from 'src/module/common/redis/redis.service';
import { RoleService } from '../../role/role.service';
import { UserRepository } from '../user.repository';
import { createPrismaMock } from 'src/test-utils/prisma-mock';
import { StatusEnum, DelFlagEnum } from 'src/common/enum';
import { ResponseCode } from 'src/common/response';
import { ConfigService } from '../../config/config.service';
import * as bcrypt from 'bcryptjs';

describe('UserAuthService', () => {
  let service: UserAuthService;
  let prisma: ReturnType<typeof createPrismaMock>;
  let redis: jest.Mocked<RedisService>;
  let jwt: jest.Mocked<JwtService>;
  let userRepo: jest.Mocked<UserRepository>;
  let roleService: jest.Mocked<RoleService>;

  const mockUser = {
    userId: 1,
    tenantId: '000000',
    deptId: 100,
    userName: 'testuser',
    nickName: '测试用户',
    userType: 'SYSTEM' as any,
    email: 'test@example.com',
    phonenumber: '13800138000',
    sex: 'MALE' as any,
    avatar: '',
    password: bcrypt.hashSync('password123', 10),
    status: StatusEnum.NORMAL,
    delFlag: DelFlagEnum.NORMAL,
    loginIp: '127.0.0.1',
    loginDate: new Date(),
    createBy: 'admin',
    createTime: new Date(),
    updateBy: 'admin',
    updateTime: new Date(),
    remark: null,
  };

  const mockClientInfo = {
    ipaddr: '127.0.0.1',
    browser: 'Chrome',
    os: 'Windows',
    loginLocation: 'Local',
    deviceType: 'PC',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserAuthService,
        {
          provide: PrismaService,
          useValue: createPrismaMock(),
        },
        {
          provide: RedisService,
          useValue: {
            get: jest.fn(),
            set: jest.fn(),
            del: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn(),
            verify: jest.fn(),
          },
        },
        {
          provide: UserRepository,
          useValue: {
            findByUserName: jest.fn(),
            findById: jest.fn(),
            updateLoginTime: jest.fn(),
            create: jest.fn(),
          },
        },
        {
          provide: RoleService,
          useValue: {
            getPermissionsByRoleIds: jest.fn(),
            findRoles: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            getConfigValue: jest.fn().mockResolvedValue('false'),
            getSystemConfigValue: jest.fn().mockResolvedValue('false'),
          },
        },
      ],
    }).compile();

    service = module.get<UserAuthService>(UserAuthService);
    prisma = module.get(PrismaService);
    redis = module.get(RedisService);
    jwt = module.get(JwtService);
    userRepo = module.get(UserRepository);
    roleService = module.get(RoleService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('login', () => {
    it('should login successfully with valid credentials', async () => {
      const loginDto = { userName: 'testuser', password: 'password123', code: '1234', uuid: 'test-uuid' };
      
      userRepo.findByUserName.mockResolvedValue(mockUser);
      userRepo.findById.mockResolvedValue(mockUser);
      (prisma.sysDept.findFirst as jest.Mock).mockResolvedValue({ deptId: 100, deptName: '测试部门' } as any);
      (prisma.sysUserRole.findMany as jest.Mock).mockResolvedValue([{ roleId: 1 } as any]);
      (prisma.sysUserPost.findMany as jest.Mock).mockResolvedValue([]);
      roleService.getPermissionsByRoleIds.mockResolvedValue([{ perms: 'system:user:list' } as any]);
      roleService.findRoles.mockResolvedValue([{ roleId: 1, roleKey: 'admin' } as any]);
      jwt.sign.mockReturnValue('mock.jwt.token');
      redis.set.mockResolvedValue('OK');

      const result = await service.login(loginDto, mockClientInfo);

      expect(result.code).toBe(200);
      expect(result.data).toHaveProperty('token');
      expect(userRepo.updateLoginTime).toHaveBeenCalledWith(mockUser.userId);
    });

    it('should fail login with invalid password', async () => {
      const loginDto = { userName: 'testuser', password: 'wrongpassword', code: '1234', uuid: 'test-uuid' };
      
      userRepo.findByUserName.mockResolvedValue(mockUser);

      const result = await service.login(loginDto, mockClientInfo);

      expect(result.code).toBe(ResponseCode.PASSWORD_ERROR);
    });

    it('should fail login for deleted user', async () => {
      const loginDto = { userName: 'testuser', password: 'password123', code: '1234', uuid: 'test-uuid' };
      const deletedUser = { ...mockUser, delFlag: DelFlagEnum.DELETED };
      
      userRepo.findByUserName.mockResolvedValue(deletedUser);
      userRepo.findById.mockResolvedValue(deletedUser);
      (prisma.sysDept.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.sysUserRole.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.sysUserPost.findMany as jest.Mock).mockResolvedValue([]);
      roleService.findRoles.mockResolvedValue([]);

      const result = await service.login(loginDto, mockClientInfo);

      expect(result.code).toBe(ResponseCode.BUSINESS_ERROR);
      expect(result.msg).toContain('禁用');
    });

    it('should fail login for disabled user', async () => {
      const loginDto = { userName: 'testuser', password: 'password123', code: '1234', uuid: 'test-uuid' };
      const disabledUser = { ...mockUser, status: StatusEnum.DISABLED };
      
      userRepo.findByUserName.mockResolvedValue(disabledUser);
      userRepo.findById.mockResolvedValue(disabledUser);
      (prisma.sysDept.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.sysUserRole.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.sysUserPost.findMany as jest.Mock).mockResolvedValue([]);
      roleService.findRoles.mockResolvedValue([]);

      const result = await service.login(loginDto, mockClientInfo);

      expect(result.code).toBe(ResponseCode.BUSINESS_ERROR);
      expect(result.msg).toContain('停用');
    });
  });

  describe('register', () => {
    it('should register new user successfully', async () => {
      const registerDto = {
        userName: 'newuser',
        password: 'password123',
        nickName: '新用户',
      };

      userRepo.findByUserName.mockResolvedValue(null);
      userRepo.create.mockResolvedValue({ userId: 2 } as any);

      const result = await service.register(registerDto);

      expect(result.code).toBe(200);
      expect(userRepo.create).toHaveBeenCalled();
    });

    it('should fail registration with existing username', async () => {
      const registerDto = {
        userName: 'testuser',
        password: 'password123',
        nickName: '测试用户',
      };

      userRepo.findByUserName.mockResolvedValue(mockUser);

      const result = await service.register(registerDto);

      expect(result.code).toBe(ResponseCode.BUSINESS_ERROR);
      expect(result.msg).toContain('已存在');
    });
  });

  describe('createToken', () => {
    it('should create JWT token', () => {
      const payload = { uuid: 'test-uuid', userId: 1 };
      jwt.sign.mockReturnValue('mock.jwt.token');

      const token = service.createToken(payload);

      expect(token).toBe('mock.jwt.token');
      expect(jwt.sign).toHaveBeenCalledWith(payload);
    });
  });

  describe('parseToken', () => {
    it('should parse valid token', () => {
      const token = 'Bearer mock.jwt.token';
      const payload = { uuid: 'test-uuid', userId: 1 };
      jwt.verify.mockReturnValue(payload as any);

      const result = service.parseToken(token);

      expect(result).toEqual(payload);
      expect(jwt.verify).toHaveBeenCalledWith('mock.jwt.token');
    });

    it('should return null for invalid token', () => {
      const token = 'invalid.token';
      jwt.verify.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      const result = service.parseToken(token);

      expect(result).toBeNull();
    });

    it('should return null for empty token', () => {
      const result = service.parseToken('');

      expect(result).toBeNull();
    });
  });

  describe('updateRedisToken', () => {
    it('should update token in Redis', async () => {
      const token = 'test-token';
      const metaData = { userId: 1, userName: 'testuser' };
      redis.get.mockResolvedValue(null);
      redis.set.mockResolvedValue('OK');

      await service.updateRedisToken(token, metaData);

      expect(redis.set).toHaveBeenCalled();
    });

    it('should merge with existing metadata', async () => {
      const token = 'test-token';
      const oldMetaData = { userId: 1, userName: 'testuser' };
      const newMetaData = { permissions: ['system:user:list'] };
      redis.get.mockResolvedValue(oldMetaData);
      redis.set.mockResolvedValue('OK');

      await service.updateRedisToken(token, newMetaData);

      expect(redis.set).toHaveBeenCalled();
    });
  });

  describe('getUserPermissions', () => {
    it('should get user permissions', async () => {
      const userId = 1;
      (prisma.sysUserRole.findMany as jest.Mock).mockResolvedValue([{ roleId: 1 } as any]);
      roleService.getPermissionsByRoleIds.mockResolvedValue([
        { perms: 'system:user:list' } as any,
        { perms: 'system:user:add' } as any,
      ]);

      const permissions = await service.getUserPermissions(userId);

      expect(permissions).toEqual(['system:user:list', 'system:user:add']);
    });

    it('should return empty array for user with no roles', async () => {
      const userId = 1;
      (prisma.sysUserRole.findMany as jest.Mock).mockResolvedValue([]);
      roleService.getPermissionsByRoleIds.mockResolvedValue([]);

      const permissions = await service.getUserPermissions(userId);

      expect(permissions).toEqual([]);
    });
  });

  describe('getUserinfo', () => {
    it('should get user info with relations', async () => {
      const userId = 1;
      userRepo.findById.mockResolvedValue(mockUser);
      (prisma.sysDept.findFirst as jest.Mock).mockResolvedValue({ deptId: 100, deptName: '测试部门' } as any);
      (prisma.sysUserRole.findMany as jest.Mock).mockResolvedValue([{ roleId: 1 } as any]);
      (prisma.sysUserPost.findMany as jest.Mock).mockResolvedValue([{ postId: 1 } as any]);
      (prisma.sysPost.findMany as jest.Mock).mockResolvedValue([{ postId: 1, postName: '测试岗位' } as any]);
      roleService.findRoles.mockResolvedValue([{ roleId: 1, roleKey: 'admin' } as any]);

      const userInfo = await service.getUserinfo(userId);

      expect(userInfo).toHaveProperty('dept');
      expect(userInfo).toHaveProperty('roles');
      expect(userInfo).toHaveProperty('posts');
    });

    it('should throw error for non-existent user', async () => {
      const userId = 999;
      userRepo.findById.mockResolvedValue(null);

      await expect(service.getUserinfo(userId)).rejects.toThrow();
    });
  });

  describe('getRoleIds', () => {
    it('should get role IDs for users', async () => {
      const userIds = [1, 2];
      (prisma.sysUserRole.findMany as jest.Mock).mockResolvedValue([
        { roleId: 1 } as any,
        { roleId: 2 } as any,
        { roleId: 1 } as any,
      ]);

      const roleIds = await service.getRoleIds(userIds);

      expect(roleIds).toEqual([1, 2]);
    });

    it('should return empty array for empty user IDs', async () => {
      const roleIds = await service.getRoleIds([]);

      expect(roleIds).toEqual([]);
    });
  });

  describe('clearUserCache', () => {
    it('should clear user cache', async () => {
      const userId = 1;

      const result = await service.clearUserCache(userId);

      expect(result).toBe(userId);
    });
  });
});
