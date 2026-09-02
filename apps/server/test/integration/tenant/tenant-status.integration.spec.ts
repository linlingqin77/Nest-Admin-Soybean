/**
 * 租户状态变更集成测试
 *
 * @description
 * 测试租户禁用、过期对登录的影响，包括：
 * - 禁用租户登录限制
 * - 过期租户登录限制
 * - 租户状态恢复
 *
 * _Requirements: 12.3_
 */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe, VersioningType } from '@nestjs/common';
import { AppModule } from 'src/app.module';
import { PrismaService } from 'src/platform/prisma';
import { TenantService } from 'src/modules/tenants/tenant.service';
import { TenantLifecycleService } from 'src/core/tenancy/services/tenant-lifecycle.service';
import { StatusEnum } from 'src/shared/enums/index';

function uniqueId(): string {
  return Math.random().toString(36).substring(2, 8);
}

/**
 * 辅助函数：检查租户是否可登录
 * checkTenantCanLogin 返回 void，通过抛出异常表示不能登录
 */
async function checkCanLogin(
  service: TenantLifecycleService,
  tenantId: string,
): Promise<{ canLogin: boolean; reason?: string }> {
  try {
    await service.checkTenantCanLogin(tenantId);
    return { canLogin: true };
  } catch (error: any) {
    // BusinessException 的响应体是 { code, msg, data }
    const response = error.getResponse?.();
    const reason = typeof response === 'object' && response?.msg ? response.msg : error.message || '未知错误';
    return { canLogin: false, reason };
  }
}

describe('Tenant Status Integration Tests', () => {
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

  describe('Disabled Tenant Login Restriction', () => {
    it('should block login for disabled tenant', async () => {
      const uid = uniqueId();
      const companyName = `DisabledCo${uid}`;

      // 创建禁用状态的租户
      await tenantService.create({
        companyName,
        contactUserName: '禁用登录测试',
        contactPhone: '13800138000',
        username: `dl${uid}`,
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

      // 检查租户是否可登录
      const canLogin = await checkCanLogin(tenantLifecycleService, tenant!.tenantId);
      expect(canLogin.canLogin).toBe(false);
      expect(canLogin.reason).toContain('停用');
    });

    it('should allow login after re-enabling tenant', async () => {
      const uid = uniqueId();
      const companyName = `ReEnableCo${uid}`;

      // 创建禁用状态的租户
      await tenantService.create({
        companyName,
        contactUserName: '重启登录测试',
        contactPhone: '13700137000',
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

      // 验证禁用状态不能登录
      let canLogin = await checkCanLogin(tenantLifecycleService, tenant!.tenantId);
      expect(canLogin.canLogin).toBe(false);

      // 启用租户
      await tenantService.update({
        id: tenant!.id,
        tenantId: tenant!.tenantId,
        status: StatusEnum.NORMAL,
      });

      // 验证启用后可以登录
      canLogin = await checkCanLogin(tenantLifecycleService, tenant!.tenantId);
      expect(canLogin.canLogin).toBe(true);
    });
  });

  describe('Expired Tenant Login Restriction', () => {
    it('should block login for expired tenant', async () => {
      const uid = uniqueId();
      const companyName = `ExpiredCo${uid}`;
      const expireTime = new Date();
      expireTime.setDate(expireTime.getDate() - 1); // 昨天过期

      // 创建已过期的租户
      await tenantService.create({
        companyName,
        contactUserName: '过期登录测试',
        contactPhone: '13600136000',
        username: `ex${uid}`,
        password: 'Test123456',
        expireTime,
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

      // 检查租户是否可登录
      const canLogin = await checkCanLogin(tenantLifecycleService, tenant!.tenantId);
      expect(canLogin.canLogin).toBe(false);
      expect(canLogin.reason).toContain('过期');
    });

    it('should allow login for tenant with future expiration', async () => {
      const uid = uniqueId();
      const companyName = `FutureCo${uid}`;
      const expireTime = new Date();
      expireTime.setMonth(expireTime.getMonth() + 1); // 1个月后过期

      // 创建未过期的租户
      await tenantService.create({
        companyName,
        contactUserName: '未过期登录测试',
        contactPhone: '13500135000',
        username: `fu${uid}`,
        password: 'Test123456',
        expireTime,
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

      // 检查租户是否可登录
      const canLogin = await checkCanLogin(tenantLifecycleService, tenant!.tenantId);
      expect(canLogin.canLogin).toBe(true);
    });

    it('should allow login after extending expiration', async () => {
      const uid = uniqueId();
      const companyName = `ExtendCo${uid}`;
      const expireTime = new Date();
      expireTime.setDate(expireTime.getDate() - 1); // 昨天过期

      // 创建已过期的租户
      await tenantService.create({
        companyName,
        contactUserName: '延期登录测试',
        contactPhone: '13400134000',
        username: `et${uid}`,
        password: 'Test123456',
        expireTime,
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

      // 验证过期状态不能登录
      let canLogin = await checkCanLogin(tenantLifecycleService, tenant!.tenantId);
      expect(canLogin.canLogin).toBe(false);

      // 延长过期时间并重置状态为正常
      const newExpireTime = new Date();
      newExpireTime.setMonth(newExpireTime.getMonth() + 1);
      await tenantService.update({
        id: tenant!.id,
        tenantId: tenant!.tenantId,
        expireTime: newExpireTime,
        status: StatusEnum.NORMAL, // 重置状态
      });

      // 验证延期后可以登录
      canLogin = await checkCanLogin(tenantLifecycleService, tenant!.tenantId);
      expect(canLogin.canLogin).toBe(true);
    });
  });

  describe('Tenant with No Expiration', () => {
    it('should allow login for tenant without expiration date', async () => {
      const uid = uniqueId();
      const companyName = `NoExpCo${uid}`;

      // 创建无过期时间的租户
      await tenantService.create({
        companyName,
        contactUserName: '无过期测试',
        contactPhone: '13300133000',
        username: `ne${uid}`,
        password: 'Test123456',
        status: StatusEnum.NORMAL,
        // 不设置 expireTime
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

      // 检查租户是否可登录
      const canLogin = await checkCanLogin(tenantLifecycleService, tenant!.tenantId);
      expect(canLogin.canLogin).toBe(true);
    });
  });

  describe('Combined Status Checks', () => {
    it('should block login for disabled and expired tenant', async () => {
      const uid = uniqueId();
      const companyName = `BothCo${uid}`;
      const expireTime = new Date();
      expireTime.setDate(expireTime.getDate() - 1); // 昨天过期

      // 创建禁用且过期的租户
      await tenantService.create({
        companyName,
        contactUserName: '双重限制测试',
        contactPhone: '13200132000',
        username: `bt${uid}`,
        password: 'Test123456',
        expireTime,
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

      // 检查租户是否可登录
      const canLogin = await checkCanLogin(tenantLifecycleService, tenant!.tenantId);
      expect(canLogin.canLogin).toBe(false);
    });

    it('should return not found for non-existent tenant', async () => {
      const canLogin = await checkCanLogin(tenantLifecycleService, '999999');
      expect(canLogin.canLogin).toBe(false);
      expect(canLogin.reason).toContain('不存在');
    });
  });

  describe('Tenant Availability Service', () => {
    it('should return true for available tenant', async () => {
      const uid = uniqueId();
      const companyName = `AvailCo${uid}`;

      await tenantService.create({
        companyName,
        contactUserName: '可用性测试',
        contactPhone: '13100131000',
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

    it('should return false for unavailable tenant', async () => {
      const uid = uniqueId();
      const companyName = `UnavailCo${uid}`;

      await tenantService.create({
        companyName,
        contactUserName: '不可用测试',
        contactPhone: '13000130000',
        username: `un${uid}`,
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
  });
});
