import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import {
  MultiThrottleGuard,
  ThrottleException,
  DEFAULT_THROTTLE_CONFIG,
  THROTTLE_KEY,
  SKIP_THROTTLE_KEY,
} from './multi-throttle.guard';
import { RedisService } from 'src/module/common/redis/redis.service';
import { createRedisMock, RedisMock } from 'src/test-utils/redis-mock';

describe('MultiThrottleGuard', () => {
  let guard: MultiThrottleGuard;
  let reflector: Reflector;
  let redisMock: RedisMock;

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
    redisMock = createRedisMock();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MultiThrottleGuard,
        {
          provide: RedisService,
          useValue: redisMock,
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
  });

  describe('canActivate', () => {
    it('should allow request when skip throttle is set', async () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockImplementation((key) => {
        if (key === SKIP_THROTTLE_KEY) return true;
        return undefined;
      });

      const context = createMockContext();
      const result = await guard.canActivate(context);

      expect(result).toBe(true);
      expect(redisMock.get).not.toHaveBeenCalled();
    });

    it('should allow request when under IP limit', async () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);
      redisMock.get.mockResolvedValue(null);

      const context = createMockContext({ ip: '192.168.1.1' });
      const result = await guard.canActivate(context);

      expect(result).toBe(true);
      expect(redisMock.set).toHaveBeenCalledWith(
        'throttle:ip:192.168.1.1',
        '1',
        DEFAULT_THROTTLE_CONFIG.ip!.ttl,
      );
    });

    it('should block request when IP limit exceeded', async () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);
      redisMock.get.mockResolvedValue(String(DEFAULT_THROTTLE_CONFIG.ip!.limit));
      redisMock.ttl.mockResolvedValue(30);

      const context = createMockContext({ ip: '192.168.1.1' });

      await expect(guard.canActivate(context)).rejects.toThrow(ThrottleException);
    });

    it('should allow request when under user limit', async () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);
      redisMock.get.mockResolvedValue(null);

      const context = createMockContext({ ip: '192.168.1.1', userId: 1 });
      const result = await guard.canActivate(context);

      expect(result).toBe(true);
      expect(redisMock.set).toHaveBeenCalledWith(
        'throttle:ip:192.168.1.1',
        '1',
        DEFAULT_THROTTLE_CONFIG.ip!.ttl,
      );
      expect(redisMock.set).toHaveBeenCalledWith(
        'throttle:user:1',
        '1',
        DEFAULT_THROTTLE_CONFIG.user!.ttl,
      );
    });

    it('should block request when user limit exceeded', async () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);
      const mockClient = { incr: jest.fn().mockResolvedValue(2) };
      redisMock.getClient.mockReturnValue(mockClient);
      redisMock.get.mockImplementation(async (key: string) => {
        if (key.startsWith('throttle:ip:')) return '1';
        if (key.startsWith('throttle:user:')) return String(DEFAULT_THROTTLE_CONFIG.user!.limit);
        return null;
      });
      redisMock.ttl.mockResolvedValue(30);

      const context = createMockContext({ ip: '192.168.1.1', userId: 1 });

      await expect(guard.canActivate(context)).rejects.toThrow(ThrottleException);
    });

    it('should allow request when under tenant limit', async () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);
      redisMock.get.mockResolvedValue(null);

      const context = createMockContext({ ip: '192.168.1.1', userId: 1, tenantId: 'tenant1' });
      const result = await guard.canActivate(context);

      expect(result).toBe(true);
      expect(redisMock.set).toHaveBeenCalledWith(
        'throttle:tenant:tenant1',
        '1',
        DEFAULT_THROTTLE_CONFIG.tenant!.ttl,
      );
    });

    it('should block request when tenant limit exceeded', async () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);
      const mockClient = { incr: jest.fn().mockResolvedValue(2) };
      redisMock.getClient.mockReturnValue(mockClient);
      redisMock.get.mockImplementation(async (key: string) => {
        if (key.startsWith('throttle:ip:')) return '1';
        if (key.startsWith('throttle:user:')) return '1';
        if (key.startsWith('throttle:tenant:')) return String(DEFAULT_THROTTLE_CONFIG.tenant!.limit);
        return null;
      });
      redisMock.ttl.mockResolvedValue(30);

      const context = createMockContext({ ip: '192.168.1.1', userId: 1, tenantId: 'tenant1' });

      await expect(guard.canActivate(context)).rejects.toThrow(ThrottleException);
    });

    it('should use custom throttle config from decorator', async () => {
      const customConfig = {
        ip: { ttl: 30000, limit: 5 },
      };
      jest.spyOn(reflector, 'getAllAndOverride').mockImplementation((key) => {
        if (key === THROTTLE_KEY) return customConfig;
        return undefined;
      });
      redisMock.get.mockResolvedValue(null);

      const context = createMockContext({ ip: '192.168.1.1' });
      const result = await guard.canActivate(context);

      expect(result).toBe(true);
      expect(redisMock.set).toHaveBeenCalledWith('throttle:ip:192.168.1.1', '1', 30000);
    });

    it('should extract IP from x-forwarded-for header', async () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);
      redisMock.get.mockResolvedValue(null);

      const context = createMockContext({
        ip: '127.0.0.1',
        headers: { 'x-forwarded-for': '203.0.113.195, 70.41.3.18, 150.172.238.178' },
      });
      const result = await guard.canActivate(context);

      expect(result).toBe(true);
      expect(redisMock.set).toHaveBeenCalledWith(
        'throttle:ip:203.0.113.195',
        '1',
        DEFAULT_THROTTLE_CONFIG.ip!.ttl,
      );
    });

    it('should increment counter for existing key', async () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);
      redisMock.get.mockResolvedValue('5');
      const mockClient = { incr: jest.fn().mockResolvedValue(6) };
      redisMock.getClient.mockReturnValue(mockClient);

      const context = createMockContext({ ip: '192.168.1.1' });
      const result = await guard.canActivate(context);

      expect(result).toBe(true);
      expect(mockClient.incr).toHaveBeenCalledWith('throttle:ip:192.168.1.1');
    });
  });

  describe('checkLimit', () => {
    it('should return blocked=false when under limit', async () => {
      redisMock.get.mockResolvedValue(null);

      const result = await guard.checkLimit('test:key', { ttl: 60000, limit: 10 });

      expect(result.blocked).toBe(false);
      expect(result.current).toBe(1);
      expect(result.limit).toBe(10);
    });

    it('should return blocked=true when at limit', async () => {
      redisMock.get.mockResolvedValue('10');
      redisMock.ttl.mockResolvedValue(30);

      const result = await guard.checkLimit('test:key', { ttl: 60000, limit: 10 });

      expect(result.blocked).toBe(true);
      expect(result.current).toBe(10);
      expect(result.limit).toBe(10);
      expect(result.remaining).toBe(30);
    });

    it('should return blocked=true when over limit', async () => {
      redisMock.get.mockResolvedValue('15');
      redisMock.ttl.mockResolvedValue(45);

      const result = await guard.checkLimit('test:key', { ttl: 60000, limit: 10 });

      expect(result.blocked).toBe(true);
      expect(result.current).toBe(15);
      expect(result.remaining).toBe(45);
    });
  });

  describe('resetLimit', () => {
    it('should delete the key from Redis', async () => {
      await guard.resetLimit('test:key');

      expect(redisMock.del).toHaveBeenCalledWith('test:key');
    });
  });

  describe('getStatus', () => {
    it('should return current status', async () => {
      redisMock.get.mockResolvedValue('5');
      redisMock.ttl.mockResolvedValue(30);

      const result = await guard.getStatus('test:key', { ttl: 60000, limit: 10 });

      expect(result.blocked).toBe(false);
      expect(result.current).toBe(5);
      expect(result.limit).toBe(10);
      expect(result.remaining).toBe(30);
    });

    it('should return blocked status when at limit', async () => {
      redisMock.get.mockResolvedValue('10');
      redisMock.ttl.mockResolvedValue(30);

      const result = await guard.getStatus('test:key', { ttl: 60000, limit: 10 });

      expect(result.blocked).toBe(true);
    });
  });

  describe('ThrottleException', () => {
    it('should create exception with default message', () => {
      const exception = new ThrottleException();

      expect(exception.getStatus()).toBe(429);
      expect(exception.getResponse()).toEqual({
        code: 429,
        msg: '请求过于频繁，请稍后再试',
        data: null,
        retryAfter: undefined,
      });
    });

    it('should create exception with custom message and retryAfter', () => {
      const exception = new ThrottleException('自定义消息', 60);

      expect(exception.getResponse()).toEqual({
        code: 429,
        msg: '自定义消息',
        data: null,
        retryAfter: 60,
      });
    });
  });
});
