import * as fc from 'fast-check';
import { Test, TestingModule } from '@nestjs/testing';
import { Reflector } from '@nestjs/core';
import {
  TenantJobContext,
  TenantJobExecutor,
  TenantJobOptions,
  TenantJobResult,
} from '@/core/tenancy/decorators/tenant-job.decorator';
import { PrismaService } from '@/platform/prisma';

/**
 * Property-Based Tests for TenantJobExecutor
 *
 * Feature: tenant-management-enhancement
 * Property 24: 租户任务遍历正确性
 * Property 25: 租户任务上下文隔离
 * Property 26: 租户任务错误隔离
 * Validates: Requirements 12.2, 12.3, 12.4
 *
 * For any method marked with @TenantJob:
 * - Should iterate through all active tenants
 * - Each tenant execution should have correct context
 * - Errors in one tenant should not affect others (when continueOnError=true)
 */
describe('TenantJobExecutor Property-Based Tests', () => {
  let executor: TenantJobExecutor;
  let mockPrismaService: any;

  // Track execution state for property testing
  let executedTenants: string[];
  let executionContexts: TenantJobContext[];

  beforeEach(async () => {
    executedTenants = [];
    executionContexts = [];

    mockPrismaService = {
      sysTenant: {
        findMany: jest.fn(),
      },
    };

    const modules: TestingModule = await Test.createTestingModule({
      providers: [
        TenantJobExecutor,
        {
          provide: Reflector,
          useValue: {
            get: jest.fn(),
          },
        },
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    executor = modules.get<TenantJobExecutor>(TenantJobExecutor);
  });

  afterEach(() => {
    jest.clearAllMocks();
    executedTenants = [];
    executionContexts = [];
  });

  /**
   * Property 24: 租户任务遍历正确性
   *
   * For any set of active tenants, the job should execute for each tenant exactly once.
   *
   * **Validates: Requirements 12.2**
   */
  it('Property 24: For any set of tenants, job should execute for each tenant exactly once', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate random tenant list
        fc.array(
          fc.record({
            tenantId: fc.string({ minLength: 1, maxLength: 20 }),
            companyName: fc.string({ minLength: 1, maxLength: 50 }),
          }),
          { minLength: 1, maxLength: 10 },
        ),
        async (tenants) => {
          // Ensure unique tenant IDs
          const uniqueTenants = tenants.filter((t, i, arr) => arr.findIndex((x) => x.tenantId === t.tenantId) === i);

          // Reset state
          executedTenants = [];

          // Mock tenant data
          mockPrismaService.sysTenant.findMany.mockResolvedValue(uniqueTenants);

          // Execute job
          const handler = async (context: TenantJobContext) => {
            executedTenants.push(context.tenantId);
          };

          await executor.execute(handler);

          // Property: Each tenant should be executed exactly once
          const expectedTenantIds = uniqueTenants.map((t) => t.tenantId).sort();
          const actualTenantIds = executedTenants.sort();

          return (
            actualTenantIds.length === expectedTenantIds.length &&
            actualTenantIds.every((id, i) => id === expectedTenantIds[i])
          );
        },
      ),
      { numRuns: 100 },
    );
  });

  /**
   * Property 25: 租户任务上下文隔离
   *
   * For any tenant execution, the context should contain the correct tenant information.
   *
   * **Validates: Requirements 12.3**
   */
  it('Property 25: For any tenant execution, context should have correct tenant info', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate random tenant list
        fc.array(
          fc.record({
            tenantId: fc.string({ minLength: 1, maxLength: 20 }),
            companyName: fc.string({ minLength: 1, maxLength: 50 }),
          }),
          { minLength: 1, maxLength: 10 },
        ),
        async (tenants) => {
          // Ensure unique tenant IDs
          const uniqueTenants = tenants.filter((t, i, arr) => arr.findIndex((x) => x.tenantId === t.tenantId) === i);

          // Reset state
          executionContexts = [];

          // Mock tenant data
          mockPrismaService.sysTenant.findMany.mockResolvedValue(uniqueTenants);

          // Execute job and capture contexts
          const handler = async (context: TenantJobContext) => {
            executionContexts.push({ ...context });
          };

          await executor.execute(handler);

          // Property: Each context should match the corresponding tenant
          return executionContexts.every((ctx) => {
            const tenant = uniqueTenants.find((t) => t.tenantId === ctx.tenantId);
            return tenant && ctx.tenantName === tenant.companyName;
          });
        },
      ),
      { numRuns: 100 },
    );
  });

  /**
   * Property 26: 租户任务错误隔离
   *
   * For any tenant that throws an error, other tenants should still execute
   * when continueOnError=true.
   *
   * **Validates: Requirements 12.4**
   */
  it('Property 26: For any failing tenant with continueOnError=true, other tenants should still execute', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate random tenant list (at least 2 tenants)
        fc.array(
          fc.record({
            tenantId: fc.string({ minLength: 1, maxLength: 20 }),
            companyName: fc.string({ minLength: 1, maxLength: 50 }),
          }),
          { minLength: 2, maxLength: 10 },
        ),
        // Generate random index for failing tenant
        fc.nat(),
        async (tenants, failIndexSeed) => {
          // Ensure unique tenant IDs
          const uniqueTenants = tenants.filter((t, i, arr) => arr.findIndex((x) => x.tenantId === t.tenantId) === i);

          if (uniqueTenants.length < 2) {
            return true; // Skip if not enough unique tenants
          }

          const failIndex = failIndexSeed % uniqueTenants.length;
          const failingTenantId = uniqueTenants[failIndex].tenantId;

          // Reset state
          executedTenants = [];

          // Mock tenant data
          mockPrismaService.sysTenant.findMany.mockResolvedValue(uniqueTenants);

          // Execute job with one failing tenant
          const handler = async (context: TenantJobContext) => {
            if (context.tenantId === failingTenantId) {
              throw new Error('Simulated failure');
            }
            executedTenants.push(context.tenantId);
          };

          const results = await executor.execute(handler, { continueOnError: true });

          // Property: All non-failing tenants should have executed
          const expectedSuccessCount = uniqueTenants.length - 1;
          const actualSuccessCount = results.filter((r) => r.success).length;
          const failedCount = results.filter((r) => !r.success).length;

          return (
            actualSuccessCount === expectedSuccessCount &&
            failedCount === 1 &&
            executedTenants.length === expectedSuccessCount
          );
        },
      ),
      { numRuns: 100 },
    );
  });

  /**
   * Property 26b: Error should stop execution when continueOnError=false
   *
   * For any tenant that throws an error with continueOnError=false,
   * execution should stop immediately.
   *
   * **Validates: Requirements 12.4**
   */
  it('Property 26b: For any failing tenant with continueOnError=false, execution should stop', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate random tenant list (at least 3 tenants)
        fc.array(
          fc.record({
            tenantId: fc.string({ minLength: 1, maxLength: 20 }),
            companyName: fc.string({ minLength: 1, maxLength: 50 }),
          }),
          { minLength: 3, maxLength: 10 },
        ),
        async (tenants) => {
          // Ensure unique tenant IDs
          const uniqueTenants = tenants.filter((t, i, arr) => arr.findIndex((x) => x.tenantId === t.tenantId) === i);

          if (uniqueTenants.length < 3) {
            return true; // Skip if not enough unique tenants
          }

          // Fail on the second tenant (index 1)
          const failingTenantId = uniqueTenants[1].tenantId;

          // Reset state
          executedTenants = [];

          // Mock tenant data
          mockPrismaService.sysTenant.findMany.mockResolvedValue(uniqueTenants);

          // Execute job with one failing tenant
          const handler = async (context: TenantJobContext) => {
            if (context.tenantId === failingTenantId) {
              throw new Error('Simulated failure');
            }
            executedTenants.push(context.tenantId);
          };

          const results = await executor.execute(handler, { continueOnError: false });

          // Property: Execution should stop after the failing tenant
          // Only the first tenant should have succeeded, then the second failed
          return (
            results.length === 2 && // Only 2 results (1 success + 1 failure)
            results[0].success === true &&
            results[1].success === false &&
            executedTenants.length === 1 // Only first tenant executed successfully
          );
        },
      ),
      { numRuns: 100 },
    );
  });

  /**
   * Property 24b: Parallel execution should process all tenants
   *
   * For any set of tenants with parallel=true, all tenants should be processed.
   *
   * **Validates: Requirements 12.2**
   */
  it('Property 24b: For any set of tenants with parallel=true, all should be processed', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate random tenant list
        fc.array(
          fc.record({
            tenantId: fc.string({ minLength: 1, maxLength: 20 }),
            companyName: fc.string({ minLength: 1, maxLength: 50 }),
          }),
          { minLength: 1, maxLength: 10 },
        ),
        // Generate random concurrency
        fc.integer({ min: 1, max: 5 }),
        async (tenants, maxConcurrency) => {
          // Ensure unique tenant IDs
          const uniqueTenants = tenants.filter((t, i, arr) => arr.findIndex((x) => x.tenantId === t.tenantId) === i);

          // Reset state
          executedTenants = [];

          // Mock tenant data
          mockPrismaService.sysTenant.findMany.mockResolvedValue(uniqueTenants);

          // Execute job in parallel
          const handler = async (context: TenantJobContext) => {
            executedTenants.push(context.tenantId);
          };

          const results = await executor.execute(handler, {
            parallel: true,
            maxConcurrency,
          });

          // Property: All tenants should be processed
          const expectedTenantIds = new Set(uniqueTenants.map((t) => t.tenantId));
          const actualTenantIds = new Set(executedTenants);

          return (
            results.length === uniqueTenants.length &&
            actualTenantIds.size === expectedTenantIds.size &&
            [...expectedTenantIds].every((id) => actualTenantIds.has(id))
          );
        },
      ),
      { numRuns: 100 },
    );
  });

  /**
   * Property: Summary should correctly aggregate results
   *
   * **Validates: Requirements 12.4**
   */
  it('Property: Summary should correctly aggregate results', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate random results
        fc.array(
          fc.record({
            tenantId: fc.string({ minLength: 1, maxLength: 20 }),
            success: fc.boolean(),
            duration: fc.integer({ min: 0, max: 10000 }),
          }),
          { minLength: 1, maxLength: 20 },
        ),
        async (results) => {
          const typedResults: TenantJobResult[] = results.map((r) => ({
            tenantId: r.tenantId,
            success: r.success,
            duration: r.duration,
            error: r.success ? undefined : new Error('test'),
          }));

          const summary = executor.getSummary(typedResults);

          // Property: Summary should match calculated values
          const expectedTotal = typedResults.length;
          const expectedSuccess = typedResults.filter((r) => r.success).length;
          const expectedFailed = typedResults.filter((r) => !r.success).length;
          const expectedTotalDuration = typedResults.reduce((sum, r) => sum + r.duration, 0);
          const expectedAvgDuration = expectedTotal > 0 ? expectedTotalDuration / expectedTotal : 0;

          return (
            summary.total === expectedTotal &&
            summary.success === expectedSuccess &&
            summary.failed === expectedFailed &&
            summary.totalDuration === expectedTotalDuration &&
            Math.abs(summary.averageDuration - expectedAvgDuration) < 0.001
          );
        },
      ),
      { numRuns: 100 },
    );
  });
});
