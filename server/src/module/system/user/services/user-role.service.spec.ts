import { Test, TestingModule } from '@nestjs/testing';
import { plainToInstance } from 'class-transformer';
import { UserRoleService } from './user-role.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { UserRepository } from '../user.repository';
import { RoleService } from '../../role/role.service';
import { createPrismaMock } from 'src/test-utils/prisma-mock';
import { StatusEnum, DelFlagEnum } from 'src/common/enum';
import { AllocatedListDto } from '../dto/list-user.dto';

describe('UserRoleService', () => {
  let service: UserRoleService;
  let prisma: jest.Mocked<PrismaService>;
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
    password: 'hashed_password',
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
    leader: '张三',
    phone: '13800138000',
    email: 'dept@example.com',
    status: StatusEnum.NORMAL,
    delFlag: DelFlagEnum.NORMAL,
    createBy: 'admin',
    createTime: new Date(),
    updateBy: 'admin',
    updateTime: new Date(),
  };

  const mockRoles = [
    {
      roleId: 1,
      tenantId: '000000',
      roleName: '超级管理员',
      roleKey: 'admin',
      roleSort: 1,
      dataScope: 'ALL' as any,
      menuCheckStrictly: false,
      deptCheckStrictly: false,
      status: StatusEnum.NORMAL,
      delFlag: DelFlagEnum.NORMAL,
      createBy: 'admin',
      createTime: new Date(),
      updateBy: 'admin',
      updateTime: new Date(),
      remark: null,
    },
    {
      roleId: 2,
      tenantId: '000000',
      roleName: '普通用户',
      roleKey: 'user',
      roleSort: 2,
      dataScope: 'CUSTOM' as any,
      menuCheckStrictly: false,
      deptCheckStrictly: false,
      status: StatusEnum.NORMAL,
      delFlag: DelFlagEnum.NORMAL,
      createBy: 'admin',
      createTime: new Date(),
      updateBy: 'admin',
      updateTime: new Date(),
      remark: null,
    },
  ];

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserRoleService,
        {
          provide: PrismaService,
          useValue: createPrismaMock(),
        },
        {
          provide: UserRepository,
          useValue: {
            findById: jest.fn(),
          },
        },
        {
          provide: RoleService,
          useValue: {
            findRoles: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<UserRoleService>(UserRoleService);
    prisma = module.get(PrismaService);
    userRepo = module.get(UserRepository);
    roleService = module.get(RoleService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('authRole', () => {
    it('should get user role authorization info', async () => {
      userRepo.findById.mockResolvedValue(mockUser);
      roleService.findRoles.mockResolvedValue(mockRoles);
      (prisma.sysDept.findFirst as jest.Mock).mockResolvedValue(mockDept);
      (prisma.sysUserRole.findMany as jest.Mock).mockResolvedValue([{ roleId: 2 } as any]);

      const result = await service.authRole(1);

      expect(result.code).toBe(200);
      expect(result.data).toHaveProperty('roles');
      expect(result.data).toHaveProperty('user');
      expect(result.data.user.roles).toHaveLength(2);
      expect(result.data.user.roles[1]).toHaveProperty('flag', true);
    });

    it('should throw error for non-existent user', async () => {
      userRepo.findById.mockResolvedValue(null);
      roleService.findRoles.mockResolvedValue(mockRoles);

      await expect(service.authRole(999)).rejects.toThrow();
    });

    it('should handle user without department', async () => {
      const userWithoutDept = { ...mockUser, deptId: null };
      userRepo.findById.mockResolvedValue(userWithoutDept);
      roleService.findRoles.mockResolvedValue(mockRoles);
      (prisma.sysUserRole.findMany as jest.Mock).mockResolvedValue([]);

      const result = await service.authRole(1);

      expect(result.code).toBe(200);
      expect(result.data.user.dept).toBeNull();
    });
  });

  describe('updateAuthRole', () => {
    it('should update user role authorization', async () => {
      const query = { userId: 1, roleIds: '2,3' };
      (prisma.sysUserRole.deleteMany as jest.Mock).mockResolvedValue({ count: 0 });
      (prisma.sysUserRole.createMany as jest.Mock).mockResolvedValue({ count: 2 });

      const result = await service.updateAuthRole(query);

      expect(result.code).toBe(200);
      expect(prisma.sysUserRole.deleteMany).toHaveBeenCalledWith({
        where: { userId: 1 },
      });
      expect(prisma.sysUserRole.createMany).toHaveBeenCalled();
    });

    it('should exclude super admin role (roleId=1)', async () => {
      const query = { userId: 2, roleIds: '1,2,3' };
      (prisma.sysUserRole.deleteMany as jest.Mock).mockResolvedValue({ count: 0 });
      (prisma.sysUserRole.createMany as jest.Mock).mockResolvedValue({ count: 2 });

      await service.updateAuthRole(query);

      const createCall = (prisma.sysUserRole.createMany as jest.Mock).mock.calls[0][0];
      const roleIds = createCall.data.map((item: any) => item.roleId);
      expect(roleIds).not.toContain(1);
      expect(roleIds).toEqual([2, 3]);
    });
  });

  describe('allocatedList', () => {
    it('should get allocated user list for role', async () => {
      const query = plainToInstance(AllocatedListDto, { roleId: 2, pageNum: 1, pageSize: 10 });
      (prisma.sysUserRole.findMany as jest.Mock).mockResolvedValue([
        { userId: 1 } as any,
        { userId: 2 } as any,
      ]);
      (prisma.$transaction as jest.Mock).mockResolvedValue([[mockUser], 1]);
      (prisma.sysDept.findMany as jest.Mock).mockResolvedValue([mockDept]);

      const result = await service.allocatedList(query);

      expect(result.code).toBe(200);
      expect(result.data.rows).toHaveLength(1);
      expect(result.data.total).toBe(1);
    });

    it('should return empty list when no users allocated', async () => {
      const query = plainToInstance(AllocatedListDto, { roleId: 2, pageNum: 1, pageSize: 10 });
      (prisma.sysUserRole.findMany as jest.Mock).mockResolvedValue([]);

      const result = await service.allocatedList(query);

      expect(result.code).toBe(200);
      expect(result.data.rows).toHaveLength(0);
      expect(result.data.total).toBe(0);
    });

    it('should filter by userName', async () => {
      const query = plainToInstance(AllocatedListDto, { roleId: 2, userName: 'test', pageNum: 1, pageSize: 10 });
      (prisma.sysUserRole.findMany as jest.Mock).mockResolvedValue([{ userId: 1 } as any]);
      (prisma.$transaction as jest.Mock).mockResolvedValue([[mockUser], 1]);
      (prisma.sysDept.findMany as jest.Mock).mockResolvedValue([mockDept]);

      await service.allocatedList(query);

      expect(prisma.$transaction).toHaveBeenCalled();
    });
  });

  describe('unallocatedList', () => {
    it('should get unallocated user list for role', async () => {
      const query = plainToInstance(AllocatedListDto, { roleId: 2, pageNum: 1, pageSize: 10 });
      (prisma.sysUserRole.findMany as jest.Mock).mockResolvedValue([{ userId: 1 } as any]);
      (prisma.$transaction as jest.Mock).mockResolvedValue([[mockUser], 1]);
      (prisma.sysDept.findMany as jest.Mock).mockResolvedValue([mockDept]);

      const result = await service.unallocatedList(query);

      expect(result.code).toBe(200);
      expect(result.data.rows).toHaveLength(1);
    });

    it('should exclude allocated users', async () => {
      const query = plainToInstance(AllocatedListDto, { roleId: 2, pageNum: 1, pageSize: 10 });
      (prisma.sysUserRole.findMany as jest.Mock).mockResolvedValue([{ userId: 1 } as any]);
      (prisma.$transaction as jest.Mock).mockResolvedValue([[], 0]);

      await service.unallocatedList(query);

      expect(prisma.$transaction).toHaveBeenCalled();
    });
  });

  describe('authUserCancel', () => {
    it('should cancel user role authorization', async () => {
      const data = { userId: 1, roleId: 2 };
      (prisma.sysUserRole.deleteMany as jest.Mock).mockResolvedValue({ count: 1 });

      const result = await service.authUserCancel(data);

      expect(result.code).toBe(200);
      expect(prisma.sysUserRole.deleteMany).toHaveBeenCalledWith({
        where: { userId: 1, roleId: 2 },
      });
    });
  });

  describe('authUserCancelAll', () => {
    it('should batch cancel user role authorization', async () => {
      const data = { userIds: '1,2,3', roleId: 2 };
      (prisma.sysUserRole.deleteMany as jest.Mock).mockResolvedValue({ count: 3 });

      const result = await service.authUserCancelAll(data);

      expect(result.code).toBe(200);
      expect(prisma.sysUserRole.deleteMany).toHaveBeenCalledWith({
        where: {
          userId: { in: [1, 2, 3] },
          roleId: 2,
        },
      });
    });
  });

  describe('authUserSelectAll', () => {
    it('should batch select user role authorization', async () => {
      const data = { userIds: '1,2,3', roleId: 2 };
      (prisma.sysUserRole.createMany as jest.Mock).mockResolvedValue({ count: 3 });

      const result = await service.authUserSelectAll(data);

      expect(result.code).toBe(200);
      expect(prisma.sysUserRole.createMany).toHaveBeenCalledWith({
        data: [
          { userId: 1, roleId: 2 },
          { userId: 2, roleId: 2 },
          { userId: 3, roleId: 2 },
        ],
        skipDuplicates: true,
      });
    });
  });
});
