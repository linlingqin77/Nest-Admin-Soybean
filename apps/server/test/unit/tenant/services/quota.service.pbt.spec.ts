import * as fc from 'fast-check';
import { Test, TestingModule } from '@nestjs/testing';
import { QuotaResource, TenantQuotaService } from '@/core/tenancy/services/quota.service';
import { PrismaService } from '@/platform/prisma';
import { RedisService } from '@/platform/redis/redis.service';

/**
 * TenantQuotaService 属性测试
 *
 * 验证配额服务的核心属性：
 * - Property 5: 配额检查正确性
 */
describe('TenantQuotaService - Property Tests', () => {
  let service: TenantQuotaService;

  // 模拟数据存储
  let tenantQuotas: Map<string, { accountCount: number; storageQuota: number; apiQuota: number }>;
  let tenantUsage: Map<string, { users: number; storage: number; apiCalls: number }>;

  const mockRedisClient = {
    expire: jest.fn().mockResolvedValue(1),
    incrby: jest.fn().mockResolvedValue(1),
  };

  const mockPrismaService = {
    sysTenant: {
      findUnique: jest.fn().mockImplementation(({ where }) => {
        const quota = tenantQuotas.get(where.tenantId);
        if (!quota) return Promise.resolve(null);
        const usage = tenantUsage.get(where.tenantId) || { users: 0, storage: 0, apiCalls: 0 };
        return Promise.resolve({
          ...quota,
          storageUsed: usage.storage,
        });
      }),
      update: jest.fn().mockResolvedValue({}),
    },
    sysUser: {
      count: jest.fn().mockImplementation(({ where }) => {
        const usage = tenantUsage.get(where.tenantId);
        return Promise.resolve(usage?.users ?? 0);
      }),
    },
    sysTenantUsage: {
      findUnique: jest.fn().mockImplementation(({ where }) => {
        const usage = tenantUsage.get(where.tenantId_date.tenantId);
        if (!usage) return Promise.resolve(null);
        return Promise.resolve({
          apiCalls: usage.apiCalls,
          storageUsed: usage.storage,
          userCount: usage.users,
        });
      }),
      findMany: jest.fn().mockResolvedValue([]),
      upsert: jest.fn().mockResolvedValue({}),
    },
  };

  const mockRedisService = {
    get: jest.fn().mockResolvedValue(null), // 总是从数据库获取
    set: jest.fn().mockResolvedValue('OK'),
    del: jest.fn().mockResolvedValue(1),
    getClient: jest.fn(() => mockRedisClient),
  };

  beforeEach(async () => {
    // 重置存储
    tenantQuotas = new Map();
    tenantUsage = new Map();

    const modules: TestingModule = await Test.createTestingModule({
      providers: [
        TenantQuotaService,
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

    service = modules.get<TenantQuotaService>(TenantQuotaService);
  });

  // 生成有效的租户ID
  const tenantIdArb = fc.integer({ min: 100001, max: 999999 }).map((n) => n.toString());

  // 生成配额值（-1 表示无限制，或正整数）
  const quotaValueArb = fc.oneof(
    fc.constant(-1), // 无限制
    fc.integer({ min: 1, max: 10000 }), // 有限配额
  );

  // 生成使用量（非负整数）
  const usageValueArb = fc.integer({ min: 0, max: 20000 });

  describe('Property 5: 配额检查正确性', () => {
    /**
     * **Validates: Requirements 6.3, 6.4, 9.3**
     * 当配额为 -1（无限制）时，无论使用量多少，都应该返回 allowed=true
     */
    it('配额为 -1 时应该始终返回 allowed=true', async () => {
      await fc.assert(
        fc.asyncProperty(tenantIdArb, usageValueArb, async (tenantId, usage) => {
          // 设置无限制配额
          tenantQuotas.set(tenantId, {
            accountCount: -1,
            storageQuota: -1,
            apiQuota: -1,
          });
          tenantUsage.set(tenantId, {
            users: usage,
            storage: usage,
            apiCalls: usage,
          });

          const userResult = await service.checkQuota(tenantId, QuotaResource.USERS);
          const storageResult = await service.checkQuota(tenantId, QuotaResource.STORAGE);
          const apiResult = await service.checkQuota(tenantId, QuotaResource.API_CALLS);

          return (
            userResult.allowed === true &&
            userResult.quota === -1 &&
            userResult.remaining === -1 &&
            storageResult.allowed === true &&
            apiResult.allowed === true
          );
        }),
        { numRuns: 100 },
      );
    });

    /**
     * **Validates: Requirements 6.3, 6.4, 9.3**
     * 当使用量小于配额时，应该返回 allowed=true
     */
    it('使用量小于配额时应该返回 allowed=true', async () => {
      await fc.assert(
        fc.asyncProperty(
          tenantIdArb,
          fc.integer({ min: 2, max: 10000 }), // 配额至少为2
          async (tenantId, quota) => {
            // 使用量为配额的一半（确保小于配额）
            const usage = Math.floor(quota / 2);

            tenantQuotas.set(tenantId, {
              accountCount: quota,
              storageQuota: quota,
              apiQuota: quota,
            });
            tenantUsage.set(tenantId, {
              users: usage,
              storage: usage,
              apiCalls: usage,
            });

            const result = await service.checkQuota(tenantId, QuotaResource.USERS);

            return (
              result.allowed === true &&
              result.currentUsage === usage &&
              result.quota === quota &&
              result.remaining === quota - usage
            );
          },
        ),
        { numRuns: 100 },
      );
    });

    /**
     * **Validates: Requirements 6.3, 6.4, 9.3**
     * 当使用量等于配额时，应该返回 allowed=false
     */
    it('使用量等于配额时应该返回 allowed=false', async () => {
      await fc.assert(
        fc.asyncProperty(tenantIdArb, fc.integer({ min: 1, max: 10000 }), async (tenantId, quota) => {
          tenantQuotas.set(tenantId, {
            accountCount: quota,
            storageQuota: quota,
            apiQuota: quota,
          });
          tenantUsage.set(tenantId, {
            users: quota,
            storage: quota,
            apiCalls: quota,
          });

          const result = await service.checkQuota(tenantId, QuotaResource.USERS);

          return (
            result.allowed === false &&
            result.currentUsage === quota &&
            result.quota === quota &&
            result.remaining === 0
          );
        }),
        { numRuns: 100 },
      );
    });

    /**
     * **Validates: Requirements 6.3, 6.4, 9.3**
     * 当使用量大于配额时，应该返回 allowed=false
     */
    it('使用量大于配额时应该返回 allowed=false', async () => {
      await fc.assert(
        fc.asyncProperty(
          tenantIdArb,
          fc.integer({ min: 1, max: 5000 }),
          fc.integer({ min: 1, max: 5000 }),
          async (tenantId, quota, extra) => {
            const usage = quota + extra; // 确保使用量大于配额

            tenantQuotas.set(tenantId, {
              accountCount: quota,
              storageQuota: quota,
              apiQuota: quota,
            });
            tenantUsage.set(tenantId, {
              users: usage,
              storage: usage,
              apiCalls: usage,
            });

            const result = await service.checkQuota(tenantId, QuotaResource.USERS);

            return (
              result.allowed === false &&
              result.currentUsage === usage &&
              result.quota === quota &&
              result.remaining === 0
            );
          },
        ),
        { numRuns: 100 },
      );
    });

    /**
     * **Validates: Requirements 6.3, 6.4, 9.3**
     * remaining 应该等于 max(0, quota - currentUsage)，除非配额为 -1
     */
    it('remaining 应该正确计算', async () => {
      await fc.assert(
        fc.asyncProperty(
          tenantIdArb,
          fc.integer({ min: 1, max: 10000 }),
          fc.integer({ min: 0, max: 20000 }),
          async (tenantId, quota, usage) => {
            tenantQuotas.set(tenantId, {
              accountCount: quota,
              storageQuota: quota,
              apiQuota: quota,
            });
            tenantUsage.set(tenantId, {
              users: usage,
              storage: usage,
              apiCalls: usage,
            });

            const result = await service.checkQuota(tenantId, QuotaResource.USERS);
            const expectedRemaining = Math.max(0, quota - usage);

            return result.remaining === expectedRemaining;
          },
        ),
        { numRuns: 100 },
      );
    });
  });

  describe('Property: 配额检查一致性', () => {
    /**
     * 对于相同的输入，配额检查应该返回相同的结果
     */
    it('相同输入应该返回相同结果', async () => {
      await fc.assert(
        fc.asyncProperty(
          tenantIdArb,
          fc.integer({ min: 1, max: 10000 }),
          fc.integer({ min: 0, max: 20000 }),
          async (tenantId, quota, usage) => {
            tenantQuotas.set(tenantId, {
              accountCount: quota,
              storageQuota: quota,
              apiQuota: quota,
            });
            tenantUsage.set(tenantId, {
              users: usage,
              storage: usage,
              apiCalls: usage,
            });

            const result1 = await service.checkQuota(tenantId, QuotaResource.USERS);
            const result2 = await service.checkQuota(tenantId, QuotaResource.USERS);

            return (
              result1.allowed === result2.allowed &&
              result1.currentUsage === result2.currentUsage &&
              result1.quota === result2.quota &&
              result1.remaining === result2.remaining
            );
          },
        ),
        { numRuns: 50 },
      );
    });
  });

  describe('Property: 不同资源类型独立检查', () => {
    /**
     * 不同资源类型的配额检查应该独立
     */
    it('不同资源类型的配额检查应该独立', async () => {
      await fc.assert(
        fc.asyncProperty(
          tenantIdArb,
          fc.integer({ min: 1, max: 10000 }),
          fc.integer({ min: 1, max: 10000 }),
          fc.integer({ min: 1, max: 10000 }),
          fc.integer({ min: 0, max: 20000 }),
          fc.integer({ min: 0, max: 20000 }),
          fc.integer({ min: 0, max: 20000 }),
          async (tenantId, userQuota, storageQuota, apiQuota, userUsage, storageUsage, apiUsage) => {
            tenantQuotas.set(tenantId, {
              accountCount: userQuota,
              storageQuota: storageQuota,
              apiQuota: apiQuota,
            });
            tenantUsage.set(tenantId, {
              users: userUsage,
              storage: storageUsage,
              apiCalls: apiUsage,
            });

            const userResult = await service.checkQuota(tenantId, QuotaResource.USERS);
            const storageResult = await service.checkQuota(tenantId, QuotaResource.STORAGE);
            const apiResult = await service.checkQuota(tenantId, QuotaResource.API_CALLS);

            // 验证每个资源类型使用正确的配额和使用量
            const userCorrect = userResult.quota === userQuota && userResult.currentUsage === userUsage;
            const storageCorrect = storageResult.quota === storageQuota && storageResult.currentUsage === storageUsage;
            const apiCorrect = apiResult.quota === apiQuota && apiResult.currentUsage === apiUsage;

            return userCorrect && storageCorrect && apiCorrect;
          },
        ),
        { numRuns: 50 },
      );
    });
  });

  describe('Property: 租户隔离', () => {
    /**
     * 不同租户的配额检查应该独立
     */
    it('不同租户的配额检查应该独立', async () => {
      await fc.assert(
        fc.asyncProperty(
          tenantIdArb,
          tenantIdArb,
          fc.integer({ min: 1, max: 10000 }),
          fc.integer({ min: 1, max: 10000 }),
          fc.integer({ min: 0, max: 20000 }),
          fc.integer({ min: 0, max: 20000 }),
          async (tenant1, tenant2, quota1, quota2, usage1, usage2) => {
            // 确保两个租户ID不同
            fc.pre(tenant1 !== tenant2);

            tenantQuotas.set(tenant1, {
              accountCount: quota1,
              storageQuota: quota1,
              apiQuota: quota1,
            });
            tenantQuotas.set(tenant2, {
              accountCount: quota2,
              storageQuota: quota2,
              apiQuota: quota2,
            });
            tenantUsage.set(tenant1, {
              users: usage1,
              storage: usage1,
              apiCalls: usage1,
            });
            tenantUsage.set(tenant2, {
              users: usage2,
              storage: usage2,
              apiCalls: usage2,
            });

            const result1 = await service.checkQuota(tenant1, QuotaResource.USERS);
            const result2 = await service.checkQuota(tenant2, QuotaResource.USERS);

            // 验证每个租户使用自己的配额和使用量
            const tenant1Correct = result1.quota === quota1 && result1.currentUsage === usage1;
            const tenant2Correct = result2.quota === quota2 && result2.currentUsage === usage2;

            return tenant1Correct && tenant2Correct;
          },
        ),
        { numRuns: 50 },
      );
    });
  });
});
