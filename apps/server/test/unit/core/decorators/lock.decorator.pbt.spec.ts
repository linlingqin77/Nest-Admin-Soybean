import * as fc from 'fast-check';
import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, CallHandler } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { of, delay } from 'rxjs';
import { LockInterceptor, LOCK_KEY, LockOptions, LockAcquireException } from '@/core/http/decorators/lock.decorator';
import { RedisService } from '@/platform/redis/redis.service';

/**
 * Property-Based Tests for LockInterceptor
 *
 * Feature: tenant-management-enhancement
 * Property 20: 分布式锁互斥性
 * Property 21: 分布式锁自动释放
 * Validates: Requirements 10.2, 10.3, 10.6
 *
 * For any method marked with @Lock:
 * - Only one execution instance can hold the lock at a time
 * - The lock should be automatically released after method execution
 */
describe('LockInterceptor Property-Based Tests', () => {
  let interceptor: LockInterceptor;
  let reflector: Reflector;
  let mockRedisService: any;
  let mockRedisClient: any;

  // Track lock state for property testing
  let lockedKeys: Map<string, string>;
  let lockReleased: boolean;

  const createMockContext = (request: any = {}): ExecutionContext => {
    return {
      switchToHttp: () => ({
        getRequest: () => ({
          method: 'PUT',
          path: '/api/test',
          query: {},
          body: {},
          params: {},
          user: { userId: 'test-user' },
          ...request,
        }),
      }),
      getHandler: () => ({}),
      getClass: () => ({}),
    } as ExecutionContext;
  };

  const defaultOptions: Required<LockOptions> = {
    key: 'test:{id}',
    waitTime: 0,
    leaseTime: 30,
    message: '操作正在进行中，请稍后重试',
    keyPrefix: 'lock:',
  };

  beforeEach(async () => {
    lockedKeys = new Map();
    lockReleased = false;

    mockRedisClient = {
      set: jest.fn().mockImplementation(async (key, value, ex, timeout, nx) => {
        if (nx === 'NX' && lockedKeys.has(key)) {
          return null; // Key already exists (lock held by another)
        }
        lockedKeys.set(key, value);
        return 'OK';
      }),
      eval: jest.fn().mockImplementation(async (script, numKeys, key, value) => {
        const storedValue = lockedKeys.get(key);
        if (storedValue === value) {
          lockedKeys.delete(key);
          lockReleased = true;
          return 1;
        }
        return 0;
      }),
    };

    mockRedisService = {
      getClient: jest.fn().mockReturnValue(mockRedisClient),
    };

    const modules: TestingModule = await Test.createTestingModule({
      providers: [
        LockInterceptor,
        {
          provide: Reflector,
          useValue: {
            get: jest.fn(),
          },
        },
        {
          provide: RedisService,
          useValue: mockRedisService,
        },
      ],
    }).compile();

    interceptor = modules.get<LockInterceptor>(LockInterceptor);
    reflector = modules.get<Reflector>(Reflector);
  });

  afterEach(() => {
    jest.clearAllMocks();
    lockedKeys.clear();
  });

  /**
   * Property 20: 分布式锁互斥性
   *
   * For any locked method, only one execution instance can hold the lock at a time.
   * Concurrent requests should fail to acquire the lock.
   *
   * **Validates: Requirements 10.2, 10.3**
   */
  it('Property 20: For any locked method, concurrent requests should fail to acquire lock', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate random resource IDs
        fc.string({ minLength: 1, maxLength: 20 }),
        // Generate random lease times
        fc.integer({ min: 1, max: 60 }),
        async (resourceId, leaseTime) => {
          // Reset state
          lockedKeys.clear();

          // Configure lock options
          jest.spyOn(reflector, 'get').mockReturnValue({
            ...defaultOptions,
            key: `resource:{id}`,
            leaseTime,
          });

          const context = createMockContext({ params: { id: resourceId } });

          // First request - should acquire lock
          const handler1: CallHandler = {
            handle: () => of({ success: true }).pipe(delay(10)),
          };

          // Start first request (don't await completion)
          const observable1 = await interceptor.intercept(context, handler1);
          const promise1 = new Promise((resolve, reject) => {
            observable1.subscribe({
              next: resolve,
              error: reject,
            });
          });

          // Wait a bit for lock to be acquired
          await new Promise((resolve) => setTimeout(resolve, 5));

          // Second request with same resource - should fail
          const handler2: CallHandler = {
            handle: () => of({ success: true }),
          };

          let secondRequestFailed = false;
          try {
            await interceptor.intercept(context, handler2);
          } catch (error) {
            secondRequestFailed = error instanceof LockAcquireException;
          }

          // Wait for first request to complete
          await promise1;

          // Property: Second request should fail to acquire lock
          return secondRequestFailed;
        },
      ),
      { numRuns: 100 },
    );
  });

  /**
   * Property 20b: Different resources should have independent locks
   *
   * For any two different resources, they should be able to be locked independently.
   *
   * **Validates: Requirements 10.2**
   */
  it('Property 20b: For any two different resources, locks should be independent', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate two different resource IDs
        fc.string({ minLength: 1, maxLength: 20 }),
        fc.string({ minLength: 1, maxLength: 20 }),
        async (resourceId1, resourceId2) => {
          // Skip if IDs are the same
          if (resourceId1 === resourceId2) {
            return true;
          }

          // Reset state
          lockedKeys.clear();

          // Configure lock options
          jest.spyOn(reflector, 'get').mockReturnValue({
            ...defaultOptions,
            key: `resource:{id}`,
          });

          const context1 = createMockContext({ params: { id: resourceId1 } });
          const context2 = createMockContext({ params: { id: resourceId2 } });

          const handler: CallHandler = {
            handle: () => of({ success: true }),
          };

          // Both requests should succeed (different resources)
          let request1Success = false;
          let request2Success = false;

          try {
            const observable1 = await interceptor.intercept(context1, handler);
            await new Promise((resolve, reject) => {
              observable1.subscribe({
                next: () => {
                  request1Success = true;
                  resolve(true);
                },
                error: reject,
              });
            });
          } catch (error) {
            request1Success = false;
          }

          try {
            const observable2 = await interceptor.intercept(context2, handler);
            await new Promise((resolve, reject) => {
              observable2.subscribe({
                next: () => {
                  request2Success = true;
                  resolve(true);
                },
                error: reject,
              });
            });
          } catch (error) {
            request2Success = false;
          }

          // Property: Both requests should succeed (independent locks)
          return request1Success && request2Success;
        },
      ),
      { numRuns: 100 },
    );
  });

  /**
   * Property 21: 分布式锁自动释放
   *
   * For any locked method, the lock should be automatically released
   * after method execution completes (success or failure).
   *
   * **Validates: Requirements 10.6**
   */
  it('Property 21: For any completed method execution, lock should be released', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate random resource IDs
        fc.string({ minLength: 1, maxLength: 20 }),
        // Generate random result data
        fc.record({
          id: fc.integer({ min: 1, max: 10000 }),
          status: fc.constantFrom('success', 'completed'),
        }),
        async (resourceId, resultData) => {
          // Reset state
          lockedKeys.clear();
          lockReleased = false;

          // Configure lock options
          jest.spyOn(reflector, 'get').mockReturnValue({
            ...defaultOptions,
            key: `resource:{id}`,
          });

          const context = createMockContext({ params: { id: resourceId } });
          const handler: CallHandler = {
            handle: () => of(resultData),
          };

          // Execute request
          const observable = await interceptor.intercept(context, handler);
          await new Promise((resolve, reject) => {
            observable.subscribe({
              next: resolve,
              error: reject,
            });
          });

          // Wait a tick for finalize to complete
          await new Promise((resolve) => setTimeout(resolve, 10));

          // Property: Lock should be released after execution
          return lockReleased;
        },
      ),
      { numRuns: 100 },
    );
  });

  /**
   * Property 21b: Lock should be released even on error
   *
   * For any locked method that throws an error via Observable, the lock should still be released.
   *
   * **Validates: Requirements 10.6**
   */
  it('Property 21b: For any method error, lock should still be released', async () => {
    const { throwError: rxThrowError } = await import('rxjs');

    await fc.assert(
      fc.asyncProperty(
        // Generate random resource IDs
        fc.string({ minLength: 1, maxLength: 20 }),
        // Generate random error messages
        fc.string({ minLength: 1, maxLength: 50 }),
        async (resourceId, errorMessage) => {
          // Reset state
          lockedKeys.clear();
          lockReleased = false;

          // Configure lock options
          jest.spyOn(reflector, 'get').mockReturnValue({
            ...defaultOptions,
            key: `resource:{id}`,
          });

          const context = createMockContext({ params: { id: resourceId } });
          const handler: CallHandler = {
            handle: () => rxThrowError(() => new Error(errorMessage)),
          };

          // Execute request and expect error
          try {
            const observable = await interceptor.intercept(context, handler);
            await new Promise((resolve, reject) => {
              observable.subscribe({
                next: resolve,
                error: reject,
              });
            });
          } catch (error: any) {
            // Expected error
          }

          // Wait a tick for finalize to complete
          await new Promise((resolve) => setTimeout(resolve, 10));

          // Property: Lock should be released even after error
          return lockReleased;
        },
      ),
      { numRuns: 100 },
    );
  });

  /**
   * Property 20c: Lock value should be unique per request
   *
   * For any lock acquisition, the lock value should be unique to prevent
   * accidental release by other processes.
   *
   * **Validates: Requirements 10.6**
   */
  it('Property 20c: For any lock acquisition, lock value should be unique', async () => {
    const lockValues: Set<string> = new Set();

    await fc.assert(
      fc.asyncProperty(
        // Generate random resource IDs
        fc.string({ minLength: 1, maxLength: 20 }),
        async (resourceId) => {
          // Reset state for each iteration but keep tracking values
          lockedKeys.clear();

          // Track lock values
          mockRedisClient.set.mockImplementation(
            async (key: string, value: string, ex: string, timeout: number, nx: string) => {
              if (nx === 'NX' && lockedKeys.has(key)) {
                return null;
              }
              lockedKeys.set(key, value);

              // Check uniqueness
              if (lockValues.has(value)) {
                return 'DUPLICATE'; // Signal duplicate value
              }
              lockValues.add(value);
              return 'OK';
            },
          );

          // Configure lock options
          jest.spyOn(reflector, 'get').mockReturnValue({
            ...defaultOptions,
            key: `resource:{id}`,
          });

          const context = createMockContext({ params: { id: resourceId } });
          const handler: CallHandler = {
            handle: () => of({ success: true }),
          };

          // Execute request
          const observable = await interceptor.intercept(context, handler);
          await new Promise((resolve, reject) => {
            observable.subscribe({
              next: resolve,
              error: reject,
            });
          });

          // Property: No duplicate lock values should exist
          return !Array.from(lockedKeys.values()).some((v) => v === 'DUPLICATE');
        },
      ),
      { numRuns: 100 },
    );
  });
});
