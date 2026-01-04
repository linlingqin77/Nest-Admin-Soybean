/**
 * 租户管理模块E2E测试
 *
 * @description
 * 测试租户管理相关的所有API端点
 * - GET /api/v1/system/tenant/list 租户列表
 * - POST /api/v1/system/tenant 创建租户
 * - GET /api/v1/system/tenant/:id 查询租户
 * - PUT /api/v1/system/tenant 更新租户
 * - DELETE /api/v1/system/tenant/:ids 删除租户
 * - GET /api/v1/system/tenant/syncTenantPackage 同步套餐
 * - GET /api/v1/system/tenant/package/list 套餐列表
 * - POST /api/v1/system/tenant/package 创建套餐
 * - PUT /api/v1/system/tenant/package 更新套餐
 *
 * _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5, 12.6, 12.7, 12.8, 12.9_
 */

import { TestHelper } from '../helpers/test-helper';
import { PrismaService } from 'src/prisma/prisma.service';
import { DelFlagEnum } from 'src/common/enum/index';

describe('Tenant E2E Tests', () => {
  let helper: TestHelper;
  let prisma: PrismaService;
  const apiPrefix = '/api/v1';
  let token: string;

  const createdTenantIds: number[] = [];
  const createdPackageIds: number[] = [];
  const createdUserIds: number[] = [];

  function uid(): string {
    return Math.random().toString(36).substring(2, 8);
  }

  beforeAll(async () => {
    helper = new TestHelper();
    await helper.init();
    prisma = helper.getPrisma();
    token = await helper.login();
  }, 60000);

  afterAll(async () => {
    try {
      if (createdUserIds.length > 0) {
        await prisma.sysUserRole.deleteMany({ where: { userId: { in: createdUserIds } } });
        await prisma.sysUserPost.deleteMany({ where: { userId: { in: createdUserIds } } });
        await prisma.sysUser.deleteMany({ where: { userId: { in: createdUserIds } } });
      }
      if (createdTenantIds.length > 0) {
        await prisma.sysTenant.deleteMany({ where: { id: { in: createdTenantIds } } });
      }
      if (createdPackageIds.length > 0) {
        await prisma.sysTenantPackage.deleteMany({ where: { packageId: { in: createdPackageIds } } });
      }
    } catch (error) {
      console.error('Cleanup error:', error);
    }
    await helper.cleanup();
    await helper.close();
  });

  describe('GET /system/tenant/list - 租户列表', () => {
    it('should return paginated tenant list', async () => {
      const response = await helper
        .getAuthRequest()
        .get(`${apiPrefix}/system/tenant/list`)
        .query({ pageNum: 1, pageSize: 10 })
        .set('Authorization', `Bearer ${token}`)
        .set('tenant-id', '000000')
        .expect(200);

      expect(response.body.code).toBe(200);
      expect(response.body.data).toHaveProperty('rows');
      expect(response.body.data).toHaveProperty('total');
      expect(Array.isArray(response.body.data.rows)).toBe(true);
    });

    it('should filter tenants by companyName', async () => {
      const response = await helper
        .getAuthRequest()
        .get(`${apiPrefix}/system/tenant/list`)
        .query({ pageNum: 1, pageSize: 10, companyName: '测试' })
        .set('Authorization', `Bearer ${token}`)
        .set('tenant-id', '000000')
        .expect(200);

      expect(response.body.code).toBe(200);
    });

    it('should fail without authentication', async () => {
      const response = await helper
        .getRequest()
        .get(`${apiPrefix}/system/tenant/list`)
        .query({ pageNum: 1, pageSize: 10 });

      expect([401, 403]).toContain(response.status);
    });
  });

  describe('POST /system/tenant - 创建租户', () => {
    it('should create tenant successfully', async () => {
      const id = uid();
      const tenantData = {
        companyName: `E2ECo${id}`,
        contactUserName: 'E2E测试',
        contactPhone: '13800138000',
        username: `ea${id}`,
        password: 'Test123456',
      };

      const response = await helper
        .getAuthRequest()
        .post(`${apiPrefix}/system/tenant`)
        .set('Authorization', `Bearer ${token}`)
        .set('tenant-id', '000000')
        .send(tenantData)
        .expect(201);

      expect(response.body.code).toBe(200);

      const tenant = await prisma.sysTenant.findFirst({
        where: { companyName: tenantData.companyName },
      });
      if (tenant) {
        createdTenantIds.push(tenant.id);
        const adminUser = await prisma.sysUser.findFirst({
          where: { tenantId: tenant.tenantId },
        });
        if (adminUser) {
          createdUserIds.push(adminUser.userId);
        }
      }
    });

    it('should fail without authentication', async () => {
      const response = await helper
        .getRequest()
        .post(`${apiPrefix}/system/tenant`)
        .send({
          companyName: 'NoAuth',
          contactUserName: '无认证',
          username: 'noauth',
          password: 'Test123456',
        });

      expect([401, 403]).toContain(response.status);
    });
  });

  describe('GET /system/tenant/:id - 查询租户', () => {
    it('should return tenant detail by ID', async () => {
      const tenant = await prisma.sysTenant.findFirst({
        where: { delFlag: '0' },
      });

      if (!tenant) {
        console.log('Skipping test: No tenant found');
        return;
      }

      const response = await helper
        .getAuthRequest()
        .get(`${apiPrefix}/system/tenant/${tenant.id}`)
        .set('Authorization', `Bearer ${token}`)
        .set('tenant-id', '000000')
        .expect(200);

      expect(response.body.code).toBe(200);
      expect(response.body.data.id).toBe(tenant.id);
    });

    it('should fail without authentication', async () => {
      const response = await helper
        .getRequest()
        .get(`${apiPrefix}/system/tenant/1`);

      expect([401, 403]).toContain(response.status);
    });
  });

  describe('PUT /system/tenant - 更新租户', () => {
    let testTenantId: number;
    let testTenantTenantId: string;

    beforeAll(async () => {
      const id = uid();
      const tenant = await prisma.sysTenant.create({
        data: {
          tenantId: `T${id}`.substring(0, 6),
          companyName: `UpdCo${id}`,
          contactUserName: '更新测试',
          contactPhone: '13700137000',
          status: '0',
          delFlag: '0',
          createBy: 'test',
          updateBy: 'test',
        },
      });
      testTenantId = tenant.id;
      testTenantTenantId = tenant.tenantId;
      createdTenantIds.push(testTenantId);
    });

    it('should update tenant successfully', async () => {
      const response = await helper
        .getAuthRequest()
        .put(`${apiPrefix}/system/tenant`)
        .set('Authorization', `Bearer ${token}`)
        .set('tenant-id', '000000')
        .send({
          id: testTenantId,
          tenantId: testTenantTenantId,
          contactUserName: '更新后联系人',
        })
        .expect(200);

      expect(response.body.code).toBe(200);

      const updated = await prisma.sysTenant.findUnique({
        where: { id: testTenantId },
      });
      expect(updated?.contactUserName).toBe('更新后联系人');
    });

    it('should fail without authentication', async () => {
      const response = await helper
        .getRequest()
        .put(`${apiPrefix}/system/tenant`)
        .send({
          id: testTenantId,
          tenantId: testTenantTenantId,
          contactUserName: '无认证更新',
        });

      expect([401, 403]).toContain(response.status);
    });
  });

  describe('DELETE /system/tenant/:ids - 删除租户', () => {
    let deleteTenantId: number;

    beforeAll(async () => {
      const id = uid();
      const tenant = await prisma.sysTenant.create({
        data: {
          tenantId: `D${id}`.substring(0, 6),
          companyName: `DelCo${id}`,
          contactUserName: '删除测试',
          contactPhone: '13600136000',
          status: '0',
          delFlag: '0',
          createBy: 'test',
          updateBy: 'test',
        },
      });
      deleteTenantId = tenant.id;
    });

    it('should delete tenant successfully (soft delete)', async () => {
      const response = await helper
        .getAuthRequest()
        .delete(`${apiPrefix}/system/tenant/${deleteTenantId}`)
        .set('Authorization', `Bearer ${token}`)
        .set('tenant-id', '000000')
        .expect(200);

      expect(response.body.code).toBe(200);

      const deleted = await prisma.sysTenant.findUnique({
        where: { id: deleteTenantId },
      });
      expect(deleted?.delFlag).toBe(DelFlagEnum.DELETE);
    });

    it('should fail without authentication', async () => {
      const response = await helper
        .getRequest()
        .delete(`${apiPrefix}/system/tenant/999`);

      expect([401, 403]).toContain(response.status);
    });
  });

  describe('GET /system/tenant/syncTenantPackage - 同步套餐', () => {
    it('should sync package to tenant', async () => {
      const id = uid();

      const pkg = await prisma.sysTenantPackage.create({
        data: {
          packageName: `SyncPkg${id}`,
          menuIds: '1,2,3',
          status: '0',
          delFlag: '0',
          createBy: 'test',
          updateBy: 'test',
        },
      });
      createdPackageIds.push(pkg.packageId);

      const tenant = await prisma.sysTenant.create({
        data: {
          tenantId: `S${id}`.substring(0, 6),
          companyName: `SyncCo${id}`,
          contactUserName: '同步测试',
          contactPhone: '13500135000',
          status: '0',
          delFlag: '0',
          createBy: 'test',
          updateBy: 'test',
        },
      });
      createdTenantIds.push(tenant.id);

      const response = await helper
        .getAuthRequest()
        .get(`${apiPrefix}/system/tenant/syncTenantPackage`)
        .query({ tenantId: tenant.tenantId, packageId: pkg.packageId })
        .set('Authorization', `Bearer ${token}`)
        .set('tenant-id', '000000')
        .expect(200);

      expect(response.body.code).toBe(200);
    });

    it('should fail without authentication', async () => {
      const response = await helper
        .getRequest()
        .get(`${apiPrefix}/system/tenant/syncTenantPackage`)
        .query({ tenantId: '000000', packageId: 1 });

      expect([401, 403]).toContain(response.status);
    });
  });

  describe('GET /system/tenant/package/list - 套餐列表', () => {
    it('should return paginated package list', async () => {
      const response = await helper
        .getAuthRequest()
        .get(`${apiPrefix}/system/tenant/package/list`)
        .query({ pageNum: 1, pageSize: 10 })
        .set('Authorization', `Bearer ${token}`)
        .set('tenant-id', '000000')
        .expect(200);

      expect(response.body.code).toBe(200);
      expect(response.body.data).toHaveProperty('rows');
      expect(response.body.data).toHaveProperty('total');
    });

    it('should fail without authentication', async () => {
      const response = await helper
        .getRequest()
        .get(`${apiPrefix}/system/tenant/package/list`)
        .query({ pageNum: 1, pageSize: 10 });

      expect([401, 403]).toContain(response.status);
    });
  });

  describe('POST /system/tenant/package - 创建套餐', () => {
    it('should create package successfully', async () => {
      const id = uid();
      const packageData = {
        packageName: `E2EPkg${id}`,
        menuIds: [1, 2, 3],
        status: '0',
      };

      const response = await helper
        .getAuthRequest()
        .post(`${apiPrefix}/system/tenant/package`)
        .set('Authorization', `Bearer ${token}`)
        .set('tenant-id', '000000')
        .send(packageData)
        .expect(201);

      expect(response.body.code).toBe(200);

      const pkg = await prisma.sysTenantPackage.findFirst({
        where: { packageName: packageData.packageName },
      });
      if (pkg) {
        createdPackageIds.push(pkg.packageId);
      }
    });

    it('should fail without authentication', async () => {
      const response = await helper
        .getRequest()
        .post(`${apiPrefix}/system/tenant/package`)
        .send({
          packageName: 'NoAuth',
          menuIds: [1],
        });

      expect([401, 403]).toContain(response.status);
    });
  });

  describe('PUT /system/tenant/package - 更新套餐', () => {
    let testPackageId: number;

    beforeAll(async () => {
      const id = uid();
      const pkg = await prisma.sysTenantPackage.create({
        data: {
          packageName: `UpdPkg${id}`,
          menuIds: '1,2,3',
          status: '0',
          delFlag: '0',
          createBy: 'test',
          updateBy: 'test',
        },
      });
      testPackageId = pkg.packageId;
      createdPackageIds.push(testPackageId);
    });

    it('should update package successfully', async () => {
      const response = await helper
        .getAuthRequest()
        .put(`${apiPrefix}/system/tenant/package`)
        .set('Authorization', `Bearer ${token}`)
        .set('tenant-id', '000000')
        .send({
          packageId: testPackageId,
          menuIds: [1, 2, 3, 4, 5],
        })
        .expect(200);

      expect(response.body.code).toBe(200);

      const updated = await prisma.sysTenantPackage.findUnique({
        where: { packageId: testPackageId },
      });
      expect(updated?.menuIds).toBe('1,2,3,4,5');
    });

    it('should fail without authentication', async () => {
      const response = await helper
        .getRequest()
        .put(`${apiPrefix}/system/tenant/package`)
        .send({
          packageId: testPackageId,
          menuIds: [1],
        });

      expect([401, 403]).toContain(response.status);
    });
  });

  describe('GET /system/tenant/package/:id - 查询套餐', () => {
    it('should return package detail by ID', async () => {
      const pkg = await prisma.sysTenantPackage.findFirst({
        where: { delFlag: '0' },
      });

      if (!pkg) {
        console.log('Skipping test: No package found');
        return;
      }

      const response = await helper
        .getAuthRequest()
        .get(`${apiPrefix}/system/tenant/package/${pkg.packageId}`)
        .set('Authorization', `Bearer ${token}`)
        .set('tenant-id', '000000')
        .expect(200);

      expect(response.body.code).toBe(200);
      expect(response.body.data.packageId).toBe(pkg.packageId);
    });
  });

  describe('GET /system/tenant/package/selectList - 套餐选择列表', () => {
    it('should return package select list', async () => {
      const response = await helper
        .getAuthRequest()
        .get(`${apiPrefix}/system/tenant/package/selectList`)
        .set('Authorization', `Bearer ${token}`)
        .set('tenant-id', '000000')
        .expect(200);

      expect(response.body.code).toBe(200);
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });
});
