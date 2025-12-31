import { Test, TestingModule } from '@nestjs/testing';
import { RoleLoader } from './role.loader';
import { PrismaService } from '../../prisma/prisma.service';
import { DelFlagEnum } from '../enum';

describe('RoleLoader', () => {
  let loader: RoleLoader;
  let prisma: jest.Mocked<PrismaService>;

  const mockRoles = [
    {
      roleId: 1,
      roleName: '超级管理员',
      roleKey: 'admin',
      roleSort: 1,
      dataScope: '1',
      menuCheckStrictly: true,
      deptCheckStrictly: true,
      status: '0',
      delFlag: '0',
      tenantId: '000000',
      createBy: 'admin',
      createTime: new Date(),
      updateBy: null,
      updateTime: null,
      remark: '超级管理员',
    },
    {
      roleId: 2,
      roleName: '普通角色',
      roleKey: 'common',
      roleSort: 2,
      dataScope: '2',
      menuCheckStrictly: true,
      deptCheckStrictly: true,
      status: '0',
      delFlag: '0',
      tenantId: '000000',
      createBy: 'admin',
      createTime: new Date(),
      updateBy: null,
      updateTime: null,
      remark: '普通角色',
    },
  ];

  beforeEach(async () => {
    const mockPrisma = {
      sysRole: {
        findMany: jest.fn(),
      },
      sysUserRole: {
        findMany: jest.fn(),
        groupBy: jest.fn(),
      },
      sysRoleMenu: {
        findMany: jest.fn(),
      },
      sysRoleDept: {
        findMany: jest.fn(),
      },
      sysMenu: {
        findMany: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RoleLoader,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
      ],
    }).compile();

    loader = await module.resolve<RoleLoader>(RoleLoader);
    prisma = module.get(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('load', () => {
    it('should load a single role by ID', async () => {
      (prisma.sysRole.findMany as jest.Mock).mockResolvedValue([mockRoles[0]]);

      const result = await loader.load(1);

      expect(result).toEqual(mockRoles[0]);
      expect(prisma.sysRole.findMany).toHaveBeenCalledWith({
        where: {
          roleId: { in: [1] },
          delFlag: DelFlagEnum.NORMAL,
        },
      });
    });

    it('should return null for non-existent role', async () => {
      (prisma.sysRole.findMany as jest.Mock).mockResolvedValue([]);

      const result = await loader.load(999);

      expect(result).toBeNull();
    });

    it('should batch multiple load calls', async () => {
      (prisma.sysRole.findMany as jest.Mock).mockResolvedValue(mockRoles);

      const [result1, result2] = await Promise.all([loader.load(1), loader.load(2)]);

      expect(result1).toEqual(mockRoles[0]);
      expect(result2).toEqual(mockRoles[1]);
      expect(prisma.sysRole.findMany).toHaveBeenCalledTimes(1);
    });
  });

  describe('loadByUserIds', () => {
    it('should load roles for multiple users', async () => {
      (prisma.sysUserRole.findMany as jest.Mock).mockResolvedValue([
        { userId: 1, roleId: 1 },
        { userId: 1, roleId: 2 },
        { userId: 2, roleId: 2 },
      ]);
      (prisma.sysRole.findMany as jest.Mock).mockResolvedValue(mockRoles);

      const result = await loader.loadByUserIds([1, 2]);

      expect(result.get(1)).toHaveLength(2);
      expect(result.get(2)).toHaveLength(1);
      expect(result.get(2)?.[0]).toEqual(mockRoles[1]);
    });

    it('should return empty array for users without roles', async () => {
      (prisma.sysUserRole.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.sysRole.findMany as jest.Mock).mockResolvedValue([]);

      const result = await loader.loadByUserIds([1]);

      expect(result.get(1)).toEqual([]);
    });
  });

  describe('loadMenuIds', () => {
    it('should load menu IDs for roles', async () => {
      (prisma.sysRoleMenu.findMany as jest.Mock).mockResolvedValue([
        { roleId: 1, menuId: 100 },
        { roleId: 1, menuId: 101 },
        { roleId: 2, menuId: 100 },
      ]);

      const result = await loader.loadMenuIds([1, 2]);

      expect(result.get(1)).toEqual([100, 101]);
      expect(result.get(2)).toEqual([100]);
    });
  });

  describe('loadDeptIds', () => {
    it('should load dept IDs for roles', async () => {
      (prisma.sysRoleDept.findMany as jest.Mock).mockResolvedValue([
        { roleId: 1, deptId: 1 },
        { roleId: 1, deptId: 2 },
        { roleId: 2, deptId: 1 },
      ]);

      const result = await loader.loadDeptIds([1, 2]);

      expect(result.get(1)).toEqual([1, 2]);
      expect(result.get(2)).toEqual([1]);
    });
  });

  describe('loadPermissions', () => {
    it('should return all permissions for super admin role', async () => {
      const result = await loader.loadPermissions([1]);

      expect(result.get(1)).toEqual(['*:*:*']);
    });

    it('should load permissions for regular roles', async () => {
      (prisma.sysRoleMenu.findMany as jest.Mock).mockResolvedValue([
        { roleId: 2, menuId: 100 },
        { roleId: 2, menuId: 101 },
      ]);
      (prisma.sysMenu.findMany as jest.Mock).mockResolvedValue([
        { menuId: 100, perms: 'system:user:list' },
        { menuId: 101, perms: 'system:user:add' },
      ]);

      const result = await loader.loadPermissions([2]);

      expect(result.get(2)).toContain('system:user:list');
      expect(result.get(2)).toContain('system:user:add');
    });

    it('should handle mixed admin and regular roles', async () => {
      (prisma.sysRoleMenu.findMany as jest.Mock).mockResolvedValue([{ roleId: 2, menuId: 100 }]);
      (prisma.sysMenu.findMany as jest.Mock).mockResolvedValue([{ menuId: 100, perms: 'system:user:list' }]);

      const result = await loader.loadPermissions([1, 2]);

      expect(result.get(1)).toEqual(['*:*:*']);
      expect(result.get(2)).toContain('system:user:list');
    });
  });

  describe('loadUserCounts', () => {
    it('should load user counts for roles', async () => {
      (prisma.sysUserRole.groupBy as jest.Mock).mockResolvedValue([
        { roleId: 1, _count: { userId: 5 } },
        { roleId: 2, _count: { userId: 10 } },
      ]);

      const result = await loader.loadUserCounts([1, 2, 3]);

      expect(result.get(1)).toBe(5);
      expect(result.get(2)).toBe(10);
      expect(result.get(3)).toBe(0);
    });
  });

  describe('cache operations', () => {
    it('should clear cache for specific key', async () => {
      (prisma.sysRole.findMany as jest.Mock).mockResolvedValue([mockRoles[0]]);

      await loader.load(1);
      loader.clear(1);

      await loader.load(1);
      expect(prisma.sysRole.findMany).toHaveBeenCalledTimes(2);
    });

    it('should clear all cache', async () => {
      (prisma.sysRole.findMany as jest.Mock).mockResolvedValue(mockRoles);

      await loader.loadMany([1, 2]);
      loader.clearAll();

      await loader.load(1);
      expect(prisma.sysRole.findMany).toHaveBeenCalledTimes(2);
    });

    it('should prime cache with value', async () => {
      loader.prime(1, mockRoles[0]);

      const result = await loader.load(1);

      expect(result).toEqual(mockRoles[0]);
      expect(prisma.sysRole.findMany).not.toHaveBeenCalled();
    });
  });
});
