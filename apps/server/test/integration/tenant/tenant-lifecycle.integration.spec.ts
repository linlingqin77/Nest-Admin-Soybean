/**
 * 租户生命周期集成测试
 *
 * @description
 * 测试租户从创建到初始化的完整流程，包括：
 * - 租户创建和初始化
 * - 租户状态变更
 * - 租户过期处理
 *
 * _Requirements: 12.1_
 */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe, VersioningType } from '@nestjs/common';
import { AppModule } from 'src/app.modules';
import { PrismaService } from 'src/platform/prisma';
import { TenantService } from 'src/modules/tenants/tenant.service';
import { TenantLifecycleService } from 'src/core/tenancy/services/tenant-lifecycle.service';
import { DelFlagEnum, StatusEnum } from 'src/shared/enums/index';

function uniqueId(): string {
  return Math.random().toString(36).substring(2, 8);
}

describe('Tenant Lifecycle Integration Tests', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let tenantService: TenantService;
  let tenantLifecycleService: TenantLifecycleService;

  const createdTenantIds: number[] = [];
  const createdUserIds: number[] = [];

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
        transformOptions: { enableImplicitConversion: true },
      }),
    );

    await app.init();

    prisma = app.get(PrismaService);
    tenantService = app.get(TenantService);
    tenantLifecycleService = app.get(TenantLifecycleService);
  }, 60000);

  afterAll(async () => {
    try {
      if (createdUserIds.length > 0) {
        await prisma.sysUser.deleteMany({
          where: { userId: { in: createdUserIds } },
        });
      }
      if (createdTenantIds.length > 0) {
        await prisma.sysTenant.deleteMany({
          where: { id: { in: createdTenantIds } },
        });
      }
    } catch (error) {
      console.error('Cleanup error:', error);
    }
    await app.close();
  });

  describe('Tenant Creation and Initialization', () => {
    it('should create tenant with auto-generated tenantId', async () => {
      const uid = uniqueId();
      const companyName = `LifeCo${uid}`;

      const createResult = await tenantService.create({
        companyName,
        contactUserName: '生命周期测试',
        contactPhone: '13800138000',
        username: `lc${uid}`,
        password: 'Test123456',
        status: StatusEnum.NORMAL,
      });

      expect(createResult.code).toBe(200);

      const tenant = await prisma.sysTenant.findFirst({
        where: { companyName },
      });

      expect(tenant).toBeDefined();
      expect(tenant!.tenantId).toBeDefined();
      expect(tenant!.tenantId.length).toBe(6);
      expect(tenant!.status).toBe(StatusEnum.NORMAL);
      expect(tenant!.delFlag).toBe(DelFlagEnum.NORMAL);

      createdTenantIds.push(tenant!.id);

      // 验证管理员用户已创建
      const adminUser = await prisma.sysUser.findFirst({
        where: { tenantId: tenant!.tenantId },
      });
      expect(adminUser).toBeDefined();
      expect(adminUser!.userName).toBe(`lc${uid}`);
      createdUserIds.push(adminUser!.userId);
    });

    it('should create tenant with expiration date', async () => {
      const uid = uniqueId();
      const companyName = `ExpCo${uid}`;
      const expireTime = new Date();
      expireTime.setMonth(expireTime.getMonth() + 1); // 1个月后过期

      const createResult = await tenantService.create({
        companyName,
        contactUserName: '过期测试',
        contactPhone: '13900139000',
        username: `ec${uid}`,
        password: 'Test123456',
        expireTime,
      });

      expect(createResult.code).toBe(200);

      const tenant = await prisma.sysTenant.findFirst({
        where: { companyName },
      });

      expect(tenant).toBeDefined();
      expect(tenant!.expireTime).toBeDefined();
      createdTenantIds.push(tenant!.id);

      const adminUser = await prisma.sysUser.findFirst({
        where: { tenantId: tenant!.tenantId },
      });
      if (adminUser) {
        createdUserIds.push(adminUser.userId);
      }
    });

    it('should create tenant with quota settings', async () => {
      const uid = uniqueId();
      const companyName = `QuotaCo${uid}`;

      const createResult = await tenantService.create({
        companyName,
        contactUserName: '配额测试',
        contactPhone: '13700137000',
        username: `qc${uid}`,
        password: 'Test123456',
        accountCount: 50,
      });

      expect(createResult.code).toBe(200);

      const tenant = await prisma.sysTenant.findFirst({
        where: { companyName },
      });

      expect(tenant).toBeDefined();
      expect(tenant!.accountCount).toBe(50);
      createdTenantIds.push(tenant!.id);

      const adminUser = await prisma.sysUser.findFirst({
        where: { tenantId: tenant!.tenantId },
      });
      if (adminUser) {
        createdUserIds.push(adminUser.userId);
      }
    });
  });

  describe('Tenant Status Management', () => {
    it('should change tenant status to disabled', async () => {
      const uid = uniqueId();
      const companyName = `StatusCo${uid}`;

      await tenantService.create({
        companyName,
        contactUserName: '状态测试',
        contactPhone: '13600136000',
        username: `sc${uid}`,
        password: 'Test123456',
        status: StatusEnum.NORMAL,
      });

      const tenant = await prisma.sysTenant.findFirst({
        where: { companyName },
      });

      expect(tenant).toBeDefined();
      createdTenantIds.push(tenant!.id);

      const adminUser = await prisma.sysUser.findFirst({
        where: { tenantId: tenant!.tenantId },
      });
      if (adminUser) {
        createdUserIds.push(adminUser.userId);
      }

      // 禁用租户
      const updateResult = await tenantService.update({
        id: tenant!.id,
        tenantId: tenant!.tenantId,
        status: StatusEnum.STOP,
      });

      expect(updateResult.code).toBe(200);

      const updatedTenant = await prisma.sysTenant.findUnique({
        where: { id: tenant!.id },
      });

      expect(updatedTenant!.status).toBe(StatusEnum.STOP);
    });

    it('should re-enable disabled tenant', async () => {
      const uid = uniqueId();
      const companyName = `ReEnCo${uid}`;

      await tenantService.create({
        companyName,
        contactUserName: '重启测试',
        contactPhone: '13500135000',
        username: `re${uid}`,
        password: 'Test123456',
        status: StatusEnum.STOP,
      });

      const tenant = await prisma.sysTenant.findFirst({
        where: { companyName },
      });

      expect(tenant).toBeDefined();
      createdTenantIds.push(tenant!.id);

      const adminUser = await prisma.sysUser.findFirst({
        where: { tenantId: tenant!.tenantId },
      });
      if (adminUser) {
        createdUserIds.push(adminUser.userId);
      }

      // 启用租户
      const updateResult = await tenantService.update({
        id: tenant!.id,
        tenantId: tenant!.tenantId,
        status: StatusEnum.NORMAL,
      });

      expect(updateResult.code).toBe(200);

      const updatedTenant = await prisma.sysTenant.findUnique({
        where: { id: tenant!.id },
      });

      expect(updatedTenant!.status).toBe(StatusEnum.NORMAL);
    });
  });

  describe('Tenant Availability Check', () => {
    it('should check tenant availability for normal tenant', async () => {
      const uid = uniqueId();
      const companyName = `AvailCo${uid}`;

      await tenantService.create({
        companyName,
        contactUserName: '可用性测试',
        contactPhone: '13400134000',
        username: `av${uid}`,
        password: 'Test123456',
        status: StatusEnum.NORMAL,
      });

      const tenant = await prisma.sysTenant.findFirst({
        where: { companyName },
      });

      expect(tenant).toBeDefined();
      createdTenantIds.push(tenant!.id);

      const adminUser = await prisma.sysUser.findFirst({
        where: { tenantId: tenant!.tenantId },
      });
      if (adminUser) {
        createdUserIds.push(adminUser.userId);
      }

      const isAvailable = await tenantLifecycleService.isTenantAvailable(tenant!.tenantId);
      expect(isAvailable).toBe(true);
    });

    it('should return false for disabled tenant', async () => {
      const uid = uniqueId();
      const companyName = `DisCo${uid}`;

      await tenantService.create({
        companyName,
        contactUserName: '禁用测试',
        contactPhone: '13300133000',
        username: `di${uid}`,
        password: 'Test123456',
        status: StatusEnum.STOP,
      });

      const tenant = await prisma.sysTenant.findFirst({
        where: { companyName },
      });

      expect(tenant).toBeDefined();
      createdTenantIds.push(tenant!.id);

      const adminUser = await prisma.sysUser.findFirst({
        where: { tenantId: tenant!.tenantId },
      });
      if (adminUser) {
        createdUserIds.push(adminUser.userId);
      }

      const isAvailable = await tenantLifecycleService.isTenantAvailable(tenant!.tenantId);
      expect(isAvailable).toBe(false);
    });

    it('should return false for expired tenant', async () => {
      const uid = uniqueId();
      const companyName = `ExpiredCo${uid}`;
      const expireTime = new Date();
      expireTime.setDate(expireTime.getDate() - 1); // 昨天过期

      await tenantService.create({
        companyName,
        contactUserName: '已过期测试',
        contactPhone: '13200132000',
        username: `ex${uid}`,
        password: 'Test123456',
        expireTime,
      });

      const tenant = await prisma.sysTenant.findFirst({
        where: { companyName },
      });

      expect(tenant).toBeDefined();
      createdTenantIds.push(tenant!.id);

      const adminUser = await prisma.sysUser.findFirst({
        where: { tenantId: tenant!.tenantId },
      });
      if (adminUser) {
        createdUserIds.push(adminUser.userId);
      }

      const isAvailable = await tenantLifecycleService.isTenantAvailable(tenant!.tenantId);
      expect(isAvailable).toBe(false);
    });
  });

  describe('Tenant Soft Delete', () => {
    it('should soft delete tenant and mark as deleted', async () => {
      const uid = uniqueId();
      const companyName = `DelCo${uid}`;

      await tenantService.create({
        companyName,
        contactUserName: '删除测试',
        contactPhone: '13100131000',
        username: `dl${uid}`,
        password: 'Test123456',
      });

      const tenant = await prisma.sysTenant.findFirst({
        where: { companyName },
      });

      expect(tenant).toBeDefined();
      createdTenantIds.push(tenant!.id);

      const adminUser = await prisma.sysUser.findFirst({
        where: { tenantId: tenant!.tenantId },
      });
      if (adminUser) {
        createdUserIds.push(adminUser.userId);
      }

      const deleteResult = await tenantService.remove([tenant!.id]);
      expect(deleteResult.code).toBe(200);

      const deletedTenant = await prisma.sysTenant.findUnique({
        where: { id: tenant!.id },
      });

      expect(deletedTenant!.delFlag).toBe('1');
    });

    it('should not return deleted tenant in queries', async () => {
      const uid = uniqueId();
      const companyName = `HiddenCo${uid}`;

      await tenantService.create({
        companyName,
        contactUserName: '隐藏测试',
        contactPhone: '13000130000',
        username: `hd${uid}`,
        password: 'Test123456',
      });

      const tenant = await prisma.sysTenant.findFirst({
        where: { companyName },
      });

      expect(tenant).toBeDefined();
      createdTenantIds.push(tenant!.id);

      const adminUser = await prisma.sysUser.findFirst({
        where: { tenantId: tenant!.tenantId },
      });
      if (adminUser) {
        createdUserIds.push(adminUser.userId);
      }

      // 删除租户
      await tenantService.remove([tenant!.id]);

      // 查询应该不返回已删除的租户
      const result = await tenantService.findAll({
        pageNum: 1,
        pageSize: 100,
        companyName,
      } as any);

      expect(result.code).toBe(200);
      expect(result.data.rows.length).toBe(0);
    });
  });
});
