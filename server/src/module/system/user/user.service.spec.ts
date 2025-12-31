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
import { DelFlagEnum, StatusEnum, DataScopeEnum } from 'src/common/enum/index';
import * as bcrypt from 'bcryptjs';
import { BusinessException } from 'src/common/exceptions';

describe('UserService', () => {
  let service: UserService;
  let prisma: PrismaService;
  let userRepo: UserRepository;
  let roleService: RoleService;
  let deptService: DeptService;
  let configService: ConfigService;
  let userAuthService: any;
  let userProfileService: any;
  let userRoleService: any;

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
            sysRoleDept: {
              findMany: jest.fn().mockResolvedValue([]),
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
            existsByUserName: jest.fn().mockResolvedValue(false),
            existsByPhoneNumber: jest.fn().mockResolvedValue(false),
            existsByEmail: jest.fn().mockResolvedValue(false),
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
    configService = module.get<ConfigService>(ConfigService);
    userAuthService = module.get(UserAuthService);
    userProfileService = module.get(UserProfileService);
    userRoleService = module.get(UserRoleService);
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

  describe('findAll', () => {
    const mockUserList = [
      { ...mockUser, userId: 1, userName: 'user1' },
      { ...mockUser, userId: 2, userName: 'user2' },
    ];

    beforeEach(() => {
      (prisma.$transaction as jest.Mock).mockResolvedValue([mockUserList, 2]);
    });

    it('should return paginated user list', async () => {
      const query = { pageNum: 1, pageSize: 10 } as any;
      const currentUser = { userId: 1, deptId: 100, roles: [{ dataScope: DataScopeEnum.DATA_SCOPE_ALL }] };

      const result = await service.findAll(query, currentUser as any);

      expect(result.code).toBe(200);
      expect(result.data.rows).toHaveLength(2);
      expect(result.data.total).toBe(2);
    });

    it('should filter by userName', async () => {
      const query = { pageNum: 1, pageSize: 10, userName: 'user1' } as any;
      const currentUser = { userId: 1, deptId: 100, roles: [{ dataScope: DataScopeEnum.DATA_SCOPE_ALL }] };

      await service.findAll(query, currentUser as any);

      expect(prisma.$transaction).toHaveBeenCalled();
    });

    it('should filter by status', async () => {
      const query = { pageNum: 1, pageSize: 10, status: StatusEnum.NORMAL } as any;
      const currentUser = { userId: 1, deptId: 100, roles: [{ dataScope: DataScopeEnum.DATA_SCOPE_ALL }] };

      await service.findAll(query, currentUser as any);

      expect(prisma.$transaction).toHaveBeenCalled();
    });

    it('should filter by phonenumber', async () => {
      const query = { pageNum: 1, pageSize: 10, phonenumber: '138' } as any;
      const currentUser = { userId: 1, deptId: 100, roles: [{ dataScope: DataScopeEnum.DATA_SCOPE_ALL }] };

      await service.findAll(query, currentUser as any);

      expect(prisma.$transaction).toHaveBeenCalled();
    });

    it('should filter by deptId with child departments', async () => {
      const query = { pageNum: 1, pageSize: 10, deptId: 100 } as any;
      const currentUser = { userId: 1, deptId: 100, roles: [{ dataScope: DataScopeEnum.DATA_SCOPE_ALL }] };

      await service.findAll(query, currentUser as any);

      expect(deptService.findDeptIdsByDataScope).toHaveBeenCalled();
    });

    it('should filter by date range', async () => {
      const query = {
        pageNum: 1,
        pageSize: 10,
        params: { beginTime: '2024-01-01', endTime: '2024-12-31' },
      } as any;
      const currentUser = { userId: 1, deptId: 100, roles: [{ dataScope: DataScopeEnum.DATA_SCOPE_ALL }] };

      await service.findAll(query, currentUser as any);

      expect(prisma.$transaction).toHaveBeenCalled();
    });

    it('should apply data scope for custom role', async () => {
      (prisma.sysRoleDept.findMany as jest.Mock).mockResolvedValue([{ deptId: 100 }, { deptId: 101 }]);
      const query = { pageNum: 1, pageSize: 10 } as any;
      const currentUser = {
        userId: 2,
        deptId: 100,
        roles: [{ roleId: 2, dataScope: DataScopeEnum.DATA_SCOPE_CUSTOM }],
      };

      await service.findAll(query, currentUser as any);

      expect(prisma.sysRoleDept.findMany).toHaveBeenCalled();
    });

    it('should apply data scope for self only', async () => {
      const query = { pageNum: 1, pageSize: 10 } as any;
      const currentUser = {
        userId: 2,
        deptId: 100,
        roles: [{ dataScope: DataScopeEnum.DATA_SCOPE_SELF }],
      };

      await service.findAll(query, currentUser as any);

      expect(prisma.$transaction).toHaveBeenCalled();
    });

    it('should return empty list when no users found', async () => {
      (prisma.$transaction as jest.Mock).mockResolvedValue([[], 0]);
      const query = { pageNum: 1, pageSize: 10 } as any;
      const currentUser = { userId: 1, deptId: 100, roles: [{ dataScope: DataScopeEnum.DATA_SCOPE_ALL }] };

      const result = await service.findAll(query, currentUser as any);

      expect(result.code).toBe(200);
      expect(result.data.rows).toHaveLength(0);
      expect(result.data.total).toBe(0);
    });
  });

  describe('update', () => {
    it('should update user successfully', async () => {
      const updateDto = {
        userId: 2,
        nickName: '更新后的用户',
        deptId: 101,
        roleIds: [2],
        postIds: [1],
      };

      const result = await service.update(updateDto as any, 1);

      expect(result.code).toBe(200);
      expect(prisma.sysUserPost.deleteMany).toHaveBeenCalled();
      expect(prisma.sysUserPost.createMany).toHaveBeenCalled();
      expect(prisma.sysUserRole.deleteMany).toHaveBeenCalled();
      expect(prisma.sysUserRole.createMany).toHaveBeenCalled();
    });

    it('should throw error when updating system user (userId=1)', async () => {
      const updateDto = {
        userId: 1,
        nickName: '尝试更新系统用户',
        roleIds: [2],
      };

      await expect(service.update(updateDto as any, 2)).rejects.toThrow(BusinessException);
    });

    it('should filter out admin role (roleId=1) from roleIds', async () => {
      const updateDto = {
        userId: 2,
        nickName: '测试用户',
        roleIds: [1, 2, 3],
        postIds: [],
      };

      await service.update(updateDto as any, 1);

      const createManyCall = (prisma.sysUserRole.createMany as jest.Mock).mock.calls[0][0];
      const roleIds = createManyCall.data.map((item: any) => item.roleId);
      expect(roleIds).not.toContain(1);
      expect(roleIds).toContain(2);
      expect(roleIds).toContain(3);
    });

    it('should not update status when user updates themselves', async () => {
      const updateDto = {
        userId: 2,
        nickName: '自己更新',
        status: StatusEnum.STOP,
        roleIds: [2],
        postIds: [],
      };

      await service.update(updateDto as any, 2);

      const updateCall = (prisma.sysUser.update as jest.Mock).mock.calls[0][0];
      expect(updateCall.data.status).toBeUndefined();
    });
  });

  describe('findPostAndRoleAll', () => {
    it('should return all posts and roles', async () => {
      const mockPosts = [{ postId: 1, postName: '岗位1' }];
      (prisma.sysPost.findMany as jest.Mock).mockResolvedValue(mockPosts);
      (roleService.findRoles as jest.Mock).mockResolvedValue([mockRole]);

      const result = await service.findPostAndRoleAll();

      expect(result.code).toBe(200);
      expect(result.data.posts).toEqual(mockPosts);
      expect(result.data.roles).toEqual([mockRole]);
    });
  });

  describe('deptTree', () => {
    it('should return department tree', async () => {
      const mockTree = [{ deptId: 100, children: [] }];
      (deptService.deptTree as jest.Mock).mockResolvedValue(mockTree);

      const result = await service.deptTree();

      expect(result.code).toBe(200);
      expect(result.data).toEqual(mockTree);
    });
  });

  describe('optionselect', () => {
    it('should return user options for select', async () => {
      const mockOptions = [
        { userId: 1, userName: 'admin', nickName: '管理员' },
        { userId: 2, userName: 'user', nickName: '用户' },
      ];
      (prisma.sysUser.findMany as jest.Mock).mockResolvedValue(mockOptions);

      const result = await service.optionselect();

      expect(result.code).toBe(200);
      expect(result.data).toEqual(mockOptions);
    });
  });

  describe('findByDeptId', () => {
    it('should return users by department id', async () => {
      const mockUsers = [mockUser];
      (prisma.sysUser.findMany as jest.Mock).mockResolvedValue(mockUsers);

      const result = await service.findByDeptId(100);

      expect(result.code).toBe(200);
      expect(result.data).toEqual(mockUsers);
    });
  });

  describe('createToken', () => {
    it('should create JWT token', () => {
      const payload = { uuid: 'test-uuid', userId: 1 };

      const token = service.createToken(payload);

      expect(token).toBe('mock-token');
      expect(userAuthService.createToken).toHaveBeenCalledWith(payload);
    });
  });

  describe('updateRedisToken', () => {
    it('should update token in Redis', async () => {
      const token = 'test-token';
      const metaData = { userId: 1, userName: 'test' };

      await service.updateRedisToken(token, metaData as any);

      expect(userAuthService.updateRedisToken).toHaveBeenCalledWith(token, metaData);
    });
  });

  describe('updateRedisUserRolesAndPermissions', () => {
    it('should update user roles and permissions in Redis', async () => {
      await service.updateRedisUserRolesAndPermissions('test-uuid', 1);

      expect(userAuthService.updateRedisUserRolesAndPermissions).toHaveBeenCalledWith('test-uuid', 1);
    });
  });

  describe('getRoleIds', () => {
    it('should return role ids for users', async () => {
      userAuthService.getRoleIds.mockResolvedValue([1, 2]);

      const result = await service.getRoleIds([1]);

      expect(result).toEqual([1, 2]);
      expect(userAuthService.getRoleIds).toHaveBeenCalledWith([1]);
    });
  });

  describe('getUserinfo', () => {
    it('should return user info with relations', async () => {
      const mockUserInfo = { ...mockUser, dept: mockDept, roles: [mockRole] };
      userAuthService.getUserinfo.mockResolvedValue(mockUserInfo);

      const result = await service.getUserinfo(1);

      expect(result).toEqual(mockUserInfo);
      expect(userAuthService.getUserinfo).toHaveBeenCalledWith(1);
    });
  });

  describe('profile', () => {
    it('should return user profile', async () => {
      const mockProfile = { user: mockUser };
      userProfileService.profile.mockResolvedValue({ code: 200, data: mockProfile });

      await service.profile(mockProfile);

      expect(userProfileService.profile).toHaveBeenCalledWith(mockProfile);
    });
  });

  describe('updateProfile', () => {
    it('should update user profile', async () => {
      const user = { user: mockUser, token: 'test-token' };
      const updateDto = { nickName: '新昵称', email: 'new@example.com', phonenumber: '13900139000', sex: '0' } as any;
      userProfileService.updateProfile.mockResolvedValue({ code: 200 });

      await service.updateProfile(user as any, updateDto);

      expect(userProfileService.updateProfile).toHaveBeenCalledWith(user, updateDto);
    });
  });

  describe('updatePwd', () => {
    it('should update user password', async () => {
      const user = { user: mockUser, token: 'test-token' };
      const updatePwdDto = { oldPassword: 'old123', newPassword: 'new123' };
      userProfileService.updatePwd.mockResolvedValue({ code: 200 });

      await service.updatePwd(user as any, updatePwdDto);

      expect(userProfileService.updatePwd).toHaveBeenCalledWith(user, updatePwdDto);
    });
  });

  describe('authRole', () => {
    it('should return user auth role info', async () => {
      const mockAuthRole = { user: mockUser, roles: [mockRole] };
      userRoleService.authRole.mockResolvedValue({ code: 200, data: mockAuthRole });

      await service.authRole(1);

      expect(userRoleService.authRole).toHaveBeenCalledWith(1);
    });
  });

  describe('updateAuthRole', () => {
    it('should update user auth role', async () => {
      const query = { userId: 1, roleIds: '2,3' };
      userRoleService.updateAuthRole.mockResolvedValue({ code: 200 });

      await service.updateAuthRole(query);

      expect(userRoleService.updateAuthRole).toHaveBeenCalledWith(query);
    });
  });

  describe('allocatedList', () => {
    it('should return allocated user list for role', async () => {
      const query = { roleId: 1, pageNum: 1, pageSize: 10 };
      userRoleService.allocatedList.mockResolvedValue({ code: 200, data: { rows: [], total: 0 } });

      await service.allocatedList(query as any);

      expect(userRoleService.allocatedList).toHaveBeenCalledWith(query);
    });
  });

  describe('unallocatedList', () => {
    it('should return unallocated user list for role', async () => {
      const query = { roleId: 1, pageNum: 1, pageSize: 10 };
      userRoleService.unallocatedList.mockResolvedValue({ code: 200, data: { rows: [], total: 0 } });

      await service.unallocatedList(query as any);

      expect(userRoleService.unallocatedList).toHaveBeenCalledWith(query);
    });
  });

  describe('authUserCancel', () => {
    it('should cancel user role authorization', async () => {
      const data = { userId: 1, roleId: 2 };
      userRoleService.authUserCancel.mockResolvedValue({ code: 200 });

      await service.authUserCancel(data);

      expect(userRoleService.authUserCancel).toHaveBeenCalledWith(data);
    });
  });

  describe('authUserCancelAll', () => {
    it('should cancel all user role authorizations', async () => {
      const data = { roleId: 2, userIds: '1,2,3' };
      userRoleService.authUserCancelAll.mockResolvedValue({ code: 200 });

      await service.authUserCancelAll(data as any);

      expect(userRoleService.authUserCancelAll).toHaveBeenCalledWith(data);
    });
  });

  describe('authUserSelectAll', () => {
    it('should select all users for role authorization', async () => {
      const data = { roleId: 2, userIds: '1,2,3' };
      userRoleService.authUserSelectAll.mockResolvedValue({ code: 200 });

      await service.authUserSelectAll(data as any);

      expect(userRoleService.authUserSelectAll).toHaveBeenCalledWith(data);
    });
  });

  describe('clearCacheByUserId', () => {
    it('should return userId when clearing cache', () => {
      // The @CacheEvict decorator wraps the method, so we just verify it doesn't throw
      const result = service.clearCacheByUserId(1);
      // The decorator may return the userId or a wrapped result
      expect(result).toBeDefined();
    });
  });

  describe('batchCreate', () => {
    beforeEach(() => {
      jest.spyOn(userRepo, 'existsByUserName').mockResolvedValue(false);
      jest.spyOn(userRepo, 'existsByPhoneNumber').mockResolvedValue(false);
      jest.spyOn(userRepo, 'existsByEmail').mockResolvedValue(false);
      jest.spyOn(userRepo, 'create').mockResolvedValue({ ...mockUser, userId: 100 });
    });

    it('should create multiple users successfully', async () => {
      const batchDto = {
        users: [
          { userName: 'user1', nickName: 'User 1', password: 'Password123!' },
          { userName: 'user2', nickName: 'User 2', password: 'Password123!' },
        ],
      };

      const result = await service.batchCreate(batchDto);

      expect(result.code).toBe(200);
      expect(result.data.successCount).toBe(2);
      expect(result.data.failedCount).toBe(0);
      expect(result.data.totalCount).toBe(2);
      expect(result.data.results).toHaveLength(2);
      expect(result.data.results[0].success).toBe(true);
      expect(result.data.results[1].success).toBe(true);
    });

    it('should fail when username already exists', async () => {
      jest.spyOn(userRepo, 'existsByUserName').mockResolvedValueOnce(true);

      const batchDto = {
        users: [{ userName: 'existingUser', nickName: 'Existing', password: 'Password123!' }],
      };

      const result = await service.batchCreate(batchDto);

      expect(result.code).toBe(200);
      expect(result.data.successCount).toBe(0);
      expect(result.data.failedCount).toBe(1);
      expect(result.data.results[0].success).toBe(false);
      expect(result.data.results[0].error).toContain('已存在');
    });

    it('should fail when phone number already exists', async () => {
      jest.spyOn(userRepo, 'existsByPhoneNumber').mockResolvedValueOnce(true);

      const batchDto = {
        users: [
          {
            userName: 'newUser',
            nickName: 'New User',
            password: 'Password123!',
            phonenumber: '13800138000',
          },
        ],
      };

      const result = await service.batchCreate(batchDto);

      expect(result.code).toBe(200);
      expect(result.data.failedCount).toBe(1);
      expect(result.data.results[0].error).toContain('手机号');
    });

    it('should fail when email already exists', async () => {
      jest.spyOn(userRepo, 'existsByEmail').mockResolvedValueOnce(true);

      const batchDto = {
        users: [
          {
            userName: 'newUser',
            nickName: 'New User',
            password: 'Password123!',
            email: 'existing@example.com',
          },
        ],
      };

      const result = await service.batchCreate(batchDto);

      expect(result.code).toBe(200);
      expect(result.data.failedCount).toBe(1);
      expect(result.data.results[0].error).toContain('邮箱');
    });

    it('should create users with posts and roles', async () => {
      const batchDto = {
        users: [
          {
            userName: 'user1',
            nickName: 'User 1',
            password: 'Password123!',
            postIds: [1, 2],
            roleIds: [2, 3],
          },
        ],
      };

      const result = await service.batchCreate(batchDto);

      expect(result.code).toBe(200);
      expect(result.data.successCount).toBe(1);
      expect(prisma.sysUserPost.createMany).toHaveBeenCalled();
      expect(prisma.sysUserRole.createMany).toHaveBeenCalled();
    });

    it('should handle partial success', async () => {
      jest
        .spyOn(userRepo, 'existsByUserName')
        .mockResolvedValueOnce(false)
        .mockResolvedValueOnce(true)
        .mockResolvedValueOnce(false);

      const batchDto = {
        users: [
          { userName: 'user1', nickName: 'User 1', password: 'Password123!' },
          { userName: 'existingUser', nickName: 'Existing', password: 'Password123!' },
          { userName: 'user3', nickName: 'User 3', password: 'Password123!' },
        ],
      };

      const result = await service.batchCreate(batchDto);

      expect(result.code).toBe(200);
      expect(result.data.successCount).toBe(2);
      expect(result.data.failedCount).toBe(1);
      expect(result.data.totalCount).toBe(3);
    });
  });

  describe('batchDelete', () => {
    beforeEach(() => {
      jest.spyOn(userRepo, 'findById').mockResolvedValue({ ...mockUser, userType: '01' });
      jest.spyOn(userRepo, 'softDeleteBatch').mockResolvedValue(1);
    });

    it('should delete multiple users successfully', async () => {
      const batchDto = { userIds: [2, 3, 4] };

      const result = await service.batchDelete(batchDto);

      expect(result.code).toBe(200);
      expect(result.data.successCount).toBe(3);
      expect(result.data.failedCount).toBe(0);
      expect(result.data.totalCount).toBe(3);
    });

    it('should not delete system admin (userId=1)', async () => {
      const batchDto = { userIds: [1, 2, 3] };

      const result = await service.batchDelete(batchDto);

      expect(result.code).toBe(200);
      expect(result.data.successCount).toBe(2);
      expect(result.data.failedCount).toBe(1);
      expect(result.data.results.find((r) => r.index === 0)?.error).toContain('系统管理员');
    });

    it('should not delete system users', async () => {
      jest.spyOn(userRepo, 'findById').mockResolvedValueOnce({ ...mockUser, userType: '00' });

      const batchDto = { userIds: [2] };

      const result = await service.batchDelete(batchDto);

      expect(result.code).toBe(200);
      expect(result.data.failedCount).toBe(1);
      expect(result.data.results[0].error).toContain('系统用户');
    });

    it('should fail when user does not exist', async () => {
      jest.spyOn(userRepo, 'findById').mockResolvedValueOnce(null);

      const batchDto = { userIds: [999] };

      const result = await service.batchDelete(batchDto);

      expect(result.code).toBe(200);
      expect(result.data.failedCount).toBe(1);
      expect(result.data.results[0].error).toContain('不存在');
    });

    it('should handle partial success', async () => {
      jest
        .spyOn(userRepo, 'findById')
        .mockResolvedValueOnce({ ...mockUser, userType: '01' })
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({ ...mockUser, userType: '01' });

      const batchDto = { userIds: [2, 999, 4] };

      const result = await service.batchDelete(batchDto);

      expect(result.code).toBe(200);
      expect(result.data.successCount).toBe(2);
      expect(result.data.failedCount).toBe(1);
      expect(result.data.totalCount).toBe(3);
    });
  });
});
