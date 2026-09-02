import { Test, TestingModule } from '@nestjs/testing';
import { CallHandler, ExecutionContext, HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { of, throwError } from 'rxjs';
import {
  Idempotent,
  IDEMPOTENT_KEY,
  IdempotentInterceptor,
  IdempotentOptions,
} from '@/core/http/decorators/idempotent.decorator';
import { RedisService } from '@/platform/redis/redis.service';

/**
 * Unit Tests for IdempotentInterceptor
 *
 * Feature: server-architecture-analysis
 * Task: 1.6 为装饰器编写单元测试
 * Validates: Requirements 3.5.2
 *
 * Tests for @Idempotent decorator:
 * - Basic idempotency guarantee
 * - Key generation
 * - Error handling
 */
describe('IdempotentInterceptor Unit Tests', () => {
  let interceptor: IdempotentInterceptor;
  let reflector: Reflector;
  let mockRedisService: any;
  let mockRedisClient: any;
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
    storedKeys = new Map();

    mockRedisClient = {
      set: jest.fn().mockImplementation(async (key, value, ex, timeout, nx) => {
        if (nx === 'NX' && storedKeys.has(key)) {
          return null;
        }
        storedKeys.set(key, { value, timeout });
        return 'OK';
      }),
    };

    mockRedisService = {
      get: jest.fn().mockImplementation(async (key) => {
        const data = storedKeys.get(key);
        return data ? data.value : null;
      }),
      set: jest.fn().mockImplementation(async (key, value, ttl) => {
        storedKeys.set(key, { value, ttl });
        return 'OK';
      }),
      del: jest.fn().mockImplementation(async (key) => {
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

  describe('basic functionality', () => {
    it('should execute method when no idempotent options are set', async () => {
      jest.spyOn(reflector, 'get').mockReturnValue(undefined);

      const context = createMockContext();
      const handler: CallHandler = {
        handle: () => of({ success: true }),
      };

      const observable = await interceptor.intercept(context, handler);
      const result = await new Promise((resolve) => {
        observable.subscribe({ next: resolve });
      });

      expect(result).toEqual({ success: true });
    });

    it('should execute method and cache result on first request', async () => {
      jest.spyOn(reflector, 'get').mockReturnValue(defaultOptions);

      const context = createMockContext({ body: { orderId: '123' } });
      const handler: CallHandler = {
        handle: () => of({ id: 1, status: 'created' }),
      };

      const observable = await interceptor.intercept(context, handler);
      const result = await new Promise((resolve) => {
        observable.subscribe({ next: resolve });
      });

      expect(result).toEqual({ id: 1, status: 'created' });
      expect(mockRedisService.set).toHaveBeenCalled();
    });

    it('should return cached result on duplicate request', async () => {
      const cachedResult = { id: 1, status: 'created' };
      mockRedisService.get.mockResolvedValue(cachedResult);
      jest.spyOn(reflector, 'get').mockReturnValue(defaultOptions);

      const context = createMockContext({ body: { orderId: '123' } });
      let methodCalled = false;
      const handler: CallHandler = {
        handle: () => {
          methodCalled = true;
          return of({ id: 2, status: 'new' });
        },
      };

      const observable = await interceptor.intercept(context, handler);
      const result = await new Promise((resolve) => {
        observable.subscribe({ next: resolve });
      });

      expect(result).toEqual(cachedResult);
      expect(methodCalled).toBe(false);
    });

    it('should reject concurrent requests with TOO_MANY_REQUESTS', async () => {
      mockRedisService.get.mockResolvedValue('__PROCESSING__');
      jest.spyOn(reflector, 'get').mockReturnValue(defaultOptions);

      const context = createMockContext({ body: { orderId: '123' } });
      const handler: CallHandler = {
        handle: () => of({ success: true }),
      };

      await expect(interceptor.intercept(context, handler)).rejects.toThrow(HttpException);

      try {
        await interceptor.intercept(context, handler);
      } catch (error) {
        expect(error).toBeInstanceOf(HttpException);
        expect((error as HttpException).getStatus()).toBe(HttpStatus.TOO_MANY_REQUESTS);
        expect((error as HttpException).message).toBe(defaultOptions.message);
      }
    });
  });

  describe('key generation', () => {
    it('should generate different keys for different request bodies', async () => {
      jest.spyOn(reflector, 'get').mockReturnValue(defaultOptions);
      const setKeys: string[] = [];

      mockRedisClient.set.mockImplementation(async (key: string) => {
        setKeys.push(key);
        return 'OK';
      });

      const context1 = createMockContext({ body: { orderId: '123' } });
      const context2 = createMockContext({ body: { orderId: '456' } });
      const handler: CallHandler = {
        handle: () => of({ success: true }),
      };

      const observable1 = await interceptor.intercept(context1, handler);
      await new Promise((resolve) => observable1.subscribe({ next: resolve }));

      const observable2 = await interceptor.intercept(context2, handler);
      await new Promise((resolve) => observable2.subscribe({ next: resolve }));

      expect(setKeys.length).toBe(2);
      expect(setKeys[0]).not.toBe(setKeys[1]);
    });

    it('should use custom keyResolver when provided', async () => {
      const customOptions = {
        ...defaultOptions,
        keyResolver: '{body.orderId}',
      };
      jest.spyOn(reflector, 'get').mockReturnValue(customOptions);

      let capturedKey = '';
      mockRedisClient.set.mockImplementation(async (key: string) => {
        capturedKey = key;
        return 'OK';
      });

      const context = createMockContext({ body: { orderId: 'ORDER-123' } });
      const handler: CallHandler = {
        handle: () => of({ success: true }),
      };

      const observable = await interceptor.intercept(context, handler);
      await new Promise((resolve) => observable.subscribe({ next: resolve }));

      expect(capturedKey).toContain('ORDER-123');
    });

    it('should include user ID in key', async () => {
      jest.spyOn(reflector, 'get').mockReturnValue(defaultOptions);

      let capturedKey = '';
      mockRedisClient.set.mockImplementation(async (key: string) => {
        capturedKey = key;
        return 'OK';
      });

      const context = createMockContext({
        body: { orderId: '123' },
        user: { userId: 'user-456' },
      });
      const handler: CallHandler = {
        handle: () => of({ success: true }),
      };

      const observable = await interceptor.intercept(context, handler);
      await new Promise((resolve) => observable.subscribe({ next: resolve }));

      expect(capturedKey).toContain('user-456');
    });
  });

  describe('error handling', () => {
    it('should delete key on error when deleteOnError is true', async () => {
      jest.spyOn(reflector, 'get').mockReturnValue({
        ...defaultOptions,
        deleteOnError: true,
      });

      const context = createMockContext({ body: { orderId: '123' } });
      const handler: CallHandler = {
        handle: () => throwError(() => new Error('Test error')),
      };

      const observable = await interceptor.intercept(context, handler);

      await expect(
        new Promise((resolve, reject) => {
          observable.subscribe({ next: resolve, error: reject });
        }),
      ).rejects.toThrow('Test error');

      // Wait for async deletion
      await new Promise((resolve) => setTimeout(resolve, 50));
      expect(mockRedisService.del).toHaveBeenCalled();
    });

    it('should preserve key on error when deleteOnError is false', async () => {
      jest.spyOn(reflector, 'get').mockReturnValue({
        ...defaultOptions,
        deleteOnError: false,
      });

      const context = createMockContext({ body: { orderId: '123' } });
      const handler: CallHandler = {
        handle: () => throwError(() => new Error('Test error')),
      };

      const observable = await interceptor.intercept(context, handler);

      await expect(
        new Promise((resolve, reject) => {
          observable.subscribe({ next: resolve, error: reject });
        }),
      ).rejects.toThrow('Test error');

      // Wait to ensure del is not called
      await new Promise((resolve) => setTimeout(resolve, 50));
      expect(mockRedisService.del).not.toHaveBeenCalled();
    });

    it('should use custom error message', async () => {
      const customMessage = '订单正在处理中，请勿重复提交';
      mockRedisService.get.mockResolvedValue('__PROCESSING__');
      jest.spyOn(reflector, 'get').mockReturnValue({
        ...defaultOptions,
        message: customMessage,
      });

      const context = createMockContext();
      const handler: CallHandler = {
        handle: () => of({ success: true }),
      };

      try {
        await interceptor.intercept(context, handler);
      } catch (error) {
        expect((error as HttpException).message).toBe(customMessage);
      }
    });
  });

  describe('timeout configuration', () => {
    it('should use configured timeout for Redis SET', async () => {
      const customTimeout = 30;
      jest.spyOn(reflector, 'get').mockReturnValue({
        ...defaultOptions,
        timeout: customTimeout,
      });

      const context = createMockContext({ body: { orderId: '123' } });
      const handler: CallHandler = {
        handle: () => of({ success: true }),
      };

      const observable = await interceptor.intercept(context, handler);
      await new Promise((resolve) => observable.subscribe({ next: resolve }));

      expect(mockRedisClient.set).toHaveBeenCalledWith(expect.any(String), '__PROCESSING__', 'EX', customTimeout, 'NX');
    });
  });
});

describe('Idempotent Decorator', () => {
  it('should apply metadata and interceptor', () => {
    @Injectable()
    class TestService {
      @Idempotent({ timeout: 10, message: 'Custom message' })
      async testMethod() {
        return 'result';
      }
    }

    const reflector = new Reflector();
    const metadata = reflector.get(IDEMPOTENT_KEY, TestService.prototype.testMethod);

    expect(metadata).toBeDefined();
    expect(metadata.timeout).toBe(10);
    expect(metadata.message).toBe('Custom message');
  });

  it('should use default options when not specified', () => {
    @Injectable()
    class TestService {
      @Idempotent()
      async testMethod() {
        return 'result';
      }
    }

    const reflector = new Reflector();
    const metadata = reflector.get(IDEMPOTENT_KEY, TestService.prototype.testMethod);

    expect(metadata).toBeDefined();
    expect(metadata.timeout).toBe(5);
    expect(metadata.message).toBe('请勿重复提交');
    expect(metadata.deleteOnError).toBe(true);
  });
});
