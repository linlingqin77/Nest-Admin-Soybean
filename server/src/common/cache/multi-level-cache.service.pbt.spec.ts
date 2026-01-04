import * as fc from 'fast-check';
import { Test, TestingModule } from '@nestjs/testing';
import { MultiLevelCacheService } from './multi-level-cache.service';
import { RedisService } from 'src/module/common/redis/redis.service';

/**
 * Property-Based Tests for MultiLevelCacheService
 *
 * Feature: enterprise-app-optimization
 * Property 2: 缓存一致性
 * Validates: Requirements 1.9, 8.1
 *
 * For any data update operation, the updated data should be correctly invalidated
 * or updated in the cache, and subsequent queries should return the latest data.
 */
describe('MultiLevelCacheService Property-Based Tests', () => {
  let service: MultiLevelCacheService;
  let mockRedisService: jest.Mocked<RedisService>;

  // Simulated Redis storage for property testing
  let redisStorage: Map<string, { value: unknown; expireAt?: number }>;

  beforeEach(async () => {
    redisStorage = new Map();

    mockRedisService = {
      get: jest.fn().mockImplementation(async (key: string) => {
        const entry = redisStorage.get(key);
        if (!entry) return null;
        if (entry.expireAt && Date.now() > entry.expireAt) {
          redisStorage.delete(key);
          return null;
        }
        return entry.value;
      }),
      set: jest.fn().mockImplementation(async (key: string, value: unknown, ttlMs?: number) => {
        redisStorage.set(key, {
          value,
          expireAt: ttlMs ? Date.now() + ttlMs : undefined,
        });
        return 'OK';
      }),
      del: jest.fn().mockImplementation(async (keys: string | string[]) => {
        const keyArray = Array.isArray(keys) ? keys : [keys];
        let deleted = 0;
        keyArray.forEach((key) => {
          if (redisStorage.delete(key)) deleted++;
        });
        return deleted;
      }),
    } as unknown as jest.Mocked<RedisService>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MultiLevelCacheService,
        {
          provide: RedisService,
          useValue: mockRedisService,
        },
      ],
    }).compile();

    service = module.get<MultiLevelCacheService>(MultiLevelCacheService);
    service.resetStats();
    service.flushL1();
  });

  afterEach(() => {
    jest.clearAllMocks();
    redisStorage.clear();
  });

  /**
   * Property 2a: Cache Write-Through Consistency
   *
   * For any key-value pair, after setting the cache, subsequent get operations
   * should return the same value.
   *
   * **Validates: Requirements 1.9, 8.1**
   */
  it('Property 2a: For any set operation, subsequent get should return the same value', async () => {
    // Reserved property names that could cause issues
    const reservedNames = [
      'valueOf',
      'toString',
      'constructor',
      'prototype',
      '__proto__',
      'hasOwnProperty',
    ];

    await fc.assert(
      fc.asyncProperty(
        // Generate random cache keys (excluding reserved names)
        fc
          .string({ minLength: 1, maxLength: 50 })
          .filter((s) => s.trim().length > 0 && !reservedNames.includes(s)),
        // Generate random cache values (objects, strings, numbers, arrays)
        fc.oneof(
          fc.record({
            id: fc.integer({ min: 1, max: 10000 }),
            name: fc.string({ minLength: 1, maxLength: 50 }),
            active: fc.boolean(),
          }),
          fc.string({ minLength: 1, maxLength: 100 }),
          fc.integer({ min: -10000, max: 10000 }),
          fc.array(fc.integer(), { minLength: 0, maxLength: 10 }),
        ),
        // Generate random TTL (60-600 seconds)
        fc.integer({ min: 60, max: 600 }),
        async (key, value, ttl) => {
          // Set the value
          await service.set(key, value, ttl);

          // Get the value back
          const retrieved = await service.get(key);

          // Property: Retrieved value should equal the set value
          return JSON.stringify(retrieved) === JSON.stringify(value);
        },
      ),
      { numRuns: 100 },
    );
  });

  /**
   * Property 2b: Cache Update Consistency
   *
   * For any key, when the value is updated, subsequent get operations
   * should return the new value, not the old value.
   *
   * **Validates: Requirements 1.9, 8.1**
   */
  it('Property 2b: For any update operation, subsequent get should return the new value', async () => {
    // Reserved property names that could cause issues
    const reservedNames = [
      'valueOf',
      'toString',
      'constructor',
      'prototype',
      '__proto__',
      'hasOwnProperty',
    ];

    await fc.assert(
      fc.asyncProperty(
        // Generate random cache key (excluding reserved names)
        fc
          .string({ minLength: 1, maxLength: 50 })
          .filter((s) => s.trim().length > 0 && !reservedNames.includes(s)),
        // Generate two different values
        fc.record({
          id: fc.integer({ min: 1, max: 10000 }),
          version: fc.constant(1),
        }),
        fc.record({
          id: fc.integer({ min: 1, max: 10000 }),
          version: fc.constant(2),
        }),
        async (key, oldValue, newValue) => {
          // Set initial value
          await service.set(key, oldValue, 300);

          // Verify initial value is cached
          const initial = await service.get(key);
          if (JSON.stringify(initial) !== JSON.stringify(oldValue)) {
            return false;
          }

          // Update with new value
          await service.set(key, newValue, 300);

          // Get should return new value
          const updated = await service.get(key);

          // Property: Updated value should be the new value
          return JSON.stringify(updated) === JSON.stringify(newValue);
        },
      ),
      { numRuns: 100 },
    );
  });

  /**
   * Property 2c: Cache Deletion Consistency
   *
   * For any key, after deletion, subsequent get operations should return null.
   *
   * **Validates: Requirements 1.9, 8.1**
   */
  it('Property 2c: For any delete operation, subsequent get should return null', async () => {
    // Reserved property names that could cause issues
    const reservedNames = [
      'valueOf',
      'toString',
      'constructor',
      'prototype',
      '__proto__',
      'hasOwnProperty',
    ];

    await fc.assert(
      fc.asyncProperty(
        // Generate random cache key (excluding reserved names)
        fc
          .string({ minLength: 1, maxLength: 50 })
          .filter((s) => s.trim().length > 0 && !reservedNames.includes(s)),
        // Generate random value
        fc.record({
          data: fc.string({ minLength: 1, maxLength: 100 }),
        }),
        async (key, value) => {
          // Set the value
          await service.set(key, value, 300);

          // Verify it's cached
          const cached = await service.get(key);
          if (cached === null) {
            return false;
          }

          // Delete the value
          await service.del(key);

          // Get should return null
          const deleted = await service.get(key);

          // Property: After deletion, value should be null
          return deleted === null;
        },
      ),
      { numRuns: 100 },
    );
  });

  /**
   * Property 2d: L1 to L2 Backfill Consistency
   *
   * When L1 cache misses but L2 hits, the value should be backfilled to L1,
   * and subsequent L1 reads should return the same value.
   *
   * **Validates: Requirements 8.1**
   */
  it('Property 2d: L2 hit should backfill L1 with consistent value', async () => {
    // Reserved property names that could cause issues
    const reservedNames = [
      'valueOf',
      'toString',
      'constructor',
      'prototype',
      '__proto__',
      'hasOwnProperty',
    ];

    await fc.assert(
      fc.asyncProperty(
        // Generate random cache key (excluding reserved names)
        fc
          .string({ minLength: 1, maxLength: 50 })
          .filter((s) => s.trim().length > 0 && !reservedNames.includes(s)),
        // Generate random value
        fc.record({
          id: fc.integer({ min: 1, max: 10000 }),
          name: fc.string({ minLength: 1, maxLength: 50 }),
        }),
        async (key, value) => {
          // Reset mock call count
          mockRedisService.get.mockClear();

          // Directly set in L2 (Redis) only
          await mockRedisService.set(key, value, 300000);

          // Flush L1 to ensure it's empty
          service.flushL1();

          // First get should hit L2 and backfill L1
          const firstGet = await service.get(key);
          if (JSON.stringify(firstGet) !== JSON.stringify(value)) {
            return false;
          }

          // Second get should hit L1 (verify by checking Redis wasn't called again)
          const callCountBefore = mockRedisService.get.mock.calls.length;
          const secondGet = await service.get(key);
          const callCountAfter = mockRedisService.get.mock.calls.length;

          // Property: Second get should return same value and not hit L2
          return (
            JSON.stringify(secondGet) === JSON.stringify(value) && callCountAfter === callCountBefore
          );
        },
      ),
      { numRuns: 100 },
    );
  });

  /**
   * Property 2e: getOrSet Consistency
   *
   * For any key, getOrSet should return cached value if present,
   * or call factory and cache the result if not present.
   *
   * **Validates: Requirements 1.9, 8.1**
   */
  it('Property 2e: getOrSet should maintain consistency between cache and factory', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate random cache key with unique prefix to avoid collisions
        fc.integer({ min: 1, max: 100000 }).map((n) => `getOrSet-key-${n}`),
        // Generate random value
        fc.record({
          id: fc.integer({ min: 1, max: 10000 }),
          timestamp: fc.integer({ min: 1000000000, max: 2000000000 }),
        }),
        async (key, value) => {
          // Clear any existing cache for this key
          await service.del(key);
          redisStorage.delete(key);

          let factoryCallCount = 0;
          const factory = async () => {
            factoryCallCount++;
            return value;
          };

          // First call should invoke factory
          const first = await service.getOrSet(key, factory, 300);
          if (factoryCallCount !== 1) {
            return false;
          }
          if (JSON.stringify(first) !== JSON.stringify(value)) {
            return false;
          }

          // Second call should NOT invoke factory (use cache)
          const second = await service.getOrSet(key, factory, 300);
          if (factoryCallCount !== 1) {
            return false;
          }

          // Property: Both calls should return the same value
          return JSON.stringify(second) === JSON.stringify(value);
        },
      ),
      { numRuns: 100 },
    );
  });

  /**
   * Property 2f: Batch Delete Consistency
   *
   * For any set of keys, after batch deletion, all keys should return null.
   *
   * **Validates: Requirements 1.9, 8.1**
   */
  it('Property 2f: Batch delete should invalidate all specified keys', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate array of unique keys
        fc
          .array(fc.string({ minLength: 1, maxLength: 30 }).filter((s) => s.trim().length > 0), {
            minLength: 1,
            maxLength: 5,
          })
          .map((arr) => [...new Set(arr)]), // Ensure unique keys
        async (keys) => {
          // Set values for all keys
          for (const key of keys) {
            await service.set(key, { key, value: 'test' }, 300);
          }

          // Verify all are cached
          for (const key of keys) {
            const cached = await service.get(key);
            if (cached === null) {
              return false;
            }
          }

          // Batch delete
          await service.del(keys);

          // All should be null
          for (const key of keys) {
            const deleted = await service.get(key);
            if (deleted !== null) {
              return false;
            }
          }

          // Property: All keys should be deleted
          return true;
        },
      ),
      { numRuns: 100 },
    );
  });

  /**
   * Property 2g: Cache Statistics Consistency
   *
   * The cache statistics should accurately reflect the operations performed.
   *
   * **Validates: Requirements 8.1**
   */
  it('Property 2g: Cache statistics should be consistent with operations', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate number of operations
        fc.integer({ min: 1, max: 20 }),
        async (numOps) => {
          service.resetStats();
          service.flushL1();

          let expectedL1Hits = 0;
          let expectedL1Misses = 0;

          // Perform operations
          for (let i = 0; i < numOps; i++) {
            const key = `key-${i}`;
            const value = { index: i };

            // Set value
            await service.set(key, value, 300);

            // Get value (should be L1 hit)
            await service.get(key);
            expectedL1Hits++;
          }

          // Get non-existent key (should be L1 miss)
          mockRedisService.get.mockResolvedValueOnce(null);
          await service.get('non-existent');
          expectedL1Misses++;

          const stats = service.getStats();

          // Property: Statistics should match expected values
          return stats.l1Hits === expectedL1Hits && stats.l1Misses === expectedL1Misses;
        },
      ),
      { numRuns: 100 },
    );
  });
});
