/**
 * 角色管理模块E2E测试
 * _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8, 4.9_
 */

import { TestHelper } from '../helpers/test-helper';
import { PrismaService } from 'src/prisma/prisma.service';

describe('Role E2E Tests', () => {
  let helper: TestHelper;
  let prisma: PrismaService;
  const apiPrefix = '/api/v1';
  let token: string;
  const createdRoleIds: number[] = [];
  const createdUserIds: number[] = [];

  beforeAll(async () => {
    helper = new TestHelper();
    await helper.init();
    prisma = helper.getPrisma();
    token = await helper.login();
  }, 60000);

  afterAll(async () => {
    try {
      // Cleanup user-role associations
      if (createdUserIds.length > 0) {
        await prisma.sysUserRole.deleteMany({ where: { userId: { in: createdUserIds } } });
        await prisma.sysUserPost.deleteMany({ where: { userId: { in: createdUserIds } } });
        await prisma.sysUser.deleteMany({ where: { userId: { in: createdUserIds } } });
      }
      // Cleanup role associations
      if (createdRoleIds.length > 0) {
        await prisma.sysRoleMenu.deleteMany({ where: { roleId: { in: createdRoleIds } } });
        await prisma.sysRoleDept.deleteMany({ where: { roleId: { in: createdRoleIds } } });
        await prisma.sysRole.deleteMany({ where: { roleId: { in: createdRoleIds } } });
      }
    } catch (error) {
      console.error('Cleanup error:', error);
    }
    await helper.cleanup();
    await helper.close();
  });

  /**
   * Helper to create test user for role authorization tests
   */
  async function createTestUser(suffix: string) {
    const ts = Date.now().toString().slice(-6);
    const user = await prisma.sysUser.create({
      data: {
        tenantId: '000000',
        userName: `${suffix}_${ts}`,
        nickName: '角色测试用户',
        password: '$2a$10$test',
        deptId: 100,
        email: `${suffix}${ts}@test.com`,
        phonenumber: `138${ts}00`,
        sex: '0',
        status: '0',
        delFlag: '0',
        userType: '01',
        createBy: 'test',
        updateBy: 'test',
      },
    });
    createdUserIds.push(user.userId);
    return user;
  }

  describe('GET /system/role/list', () => {
    it('should return paginated role list', async () => {
      const response = await helper.getAuthRequest()
        .get(`${apiPrefix}/system/role/list`)
        .query({ pageNum: 1, pageSize: 10 })
        .set('Authorization', `Bearer ${token}`)
        .set('tenant-id', '000000')
        .expect(200);
      expect(response.body.code).toBe(200);
      expect(response.body.data).toHaveProperty('rows');
      expect(response.body.data).toHaveProperty('total');
      expect(Array.isArray(response.body.data.rows)).toBe(true);
    });

    it('should filter roles by roleName', async () => {
      const response = await helper.getAuthRequest()
        .get(`${apiPrefix}/system/role/list`)
        .query({ pageNum: 1, pageSize: 10, roleName: '管理' })
        .set('Authorization', `Bearer ${token}`)
        .set('tenant-id', '000000')
        .expect(200);
      expect(response.body.code).toBe(200);
    });

    it('should filter roles by roleKey', async () => {
      const response = await helper.getAuthRequest()
        .get(`${apiPrefix}/system/role/list`)
        .query({ pageNum: 1, pageSize: 10, roleKey: 'admin' })
        .set('Authorization', `Bearer ${token}`)
        .set('tenant-id', '000000')
        .expect(200);
      expect(response.body.code).toBe(200);
    });

    it('should filter roles by status', async () => {
      const response = await helper.getAuthRequest()
        .get(`${apiPrefix}/system/role/list`)
        .query({ pageNum: 1, pageSize: 10, status: '0' })
        .set('Authorization', `Bearer ${token}`)
        .set('tenant-id', '000000')
        .expect(200);
      expect(response.body.code).toBe(200);
    });
  });

  describe('POST /system/role', () => {
    it('should create role successfully', async () => {
      const ts = Date.now().toString().slice(-6);
      const roleData = {
        roleName: `E2E测试角色_${ts}`,
        roleKey: `e2e_role_${ts}`,
        roleSort: 99,
        status: '0',
        dataScope: '1',
        menuIds: [],
      };
      const response = await helper.getAuthRequest()
        .post(`${apiPrefix}/system/role`)
        .set('Authorization', `Bearer ${token}`)
        .set('tenant-id', '000000')
        .send(roleData);
      expect([200, 201]).toContain(response.status);
      expect(response.body.code).toBe(200);
      // Track created role for cleanup
      const role = await prisma.sysRole.findFirst({ where: { roleKey: roleData.roleKey } });
      if (role) createdRoleIds.push(role.roleId);
    });

    it('should create role with menu permissions', async () => {
      const ts = Date.now().toString().slice(-6);
      // Get some existing menus
      const menus = await prisma.sysMenu.findMany({
        where: { tenantId: '000000', delFlag: '0' },
        take: 3,
      });
      const menuIds = menus.map((m) => m.menuId);

      const roleData = {
        roleName: `菜单权限角色_${ts}`,
        roleKey: `menu_role_${ts}`,
        roleSort: 99,
        status: '0',
        dataScope: '1',
        menuIds,
      };
      const response = await helper.getAuthRequest()
        .post(`${apiPrefix}/system/role`)
        .set('Authorization', `Bearer ${token}`)
        .set('tenant-id', '000000')
        .send(roleData);
      expect([200, 201]).toContain(response.status);
      expect(response.body.code).toBe(200);
      // Track and verify
      const role = await prisma.sysRole.findFirst({ where: { roleKey: roleData.roleKey } });
      if (role) {
        createdRoleIds.push(role.roleId);
        const roleMenus = await prisma.sysRoleMenu.findMany({ where: { roleId: role.roleId } });
        expect(roleMenus.length).toBe(menuIds.length);
      }
    });
  });

  describe('GET /system/role/:id', () => {
    let testRoleId: number;

    beforeAll(async () => {
      const ts = Date.now().toString().slice(-6);
      const role = await prisma.sysRole.create({
        data: {
          tenantId: '000000',
          roleName: `查询测试角色_${ts}`,
          roleKey: `query_role_${ts}`,
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
    });

    it('should return role detail by ID', async () => {
      const response = await helper.getAuthRequest()
        .get(`${apiPrefix}/system/role/${testRoleId}`)
        .set('Authorization', `Bearer ${token}`)
        .set('tenant-id', '000000')
        .expect(200);
      expect(response.body.code).toBe(200);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.roleId).toBe(testRoleId);
    });

    it('should return null for non-existent role', async () => {
      const response = await helper.getAuthRequest()
        .get(`${apiPrefix}/system/role/999999`)
        .set('Authorization', `Bearer ${token}`)
        .set('tenant-id', '000000')
        .expect(200);
      expect(response.body.code).toBe(200);
      expect(response.body.data == null).toBe(true);
    });
  });

  describe('PUT /system/role', () => {
    let updateRoleId: number;

    beforeAll(async () => {
      const ts = Date.now().toString().slice(-6);
      const role = await prisma.sysRole.create({
        data: {
          tenantId: '000000',
          roleName: `更新测试角色_${ts}`,
          roleKey: `update_role_${ts}`,
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
      updateRoleId = role.roleId;
      createdRoleIds.push(updateRoleId);
    });

    it('should update role successfully', async () => {
      const response = await helper.getAuthRequest()
        .put(`${apiPrefix}/system/role`)
        .set('Authorization', `Bearer ${token}`)
        .set('tenant-id', '000000')
        .send({
          roleId: updateRoleId,
          roleName: '更新后角色名',
          roleKey: `updated_key_${Date.now()}`,
          roleSort: 88,
          dataScope: '1',
          menuIds: [],
        })
        .expect(200);
      expect(response.body.code).toBe(200);
      const role = await prisma.sysRole.findUnique({ where: { roleId: updateRoleId } });
      expect(role?.roleName).toBe('更新后角色名');
    });

    it('should update role with new menu permissions', async () => {
      const menus = await prisma.sysMenu.findMany({
        where: { tenantId: '000000', delFlag: '0' },
        take: 2,
      });
      const menuIds = menus.map((m) => m.menuId);

      const response = await helper.getAuthRequest()
        .put(`${apiPrefix}/system/role`)
        .set('Authorization', `Bearer ${token}`)
        .set('tenant-id', '000000')
        .send({
          roleId: updateRoleId,
          roleName: '更新后角色名',
          roleKey: `updated_key2_${Date.now()}`,
          roleSort: 88,
          dataScope: '1',
          menuIds,
        })
        .expect(200);
      expect(response.body.code).toBe(200);
      const roleMenus = await prisma.sysRoleMenu.findMany({ where: { roleId: updateRoleId } });
      expect(roleMenus.length).toBe(menuIds.length);
    });
  });

  describe('DELETE /system/role/:ids', () => {
    let deleteRoleId: number;

    beforeAll(async () => {
      const ts = Date.now().toString().slice(-6);
      const role = await prisma.sysRole.create({
        data: {
          tenantId: '000000',
          roleName: `删除测试角色_${ts}`,
          roleKey: `delete_role_${ts}`,
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
      deleteRoleId = role.roleId;
    });

    it('should delete role (soft delete)', async () => {
      const response = await helper.getAuthRequest()
        .delete(`${apiPrefix}/system/role/${deleteRoleId}`)
        .set('Authorization', `Bearer ${token}`)
        .set('tenant-id', '000000')
        .expect(200);
      expect(response.body.code).toBe(200);
      const role = await prisma.sysRole.findUnique({ where: { roleId: deleteRoleId } });
      expect(role?.delFlag).toBe('1');
    });

    it('should delete multiple roles', async () => {
      const ts = Date.now().toString().slice(-6);
      const role1 = await prisma.sysRole.create({
        data: {
          tenantId: '000000',
          roleName: `批量删除1_${ts}`,
          roleKey: `batch_del1_${ts}`,
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
      const role2 = await prisma.sysRole.create({
        data: {
          tenantId: '000000',
          roleName: `批量删除2_${ts}`,
          roleKey: `batch_del2_${ts}`,
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

      const response = await helper.getAuthRequest()
        .delete(`${apiPrefix}/system/role/${role1.roleId},${role2.roleId}`)
        .set('Authorization', `Bearer ${token}`)
        .set('tenant-id', '000000')
        .expect(200);
      expect(response.body.code).toBe(200);
    });
  });

  describe('PUT /system/role/changeStatus', () => {
    let statusRoleId: number;

    beforeAll(async () => {
      const ts = Date.now().toString().slice(-6);
      const role = await prisma.sysRole.create({
        data: {
          tenantId: '000000',
          roleName: `状态测试角色_${ts}`,
          roleKey: `status_role_${ts}`,
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
      statusRoleId = role.roleId;
      createdRoleIds.push(statusRoleId);
    });

    it('should change role status to disabled', async () => {
      const response = await helper.getAuthRequest()
        .put(`${apiPrefix}/system/role/changeStatus`)
        .set('Authorization', `Bearer ${token}`)
        .set('tenant-id', '000000')
        .send({ roleId: statusRoleId, status: '1' })
        .expect(200);
      expect(response.body.code).toBe(200);
      const role = await prisma.sysRole.findUnique({ where: { roleId: statusRoleId } });
      expect(role?.status).toBe('1');
    });

    it('should change role status to enabled', async () => {
      const response = await helper.getAuthRequest()
        .put(`${apiPrefix}/system/role/changeStatus`)
        .set('Authorization', `Bearer ${token}`)
        .set('tenant-id', '000000')
        .send({ roleId: statusRoleId, status: '0' })
        .expect(200);
      expect(response.body.code).toBe(200);
      const role = await prisma.sysRole.findUnique({ where: { roleId: statusRoleId } });
      expect(role?.status).toBe('0');
    });
  });

  describe('PUT /system/role/dataScope', () => {
    let dataScopeRoleId: number;

    beforeAll(async () => {
      const ts = Date.now().toString().slice(-6);
      const role = await prisma.sysRole.create({
        data: {
          tenantId: '000000',
          roleName: `数据权限角色_${ts}`,
          roleKey: `data_scope_${ts}`,
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
      dataScopeRoleId = role.roleId;
      createdRoleIds.push(dataScopeRoleId);
    });

    it('should set data scope to custom with departments', async () => {
      const depts = await prisma.sysDept.findMany({
        where: { tenantId: '000000', delFlag: '0' },
        take: 2,
      });
      const deptIds = depts.map((d) => d.deptId);

      const response = await helper.getAuthRequest()
        .put(`${apiPrefix}/system/role/dataScope`)
        .set('Authorization', `Bearer ${token}`)
        .set('tenant-id', '000000')
        .send({
          roleId: dataScopeRoleId,
          roleName: '数据权限角色',
          roleKey: `data_scope_updated_${Date.now()}`,
          dataScope: '2', // Custom
          deptIds,
        })
        .expect(200);
      expect(response.body.code).toBe(200);
      const roleDepts = await prisma.sysRoleDept.findMany({ where: { roleId: dataScopeRoleId } });
      expect(roleDepts.length).toBe(deptIds.length);
    });

    it('should set data scope to all', async () => {
      const response = await helper.getAuthRequest()
        .put(`${apiPrefix}/system/role/dataScope`)
        .set('Authorization', `Bearer ${token}`)
        .set('tenant-id', '000000')
        .send({
          roleId: dataScopeRoleId,
          roleName: '数据权限角色',
          roleKey: `data_scope_all_${Date.now()}`,
          dataScope: '1', // All
          deptIds: [],
        })
        .expect(200);
      expect(response.body.code).toBe(200);
      const role = await prisma.sysRole.findUnique({ where: { roleId: dataScopeRoleId } });
      expect(role?.dataScope).toBe('1');
    });
  });

  describe('GET /system/role/authUser/allocatedList', () => {
    let allocRoleId: number;
    let allocUserId: number;

    beforeAll(async () => {
      const ts = Date.now().toString().slice(-6);
      const role = await prisma.sysRole.create({
        data: {
          tenantId: '000000',
          roleName: `已分配用户角色_${ts}`,
          roleKey: `alloc_user_${ts}`,
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
      allocRoleId = role.roleId;
      createdRoleIds.push(allocRoleId);

      const user = await createTestUser('alloc');
      allocUserId = user.userId;

      // Assign user to role
      await prisma.sysUserRole.create({
        data: { userId: allocUserId, roleId: allocRoleId },
      });
    });

    it('should return allocated user list for role', async () => {
      const response = await helper.getAuthRequest()
        .get(`${apiPrefix}/system/role/authUser/allocatedList`)
        .query({ roleId: allocRoleId, pageNum: 1, pageSize: 10 })
        .set('Authorization', `Bearer ${token}`)
        .set('tenant-id', '000000')
        .expect(200);
      expect(response.body.code).toBe(200);
      expect(response.body.data).toHaveProperty('rows');
      expect(response.body.data).toHaveProperty('total');
      expect(response.body.data.total).toBeGreaterThanOrEqual(1);
      const userIds = response.body.data.rows.map((u: any) => u.userId);
      expect(userIds).toContain(allocUserId);
    });

    it('should filter allocated users by userName', async () => {
      const response = await helper.getAuthRequest()
        .get(`${apiPrefix}/system/role/authUser/allocatedList`)
        .query({ roleId: allocRoleId, pageNum: 1, pageSize: 10, userName: 'alloc' })
        .set('Authorization', `Bearer ${token}`)
        .set('tenant-id', '000000')
        .expect(200);
      expect(response.body.code).toBe(200);
    });
  });

  describe('GET /system/role/authUser/unallocatedList', () => {
    let unallocRoleId: number;
    let unallocUserId: number;

    beforeAll(async () => {
      const ts = Date.now().toString().slice(-6);
      const role = await prisma.sysRole.create({
        data: {
          tenantId: '000000',
          roleName: `未分配用户角色_${ts}`,
          roleKey: `unalloc_user_${ts}`,
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
      unallocRoleId = role.roleId;
      createdRoleIds.push(unallocRoleId);

      // Create user without this role
      const user = await createTestUser('unalloc');
      unallocUserId = user.userId;
    });

    it('should return unallocated user list for role', async () => {
      const response = await helper.getAuthRequest()
        .get(`${apiPrefix}/system/role/authUser/unallocatedList`)
        .query({ roleId: unallocRoleId, pageNum: 1, pageSize: 100 })
        .set('Authorization', `Bearer ${token}`)
        .set('tenant-id', '000000')
        .expect(200);
      expect(response.body.code).toBe(200);
      expect(response.body.data).toHaveProperty('rows');
      expect(response.body.data).toHaveProperty('total');
      const userIds = response.body.data.rows.map((u: any) => u.userId);
      expect(userIds).toContain(unallocUserId);
    });
  });

  describe('PUT /system/role/authUser/selectAll', () => {
    let batchAuthRoleId: number;
    let batchUser1Id: number;
    let batchUser2Id: number;

    beforeAll(async () => {
      const ts = Date.now().toString().slice(-6);
      const role = await prisma.sysRole.create({
        data: {
          tenantId: '000000',
          roleName: `批量授权角色_${ts}`,
          roleKey: `batch_auth_${ts}`,
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
      batchAuthRoleId = role.roleId;
      createdRoleIds.push(batchAuthRoleId);

      const user1 = await createTestUser('ba1');
      const user2 = await createTestUser('ba2');
      batchUser1Id = user1.userId;
      batchUser2Id = user2.userId;
    });

    it('should batch authorize users to role', async () => {
      const response = await helper.getAuthRequest()
        .put(`${apiPrefix}/system/role/authUser/selectAll`)
        .set('Authorization', `Bearer ${token}`)
        .set('tenant-id', '000000')
        .send({
          roleId: batchAuthRoleId,
          userIds: `${batchUser1Id},${batchUser2Id}`,
        })
        .expect(200);
      expect(response.body.code).toBe(200);

      // Verify associations
      const userRoles = await prisma.sysUserRole.findMany({
        where: {
          roleId: batchAuthRoleId,
          userId: { in: [batchUser1Id, batchUser2Id] },
        },
      });
      expect(userRoles.length).toBe(2);
    });
  });

  describe('PUT /system/role/authUser/cancel', () => {
    let cancelRoleId: number;
    let cancelUserId: number;

    beforeAll(async () => {
      const ts = Date.now().toString().slice(-6);
      const role = await prisma.sysRole.create({
        data: {
          tenantId: '000000',
          roleName: `取消授权角色_${ts}`,
          roleKey: `cancel_auth_${ts}`,
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
      cancelRoleId = role.roleId;
      createdRoleIds.push(cancelRoleId);

      const user = await createTestUser('cancel');
      cancelUserId = user.userId;

      // Assign user to role
      await prisma.sysUserRole.create({
        data: { userId: cancelUserId, roleId: cancelRoleId },
      });
    });

    it('should cancel user role authorization', async () => {
      const response = await helper.getAuthRequest()
        .put(`${apiPrefix}/system/role/authUser/cancel`)
        .set('Authorization', `Bearer ${token}`)
        .set('tenant-id', '000000')
        .send({
          roleId: cancelRoleId,
          userId: cancelUserId,
        })
        .expect(200);
      expect(response.body.code).toBe(200);

      // Verify association removed
      const userRoles = await prisma.sysUserRole.findMany({
        where: { userId: cancelUserId, roleId: cancelRoleId },
      });
      expect(userRoles.length).toBe(0);
    });
  });

  describe('PUT /system/role/authUser/cancelAll', () => {
    let cancelAllRoleId: number;
    let cancelAllUser1Id: number;
    let cancelAllUser2Id: number;

    beforeAll(async () => {
      const ts = Date.now().toString().slice(-6);
      const role = await prisma.sysRole.create({
        data: {
          tenantId: '000000',
          roleName: `批量取消角色_${ts}`,
          roleKey: `cancel_all_${ts}`,
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
      cancelAllRoleId = role.roleId;
      createdRoleIds.push(cancelAllRoleId);

      const user1 = await createTestUser('ca1');
      const user2 = await createTestUser('ca2');
      cancelAllUser1Id = user1.userId;
      cancelAllUser2Id = user2.userId;

      // Assign users to role
      await prisma.sysUserRole.createMany({
        data: [
          { userId: cancelAllUser1Id, roleId: cancelAllRoleId },
          { userId: cancelAllUser2Id, roleId: cancelAllRoleId },
        ],
      });
    });

    it('should batch cancel user role authorizations', async () => {
      const response = await helper.getAuthRequest()
        .put(`${apiPrefix}/system/role/authUser/cancelAll`)
        .set('Authorization', `Bearer ${token}`)
        .set('tenant-id', '000000')
        .send({
          roleId: cancelAllRoleId,
          userIds: `${cancelAllUser1Id},${cancelAllUser2Id}`,
        })
        .expect(200);
      expect(response.body.code).toBe(200);

      // Verify associations removed
      const userRoles = await prisma.sysUserRole.findMany({
        where: {
          roleId: cancelAllRoleId,
          userId: { in: [cancelAllUser1Id, cancelAllUser2Id] },
        },
      });
      expect(userRoles.length).toBe(0);
    });
  });

  describe('GET /system/role/optionselect', () => {
    it('should return role option list', async () => {
      const response = await helper.getAuthRequest()
        .get(`${apiPrefix}/system/role/optionselect`)
        .set('Authorization', `Bearer ${token}`)
        .set('tenant-id', '000000')
        .expect(200);
      expect(response.body.code).toBe(200);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should filter by roleIds', async () => {
      const roles = await prisma.sysRole.findMany({
        where: { tenantId: '000000', delFlag: '0' },
        take: 2,
      });
      if (roles.length < 2) return;

      const roleIds = roles.map((r) => r.roleId).join(',');
      const response = await helper.getAuthRequest()
        .get(`${apiPrefix}/system/role/optionselect`)
        .query({ roleIds })
        .set('Authorization', `Bearer ${token}`)
        .set('tenant-id', '000000')
        .expect(200);
      expect(response.body.code).toBe(200);
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  describe('GET /system/role/deptTree/:id', () => {
    let deptTreeRoleId: number;

    beforeAll(async () => {
      const ts = Date.now().toString().slice(-6);
      const role = await prisma.sysRole.create({
        data: {
          tenantId: '000000',
          roleName: `部门树角色_${ts}`,
          roleKey: `dept_tree_${ts}`,
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
      deptTreeRoleId = role.roleId;
      createdRoleIds.push(deptTreeRoleId);

      // Add some dept associations
      const depts = await prisma.sysDept.findMany({
        where: { tenantId: '000000', delFlag: '0' },
        take: 2,
      });
      if (depts.length > 0) {
        await prisma.sysRoleDept.createMany({
          data: depts.map((d) => ({ roleId: deptTreeRoleId, deptId: d.deptId })),
        });
      }
    });

    it('should return dept tree with checked keys', async () => {
      const response = await helper.getAuthRequest()
        .get(`${apiPrefix}/system/role/deptTree/${deptTreeRoleId}`)
        .set('Authorization', `Bearer ${token}`)
        .set('tenant-id', '000000')
        .expect(200);
      expect(response.body.code).toBe(200);
      expect(response.body.data).toHaveProperty('depts');
      expect(response.body.data).toHaveProperty('checkedKeys');
      expect(Array.isArray(response.body.data.depts)).toBe(true);
      expect(Array.isArray(response.body.data.checkedKeys)).toBe(true);
    });
  });

  describe('POST /system/role/export', () => {
    it('should export roles as Excel', async () => {
      const response = await helper.getAuthRequest()
        .post(`${apiPrefix}/system/role/export`)
        .set('Authorization', `Bearer ${token}`)
        .set('tenant-id', '000000')
        .send({});
      expect([200, 201]).toContain(response.status);
      expect(response.headers['content-type']).toContain(
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      );
    });
  });
});
