/**
 * 菜单模块集成测试
 *
 * @description
 * 测试菜单模块的完整流程，包括菜单树形结构和角色菜单关联
 * 使用真实的数据库和Redis连接
 *
 * _Requirements: 7.1, 7.6, 7.7_
 */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe, VersioningType } from '@nestjs/common';
import { AppModule } from 'src/app.module';
import { PrismaService } from 'src/prisma/prisma.service';
import { MenuService } from 'src/module/system/menu/menu.service';
import { MenuRepository } from 'src/module/system/menu/menu.repository';
import { DelFlagEnum } from 'src/common/enum/index';

describe('Menu Integration Tests', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let menuService: MenuService;
  let menuRepo: MenuRepository;

  // Track created test data for cleanup
  const createdMenuIds: number[] = [];
  const createdRoleIds: number[] = [];

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    app.setGlobalPrefix('api');
    app.enableVersioning({
      type: VersioningType.URI,
      defaultVersion: '1',
      prefix: 'v',
    });
    app.useGlobalPipes(
      new ValidationPipe({
        transform: true,
        whitelist: true,
        transformOptions: {
          enableImplicitConversion: true,
        },
      }),
    );

    await app.init();

    prisma = app.get(PrismaService);
    menuService = app.get(MenuService);
    menuRepo = app.get(MenuRepository);
  }, 60000);

  afterAll(async () => {
    // Cleanup: Delete role-menu associations first
    if (createdRoleIds.length > 0) {
      await prisma.sysRoleMenu.deleteMany({
        where: { roleId: { in: createdRoleIds } },
      });
      await prisma.sysRole.deleteMany({
        where: { roleId: { in: createdRoleIds } },
      });
    }

    // Cleanup: Delete created menus
    if (createdMenuIds.length > 0) {
      await prisma.sysMenu.deleteMany({
        where: { menuId: { in: createdMenuIds } },
      });
    }

    await app.close();
  });

  describe('Menu Tree Structure Integration', () => {
    it('should return tree structure from treeSelect', async () => {
      const result = await menuService.treeSelect();

      expect(result.code).toBe(200);
      expect(Array.isArray(result.data)).toBe(true);
      
      // Tree nodes should have id and label
      if (result.data.length > 0) {
        const node = result.data[0];
        expect(node).toHaveProperty('id');
        expect(node).toHaveProperty('label');
      }
    });

    it('should return all menus from findAll', async () => {
      const result = await menuService.findAll({});

      expect(result.code).toBe(200);
      expect(Array.isArray(result.data)).toBe(true);
      
      // Menus should have required fields
      if (result.data.length > 0) {
        const menu = result.data[0];
        expect(menu).toHaveProperty('menuId');
        expect(menu).toHaveProperty('menuName');
        expect(menu).toHaveProperty('parentId');
      }
    });

    it('should filter menus by status', async () => {
      const result = await menuService.findAll({ status: '0' });

      expect(result.code).toBe(200);
      expect(Array.isArray(result.data)).toBe(true);

      // All returned menus should have status '0'
      result.data.forEach((menu: any) => {
        expect(menu.status).toBe('0');
      });
    });

    it('should filter menus by menuType', async () => {
      const result = await menuService.findAll({ menuType: 'M' });

      expect(result.code).toBe(200);
      expect(Array.isArray(result.data)).toBe(true);

      // All returned menus should have menuType 'M'
      result.data.forEach((menu: any) => {
        expect(menu.menuType).toBe('M');
      });
    });
  });

  describe('Role Menu Association Integration', () => {
    let testRoleId: number;
    let existingMenuId: number;

    beforeAll(async () => {
      // Get an existing menu to use for testing
      const existingMenu = await prisma.sysMenu.findFirst({
        where: { delFlag: DelFlagEnum.NORMAL },
      });
      if (existingMenu) {
        existingMenuId = existingMenu.menuId;
      }

      // Create a test role
      const role = await prisma.sysRole.create({
        data: {
          tenantId: '000000',
          roleName: `测试角色_${Date.now()}`,
          roleKey: `test_role_${Date.now()}`,
          roleSort: 99,
          dataScope: '1',
          status: '0',
          delFlag: '0',
          menuCheckStrictly: false,
          deptCheckStrictly: false,
          createBy: 'test',
          updateBy: 'test',
        },
      });
      testRoleId = role.roleId;
      createdRoleIds.push(testRoleId);

      // Associate role with menu if we have an existing menu
      if (existingMenuId) {
        await prisma.sysRoleMenu.create({
          data: {
            roleId: testRoleId,
            menuId: existingMenuId,
          },
        });
      }
    });

    it('should return role menu tree with checked keys', async () => {
      const result = await menuService.roleMenuTreeselect(testRoleId);

      expect(result.code).toBe(200);
      expect(result.data).toHaveProperty('menus');
      expect(result.data).toHaveProperty('checkedKeys');
      expect(Array.isArray(result.data.menus)).toBe(true);
      expect(Array.isArray(result.data.checkedKeys)).toBe(true);

      // The existing menu should be in checked keys if we associated it
      if (existingMenuId) {
        expect(result.data.checkedKeys).toContain(existingMenuId);
      }
    });

    it('should return empty checked keys for role without menus', async () => {
      // Create a role without any menu associations
      const emptyRole = await prisma.sysRole.create({
        data: {
          tenantId: '000000',
          roleName: `空角色_${Date.now()}`,
          roleKey: `empty_role_${Date.now()}`,
          roleSort: 99,
          dataScope: '1',
          status: '0',
          delFlag: '0',
          menuCheckStrictly: false,
          deptCheckStrictly: false,
          createBy: 'test',
          updateBy: 'test',
        },
      });
      createdRoleIds.push(emptyRole.roleId);

      const result = await menuService.roleMenuTreeselect(emptyRole.roleId);

      expect(result.code).toBe(200);
      expect(result.data.checkedKeys).toEqual([]);
    });

    it('should find role menus through repository', async () => {
      const roleMenus = await menuRepo.findRoleMenus(testRoleId);

      expect(Array.isArray(roleMenus)).toBe(true);
      
      // If we associated a menu, it should be found
      if (existingMenuId) {
        expect(roleMenus.length).toBeGreaterThan(0);
        const foundMenu = roleMenus.find((m) => m.menuId === existingMenuId);
        expect(foundMenu).toBeDefined();
      }
    });
  });

  describe('Menu Query Integration', () => {
    it('should find menu by id through prisma', async () => {
      // Get an existing menu
      const existingMenu = await prisma.sysMenu.findFirst({
        where: { delFlag: DelFlagEnum.NORMAL },
      });

      if (existingMenu) {
        // Query the same menu by ID
        const foundMenu = await prisma.sysMenu.findUnique({
          where: { menuId: existingMenu.menuId },
        });

        expect(foundMenu).toBeDefined();
        expect(foundMenu?.menuId).toBe(existingMenu.menuId);
        expect(foundMenu?.menuName).toBe(existingMenu.menuName);
      }
    });

    it('should return menus with findMany', async () => {
      const menus = await menuService.findMany({
        where: { delFlag: DelFlagEnum.NORMAL },
        take: 5,
      });

      expect(Array.isArray(menus)).toBe(true);
      expect(menus.length).toBeLessThanOrEqual(5);
    });
  });

  describe('Tenant Package Menu Tree Integration', () => {
    it('should return tenant package menu tree', async () => {
      const result = await menuService.tenantPackageMenuTreeselect(1);

      expect(result.code).toBe(200);
      expect(result.data).toHaveProperty('menus');
      expect(result.data).toHaveProperty('checkedKeys');
      expect(Array.isArray(result.data.menus)).toBe(true);
    });
  });

  describe('Menu Repository Integration', () => {
    it('should find all menus through repository', async () => {
      const menus = await menuRepo.findAllMenus();

      expect(Array.isArray(menus)).toBe(true);
      expect(menus.length).toBeGreaterThan(0);
    });

    it('should find menus by status through repository', async () => {
      const menus = await menuRepo.findAllMenus({ status: '0' });

      expect(Array.isArray(menus)).toBe(true);
      menus.forEach((menu) => {
        expect(menu.status).toBe('0');
      });
    });

    it('should count children of a menu', async () => {
      // Get a parent menu (parentId = 0)
      const parentMenu = await prisma.sysMenu.findFirst({
        where: { parentId: 0, delFlag: DelFlagEnum.NORMAL },
      });

      if (parentMenu) {
        const count = await menuRepo.countChildren(parentMenu.menuId);
        expect(typeof count).toBe('number');
        expect(count).toBeGreaterThanOrEqual(0);
      }
    });

    it('should check if menu is used by role', async () => {
      // Get any menu
      const menu = await prisma.sysMenu.findFirst({
        where: { delFlag: DelFlagEnum.NORMAL },
      });

      if (menu) {
        const isUsed = await menuRepo.isMenuUsedByRole(menu.menuId);
        expect(typeof isUsed).toBe('boolean');
      }
    });
  });
});
