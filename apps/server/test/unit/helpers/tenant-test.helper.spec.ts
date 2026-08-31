/**
 * 租户测试辅助函数单元测试
 *
 * @description
 * 验证租户测试辅助函数和 Mock 工厂的正确性
 *
 * @requirements 1.1, 2.1, 3.1
 */

import { TenantContext } from '@/core/tenancy/context/tenant.context';
import { SUPER_TENANT_ID } from '@/core/tenancy/constants/tenant-models';
import {
  TenantTestHelper,
  runWithTenant,
  runWithTenantAsync,
  runIgnoringTenant,
  runIgnoringTenantAsync,
  runAsSuperTenant,
  runAsSuperTenantAsync,
  createTestTenant,
  createTestUser,
  createTestQuota,
  createTenantTestHelper,
  generateRandomTenantId,
  generateNormalTenantId,
  generateTenantIdPair,
} from 'test/helpers/tenant-test.helper';
import {
  createTenantMockPrisma,
  createTenantMockRedis,
  createTenantMockConfig,
  createMockAppConfigService,
  isTenantModel,
  getTenantModels,
  getNonTenantModels,
} from 'test/mocks/tenant.mock';

describe('TenantTestHelper', () => {
  describe('TenantTestHelper 类', () => {
    let helper: TenantTestHelper;

    beforeEach(() => {
      helper = new TenantTestHelper();
    });

    describe('runWithTenant', () => {
      it('应该在指定租户上下文中执行回调', () => {
        const tenantId = '100001';
        const result = helper.runWithTenant(tenantId, () => {
          return TenantContext.getTenantId();
        });
        expect(result).toBe(tenantId);
      });

      it('应该在回调执行后恢复上下文', () => {
        const tenantId = '100001';
        helper.runWithTenant(tenantId, () => {
          expect(TenantContext.getTenantId()).toBe(tenantId);
        });
        // 回调外部应该没有上下文
        expect(TenantContext.getTenantId()).toBeUndefined();
      });
    });

    describe('runIgnoringTenant', () => {
      it('应该设置 ignoreTenant 为 true', () => {
        const result = helper.runIgnoringTenant(() => {
          return TenantContext.isIgnoreTenant();
        });
        expect(result).toBe(true);
      });
    });

    describe('runAsSuperTenant', () => {
      it('应该在超级租户上下文中执行', () => {
        const result = helper.runAsSuperTenant(() => {
          return TenantContext.getTenantId();
        });
        expect(result).toBe(SUPER_TENANT_ID);
      });

      it('应该识别为超级租户', () => {
        const result = helper.runAsSuperTenant(() => {
          return TenantContext.isSuperTenant();
        });
        expect(result).toBe(true);
      });
    });

    describe('createTestTenant', () => {
      it('应该创建有效的租户测试数据', () => {
        const tenant = helper.createTestTenant();
        expect(tenant.tenantId).toBeDefined();
        expect(tenant.tenantId.length).toBe(6);
        expect(tenant.companyName).toBe('测试租户');
        expect(tenant.status).toBe('0');
        expect(tenant.delFlag).toBe('0');
      });

      it('应该支持覆盖默认值', () => {
        const tenant = helper.createTestTenant({
          companyName: '自定义公司',
          status: '1',
        });
        expect(tenant.companyName).toBe('自定义公司');
        expect(tenant.status).toBe('1');
      });
    });

    describe('createTestUser', () => {
      it('应该创建有效的用户测试数据', () => {
        const tenantId = '100001';
        const user = helper.createTestUser(tenantId);
        expect(user.tenantId).toBe(tenantId);
        expect(user.userName).toBeDefined();
        expect(user.status).toBe('0');
      });
    });

    describe('createTestQuota', () => {
      it('应该创建有效的配额测试数据', () => {
        const tenantId = '100001';
        const quota = helper.createTestQuota(tenantId);
        expect(quota.tenantId).toBe(tenantId);
        expect(quota.resource).toBe('users');
        expect(quota.quota).toBe(100);
        expect(quota.currentUsage).toBe(50);
      });
    });

    describe('generateTenantId', () => {
      it('应该生成6位数字字符串', () => {
        const tenantId = helper.generateTenantId();
        expect(tenantId.length).toBe(6);
        expect(/^\d{6}$/.test(tenantId)).toBe(true);
      });
    });

    describe('generateNormalTenantId', () => {
      it('应该生成非超级租户ID', () => {
        for (let i = 0; i < 10; i++) {
          const tenantId = helper.generateNormalTenantId();
          expect(tenantId).not.toBe(SUPER_TENANT_ID);
        }
      });
    });

    describe('generateTenantIdPair', () => {
      it('应该生成两个不同的租户ID', () => {
        const [tenantA, tenantB] = helper.generateTenantIdPair();
        expect(tenantA).not.toBe(tenantB);
        expect(tenantA).not.toBe(SUPER_TENANT_ID);
        expect(tenantB).not.toBe(SUPER_TENANT_ID);
      });
    });

    describe('isSuperTenantId', () => {
      it('应该正确识别超级租户ID', () => {
        expect(helper.isSuperTenantId(SUPER_TENANT_ID)).toBe(true);
        expect(helper.isSuperTenantId('100001')).toBe(false);
      });
    });
  });

  describe('静态辅助函数', () => {
    describe('runWithTenant', () => {
      it('应该在指定租户上下文中执行', () => {
        const tenantId = '100001';
        const result = runWithTenant(tenantId, () => TenantContext.getTenantId());
        expect(result).toBe(tenantId);
      });
    });

    describe('runWithTenantAsync', () => {
      it('应该在指定租户上下文中执行异步操作', async () => {
        const tenantId = '100001';
        const result = await runWithTenantAsync(tenantId, async () => {
          await Promise.resolve();
          return TenantContext.getTenantId();
        });
        expect(result).toBe(tenantId);
      });
    });

    describe('runIgnoringTenant', () => {
      it('应该设置 ignoreTenant 为 true', () => {
        const result = runIgnoringTenant(() => TenantContext.isIgnoreTenant());
        expect(result).toBe(true);
      });
    });

    describe('runIgnoringTenantAsync', () => {
      it('应该在异步操作中设置 ignoreTenant', async () => {
        const result = await runIgnoringTenantAsync(async () => {
          await Promise.resolve();
          return TenantContext.isIgnoreTenant();
        });
        expect(result).toBe(true);
      });
    });

    describe('runAsSuperTenant', () => {
      it('应该在超级租户上下文中执行', () => {
        const result = runAsSuperTenant(() => TenantContext.isSuperTenant());
        expect(result).toBe(true);
      });
    });

    describe('runAsSuperTenantAsync', () => {
      it('应该在异步操作中以超级租户身份执行', async () => {
        const result = await runAsSuperTenantAsync(async () => {
          await Promise.resolve();
          return TenantContext.isSuperTenant();
        });
        expect(result).toBe(true);
      });
    });

    describe('createTestTenant', () => {
      it('应该创建有效的租户数据', () => {
        const tenant = createTestTenant();
        expect(tenant.tenantId).toBeDefined();
        expect(tenant.tenantId.length).toBe(6);
      });
    });

    describe('createTestUser', () => {
      it('应该创建有效的用户数据', () => {
        const user = createTestUser('100001');
        expect(user.tenantId).toBe('100001');
      });
    });

    describe('createTestQuota', () => {
      it('应该创建有效的配额数据', () => {
        const quota = createTestQuota('100001');
        expect(quota.tenantId).toBe('100001');
      });
    });

    describe('createTenantTestHelper', () => {
      it('应该创建 TenantTestHelper 实例', () => {
        const helper = createTenantTestHelper();
        expect(helper).toBeInstanceOf(TenantTestHelper);
      });

      it('应该支持自定义配置', () => {
        const helper = createTenantTestHelper({ enabled: false });
        expect(helper.getConfig().enabled).toBe(false);
      });
    });

    describe('generateRandomTenantId', () => {
      it('应该生成6位数字字符串', () => {
        const tenantId = generateRandomTenantId();
        expect(tenantId.length).toBe(6);
        expect(/^\d{6}$/.test(tenantId)).toBe(true);
      });
    });

    describe('generateNormalTenantId', () => {
      it('应该生成非超级租户ID', () => {
        const tenantId = generateNormalTenantId();
        expect(tenantId).not.toBe(SUPER_TENANT_ID);
      });
    });

    describe('generateTenantIdPair', () => {
      it('应该生成两个不同的租户ID', () => {
        const [a, b] = generateTenantIdPair();
        expect(a).not.toBe(b);
      });
    });
  });
});

describe('TenantMock', () => {
  describe('createTenantMockPrisma', () => {
    it('应该创建有效的 Prisma Mock', () => {
      const mock = createTenantMockPrisma();
      expect(mock.sysTenant).toBeDefined();
      expect(mock.sysUser).toBeDefined();
      expect(mock.$transaction).toBeDefined();
    });

    it('应该为超级租户返回默认数据', async () => {
      const mock = createTenantMockPrisma();
      const tenant = await mock.sysTenant.findUnique({ where: { tenantId: SUPER_TENANT_ID } });
      expect(tenant).toBeDefined();
      expect(tenant?.tenantId).toBe(SUPER_TENANT_ID);
    });
  });

  describe('createTenantMockRedis', () => {
    it('应该创建有效的 Redis Mock', () => {
      const mock = createTenantMockRedis();
      expect(mock.get).toBeDefined();
      expect(mock.set).toBeDefined();
      expect(mock._store).toBeDefined();
    });

    it('应该预设租户缓存数据', async () => {
      const mock = createTenantMockRedis();
      const data = await mock.get('tenant:000000:info');
      expect(data).toBeDefined();
      const parsed = JSON.parse(data!);
      expect(parsed.tenantId).toBe(SUPER_TENANT_ID);
    });
  });

  describe('createTenantMockConfig', () => {
    it('应该创建有效的 Config Mock', () => {
      const mock = createTenantMockConfig();
      expect(mock.get).toBeDefined();
    });

    it('应该返回租户配置', () => {
      const mock = createTenantMockConfig();
      expect(mock.get('tenant.enabled')).toBe(true);
    });

    it('应该支持自定义配置', () => {
      const mock = createTenantMockConfig({ enabled: false });
      expect(mock.get('tenant.enabled')).toBe(false);
    });
  });

  describe('createMockAppConfigService', () => {
    it('应该创建有效的 AppConfigService Mock', () => {
      const mock = createMockAppConfigService();
      expect(mock.tenant).toBeDefined();
      expect(mock.tenant.enabled).toBe(true);
    });

    it('应该支持自定义配置', () => {
      const mock = createMockAppConfigService({ enabled: false });
      expect(mock.tenant.enabled).toBe(false);
    });
  });

  describe('isTenantModel', () => {
    it('应该正确识别租户模型', () => {
      expect(isTenantModel('SysUser')).toBe(true);
      expect(isTenantModel('SysRole')).toBe(true);
      expect(isTenantModel('SysDept')).toBe(true);
    });

    it('应该正确识别非租户模型', () => {
      expect(isTenantModel('SysTenant')).toBe(false);
      expect(isTenantModel('GenTable')).toBe(false);
    });
  });

  describe('getTenantModels', () => {
    it('应该返回所有租户模型', () => {
      const models = getTenantModels();
      expect(models).toContain('SysUser');
      expect(models).toContain('SysRole');
      expect(models).toContain('SysDept');
    });
  });

  describe('getNonTenantModels', () => {
    it('应该返回非租户模型示例', () => {
      const models = getNonTenantModels();
      expect(models).toContain('SysTenant');
      expect(models).toContain('GenTable');
    });
  });
});
