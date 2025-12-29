import { Test, TestingModule } from '@nestjs/testing';
import { RoleRepository } from './role.repository';
import { PrismaService } from 'src/prisma/prisma.service';
import { createPrismaMock } from 'src/test-utils/prisma-mock';
import { DelFlagEnum, StatusEnum } from 'src/common/enum/index';

describe('RoleRepository', () => {
  let repository: RoleRepository;
  let prisma: ReturnType<typeof createPrismaMock>;

  const mockRole = {
    roleId: 1,
    tenantId: '000000',
    roleName: '管理员',
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
  };

  beforeEach(async () => {
    prisma = createPrismaMock();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RoleRepository,
        {
          provide: PrismaService,
          useValue: prisma,
        },
      ],
    }).compile();

    repository = module.get<RoleRepository>(RoleRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findByRoleKey', () => {
    it('should find role by role key', async () => {
      (prisma.sysRole.findFirst as jest.Mock).mockResolvedValue(mockRole);

      const result = await repository.findByRoleKey('admin');

      expect(result).toEqual(mockRole);
      expect(prisma.sysRole.findFirst).toHaveBeenCalledWith({
        where: { roleKey: 'admin', delFlag: DelFlagEnum.NORMAL },
      });
    });

    it('should return null when role not found', async () => {
      (prisma.sysRole.findFirst as jest.Mock).mockResolvedValue(null);

      const result = await repository.findByRoleKey('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('findByRoleName', () => {
    it('should find role by role name', async () => {
      (prisma.sysRole.findFirst as jest.Mock).mockResolvedValue(mockRole);

      const result = await repository.findByRoleName('管理员');

      expect(result).toEqual(mockRole);
    });

    it('should return null when role not found', async () => {
      (prisma.sysRole.findFirst as jest.Mock).mockResolvedValue(null);

      const result = await repository.findByRoleName('不存在的角色');

      expect(result).toBeNull();
    });
  });

  describe('existsByRoleKey', () => {
    it('should return true when role key exists', async () => {
      (prisma.sysRole.count as jest.Mock).mockResolvedValue(1);

      const result = await repository.existsByRoleKey('admin');

      expect(result).toBe(true);
    });

    it('should return false when role key does not exist', async () => {
      (prisma.sysRole.count as jest.Mock).mockResolvedValue(0);

      const result = await repository.existsByRoleKey('nonexistent');

      expect(result).toBe(false);
    });

    it('should exclude specific role id', async () => {
      (prisma.sysRole.count as jest.Mock).mockResolvedValue(0);

      const result = await repository.existsByRoleKey('admin', 1);

      expect(result).toBe(false);
      expect(prisma.sysRole.count).toHaveBeenCalledWith({
        where: {
          roleKey: 'admin',
          delFlag: DelFlagEnum.NORMAL,
          roleId: { not: 1 },
        },
      });
    });
  });

  describe('existsByRoleName', () => {
    it('should return true when role name exists', async () => {
      (prisma.sysRole.count as jest.Mock).mockResolvedValue(1);

      const result = await repository.existsByRoleName('管理员');

      expect(result).toBe(true);
    });

    it('should return false when role name does not exist', async () => {
      (prisma.sysRole.count as jest.Mock).mockResolvedValue(0);

      const result = await repository.existsByRoleName('不存在的角色');

      expect(result).toBe(false);
    });

    it('should exclude specific role id', async () => {
      (prisma.sysRole.count as jest.Mock).mockResolvedValue(0);

      const result = await repository.existsByRoleName('管理员', 1);

      expect(result).toBe(false);
    });
  });

  describe('findUserRoles', () => {
    it('should find roles for a user', async () => {
      (prisma.sysRole.findMany as jest.Mock).mockResolvedValue([mockRole]);

      const result = await repository.findUserRoles(1);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(mockRole);
    });

    it('should return empty array when user has no roles', async () => {
      (prisma.sysRole.findMany as jest.Mock).mockResolvedValue([]);

      const result = await repository.findUserRoles(999);

      expect(result).toHaveLength(0);
    });
  });

  describe('findPageWithMenuCount', () => {
    it('should return paginated roles with menu count', async () => {
      (prisma.$transaction as jest.Mock).mockResolvedValue([[mockRole], 1]);
      (prisma.sysRoleMenu.groupBy as jest.Mock).mockResolvedValue([
        { roleId: 1, _count: { menuId: 5 } },
      ]);

      const result = await repository.findPageWithMenuCount(
        { delFlag: DelFlagEnum.NORMAL },
        0,
        10
      );

      expect(result.list).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.list[0].menuCount).toBe(5);
    });

    it('should return 0 menu count when role has no menus', async () => {
      (prisma.$transaction as jest.Mock).mockResolvedValue([[mockRole], 1]);
      (prisma.sysRoleMenu.groupBy as jest.Mock).mockResolvedValue([]);

      const result = await repository.findPageWithMenuCount(
        { delFlag: DelFlagEnum.NORMAL },
        0,
        10
      );

      expect(result.list[0].menuCount).toBe(0);
    });

    it('should use custom orderBy', async () => {
      (prisma.$transaction as jest.Mock).mockResolvedValue([[], 0]);
      (prisma.sysRoleMenu.groupBy as jest.Mock).mockResolvedValue([]);

      await repository.findPageWithMenuCount(
        { delFlag: DelFlagEnum.NORMAL },
        0,
        10,
        { roleName: 'asc' }
      );

      expect(prisma.$transaction).toHaveBeenCalled();
    });
  });

  describe('softDeleteBatch', () => {
    it('should soft delete multiple roles', async () => {
      (prisma.sysRole.updateMany as jest.Mock).mockResolvedValue({ count: 2 });

      const result = await repository.softDeleteBatch([1, 2]);

      expect(result).toBe(2);
      expect(prisma.sysRole.updateMany).toHaveBeenCalledWith({
        where: {
          roleId: { in: [1, 2] },
          delFlag: DelFlagEnum.NORMAL,
        },
        data: { delFlag: DelFlagEnum.DELETED },
      });
    });

    it('should return 0 when no roles deleted', async () => {
      (prisma.sysRole.updateMany as jest.Mock).mockResolvedValue({ count: 0 });

      const result = await repository.softDeleteBatch([999]);

      expect(result).toBe(0);
    });
  });

  describe('findRoleMenuIds', () => {
    it('should return menu ids for a role', async () => {
      (prisma.sysRoleMenu.findMany as jest.Mock).mockResolvedValue([
        { menuId: 1 },
        { menuId: 2 },
        { menuId: 3 },
      ]);

      const result = await repository.findRoleMenuIds(1);

      expect(result).toEqual([1, 2, 3]);
    });

    it('should return empty array when role has no menus', async () => {
      (prisma.sysRoleMenu.findMany as jest.Mock).mockResolvedValue([]);

      const result = await repository.findRoleMenuIds(999);

      expect(result).toHaveLength(0);
    });
  });

  describe('findById', () => {
    it('should find role by id', async () => {
      (prisma.sysRole.findUnique as jest.Mock).mockResolvedValue(mockRole);

      const result = await repository.findById(1);

      expect(result).toEqual(mockRole);
    });

    it('should return null when role is soft deleted', async () => {
      (prisma.sysRole.findUnique as jest.Mock).mockResolvedValue({
        ...mockRole,
        delFlag: DelFlagEnum.DELETED,
      });

      const result = await repository.findById(1);

      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    it('should create a new role', async () => {
      const createData = {
        roleName: '新角色',
        roleKey: 'newrole',
        roleSort: 2,
      };

      (prisma.sysRole.create as jest.Mock).mockResolvedValue({ ...mockRole, ...createData });

      const result = await repository.create(createData as any);

      expect(result.roleName).toBe('新角色');
      expect(prisma.sysRole.create).toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('should update role', async () => {
      const updateData = { roleName: '更新后的角色' };

      (prisma.sysRole.update as jest.Mock).mockResolvedValue({ ...mockRole, ...updateData });

      const result = await repository.update(1, updateData);

      expect(result.roleName).toBe('更新后的角色');
    });
  });
});
