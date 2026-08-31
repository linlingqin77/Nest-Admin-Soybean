/**
 * @file user-role.service.spec.ts
 * @description Migrated from src/modules/users/services/user-role.service.spec.ts
 * Unit tests for UserRoleService
 */
import { Test, TestingModule } from '@nestjs/testing';
import { UserRoleService } from '@/modules/users/services/user-role.service';
import { PrismaService } from '@/platform/prisma';
import { UserRepository } from '@/modules/users/user.repository';
import { RoleService } from '@/modules/roles/role.service';
import { BusinessException } from '@/shared/exceptions';

describe('UserRoleService', () => {
  let service: UserRoleService;
  let prismaMock: any;
  let userRepoMock: any;
  let roleServiceMock: any;

  beforeEach(async () => {
    prismaMock = {
      sysDept: {
        findMany: jest.fn().mockResolvedValue([]),
        findFirst: jest.fn().mockResolvedValue(null),
      },
      sysUserRole: {
        findMany: jest.fn().mockResolvedValue([]),
        deleteMany: jest.fn().mockResolvedValue({ count: 1 }),
        createMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
      sysUser: {
        findMany: jest.fn().mockResolvedValue([]),
        count: jest.fn().mockResolvedValue(0),
      },
      $transaction: jest.fn().mockImplementation(async (arg) => {
        if (typeof arg === 'function') return arg(prismaMock);
        return arg;
      }),
    };

    userRepoMock = {
      findById: jest.fn().mockResolvedValue(null),
    };

    roleServiceMock = {
      findRoles: jest.fn().mockResolvedValue([]),
    };

    const modules: TestingModule = await Test.createTestingModule({
      providers: [
        UserRoleService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: UserRepository, useValue: userRepoMock },
        { provide: RoleService, useValue: roleServiceMock },
      ],
    }).compile();

    service = modules.get<UserRoleService>(UserRoleService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('authRole', () => {
    it('should throw error when user not found', async () => {
      userRepoMock.findById.mockResolvedValue(null);

      await expect(service.authRole(999)).rejects.toThrow(BusinessException);
    });

    it('should return user with roles', async () => {
      const mockUser = { userId: 1, userName: 'admin', deptId: 100 };
      const mockRoles = [
        { roleId: 1, roleName: 'Admin' },
        { roleId: 2, roleName: 'User' },
      ];
      const mockDept = { deptId: 100, deptName: 'IT' };

      userRepoMock.findById.mockResolvedValue(mockUser);
      roleServiceMock.findRoles.mockResolvedValue(mockRoles);
      prismaMock.sysDept.findFirst.mockResolvedValue(mockDept);
      prismaMock.sysUserRole.findMany.mockResolvedValue([{ roleId: 1 }]);

      const result = await service.authRole(1);

      expect(result.code).toBe(200);
      expect(result.data.user.userId).toBe(1);
      expect(result.data.roles).toHaveLength(2);
    });

    it('should handle user without dept', async () => {
      const mockUser = { userId: 1, userName: 'admin', deptId: null };
      userRepoMock.findById.mockResolvedValue(mockUser);
      roleServiceMock.findRoles.mockResolvedValue([]);

      const result = await service.authRole(1);

      expect(result.code).toBe(200);
      expect(result.data.user.dept).toBeNull();
    });
  });

  describe('updateAuthRole', () => {
    it('should update user roles', async () => {
      const result = await service.updateAuthRole({ userId: 1, roleIds: '2,3' });

      expect(result.code).toBe(200);
      expect(prismaMock.sysUserRole.deleteMany).toHaveBeenCalledWith({ where: { userId: 1 } });
      expect(prismaMock.sysUserRole.createMany).toHaveBeenCalled();
    });

    it('should exclude super admin role (roleId=1)', async () => {
      await service.updateAuthRole({ userId: 1, roleIds: '1,2,3' });

      const createCall = prismaMock.sysUserRole.createMany.mock.calls[0][0];
      const roleIds = createCall.data.map((d: any) => d.roleId);
      expect(roleIds).not.toContain(1);
      expect(roleIds).toContain(2);
      expect(roleIds).toContain(3);
    });

    it('should not create roles when only super admin role provided', async () => {
      await service.updateAuthRole({ userId: 1, roleIds: '1' });

      expect(prismaMock.sysUserRole.createMany).not.toHaveBeenCalled();
    });
  });

  describe('allocatedList', () => {
    it('should return empty list when no users allocated', async () => {
      prismaMock.sysUserRole.findMany.mockResolvedValue([]);

      const result = await service.allocatedList({ roleId: '1', pageNum: 1, pageSize: 10 } as any);

      expect(result.code).toBe(200);
      expect(result.data.rows).toEqual([]);
    });

    it('should return allocated users', async () => {
      prismaMock.sysUserRole.findMany.mockResolvedValue([{ userId: 1 }, { userId: 2 }]);
      prismaMock.$transaction.mockResolvedValue([[{ userId: 1, userName: 'user1', deptId: 100 }], 1]);
      prismaMock.sysDept.findMany.mockResolvedValue([{ deptId: 100, deptName: 'IT' }]);

      const result = await service.allocatedList({ roleId: '1', pageNum: 1, pageSize: 10 } as any);

      expect(result.code).toBe(200);
      expect(result.data.rows).toHaveLength(1);
    });

    it('should filter by userName', async () => {
      prismaMock.sysUserRole.findMany.mockResolvedValue([{ userId: 1 }]);
      prismaMock.$transaction.mockResolvedValue([[], 0]);

      await service.allocatedList({ roleId: '1', userName: 'admin', pageNum: 1, pageSize: 10 } as any);

      expect(prismaMock.$transaction).toHaveBeenCalled();
    });

    it('should filter by phonenumber', async () => {
      prismaMock.sysUserRole.findMany.mockResolvedValue([{ userId: 1 }]);
      prismaMock.$transaction.mockResolvedValue([[], 0]);

      await service.allocatedList({ roleId: '1', phonenumber: '138', pageNum: 1, pageSize: 10 } as any);

      expect(prismaMock.$transaction).toHaveBeenCalled();
    });
  });

  describe('unallocatedList', () => {
    it('should return unallocated users', async () => {
      prismaMock.sysUserRole.findMany.mockResolvedValue([{ userId: 1 }]);
      prismaMock.$transaction.mockResolvedValue([[{ userId: 2, userName: 'user2', deptId: 100 }], 1]);
      prismaMock.sysDept.findMany.mockResolvedValue([{ deptId: 100, deptName: 'IT' }]);

      const result = await service.unallocatedList({ roleId: '1', pageNum: 1, pageSize: 10 } as any);

      expect(result.code).toBe(200);
    });

    it('should return all users when no one allocated', async () => {
      prismaMock.sysUserRole.findMany.mockResolvedValue([]);
      prismaMock.$transaction.mockResolvedValue([[], 0]);

      const result = await service.unallocatedList({ roleId: '1', pageNum: 1, pageSize: 10 } as any);

      expect(result.code).toBe(200);
    });
  });

  describe('authUserCancel', () => {
    it('should cancel user role authorization', async () => {
      const result = await service.authUserCancel({ userId: 1, roleId: 2 });

      expect(result.code).toBe(200);
      expect(prismaMock.sysUserRole.deleteMany).toHaveBeenCalledWith({
        where: { userId: 1, roleId: 2 },
      });
    });
  });

  describe('authUserCancelAll', () => {
    it('should cancel all user role authorizations', async () => {
      const result = await service.authUserCancelAll({ userIds: '1,2,3', roleId: 2 });

      expect(result.code).toBe(200);
      expect(prismaMock.sysUserRole.deleteMany).toHaveBeenCalledWith({
        where: { userId: { in: [1, 2, 3] }, roleId: 2 },
      });
    });
  });

  describe('authUserSelectAll', () => {
    it('should select all user role authorizations', async () => {
      const result = await service.authUserSelectAll({ userIds: '1,2,3', roleId: 2 });

      expect(result.code).toBe(200);
      expect(prismaMock.sysUserRole.createMany).toHaveBeenCalledWith({
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
