import { Test, TestingModule } from '@nestjs/testing';
import { MenuRepository } from './menu.repository';
import { PrismaService } from 'src/prisma/prisma.service';
import { StatusEnum, DelFlagEnum } from 'src/common/enum';

describe('MenuRepository', () => {
  let repository: MenuRepository;
  let prisma: jest.Mocked<PrismaService>;

  const mockMenu = {
    menuId: 1,
    menuName: '系统管理',
    parentId: 0,
    orderNum: 1,
    path: 'system',
    component: null,
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
    updateBy: 'admin',
    updateTime: new Date(),
    remark: null,
  };

  const mockPrisma = {
    sysMenu: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
    },
    sysRoleMenu: {
      findMany: jest.fn(),
      count: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MenuRepository,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
      ],
    }).compile();

    repository = module.get<MenuRepository>(MenuRepository);
    prisma = module.get(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findByMenuName', () => {
    it('should find menu by name', async () => {
      mockPrisma.sysMenu.findFirst.mockResolvedValue(mockMenu);

      const result = await repository.findByMenuName('系统管理');

      expect(result).toEqual(mockMenu);
    });

    it('should return null if menu not found', async () => {
      mockPrisma.sysMenu.findFirst.mockResolvedValue(null);

      const result = await repository.findByMenuName('不存在');

      expect(result).toBeNull();
    });
  });

  describe('findByPermission', () => {
    it('should find menu by permission', async () => {
      const menuWithPerms = { ...mockMenu, perms: 'system:user:list' };
      mockPrisma.sysMenu.findFirst.mockResolvedValue(menuWithPerms);

      const result = await repository.findByPermission('system:user:list');

      expect(result).toEqual(menuWithPerms);
    });

    it('should return null if permission not found', async () => {
      mockPrisma.sysMenu.findFirst.mockResolvedValue(null);

      const result = await repository.findByPermission('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('existsByMenuName', () => {
    it('should return true if menu name exists', async () => {
      mockPrisma.sysMenu.count.mockResolvedValue(1);

      const result = await repository.existsByMenuName('系统管理', 0);

      expect(result).toBe(true);
    });

    it('should return false if menu name does not exist', async () => {
      mockPrisma.sysMenu.count.mockResolvedValue(0);

      const result = await repository.existsByMenuName('不存在', 0);

      expect(result).toBe(false);
    });

    it('should exclude specific menu id when checking', async () => {
      mockPrisma.sysMenu.count.mockResolvedValue(0);

      const result = await repository.existsByMenuName('系统管理', 0, 1);

      expect(result).toBe(false);
    });
  });

  describe('findUserMenus', () => {
    it('should find user menus', async () => {
      mockPrisma.sysMenu.findMany.mockResolvedValue([mockMenu]);

      const result = await repository.findUserMenus(1);

      expect(result).toEqual([mockMenu]);
    });

    it('should return empty array if user has no menus', async () => {
      mockPrisma.sysMenu.findMany.mockResolvedValue([]);

      const result = await repository.findUserMenus(999);

      expect(result).toEqual([]);
    });
  });

  describe('findRoleMenus', () => {
    it('should find role menus', async () => {
      mockPrisma.sysRoleMenu.findMany.mockResolvedValue([{ menuId: 1 }, { menuId: 2 }]);
      mockPrisma.sysMenu.findMany.mockResolvedValue([mockMenu]);

      const result = await repository.findRoleMenus(1);

      expect(result).toEqual([mockMenu]);
    });

    it('should return empty array if role has no menus', async () => {
      mockPrisma.sysRoleMenu.findMany.mockResolvedValue([]);

      const result = await repository.findRoleMenus(999);

      expect(result).toEqual([]);
    });
  });

  describe('findAllMenus', () => {
    it('should find all menus without filter', async () => {
      mockPrisma.sysMenu.findMany.mockResolvedValue([mockMenu]);

      const result = await repository.findAllMenus();

      expect(result).toEqual([mockMenu]);
    });

    it('should filter by status', async () => {
      mockPrisma.sysMenu.findMany.mockResolvedValue([mockMenu]);

      const result = await repository.findAllMenus({ status: StatusEnum.NORMAL });

      expect(result).toEqual([mockMenu]);
    });

    it('should filter by parentId', async () => {
      mockPrisma.sysMenu.findMany.mockResolvedValue([mockMenu]);

      const result = await repository.findAllMenus({ parentId: 0 });

      expect(result).toEqual([mockMenu]);
    });

    it('should filter by menuType', async () => {
      mockPrisma.sysMenu.findMany.mockResolvedValue([mockMenu]);

      const result = await repository.findAllMenus({ menuType: 'M' });

      expect(result).toEqual([mockMenu]);
    });
  });

  describe('countChildren', () => {
    it('should count children menus', async () => {
      mockPrisma.sysMenu.count.mockResolvedValue(5);

      const result = await repository.countChildren(1);

      expect(result).toBe(5);
    });

    it('should return 0 if no children', async () => {
      mockPrisma.sysMenu.count.mockResolvedValue(0);

      const result = await repository.countChildren(999);

      expect(result).toBe(0);
    });
  });

  describe('isMenuUsedByRole', () => {
    it('should return true if menu is used by role', async () => {
      mockPrisma.sysRoleMenu.count.mockResolvedValue(1);

      const result = await repository.isMenuUsedByRole(1);

      expect(result).toBe(true);
    });

    it('should return false if menu is not used', async () => {
      mockPrisma.sysRoleMenu.count.mockResolvedValue(0);

      const result = await repository.isMenuUsedByRole(999);

      expect(result).toBe(false);
    });
  });

  describe('findUserMenuIds', () => {
    it('should find user menu ids', async () => {
      mockPrisma.sysRoleMenu.findMany.mockResolvedValue([{ menuId: 1 }, { menuId: 2 }, { menuId: 1 }]);

      const result = await repository.findUserMenuIds([1, 2]);

      expect(result).toEqual([1, 2]);
    });

    it('should return empty array if no menus', async () => {
      mockPrisma.sysRoleMenu.findMany.mockResolvedValue([]);

      const result = await repository.findUserMenuIds([]);

      expect(result).toEqual([]);
    });
  });

  describe('findByIds', () => {
    it('should find menus by ids', async () => {
      mockPrisma.sysMenu.findMany.mockResolvedValue([mockMenu]);

      const result = await repository.findByIds([1, 2]);

      expect(result).toEqual([mockMenu]);
    });

    it('should return empty array if no menus found', async () => {
      mockPrisma.sysMenu.findMany.mockResolvedValue([]);

      const result = await repository.findByIds([999]);

      expect(result).toEqual([]);
    });
  });

  describe('deleteBatch', () => {
    it('should delete multiple menus', async () => {
      mockPrisma.sysMenu.deleteMany.mockResolvedValue({ count: 3 });

      const result = await repository.deleteBatch([1, 2, 3]);

      expect(result).toBe(3);
    });

    it('should return 0 if no menus deleted', async () => {
      mockPrisma.sysMenu.deleteMany.mockResolvedValue({ count: 0 });

      const result = await repository.deleteBatch([]);

      expect(result).toBe(0);
    });
  });

  describe('inherited methods from BaseRepository', () => {
    it('should have access to findById', async () => {
      mockPrisma.sysMenu.findUnique.mockResolvedValue(mockMenu);

      const result = await repository.findById(1);

      expect(result).toEqual(mockMenu);
    });

    it('should have access to create', async () => {
      mockPrisma.sysMenu.create.mockResolvedValue(mockMenu);

      const result = await repository.create({
        menuName: '新菜单',
        parentId: 0,
        orderNum: 1,
      } as any);

      expect(result).toEqual(mockMenu);
    });

    it('should have access to update', async () => {
      const updatedMenu = { ...mockMenu, menuName: 'Updated' };
      mockPrisma.sysMenu.update.mockResolvedValue(updatedMenu);

      const result = await repository.update(1, { menuName: 'Updated' });

      expect(result.menuName).toBe('Updated');
    });

    it('should have access to delete', async () => {
      mockPrisma.sysMenu.delete.mockResolvedValue(mockMenu);

      const result = await repository.delete(1);

      expect(result).toEqual(mockMenu);
    });
  });
});
