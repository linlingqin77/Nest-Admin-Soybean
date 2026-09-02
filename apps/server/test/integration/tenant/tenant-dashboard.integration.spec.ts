/**
 * 租户仪表盘模块集成测试
 */
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe, VersioningType } from '@nestjs/common';
import { AppModule } from 'src/app.module';
import { TenantDashboardService } from 'src/modules/tenants/dashboard/tenant-dashboard.service';

describe('Tenant Dashboard Integration Tests', () => {
  let app: INestApplication;
  let tenantDashboardService: TenantDashboardService;

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
    tenantDashboardService = app.get(TenantDashboardService);
  }, 60000);

  afterAll(async () => {
    await app.close();
  });

  describe('Dashboard Stats', () => {
    it('should return tenant statistics', async () => {
      const result = await tenantDashboardService.getStats();
      expect(result.code).toBe(200);
      expect(result.data).toBeDefined();
      expect(typeof result.data!.totalTenants).toBe('number');
    });
  });

  describe('Dashboard Trend', () => {
    it('should return trend data', async () => {
      const result = await tenantDashboardService.getTrend();
      expect(result.code).toBe(200);
      expect(Array.isArray(result.data)).toBe(true);
    });
  });

  describe('Package Distribution', () => {
    it('should return package distribution', async () => {
      const result = await tenantDashboardService.getPackageDistribution();
      expect(result.code).toBe(200);
      expect(Array.isArray(result.data)).toBe(true);
    });
  });

  describe('Expiring Tenants', () => {
    it('should return expiring tenants', async () => {
      const result = await tenantDashboardService.getExpiringTenants();
      expect(result.code).toBe(200);
      expect(Array.isArray(result.data)).toBe(true);
    });
  });

  describe('Quota Top Tenants', () => {
    it('should return quota top tenants', async () => {
      const result = await tenantDashboardService.getQuotaTopTenants();
      expect(result.code).toBe(200);
      expect(Array.isArray(result.data)).toBe(true);
    });
  });
});
