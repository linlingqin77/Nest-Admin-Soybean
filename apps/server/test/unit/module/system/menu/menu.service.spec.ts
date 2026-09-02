/** @file menu.service.spec.ts @description Migrated from src/modules/menus/menu.service.spec.ts */

import { Test, TestingModule } from '@nestjs/testing';
import { MenuService } from '@/modules/menus/menu.service';
import { PrismaService } from '@/platform/prisma';
import { MenuRepository } from '@/modules/menus/menu.repository';
import { UserService } from '@/modules/users/user.service';
import { RedisService } from '@/platform/redis/redis.service';
import { DelFlagEnum, StatusEnum } from '@/shared/enums/index';
import { ResponseCode } from '@/shared/response';

describe('MenuService', () => {
  let service: MenuService;
  let prisma: PrismaService;
  let menuRepo: MenuRepository;
  let userService: UserService;

  const mockMenu = {
    menuId: 1,
    tenantId: '000000',
    menuName: '系统管理',
    parentId: 0,
    orderNum: 1,
    path: '/system',
    component: 'Layout',
    query: null,
    routeName: 'System',
    isFrame: '1',
    isCache: '0',
    menuType: 'M',
    visible: '0',
    status: StatusEnum.NORMAL,
    perms: null,
    icon: 'system',
    createBy: 'admin',
    createTime: new Date(),
    updateBy: null,
    updateTime: null,
    remark: '系统管理目录',
    delFlag: DelFlagEnum.NORMAL,
  };

  beforeEach(async () => {
    const modules: TestingModule = await Test.createTestingModule({
      providers: [
        MenuService,
        {
          provide: PrismaService,
          useValue: {
            sysMenu: {
              create: jest.fn(),
              update: jest.fn(),
              updateMany: jest.fn(),
              findMany: jest.fn(),
              findUnique: jest.fn(),
            },
            sysRoleMenu: {
              findMany: jest.fn(),
            },
          },
        },
        {
          provide: MenuRepository,
          useValue: {
            findById: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            softDelete: jest.fn(),
            findAllMenus: jest.fn(),
            findRoleMenus: jest.fn(),
          },
        },
        {
          provide: UserService,
          useValue: {
            getRoleIds: jest.fn(),
          },
        },
        {
          provide: RedisService,
          useValue: {
            get: jest.fn(),
            set: jest.fn(),
            del: jest.fn(),
            keys: jest.fn().mockResolvedValue([]),
            getClient: jest.fn(() => ({
              get: jest.fn(),
              set: jest.fn(),
              del: jest.fn(),
            })),
          },
        },
      ],
    }).compile();

    service = modules.get<MenuService>(MenuService);
    prisma = modules.get<PrismaService>(PrismaService);
    menuRepo = modules.get<MenuRepository>(MenuRepository);
    userService = modules.get<UserService>(UserService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a menu', async () => {
      const createDto = {
        menuName: '新菜单',
        parentId: 0,
        orderNum: 1,
        path: '/new',
        menuType: 'M',
      };

      (menuRepo.create as jest.Mock).mockResolvedValue({ menuId: 2, ...createDto });

      const result = await service.create(createDto as any);

      expect(result.code).toBe(ResponseCode.SUCCESS);
      expect(menuRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          menuName: '新菜单',
          path: '/new',
          delFlag: DelFlagEnum.NORMAL,
        }),
      );
    });

    it('should create a menu with default path and icon', async () => {
      const createDto = {
        menuName: '新菜单',
        parentId: 0,
        orderNum: 1,
        menuType: 'M',
      };

      (menuRepo.create as jest.Mock).mockResolvedValue({ menuId: 2, ...createDto });

      const result = await service.create(createDto as any);

      expect(result.code).toBe(ResponseCode.SUCCESS);
      expect(menuRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          path: '',
          icon: '',
        }),
      );
    });
  });

  describe('findAll', () => {
    it('should return all menus', async () => {
      (menuRepo.findAllMenus as jest.Mock).mockResolvedValue([mockMenu]);

      const result = await service.findAll({});

      expect(result.code).toBe(ResponseCode.SUCCESS);
      expect(result.data).toHaveLength(1);
    });

    it('should pass query to repository', async () => {
      const query = { menuName: '系统' };
      (menuRepo.findAllMenus as jest.Mock).mockResolvedValue([mockMenu]);

      await service.findAll(query);

      expect(menuRepo.findAllMenus).toHaveBeenCalledWith(query);
    });
  });

  describe('findOne', () => {
    it('should return a menu by id', async () => {
      (menuRepo.findById as jest.Mock).mockResolvedValue(mockMenu);

      const result = await service.findOne(1);

      expect(result.code).toBe(ResponseCode.SUCCESS);
      expect(result.data!.menuId).toBe(1);
    });
  });

  describe('tenantPackageMenuTreeselect', () => {
    it('should return menu tree for tenant package', async () => {
      (prisma.sysMenu.findMany as jest.Mock).mockResolvedValue([mockMenu]);

      const result = await service.tenantPackageMenuTreeselect(1);

      expect(result.code).toBe(ResponseCode.SUCCESS);
      expect(result.data.menus).toBeDefined();
      expect(result.data.checkedKeys).toEqual([]);
    });
  });

  describe('cascadeRemove', () => {
    it('should cascade delete multiple menus', async () => {
      // Mock findMany to return empty array (no children)
      (prisma.sysMenu.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.sysMenu.updateMany as jest.Mock).mockResolvedValue({ count: 3 });

      const result = await service.cascadeRemove([1, 2, 3]);

      expect(result.code).toBe(ResponseCode.SUCCESS);
      expect(result.data).toBe(3);
      expect(prisma.sysMenu.updateMany).toHaveBeenCalledWith({
        where: { menuId: { in: [1, 2, 3] } },
        data: { delFlag: '1' },
      });
    });
  });

  describe('findMany', () => {
    it('should return menus with custom args', async () => {
      const args = { where: { menuType: 'M' } };
      (prisma.sysMenu.findMany as jest.Mock).mockResolvedValue([mockMenu]);

      const result = await service.findMany(args);

      expect(result).toHaveLength(1);
      expect(prisma.sysMenu.findMany).toHaveBeenCalledWith(args);
    });
  });

  describe('update', () => {
    it('should update a menu', async () => {
      const updateDto = {
        menuId: 1,
        menuName: '更新菜单',
      };

      (menuRepo.update as jest.Mock).mockResolvedValue(mockMenu);

      const result = await service.update(updateDto as any);

      expect(result.code).toBe(ResponseCode.SUCCESS);
      expect(menuRepo.update).toHaveBeenCalledWith(1, updateDto);
    });
  });

  describe('remove', () => {
    it('should soft delete a menu', async () => {
      (menuRepo.softDelete as jest.Mock).mockResolvedValue(mockMenu);

      const result = await service.remove(1);

      expect(result.code).toBe(ResponseCode.SUCCESS);
      expect(menuRepo.softDelete).toHaveBeenCalledWith(1);
    });

    it('should throw error if menu has children', async () => {
      (menuRepo.softDelete as jest.Mock).mockRejectedValue(new Error('存在子菜单，不允许删除'));

      await expect(service.remove(1)).rejects.toThrow();
    });
  });

  describe('treeSelect', () => {
    it('should return menu tree structure', async () => {
      (menuRepo.findAllMenus as jest.Mock).mockResolvedValue([mockMenu]);

      const result = await service.treeSelect();

      expect(result.code).toBe(ResponseCode.SUCCESS);
      expect(result.data).toBeDefined();
    });
  });

  describe('getMenuListByUserId', () => {
    it('should return menu list for user', async () => {
      const mockMenus = [mockMenu];
      (userService.getRoleIds as jest.Mock).mockResolvedValue([2]);
      (prisma.sysRoleMenu.findMany as jest.Mock).mockResolvedValue([{ menuId: 1 }]);
      (prisma.sysMenu.findMany as jest.Mock).mockResolvedValue(mockMenus);

      const result = await service.getMenuListByUserId(1);

      expect(result.code).toBe(ResponseCode.SUCCESS);
      expect(result.data).toBeDefined();
    });
  });

  describe('roleMenuTreeselect', () => {
    it('should return menu tree with checked keys', async () => {
      (menuRepo.findAllMenus as jest.Mock).mockResolvedValue([mockMenu]);
      (menuRepo.findRoleMenus as jest.Mock).mockResolvedValue([{ menuId: 1 }]);

      const result = await service.roleMenuTreeselect(1);

      expect(result.code).toBe(ResponseCode.SUCCESS);
      expect(result.data.menus).toBeDefined();
      expect(result.data.checkedKeys).toEqual([1]);
    });

    it('should return empty checked keys when role has no menus', async () => {
      (menuRepo.findAllMenus as jest.Mock).mockResolvedValue([mockMenu]);
      (menuRepo.findRoleMenus as jest.Mock).mockResolvedValue([]);

      const result = await service.roleMenuTreeselect(999);

      expect(result.code).toBe(ResponseCode.SUCCESS);
      expect(result.data.checkedKeys).toEqual([]);
    });
  });

  describe('cascadeRemove', () => {
    it('should cascade delete multiple menus', async () => {
      // Mock findMany to return empty array (no children)
      (prisma.sysMenu.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.sysMenu.updateMany as jest.Mock).mockResolvedValue({ count: 3 });

      const result = await service.cascadeRemove([1, 2, 3]);

      expect(result.code).toBe(ResponseCode.SUCCESS);
      expect(result.data).toBe(3);
      expect(prisma.sysMenu.updateMany).toHaveBeenCalledWith({
        where: { menuId: { in: [1, 2, 3] } },
        data: { delFlag: '1' },
      });
    });

    it('should cascade delete menus with children', async () => {
      // First call returns children, second call returns no more children
      (prisma.sysMenu.findMany as jest.Mock)
        .mockResolvedValueOnce([{ menuId: 4 }, { menuId: 5 }]) // children of [1]
        .mockResolvedValueOnce([]); // no more children
      (prisma.sysMenu.updateMany as jest.Mock).mockResolvedValue({ count: 3 });

      const result = await service.cascadeRemove([1]);

      expect(result.code).toBe(ResponseCode.SUCCESS);
      // Should include parent and children
      expect(prisma.sysMenu.updateMany).toHaveBeenCalledWith({
        where: { menuId: { in: expect.arrayContaining([1, 4, 5]) } },
        data: { delFlag: '1' },
      });
    });
  });

  describe('getMenuListByUserId', () => {
    it('should return menu list for user', async () => {
      const mockMenus = [mockMenu];
      (userService.getRoleIds as jest.Mock).mockResolvedValue([2]);
      (prisma.sysRoleMenu.findMany as jest.Mock).mockResolvedValue([{ menuId: 1 }]);
      (prisma.sysMenu.findMany as jest.Mock).mockResolvedValue(mockMenus);

      const result = await service.getMenuListByUserId(1);

      expect(result.code).toBe(ResponseCode.SUCCESS);
      expect(result.data).toBeDefined();
    });

    it('should return all menus for super admin (roleId=1)', async () => {
      (userService.getRoleIds as jest.Mock).mockResolvedValue([1]);
      (prisma.sysMenu.findMany as jest.Mock).mockResolvedValue([mockMenu]);

      const result = await service.getMenuListByUserId(1);

      expect(result.code).toBe(ResponseCode.SUCCESS);
      // 超级管理员应该获取所有菜单
      expect(prisma.sysMenu.findMany).toHaveBeenCalled();
    });

    it('should return empty array when user has no menus', async () => {
      (userService.getRoleIds as jest.Mock).mockResolvedValue([2]);
      (prisma.sysRoleMenu.findMany as jest.Mock).mockResolvedValue([]);

      const result = await service.getMenuListByUserId(999);

      expect(result.code).toBe(ResponseCode.SUCCESS);
      expect(result.data).toEqual([]);
    });
  });

  describe('create - edge cases', () => {
    it('should create menu with default path and icon when not provided', async () => {
      const createDto = {
        menuName: '新菜单',
        parentId: 0,
        orderNum: 1,
        menuType: 'M',
      };

      (menuRepo.create as jest.Mock).mockResolvedValue({ menuId: 2, ...createDto });

      const result = await service.create(createDto as any);

      expect(result.code).toBe(ResponseCode.SUCCESS);
      expect(menuRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          path: '',
          icon: '',
        }),
      );
    });

    it('should create menu with provided path and icon', async () => {
      const createDto = {
        menuName: '新菜单',
        parentId: 0,
        orderNum: 1,
        menuType: 'M',
        path: '/custom',
        icon: 'custom-icon',
      };

      (menuRepo.create as jest.Mock).mockResolvedValue({ menuId: 2, ...createDto });

      const result = await service.create(createDto as any);

      expect(result.code).toBe(ResponseCode.SUCCESS);
      expect(menuRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          path: '/custom',
          icon: 'custom-icon',
        }),
      );
    });
  });

  describe('treeSelect', () => {
    it('should return menu tree structure', async () => {
      (menuRepo.findAllMenus as jest.Mock).mockResolvedValue([mockMenu]);

      const result = await service.treeSelect();

      expect(result.code).toBe(ResponseCode.SUCCESS);
      expect(result.data).toBeDefined();
    });

    it('should return empty tree when no menus', async () => {
      (menuRepo.findAllMenus as jest.Mock).mockResolvedValue([]);

      const result = await service.treeSelect();

      expect(result.code).toBe(ResponseCode.SUCCESS);
      expect(result.data).toEqual([]);
    });
  });

  describe('tenantPackageMenuTreeselect - edge cases', () => {
    it('should return empty checked keys', async () => {
      (prisma.sysMenu.findMany as jest.Mock).mockResolvedValue([mockMenu]);

      const result = await service.tenantPackageMenuTreeselect(1);

      expect(result.code).toBe(ResponseCode.SUCCESS);
      expect(result.data.checkedKeys).toEqual([]);
    });

    it('should return empty menus when no menus exist', async () => {
      (prisma.sysMenu.findMany as jest.Mock).mockResolvedValue([]);

      const result = await service.tenantPackageMenuTreeselect(1);

      expect(result.code).toBe(ResponseCode.SUCCESS);
      expect(result.data.menus).toEqual([]);
    });
  });
});
