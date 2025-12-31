import { Test, TestingModule } from '@nestjs/testing';
import { UserLoader } from './user.loader';
import { PrismaService } from '../../prisma/prisma.service';
import { DelFlagEnum } from '../enum';

describe('UserLoader', () => {
  let loader: UserLoader;
  let prisma: jest.Mocked<PrismaService>;

  const mockUsers = [
    {
      userId: 1,
      deptId: 1,
      userName: 'admin',
      nickName: '管理员',
      userType: '00',
      email: 'admin@example.com',
      phonenumber: '13800138000',
      sex: '0',
      avatar: '',
      password: 'hashed_password',
      status: '0',
      delFlag: '0',
      loginIp: '127.0.0.1',
      loginDate: new Date(),
      tenantId: '000000',
      createBy: 'admin',
      createTime: new Date(),
      updateBy: null,
      updateTime: null,
      remark: null,
    },
    {
      userId: 2,
      deptId: 2,
      userName: 'user1',
      nickName: '用户1',
      userType: '01',
      email: 'user1@example.com',
      phonenumber: '13800138001',
      sex: '1',
      avatar: '',
      password: 'hashed_password',
      status: '0',
      delFlag: '0',
      loginIp: '127.0.0.1',
      loginDate: new Date(),
      tenantId: '000000',
      createBy: 'admin',
      createTime: new Date(),
      updateBy: null,
      updateTime: null,
      remark: null,
    },
  ];

  const mockDepts = [
    {
      deptId: 1,
      parentId: 0,
      ancestors: '0',
      deptName: '总公司',
      orderNum: 0,
      leader: '张三',
      phone: '13800138000',
      email: 'admin@example.com',
      status: '0',
      delFlag: '0',
      tenantId: '000000',
      createBy: 'admin',
      createTime: new Date(),
      updateBy: 'admin',
      updateTime: new Date(),
      remark: null,
    },
    {
      deptId: 2,
      parentId: 1,
      ancestors: '0,1',
      deptName: '研发部',
      orderNum: 1,
      leader: '李四',
      phone: '13800138001',
      email: 'dev@example.com',
      status: '0',
      delFlag: '0',
      tenantId: '000000',
      createBy: 'admin',
      createTime: new Date(),
      updateBy: 'admin',
      updateTime: new Date(),
      remark: null,
    },
  ];

  beforeEach(async () => {
    const mockPrisma = {
      sysUser: {
        findMany: jest.fn(),
      },
      sysDept: {
        findMany: jest.fn(),
      },
      sysUserRole: {
        findMany: jest.fn(),
      },
      sysUserPost: {
        findMany: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserLoader,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
      ],
    }).compile();

    loader = await module.resolve<UserLoader>(UserLoader);
    prisma = module.get(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('load', () => {
    it('should load a single user by ID', async () => {
      (prisma.sysUser.findMany as jest.Mock).mockResolvedValue([mockUsers[0]]);

      const result = await loader.load(1);

      expect(result).toEqual(mockUsers[0]);
      expect(prisma.sysUser.findMany).toHaveBeenCalledWith({
        where: {
          userId: { in: [1] },
          delFlag: DelFlagEnum.NORMAL,
        },
      });
    });

    it('should return null for non-existent user', async () => {
      (prisma.sysUser.findMany as jest.Mock).mockResolvedValue([]);

      const result = await loader.load(999);

      expect(result).toBeNull();
    });

    it('should batch multiple load calls', async () => {
      (prisma.sysUser.findMany as jest.Mock).mockResolvedValue(mockUsers);

      const [result1, result2] = await Promise.all([loader.load(1), loader.load(2)]);

      expect(result1).toEqual(mockUsers[0]);
      expect(result2).toEqual(mockUsers[1]);
      expect(prisma.sysUser.findMany).toHaveBeenCalledTimes(1);
    });
  });

  describe('loadWithDept', () => {
    it('should load users with department info', async () => {
      (prisma.sysUser.findMany as jest.Mock).mockResolvedValue(mockUsers);
      (prisma.sysDept.findMany as jest.Mock).mockResolvedValue(mockDepts);

      const result = await loader.loadWithDept([1, 2]);

      expect(result).toHaveLength(2);
      expect(result[0].dept).toEqual(mockDepts[0]);
      expect(result[1].dept).toEqual(mockDepts[1]);
    });

    it('should handle users without department', async () => {
      const userWithoutDept = { ...mockUsers[0], deptId: null };
      (prisma.sysUser.findMany as jest.Mock).mockResolvedValue([userWithoutDept]);
      (prisma.sysDept.findMany as jest.Mock).mockResolvedValue([]);

      const result = await loader.loadWithDept([1]);

      expect(result[0].dept).toBeNull();
    });
  });

  describe('loadUserRoleIds', () => {
    it('should load role IDs for users', async () => {
      (prisma.sysUserRole.findMany as jest.Mock).mockResolvedValue([
        { userId: 1, roleId: 1 },
        { userId: 1, roleId: 2 },
        { userId: 2, roleId: 2 },
      ]);

      const result = await loader.loadUserRoleIds([1, 2]);

      expect(result.get(1)).toEqual([1, 2]);
      expect(result.get(2)).toEqual([2]);
    });

    it('should return empty array for users without roles', async () => {
      (prisma.sysUserRole.findMany as jest.Mock).mockResolvedValue([]);

      const result = await loader.loadUserRoleIds([1]);

      expect(result.get(1)).toEqual([]);
    });
  });

  describe('loadUserPostIds', () => {
    it('should load post IDs for users', async () => {
      (prisma.sysUserPost.findMany as jest.Mock).mockResolvedValue([
        { userId: 1, postId: 1 },
        { userId: 1, postId: 2 },
        { userId: 2, postId: 1 },
      ]);

      const result = await loader.loadUserPostIds([1, 2]);

      expect(result.get(1)).toEqual([1, 2]);
      expect(result.get(2)).toEqual([1]);
    });

    it('should return empty array for users without posts', async () => {
      (prisma.sysUserPost.findMany as jest.Mock).mockResolvedValue([]);

      const result = await loader.loadUserPostIds([1]);

      expect(result.get(1)).toEqual([]);
    });
  });

  describe('cache operations', () => {
    it('should clear cache for specific key', async () => {
      (prisma.sysUser.findMany as jest.Mock).mockResolvedValue([mockUsers[0]]);

      await loader.load(1);
      loader.clear(1);

      await loader.load(1);
      expect(prisma.sysUser.findMany).toHaveBeenCalledTimes(2);
    });

    it('should clear all cache', async () => {
      (prisma.sysUser.findMany as jest.Mock).mockResolvedValue(mockUsers);

      await loader.loadMany([1, 2]);
      loader.clearAll();

      await loader.load(1);
      expect(prisma.sysUser.findMany).toHaveBeenCalledTimes(2);
    });

    it('should prime cache with value', async () => {
      loader.prime(1, mockUsers[0]);

      const result = await loader.load(1);

      expect(result).toEqual(mockUsers[0]);
      expect(prisma.sysUser.findMany).not.toHaveBeenCalled();
    });
  });
});
