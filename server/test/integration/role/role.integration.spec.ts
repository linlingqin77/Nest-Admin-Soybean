/**
 * 角色模块集成测试
 *
 * @description
 * 测试角色模块的完整流程，包括角色-菜单权限关联、角色-用户批量授权
 * 使用真实的数据库和Redis连接
 *
 * _Requirements: 4.3, 4.8, 4.9_
 */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe, VersioningType } from '@nestjs/common';
import { AppModule } from 'src/app.module';
import { PrismaService } from 'src/prisma/prisma.service';
import { RoleService } from 'src/module/system/role/role.service';
import { UserService } from 'src/module/system/user/user.service';
import { MenuService } from 'src/module/system/menu/menu.service';
import { DelFlagEnum, StatusEnum } from 'src/common/enum/index';
import * as bcrypt from 'bcryptjs';

describe('Role Integration Tests', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let roleService: RoleService;
  let userService: UserService;
  let menuService: MenuService;

  // Test data tracking
  const createdRoleIds: number[] = [];
  const createdUserIds: number[] = [];
  const createdMenuIds: number[] = [];

  // Test tenant
  const testTenantId = '000000';

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    // Configure app similar to main.ts
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
    roleService = app.get(RoleService);
    userService = app.get(UserService);
    menuService = app.get(MenuService);
  }, 60000);

  afterAll(async () => {
    // Cleanup test data in reverse order of dependencies
    try {
      // Delete user-role associations
      if (createdUserIds.length > 0) {
        await prisma.sysUserRole.deleteMany({
          where: { userId: { in: createdUserIds } },
        });
        await prisma.sysUserPost.deleteMany({
          where: { userId: { in: createdUserIds } },
        });
      }

      // Delete users
      if (createdUserIds.length > 0) {
        await prisma.sysUser.deleteMany({
          where: { userId: { in: createdUserIds } },
        });
      }

      // Delete role-menu associations
      if (createdRoleIds.length > 0) {
        await prisma.sysRoleMenu.deleteMany({
          where: { roleId: { in: createdRoleIds } },
        });
        await prisma.sysRoleDept.deleteMany({
          where: { roleId: { in: createdRoleIds } },
        });
      }

      // Delete roles
      if (createdRoleIds.length > 0) {
        await prisma.sysRole.deleteMany({
          where: { roleId: { in: createdRoleIds } },
        });
      }

      // Delete menus
      if (createdMenuIds.length > 0) {
        await prisma.sysMenu.deleteMany({
          where: { menuId: { in: createdMenuIds } },
        });
      }
    } catch (error) {
      console.error('Cleanup error:', error);
    }

    await app.close();
  });

  /**
   * Helper function to create a test role
   */
  async function createTestRole(data: Partial<{
    roleName: string;
    roleKey: string;
    menuIds: number[];
    deptIds: number[];
  }> = {}) {
    const timestamp = Date.now();

    const role = await prisma.sysRole.create({
      data: {
        tenantId: testTenantId,
        roleName: data.roleName || `测试角色_${timestamp}`,
        roleKey: data.roleKey || `test_role_${timestamp}`,
        roleSort: 99,
        dataScope: '1',
        status: StatusEnum.NORMAL,
        delFlag: DelFlagEnum.NORMAL,
        menuCheckStrictly: false,
        deptCheckStrictly: false,
        createBy: 'test',
        updateBy: 'test',
      },
    });

    createdRoleIds.push(role.roleId);

    // Assign menus if provided
    if (data.menuIds && data.menuIds.length > 0) {
      await prisma.sysRoleMenu.createMany({
        data: data.menuIds.map((menuId) => ({
          roleId: role.roleId,
          menuId,
        })),
        skipDuplicates: true,
      });
    }

    // Assign depts if provided
    if (data.deptIds && data.deptIds.length > 0) {
      await prisma.sysRoleDept.createMany({
        data: data.deptIds.map((deptId) => ({
          roleId: role.roleId,
          deptId,
        })),
        skipDuplicates: true,
      });
    }

    return role;
  }

  /**
   * Helper function to create a test user
   */
  async function createTestUser(data: Partial<{
    userName: string;
    nickName: string;
    password: string;
    deptId: number;
    roleIds: number[];
  }> = {}) {
    const timestamp = Date.now();
    const shortTimestamp = timestamp.toString().slice(-6);
    const hashedPassword = await bcrypt.hash(data.password || '123456', 10);

    const user = await prisma.sysUser.create({
      data: {
        tenantId: testTenantId,
        userName: data.userName || `tu_${shortTimestamp}`,
        nickName: data.nickName || '测试用户',
        password: hashedPassword,
        deptId: data.deptId || 100,
        email: `t${shortTimestamp}@test.com`,
        phonenumber: `138${shortTimestamp}00`,
        sex: '0',
        status: StatusEnum.NORMAL,
        delFlag: DelFlagEnum.NORMAL,
        userType: '01',
        createBy: 'test',
        updateBy: 'test',
      },
    });

    createdUserIds.push(user.userId);

    // Assign roles if provided
    if (data.roleIds && data.roleIds.length > 0) {
      await prisma.sysUserRole.createMany({
        data: data.roleIds.map((roleId) => ({
          userId: user.userId,
          roleId,
        })),
        skipDuplicates: true,
      });
    }

    return user;
  }

  /**
   * Helper function to create a test menu
   */
  async function createTestMenu(data: Partial<{
    menuName: string;
    parentId: number;
    menuType: string;
    perms: string;
  }> = {}) {
    const timestamp = Date.now();

    const menu = await prisma.sysMenu.create({
      data: {
        tenantId: testTenantId,
        menuName: data.menuName || `测试菜单_${timestamp}`,
        parentId: data.parentId || 0,
        orderNum: 1,
        path: `/test_${timestamp}`,
        component: '',
        menuType: data.menuType || 'M',
        perms: data.perms || '',
        status: StatusEnum.NORMAL,
        visible: '0',
        isFrame: '1',
        isCache: '0',
        createBy: 'test',
        updateBy: 'test',
      },
    });

    createdMenuIds.push(menu.menuId);
    return menu;
  }

  /**
   * Helper function to get existing menus for testing
   */
  async function getExistingMenus(count: number = 3) {
    const menus = await prisma.sysMenu.findMany({
      where: {
        tenantId: testTenantId,
        delFlag: DelFlagEnum.NORMAL,
        status: StatusEnum.NORMAL,
      },
      take: count,
    });
    return menus;
  }

  describe('Role-Menu Permission Association Integration', () => {
    it('should create role with menu permissions and verify association', async () => {
      // Get existing menus for testing
      const existingMenus = await getExistingMenus(3);
      
      if (existingMenus.length === 0) {
        console.log('Skipping test: No existing menus available');
        return;
      }

      const menuIds = existingMenus.map((m) => m.menuId);

      // Create role with menus
      const role = await createTestRole({
        roleName: '菜单权限测试角色',
        roleKey: `menu_perm_${Date.now()}`,
        menuIds,
      });

      // Verify the association exists
      const roleMenus = await prisma.sysRoleMenu.findMany({
        where: { roleId: role.roleId },
      });

      expect(roleMenus.length).toBe(menuIds.length);
      const associatedMenuIds = roleMenus.map((rm) => rm.menuId);
      menuIds.forEach((menuId) => {
        expect(associatedMenuIds).toContain(menuId);
      });
    });

    it('should update role menu permissions correctly', async () => {
      // Get existing menus for testing
      const existingMenus = await getExistingMenus(4);
      
      if (existingMenus.length < 4) {
        console.log('Skipping test: Not enough existing menus available');
        return;
      }

      const initialMenuIds = existingMenus.slice(0, 2).map((m) => m.menuId);
      const newMenuIds = existingMenus.slice(2, 4).map((m) => m.menuId);

      // Create role with initial menus
      const role = await createTestRole({
        roleName: '更新菜单权限测试',
        roleKey: `upd_menu_${Date.now()}`,
        menuIds: initialMenuIds,
      });

      // Update role with new menus using service
      await roleService.update({
        roleId: role.roleId,
        roleName: role.roleName,
        roleKey: role.roleKey,
        menuIds: newMenuIds,
        dataScope: '1',
      });

      // Verify the update
      const roleMenus = await prisma.sysRoleMenu.findMany({
        where: { roleId: role.roleId },
      });

      expect(roleMenus.length).toBe(newMenuIds.length);
      const associatedMenuIds = roleMenus.map((rm) => rm.menuId);
      newMenuIds.forEach((menuId) => {
        expect(associatedMenuIds).toContain(menuId);
      });
      // Old menus should be removed
      initialMenuIds.forEach((menuId) => {
        expect(associatedMenuIds).not.toContain(menuId);
      });
    });

    it('should get role permissions correctly', async () => {
      // Get existing menus with permissions
      const existingMenus = await prisma.sysMenu.findMany({
        where: {
          tenantId: testTenantId,
          delFlag: DelFlagEnum.NORMAL,
          status: StatusEnum.NORMAL,
          perms: { not: '' },
        },
        take: 2,
      });

      if (existingMenus.length === 0) {
        console.log('Skipping test: No menus with permissions available');
        return;
      }

      const menuIds = existingMenus.map((m) => m.menuId);

      // Create role with permission menus
      const role = await createTestRole({
        roleName: '权限获取测试',
        roleKey: `get_perm_${Date.now()}`,
        menuIds,
      });

      // Get permissions using service
      const permissions = await roleService.getPermissionsByRoleIds([role.roleId]);

      expect(Array.isArray(permissions)).toBe(true);
      // Should have at least some permissions
      if (existingMenus.some((m) => m.perms)) {
        expect(permissions.length).toBeGreaterThan(0);
      }
    });

    it('should return all permissions for admin role', async () => {
      // Admin role (roleId = 1) should have all permissions
      const permissions = await roleService.getPermissionsByRoleIds([1]);

      expect(Array.isArray(permissions)).toBe(true);
      expect(permissions.length).toBe(1);
      expect(permissions[0].perms).toBe('*:*:*');
    });

    it('should get role detail and verify menu associations exist', async () => {
      // Get existing menus
      const existingMenus = await getExistingMenus(2);
      
      if (existingMenus.length === 0) {
        console.log('Skipping test: No existing menus available');
        return;
      }

      const menuIds = existingMenus.map((m) => m.menuId);

      // Create role with menus
      const role = await createTestRole({
        roleName: '详情测试角色',
        roleKey: `detail_${Date.now()}`,
        menuIds,
      });

      // Get role detail
      const result = await roleService.findOne(role.roleId);

      expect(result.code).toBe(200);
      expect(result.data).toBeDefined();
      expect(result.data.roleId).toBe(role.roleId);

      // Verify menu associations exist in database
      const roleMenus = await prisma.sysRoleMenu.findMany({
        where: { roleId: role.roleId },
      });
      expect(roleMenus.length).toBe(menuIds.length);
      const associatedMenuIds = roleMenus.map((rm) => rm.menuId);
      menuIds.forEach((menuId) => {
        expect(associatedMenuIds).toContain(menuId);
      });
    });
  });

  describe('Role-User Batch Authorization Integration', () => {
    it('should get allocated user list for role', async () => {
      // Create a test role
      const role = await createTestRole({
        roleName: '已分配用户测试',
        roleKey: `alloc_${Date.now()}`,
      });

      // Create users and assign to role
      const user1 = await createTestUser({
        userName: `au1_${Date.now().toString().slice(-6)}`,
        roleIds: [role.roleId],
      });
      const user2 = await createTestUser({
        userName: `au2_${Date.now().toString().slice(-6)}`,
        roleIds: [role.roleId],
      });

      // Get allocated list
      const result = await userService.allocatedList({
        roleId: role.roleId.toString(),
        pageNum: 1,
        pageSize: 10,
      } as any);

      expect(result.code).toBe(200);
      expect(result.data).toHaveProperty('rows');
      expect(result.data).toHaveProperty('total');
      expect(result.data.total).toBeGreaterThanOrEqual(2);

      const userIds = result.data.rows.map((u: any) => u.userId);
      expect(userIds).toContain(user1.userId);
      expect(userIds).toContain(user2.userId);
    });

    it('should get unallocated user list for role', async () => {
      // Create a test role
      const role = await createTestRole({
        roleName: '未分配用户测试',
        roleKey: `unalloc_${Date.now()}`,
      });

      // Create a user without this role
      const user = await createTestUser({
        userName: `uu_${Date.now().toString().slice(-6)}`,
      });

      // Get unallocated list
      const result = await userService.unallocatedList({
        roleId: role.roleId.toString(),
        pageNum: 1,
        pageSize: 100,
      } as any);

      expect(result.code).toBe(200);
      expect(result.data).toHaveProperty('rows');
      expect(result.data).toHaveProperty('total');

      // The created user should be in unallocated list
      const userIds = result.data.rows.map((u: any) => u.userId);
      expect(userIds).toContain(user.userId);
    });

    it('should batch authorize users to role', async () => {
      // Create a test role
      const role = await createTestRole({
        roleName: '批量授权测试',
        roleKey: `batch_auth_${Date.now()}`,
      });

      // Create users without role
      const user1 = await createTestUser({
        userName: `ba1_${Date.now().toString().slice(-6)}`,
      });
      const user2 = await createTestUser({
        userName: `ba2_${Date.now().toString().slice(-6)}`,
      });

      // Batch authorize
      const result = await userService.authUserSelectAll({
        roleId: role.roleId,
        userIds: `${user1.userId},${user2.userId}`,
      });

      expect(result.code).toBe(200);

      // Verify associations
      const userRoles = await prisma.sysUserRole.findMany({
        where: {
          roleId: role.roleId,
          userId: { in: [user1.userId, user2.userId] },
        },
      });

      expect(userRoles.length).toBe(2);
    });

    it('should cancel user role authorization', async () => {
      // Create a test role
      const role = await createTestRole({
        roleName: '取消授权测试',
        roleKey: `cancel_auth_${Date.now()}`,
      });

      // Create user with role
      const user = await createTestUser({
        userName: `ca_${Date.now().toString().slice(-6)}`,
        roleIds: [role.roleId],
      });

      // Verify initial association
      let userRoles = await prisma.sysUserRole.findMany({
        where: { userId: user.userId, roleId: role.roleId },
      });
      expect(userRoles.length).toBe(1);

      // Cancel authorization
      const result = await userService.authUserCancel({
        userId: user.userId,
        roleId: role.roleId,
      });

      expect(result.code).toBe(200);

      // Verify association removed
      userRoles = await prisma.sysUserRole.findMany({
        where: { userId: user.userId, roleId: role.roleId },
      });
      expect(userRoles.length).toBe(0);
    });

    it('should batch cancel user role authorizations', async () => {
      // Create a test role
      const role = await createTestRole({
        roleName: '批量取消授权测试',
        roleKey: `batch_cancel_${Date.now()}`,
      });

      // Create users with role
      const user1 = await createTestUser({
        userName: `bc1_${Date.now().toString().slice(-6)}`,
        roleIds: [role.roleId],
      });
      const user2 = await createTestUser({
        userName: `bc2_${Date.now().toString().slice(-6)}`,
        roleIds: [role.roleId],
      });

      // Verify initial associations
      let userRoles = await prisma.sysUserRole.findMany({
        where: {
          roleId: role.roleId,
          userId: { in: [user1.userId, user2.userId] },
        },
      });
      expect(userRoles.length).toBe(2);

      // Batch cancel
      const result = await userService.authUserCancelAll({
        roleId: role.roleId,
        userIds: `${user1.userId},${user2.userId}`,
      });

      expect(result.code).toBe(200);

      // Verify associations removed
      userRoles = await prisma.sysUserRole.findMany({
        where: {
          roleId: role.roleId,
          userId: { in: [user1.userId, user2.userId] },
        },
      });
      expect(userRoles.length).toBe(0);
    });

    it('should filter allocated users by userName', async () => {
      // Create a test role
      const role = await createTestRole({
        roleName: '过滤用户测试',
        roleKey: `filter_${Date.now()}`,
      });

      const uniquePrefix = `fu_${Date.now().toString().slice(-6)}`;

      // Create users with role
      const user1 = await createTestUser({
        userName: `${uniquePrefix}_a`,
        nickName: '过滤用户A',
        roleIds: [role.roleId],
      });
      await createTestUser({
        userName: `${uniquePrefix}_b`,
        nickName: '过滤用户B',
        roleIds: [role.roleId],
      });

      // Filter by userName
      const result = await userService.allocatedList({
        roleId: role.roleId.toString(),
        userName: `${uniquePrefix}_a`,
        pageNum: 1,
        pageSize: 10,
      } as any);

      expect(result.code).toBe(200);
      expect(result.data.rows.length).toBeGreaterThanOrEqual(1);
      expect(result.data.rows.some((u: any) => u.userId === user1.userId)).toBe(true);
    });
  });

  describe('Role Data Scope Integration', () => {
    it('should set role data scope with departments', async () => {
      // Get existing departments
      const depts = await prisma.sysDept.findMany({
        where: {
          tenantId: testTenantId,
          delFlag: DelFlagEnum.NORMAL,
        },
        take: 2,
      });

      if (depts.length === 0) {
        console.log('Skipping test: No departments available');
        return;
      }

      const deptIds = depts.map((d) => d.deptId);

      // Create role
      const role = await createTestRole({
        roleName: '数据权限测试',
        roleKey: `data_scope_${Date.now()}`,
      });

      // Set data scope
      const result = await roleService.dataScope({
        roleId: role.roleId,
        roleName: role.roleName,
        roleKey: role.roleKey,
        dataScope: '2', // Custom data scope
        deptIds,
      });

      expect(result.code).toBe(200);

      // Verify dept associations
      const roleDepts = await prisma.sysRoleDept.findMany({
        where: { roleId: role.roleId },
      });

      expect(roleDepts.length).toBe(deptIds.length);
      const associatedDeptIds = roleDepts.map((rd) => rd.deptId);
      deptIds.forEach((deptId) => {
        expect(associatedDeptIds).toContain(deptId);
      });
    });

    it('should get role dept tree with checked keys', async () => {
      // Get existing departments
      const depts = await prisma.sysDept.findMany({
        where: {
          tenantId: testTenantId,
          delFlag: DelFlagEnum.NORMAL,
        },
        take: 2,
      });

      if (depts.length === 0) {
        console.log('Skipping test: No departments available');
        return;
      }

      const deptIds = depts.map((d) => d.deptId);

      // Create role with dept associations
      const role = await createTestRole({
        roleName: '部门树测试',
        roleKey: `dept_tree_${Date.now()}`,
        deptIds,
      });

      // Get dept tree
      const result = await roleService.deptTree(role.roleId);

      expect(result.code).toBe(200);
      expect(result.data).toHaveProperty('depts');
      expect(result.data).toHaveProperty('checkedKeys');
      expect(Array.isArray(result.data.depts)).toBe(true);
      expect(Array.isArray(result.data.checkedKeys)).toBe(true);

      // Verify checked keys contain our dept IDs
      deptIds.forEach((deptId) => {
        expect(result.data.checkedKeys).toContain(deptId);
      });
    });
  });
});
