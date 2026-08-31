import * as fc from 'fast-check';
import { Test, TestingModule } from '@nestjs/testing';
import { TenantLifecycleService } from '@/core/tenancy/services/tenant-lifecycle.service';
import { PrismaService } from '@/platform/prisma';

// 属性测试配置
const PBT_CONFIG = { numRuns: 100 };

describe('TenantLifecycleService - Property Tests', () => {
  let service: TenantLifecycleService;
  let mockPrismaService: any;

  beforeEach(async () => {
    mockPrismaService = {
      sysTenant: {
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      sysDept: {
        create: jest.fn(),
      },
      sysRole: {
        create: jest.fn(),
      },
      sysUser: {
        create: jest.fn(),
      },
      sysUserRole: {
        create: jest.fn(),
      },
    };

    const modules: TestingModule = await Test.createTestingModule({
      providers: [
        TenantLifecycleService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = modules.get<TenantLifecycleService>(TenantLifecycleService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Property 4: 租户ID生成格式', () => {
    /**
     * **Validates: Requirements 5.1, 9.2, 9.5**
     * 对于任意生成的租户ID，格式应该为数字字符串，且值应该大于等于 100001
     */
    it('生成的租户ID应该是有效的数字字符串', async () => {
      await fc.assert(
        fc.asyncProperty(fc.integer({ min: 100001, max: 999999 }), async (lastTenantId) => {
          mockPrismaService.sysTenant.findFirst.mockResolvedValue({
            tenantId: lastTenantId.toString(),
          });

          const newTenantId = await service.generateTenantId();

          // 验证是数字字符串
          const parsed = parseInt(newTenantId, 10);
          expect(isNaN(parsed)).toBe(false);

          // 验证大于等于 100001
          expect(parsed).toBeGreaterThanOrEqual(100001);

          // 验证是上一个ID加1
          expect(parsed).toBe(lastTenantId + 1);

          return true;
        }),
        PBT_CONFIG,
      );
    });

    /**
     * **Validates: Requirements 5.1**
     * 当没有现有租户时，应该返回 100001
     */
    it('没有现有租户时应该返回 100001', async () => {
      mockPrismaService.sysTenant.findFirst.mockResolvedValue(null);

      const tenantId = await service.generateTenantId();

      expect(tenantId).toBe('100001');
      expect(parseInt(tenantId, 10)).toBe(100001);
    });

    /**
     * **Validates: Requirements 9.5**
     * 租户ID应该是递增的
     */
    it('租户ID应该是递增的', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(fc.integer({ min: 100001, max: 999998 }), { minLength: 2, maxLength: 10 }),
          async (tenantIds) => {
            // 排序以模拟递增的租户ID
            const sortedIds = [...tenantIds].sort((a, b) => a - b);

            for (let i = 0; i < sortedIds.length; i++) {
              mockPrismaService.sysTenant.findFirst.mockResolvedValue({
                tenantId: sortedIds[i].toString(),
              });

              const newTenantId = await service.generateTenantId();
              const newId = parseInt(newTenantId, 10);

              // 新ID应该大于当前最大ID
              expect(newId).toBeGreaterThan(sortedIds[i]);
            }

            return true;
          },
        ),
        { numRuns: 20 }, // 减少运行次数因为这个测试较慢
      );
    });
  });

  describe('Property: 租户创建一致性', () => {
    /**
     * 创建租户时应该使用生成的租户ID
     */
    it('创建租户应该使用正确的租户ID', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            companyName: fc.string({ minLength: 1, maxLength: 50 }),
            contactUserName: fc.option(fc.string({ minLength: 1, maxLength: 20 })),
            contactPhone: fc.option(fc.string({ minLength: 11, maxLength: 11 })),
            accountCount: fc.option(fc.integer({ min: 1, max: 1000 })),
          }),
          async (params) => {
            mockPrismaService.sysTenant.findFirst.mockResolvedValue(null);
            mockPrismaService.sysTenant.create.mockResolvedValue({ tenantId: '100001' });

            const tenantId = await service.createTenant({
              companyName: params.companyName,
              contactUserName: params.contactUserName ?? undefined,
              contactPhone: params.contactPhone ?? undefined,
              accountCount: params.accountCount ?? undefined,
            });

            // 验证返回的租户ID
            expect(tenantId).toBe('100001');

            // 验证创建时使用了正确的数据
            expect(mockPrismaService.sysTenant.create).toHaveBeenCalledWith({
              data: expect.objectContaining({
                tenantId: '100001',
                companyName: params.companyName,
              }),
            });

            return true;
          },
        ),
        { numRuns: 50 },
      );
    });
  });

  describe('Property: 租户可用性检查一致性', () => {
    /**
     * 正常状态、未删除、未过期的租户应该可用
     */
    it('正常租户应该可用', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 100001, max: 999999 }),
          // 使用明天之后的日期，避免边界情况
          fc.date({
            min: new Date(Date.now() + 24 * 60 * 60 * 1000),
            max: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
          }),
          async (tenantIdNum, futureDate) => {
            const tenantId = tenantIdNum.toString();
            mockPrismaService.sysTenant.findUnique.mockResolvedValue({
              status: '0', // NORMAL
              delFlag: '0',
              expireTime: futureDate,
            });

            const result = await service.isTenantAvailable(tenantId);

            expect(result).toBe(true);
            return true;
          },
        ),
        PBT_CONFIG,
      );
    });

    /**
     * 已删除的租户应该不可用
     */
    it('已删除的租户应该不可用', async () => {
      await fc.assert(
        fc.asyncProperty(fc.integer({ min: 100001, max: 999999 }), async (tenantIdNum) => {
          const tenantId = tenantIdNum.toString();
          mockPrismaService.sysTenant.findUnique.mockResolvedValue({
            status: '0',
            delFlag: '2', // 已删除
            expireTime: null,
          });

          const result = await service.isTenantAvailable(tenantId);

          expect(result).toBe(false);
          return true;
        }),
        PBT_CONFIG,
      );
    });

    /**
     * 已过期的租户应该不可用
     */
    it('已过期的租户应该不可用', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 100001, max: 999999 }),
          fc.integer({ min: 1, max: 365 }), // 过期天数
          async (tenantIdNum, daysAgo) => {
            const tenantId = tenantIdNum.toString();
            const pastDate = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);

            mockPrismaService.sysTenant.findUnique.mockResolvedValue({
              status: '0',
              delFlag: '0',
              expireTime: pastDate,
            });

            const result = await service.isTenantAvailable(tenantId);

            expect(result).toBe(false);
            return true;
          },
        ),
        PBT_CONFIG,
      );
    });
  });
});
