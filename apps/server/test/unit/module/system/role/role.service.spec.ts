/** @file role.service.spec.ts @description Migrated from src/modules/roles/role.service.spec.ts */

import { Test, TestingModule } from '@nestjs/testing';
import { RoleService } from '@/modules/roles/role.service';
import { PrismaService } from '@/platform/prisma';
import { RoleRepository } from '@/modules/roles/role.repository';
import { MenuService } from '@/modules/menus/menu.service';

describe('RoleService', () => {
  let service: RoleService;
  let prismaMock: any;
  let roleRepoMock: any;
  let menuServiceMock: any;

  beforeEach(async () => {
    prismaMock = {
      sysRole: {
        create: jest.fn().mockResolvedValue({ roleId: 1 }),
        update: jest.fn().mockResolvedValue({ roleId: 1 }),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
        findMany: jest.fn().mockResolvedValue([]),
      },
      sysRoleMenu: {
        createMany: jest.fn().mockResolvedValue({ count: 1 }),
        deleteMany: jest.fn().mockResolvedValue({ count: 1 }),
        findMany: jest.fn().mockResolvedValue([]),
      },
      sysRoleDept: {
        createMany: jest.fn().mockResolvedValue({ count: 1 }),
        deleteMany: jest.fn().mockResolvedValue({ count: 1 }),
        findMany: jest.fn().mockResolvedValue([]),
      },
      sysDept: {
        findMany: jest.fn().mockResolvedValue([]),
      },
      sysMenu: {
        findMany: jest.fn().mockResolvedValue([]),
      },
      $transaction: jest.fn().mockImplementation(async (arg) => {
        if (typeof arg === 'function') return arg(prismaMock);
        return arg;
      }),
    };

    roleRepoMock = {
      findById: jest.fn().mockResolvedValue({ roleId: 1, roleName: 'Test' }),
      findPageWithMenuCount: jest.fn().mockResolvedValue({ list: [], total: 0 }),
    };

    menuServiceMock = {};

    const modules: TestingModule = await Test.createTestingModule({
      providers: [
        RoleService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: RoleRepository, useValue: roleRepoMock },
        { provide: MenuService, useValue: menuServiceMock },
      ],
    }).compile();

    service = modules.get<RoleService>(RoleService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create role without menu ids', async () => {
      const result = await service.create({ roleName: 'Test', roleKey: 'test' } as any);

      expect(result.code).toBe(200);
      expect(prismaMock.sysRole.create).toHaveBeenCalled();
      expect(prismaMock.sysRoleMenu.createMany).not.toHaveBeenCalled();
    });

    it('should create role with menu ids', async () => {
      const result = await service.create({ roleName: 'Test', roleKey: 'test', menuIds: [1, 2, 3] } as any);

      expect(result.code).toBe(200);
      expect(prismaMock.sysRole.create).toHaveBeenCalled();
      expect(prismaMock.sysRoleMenu.createMany).toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('should return paginated roles', async () => {
      roleRepoMock.findPageWithMenuCount.mockResolvedValue({
        list: [{ roleId: 1, roleName: 'Admin' }],
        total: 1,
      });

      const result = await service.findAll({ pageNum: 1, pageSize: 10 } as any);

      expect(result.code).toBe(200);
      expect(result.data!.rows).toHaveLength(1);
    });

    it('should filter by roleName', async () => {
      await service.findAll({ roleName: 'admin', pageNum: 1, pageSize: 10 } as any);

      expect(roleRepoMock.findPageWithMenuCount).toHaveBeenCalled();
    });

    it('should filter by roleKey', async () => {
      await service.findAll({ roleKey: 'admin', pageNum: 1, pageSize: 10 } as any);

      expect(roleRepoMock.findPageWithMenuCount).toHaveBeenCalled();
    });

    it('should filter by status', async () => {
      await service.findAll({ status: '0', pageNum: 1, pageSize: 10 } as any);

      expect(roleRepoMock.findPageWithMenuCount).toHaveBeenCalled();
    });

    it('should filter by date range', async () => {
      await service.findAll({
        params: { beginTime: '2024-01-01', endTime: '2024-12-31' },
        pageNum: 1,
        pageSize: 10,
      } as any);

      expect(roleRepoMock.findPageWithMenuCount).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return role detail', async () => {
      const result = await service.findOne(1);

      expect(result.code).toBe(200);
      expect(roleRepoMock.findById).toHaveBeenCalledWith(1);
    });
  });

  describe('update', () => {
    it('should update role without menu ids', async () => {
      const result = await service.update({ roleId: 1, roleName: 'Updated' } as any);

      expect(result.code).toBe(200);
      expect(prismaMock.sysRoleMenu.deleteMany).toHaveBeenCalled();
      expect(prismaMock.sysRole.update).toHaveBeenCalled();
    });

    it('should update role with menu ids', async () => {
      const result = await service.update({ roleId: 1, roleName: 'Updated', menuIds: [1, 2] } as any);

      expect(result.code).toBe(200);
      expect(prismaMock.sysRoleMenu.deleteMany).toHaveBeenCalled();
      expect(prismaMock.sysRoleMenu.createMany).toHaveBeenCalled();
    });
  });

  describe('dataScope', () => {
    it('should update data scope without dept ids', async () => {
      const result = await service.dataScope({ roleId: 1, dataScope: '1' } as any);

      expect(result.code).toBe(200);
      expect(prismaMock.sysRoleDept.deleteMany).toHaveBeenCalled();
    });

    it('should update data scope with dept ids', async () => {
      const result = await service.dataScope({ roleId: 1, dataScope: '2', deptIds: [100, 101] } as any);

      expect(result.code).toBe(200);
      expect(prismaMock.sysRoleDept.createMany).toHaveBeenCalled();
    });
  });

  describe('changeStatus', () => {
    it('should change role status', async () => {
      const result = await service.changeStatus({ roleId: 1, status: '1' });

      expect(result.code).toBe(200);
      expect(prismaMock.sysRole.update).toHaveBeenCalledWith({
        where: { roleId: 1 },
        data: { status: '1' },
      });
    });
  });

  describe('remove', () => {
    it('should soft delete roles', async () => {
      const result = await service.remove([1, 2, 3]);

      expect(result.code).toBe(200);
      expect(prismaMock.sysRole.updateMany).toHaveBeenCalledWith({
        where: { roleId: { in: [1, 2, 3] } },
        data: { delFlag: '1' },
      });
    });
  });

  describe('deptTree', () => {
    it('should return dept tree with checked keys', async () => {
      prismaMock.sysDept.findMany.mockResolvedValue([
        { deptId: 100, deptName: 'Root', parentId: 0 },
        { deptId: 101, deptName: 'Child', parentId: 100 },
      ]);
      prismaMock.sysRoleDept.findMany.mockResolvedValue([{ deptId: 100 }]);

      const result = await service.deptTree(1);

      expect(result.code).toBe(200);
      expect(result.data!.checkedKeys).toContain(100);
    });
  });

  describe('getPermissionsByRoleIds', () => {
    it('should return all permissions for super admin', async () => {
      const result = await service.getPermissionsByRoleIds([1]);

      expect(result).toEqual([{ perms: '*:*:*' }]);
    });

    it('should return empty for no roles', async () => {
      const result = await service.getPermissionsByRoleIds([]);

      expect(result).toEqual([]);
    });

    it('should return permissions for normal roles', async () => {
      prismaMock.sysRoleMenu.findMany.mockResolvedValue([{ menuId: 1 }, { menuId: 2 }]);
      prismaMock.sysMenu.findMany.mockResolvedValue([{ perms: 'system:user:list' }, { perms: 'system:user:add' }]);

      const result = await service.getPermissionsByRoleIds([2]);

      expect(result).toHaveLength(2);
    });

    it('should return empty when no role menus', async () => {
      prismaMock.sysRoleMenu.findMany.mockResolvedValue([]);

      const result = await service.getPermissionsByRoleIds([2]);

      expect(result).toEqual([]);
    });
  });

  describe('optionselect', () => {
    it('should return all roles', async () => {
      prismaMock.sysRole.findMany.mockResolvedValue([{ roleId: 1, roleName: 'Admin' }]);

      const result = await service.optionselect();

      expect(result.code).toBe(200);
    });

    it('should filter by role ids', async () => {
      await service.optionselect([1, 2]);

      expect(prismaMock.sysRole.findMany).toHaveBeenCalledWith({
        where: expect.objectContaining({
          roleId: { in: [1, 2] },
        }),
        orderBy: { roleSort: 'asc' },
      });
    });
  });

  describe('findRoleWithDeptIds', () => {
    it('should return dept ids for role', async () => {
      prismaMock.sysRoleDept.findMany.mockResolvedValue([{ deptId: 100 }, { deptId: 101 }]);

      const result = await service.findRoleWithDeptIds(1);

      expect(result).toEqual([100, 101]);
    });

    it('should return empty array when no dept ids', async () => {
      prismaMock.sysRoleDept.findMany.mockResolvedValue([]);

      const result = await service.findRoleWithDeptIds(999);

      expect(result).toEqual([]);
    });
  });

  describe('findRoles', () => {
    it('should return roles with custom args', async () => {
      const mockRoles = [{ roleId: 1, roleName: 'Admin' }];
      prismaMock.sysRole.findMany.mockResolvedValue(mockRoles);

      const result = await service.findRoles({ where: { status: '0' } });

      expect(result).toEqual(mockRoles);
      expect(prismaMock.sysRole.findMany).toHaveBeenCalledWith({ where: { status: '0' } });
    });
  });

  describe('create - edge cases', () => {
    it('should create role with default values', async () => {
      const result = await service.create({ roleName: 'Test', roleKey: 'test' } as any);

      expect(result.code).toBe(200);
      expect(prismaMock.sysRole.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          roleName: 'Test',
          roleKey: 'test',
          roleSort: 0,
          status: '0',
          delFlag: '0',
        }),
      });
    });

    it('should create role with custom sort and status', async () => {
      const result = await service.create({
        roleName: 'Test',
        roleKey: 'test',
        roleSort: 5,
        status: '1',
      } as any);

      expect(result.code).toBe(200);
      expect(prismaMock.sysRole.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          roleSort: 5,
          status: '1',
        }),
      });
    });
  });

  describe('update - edge cases', () => {
    it('should update role and clear all menu associations when menuIds is empty', async () => {
      const result = await service.update({ roleId: 1, roleName: 'Updated', menuIds: [] } as any);

      expect(result.code).toBe(200);
      expect(prismaMock.sysRoleMenu.deleteMany).toHaveBeenCalledWith({ where: { roleId: 1 } });
      expect(prismaMock.sysRoleMenu.createMany).not.toHaveBeenCalled();
    });
  });

  describe('dataScope - edge cases', () => {
    it('should update data scope and clear all dept associations when deptIds is empty', async () => {
      const result = await service.dataScope({ roleId: 1, dataScope: '1', deptIds: [] } as any);

      expect(result.code).toBe(200);
      expect(prismaMock.sysRoleDept.deleteMany).toHaveBeenCalledWith({ where: { roleId: 1 } });
      expect(prismaMock.sysRoleDept.createMany).not.toHaveBeenCalled();
    });
  });

  describe('getPermissionsByRoleIds - edge cases', () => {
    it('should filter out null/empty perms', async () => {
      prismaMock.sysRoleMenu.findMany.mockResolvedValue([{ menuId: 1 }, { menuId: 2 }]);
      prismaMock.sysMenu.findMany.mockResolvedValue([
        { perms: 'system:user:list' },
        { perms: null },
        { perms: '' },
        { perms: 'system:user:add' },
      ]);

      const result = await service.getPermissionsByRoleIds([2]);

      // 应该过滤掉 null 和空字符串
      expect(result.length).toBeLessThanOrEqual(2);
    });

    it('should deduplicate permissions', async () => {
      prismaMock.sysRoleMenu.findMany.mockResolvedValue([{ menuId: 1 }, { menuId: 2 }]);
      prismaMock.sysMenu.findMany.mockResolvedValue([
        { perms: 'system:user:list' },
        { perms: 'system:user:list' }, // 重复
        { perms: 'system:user:add' },
      ]);

      const result = await service.getPermissionsByRoleIds([2]);

      // 应该去重
      expect(result.length).toBe(2);
    });
  });

  describe('deptTree - edge cases', () => {
    it('should return empty tree when no depts', async () => {
      prismaMock.sysDept.findMany.mockResolvedValue([]);
      prismaMock.sysRoleDept.findMany.mockResolvedValue([]);

      const result = await service.deptTree(1);

      expect(result.code).toBe(200);
      expect(result.data!.depts).toEqual([]);
      expect(result.data!.checkedKeys).toEqual([]);
    });
  });
});
