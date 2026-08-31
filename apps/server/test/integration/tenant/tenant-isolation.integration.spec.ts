/**
 * 租户数据隔离集成测试
 *
 * @description
 * 测试不同租户之间的数据隔离，包括：
 * - 租户数据隔离验证
 * - 超级租户跨租户访问
 * - 租户上下文切换
 *
 * _Requirements: 12.2_
 */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe, VersioningType } from '@nestjs/common';
import { AppModule } from 'src/app.modules';
import { PrismaService } from 'src/platform/prisma';
import { TenantService } from 'src/modules/tenants/tenant.service';
import { TenantContext } from 'src/core/tenancy/context/tenant.context';
import { StatusEnum } from 'src/shared/enums/index';

function uniqueId(): string {
  return Math.random().toString(36).substring(2, 8);
}

describe('Tenant Isolation Integration Tests', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let tenantService: TenantService;

  const createdTenantIds: number[] = [];
  const createdUserIds: number[] = [];
  const createdConfigIds: number[] = [];

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
  }, 60000);

  afterAll(async () => {
    try {
      if (createdConfigIds.length > 0) {
        await prisma.sysConfig.deleteMany({
          where: { configId: { in: createdConfigIds } },
        });
      }
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

  describe('Data Isolation Between Tenants', () => {
    let tenantA: { id: number; tenantId: string };
    let tenantB: { id: number; tenantId: string };

    beforeAll(async () => {
      // 创建两个测试租户
      const uidA = uniqueId();
      const uidB = uniqueId();

      await tenantService.create({
        companyName: `IsoCoA${uidA}`,
        contactUserName: '隔离测试A',
        contactPhone: '13800138001',
        username: `ia${uidA}`,
        password: 'Test123456',
        status: StatusEnum.NORMAL,
      });

      await tenantService.create({
        companyName: `IsoCoB${uidB}`,
        contactUserName: '隔离测试B',
        contactPhone: '13800138002',
        username: `ib${uidB}`,
        password: 'Test123456',
        status: StatusEnum.NORMAL,
      });

      const tA = await prisma.sysTenant.findFirst({
        where: { companyName: `IsoCoA${uidA}` },
      });
      const tB = await prisma.sysTenant.findFirst({
        where: { companyName: `IsoCoB${uidB}` },
      });

      tenantA = { id: tA!.id, tenantId: tA!.tenantId };
      tenantB = { id: tB!.id, tenantId: tB!.tenantId };

      createdTenantIds.push(tA!.id, tB!.id);

      // 收集管理员用户ID
      const adminA = await prisma.sysUser.findFirst({
        where: { tenantId: tenantA.tenantId },
      });
      const adminB = await prisma.sysUser.findFirst({
        where: { tenantId: tenantB.tenantId },
      });
      if (adminA) createdUserIds.push(adminA.userId);
      if (adminB) createdUserIds.push(adminB.userId);
    });

    it('should isolate user data between tenants', async () => {
      // 在租户A上下文中创建用户
      const userA = await TenantContext.run({ tenantId: tenantA.tenantId }, async () => {
        return await prisma.sysUser.create({
          data: {
            tenantId: tenantA.tenantId,
            userName: `userA_${uniqueId()}`,
            nickName: '租户A用户',
            userType: '00',
            password: 'hashed_password',
            status: '0',
            delFlag: '0',
          },
        });
      });
      createdUserIds.push(userA.userId);

      // 在租户B上下文中创建用户
      const userB = await TenantContext.run({ tenantId: tenantB.tenantId }, async () => {
        return await prisma.sysUser.create({
          data: {
            tenantId: tenantB.tenantId,
            userName: `userB_${uniqueId()}`,
            nickName: '租户B用户',
            userType: '00',
            password: 'hashed_password',
            status: '0',
            delFlag: '0',
          },
        });
      });
      createdUserIds.push(userB.userId);

      // 在租户A上下文中查询，应该只能看到租户A的用户
      const usersInA = await TenantContext.run({ tenantId: tenantA.tenantId }, async () => {
        return await prisma.sysUser.findMany({
          where: { delFlag: '0' },
        });
      });

      // 验证租户A只能看到自己的用户
      const userBInA = usersInA.find((u) => u.userId === userB.userId);
      expect(userBInA).toBeUndefined();

      // 在租户B上下文中查询，应该只能看到租户B的用户
      const usersInB = await TenantContext.run({ tenantId: tenantB.tenantId }, async () => {
        return await prisma.sysUser.findMany({
          where: { delFlag: '0' },
        });
      });

      // 验证租户B只能看到自己的用户
      const userAInB = usersInB.find((u) => u.userId === userA.userId);
      expect(userAInB).toBeUndefined();
    });

    it('should isolate platform/config data between tenants', async () => {
      const configKeyA = `test.platform/config.a.${uniqueId()}`;
      const configKeyB = `test.platform/config.b.${uniqueId()}`;

      // 在租户A上下文中创建配置
      const configA = await TenantContext.run({ tenantId: tenantA.tenantId }, async () => {
        return await prisma.sysConfig.create({
          data: {
            tenantId: tenantA.tenantId,
            configName: '租户A配置',
            configKey: configKeyA,
            configValue: 'valueA',
            configType: 'N',
            delFlag: '0',
          },
        });
      });
      createdConfigIds.push(configA.configId);

      // 在租户B上下文中创建配置
      const configB = await TenantContext.run({ tenantId: tenantB.tenantId }, async () => {
        return await prisma.sysConfig.create({
          data: {
            tenantId: tenantB.tenantId,
            configName: '租户B配置',
            configKey: configKeyB,
            configValue: 'valueB',
            configType: 'N',
            delFlag: '0',
          },
        });
      });
      createdConfigIds.push(configB.configId);

      // 在租户A上下文中查询，应该只能看到租户A的配置
      const configsInA = await TenantContext.run({ tenantId: tenantA.tenantId }, async () => {
        return await prisma.sysConfig.findMany({
          where: { delFlag: '0' },
        });
      });

      const configBInA = configsInA.find((c) => c.configId === configB.configId);
      expect(configBInA).toBeUndefined();

      // 在租户B上下文中查询，应该只能看到租户B的配置
      const configsInB = await TenantContext.run({ tenantId: tenantB.tenantId }, async () => {
        return await prisma.sysConfig.findMany({
          where: { delFlag: '0' },
        });
      });

      const configAInB = configsInB.find((c) => c.configId === configA.configId);
      expect(configAInB).toBeUndefined();
    });
  });

  describe('Super Tenant Cross-Tenant Access', () => {
    it('should allow super tenant to see all tenants data', async () => {
      // 超级租户上下文
      const allTenants = await TenantContext.run({ tenantId: TenantContext.SUPER_TENANT_ID }, async () => {
        return await prisma.sysTenant.findMany({
          where: { delFlag: '0' },
        });
      });

      // 超级租户应该能看到所有租户
      expect(allTenants.length).toBeGreaterThan(0);
    });

    it('should allow super tenant to query specific tenant data', async () => {
      const uid = uniqueId();
      const companyName = `SuperCo${uid}`;

      // 创建一个测试租户
      await tenantService.create({
        companyName,
        contactUserName: '超级租户测试',
        contactPhone: '13700137000',
        username: `st${uid}`,
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

      // 超级租户应该能查询到这个租户
      const result = await TenantContext.run({ tenantId: TenantContext.SUPER_TENANT_ID }, async () => {
        return await prisma.sysTenant.findUnique({
          where: { id: tenant!.id },
        });
      });

      expect(result).toBeDefined();
      expect(result!.companyName).toBe(companyName);
    });
  });

  describe('Tenant Context Switching', () => {
    it('should correctly switch tenant context', async () => {
      const uid = uniqueId();
      const companyName = `SwitchCo${uid}`;

      await tenantService.create({
        companyName,
        contactUserName: '切换测试',
        contactPhone: '13600136000',
        username: `sw${uid}`,
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

      // 在租户上下文中验证当前租户ID
      await TenantContext.run({ tenantId: tenant!.tenantId }, async () => {
        const currentTenantId = TenantContext.getTenantId();
        expect(currentTenantId).toBe(tenant!.tenantId);
      });

      // 上下文结束后，应该没有租户ID
      const afterContextTenantId = TenantContext.getTenantId();
      expect(afterContextTenantId).toBeUndefined();
    });

    it('should support nested tenant context', async () => {
      const uid1 = uniqueId();
      const uid2 = uniqueId();

      await tenantService.create({
        companyName: `NestedCo1${uid1}`,
        contactUserName: '嵌套测试1',
        contactPhone: '13500135001',
        username: `n1${uid1}`,
        password: 'Test123456',
      });

      await tenantService.create({
        companyName: `NestedCo2${uid2}`,
        contactUserName: '嵌套测试2',
        contactPhone: '13500135002',
        username: `n2${uid2}`,
        password: 'Test123456',
      });

      const tenant1 = await prisma.sysTenant.findFirst({
        where: { companyName: `NestedCo1${uid1}` },
      });
      const tenant2 = await prisma.sysTenant.findFirst({
        where: { companyName: `NestedCo2${uid2}` },
      });

      createdTenantIds.push(tenant1!.id, tenant2!.id);

      const admin1 = await prisma.sysUser.findFirst({
        where: { tenantId: tenant1!.tenantId },
      });
      const admin2 = await prisma.sysUser.findFirst({
        where: { tenantId: tenant2!.tenantId },
      });
      if (admin1) createdUserIds.push(admin1.userId);
      if (admin2) createdUserIds.push(admin2.userId);

      // 嵌套上下文测试
      await TenantContext.run({ tenantId: tenant1!.tenantId }, async () => {
        expect(TenantContext.getTenantId()).toBe(tenant1!.tenantId);

        // 嵌套切换到租户2
        await TenantContext.run({ tenantId: tenant2!.tenantId }, async () => {
          expect(TenantContext.getTenantId()).toBe(tenant2!.tenantId);
        });

        // 退出嵌套后，应该恢复到租户1
        expect(TenantContext.getTenantId()).toBe(tenant1!.tenantId);
      });
    });
  });

  describe('Ignore Tenant Filter', () => {
    it('should skip tenant filter when using runIgnoringTenant', async () => {
      const uid = uniqueId();
      const companyName = `SkipCo${uid}`;

      await tenantService.create({
        companyName,
        contactUserName: '跳过过滤测试',
        contactPhone: '13400134000',
        username: `sk${uid}`,
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

      // 在另一个租户上下文中，使用 runIgnoringTenant 应该能查到
      const anotherTenantId = '999999';
      const result = await TenantContext.run({ tenantId: anotherTenantId }, async () => {
        return await TenantContext.runIgnoringTenant(async () => {
          return await prisma.sysTenant.findFirst({
            where: { companyName },
          });
        });
      });

      expect(result).toBeDefined();
      expect(result!.companyName).toBe(companyName);
    });
  });
});
