import * as fc from 'fast-check';
import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import {
  MultiThrottleGuard,
  ThrottleException,
  ThrottleConfig,
  THROTTLE_KEY,
  SKIP_THROTTLE_KEY,
} from './multi-throttle.guard';
import { RedisService } from 'src/module/common/redis/redis.service';

/**
 * Property-Based Tests for MultiThrottleGuard
 *
 * Feature: enterprise-app-optimization
 * Property 5: 限流正确性
 * Validates: Requirements 4.1, 5.2
 *
 * For any rate limit configuration, when request frequency exceeds the configured
 * threshold, subsequent requests should be rejected; when the time window passes,
 * requests should be allowed.
 */
describe('MultiThrottleGuard Property-Based Tests', () => {
  let guard: MultiThrottleGuard;
  let reflector: Reflector;

  // Simulated Redis storage for property testing
  let redisStorage: Map<string, { value: string; expireAt: number }>;

  const createMockContext = (options: {
    ip?: string;
    userId?: number;
    tenantId?: string;
    headers?: Record<string, string>;
  } = {}): ExecutionContext => {
    const { ip = '127.0.0.1', userId, tenantId, headers = {} } = options;
    return {
      switchToHttp: () => ({
        getRequest: () => ({
          ip,
          headers,
          socket: { remoteAddress: ip },
          user: userId || tenantId ? { userId, tenantId } : undefined,
        }),
      }),
      getHandler: () => ({}),
      getClass: () => ({}),
    } as ExecutionContext;
  };

  beforeEach(async () => {
    redisStorage = new Map();

    const mockRedisService = {
      get: jest.fn().mockImplementation(async (key: string) => {
        const entry = redisStorage.get(key);
        if (!entry) return null;
        if (Date.now() > entry.expireAt) {
          redisStorage.delete(key);
          return null;
        }
        return entry.value;
      }),
      set: jest.fn().mockImplementation(async (key: string, value: string, ttlMs?: number) => {
        redisStorage.set(key, {
          value,
          expireAt: Date.now() + (ttlMs || 60000),
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
      ttl: jest.fn().mockImplementation(async (key: string) => {
        const entry = redisStorage.get(key);
        if (!entry) return -2;
        const remaining = Math.ceil((entry.expireAt - Date.now()) / 1000);
        return remaining > 0 ? remaining : -2;
      }),
      getClient: jest.fn().mockReturnValue({
        incr: jest.fn().mockImplementation(async (key: string) => {
          const entry = redisStorage.get(key);
          if (!entry) return 1;
          const newValue = parseInt(entry.value, 10) + 1;
          entry.value = String(newValue);
          return newValue;
        }),
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MultiThrottleGuard,
        {
          provide: RedisService,
          useValue: mockRedisService,
        },
        {
          provide: Reflector,
          useValue: {
            getAllAndOverride: jest.fn(),
          },
        },
      ],
    }).compile();

    guard = module.get<MultiThrottleGuard>(MultiThrottleGuard);
    reflector = module.get<Reflector>(Reflector);
  });

  afterEach(() => {
    jest.clearAllMocks();
    redisStorage.clear();
  });

  /**
   * Property 5a: Rate Limit Enforcement
   *
   * For any rate limit configuration, when the number of requests reaches the limit,
   * the next request should be blocked.
   *
   * **Validates: Requirements 4.1, 5.2**
   */
  it('Property 5a: For any limit N, the (N+1)th request should be blocked', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate random limit (1-20 for practical testing)
        fc.integer({ min: 1, max: 20 }),
        // Generate random TTL (1000-60000 ms)
        fc.integer({ min: 1000, max: 60000 }),
        // Generate random IP
        fc.ipV4(),
        async (limit, ttl, ip) => {
          // Clear storage
          redisStorage.clear();

          const config: ThrottleConfig = { ttl, limit };

          // Make 'limit' number of requests - all should succeed
          for (let i = 0; i < limit; i++) {
            const result = await guard.checkLimit(`throttle:ip:${ip}`, config);
            if (result.blocked) {
              return false; // Should not be blocked before reaching limit
            }
          }

          // The (limit + 1)th request should be blocked
          const finalResult = await guard.checkLimit(`throttle:ip:${ip}`, config);

          // Property: After reaching limit, next request should be blocked
          return finalResult.blocked === true;
        },
      ),
      { numRuns: 100 },
    );
  });

  /**
   * Property 5b: Request Count Accuracy
   *
   * For any sequence of requests, the current count should accurately reflect
   * the number of requests made.
   *
   * **Validates: Requirements 4.1**
   */
  it('Property 5b: Request count should accurately reflect number of requests', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate random number of requests (1-15)
        fc.integer({ min: 1, max: 15 }),
        // Generate random IP
        fc.ipV4(),
        async (numRequests, ip) => {
          // Clear storage
          redisStorage.clear();

          const config: ThrottleConfig = { ttl: 60000, limit: 100 }; // High limit to avoid blocking
          const key = `throttle:ip:${ip}`;

          // Make requests
          let lastResult;
          for (let i = 0; i < numRequests; i++) {
            lastResult = await guard.checkLimit(key, config);
          }

          // Property: Current count should equal number of requests
          return lastResult!.current === numRequests;
        },
      ),
      { numRuns: 100 },
    );
  });

  /**
   * Property 5c: Multi-Dimension Independence
   *
   * Rate limits for different dimensions (IP, user, tenant) should be independent.
   * Exhausting one dimension's limit should not affect others.
   *
   * **Validates: Requirements 4.1, 5.2**
   */
  it('Property 5c: Different dimensions should have independent limits', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate random IP
        fc.ipV4(),
        // Generate random user ID
        fc.integer({ min: 1, max: 10000 }),
        // Generate random tenant ID
        fc.string({ minLength: 6, maxLength: 10 }).filter((s) => /^[a-zA-Z0-9]+$/.test(s)),
        async (ip, userId, tenantId) => {
          // Clear storage
          redisStorage.clear();

          const config: ThrottleConfig = { ttl: 60000, limit: 5 };

          // Exhaust IP limit
          for (let i = 0; i < 5; i++) {
            await guard.checkLimit(`throttle:ip:${ip}`, config);
          }
          const ipResult = await guard.checkLimit(`throttle:ip:${ip}`, config);

          // User limit should still be available
          const userResult = await guard.checkLimit(`throttle:user:${userId}`, config);

          // Tenant limit should still be available
          const tenantResult = await guard.checkLimit(`throttle:tenant:${tenantId}`, config);

          // Property: IP blocked, but user and tenant should not be blocked
          return ipResult.blocked === true && userResult.blocked === false && tenantResult.blocked === false;
        },
      ),
      { numRuns: 100 },
    );
  });

  /**
   * Property 5d: Limit Boundary Correctness
   *
   * Requests at exactly the limit should succeed, requests over the limit should fail.
   *
   * **Validates: Requirements 4.1**
   */
  it('Property 5d: Requests at limit should succeed, over limit should fail', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate random limit (2-10)
        fc.integer({ min: 2, max: 10 }),
        // Generate random IP
        fc.ipV4(),
        async (limit, ip) => {
          // Clear storage
          redisStorage.clear();

          const config: ThrottleConfig = { ttl: 60000, limit };
          const key = `throttle:ip:${ip}`;

          // Make (limit - 1) requests
          for (let i = 0; i < limit - 1; i++) {
            await guard.checkLimit(key, config);
          }

          // Request at exactly the limit should succeed
          const atLimitResult = await guard.checkLimit(key, config);
          if (atLimitResult.blocked) {
            return false;
          }

          // Request over the limit should fail
          const overLimitResult = await guard.checkLimit(key, config);

          // Property: At limit succeeds, over limit fails
          return overLimitResult.blocked === true;
        },
      ),
      { numRuns: 100 },
    );
  });

  /**
   * Property 5e: Skip Throttle Decorator
   *
   * When SkipThrottle decorator is applied, requests should always be allowed
   * regardless of rate limit state.
   *
   * **Validates: Requirements 4.1**
   */
  it('Property 5e: SkipThrottle should bypass all rate limits', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate random IP
        fc.ipV4(),
        // Generate random number of previous requests (to simulate exhausted limit)
        fc.integer({ min: 100, max: 200 }),
        async (ip, previousRequests) => {
          // Clear storage
          redisStorage.clear();

          // Simulate exhausted limit by setting high count
          redisStorage.set(`throttle:ip:${ip}`, {
            value: String(previousRequests),
            expireAt: Date.now() + 60000,
          });

          // Configure reflector to return skipThrottle = true
          jest.spyOn(reflector, 'getAllAndOverride').mockImplementation((key) => {
            if (key === SKIP_THROTTLE_KEY) return true;
            return undefined;
          });

          const context = createMockContext({ ip });

          // Should not throw even with exhausted limit
          const result = await guard.canActivate(context);

          // Property: With SkipThrottle, request should always be allowed
          return result === true;
        },
      ),
      { numRuns: 100 },
    );
  });

  /**
   * Property 5f: Custom Config Override
   *
   * Custom throttle configuration from decorator should override default config.
   *
   * **Validates: Requirements 4.1**
   */
  it('Property 5f: Custom config should override default limits', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate custom limit (different from default 100)
        fc.integer({ min: 1, max: 10 }),
        // Generate random IP
        fc.ipV4(),
        async (customLimit, ip) => {
          // Clear storage
          redisStorage.clear();

          const customConfig = {
            ip: { ttl: 60000, limit: customLimit },
          };

          // Configure reflector to return custom config
          jest.spyOn(reflector, 'getAllAndOverride').mockImplementation((key) => {
            if (key === THROTTLE_KEY) return customConfig;
            return undefined;
          });

          const context = createMockContext({ ip });

          // Make customLimit requests - all should succeed
          for (let i = 0; i < customLimit; i++) {
            try {
              await guard.canActivate(context);
            } catch (e) {
              if (e instanceof ThrottleException) {
                return false; // Should not be blocked before reaching custom limit
              }
              throw e;
            }
          }

          // The (customLimit + 1)th request should be blocked
          try {
            await guard.canActivate(context);
            return false; // Should have thrown
          } catch (e) {
            // Property: Should be blocked after reaching custom limit
            return e instanceof ThrottleException;
          }
        },
      ),
      { numRuns: 100 },
    );
  });

  /**
   * Property 5g: Remaining Time Accuracy
   *
   * When blocked, the remaining time should be positive and within the TTL window.
   *
   * **Validates: Requirements 4.1**
   */
  it('Property 5g: Remaining time should be positive and within TTL window', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate random TTL (1-60 seconds)
        fc.integer({ min: 1, max: 60 }),
        // Generate random IP
        fc.ipV4(),
        async (ttlSeconds, ip) => {
          // Clear storage
          redisStorage.clear();

          const ttlMs = ttlSeconds * 1000;
          const config: ThrottleConfig = { ttl: ttlMs, limit: 1 };
          const key = `throttle:ip:${ip}`;

          // Make one request to reach limit
          await guard.checkLimit(key, config);

          // Next request should be blocked with remaining time
          const result = await guard.checkLimit(key, config);

          // Property: Remaining time should be positive and <= TTL in seconds
          return (
            result.blocked === true &&
            result.remaining > 0 &&
            result.remaining <= ttlSeconds
          );
        },
      ),
      { numRuns: 100 },
    );
  });
});
