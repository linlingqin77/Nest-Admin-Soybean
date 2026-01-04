/**
 * 租户模块集成测试
 *
 * @description
 * 测试租户模块的完整流程，包括：
 * - 租户数据隔离
 * - 套餐同步
 *
 * _Requirements: 12.6_
 */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe, VersioningType } from '@nestjs/common';
import { AppModule } from 'src/app.module';
import { PrismaService } from 'src/prisma/prisma.service';
import { TenantService } from 'src/module/system/tenant/tenant.service';
import { TenantPackageService } from 'src/module/system/tenant-package/tenant-package.service';
import { DelFlagEnum, StatusEnum } from 'src/common/enum/index';
import { ListTenantDto } from 'src/module/system/tenant/dto/list-tenant.dto';
import { ListTenantPackageDto } from 'src/module/system/tenant-package/dto/list-tenant-package.dto';

function createListTenantDto(params: Partial<ListTenantDto> = {}): ListTenantDto {
  const dto = new ListTenantDto();
  Object.assign(dto, params);
  return dto;
}

function createListTenantPackageDto(params: Partial<ListTenantPackageDto> = {}): ListTenantPackageDto {
  const dto = new ListTenantPackageDto();
  Object.assign(dto, params);
  return dto;
}

function uniqueId(): string {
  return Math.random().toString(36).substring(2, 8);
}

describe('Tenant Integration Tests', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let tenantService: TenantService;
  let tenantPackageService: TenantPackageService;

  const createdTenantIds: number[] = [];
  const createdPackageIds: number[] = [];
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
    tenantPackageService = app.get(TenantPackageService);
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
      if (createdPackageIds.length > 0) {
        await prisma.sysTenantPackage.deleteMany({
          where: { packageId: { in: createdPackageIds } },
        });
      }
    } catch (error) {
      console.error('Cleanup error:', error);
    }
    await app.close();
  });

  describe('Tenant Data Isolation', () => {
    it('should only return non-deleted tenants in queries', async () => {
      const result = await tenantService.findAll(createListTenantDto({
        pageNum: 1,
        pageSize: 100,
      }));

      expect(result.code).toBe(200);
      expect(result.data.rows).toBeDefined();
      result.data.rows.forEach((tenant: any) => {
        expect(tenant.delFlag).toBe(DelFlagEnum.NORMAL);
      });
    });

    it('should filter tenants by company name', async () => {
      const uid = uniqueId();
      const companyName = `FilterCo${uid}`;

      const createResult = await tenantService.create({
        companyName,
        contactUserName: '筛选测试',
        contactPhone: '13800138000',
        username: `fa${uid}`,
        password: 'Test123456',
        status: StatusEnum.NORMAL,
      });

      expect(createResult.code).toBe(200);

      const tenant = await prisma.sysTenant.findFirst({
        where: { companyName },
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

      const result = await tenantService.findAll(createListTenantDto({
        pageNum: 1,
        pageSize: 10,
        companyName: companyName,
      }));

      expect(result.code).toBe(200);
      expect(result.data.rows.length).toBeGreaterThan(0);
    });
  });

  describe('Tenant CRUD Operations', () => {
    it('should create and retrieve tenant', async () => {
      const uid = uniqueId();
      const companyName = `CRUDCo${uid}`;

      const createResult = await tenantService.create({
        companyName,
        contactUserName: 'CRUD测试',
        contactPhone: '13600136000',
        username: `ca${uid}`,
        password: 'Test123456',
      });

      expect(createResult.code).toBe(200);

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

      const findResult = await tenantService.findOne(tenant!.id);
      expect(findResult.code).toBe(200);
      expect(findResult.data.companyName).toBe(companyName);
    });

    it('should create tenant with auto-generated tenantId', async () => {
      const uid = uniqueId();
      const companyName = `AutoCo${uid}`;

      const createResult = await tenantService.create({
        companyName,
        contactUserName: '自动ID测试',
        contactPhone: '13700137000',
        username: `aa${uid}`,
        password: 'Test123456',
      });

      expect(createResult.code).toBe(200);

      const tenant = await prisma.sysTenant.findFirst({
        where: { companyName },
      });

      expect(tenant).toBeDefined();
      expect(tenant!.tenantId).toBeDefined();
      expect(tenant!.tenantId.length).toBe(6);
      createdTenantIds.push(tenant!.id);

      const adminUser = await prisma.sysUser.findFirst({
        where: { tenantId: tenant!.tenantId },
      });
      if (adminUser) {
        createdUserIds.push(adminUser.userId);
      }
    });

    it('should update tenant information', async () => {
      const uid = uniqueId();
      const companyName = `UpdCo${uid}`;

      await tenantService.create({
        companyName,
        contactUserName: '更新测试',
        contactPhone: '13500135000',
        username: `ua${uid}`,
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

      const newContactName = '更新后联系人';
      const updateResult = await tenantService.update({
        id: tenant!.id,
        tenantId: tenant!.tenantId,
        contactUserName: newContactName,
      });

      expect(updateResult.code).toBe(200);

      const updatedTenant = await prisma.sysTenant.findUnique({
        where: { id: tenant!.id },
      });

      expect(updatedTenant!.contactUserName).toBe(newContactName);
    });

    it('should soft delete tenant', async () => {
      const uid = uniqueId();
      const companyName = `DelCo${uid}`;

      await tenantService.create({
        companyName,
        contactUserName: '删除测试',
        contactPhone: '13400134000',
        username: `da${uid}`,
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
  });

  describe('Tenant Package CRUD Operations', () => {
    it('should create and retrieve package', async () => {
      const uid = uniqueId();
      const packageName = `CRUDPkg${uid}`;

      const createResult = await tenantPackageService.create({
        packageName,
        menuIds: [1, 2],
        status: StatusEnum.NORMAL,
      });

      expect(createResult.code).toBe(200);

      const pkg = await prisma.sysTenantPackage.findFirst({
        where: { packageName },
      });

      expect(pkg).toBeDefined();
      createdPackageIds.push(pkg!.packageId);

      const findResult = await tenantPackageService.findOne(pkg!.packageId);
      expect(findResult.code).toBe(200);
      expect(findResult.data.packageName).toBe(packageName);
    });

    it('should list packages with pagination', async () => {
      const result = await tenantPackageService.findAll(createListTenantPackageDto({
        pageNum: 1,
        pageSize: 10,
      }));

      expect(result.code).toBe(200);
      expect(result.data.rows).toBeDefined();
      expect(Array.isArray(result.data.rows)).toBe(true);
      expect(typeof result.data.total).toBe('number');
    });

    it('should get select list for packages', async () => {
      const result = await tenantPackageService.selectList();

      expect(result.code).toBe(200);
      expect(Array.isArray(result.data)).toBe(true);

      result.data.forEach((item: any) => {
        expect(item).toHaveProperty('packageId');
        expect(item).toHaveProperty('packageName');
      });
    });

    it('should update package menuIds', async () => {
      const uid = uniqueId();
      const packageName = `UpdPkg${uid}`;

      await tenantPackageService.create({
        packageName,
        menuIds: [1, 2, 3],
        status: StatusEnum.NORMAL,
      });

      const pkg = await prisma.sysTenantPackage.findFirst({
        where: { packageName },
      });

      expect(pkg).toBeDefined();
      createdPackageIds.push(pkg!.packageId);

      const updateResult = await tenantPackageService.update({
        packageId: pkg!.packageId,
        menuIds: [1, 2, 3, 4, 5],
      });

      expect(updateResult.code).toBe(200);

      const updatedPkg = await prisma.sysTenantPackage.findUnique({
        where: { packageId: pkg!.packageId },
      });

      expect(updatedPkg!.menuIds).toBe('1,2,3,4,5');
    });
  });

  describe('Tenant Package Sync', () => {
    it('should sync package to tenant', async () => {
      const uid = uniqueId();

      const packageName = `SyncPkg${uid}`;
      await tenantPackageService.create({
        packageName,
        menuIds: [1, 2, 3],
        status: StatusEnum.NORMAL,
      });

      const pkg = await prisma.sysTenantPackage.findFirst({
        where: { packageName },
      });
      expect(pkg).toBeDefined();
      createdPackageIds.push(pkg!.packageId);

      const companyName = `SyncCo${uid}`;
      await tenantService.create({
        companyName,
        contactUserName: '套餐同步测试',
        contactPhone: '13700137000',
        username: `sa${uid}`,
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

      const syncResult = await tenantService.syncTenantPackage({
        tenantId: tenant!.tenantId,
        packageId: pkg!.packageId,
      });

      expect(syncResult.code).toBe(200);

      const updatedTenant = await prisma.sysTenant.findUnique({
        where: { id: tenant!.id },
      });

      expect(updatedTenant!.packageId).toBe(pkg!.packageId);
    });

    it('should prevent deleting package in use by tenant', async () => {
      const uid = uniqueId();

      const packageName = `InUsePkg${uid}`;
      await tenantPackageService.create({
        packageName,
        menuIds: [1],
        status: StatusEnum.NORMAL,
      });

      const pkg = await prisma.sysTenantPackage.findFirst({
        where: { packageName },
      });
      expect(pkg).toBeDefined();
      createdPackageIds.push(pkg!.packageId);

      const companyName = `InUseCo${uid}`;
      await tenantService.create({
        companyName,
        contactUserName: '套餐使用测试',
        contactPhone: '13600136000',
        username: `ia${uid}`,
        password: 'Test123456',
        packageId: pkg!.packageId,
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

      await expect(tenantPackageService.remove([pkg!.packageId])).rejects.toThrow();
    });
  });
});
