import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp, cleanupDatabase, getAuthToken, createTestUser } from './setup-e2e';
import { AppConfigService } from '../src/config/app-config.service';
import { PrismaService } from '../src/prisma/prisma.service';

/**
 * 租户管理 E2E 测试
 * 测试租户创建、租户隔离、租户切换
 */
describe('TenantController (e2e)', () => {
  let app: INestApplication;
  let prefix: string;
  let authToken: string;
  let prisma: PrismaService;
  let config: AppConfigService;

  beforeAll(async () => {
    app = await createTestApp();
    config = app.get(AppConfigService);
    prefix = config.app.prefix;
    prisma = app.get(PrismaService);

    // 获取管理员 token
    authToken = await getAuthToken(app);
  });

  afterAll(async () => {
    await cleanupDatabase(app);
    await app.close();
  });

  describe('/system/tenant/list (GET) - 租户列表查询', () => {
    it('should return tenant list', async () => {
      const response = await request(app.getHttpServer())
        .get(`${prefix}/system/tenant/list`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.code).toBe(200);
      expect(response.body.data).toHaveProperty('list');
      expect(Array.isArray(response.body.data.list)).toBe(true);
    });

    it('should support pagination', async () => {
      const response = await request(app.getHttpServer())
        .get(`${prefix}/system/tenant/list`)
        .query({ pageNum: 1, pageSize: 10 })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.code).toBe(200);
      expect(response.body.data).toHaveProperty('total');
      expect(response.body.data.list.length).toBeLessThanOrEqual(10);
    });

    it('should support filtering by company name', async () => {
      const response = await request(app.getHttpServer())
        .get(`${prefix}/system/tenant/list`)
        .query({ companyName: '默认' })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.code).toBe(200);
      if (response.body.data.list.length > 0) {
        expect(response.body.data.list[0].companyName).toContain('默认');
      }
    });

    it('should support filtering by status', async () => {
      const response = await request(app.getHttpServer())
        .get(`${prefix}/system/tenant/list`)
        .query({ status: 'NORMAL' })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.code).toBe(200);
      if (response.body.data.list.length > 0) {
        expect(response.body.data.list[0].status).toBe('NORMAL');
      }
    });
  });

  describe('/system/tenant (POST) - 创建租户', () => {
    it('should create tenant successfully', async () => {
      const newTenant = {
        tenantId: `test_${Date.now()}`,
        companyName: `test_e2e_company_${Date.now()}`,
        contactName: 'Test Contact',
        contactPhone: '13800138000',
        status: 'NORMAL',
        packageId: 1,
        expireTime: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1年后
        accountCount: 100,
        remark: 'E2E Test Tenant',
      };

      const response = await request(app.getHttpServer())
        .post(`${prefix}/system/tenant`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(newTenant)
        .expect(200);

      expect(response.body.code).toBe(200);
    });

    it('should fail with duplicate tenant id', async () => {
      const tenantId = `test_dup_${Date.now()}`;

      // 创建第一个租户
      await request(app.getHttpServer())
        .post(`${prefix}/system/tenant`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          tenantId,
          companyName: `test_e2e_company1_${Date.now()}`,
          contactName: 'Test Contact 1',
          status: 'NORMAL',
          packageId: 1,
        })
        .expect(200);

      // 尝试创建相同 tenantId 的租户
      const response = await request(app.getHttpServer())
        .post(`${prefix}/system/tenant`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          tenantId,
          companyName: `test_e2e_company2_${Date.now()}`,
          contactName: 'Test Contact 2',
          status: 'NORMAL',
          packageId: 1,
        })
        .expect(200);

      expect(response.body.code).not.toBe(200);
    });

    it('should fail with missing required fields', async () => {
      const response = await request(app.getHttpServer())
        .post(`${prefix}/system/tenant`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          tenantId: `test_invalid_${Date.now()}`,
          // missing companyName
        })
        .expect(400);

      expect(response.body.code).not.toBe(200);
    });
  });

  describe('/system/tenant/:id (GET) - 获取租户详情', () => {
    let testTenantId: string;

    beforeAll(async () => {
      testTenantId = `test_detail_${Date.now()}`;
      await prisma.sysTenant.create({
        data: {
          tenantId: testTenantId,
          companyName: `test_e2e_detail_company_${Date.now()}`,
          contactName: 'Detail Contact',
          contactPhone: '13800138000',
          status: 'NORMAL',
          packageId: 1,
          createBy: 'test',
          updateBy: 'test',
        },
      });
    });

    it('should return tenant detail', async () => {
      const response = await request(app.getHttpServer())
        .get(`${prefix}/system/tenant/${testTenantId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.code).toBe(200);
      expect(response.body.data).toHaveProperty('tenantId');
      expect(response.body.data.tenantId).toBe(testTenantId);
    });

    it('should fail with invalid tenant id', async () => {
      const response = await request(app.getHttpServer())
        .get(`${prefix}/system/tenant/non_existent_tenant`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.code).not.toBe(200);
    });
  });

  describe('/system/tenant (PUT) - 更新租户', () => {
    let testTenantId: string;

    beforeAll(async () => {
      testTenantId = `test_update_${Date.now()}`;
      await prisma.sysTenant.create({
        data: {
          tenantId: testTenantId,
          companyName: `test_e2e_update_company_${Date.now()}`,
          contactName: 'Original Contact',
          contactPhone: '13800138000',
          status: 'NORMAL',
          packageId: 1,
          createBy: 'test',
          updateBy: 'test',
        },
      });
    });

    it('should update tenant successfully', async () => {
      const response = await request(app.getHttpServer())
        .put(`${prefix}/system/tenant`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          tenantId: testTenantId,
          companyName: `test_e2e_updated_company_${Date.now()}`,
          contactName: 'Updated Contact',
          contactPhone: '13900139000',
        })
        .expect(200);

      expect(response.body.code).toBe(200);

      // 验证更新是否成功
      const verifyResponse = await request(app.getHttpServer())
        .get(`${prefix}/system/tenant/${testTenantId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(verifyResponse.body.data.contactName).toBe('Updated Contact');
    });

    it('should fail with invalid tenant id', async () => {
      const response = await request(app.getHttpServer())
        .put(`${prefix}/system/tenant`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          tenantId: 'non_existent_tenant',
          companyName: 'Updated Company',
        })
        .expect(200);

      expect(response.body.code).not.toBe(200);
    });
  });

  describe('/system/tenant/:id (DELETE) - 删除租户', () => {
    it('should delete tenant successfully', async () => {
      const testTenantId = `test_delete_${Date.now()}`;
      await prisma.sysTenant.create({
        data: {
          tenantId: testTenantId,
          companyName: `test_e2e_delete_company_${Date.now()}`,
          contactName: 'Delete Contact',
          status: 'NORMAL',
          packageId: 1,
          createBy: 'test',
          updateBy: 'test',
        },
      });

      const response = await request(app.getHttpServer())
        .delete(`${prefix}/system/tenant/${testTenantId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.code).toBe(200);

      // 验证租户是否被删除
      const verifyResponse = await request(app.getHttpServer())
        .get(`${prefix}/system/tenant/${testTenantId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(verifyResponse.body.code).not.toBe(200);
    });

    it('should not delete default tenant', async () => {
      const response = await request(app.getHttpServer())
        .delete(`${prefix}/system/tenant/000000`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.code).not.toBe(200);
      expect(response.body.msg).toContain('默认');
    });

    it('should fail with invalid tenant id', async () => {
      const response = await request(app.getHttpServer())
        .delete(`${prefix}/system/tenant/non_existent_tenant`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.code).not.toBe(200);
    });
  });

  describe('租户隔离测试', () => {
    let tenant1Id: string;
    let tenant2Id: string;
    let tenant1UserId: number;
    let tenant2UserId: number;

    beforeAll(async () => {
      // 创建两个测试租户
      tenant1Id = `test_iso1_${Date.now()}`;
      tenant2Id = `test_iso2_${Date.now()}`;

      await prisma.sysTenant.create({
        data: {
          tenantId: tenant1Id,
          companyName: `test_e2e_iso_company1_${Date.now()}`,
          contactName: 'Isolation Contact 1',
          status: 'NORMAL',
          packageId: 1,
          createBy: 'test',
          updateBy: 'test',
        },
      });

      await prisma.sysTenant.create({
        data: {
          tenantId: tenant2Id,
          companyName: `test_e2e_iso_company2_${Date.now()}`,
          contactName: 'Isolation Contact 2',
          status: 'NORMAL',
          packageId: 1,
          createBy: 'test',
          updateBy: 'test',
        },
      });

      // 在每个租户下创建用户
      const user1 = await prisma.sysUser.create({
        data: {
          tenantId: tenant1Id,
          userName: `test_iso_user1_${Date.now()}`,
          nickName: 'Isolation User 1',
          password: 'hashed_password',
          userType: '99',
          deptId: 100,
          status: 'NORMAL',
          delFlag: 'NORMAL',
          createBy: 'test',
          updateBy: 'test',
        },
      });
      tenant1UserId = user1.userId;

      const user2 = await prisma.sysUser.create({
        data: {
          tenantId: tenant2Id,
          userName: `test_iso_user2_${Date.now()}`,
          nickName: 'Isolation User 2',
          password: 'hashed_password',
          userType: '99',
          deptId: 100,
          status: 'NORMAL',
          delFlag: 'NORMAL',
          createBy: 'test',
          updateBy: 'test',
        },
      });
      tenant2UserId = user2.userId;
    });

    it('should isolate data between tenants', async () => {
      // 使用租户1的上下文查询用户
      const response1 = await request(app.getHttpServer())
        .get(`${prefix}/system/user/list`)
        .set('Authorization', `Bearer ${authToken}`)
        .set('tenant-id', tenant1Id)
        .expect(200);

      // 使用租户2的上下文查询用户
      const response2 = await request(app.getHttpServer())
        .get(`${prefix}/system/user/list`)
        .set('Authorization', `Bearer ${authToken}`)
        .set('tenant-id', tenant2Id)
        .expect(200);

      // 验证租户1看不到租户2的用户
      const tenant1UserIds = response1.body.data.list.map((u: any) => u.userId);
      expect(tenant1UserIds).not.toContain(tenant2UserId);

      // 验证租户2看不到租户1的用户
      const tenant2UserIds = response2.body.data.list.map((u: any) => u.userId);
      expect(tenant2UserIds).not.toContain(tenant1UserId);
    });

    it('should prevent cross-tenant data access', async () => {
      // 尝试在租户1的上下文中访问租户2的用户
      const response = await request(app.getHttpServer())
        .get(`${prefix}/system/user/${tenant2UserId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .set('tenant-id', tenant1Id)
        .expect(200);

      // 应该返回错误或找不到
      expect(response.body.code).not.toBe(200);
    });
  });

  describe('租户切换测试', () => {
    let testTenant1Id: string;
    let testTenant2Id: string;

    beforeAll(async () => {
      testTenant1Id = `test_switch1_${Date.now()}`;
      testTenant2Id = `test_switch2_${Date.now()}`;

      await prisma.sysTenant.create({
        data: {
          tenantId: testTenant1Id,
          companyName: `test_e2e_switch_company1_${Date.now()}`,
          contactName: 'Switch Contact 1',
          status: 'NORMAL',
          packageId: 1,
          createBy: 'test',
          updateBy: 'test',
        },
      });

      await prisma.sysTenant.create({
        data: {
          tenantId: testTenant2Id,
          companyName: `test_e2e_switch_company2_${Date.now()}`,
          contactName: 'Switch Contact 2',
          status: 'NORMAL',
          packageId: 1,
          createBy: 'test',
          updateBy: 'test',
        },
      });
    });

    it('should switch tenant context via header', async () => {
      // 使用租户1的上下文
      const response1 = await request(app.getHttpServer())
        .get(`${prefix}/system/tenant/${testTenant1Id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .set('tenant-id', testTenant1Id)
        .expect(200);

      expect(response1.body.code).toBe(200);
      expect(response1.body.data.tenantId).toBe(testTenant1Id);

      // 切换到租户2的上下文
      const response2 = await request(app.getHttpServer())
        .get(`${prefix}/system/tenant/${testTenant2Id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .set('tenant-id', testTenant2Id)
        .expect(200);

      expect(response2.body.code).toBe(200);
      expect(response2.body.data.tenantId).toBe(testTenant2Id);
    });

    it('should use default tenant when no tenant-id header', async () => {
      const response = await request(app.getHttpServer())
        .get(`${prefix}/system/tenant/000000`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.code).toBe(200);
      expect(response.body.data.tenantId).toBe('000000');
    });
  });

  describe('租户状态管理', () => {
    let testTenantId: string;

    beforeAll(async () => {
      testTenantId = `test_status_${Date.now()}`;
      await prisma.sysTenant.create({
        data: {
          tenantId: testTenantId,
          companyName: `test_e2e_status_company_${Date.now()}`,
          contactName: 'Status Contact',
          status: 'NORMAL',
          packageId: 1,
          createBy: 'test',
          updateBy: 'test',
        },
      });
    });

    it('should disable tenant', async () => {
      const response = await request(app.getHttpServer())
        .put(`${prefix}/system/tenant`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          tenantId: testTenantId,
          status: 'DISABLE',
        })
        .expect(200);

      expect(response.body.code).toBe(200);

      // 验证状态是否更改
      const verifyResponse = await request(app.getHttpServer())
        .get(`${prefix}/system/tenant/${testTenantId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(verifyResponse.body.data.status).toBe('DISABLE');
    });

    it('should prevent login for disabled tenant', async () => {
      // 创建禁用租户下的用户
      const disabledTenantId = `test_disabled_${Date.now()}`;
      await prisma.sysTenant.create({
        data: {
          tenantId: disabledTenantId,
          companyName: `test_e2e_disabled_company_${Date.now()}`,
          contactName: 'Disabled Contact',
          status: 'DISABLE',
          packageId: 1,
          createBy: 'test',
          updateBy: 'test',
        },
      });

      const testUser = await createTestUser(app, {
        userName: `test_disabled_user_${Date.now()}`,
        password: 'Test123456!',
        deptId: 100,
      });

      // 更新用户的租户ID
      await prisma.sysUser.update({
        where: { userId: testUser.userId },
        data: { tenantId: disabledTenantId },
      });

      // 尝试登录
      const loginResponse = await request(app.getHttpServer())
        .post(`${prefix}/auth/login`)
        .set('tenant-id', disabledTenantId)
        .send({
          username: testUser.userName,
          password: 'Test123456!',
          clientId: 'pc',
        })
        .expect(200);

      // 应该登录失败
      expect(loginResponse.body.code).not.toBe(200);
    });
  });
});
