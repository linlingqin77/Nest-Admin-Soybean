import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from './user.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { UserRepository } from './user.repository';
import { RoleService } from '../role/role.service';
import { DeptService } from '../dept/dept.service';
import { JwtService } from '@nestjs/jwt';
import { RedisService } from 'src/module/common/redis/redis.service';
import { ConfigService } from '../config/config.service';
import { UserAuthService } from './services/user-auth.service';
import { UserProfileService } from './services/user-profile.service';
import { UserRoleService } from './services/user-role.service';
import { UserExportService } from './services/user-export.service';
import { DelFlagEnum, StatusEnum } from 'src/common/enum/index';
import { ResponseCode } from 'src/common/response';
import * as bcrypt from 'bcryptjs';

describe('UserService', () => {
  let service: UserService;
  let prisma: PrismaService;
  let userRepo: UserRepository;
  let roleService: RoleService;
  let deptService: DeptService;
  let jwtService: JwtService;
  let redisService: RedisService;
  let configService: ConfigService;
  let userAuthService: any;
  let userProfileService: any;
  let userRoleService: any;
  let userExportService: any;

  const mockUser = {
    userId: 1,
    tenantId: '000000',
    deptId: 100,
    userName: 'admin',
    nickName: '管理员',
    userType: '00',
    email: 'admin@example.com',
    phonenumber: '13800138000',
    sex: '0',
    avatar: '',
    password: bcrypt.hashSync('admin123', bcrypt.genSaltSync(10)),
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

  const mockDept = {
    deptId: 100,
    tenantId: '000000',
    parentId: 0,
    ancestors: '0',
    deptName: '测试部门',
    orderNum: 1,
    leader: 'admin',
    phone: '13800138000',
    email: 'test@example.com',
    status: StatusEnum.NORMAL,
    delFlag: DelFlagEnum.NORMAL,
    createBy: 'admin',
    createTime: new Date(),
    updateBy: 'admin',
    updateTime: new Date(),
    remark: null,
  };

  const mockRole = {
    roleId: 1,
    tenantId: '000000',
    roleName: '管理员',
    roleKey: 'admin',
    roleSort: 1,
    dataScope: '1',
    menuCheckStrictly: false,
    deptCheckStrictly: false,
    status: StatusEnum.NORMAL,
    delFlag: DelFlagEnum.NORMAL,
    createBy: 'admin',
    createTime: new Date(),
    updateBy: 'admin',
    updateTime: new Date(),
    remark: null,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: PrismaService,
          useValue: {
            sysUser: {
              findMany: jest.fn(),
              findFirst: jest.fn(),
              findUnique: jest.fn(),
              create: jest.fn(),
              update: jest.fn(),
              delete: jest.fn(),
              count: jest.fn(),
            },
            sysDept: {
              findMany: jest.fn().mockResolvedValue([mockDept]),
              findFirst: jest.fn().mockResolvedValue(mockDept),
            },
            sysPost: {
              findMany: jest.fn().mockResolvedValue([]),
            },
            sysUserRole: {
              findMany: jest.fn().mockResolvedValue([{ roleId: 1 }]),
              deleteMany: jest.fn(),
              createMany: jest.fn(),
            },
            sysUserPost: {
              findMany: jest.fn().mockResolvedValue([]),
              deleteMany: jest.fn(),
              createMany: jest.fn(),
            },
            $transaction: jest.fn((fn) => {
              if (Array.isArray(fn)) {
                return Promise.all(fn);
              }
              return fn({ sysUser: prisma.sysUser });
            }),
          },
        },
        {
          provide: UserRepository,
          useValue: {
            findById: jest.fn().mockResolvedValue(mockUser),
            findByUserName: jest.fn().mockResolvedValue(mockUser),
            create: jest.fn().mockResolvedValue(mockUser),
            update: jest.fn().mockResolvedValue(mockUser),
            softDelete: jest.fn(),
            softDeleteBatch: jest.fn().mockResolvedValue(1),
            resetPassword: jest.fn(),
            updateLoginTime: jest.fn(),
          },
        },
        {
          provide: RoleService,
          useValue: {
            findRoles: jest.fn().mockResolvedValue([mockRole]),
            findRoleWithDeptIds: jest.fn().mockResolvedValue([100]),
            getPermissionsByRoleIds: jest.fn().mockResolvedValue([{ perms: 'system:user:list' }]),
          },
        },
        {
          provide: DeptService,
          useValue: {
            findDeptIdsByDataScope: jest.fn().mockResolvedValue([100]),
            deptTree: jest.fn().mockResolvedValue([]),
          },
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn().mockReturnValue('mock-token'),
            verify: jest.fn().mockReturnValue({ uuid: 'mock-uuid', userId: 1 }),
          },
        },
        {
          provide: RedisService,
          useValue: {
            get: jest.fn(),
            set: jest.fn(),
            del: jest.fn(),
            keys: jest.fn().mockResolvedValue([]),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            getConfigValue: jest.fn().mockResolvedValue('true'),
          },
        },
        {
          provide: UserAuthService,
          useValue: {
            login: jest.fn().mockResolvedValue({ code: 200, data: { token: 'mock-token' } }),
            logout: jest.fn(),
            register: jest.fn().mockResolvedValue({ code: 200 }),
            createToken: jest.fn().mockReturnValue('mock-token'),
            parseToken: jest.fn().mockReturnValue({ uuid: 'mock-uuid', userId: 1 }),
            updateRedisToken: jest.fn(),
            updateRedisUserRolesAndPermissions: jest.fn(),
            getRoleIds: jest.fn().mockResolvedValue([[1]]),
            getUserPermissions: jest.fn().mockResolvedValue(['system:user:list']),
            getUserinfo: jest.fn().mockResolvedValue({}),
          },
        },
        {
          provide: UserProfileService,
          useValue: {
            profile: jest.fn(),
            updateProfile: jest.fn(),
            updatePwd: jest.fn(),
            resetPwd: jest.fn().mockResolvedValue({ code: 200 }),
          },
        },
        {
          provide: UserRoleService,
          useValue: {
            authRole: jest.fn(),
            updateAuthRole: jest.fn(),
            allocatedList: jest.fn(),
            unallocatedList: jest.fn(),
            authUserCancel: jest.fn(),
            authUserCancelAll: jest.fn(),
            authUserSelectAll: jest.fn(),
          },
        },
        {
          provide: UserExportService,
          useValue: {
            export: jest.fn(),
            import: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
    prisma = module.get<PrismaService>(PrismaService);
    userRepo = module.get<UserRepository>(UserRepository);
    roleService = module.get<RoleService>(RoleService);
    deptService = module.get<DeptService>(DeptService);
    jwtService = module.get<JwtService>(JwtService);
    redisService = module.get<RedisService>(RedisService);
    configService = module.get<ConfigService>(ConfigService);
    userAuthService = module.get(UserAuthService);
    userProfileService = module.get(UserProfileService);
    userRoleService = module.get(UserRoleService);
    userExportService = module.get(UserExportService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findOne', () => {
    it('should return user with roles and posts when user exists', async () => {
      const result = await service.findOne(1);

      expect(result.code).toBe(200);
      expect(result.data).toBeDefined();
      expect(result.data.data.userId).toBe(1);
      expect(userRepo.findById).toHaveBeenCalledWith(1);
    });

    it('should return null data when user does not exist', async () => {
      jest.spyOn(userRepo, 'findById').mockResolvedValueOnce(null);

      const result = await service.findOne(999);

      expect(result.code).toBe(200);
      expect(result.data).toBeNull();
    });
  });

  describe('create', () => {
    it('should create user successfully', async () => {
      const createDto = {
        userName: 'testuser',
        nickName: '测试用户',
        password: 'password123',
        deptId: 100,
        postIds: [1],
        roleIds: [2],
      };

      const result = await service.create(createDto as any);

      expect(result.code).toBe(200);
      expect(userRepo.create).toHaveBeenCalled();
    });

    it('should hash password when creating user', async () => {
      const createDto = {
        userName: 'testuser',
        nickName: '测试用户',
        password: 'plainPassword',
        deptId: 100,
      };

      await service.create(createDto as any);

      const calledWith = (userRepo.create as jest.Mock).mock.calls[0][0];
      expect(calledWith.password).not.toBe('plainPassword');
      expect(bcrypt.compareSync('plainPassword', calledWith.password)).toBe(true);
    });
  });

  describe('login', () => {
    it('should return token on successful login', async () => {
      // 模拟configService的captcha验证
      (configService.getConfigValue as jest.Mock).mockResolvedValue('false');

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
        loginLocation: 'Local',
        deviceType: 'PC',
      };

      const result = await service.login(loginDto, clientInfo);

      expect(result.code).toBe(200);
      expect(result.data.token).toBeDefined();
    });

    it('should fail with wrong password', async () => {
      (configService.getConfigValue as jest.Mock).mockResolvedValue('false');
      userAuthService.login.mockReset();
      userAuthService.login.mockResolvedValue({ code: 401, msg: '帐号或密码错误' });

      const loginDto = {
        userName: 'admin',
        password: 'wrongpassword',
        code: '1234',
        uuid: 'test-uuid',
      };

      const clientInfo = {
        ipaddr: '127.0.0.1',
        browser: 'Chrome',
        os: 'Windows',
        loginLocation: 'Local',
        deviceType: 'PC',
      };

      const result = await service.login(loginDto, clientInfo);

      expect(result.code).toBe(401);
      expect(result.msg).toContain('帐号或密码错误');
    });

    it('should fail when user is disabled', async () => {
      (configService.getConfigValue as jest.Mock).mockResolvedValue('false');
      userAuthService.login.mockReset();
      userAuthService.login.mockResolvedValue({ code: 403, msg: '用户已禁用' });

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
        loginLocation: 'Local',
        deviceType: 'PC',
      };

      const result = await service.login(loginDto, clientInfo);

      expect(result.code).toBe(403);
      expect(userAuthService.login).toHaveBeenCalled();
    });
  });

  describe('resetPwd', () => {
    it('should not allow resetting password for system user', async () => {
      userProfileService.resetPwd.mockResolvedValueOnce({ code: 403, msg: '不允许修改系统用户密码' });

      const result = await service.resetPwd({ userId: 1, password: 'newpassword' });

      expect(result.code).toBe(403);
      expect(userProfileService.resetPwd).toHaveBeenCalled();
    });

    it('should reset password for normal user', async () => {
      const result = await service.resetPwd({ userId: 2, password: 'newpassword' });

      expect(result.code).toBe(200);
      expect(userProfileService.resetPwd).toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('should soft delete users', async () => {
      const result = await service.remove([2, 3]);

      expect(result.code).toBe(200);
      expect(result.data.count).toBe(1);
      expect(userRepo.softDeleteBatch).toHaveBeenCalledWith([2, 3]);
    });
  });

  describe('changeStatus', () => {
    it('should not allow changing system user status', async () => {
      jest.spyOn(userRepo, 'findById').mockResolvedValueOnce({
        ...mockUser,
        userType: '00',
      });

      const result = await service.changeStatus({ userId: 1, status: StatusEnum.STOP });

      expect(result.code).not.toBe(200);
      expect(result.msg).toContain('系统角色');
    });

    it('should change status for normal user', async () => {
      jest.spyOn(userRepo, 'findById').mockResolvedValueOnce({
        ...mockUser,
        userType: '01',
      });

      const result = await service.changeStatus({ userId: 2, status: StatusEnum.STOP });

      expect(result.code).toBe(200);
    });
  });

  describe('getUserPermissions', () => {
    it('should return unique permissions', async () => {
      userAuthService.getUserPermissions.mockResolvedValueOnce(['system:user:list', 'system:user:add']);

      const permissions = await service.getUserPermissions(1);

      expect(permissions).toContain('system:user:list');
      expect(permissions).toContain('system:user:add');
      expect(userAuthService.getUserPermissions).toHaveBeenCalledWith(1);
    });
  });

  describe('parseToken', () => {
    it('should parse valid token', () => {
      const result = service.parseToken('Bearer mock-token');

      expect(result).toBeDefined();
      expect(result.userId).toBe(1);
    });

    it('should return null for invalid token', () => {
      userAuthService.parseToken.mockReturnValueOnce(null);

      const result = service.parseToken('invalid-token');

      expect(result).toBeNull();
    });

    it('should return null for empty token', () => {
      userAuthService.parseToken.mockReturnValueOnce(null);

      const result = service.parseToken('');

      expect(result).toBeNull();
    });
  });

  describe('register', () => {
    it('should register new user successfully', async () => {
      const registerDto = {
        userName: 'newuser',
        password: 'password123',
      };

      const result = await service.register(registerDto);

      expect(result.code).toBe(200);
      expect(userAuthService.register).toHaveBeenCalled();
    });

    it('should fail when username already exists', async () => {
      userAuthService.register.mockResolvedValueOnce({ code: 400, msg: '注册账号已存在' });

      const registerDto = {
        userName: 'admin',
        password: 'password123',
      };

      const result = await service.register(registerDto);

      expect(result.code).toBe(400);
      expect(result.msg).toContain('注册账号已存在');
    });
  });
});
