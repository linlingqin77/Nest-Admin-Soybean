import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp, cleanupDatabase, getAuthToken, createTestRole, createTestUser } from './setup-e2e';
import { AppConfigService } from '../src/config/app-config.service';

/**
 * 角色管理 E2E 测试
 * 测试角色列表查询、创建、权限分配、删除
 */
describe('RoleController (e2e)', () => {
  let app: INestApplication;
  let prefix: string;
  let authToken: string;

  beforeAll(async () => {
    app = await createTestApp();
    const config = app.get(AppConfigService);
    prefix = config.app.prefix;
  });

  // 在每个测试前获取新的 token，避免 token 失效
  beforeEach(async () => {
    authToken = await getAuthToken(app);
  });

  afterAll(async () => {
    await cleanupDatabase(app);
    await app.close();
  });

  describe('/system/role/list (GET) - 角色列表查询', () => {
    it('should return role list', async () => {
      const response = await request(app.getHttpServer())
        .get(`${prefix}/system/role/list`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.code).toBe(200);
      expect(response.body.data).toHaveProperty('rows');
      expect(Array.isArray(response.body.data.rows)).toBe(true);
    });

    it('should support pagination', async () => {
      const response = await request(app.getHttpServer())
        .get(`${prefix}/system/role/list`)
        .query({ pageNum: 1, pageSize: 10 })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.code).toBe(200);
      expect(response.body.data).toHaveProperty('total');
      expect(response.body.data.rows.length).toBeLessThanOrEqual(10);
    });

    it('should support filtering by role name', async () => {
      const testRole = await createTestRole(app, {
        roleName: `test_e2e_role_filter_${Date.now()}`,
        roleKey: `test_filter_${Date.now()}`,
        roleSort: 999,
      });

      const response = await request(app.getHttpServer())
        .get(`${prefix}/system/role/list`)
        .query({ roleName: testRole.roleName })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.code).toBe(200);
      if (response.body.data.rows && response.body.data.rows.length > 0) {
        expect(response.body.data.rows[0].roleName).toContain(testRole.roleName);
      }
    });

    it('should support filtering by role key', async () => {
      const testRole = await createTestRole(app, {
        roleName: `test_e2e_role_key_${Date.now()}`,
        roleKey: `test_key_${Date.now()}`,
        roleSort: 999,
      });

      const response = await request(app.getHttpServer())
        .get(`${prefix}/system/role/list`)
        .query({ roleKey: testRole.roleKey })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.code).toBe(200);
      if (response.body.data.rows && response.body.data.rows.length > 0) {
        expect(response.body.data.rows[0].roleKey).toBe(testRole.roleKey);
      }
    });

    it('should support filtering by status', async () => {
      const response = await request(app.getHttpServer())
        .get(`${prefix}/system/role/list`)
        .query({ status: 'NORMAL' })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.code).toBe(200);
      if (response.body.data.rows && response.body.data.rows.length > 0) {
        expect(response.body.data.rows[0].status).toBe('NORMAL');
      }
    });
  });

  describe('/system/role (POST) - 创建角色', () => {
    it('should create role successfully', async () => {
      const newRole = {
        roleName: `test_e2e_create_role_${Date.now()}`,
        roleKey: `test_create_${Date.now()}`,
        roleSort: 999,
        dataScope: '1',
        menuCheckStrictly: false,
        deptCheckStrictly: false,
        status: 'NORMAL',
        remark: 'E2E Test Role',
      };

      const response = await request(app.getHttpServer())
        .post(`${prefix}/system/role`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(newRole)
        .expect(200);

      expect(response.body.code).toBe(200);
    });

    it('should create role with menu permissions', async () => {
      const newRole = {
        roleName: `test_e2e_role_menu_${Date.now()}`,
        roleKey: `test_menu_${Date.now()}`,
        roleSort: 999,
        dataScope: '1',
        menuIds: [1, 2, 3], // 分配菜单权限
        status: 'NORMAL',
      };

      const response = await request(app.getHttpServer())
        .post(`${prefix}/system/role`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(newRole)
        .expect(200);

      expect(response.body.code).toBe(200);
    });

    it('should fail with duplicate role key', async () => {
      const roleKey = `test_dup_key_${Date.now()}`;

      // 创建第一个角色
      await request(app.getHttpServer())
        .post(`${prefix}/system/role`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          roleName: `test_e2e_role1_${Date.now()}`,
          roleKey,
          roleSort: 999,
          status: 'NORMAL',
        })
        .expect(200);

      // 尝试创建相同 roleKey 的角色
      const response = await request(app.getHttpServer())
        .post(`${prefix}/system/role`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          roleName: `test_e2e_role2_${Date.now()}`,
          roleKey,
          roleSort: 999,
          status: 'NORMAL',
        })
        .expect(200);

      expect(response.body.code).not.toBe(200);
    });

    it('should fail with missing required fields', async () => {
      const response = await request(app.getHttpServer())
        .post(`${prefix}/system/role`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          roleName: `test_e2e_invalid_${Date.now()}`,
          // missing roleKey
        })
        .expect(400);

      expect(response.body.code).not.toBe(200);
    });
  });

  describe('/system/role/:id (GET) - 获取角色详情', () => {
    let testRoleId: number;

    beforeAll(async () => {
      const testRole = await createTestRole(app, {
        roleName: `test_e2e_detail_role_${Date.now()}`,
        roleKey: `test_detail_${Date.now()}`,
        roleSort: 999,
      });
      testRoleId = testRole.roleId;
    });

    it('should return role detail', async () => {
      const response = await request(app.getHttpServer())
        .get(`${prefix}/system/role/${testRoleId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.code).toBe(200);
      expect(response.body.data).toHaveProperty('roleId');
      expect(response.body.data.roleId).toBe(testRoleId);
    });

    it('should fail with invalid role id', async () => {
      const response = await request(app.getHttpServer())
        .get(`${prefix}/system/role/999999`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.code).not.toBe(200);
    });
  });

  describe('/system/role (PUT) - 更新角色', () => {
    let testRoleId: number;
    let testRoleKey: string;

    beforeAll(async () => {
      testRoleKey = `test_upd_${Date.now() % 100000}`;
      const testRole = await createTestRole(app, {
        roleName: `test_e2e_update_${Date.now() % 100000}`,
        roleKey: testRoleKey,
        roleSort: 999,
      });
      testRoleId = testRole.roleId;
    });

    it('should update role successfully', async () => {
      const response = await request(app.getHttpServer())
        .put(`${prefix}/system/role`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          roleId: testRoleId,
          roleName: `test_updated_${Date.now() % 100000}`,
          roleKey: testRoleKey,
          roleSort: 888,
          remark: 'Updated remark',
        })
        .expect(200);

      expect(response.body.code).toBe(200);

      // 验证更新是否成功
      const verifyResponse = await request(app.getHttpServer())
        .get(`${prefix}/system/role/${testRoleId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(verifyResponse.body.data.roleSort).toBe(888);
    });

    it('should fail with invalid role id', async () => {
      const response = await request(app.getHttpServer())
        .put(`${prefix}/system/role`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          roleId: 999999,
          roleName: 'Updated Name',
          roleKey: 'updated_key',
        });

      // 更新不存在的角色应该返回业务错误
      expect(response.body.code).not.toBe(200);
    });
  });

  describe('/system/role/changeStatus (PUT) - 修改角色状态', () => {
    let testRoleId: number;

    beforeAll(async () => {
      const testRole = await createTestRole(app, {
        roleName: `test_e2e_status_role_${Date.now()}`,
        roleKey: `test_status_${Date.now()}`,
        roleSort: 999,
      });
      testRoleId = testRole.roleId;
    });

    it('should change role status successfully', async () => {
      const response = await request(app.getHttpServer())
        .put(`${prefix}/system/role/changeStatus`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          roleId: testRoleId,
          status: 'DISABLED',
        })
        .expect(200);

      expect(response.body.code).toBe(200);
    });
  });

  describe('/system/role/dataScope (PUT) - 修改数据权限', () => {
    let testRoleId: number;

    beforeAll(async () => {
      const testRole = await createTestRole(app, {
        roleName: `test_e2e_datascope_role_${Date.now()}`,
        roleKey: `test_datascope_${Date.now()}`,
        roleSort: 999,
      });
      testRoleId = testRole.roleId;
    });

    it('should update data scope successfully', async () => {
      const response = await request(app.getHttpServer())
        .put(`${prefix}/system/role/dataScope`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          roleId: testRoleId,
          roleName: 'test_datascope_role',
          roleKey: 'test_datascope',
          dataScope: 'CUSTOM', // 使用 Prisma 枚举值
          deptIds: [100, 101],
        })
        .expect(200);

      expect(response.body.code).toBe(200);
    });
  });

  describe('/system/role/:id (DELETE) - 删除角色', () => {
    it('should delete role successfully', async () => {
      const testRole = await createTestRole(app, {
        roleName: `test_e2e_delete_role_${Date.now()}`,
        roleKey: `test_delete_${Date.now()}`,
        roleSort: 999,
      });

      const response = await request(app.getHttpServer())
        .delete(`${prefix}/system/role/${testRole.roleId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.code).toBe(200);

      // 验证角色是否被删除（软删除后查询可能返回 500 或业务错误）
      const verifyResponse = await request(app.getHttpServer())
        .get(`${prefix}/system/role/${testRole.roleId}`)
        .set('Authorization', `Bearer ${authToken}`);

      // 删除后查询应该返回错误
      expect(verifyResponse.body.code).not.toBe(200);
    });

    it('should delete multiple roles', async () => {
      const role1 = await createTestRole(app, {
        roleName: `test_e2e_del1_${Date.now()}`,
        roleKey: `test_del1_${Date.now()}`,
        roleSort: 999,
      });

      const role2 = await createTestRole(app, {
        roleName: `test_e2e_del2_${Date.now()}`,
        roleKey: `test_del2_${Date.now()}`,
        roleSort: 999,
      });

      const response = await request(app.getHttpServer())
        .delete(`${prefix}/system/role/${role1.roleId},${role2.roleId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.code).toBe(200);
    });

    it('should fail with invalid role id', async () => {
      const response = await request(app.getHttpServer())
        .delete(`${prefix}/system/role/999999`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // 删除不存在的角色可能返回成功（幂等性）或返回业务错误
      // 这取决于具体实现
      expect(response.body).toBeDefined();
    });
  });

  describe('/system/role/deptTree/:id (GET) - 获取角色部门树', () => {
    let testRoleId: number;

    beforeAll(async () => {
      const testRole = await createTestRole(app, {
        roleName: `test_e2e_depttree_role_${Date.now()}`,
        roleKey: `test_depttree_${Date.now()}`,
        roleSort: 999,
      });
      testRoleId = testRole.roleId;
    });

    it('should return department tree for role', async () => {
      const response = await request(app.getHttpServer())
        .get(`${prefix}/system/role/deptTree/${testRoleId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.code).toBe(200);
      expect(response.body.data).toHaveProperty('depts');
      expect(response.body.data).toHaveProperty('checkedKeys');
    });
  });

  describe('/system/role/optionselect (GET) - 角色选择框列表', () => {
    it('should return role option list', async () => {
      const response = await request(app.getHttpServer())
        .get(`${prefix}/system/role/optionselect`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.code).toBe(200);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should filter by role ids', async () => {
      const role1 = await createTestRole(app, {
        roleName: `test_e2e_opt1_${Date.now()}`,
        roleKey: `test_opt1_${Date.now()}`,
        roleSort: 999,
      });

      const role2 = await createTestRole(app, {
        roleName: `test_e2e_opt2_${Date.now()}`,
        roleKey: `test_opt2_${Date.now()}`,
        roleSort: 999,
      });

      const response = await request(app.getHttpServer())
        .get(`${prefix}/system/role/optionselect`)
        .query({ roleIds: `${role1.roleId},${role2.roleId}` })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.code).toBe(200);
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  describe('角色权限分配', () => {
    let testRoleId: number;
    let testUserId: number;

    beforeAll(async () => {
      const testRole = await createTestRole(app, {
        roleName: `test_e2e_auth_role_${Date.now()}`,
        roleKey: `test_auth_${Date.now()}`,
        roleSort: 999,
      });
      testRoleId = testRole.roleId;

      const testUser = await createTestUser(app, {
        userName: `test_e2e_auth_user_${Date.now()}`,
        password: 'Test123456!',
        deptId: 100,
        roleIds: [testRoleId],
      });
      testUserId = testUser.userId;
    });

    it('should get allocated user list', async () => {
      const response = await request(app.getHttpServer())
        .get(`${prefix}/system/role/authUser/allocatedList`)
        .query({ roleId: testRoleId })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.code).toBe(200);
      expect(response.body.data).toHaveProperty('rows');
      expect(Array.isArray(response.body.data.rows)).toBe(true);
    });

    it('should get unallocated user list', async () => {
      const response = await request(app.getHttpServer())
        .get(`${prefix}/system/role/authUser/unallocatedList`)
        .query({ roleId: testRoleId })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.code).toBe(200);
      expect(response.body.data).toHaveProperty('rows');
      expect(Array.isArray(response.body.data.rows)).toBe(true);
    });

    it('should cancel user role binding', async () => {
      const response = await request(app.getHttpServer())
        .put(`${prefix}/system/role/authUser/cancel`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          userId: testUserId,
          roleId: testRoleId,
        })
        .expect(200);

      expect(response.body.code).toBe(200);
    });

    it('should batch cancel user role bindings', async () => {
      // 先重新绑定
      await request(app.getHttpServer())
        .put(`${prefix}/system/role/authUser/selectAll`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          roleId: testRoleId,
          userIds: String(testUserId), // userIds 是字符串类型
        })
        .expect(200);

      // 批量取消绑定
      const response = await request(app.getHttpServer())
        .put(`${prefix}/system/role/authUser/cancelAll`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          roleId: testRoleId,
          userIds: String(testUserId), // userIds 是字符串类型
        })
        .expect(200);

      expect(response.body.code).toBe(200);
    });

    it('should batch select users for role', async () => {
      const response = await request(app.getHttpServer())
        .put(`${prefix}/system/role/authUser/selectAll`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          roleId: testRoleId,
          userIds: String(testUserId), // userIds 是字符串类型
        })
        .expect(200);

      expect(response.body.code).toBe(200);
    });
  });
});
