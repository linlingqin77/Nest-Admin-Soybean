import * as fc from 'fast-check';
import { Test, TestingModule } from '@nestjs/testing';
import { FeatureToggleService } from '@/core/tenancy/services/feature-toggle.service';
import { PrismaService } from '@/platform/prisma';
import { RedisService } from '@/platform/redis/redis.service';

/**
 * FeatureToggleService 属性测试
 *
 * 验证功能开关服务的核心属性：
 * - Property 8: 功能开关租户隔离
 */
describe('FeatureToggleService - Property Tests', () => {
  let service: FeatureToggleService;

  // 内存存储模拟
  const featureStore = new Map<string, Map<string, { enabled: boolean; mockConfig?: string }>>();
  const cacheStore = new Map<string, Map<string, string>>();

  const mockRedisClient = {
    expire: jest.fn().mockResolvedValue(1),
  };

  const mockPrismaService = {
    sysTenantFeature: {
      findUnique: jest.fn().mockImplementation(({ where }) => {
        const { tenantId, featureKey } = where.tenantId_featureKey;
        const tenantFeatures = featureStore.get(tenantId);
        if (!tenantFeatures) return Promise.resolve(null);
        const feature = tenantFeatures.get(featureKey);
        if (!feature) return Promise.resolve(null);
        return Promise.resolve({
          tenantId,
          featureKey,
          enabled: feature.enabled,
          mockConfig: feature.mockConfig,
        });
      }),
      findMany: jest.fn().mockImplementation(({ where }) => {
        const tenantFeatures = featureStore.get(where.tenantId);
        if (!tenantFeatures) return Promise.resolve([]);
        return Promise.resolve(
          Array.from(tenantFeatures.entries()).map(([featureKey, data]) => ({
            tenantId: where.tenantId,
            featureKey,
            enabled: data.enabled,
            mockConfig: data.mockConfig,
          })),
        );
      }),
      upsert: jest.fn().mockImplementation(({ where, update, create }) => {
        const { tenantId, featureKey } = where.tenantId_featureKey;
        if (!featureStore.has(tenantId)) {
          featureStore.set(tenantId, new Map());
        }
        const tenantFeatures = featureStore.get(tenantId)!;
        tenantFeatures.set(featureKey, {
          enabled: update.enabled ?? create.enabled,
          mockConfig: update.mockConfig ?? create.mockConfig,
        });
        return Promise.resolve({ tenantId, featureKey });
      }),
      deleteMany: jest.fn().mockImplementation(({ where }) => {
        const tenantFeatures = featureStore.get(where.tenantId);
        if (tenantFeatures) {
          tenantFeatures.delete(where.featureKey);
        }
        return Promise.resolve({ count: 1 });
      }),
    },
    $transaction: jest.fn().mockImplementation((operations) => Promise.all(operations)),
  };

  const mockRedisService = {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn().mockImplementation((key) => {
      const tenantId = key.replace('tenant:feature:', '');
      cacheStore.delete(tenantId);
      return Promise.resolve(1);
    }),
    hget: jest.fn().mockImplementation((key, field) => {
      const tenantId = key.replace('tenant:feature:', '');
      const tenantCache = cacheStore.get(tenantId);
      if (!tenantCache) return Promise.resolve(null);
      return Promise.resolve(tenantCache.get(field) ?? null);
    }),
    hset: jest.fn().mockImplementation((key, field, value) => {
      const tenantId = key.replace('tenant:feature:', '');
      if (!cacheStore.has(tenantId)) {
        cacheStore.set(tenantId, new Map());
      }
      cacheStore.get(tenantId)!.set(field, value);
      return Promise.resolve(1);
    }),
    hdel: jest.fn().mockImplementation((key, field) => {
      const tenantId = key.replace('tenant:feature:', '');
      const tenantCache = cacheStore.get(tenantId);
      if (tenantCache) {
        tenantCache.delete(field);
      }
      return Promise.resolve(1);
    }),
    hGetAll: jest.fn().mockImplementation((key) => {
      const tenantId = key.replace('tenant:feature:', '');
      const tenantCache = cacheStore.get(tenantId);
      if (!tenantCache) return Promise.resolve({});
      return Promise.resolve(Object.fromEntries(tenantCache.entries()));
    }),
    hmset: jest.fn().mockImplementation((key, data) => {
      const tenantId = key.replace('tenant:feature:', '');
      if (!cacheStore.has(tenantId)) {
        cacheStore.set(tenantId, new Map());
      }
      const tenantCache = cacheStore.get(tenantId)!;
      for (const [field, value] of Object.entries(data)) {
        tenantCache.set(field, value as string);
      }
      return Promise.resolve('OK');
    }),
    getClient: jest.fn(() => mockRedisClient),
  };

  beforeEach(async () => {
    // 清空存储
    featureStore.clear();
    cacheStore.clear();

    const modules: TestingModule = await Test.createTestingModule({
      providers: [
        FeatureToggleService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: RedisService,
          useValue: mockRedisService,
        },
      ],
    }).compile();

    service = modules.get<FeatureToggleService>(FeatureToggleService);
  });

  // 生成有效的租户ID
  const tenantIdArb = fc.integer({ min: 100001, max: 999999 }).map((n) => n.toString());

  // 生成有效的功能键
  const featureKeyArb = fc.stringMatching(/^[a-z][a-z_]{1,28}[a-z]$/).filter((s) => s.length >= 3 && !s.includes('__'));

  describe('Property 8: 功能开关租户隔离', () => {
    /**
     * **Validates: Requirements 6.1**
     * 对于任意两个不同的租户，设置一个租户的功能开关不应该影响另一个租户的功能开关状态
     */
    it('设置一个租户的功能开关不应该影响其他租户', async () => {
      await fc.assert(
        fc.asyncProperty(
          tenantIdArb,
          tenantIdArb,
          featureKeyArb,
          fc.boolean(),
          fc.boolean(),
          async (tenant1, tenant2, feature, enabled1, enabled2) => {
            // 确保两个租户ID不同
            fc.pre(tenant1 !== tenant2);

            // 清空存储
            featureStore.clear();
            cacheStore.clear();

            // 设置租户1的功能开关
            await service.setFeature(tenant1, feature, enabled1);

            // 设置租户2的功能开关
            await service.setFeature(tenant2, feature, enabled2);

            // 验证租户1的功能状态不受租户2的影响
            const result1 = await service.isEnabled(tenant1, feature);
            const result2 = await service.isEnabled(tenant2, feature);

            return result1 === enabled1 && result2 === enabled2;
          },
        ),
        { numRuns: 100 },
      );
    });

    /**
     * **Validates: Requirements 6.1**
     * 删除一个租户的功能开关不应该影响其他租户的功能开关
     */
    it('删除一个租户的功能开关不应该影响其他租户', async () => {
      await fc.assert(
        fc.asyncProperty(tenantIdArb, tenantIdArb, featureKeyArb, async (tenant1, tenant2, feature) => {
          // 确保两个租户ID不同
          fc.pre(tenant1 !== tenant2);

          // 清空存储
          featureStore.clear();
          cacheStore.clear();

          // 两个租户都启用该功能
          await service.setFeature(tenant1, feature, true);
          await service.setFeature(tenant2, feature, true);

          // 删除租户1的功能开关
          await service.deleteFeature(tenant1, feature);

          // 验证租户2的功能状态不受影响
          const result2 = await service.isEnabled(tenant2, feature);

          return result2 === true;
        }),
        { numRuns: 100 },
      );
    });

    /**
     * **Validates: Requirements 6.1**
     * 清除一个租户的缓存不应该影响其他租户的缓存
     */
    it('清除一个租户的缓存不应该影响其他租户', async () => {
      await fc.assert(
        fc.asyncProperty(tenantIdArb, tenantIdArb, featureKeyArb, async (tenant1, tenant2, feature) => {
          // 确保两个租户ID不同
          fc.pre(tenant1 !== tenant2);

          // 清空存储
          featureStore.clear();
          cacheStore.clear();

          // 两个租户都启用该功能
          await service.setFeature(tenant1, feature, true);
          await service.setFeature(tenant2, feature, true);

          // 清除租户1的缓存
          await service.clearCache(tenant1);

          // 验证租户2的缓存仍然存在
          const tenant2Cache = cacheStore.get(tenant2);
          return tenant2Cache !== undefined && tenant2Cache.has(feature);
        }),
        { numRuns: 100 },
      );
    });
  });

  describe('Property: 功能开关设置往返一致性', () => {
    /**
     * 对于任意租户和功能，设置功能开关后查询应该返回相同的状态
     */
    it('设置功能开关后查询应该返回相同的状态', async () => {
      await fc.assert(
        fc.asyncProperty(tenantIdArb, featureKeyArb, fc.boolean(), async (tenantId, feature, enabled) => {
          // 清空存储
          featureStore.clear();
          cacheStore.clear();

          // 设置功能开关
          await service.setFeature(tenantId, feature, enabled);

          // 查询功能状态
          const result = await service.isEnabled(tenantId, feature);

          return result === enabled;
        }),
        { numRuns: 100 },
      );
    });

    /**
     * 对于任意租户和功能，多次设置应该以最后一次为准
     */
    it('多次设置功能开关应该以最后一次为准', async () => {
      await fc.assert(
        fc.asyncProperty(
          tenantIdArb,
          featureKeyArb,
          fc.array(fc.boolean(), { minLength: 2, maxLength: 10 }),
          async (tenantId, feature, enabledValues) => {
            // 清空存储
            featureStore.clear();
            cacheStore.clear();

            // 多次设置功能开关
            for (const enabled of enabledValues) {
              await service.setFeature(tenantId, feature, enabled);
            }

            // 查询功能状态
            const result = await service.isEnabled(tenantId, feature);
            const lastValue = enabledValues[enabledValues.length - 1];

            return result === lastValue;
          },
        ),
        { numRuns: 100 },
      );
    });
  });

  describe('Property: 批量设置功能开关', () => {
    /**
     * 批量设置功能开关后，每个功能的状态应该正确
     */
    it('批量设置功能开关后每个功能状态应该正确', async () => {
      await fc.assert(
        fc.asyncProperty(
          tenantIdArb,
          fc.dictionary(featureKeyArb, fc.boolean(), { minKeys: 1, maxKeys: 5 }),
          async (tenantId, features) => {
            // 清空存储
            featureStore.clear();
            cacheStore.clear();

            // 批量设置功能开关
            await service.setFeatures(tenantId, features);

            // 验证每个功能的状态
            for (const [feature, enabled] of Object.entries(features)) {
              const result = await service.isEnabled(tenantId, feature);
              if (result !== enabled) {
                return false;
              }
            }

            return true;
          },
        ),
        { numRuns: 50 },
      );
    });
  });

  describe('Property: 功能配置存储', () => {
    /**
     * 设置功能配置后应该能够正确获取
     */
    it('设置功能配置后应该能够正确获取', async () => {
      await fc.assert(
        fc.asyncProperty(
          tenantIdArb,
          featureKeyArb,
          fc.boolean(),
          fc.dictionary(fc.string({ minLength: 1, maxLength: 10 }), fc.jsonValue(), {
            minKeys: 0,
            maxKeys: 5,
          }),
          async (tenantId, feature, enabled, mockConfig) => {
            // 清空存储
            featureStore.clear();
            cacheStore.clear();

            // 设置功能开关和配置
            await service.setFeature(tenantId, feature, enabled, mockConfig);

            // 获取功能配置
            const result = await service.getFeatureConfig(tenantId, feature);

            if (!result) return false;

            return result.enabled === enabled;
          },
        ),
        { numRuns: 50 },
      );
    });
  });

  describe('Property: 空输入处理', () => {
    /**
     * 空租户ID应该返回默认值而不是抛出异常
     */
    it('空租户ID的 isEnabled 应该返回 false', async () => {
      await fc.assert(
        fc.asyncProperty(featureKeyArb, async (feature) => {
          const result = await service.isEnabled('', feature);
          return result === false;
        }),
        { numRuns: 50 },
      );
    });

    /**
     * 空功能键应该返回默认值而不是抛出异常
     */
    it('空功能键的 isEnabled 应该返回 false', async () => {
      await fc.assert(
        fc.asyncProperty(tenantIdArb, async (tenantId) => {
          const result = await service.isEnabled(tenantId, '');
          return result === false;
        }),
        { numRuns: 50 },
      );
    });

    /**
     * 空租户ID的 getTenantFeatures 应该返回空对象
     */
    it('空租户ID的 getTenantFeatures 应该返回空对象', async () => {
      const result = await service.getTenantFeatures('');
      return Object.keys(result).length === 0;
    });
  });
});
