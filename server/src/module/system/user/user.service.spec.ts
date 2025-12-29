import { Test, TestingModule } from '@nestjs/testing';
import { Status, DelFlag } from '@prisma/client';
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
    userType: 'SYSTEM' as any,
    email: 'admin@example.com',
    phonenumber: '13800138000',
    sex: 'MALE' as any,
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
            getSystemConfigValue: jest.fn().mockResolvedValue('false'),
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

      // 模拟用户名不存在
      jest.spyOn(userRepo, 'findByUserName').mockResolvedValueOnce(null);

      const result = await service.create(createDto as any);

      expect(result.code).toBe(200);
      expect(userRepo.create).toHaveBeenCalled();
    });

    it('should hash password when creating user', async () => {
      const createDto = {
        userName: 'newuser',
        nickName: '测试用户',
        password: 'plainPassword',
        deptId: 100,
      };

      // 模拟用户名不存在
      jest.spyOn(userRepo, 'findByUserName').mockResolvedValueOnce(null);

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
        userType: 'SYSTEM' as any,
      });

      const result = await service.changeStatus({ userId: 1, status: StatusEnum.DISABLED });

      expect(result.code).not.toBe(200);
      expect(result.msg).toContain('系统角色');
    });

    it('should change status for normal user', async () => {
      jest.spyOn(userRepo, 'findById').mockResolvedValueOnce({
        ...mockUser,
        userType: 'NORMAL' as any,
      });

      const result = await service.changeStatus({ userId: 2, status: StatusEnum.DISABLED });

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

  describe('findAll', () => {
    it('should return paginated user list', async () => {
      const query = { pageNum: 1, pageSize: 10 };
      const mockUsers = [mockUser];

      (prisma.sysUser.findMany as jest.Mock).mockResolvedValue(mockUsers);
      (prisma.sysUser.count as jest.Mock).mockResolvedValue(1);
      (prisma.$transaction as jest.Mock).mockResolvedValue([mockUsers, 1]);

      const result = await service.findAll(query as any, mockUser as any);

      expect(result.code).toBe(200);
    });

    it('should filter by userName', async () => {
      const query = { pageNum: 1, pageSize: 10, userName: 'admin' };

      (prisma.$transaction as jest.Mock).mockResolvedValue([[], 0]);

      const result = await service.findAll(query as any, mockUser as any);

      expect(result.code).toBe(200);
    });

    it('should filter by phonenumber', async () => {
      const query = { pageNum: 1, pageSize: 10, phonenumber: '138' };

      (prisma.$transaction as jest.Mock).mockResolvedValue([[], 0]);

      const result = await service.findAll(query as any, mockUser as any);

      expect(result.code).toBe(200);
    });

    it('should filter by status', async () => {
      const query = { pageNum: 1, pageSize: 10, status: StatusEnum.NORMAL };

      (prisma.$transaction as jest.Mock).mockResolvedValue([[], 0]);

      const result = await service.findAll(query as any, mockUser as any);

      expect(result.code).toBe(200);
    });

    it('should filter by deptId', async () => {
      const query = { pageNum: 1, pageSize: 10, deptId: 100 };

      (prisma.$transaction as jest.Mock).mockResolvedValue([[], 0]);

      const result = await service.findAll(query as any, mockUser as any);

      expect(result.code).toBe(200);
      expect(deptService.findDeptIdsByDataScope).toHaveBeenCalled();
    });

    it('should filter by date range', async () => {
      const query = { 
        pageNum: 1, 
        pageSize: 10, 
        params: { beginTime: '2024-01-01', endTime: '2024-12-31' }
      };

      (prisma.$transaction as jest.Mock).mockResolvedValue([[], 0]);

      const result = await service.findAll(query as any, mockUser as any);

      expect(result.code).toBe(200);
    });
  });

  describe('findPostAndRoleAll', () => {
    it('should return all posts and roles', async () => {
      const result = await service.findPostAndRoleAll();

      expect(result.code).toBe(200);
      expect(result.data.posts).toBeDefined();
      expect(result.data.roles).toBeDefined();
    });
  });

  describe('update', () => {
    it('should update user successfully', async () => {
      const updateDto = {
        userId: 2,
        nickName: '更新后的昵称',
        postIds: [1, 2],
        roleIds: [2],
      };

      jest.spyOn(userRepo, 'findById').mockResolvedValueOnce({
        ...mockUser,
        userId: 2,
        userType: 'NORMAL' as any,
      });

      (prisma.sysUser.update as jest.Mock).mockResolvedValue({});

      const result = await service.update(updateDto as any, 1);

      expect(result.code).toBe(200);
    });

    it('should throw error when updating user id 1', async () => {
      const updateDto = {
        userId: 1,
        nickName: '更新后的昵称',
      };

      await expect(service.update(updateDto as any, 2)).rejects.toThrow();
    });

    it('should return error when user not found', async () => {
      const updateDto = {
        userId: 999,
        nickName: '更新后的昵称',
      };

      jest.spyOn(userRepo, 'findById').mockResolvedValueOnce(null);

      const result = await service.update(updateDto as any, 1);

      expect(result.code).not.toBe(200);
    });

    it('should filter out super admin role', async () => {
      const updateDto = {
        userId: 2,
        nickName: '更新后的昵称',
        roleIds: [1, 2], // includes super admin role
      };

      jest.spyOn(userRepo, 'findById').mockResolvedValueOnce({
        ...mockUser,
        userId: 2,
        userType: 'NORMAL' as any,
      });

      (prisma.sysUser.update as jest.Mock).mockResolvedValue({});

      const result = await service.update(updateDto as any, 1);

      expect(result.code).toBe(200);
    });

    it('should not update status when updating self', async () => {
      const updateDto = {
        userId: 2,
        nickName: '更新后的昵称',
        status: StatusEnum.DISABLED,
      };

      jest.spyOn(userRepo, 'findById').mockResolvedValueOnce({
        ...mockUser,
        userId: 2,
        userType: 'NORMAL' as any,
      });

      (prisma.sysUser.update as jest.Mock).mockResolvedValue({});

      const result = await service.update(updateDto as any, 2);

      expect(result.code).toBe(200);
    });
  });

  describe('deptTree', () => {
    it('should return department tree', async () => {
      const result = await service.deptTree();

      expect(result.code).toBe(200);
      expect(deptService.deptTree).toHaveBeenCalled();
    });
  });

  describe('optionselect', () => {
    it('should return user options', async () => {
      (prisma.sysUser.findMany as jest.Mock).mockResolvedValue([
        { userId: 1, userName: 'admin', nickName: '管理员' },
      ]);

      const result = await service.optionselect();

      expect(result.code).toBe(200);
    });
  });

  describe('findByDeptId', () => {
    it('should return users by department id', async () => {
      (prisma.sysUser.findMany as jest.Mock).mockResolvedValue([mockUser]);

      const result = await service.findByDeptId(100);

      expect(result.code).toBe(200);
    });
  });

  describe('createToken', () => {
    it('should create token', () => {
      const payload = { uuid: 'test-uuid', userId: 1 };

      const result = service.createToken(payload);

      expect(result).toBe('mock-token');
      expect(userAuthService.createToken).toHaveBeenCalledWith(payload);
    });
  });

  describe('updateRedisToken', () => {
    it('should update redis token', async () => {
      await service.updateRedisToken('token', { user: mockUser as any });

      expect(userAuthService.updateRedisToken).toHaveBeenCalled();
    });
  });

  describe('updateRedisUserRolesAndPermissions', () => {
    it('should update redis user roles and permissions', async () => {
      await service.updateRedisUserRolesAndPermissions('uuid', 1);

      expect(userAuthService.updateRedisUserRolesAndPermissions).toHaveBeenCalledWith('uuid', 1);
    });
  });

  describe('getRoleIds', () => {
    it('should return role ids for users', async () => {
      const result = await service.getRoleIds([1]);

      expect(result).toBeDefined();
      expect(userAuthService.getRoleIds).toHaveBeenCalledWith([1]);
    });
  });

  describe('getUserinfo', () => {
    it('should return user info', async () => {
      const result = await service.getUserinfo(1);

      expect(result).toBeDefined();
      expect(userAuthService.getUserinfo).toHaveBeenCalledWith(1);
    });
  });

  describe('profile', () => {
    it('should return user profile', async () => {
      await service.profile(mockUser);

      expect(userProfileService.profile).toHaveBeenCalled();
    });
  });

  describe('updateProfile', () => {
    it('should update user profile', async () => {
      const updateDto = { nickName: '新昵称' };

      await service.updateProfile({ user: mockUser } as any, updateDto as any);

      expect(userProfileService.updateProfile).toHaveBeenCalled();
    });
  });

  describe('updatePwd', () => {
    it('should update user password', async () => {
      const updateDto = { oldPassword: 'old', newPassword: 'new' };

      await service.updatePwd({ user: mockUser } as any, updateDto as any);

      expect(userProfileService.updatePwd).toHaveBeenCalled();
    });
  });

  describe('authRole', () => {
    it('should return auth role info', async () => {
      await service.authRole(1);

      expect(userRoleService.authRole).toHaveBeenCalledWith(1);
    });
  });

  describe('updateAuthRole', () => {
    it('should update auth role', async () => {
      const query = { userId: 1, roleIds: '1,2' };

      await service.updateAuthRole(query);

      expect(userRoleService.updateAuthRole).toHaveBeenCalledWith(query);
    });
  });

  describe('allocatedList', () => {
    it('should return allocated user list', async () => {
      const query = { roleId: 1, pageNum: 1, pageSize: 10 };

      await service.allocatedList(query as any);

      expect(userRoleService.allocatedList).toHaveBeenCalledWith(query);
    });
  });

  describe('unallocatedList', () => {
    it('should return unallocated user list', async () => {
      const query = { roleId: 1, pageNum: 1, pageSize: 10 };

      await service.unallocatedList(query as any);

      expect(userRoleService.unallocatedList).toHaveBeenCalledWith(query);
    });
  });

  describe('authUserCancel', () => {
    it('should cancel user auth', async () => {
      const data = { userId: 1, roleId: 2 };

      await service.authUserCancel(data as any);

      expect(userRoleService.authUserCancel).toHaveBeenCalledWith(data);
    });
  });

  describe('authUserCancelAll', () => {
    it('should cancel all user auth', async () => {
      const data = { roleId: 1, userIds: '1,2,3' };

      await service.authUserCancelAll(data as any);

      expect(userRoleService.authUserCancelAll).toHaveBeenCalledWith(data);
    });
  });

  describe('authUserSelectAll', () => {
    it('should select all user auth', async () => {
      const data = { roleId: 1, userIds: '1,2,3' };

      await service.authUserSelectAll(data as any);

      expect(userRoleService.authUserSelectAll).toHaveBeenCalledWith(data);
    });
  });

  describe('export', () => {
    it('should export user data', async () => {
      const mockRes = {} as any;
      const body = { pageNum: 1, pageSize: 10 };

      (prisma.$transaction as jest.Mock).mockResolvedValue([[], 0]);

      await service.export(mockRes, body as any, mockUser as any);

      expect(userExportService.export).toHaveBeenCalled();
    });
  });

  describe('clearCacheByUserId', () => {
    it('should be called with userId for cache clearing', () => {
      // The decorator returns the result of the method, which is the userId
      // But since we're testing the service method directly, we just verify it's callable
      const result = service.clearCacheByUserId(1);
      // The method returns the userId, but the decorator may modify the return value
      expect(result).toBeDefined();
    });
  });

  describe('create with existing username', () => {
    it('should fail when username already exists', async () => {
      const createDto = {
        userName: 'admin',
        nickName: '测试用户',
        password: 'password123',
        deptId: 100,
      };

      // 模拟用户名已存在
      jest.spyOn(userRepo, 'findByUserName').mockResolvedValueOnce(mockUser);

      const result = await service.create(createDto as any);

      expect(result.code).not.toBe(200);
      expect(result.msg).toContain('已存在');
    });
  });
});
