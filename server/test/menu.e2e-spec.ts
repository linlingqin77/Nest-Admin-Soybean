import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp, cleanupDatabase, getAuthToken } from './setup-e2e';
import { AppConfigService } from '../src/config/app-config.service';
import { PrismaService } from '../src/prisma/prisma.service';
import { MenuType, YesNo } from '@prisma/client';

/**
 * 菜单管理 E2E 测试
 * 测试菜单树查询、创建、更新、删除
 */
describe('MenuController (e2e)', () => {
  let app: INestApplication;
  let prefix: string;
  let authToken: string;
  let prisma: PrismaService;

  beforeAll(async () => {
    app = await createTestApp();
    const config = app.get(AppConfigService);
    prefix = config.app.prefix;
    prisma = app.get(PrismaService);

    // 获取管理员 token
    authToken = await getAuthToken(app);
  });

  afterAll(async () => {
    await cleanupDatabase(app);
    await app.close();
  });

  describe('/system/menu/list (GET) - 菜单列表查询', () => {
    it('should return menu list', async () => {
      const response = await request(app.getHttpServer())
        .get(`${prefix}/system/menu/list`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.code).toBe(200);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should support filtering by menu name', async () => {
      const response = await request(app.getHttpServer())
        .get(`${prefix}/system/menu/list`)
        .query({ menuName: '系统' })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.code).toBe(200);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should support filtering by status', async () => {
      const response = await request(app.getHttpServer())
        .get(`${prefix}/system/menu/list`)
        .query({ status: 'NORMAL' })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.code).toBe(200);
      if (response.body.data.length > 0) {
        expect(response.body.data[0].status).toBe('NORMAL');
      }
    });
  });

  describe('/system/menu (POST) - 创建菜单', () => {
    it('should create menu successfully', async () => {
      const newMenu = {
        menuName: `test_e2e_menu_${Date.now()}`,
        parentId: 0,
        orderNum: 999,
        path: `/test_${Date.now()}`,
        component: 'test/index',
        menuType: MenuType.MENU,
        visible: YesNo.YES,
        status: 'NORMAL',
        perms: `test:menu:${Date.now()}`,
        icon: 'test-icon',
      };

      const response = await request(app.getHttpServer())
        .post(`${prefix}/system/menu`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(newMenu)
        .expect(200);

      expect(response.body.code).toBe(200);
    });

    it('should create button menu', async () => {
      const buttonMenu = {
        menuName: `test_e2e_button_${Date.now()}`,
        parentId: 1,
        orderNum: 999,
        menuType: MenuType.BUTTON,
        visible: YesNo.YES,
        status: 'NORMAL',
        perms: `test:button:${Date.now()}`,
      };

      const response = await request(app.getHttpServer())
        .post(`${prefix}/system/menu`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(buttonMenu)
        .expect(200);

      expect(response.body.code).toBe(200);
    });

    it('should fail with missing required fields', async () => {
      const response = await request(app.getHttpServer())
        .post(`${prefix}/system/menu`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          // missing menuName
          parentId: 0,
        })
        .expect(400);

      expect(response.body.code).not.toBe(200);
    });
  });

  describe('/system/menu/:id (GET) - 获取菜单详情', () => {
    let testMenuId: number;

    beforeAll(async () => {
      const testMenu = await prisma.sysMenu.create({
        data: {
          tenantId: '000000',
          menuName: `test_e2e_detail_menu_${Date.now()}`,
          parentId: 0,
          orderNum: 999,
          path: `/test_detail_${Date.now()}`,
          component: 'test/detail',
          menuType: MenuType.MENU,
          visible: YesNo.YES,
          status: 'NORMAL',
          createBy: 'test',
          updateBy: 'test',
        },
      });
      testMenuId = testMenu.menuId;
    });

    it('should return menu detail', async () => {
      const response = await request(app.getHttpServer())
        .get(`${prefix}/system/menu/${testMenuId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.code).toBe(200);
      expect(response.body.data).toHaveProperty('menuId');
      expect(response.body.data.menuId).toBe(testMenuId);
    });

    it('should fail with invalid menu id', async () => {
      const response = await request(app.getHttpServer())
        .get(`${prefix}/system/menu/999999`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.code).not.toBe(200);
    });
  });

  describe('/system/menu (PUT) - 更新菜单', () => {
    let testMenuId: number;

    beforeAll(async () => {
      const testMenu = await prisma.sysMenu.create({
        data: {
          tenantId: '000000',
          menuName: `test_e2e_update_menu_${Date.now()}`,
          parentId: 0,
          orderNum: 999,
          path: `/test_update_${Date.now()}`,
          component: 'test/update',
          menuType: MenuType.MENU,
          visible: YesNo.YES,
          status: 'NORMAL',
          createBy: 'test',
          updateBy: 'test',
        },
      });
      testMenuId = testMenu.menuId;
    });

    it('should update menu successfully', async () => {
      const response = await request(app.getHttpServer())
        .put(`${prefix}/system/menu`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          menuId: testMenuId,
          menuName: `test_e2e_updated_menu_${Date.now()}`,
          orderNum: 888,
          icon: 'updated-icon',
        })
        .expect(200);

      expect(response.body.code).toBe(200);

      // 验证更新是否成功
      const verifyResponse = await request(app.getHttpServer())
        .get(`${prefix}/system/menu/${testMenuId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(verifyResponse.body.data.orderNum).toBe(888);
    });

    it('should fail with invalid menu id', async () => {
      const response = await request(app.getHttpServer())
        .put(`${prefix}/system/menu`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          menuId: 999999,
          menuName: 'Updated Name',
        })
        .expect(200);

      expect(response.body.code).not.toBe(200);
    });
  });

  describe('/system/menu/:id (DELETE) - 删除菜单', () => {
    it('should delete menu successfully', async () => {
      const testMenu = await prisma.sysMenu.create({
        data: {
          tenantId: '000000',
          menuName: `test_e2e_delete_menu_${Date.now()}`,
          parentId: 0,
          orderNum: 999,
          path: `/test_delete_${Date.now()}`,
          component: 'test/delete',
          menuType: MenuType.MENU,
          visible: YesNo.YES,
          status: 'NORMAL',
          createBy: 'test',
          updateBy: 'test',
        },
      });

      const response = await request(app.getHttpServer())
        .delete(`${prefix}/system/menu/${testMenu.menuId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.code).toBe(200);

      // 验证菜单是否被删除
      const verifyResponse = await request(app.getHttpServer())
        .get(`${prefix}/system/menu/${testMenu.menuId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(verifyResponse.body.code).not.toBe(200);
    });

    it('should fail to delete menu with children', async () => {
      // 创建父子菜单
      const parentMenu = await prisma.sysMenu.create({
        data: {
          tenantId: '000000',
          menuName: `test_e2e_parent_menu_${Date.now()}`,
          parentId: 0,
          orderNum: 999,
          path: `/test_parent_${Date.now()}`,
          component: 'test/parent',
          menuType: MenuType.MENU,
          visible: YesNo.YES,
          status: 'NORMAL',
          createBy: 'test',
          updateBy: 'test',
        },
      });

      await prisma.sysMenu.create({
        data: {
          tenantId: '000000',
          menuName: `test_e2e_child_menu_${Date.now()}`,
          parentId: parentMenu.menuId,
          orderNum: 1,
          path: `/test_child_${Date.now()}`,
          component: 'test/child',
          menuType: MenuType.MENU,
          visible: YesNo.YES,
          status: 'NORMAL',
          createBy: 'test',
          updateBy: 'test',
        },
      });

      // 尝试删除有子菜单的父菜单
      const response = await request(app.getHttpServer())
        .delete(`${prefix}/system/menu/${parentMenu.menuId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.code).not.toBe(200);
    });

    it('should fail with invalid menu id', async () => {
      const response = await request(app.getHttpServer())
        .delete(`${prefix}/system/menu/999999`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.code).not.toBe(200);
    });
  });

  describe('/system/menu/treeselect (GET) - 菜单树选择', () => {
    it('should return menu tree', async () => {
      const response = await request(app.getHttpServer())
        .get(`${prefix}/system/menu/treeselect`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.code).toBe(200);
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  describe('/system/menu/roleMenuTreeselect/:roleId (GET) - 角色菜单树', () => {
    it('should return role menu tree', async () => {
      const response = await request(app.getHttpServer())
        .get(`${prefix}/system/menu/roleMenuTreeselect/1`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.code).toBe(200);
      expect(response.body.data).toHaveProperty('menus');
      expect(response.body.data).toHaveProperty('checkedKeys');
    });
  });

  describe('菜单树结构验证', () => {
    it('should maintain correct tree structure', async () => {
      // 创建多层级菜单
      const level1 = await prisma.sysMenu.create({
        data: {
          tenantId: '000000',
          menuName: `test_e2e_tree_l1_${Date.now()}`,
          parentId: 0,
          orderNum: 1,
          path: `/test_l1_${Date.now()}`,
          component: 'test/l1',
          menuType: MenuType.DIRECTORY,
          visible: YesNo.YES,
          status: 'NORMAL',
          createBy: 'test',
          updateBy: 'test',
        },
      });

      const level2 = await prisma.sysMenu.create({
        data: {
          tenantId: '000000',
          menuName: `test_e2e_tree_l2_${Date.now()}`,
          parentId: level1.menuId,
          orderNum: 1,
          path: `/test_l2_${Date.now()}`,
          component: 'test/l2',
          menuType: MenuType.MENU,
          visible: YesNo.YES,
          status: 'NORMAL',
          createBy: 'test',
          updateBy: 'test',
        },
      });

      const level3 = await prisma.sysMenu.create({
        data: {
          tenantId: '000000',
          menuName: `test_e2e_tree_l3_${Date.now()}`,
          parentId: level2.menuId,
          orderNum: 1,
          menuType: MenuType.BUTTON,
          visible: YesNo.YES,
          status: 'NORMAL',
          perms: `test:l3:${Date.now()}`,
          createBy: 'test',
          updateBy: 'test',
        },
      });

      // 获取菜单列表
      const response = await request(app.getHttpServer())
        .get(`${prefix}/system/menu/list`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.code).toBe(200);

      // 查找创建的菜单
      const menus = response.body.data;
      const l1Menu = menus.find((m: any) => m.menuId === level1.menuId);
      const l2Menu = menus.find((m: any) => m.menuId === level2.menuId);
      const l3Menu = menus.find((m: any) => m.menuId === level3.menuId);

      // 验证层级关系
      expect(l1Menu.parentId).toBe(0);
      expect(l2Menu.parentId).toBe(level1.menuId);
      expect(l3Menu.parentId).toBe(level2.menuId);

      // 验证菜单类型
      expect(l1Menu.menuType).toBe('M'); // 目录
      expect(l2Menu.menuType).toBe('C'); // 菜单
      expect(l3Menu.menuType).toBe('F'); // 按钮
    });
  });
});
