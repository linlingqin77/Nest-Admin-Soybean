import * as fc from 'fast-check';
import { Test, TestingModule } from '@nestjs/testing';
import { TenantQuotaService, QuotaResource } from './quota.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { RedisService } from 'src/module/common/redis/redis.service';
import { BusinessException } from 'src/common/exceptions';
import { createRedisMock, RedisMock } from 'src/test-utils/redis-mock';

/**
 * Property-Based Tests for TenantQuotaService
 *
 * Feature: enterprise-app-optimization
 * Property 10: 租户配额限制
 * Validates: Requirements 5.5
 *
 * For any tenant, when resource usage reaches the quota limit,
 * subsequent resource creation requests should be rejected.
 */
describe('TenantQuotaService Property-Based Tests', () => {
  let service: TenantQuotaService;
  let prismaService: PrismaService;
  let redisService: RedisMock;

  // Storage for simulating database
  let tenantData: Record<string, { accountCount: number; storageQuota: number; apiQuota: number; storageUsed: number }>;
  let userCounts: Record<string, number>;
  let usageData: Record<string, { apiCalls: number; storageUsed: number; userCount: number }>;

  beforeEach(async () => {
    tenantData = {};
    userCounts = {};
    usageData = {};
    redisService = createRedisMock();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TenantQuotaService,
        {
          provide: PrismaService,
          useValue: {
            sysTenant: {
              findUnique: jest.fn().mockImplementation(async ({ where }) => {
                return tenantData[where.tenantId] || null;
              }),
              update: jest.fn().mockImplementation(async ({ where, data }) => {
                if (tenantData[where.tenantId] && data.storageUsed !== undefined) {
                  tenantData[where.tenantId].storageUsed = data.storageUsed;
                }
                return tenantData[where.tenantId];
              }),
            },
            sysUser: {
              count: jest.fn().mockImplementation(async ({ where }) => {
                return userCounts[where.tenantId] || 0;
              }),
            },
            sysTenantUsage: {
              findUnique: jest.fn().mockImplementation(async ({ where }) => {
                const key = where.tenantId_date.tenantId;
                return usageData[key] ? { ...usageData[key], tenantId: key, date: where.tenantId_date.date } : null;
              }),
              findMany: jest.fn().mockResolvedValue([]),
              upsert: jest.fn().mockImplementation(async ({ where, update, create }) => {
                const key = where.tenantId_date.tenantId;
                if (!usageData[key]) {
                  usageData[key] = { apiCalls: 0, storageUsed: 0, userCount: 0 };
                }
                if (update.apiCalls?.increment) {
                  usageData[key].apiCalls += update.apiCalls.increment;
                }
                if (update.storageUsed !== undefined && typeof update.storageUsed === 'number') {
                  usageData[key].storageUsed = update.storageUsed;
                }
                if (update.userCount !== undefined && typeof update.userCount === 'number') {
                  usageData[key].userCount = update.userCount;
                }
                return { ...usageData[key], tenantId: key, date: where.tenantId_date.date };
              }),
            },
          },
        },
        {
          provide: RedisService,
          useValue: redisService,
        },
      ],
    }).compile();

    service = module.get<TenantQuotaService>(TenantQuotaService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  /**
   * Property 10a: Quota Enforcement for Users
   *
   * For any tenant with a user quota limit N, when the current user count
   * reaches N, the quota check should return allowed=false.
   *
   * **Validates: Requirements 5.5**
   */
  it('Property 10a: User quota should be enforced when limit is reached', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 100 }), // quota
        fc.integer({ min: 0, max: 150 }), // currentUsage
        async (quota, currentUsage) => {
          const tenantId = '100001';
          tenantData[tenantId] = { accountCount: quota, storageQuota: 1024, apiQuota: 1000, storageUsed: 0 };
          userCounts[tenantId] = currentUsage;
          redisService.get.mockResolvedValue(null);

          const result = await service.checkQuota(tenantId, QuotaResource.USERS);
          const expectedAllowed = currentUsage < quota;
          return result.allowed === expectedAllowed;
        },
      ),
      { numRuns: 50 },
    );
  });

  /**
   * Property 10b: Unlimited Quota (-1) Always Allows
   *
   * For any tenant with unlimited quota (-1), the quota check should
   * always return allowed=true regardless of current usage.
   *
   * **Validates: Requirements 5.5**
   */
  it('Property 10b: Unlimited quota (-1) should always allow', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 0, max: 10000 }), // currentUsage
        async (currentUsage) => {
          const tenantId = '100002';
          tenantData[tenantId] = { accountCount: -1, storageQuota: -1, apiQuota: -1, storageUsed: 0 };
          userCounts[tenantId] = currentUsage;
          redisService.get.mockResolvedValue(null);

          const result = await service.checkQuota(tenantId, QuotaResource.USERS);
          return result.allowed === true && result.quota === -1 && result.remaining === -1;
        },
      ),
      { numRuns: 50 },
    );
  });

  /**
   * Property 10c: Remaining Quota Calculation
   *
   * For any tenant with a finite quota, the remaining quota should equal
   * quota - currentUsage (but never negative).
   *
   * **Validates: Requirements 5.5**
   */
  it('Property 10c: Remaining quota should be correctly calculated', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 100 }), // quota
        fc.integer({ min: 0, max: 150 }), // currentUsage
        async (quota, currentUsage) => {
          const tenantId = '100003';
          tenantData[tenantId] = { accountCount: quota, storageQuota: 1024, apiQuota: 1000, storageUsed: 0 };
          userCounts[tenantId] = currentUsage;
          redisService.get.mockResolvedValue(null);

          const result = await service.checkQuota(tenantId, QuotaResource.USERS);
          const expectedRemaining = Math.max(0, quota - currentUsage);
          return result.remaining === expectedRemaining;
        },
      ),
      { numRuns: 50 },
    );
  });

  /**
   * Property 10d: Storage Quota Enforcement
   *
   * For any tenant with a storage quota limit, when the current storage usage
   * reaches the limit, the quota check should return allowed=false.
   *
   * **Validates: Requirements 5.5**
   */
  it('Property 10d: Storage quota should be enforced when limit is reached', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 100, max: 10000 }), // storageQuota
        fc.integer({ min: 0, max: 15000 }), // storageUsed
        async (storageQuota, storageUsed) => {
          const tenantId = '100004';
          tenantData[tenantId] = { accountCount: 100, storageQuota, apiQuota: 1000, storageUsed };
          redisService.get.mockResolvedValue(null);

          const result = await service.checkQuota(tenantId, QuotaResource.STORAGE);
          const expectedAllowed = storageUsed < storageQuota;
          return result.allowed === expectedAllowed;
        },
      ),
      { numRuns: 50 },
    );
  });

  /**
   * Property 10e: API Calls Quota Enforcement
   *
   * For any tenant with an API calls quota limit, when the current API calls
   * reach the limit, the quota check should return allowed=false.
   *
   * **Validates: Requirements 5.5**
   */
  it('Property 10e: API calls quota should be enforced when limit is reached', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 100, max: 10000 }), // apiQuota
        fc.integer({ min: 0, max: 15000 }), // apiCalls
        async (apiQuota, apiCalls) => {
          const tenantId = '100005';
          tenantData[tenantId] = { accountCount: 100, storageQuota: 1024, apiQuota, storageUsed: 0 };
          usageData[tenantId] = { apiCalls, storageUsed: 0, userCount: 0 };
          redisService.get.mockResolvedValue(null);

          const result = await service.checkQuota(tenantId, QuotaResource.API_CALLS);
          const expectedAllowed = apiCalls < apiQuota;
          return result.allowed === expectedAllowed;
        },
      ),
      { numRuns: 50 },
    );
  });

  /**
   * Property 10f: checkQuotaOrThrow Consistency
   *
   * For any quota check, checkQuotaOrThrow should throw BusinessException
   * if and only if checkQuota returns allowed=false.
   *
   * **Validates: Requirements 5.5**
   */
  it('Property 10f: checkQuotaOrThrow should throw iff checkQuota returns allowed=false', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 50 }), // quota
        fc.integer({ min: 0, max: 60 }), // currentUsage
        async (quota, currentUsage) => {
          const tenantId = '100006';
          tenantData[tenantId] = { accountCount: quota, storageQuota: 1024, apiQuota: 1000, storageUsed: 0 };
          userCounts[tenantId] = currentUsage;
          redisService.get.mockResolvedValue(null);

          const checkResult = await service.checkQuota(tenantId, QuotaResource.USERS);

          let threw = false;
          try {
            await service.checkQuotaOrThrow(tenantId, QuotaResource.USERS);
          } catch (e) {
            if (e instanceof BusinessException) {
              threw = true;
            }
          }

          return threw === !checkResult.allowed;
        },
      ),
      { numRuns: 50 },
    );
  });

  /**
   * Property 10g: Current Usage Accuracy
   *
   * For any tenant, the currentUsage in quota check result should match
   * the actual resource usage.
   *
   * **Validates: Requirements 5.5, 5.6**
   */
  it('Property 10g: currentUsage should accurately reflect actual usage', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 0, max: 100 }), // userCount
        async (userCount) => {
          const tenantId = '100007';
          tenantData[tenantId] = { accountCount: 200, storageQuota: 10240, apiQuota: 10000, storageUsed: 0 };
          userCounts[tenantId] = userCount;
          redisService.get.mockResolvedValue(null);

          const result = await service.checkQuota(tenantId, QuotaResource.USERS);
          return result.currentUsage === userCount;
        },
      ),
      { numRuns: 50 },
    );
  });
});
