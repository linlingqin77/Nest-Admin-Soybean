import * as fc from 'fast-check';
import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, CallHandler, HttpException, HttpStatus } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { of, throwError } from 'rxjs';
import { IdempotentInterceptor, IDEMPOTENT_KEY, IdempotentOptions } from '@/core/http/decorators/idempotent.decorator';
import { RedisService } from '@/platform/redis/redis.service';

/**
 * Property-Based Tests for IdempotentInterceptor
 *
 * Feature: tenant-management-enhancement
 * Property 18: 幂等性核心逻辑
 * Property 19: 幂等性异常处理
 * Validates: Requirements 9.2, 9.3, 9.5
 *
 * For any method marked with @Idempotent:
 * - In the expiration time, duplicate requests with the same parameters should only execute once
 * - When method execution throws an exception, the idempotent key should be deleted to allow retry
 */
describe('IdempotentInterceptor Property-Based Tests', () => {
  let interceptor: IdempotentInterceptor;
  let reflector: Reflector;
  let mockRedisService: any;
  let mockRedisClient: any;

  // Track execution state for property testing
  let methodExecutionCount: number;
  let redisKeyDeleted: boolean;
  let storedKeys: Map<string, any>;

  const createMockContext = (request: any = {}): ExecutionContext => {
    return {
      switchToHttp: () => ({
        getRequest: () => ({
          method: 'POST',
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

  const defaultOptions: Required<IdempotentOptions> = {
    timeout: 5,
    keyResolver: '',
    message: '请勿重复提交',
    deleteOnError: true,
    keyPrefix: 'idempotent:',
  };

  beforeEach(async () => {
    methodExecutionCount = 0;
    redisKeyDeleted = false;
    storedKeys = new Map();

    mockRedisClient = {
      set: jest.fn().mockImplementation(async (key, value, ex, timeout, nx) => {
        if (nx === 'NX' && storedKeys.has(key)) {
          return null; // Key already exists
        }
        storedKeys.set(key, { value, timeout });
        return 'OK';
      }),
    };

    mockRedisService = {
      get: jest.fn().mockImplementation(async (key: string) => {
        const data = storedKeys.get(key);
        return data ? data.value : null;
      }),
      set: jest.fn().mockImplementation(async (key, value, ttl) => {
        storedKeys.set(key, { value, ttl });
        return 'OK';
      }),
      del: jest.fn().mockImplementation(async (key: string) => {
        redisKeyDeleted = true;
        storedKeys.delete(key);
        return 1;
      }),
      getClient: jest.fn().mockReturnValue(mockRedisClient),
    };

    const modules: TestingModule = await Test.createTestingModule({
      providers: [
        IdempotentInterceptor,
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

    interceptor = modules.get<IdempotentInterceptor>(IdempotentInterceptor);
    reflector = modules.get<Reflector>(Reflector);
  });

  afterEach(() => {
    jest.clearAllMocks();
    storedKeys.clear();
  });

  /**
   * Property 18: 幂等性核心逻辑
   *
   * For any idempotent method, duplicate requests with the same parameters
   * within the expiration time should only execute the actual logic once,
   * and subsequent calls should return the cached result.
   *
   * **Validates: Requirements 9.2, 9.3**
   */
  it('Property 18: For any duplicate request within timeout, method should execute only once', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate random request body
        fc.record({
          orderId: fc.string({ minLength: 1, maxLength: 20 }),
          amount: fc.integer({ min: 1, max: 10000 }),
        }),
        // Generate random timeout values
        fc.integer({ min: 1, max: 60 }),
        // Generate random result data
        fc.record({
          id: fc.integer({ min: 1, max: 10000 }),
          status: fc.constantFrom('success', 'pending', 'completed'),
        }),
        async (requestBody, timeout, resultData) => {
          // Reset state
          methodExecutionCount = 0;
          storedKeys.clear();

          // Configure idempotent options
          jest.spyOn(reflector, 'get').mockReturnValue({
            ...defaultOptions,
            timeout,
          });

          const context = createMockContext({ body: requestBody });

          // Create handler that tracks execution count
          const createHandler = (): CallHandler => ({
            handle: () => {
              methodExecutionCount++;
              return of(resultData);
            },
          });

          // First request - should execute
          const observable1 = await interceptor.intercept(context, createHandler());
          const result1 = await new Promise((resolve, reject) => {
            observable1.subscribe({
              next: resolve,
              error: reject,
            });
          });

          // Simulate that the result is now cached
          // The first call sets __PROCESSING__ then updates to result
          // For second call, we need to simulate cached result
          const cachedKey = Array.from(storedKeys.keys())[0];
          if (cachedKey) {
            storedKeys.set(cachedKey, { value: resultData, ttl: timeout * 1000 });
          }

          // Second request with same parameters - should return cached result
          const observable2 = await interceptor.intercept(context, createHandler());
          const result2 = await new Promise((resolve, reject) => {
            observable2.subscribe({
              next: resolve,
              error: reject,
            });
          });

          // Property: Method should execute only once for duplicate requests
          // First call executes, second call returns cached result
          return (
            methodExecutionCount === 1 &&
            JSON.stringify(result1) === JSON.stringify(resultData) &&
            JSON.stringify(result2) === JSON.stringify(resultData)
          );
        },
      ),
      { numRuns: 100 },
    );
  });

  /**
   * Property 18b: Concurrent requests should be blocked
   *
   * For any idempotent method, when a request is being processed,
   * concurrent requests should be rejected with TOO_MANY_REQUESTS.
   *
   * **Validates: Requirements 9.2**
   */
  it('Property 18b: For any concurrent request during processing, should return TOO_MANY_REQUESTS', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate random request body
        fc.record({
          id: fc.string({ minLength: 1, maxLength: 20 }),
        }),
        // Generate random custom message
        fc.string({ minLength: 5, maxLength: 50 }),
        async (requestBody, customMessage) => {
          // Reset state
          storedKeys.clear();

          // Configure idempotent options
          jest.spyOn(reflector, 'get').mockReturnValue({
            ...defaultOptions,
            message: customMessage,
          });

          const context = createMockContext({ body: requestBody });

          // Simulate that a request is already processing
          // Pre-set the key with __PROCESSING__ status
          const userId = 'test-user';
          const method = 'POST';
          const path = '/api/test';
          // The key format is: prefix + userId + method + path + hash
          // We'll set any key that starts with the prefix to simulate processing
          mockRedisService.get.mockImplementation(async () => '__PROCESSING__');

          const handler: CallHandler = {
            handle: () => of({ success: true }),
          };

          // Request should be rejected
          try {
            const observable = await interceptor.intercept(context, handler);
            await new Promise((resolve, reject) => {
              observable.subscribe({
                next: resolve,
                error: reject,
              });
            });
            // Should not reach here
            return false;
          } catch (error) {
            // Property: Should throw HttpException with TOO_MANY_REQUESTS status
            return (
              error instanceof HttpException &&
              error.getStatus() === HttpStatus.TOO_MANY_REQUESTS &&
              error.message === customMessage
            );
          }
        },
      ),
      { numRuns: 100 },
    );
  });

  /**
   * Property 19: 幂等性异常处理
   *
   * For any idempotent method that throws an exception,
   * when deleteOnError is true, the idempotent key should be deleted
   * to allow retry on the next request.
   *
   * **Validates: Requirements 9.5**
   */
  it('Property 19: For any error with deleteOnError=true, idempotent key should be deleted', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate random error messages
        fc.string({ minLength: 1, maxLength: 100 }),
        // Generate random request body
        fc.record({
          data: fc.string({ minLength: 1, maxLength: 50 }),
        }),
        async (errorMessage, requestBody) => {
          // Reset state
          redisKeyDeleted = false;
          storedKeys.clear();

          // Create a promise that resolves when del is called
          let delResolve: () => void;
          const delCalledPromise = new Promise<void>((resolve) => {
            delResolve = resolve;
          });

          // Configure idempotent options with deleteOnError = true
          jest.spyOn(reflector, 'get').mockReturnValue({
            ...defaultOptions,
            deleteOnError: true,
          });

          // Reset mock to allow first request
          mockRedisService.get.mockImplementation(async (key: string) => {
            const data = storedKeys.get(key);
            return data ? data.value : null;
          });

          // Override del mock to track when it's called
          mockRedisService.del.mockImplementation(async (key: string) => {
            redisKeyDeleted = true;
            storedKeys.delete(key);
            delResolve();
            return 1;
          });

          const context = createMockContext({ body: requestBody });
          const errorHandler: CallHandler = {
            handle: () => throwError(() => new Error(errorMessage)),
          };

          // Execute and expect error
          let caughtError: any = null;
          try {
            const observable = await interceptor.intercept(context, errorHandler);
            await new Promise((resolve, reject) => {
              observable.subscribe({
                next: resolve,
                error: reject,
              });
            });
            // Should not reach here
            return false;
          } catch (error: any) {
            caughtError = error;
          }

          // Wait for del to be called (with timeout)
          await Promise.race([delCalledPromise, new Promise((resolve) => setTimeout(resolve, 100))]);

          // Property: When error occurs with deleteOnError=true, key should be deleted
          return redisKeyDeleted && caughtError?.message === errorMessage;
        },
      ),
      { numRuns: 100 },
    );
  });

  /**
   * Property 19b: Error with deleteOnError=false should preserve key
   *
   * For any idempotent method that throws an exception,
   * when deleteOnError is false, the idempotent key should NOT be deleted.
   *
   * **Validates: Requirements 9.5**
   */
  it('Property 19b: For any error with deleteOnError=false, idempotent key should be preserved', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate random error messages
        fc.string({ minLength: 1, maxLength: 100 }),
        // Generate random request body
        fc.record({
          data: fc.string({ minLength: 1, maxLength: 50 }),
        }),
        async (errorMessage, requestBody) => {
          // Reset state
          redisKeyDeleted = false;
          storedKeys.clear();

          // Configure idempotent options with deleteOnError = false
          jest.spyOn(reflector, 'get').mockReturnValue({
            ...defaultOptions,
            deleteOnError: false,
          });

          // Reset mock to allow first request
          mockRedisService.get.mockImplementation(async (key: string) => {
            const data = storedKeys.get(key);
            return data ? data.value : null;
          });

          // Override del mock to track if it's called (it shouldn't be)
          mockRedisService.del.mockImplementation(async (key: string) => {
            redisKeyDeleted = true;
            storedKeys.delete(key);
            return 1;
          });

          const context = createMockContext({ body: requestBody });
          const errorHandler: CallHandler = {
            handle: () => throwError(() => new Error(errorMessage)),
          };

          // Execute and expect error
          let caughtError: any = null;
          try {
            const observable = await interceptor.intercept(context, errorHandler);
            await new Promise((resolve, reject) => {
              observable.subscribe({
                next: resolve,
                error: reject,
              });
            });
            // Should not reach here
            return false;
          } catch (error: any) {
            caughtError = error;
          }

          // Wait a bit to ensure del would have been called if it was going to be
          await new Promise((resolve) => setTimeout(resolve, 50));

          // Property: When error occurs with deleteOnError=false, key should NOT be deleted
          return !redisKeyDeleted && caughtError?.message === errorMessage;
        },
      ),
      { numRuns: 100 },
    );
  });

  /**
   * Property 18c: Different request parameters should generate different keys
   *
   * For any two requests with different parameters,
   * they should be treated as separate requests (different idempotent keys).
   *
   * **Validates: Requirements 9.4**
   */
  it('Property 18c: For any two different request bodies, should generate different idempotent keys', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate two different request bodies
        fc.record({
          id: fc.string({ minLength: 1, maxLength: 20 }),
          value: fc.integer({ min: 1, max: 1000 }),
        }),
        fc.record({
          id: fc.string({ minLength: 1, maxLength: 20 }),
          value: fc.integer({ min: 1001, max: 2000 }), // Different range to ensure different values
        }),
        async (body1, body2) => {
          // Skip if bodies happen to be the same
          if (JSON.stringify(body1) === JSON.stringify(body2)) {
            return true;
          }

          // Reset state
          methodExecutionCount = 0;
          storedKeys.clear();

          // Configure idempotent options
          jest.spyOn(reflector, 'get').mockReturnValue(defaultOptions);

          // Reset mock
          mockRedisService.get.mockImplementation(async (key: string) => {
            const data = storedKeys.get(key);
            return data ? data.value : null;
          });

          const context1 = createMockContext({ body: body1 });
          const context2 = createMockContext({ body: body2 });

          const createHandler = (result: any): CallHandler => ({
            handle: () => {
              methodExecutionCount++;
              return of(result);
            },
          });

          // First request with body1
          const observable1 = await interceptor.intercept(context1, createHandler({ result: 1 }));
          await new Promise((resolve, reject) => {
            observable1.subscribe({
              next: resolve,
              error: reject,
            });
          });

          // Second request with body2 (different parameters)
          const observable2 = await interceptor.intercept(context2, createHandler({ result: 2 }));
          await new Promise((resolve, reject) => {
            observable2.subscribe({
              next: resolve,
              error: reject,
            });
          });

          // Property: Both requests should execute (different keys)
          return methodExecutionCount === 2;
        },
      ),
      { numRuns: 100 },
    );
  });
});
