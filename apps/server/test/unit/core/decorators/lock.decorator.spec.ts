import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, CallHandler, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { of, throwError } from 'rxjs';
import { LockInterceptor, LOCK_KEY, LockOptions, Lock, LockAcquireException } from '@/core/http/decorators/lock.decorator';
import { RedisService } from '@/platform/redis/redis.service';

/**
 * Unit Tests for LockInterceptor
 *
 * Feature: server-architecture-analysis
 * Task: 1.6 为装饰器编写单元测试
 * Validates: Requirements 3.5.2
 *
 * Tests for @Lock decorator:
 * - Lock acquisition and release
 * - Concurrent request handling
 * - Key generation
 */
describe('LockInterceptor Unit Tests', () => {
  let interceptor: LockInterceptor;
  let reflector: Reflector;
  let mockRedisService: any;
  let mockRedisClient: any;
  let lockedKeys: Map<string, string>;

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

    mockRedisClient = {
      set: jest.fn().mockImplementation(async (key, value, ex, timeout, nx) => {
        if (nx === 'NX' && lockedKeys.has(key)) {
          return null;
        }
        lockedKeys.set(key, value);
        return 'OK';
      }),
      eval: jest.fn().mockImplementation(async (script, numKeys, key, value) => {
        const storedValue = lockedKeys.get(key);
        if (storedValue === value) {
          lockedKeys.delete(key);
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

  describe('basic functionality', () => {
    it('should execute method when no lock options are set', async () => {
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

    it('should execute method when lock key is empty', async () => {
      jest.spyOn(reflector, 'get').mockReturnValue({ ...defaultOptions, key: '' });

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

    it('should acquire lock and execute method successfully', async () => {
      jest.spyOn(reflector, 'get').mockReturnValue(defaultOptions);

      const context = createMockContext({ params: { id: '123' } });
      const handler: CallHandler = {
        handle: () => of({ id: 1, status: 'updated' }),
      };

      const observable = await interceptor.intercept(context, handler);
      const result = await new Promise((resolve) => {
        observable.subscribe({ next: resolve });
      });

      expect(result).toEqual({ id: 1, status: 'updated' });
      expect(mockRedisClient.set).toHaveBeenCalled();
    });

    it('should release lock after method execution', async () => {
      jest.spyOn(reflector, 'get').mockReturnValue(defaultOptions);

      const context = createMockContext({ params: { id: '123' } });
      const handler: CallHandler = {
        handle: () => of({ success: true }),
      };

      const observable = await interceptor.intercept(context, handler);
      await new Promise((resolve) => {
        observable.subscribe({ next: resolve });
      });

      // Wait for finalize to complete
      await new Promise((resolve) => setTimeout(resolve, 10));
      expect(mockRedisClient.eval).toHaveBeenCalled();
    });
  });

  describe('lock acquisition', () => {
    it('should throw LockAcquireException when lock is already held', async () => {
      // Pre-set the lock
      lockedKeys.set('lock:test:123', 'other-process');
      jest.spyOn(reflector, 'get').mockReturnValue(defaultOptions);

      const context = createMockContext({ params: { id: '123' } });
      const handler: CallHandler = {
        handle: () => of({ success: true }),
      };

      await expect(interceptor.intercept(context, handler)).rejects.toThrow(LockAcquireException);
    });

    it('should use custom error message when lock acquisition fails', async () => {
      const customMessage = '资源正在被其他用户操作';
      lockedKeys.set('lock:test:123', 'other-process');
      jest.spyOn(reflector, 'get').mockReturnValue({
        ...defaultOptions,
        message: customMessage,
      });

      const context = createMockContext({ params: { id: '123' } });
      const handler: CallHandler = {
        handle: () => of({ success: true }),
      };

      try {
        await interceptor.intercept(context, handler);
      } catch (error) {
        expect((error as LockAcquireException).message).toBe(customMessage);
      }
    });

    it('should use configured leaseTime for lock expiration', async () => {
      const customLeaseTime = 60;
      jest.spyOn(reflector, 'get').mockReturnValue({
        ...defaultOptions,
        leaseTime: customLeaseTime,
      });

      const context = createMockContext({ params: { id: '123' } });
      const handler: CallHandler = {
        handle: () => of({ success: true }),
      };

      const observable = await interceptor.intercept(context, handler);
      await new Promise((resolve) => observable.subscribe({ next: resolve }));

      expect(mockRedisClient.set).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String),
        'EX',
        customLeaseTime,
        'NX',
      );
    });
  });

  describe('key generation', () => {
    it('should generate key from params placeholder', async () => {
      jest.spyOn(reflector, 'get').mockReturnValue({
        ...defaultOptions,
        key: 'order:{id}',
      });

      let capturedKey = '';
      mockRedisClient.set.mockImplementation(async (key: string, value: string) => {
        capturedKey = key;
        lockedKeys.set(key, value);
        return 'OK';
      });

      const context = createMockContext({ params: { id: 'ORDER-456' } });
      const handler: CallHandler = {
        handle: () => of({ success: true }),
      };

      const observable = await interceptor.intercept(context, handler);
      await new Promise((resolve) => observable.subscribe({ next: resolve }));

      expect(capturedKey).toContain('ORDER-456');
    });

    it('should generate key from body placeholder', async () => {
      jest.spyOn(reflector, 'get').mockReturnValue({
        ...defaultOptions,
        key: 'user:{body.userId}',
      });

      let capturedKey = '';
      mockRedisClient.set.mockImplementation(async (key: string, value: string) => {
        capturedKey = key;
        lockedKeys.set(key, value);
        return 'OK';
      });

      const context = createMockContext({ body: { userId: 'USER-789' } });
      const handler: CallHandler = {
        handle: () => of({ success: true }),
      };

      const observable = await interceptor.intercept(context, handler);
      await new Promise((resolve) => observable.subscribe({ next: resolve }));

      expect(capturedKey).toContain('USER-789');
    });

    it('should use key prefix', async () => {
      const customPrefix = 'myapp:lock:';
      jest.spyOn(reflector, 'get').mockReturnValue({
        ...defaultOptions,
        keyPrefix: customPrefix,
      });

      let capturedKey = '';
      mockRedisClient.set.mockImplementation(async (key: string, value: string) => {
        capturedKey = key;
        lockedKeys.set(key, value);
        return 'OK';
      });

      const context = createMockContext({ params: { id: '123' } });
      const handler: CallHandler = {
        handle: () => of({ success: true }),
      };

      const observable = await interceptor.intercept(context, handler);
      await new Promise((resolve) => observable.subscribe({ next: resolve }));

      expect(capturedKey.startsWith(customPrefix)).toBe(true);
    });
  });

  describe('lock release', () => {
    it('should release lock even when method throws error', async () => {
      jest.spyOn(reflector, 'get').mockReturnValue(defaultOptions);

      const context = createMockContext({ params: { id: '123' } });
      const handler: CallHandler = {
        handle: () => throwError(() => new Error('Test error')),
      };

      const observable = await interceptor.intercept(context, handler);

      await expect(
        new Promise((resolve, reject) => {
          observable.subscribe({ next: resolve, error: reject });
        }),
      ).rejects.toThrow('Test error');

      // Wait for finalize to complete
      await new Promise((resolve) => setTimeout(resolve, 10));
      expect(mockRedisClient.eval).toHaveBeenCalled();
    });

    it('should only release lock with matching value', async () => {
      jest.spyOn(reflector, 'get').mockReturnValue(defaultOptions);

      let lockValue = '';
      mockRedisClient.set.mockImplementation(async (key: string, value: string) => {
        lockValue = value;
        lockedKeys.set(key, value);
        return 'OK';
      });

      const context = createMockContext({ params: { id: '123' } });
      const handler: CallHandler = {
        handle: () => of({ success: true }),
      };

      const observable = await interceptor.intercept(context, handler);
      await new Promise((resolve) => observable.subscribe({ next: resolve }));

      // Wait for finalize
      await new Promise((resolve) => setTimeout(resolve, 10));

      // Verify eval was called with the correct lock value
      expect(mockRedisClient.eval).toHaveBeenCalledWith(expect.any(String), 1, expect.any(String), lockValue);
    });
  });

  describe('concurrent requests', () => {
    it('should allow different resources to be locked independently', async () => {
      jest.spyOn(reflector, 'get').mockReturnValue(defaultOptions);

      const context1 = createMockContext({ params: { id: '123' } });
      const context2 = createMockContext({ params: { id: '456' } });
      const handler: CallHandler = {
        handle: () => of({ success: true }),
      };

      // Both should succeed
      const observable1 = await interceptor.intercept(context1, handler);
      const observable2 = await interceptor.intercept(context2, handler);

      const result1 = await new Promise((resolve) => observable1.subscribe({ next: resolve }));
      const result2 = await new Promise((resolve) => observable2.subscribe({ next: resolve }));

      expect(result1).toEqual({ success: true });
      expect(result2).toEqual({ success: true });
    });
  });
});

describe('Lock Decorator', () => {
  it('should apply metadata and interceptor', () => {
    @Injectable()
    class TestService {
      @Lock({ key: 'order:{id}', leaseTime: 60 })
      async updateOrder() {
        return 'result';
      }
    }

    const reflector = new Reflector();
    const metadata = reflector.get(LOCK_KEY, TestService.prototype.updateOrder);

    expect(metadata).toBeDefined();
    expect(metadata.key).toBe('order:{id}');
    expect(metadata.leaseTime).toBe(60);
  });

  it('should use default options when not specified', () => {
    @Injectable()
    class TestService {
      @Lock({ key: 'test:{id}' })
      async testMethod() {
        return 'result';
      }
    }

    const reflector = new Reflector();
    const metadata = reflector.get(LOCK_KEY, TestService.prototype.testMethod);

    expect(metadata).toBeDefined();
    expect(metadata.key).toBe('test:{id}');
    expect(metadata.waitTime).toBe(0);
    expect(metadata.leaseTime).toBe(30);
    expect(metadata.message).toBe('操作正在进行中，请稍后重试');
  });
});

describe('LockAcquireException', () => {
  it('should create exception with default message', () => {
    const exception = new LockAcquireException();
    expect(exception.message).toBe('获取锁失败，请稍后重试');
    expect(exception.getStatus()).toBe(409); // CONFLICT
  });

  it('should create exception with custom message', () => {
    const customMessage = '资源被锁定';
    const exception = new LockAcquireException(customMessage);
    expect(exception.message).toBe(customMessage);
  });
});
