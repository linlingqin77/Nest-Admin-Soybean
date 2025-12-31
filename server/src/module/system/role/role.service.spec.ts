import { Test, TestingModule } from '@nestjs/testing';
import { RoleService } from './role.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { RoleRepository } from './role.repository';
import { MenuService } from '../menu/menu.service';
import { DelFlagEnum, StatusEnum } from 'src/common/enum/index';
import { ResponseCode } from 'src/common/response';

describe('RoleService', () => {
  let service: RoleService;
  let prisma: PrismaService;
  let roleRepo: RoleRepository;

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

  const mockRole2 = {
    ...mockRole,
    roleId: 2,
    roleName: '普通用户',
    roleKey: 'user',
    roleSort: 2,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RoleService,
        {
          provide: PrismaService,
          useValue: {
            sysRole: {
              create: jest.fn(),
              update: jest.fn(),
              updateMany: jest.fn(),
              findMany: jest.fn(),
              findUnique: jest.fn(),
            },
            sysRoleMenu: {
              createMany: jest.fn(),
              deleteMany: jest.fn(),
              findMany: jest.fn(),
            },
            sysRoleDept: {
              createMany: jest.fn(),
              deleteMany: jest.fn(),
              findMany: jest.fn(),
            },
            sysDept: {
              findMany: jest.fn(),
            },
            sysMenu: {
              findMany: jest.fn(),
            },
          },
        },
        {
          provide: RoleRepository,
          useValue: {
            findById: jest.fn(),
            findPageWithMenuCount: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
          },
        },
        {
          provide: MenuService,
          useValue: {
            findAllMenus: jest.fn(),
            buildMenus: jest.fn(),
            findMany: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<RoleService>(RoleService);
    prisma = module.get<PrismaService>(PrismaService);
    roleRepo = module.get<RoleRepository>(RoleRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a role with menu associations', async () => {
      const createDto = {
        roleName: '测试角色',
        roleKey: 'test',
        roleSort: 1,
        dataScope: '2',
        status: '0',
        menuIds: [1, 2, 3],
      };

      (prisma.sysRole.create as jest.Mock).mockResolvedValue(mockRole);
      (prisma.sysRoleMenu.createMany as jest.Mock).mockResolvedValue({ count: 3 });

      const result = await service.create(createDto as any);

      expect(result.code).toBe(ResponseCode.SUCCESS);
      expect(prisma.sysRole.create).toHaveBeenCalled();
      expect(prisma.sysRoleMenu.createMany).toHaveBeenCalledWith({
        data: [
          { roleId: 1, menuId: 1 },
          { roleId: 1, menuId: 2 },
          { roleId: 1, menuId: 3 },
        ],
        skipDuplicates: true,
      });
    });

    it('should create a role without menus', async () => {
      const createDto = {
        roleName: '测试角色',
        roleKey: 'test',
        roleSort: 1,
        dataScope: '2',
        status: '0',
      };

      (prisma.sysRole.create as jest.Mock).mockResolvedValue(mockRole);

      const result = await service.create(createDto as any);

      expect(result.code).toBe(ResponseCode.SUCCESS);
      expect(prisma.sysRoleMenu.createMany).not.toHaveBeenCalled();
    });

    it('should use default values for roleSort and status', async () => {
      const createDto = {
        roleName: '测试角色',
        roleKey: 'test',
        dataScope: '2',
      };

      (prisma.sysRole.create as jest.Mock).mockResolvedValue(mockRole);

      await service.create(createDto as any);

      const createCall = (prisma.sysRole.create as jest.Mock).mock.calls[0][0];
      expect(createCall.data.roleSort).toBe(0);
      expect(createCall.data.status).toBe('0');
      expect(createCall.data.delFlag).toBe(DelFlagEnum.NORMAL);
    });
  });

  describe('findAll', () => {
    it('should return paginated roles', async () => {
      const query = {
        pageNum: 1,
        pageSize: 10,
        skip: 0,
        take: 10,
      };

      (roleRepo.findPageWithMenuCount as jest.Mock).mockResolvedValue({
        list: [mockRole],
        total: 1,
      });

      const result = await service.findAll(query as any);

      expect(result.code).toBe(ResponseCode.SUCCESS);
      expect(result.data.rows).toHaveLength(1);
      expect(result.data.total).toBe(1);
    });

    it('should filter roles by roleName', async () => {
      const query = {
        pageNum: 1,
        pageSize: 10,
        skip: 0,
        take: 10,
        roleName: '管理员',
      };

      (roleRepo.findPageWithMenuCount as jest.Mock).mockResolvedValue({
        list: [mockRole],
        total: 1,
      });

      await service.findAll(query as any);

      const callArgs = (roleRepo.findPageWithMenuCount as jest.Mock).mock.calls[0][0];
      expect(callArgs.roleName).toEqual({ contains: '管理员' });
    });

    it('should filter roles by roleKey', async () => {
      const query = {
        pageNum: 1,
        pageSize: 10,
        skip: 0,
        take: 10,
        roleKey: 'admin',
      };

      (roleRepo.findPageWithMenuCount as jest.Mock).mockResolvedValue({
        list: [mockRole],
        total: 1,
      });

      await service.findAll(query as any);

      const callArgs = (roleRepo.findPageWithMenuCount as jest.Mock).mock.calls[0][0];
      expect(callArgs.roleKey).toEqual({ contains: 'admin' });
    });

    it('should filter roles by roleId', async () => {
      const query = {
        pageNum: 1,
        pageSize: 10,
        skip: 0,
        take: 10,
        roleId: '1',
      };

      (roleRepo.findPageWithMenuCount as jest.Mock).mockResolvedValue({
        list: [mockRole],
        total: 1,
      });

      await service.findAll(query as any);

      const callArgs = (roleRepo.findPageWithMenuCount as jest.Mock).mock.calls[0][0];
      expect(callArgs.roleId).toBe(1);
    });

    it('should filter roles by status', async () => {
      const query = {
        pageNum: 1,
        pageSize: 10,
        skip: 0,
        take: 10,
        status: StatusEnum.NORMAL,
      };

      (roleRepo.findPageWithMenuCount as jest.Mock).mockResolvedValue({
        list: [mockRole],
        total: 1,
      });

      await service.findAll(query as any);

      const callArgs = (roleRepo.findPageWithMenuCount as jest.Mock).mock.calls[0][0];
      expect(callArgs.status).toBe(StatusEnum.NORMAL);
    });

    it('should filter roles by date range', async () => {
      const query = {
        pageNum: 1,
        pageSize: 10,
        skip: 0,
        take: 10,
        params: { beginTime: '2024-01-01', endTime: '2024-12-31' },
      };

      (roleRepo.findPageWithMenuCount as jest.Mock).mockResolvedValue({
        list: [mockRole],
        total: 1,
      });

      await service.findAll(query as any);

      const callArgs = (roleRepo.findPageWithMenuCount as jest.Mock).mock.calls[0][0];
      expect(callArgs.createTime).toBeDefined();
      expect(callArgs.createTime.gte).toBeInstanceOf(Date);
      expect(callArgs.createTime.lte).toBeInstanceOf(Date);
    });

    it('should return empty list when no roles found', async () => {
      const query = {
        pageNum: 1,
        pageSize: 10,
        skip: 0,
        take: 10,
      };

      (roleRepo.findPageWithMenuCount as jest.Mock).mockResolvedValue({
        list: [],
        total: 0,
      });

      const result = await service.findAll(query as any);

      expect(result.code).toBe(ResponseCode.SUCCESS);
      expect(result.data.rows).toHaveLength(0);
      expect(result.data.total).toBe(0);
    });
  });

  describe('findOne', () => {
    it('should return a role by id', async () => {
      (roleRepo.findById as jest.Mock).mockResolvedValue(mockRole);

      const result = await service.findOne(1);

      expect(result.code).toBe(ResponseCode.SUCCESS);
      expect(result.data).toEqual(mockRole);
      expect(roleRepo.findById).toHaveBeenCalledWith(1);
    });

    it('should return null when role not found', async () => {
      (roleRepo.findById as jest.Mock).mockResolvedValue(null);

      const result = await service.findOne(999);

      expect(result.code).toBe(ResponseCode.SUCCESS);
      expect(result.data).toBeNull();
    });
  });

  describe('update', () => {
    it('should update role and menu associations', async () => {
      const updateDto = {
        roleId: 1,
        roleName: '更新角色',
        menuIds: [4, 5, 6],
      };

      (prisma.sysRoleMenu.deleteMany as jest.Mock).mockResolvedValue({ count: 3 });
      (prisma.sysRoleMenu.createMany as jest.Mock).mockResolvedValue({ count: 3 });
      (prisma.sysRole.update as jest.Mock).mockResolvedValue(mockRole);

      const result = await service.update(updateDto as any);

      expect(result.code).toBe(ResponseCode.SUCCESS);
      expect(prisma.sysRoleMenu.deleteMany).toHaveBeenCalledWith({
        where: { roleId: 1 },
      });
      expect(prisma.sysRoleMenu.createMany).toHaveBeenCalled();
    });

    it('should update role without menu associations', async () => {
      const updateDto = {
        roleId: 1,
        roleName: '更新角色',
      };

      (prisma.sysRoleMenu.deleteMany as jest.Mock).mockResolvedValue({ count: 0 });
      (prisma.sysRole.update as jest.Mock).mockResolvedValue(mockRole);

      const result = await service.update(updateDto as any);

      expect(result.code).toBe(ResponseCode.SUCCESS);
      expect(prisma.sysRoleMenu.deleteMany).toHaveBeenCalled();
      expect(prisma.sysRoleMenu.createMany).not.toHaveBeenCalled();
    });
  });

  describe('dataScope', () => {
    it('should update role data scope with department associations', async () => {
      const updateDto = {
        roleId: 1,
        dataScope: '2',
        deptIds: [100, 101, 102],
      };

      (prisma.sysRoleDept.deleteMany as jest.Mock).mockResolvedValue({ count: 0 });
      (prisma.sysRoleDept.createMany as jest.Mock).mockResolvedValue({ count: 3 });
      (prisma.sysRole.update as jest.Mock).mockResolvedValue(mockRole);

      const result = await service.dataScope(updateDto as any);

      expect(result.code).toBe(ResponseCode.SUCCESS);
      expect(prisma.sysRoleDept.deleteMany).toHaveBeenCalledWith({
        where: { roleId: 1 },
      });
      expect(prisma.sysRoleDept.createMany).toHaveBeenCalledWith({
        data: [
          { roleId: 1, deptId: 100 },
          { roleId: 1, deptId: 101 },
          { roleId: 1, deptId: 102 },
        ],
      });
    });

    it('should update role data scope without department associations', async () => {
      const updateDto = {
        roleId: 1,
        dataScope: '1',
      };

      (prisma.sysRoleDept.deleteMany as jest.Mock).mockResolvedValue({ count: 0 });
      (prisma.sysRole.update as jest.Mock).mockResolvedValue(mockRole);

      const result = await service.dataScope(updateDto as any);

      expect(result.code).toBe(ResponseCode.SUCCESS);
      expect(prisma.sysRoleDept.deleteMany).toHaveBeenCalled();
      expect(prisma.sysRoleDept.createMany).not.toHaveBeenCalled();
    });
  });

  describe('changeStatus', () => {
    it('should change role status to disabled', async () => {
      const changeStatusDto = {
        roleId: 1,
        status: StatusEnum.STOP,
      };

      (prisma.sysRole.update as jest.Mock).mockResolvedValue({
        ...mockRole,
        status: StatusEnum.STOP,
      });

      const result = await service.changeStatus(changeStatusDto);

      expect(result.code).toBe(ResponseCode.SUCCESS);
      expect(prisma.sysRole.update).toHaveBeenCalledWith({
        where: { roleId: 1 },
        data: { status: StatusEnum.STOP },
      });
    });

    it('should change role status to enabled', async () => {
      const changeStatusDto = {
        roleId: 1,
        status: StatusEnum.NORMAL,
      };

      (prisma.sysRole.update as jest.Mock).mockResolvedValue({
        ...mockRole,
        status: StatusEnum.NORMAL,
      });

      const result = await service.changeStatus(changeStatusDto);

      expect(result.code).toBe(ResponseCode.SUCCESS);
      expect(result.data.status).toBe(StatusEnum.NORMAL);
    });
  });

  describe('remove', () => {
    it('should soft delete roles', async () => {
      (prisma.sysRole.updateMany as jest.Mock).mockResolvedValue({ count: 2 });

      const result = await service.remove([1, 2]);

      expect(result.code).toBe(ResponseCode.SUCCESS);
      expect(result.data).toBe(2);
      expect(prisma.sysRole.updateMany).toHaveBeenCalledWith({
        where: { roleId: { in: [1, 2] } },
        data: { delFlag: '1' },
      });
    });

    it('should return 0 when no roles to delete', async () => {
      (prisma.sysRole.updateMany as jest.Mock).mockResolvedValue({ count: 0 });

      const result = await service.remove([999]);

      expect(result.code).toBe(ResponseCode.SUCCESS);
      expect(result.data).toBe(0);
    });
  });

  describe('getPermissionsByRoleIds', () => {
    it('should return all permissions for super admin', async () => {
      const result = await service.getPermissionsByRoleIds([1]);

      expect(result).toEqual([{ perms: '*:*:*' }]);
    });

    it('should return specific permissions for normal roles', async () => {
      (prisma.sysRoleMenu.findMany as jest.Mock).mockResolvedValue([{ menuId: 1 }, { menuId: 2 }]);
      (prisma.sysMenu.findMany as jest.Mock).mockResolvedValue([
        { menuId: 1, perms: 'system:user:list' },
        { menuId: 2, perms: 'system:user:add' },
      ]);

      const result = await service.getPermissionsByRoleIds([2]);

      expect(result).toHaveLength(2);
      expect(prisma.sysRoleMenu.findMany).toHaveBeenCalledWith({
        where: { roleId: { in: [2] } },
        select: { menuId: true },
      });
    });

    it('should return empty array when no role menus found', async () => {
      (prisma.sysRoleMenu.findMany as jest.Mock).mockResolvedValue([]);

      const result = await service.getPermissionsByRoleIds([2]);

      expect(result).toEqual([]);
    });

    it('should return empty array when roleIds is empty', async () => {
      const result = await service.getPermissionsByRoleIds([]);

      expect(result).toEqual([]);
    });

    it('should deduplicate permissions', async () => {
      (prisma.sysRoleMenu.findMany as jest.Mock).mockResolvedValue([{ menuId: 1 }, { menuId: 2 }, { menuId: 3 }]);
      (prisma.sysMenu.findMany as jest.Mock).mockResolvedValue([
        { menuId: 1, perms: 'system:user:list' },
        { menuId: 2, perms: 'system:user:list' },
        { menuId: 3, perms: 'system:user:add' },
      ]);

      const result = await service.getPermissionsByRoleIds([2]);

      expect(result).toHaveLength(2);
    });
  });

  describe('deptTree', () => {
    it('should return department tree with checked keys', async () => {
      const mockDepts = [
        {
          deptId: 100,
          parentId: 0,
          deptName: '总部',
          delFlag: DelFlagEnum.NORMAL,
        },
      ];

      (prisma.sysDept.findMany as jest.Mock).mockResolvedValue(mockDepts);
      (prisma.sysRoleDept.findMany as jest.Mock).mockResolvedValue([{ deptId: 100 }]);

      const result = await service.deptTree(1);

      expect(result.code).toBe(ResponseCode.SUCCESS);
      expect(result.data.depts).toBeDefined();
      expect(result.data.checkedKeys).toEqual([100]);
    });

    it('should return empty checked keys when no departments assigned', async () => {
      const mockDepts = [
        {
          deptId: 100,
          parentId: 0,
          deptName: '总部',
          delFlag: DelFlagEnum.NORMAL,
        },
      ];

      (prisma.sysDept.findMany as jest.Mock).mockResolvedValue(mockDepts);
      (prisma.sysRoleDept.findMany as jest.Mock).mockResolvedValue([]);

      const result = await service.deptTree(1);

      expect(result.code).toBe(ResponseCode.SUCCESS);
      expect(result.data.checkedKeys).toEqual([]);
    });
  });

  describe('findRoles', () => {
    it('should return roles based on query args', async () => {
      (prisma.sysRole.findMany as jest.Mock).mockResolvedValue([mockRole, mockRole2]);

      const result = await service.findRoles({
        where: { delFlag: DelFlagEnum.NORMAL },
      });

      expect(result).toHaveLength(2);
      expect(prisma.sysRole.findMany).toHaveBeenCalled();
    });
  });

  describe('optionselect', () => {
    it('should return all active roles for select', async () => {
      (prisma.sysRole.findMany as jest.Mock).mockResolvedValue([mockRole, mockRole2]);

      const result = await service.optionselect();

      expect(result.code).toBe(ResponseCode.SUCCESS);
      expect(result.data).toHaveLength(2);
    });

    it('should filter roles by roleIds', async () => {
      (prisma.sysRole.findMany as jest.Mock).mockResolvedValue([mockRole]);

      const result = await service.optionselect([1]);

      expect(result.code).toBe(ResponseCode.SUCCESS);
      const callArgs = (prisma.sysRole.findMany as jest.Mock).mock.calls[0][0];
      expect(callArgs.where.roleId).toEqual({ in: [1] });
    });
  });

  describe('findRoleWithDeptIds', () => {
    it('should return department ids for a role', async () => {
      (prisma.sysRoleDept.findMany as jest.Mock).mockResolvedValue([{ deptId: 100 }, { deptId: 101 }]);

      const result = await service.findRoleWithDeptIds(1);

      expect(result).toEqual([100, 101]);
      expect(prisma.sysRoleDept.findMany).toHaveBeenCalledWith({
        select: { deptId: true },
        where: { roleId: 1 },
      });
    });

    it('should return empty array when no departments assigned', async () => {
      (prisma.sysRoleDept.findMany as jest.Mock).mockResolvedValue([]);

      const result = await service.findRoleWithDeptIds(999);

      expect(result).toEqual([]);
    });
  });
});
