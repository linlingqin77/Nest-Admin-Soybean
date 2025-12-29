import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp, cleanupDatabase, getAuthToken, createTestUser, createTestDept, createTestRole } from './setup-e2e';
import { AppConfigService } from '../src/config/app-config.service';

/**
 * 用户管理 E2E 测试
 * 测试用户列表查询、创建、更新、删除和权限验证
 */
describe('UserController (e2e)', () => {
  let app: INestApplication;
  let prefix: string;
  let authToken: string;
  let testDeptId: number;
  let testRoleId: number;

  beforeAll(async () => {
    app = await createTestApp();
    const config = app.get(AppConfigService);
    prefix = config.app.prefix;

    // 创建测试部门
    const testDept = await createTestDept(app, {
      deptName: 'test_e2e_dept',
      orderNum: 999,
    });
    testDeptId = testDept.deptId;

    // 创建测试角色
    const testRole = await createTestRole(app, {
      roleName: 'test_e2e_role',
      roleKey: 'test_e2e',
      roleSort: 999,
    });
    testRoleId = testRole.roleId;
  });

  // 在每个测试前获取新的 token，避免 token 失效
  beforeEach(async () => {
    authToken = await getAuthToken(app);
  });

  afterAll(async () => {
    await cleanupDatabase(app);
    await app.close();
  });

  describe('/system/user/getInfo (GET) - 获取当前用户信息', () => {
    it('should return current user info with valid token', async () => {
      const response = await request(app.getHttpServer())
        .get(`${prefix}/system/user/getInfo`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.code).toBe(200);
      expect(response.body.data).toHaveProperty('user');
      expect(response.body.data).toHaveProperty('roles');
      expect(response.body.data).toHaveProperty('permissions');
      expect(response.body.data.user).not.toHaveProperty('password');
    });

    it('should reject without token', async () => {
      const response = await request(app.getHttpServer())
        .get(`${prefix}/system/user/getInfo`)
        .expect(401);

      expect(response.body.code).not.toBe(200);
    });
  });

  describe('/system/user/list (GET) - 用户列表查询', () => {
    it('should return user list with valid token', async () => {
      const response = await request(app.getHttpServer())
        .get(`${prefix}/system/user/list`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.code).toBe(200);
      expect(response.body.data).toHaveProperty('rows');
      expect(Array.isArray(response.body.data.rows)).toBe(true);
    });

    it('should support pagination', async () => {
      const response = await request(app.getHttpServer())
        .get(`${prefix}/system/user/list`)
        .query({ pageNum: 1, pageSize: 10 })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.code).toBe(200);
      expect(response.body.data).toHaveProperty('total');
      expect(response.body.data.rows.length).toBeLessThanOrEqual(10);
    });

    it('should support filtering by username', async () => {
      const response = await request(app.getHttpServer())
        .get(`${prefix}/system/user/list`)
        .query({ userName: 'admin' })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.code).toBe(200);
      if (response.body.data.rows.length > 0) {
        expect(response.body.data.rows[0].userName).toContain('admin');
      }
    });

    it('should support filtering by status', async () => {
      const response = await request(app.getHttpServer())
        .get(`${prefix}/system/user/list`)
        .query({ status: 'NORMAL' })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.code).toBe(200);
      if (response.body.data.rows && response.body.data.rows.length > 0) {
        expect(response.body.data.rows[0].status).toBe('NORMAL');
      }
    });

    it('should reject without permission', async () => {
      // 创建一个没有权限的测试用户
      const testUser = await createTestUser(app, {
        userName: `test_no_perm_${Date.now()}`,
        password: 'Test123456!',
        deptId: testDeptId,
      });

      const testToken = await getAuthToken(app, testUser.userName, 'Test123456!');

      const response = await request(app.getHttpServer())
        .get(`${prefix}/system/user/list`)
        .set('Authorization', `Bearer ${testToken}`)
        .expect(403); // 应该返回 403 Forbidden

      // 应该返回权限不足的错误
      expect(response.body.code).not.toBe(200);
    });
  });

  describe('/system/user (POST) - 创建用户', () => {
    it('should create user successfully with valid data', async () => {
      const newUser = {
        userName: `test_e2e_create_${Date.now()}`,
        nickName: 'E2E Test User',
        password: 'Test123456!',
        email: `test_${Date.now()}@test.example.com`,
        phonenumber: '13800138000',
        sex: 'MALE',
        status: 'NORMAL',
        deptId: testDeptId,
        roleIds: [testRoleId],
        postIds: [],
      };

      const response = await request(app.getHttpServer())
        .post(`${prefix}/system/user`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(newUser)
        .expect(201); // POST 创建成功返回 201

      expect(response.body.code).toBe(200);
    });

    it('should fail with duplicate username', async () => {
      const duplicateUsername = `test_e2e_dup_${Date.now()}`;

      // 创建第一个用户
      await request(app.getHttpServer())
        .post(`${prefix}/system/user`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          userName: duplicateUsername,
          nickName: 'Test User 1',
          password: 'Test123456!',
          email: `test1_${Date.now()}@test.example.com`,
          phonenumber: '13800138001',
          deptId: testDeptId,
        })
        .expect(201); // POST 创建成功返回 201

      // 尝试创建重复用户名的用户
      const response = await request(app.getHttpServer())
        .post(`${prefix}/system/user`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          userName: duplicateUsername,
          nickName: 'Test User 2',
          password: 'Test123456!',
          email: `test2_${Date.now()}@test.example.com`,
          phonenumber: '13800138002',
          deptId: testDeptId,
        })
        .expect(201);

      // 重复用户名应该返回业务错误
      expect(response.body.code).not.toBe(200);
    });

    it('should fail with missing required fields', async () => {
      const response = await request(app.getHttpServer())
        .post(`${prefix}/system/user`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          userName: `test_e2e_invalid_${Date.now()}`,
          // missing password and other required fields
        })
        .expect(400);

      expect(response.body.code).not.toBe(200);
    });

    it('should reject without permission', async () => {
      const testUser = await createTestUser(app, {
        userName: `test_no_create_perm_${Date.now()}`,
        password: 'Test123456!',
        deptId: testDeptId,
      });

      const testToken = await getAuthToken(app, testUser.userName, 'Test123456!');

      const response = await request(app.getHttpServer())
        .post(`${prefix}/system/user`)
        .set('Authorization', `Bearer ${testToken}`)
        .send({
          userName: `test_e2e_new_${Date.now()}`,
          nickName: 'New User',
          password: 'Test123456!',
          deptId: testDeptId,
        })
        .expect(403); // 应该返回 403 Forbidden

      expect(response.body.code).not.toBe(200);
    });
  });

  describe('/system/user/:userId (GET) - 获取用户详情', () => {
    let testUserId: number;

    beforeAll(async () => {
      const testUser = await createTestUser(app, {
        userName: `test_e2e_detail_${Date.now()}`,
        password: 'Test123456!',
        deptId: testDeptId,
      });
      testUserId = testUser.userId;
    });

    it('should return user detail with valid id', async () => {
      const response = await request(app.getHttpServer())
        .get(`${prefix}/system/user/${testUserId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.code).toBe(200);
      expect(response.body.data).toHaveProperty('data');
      expect(response.body.data.data.userId).toBe(testUserId);
    });

    it('should return null for invalid user id', async () => {
      const response = await request(app.getHttpServer())
        .get(`${prefix}/system/user/999999`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // 查询不存在的用户返回 null
      expect(response.body.code).toBe(200);
      expect(response.body.data).toBeNull();
    });
  });

  describe('/system/user (PUT) - 更新用户', () => {
    let testUserId: number;

    beforeAll(async () => {
      const testUser = await createTestUser(app, {
        userName: `test_e2e_update_${Date.now()}`,
        password: 'Test123456!',
        nickName: 'Original Name',
        deptId: testDeptId,
      });
      testUserId = testUser.userId;
    });

    it('should update user successfully', async () => {
      const response = await request(app.getHttpServer())
        .put(`${prefix}/system/user`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          userId: testUserId,
          nickName: 'Updated Name',
          email: `updated_${Date.now()}@test.example.com`,
          phonenumber: '13900139000',
        })
        .expect(200);

      expect(response.body.code).toBe(200);

      // 验证更新是否成功
      const verifyResponse = await request(app.getHttpServer())
        .get(`${prefix}/system/user/${testUserId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(verifyResponse.body.data.data.nickName).toBe('Updated Name');
    });

    it('should fail with invalid user id', async () => {
      const response = await request(app.getHttpServer())
        .put(`${prefix}/system/user`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          userId: 999999,
          nickName: 'Updated Name',
        })
        .expect(200);

      // 更新不存在的用户应该返回业务错误
      expect(response.body.code).not.toBe(200);
    });
  });

  describe('/system/user/changeStatus (PUT) - 修改用户状态', () => {
    let testUserId: number;

    beforeAll(async () => {
      const testUser = await createTestUser(app, {
        userName: `test_e2e_status_${Date.now()}`,
        password: 'Test123456!',
        deptId: testDeptId,
      });
      testUserId = testUser.userId;
    });

    it('should change user status successfully', async () => {
      const response = await request(app.getHttpServer())
        .put(`${prefix}/system/user/changeStatus`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          userId: testUserId,
          status: 'DISABLED',
        })
        .expect(200);

      expect(response.body.code).toBe(200);

      // 验证状态是否更改
      const verifyResponse = await request(app.getHttpServer())
        .get(`${prefix}/system/user/${testUserId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(verifyResponse.body.data.data.status).toBe('DISABLED');
    });
  });

  describe('/system/user/:id (DELETE) - 删除用户', () => {
    it('should delete user successfully', async () => {
      const testUser = await createTestUser(app, {
        userName: `test_e2e_delete_${Date.now()}`,
        password: 'Test123456!',
        deptId: testDeptId,
      });

      const response = await request(app.getHttpServer())
        .delete(`${prefix}/system/user/${testUser.userId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.code).toBe(200);

      // 验证用户是否被删除（软删除后查询应该返回 null 或错误）
      const verifyResponse = await request(app.getHttpServer())
        .get(`${prefix}/system/user/${testUser.userId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // 软删除后，用户应该查询不到或返回错误
      expect(verifyResponse.body.data).toBeNull();
    });

    it('should delete multiple users', async () => {
      const user1 = await createTestUser(app, {
        userName: `test_e2e_del1_${Date.now()}`,
        password: 'Test123456!',
        deptId: testDeptId,
      });

      const user2 = await createTestUser(app, {
        userName: `test_e2e_del2_${Date.now()}`,
        password: 'Test123456!',
        deptId: testDeptId,
      });

      const response = await request(app.getHttpServer())
        .delete(`${prefix}/system/user/${user1.userId},${user2.userId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.code).toBe(200);
    });

    it('should fail with invalid user id', async () => {
      const response = await request(app.getHttpServer())
        .delete(`${prefix}/system/user/999999`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // 删除不存在的用户应该返回成功（幂等性）或返回 0 条删除记录
      expect(response.body.code).toBe(200);
      if (response.body.data) {
        expect(response.body.data.count).toBe(0);
      }
    });
  });

  describe('/system/user/deptTree (GET) - 获取部门树', () => {
    it('should return department tree', async () => {
      const response = await request(app.getHttpServer())
        .get(`${prefix}/system/user/deptTree`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.code).toBe(200);
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  describe('/system/user/profile (GET/PUT) - 个人中心', () => {
    it('should get user profile', async () => {
      const response = await request(app.getHttpServer())
        .get(`${prefix}/system/user/profile`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.code).toBe(200);
      expect(response.body.data).toHaveProperty('userName');
    });

    it('should update user profile', async () => {
      const response = await request(app.getHttpServer())
        .put(`${prefix}/system/user/profile`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          nickName: 'Updated Profile Name',
          email: `profile_${Date.now()}@test.example.com`,
        })
        .expect(200);

      expect(response.body.code).toBe(200);
    });
  });

  describe('权限验证', () => {
    it('should enforce permission for user list', async () => {
      const testUser = await createTestUser(app, {
        userName: `test_e2e_perm_${Date.now()}`,
        password: 'Test123456!',
        deptId: testDeptId,
      });

      const testToken = await getAuthToken(app, testUser.userName, 'Test123456!');

      const response = await request(app.getHttpServer())
        .get(`${prefix}/system/user/list`)
        .set('Authorization', `Bearer ${testToken}`)
        .expect(403); // 没有权限应该返回 403

      expect(response.body.code).not.toBe(200);
    });

    it('should enforce permission for user creation', async () => {
      const testUser = await createTestUser(app, {
        userName: `test_e2e_create_perm_${Date.now()}`,
        password: 'Test123456!',
        deptId: testDeptId,
      });

      const testToken = await getAuthToken(app, testUser.userName, 'Test123456!');

      const response = await request(app.getHttpServer())
        .post(`${prefix}/system/user`)
        .set('Authorization', `Bearer ${testToken}`)
        .send({
          userName: `test_new_${Date.now()}`,
          nickName: 'New User',
          password: 'Test123456!',
          deptId: testDeptId,
        })
        .expect(403); // 没有权限应该返回 403

      expect(response.body.code).not.toBe(200);
    });

    it('should enforce role for user deletion', async () => {
      const testUser = await createTestUser(app, {
        userName: `test_e2e_del_perm_${Date.now()}`,
        password: 'Test123456!',
        deptId: testDeptId,
      });

      const testToken = await getAuthToken(app, testUser.userName, 'Test123456!');

      const userToDelete = await createTestUser(app, {
        userName: `test_e2e_to_del_${Date.now()}`,
        password: 'Test123456!',
        deptId: testDeptId,
      });

      const response = await request(app.getHttpServer())
        .delete(`${prefix}/system/user/${userToDelete.userId}`)
        .set('Authorization', `Bearer ${testToken}`)
        .expect(403); // 没有权限应该返回 403

      expect(response.body.code).not.toBe(200);
    });
  });
});
