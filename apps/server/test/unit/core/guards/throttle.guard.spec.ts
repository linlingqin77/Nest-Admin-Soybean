import { ExecutionContext } from '@nestjs/common';
import { ThrottlerException } from '@nestjs/throttler';
import { CustomThrottlerGuard } from '@/core/http/guards/throttle.guard';

describe('CustomThrottlerGuard', () => {
  let guard: CustomThrottlerGuard;

  beforeEach(() => {
    guard = new CustomThrottlerGuard(
      { throttlers: [{ name: 'default', limit: 10, ttl: 60000 }] },
      {} as any,
      {} as any,
    );
  });

  describe('getTracker', () => {
    it('should return user-based tracker when user is authenticated', async () => {
      const req = {
        user: { userId: 123, tenantId: 'tenant-001' },
        ip: '127.0.0.1',
      };

      const tracker = await (guard as any).getTracker(req);
      expect(tracker).toBe('user-tenant-001-123');
    });

    it('should return user-based tracker with default tenant when tenantId is not provided', async () => {
      const req = {
        user: { userId: 123 },
        ip: '127.0.0.1',
      };

      const tracker = await (guard as any).getTracker(req);
      expect(tracker).toBe('user-default-123');
    });

    it('should return ip-based tracker when user is not authenticated', async () => {
      const req = {
        ip: '192.168.1.1',
      };

      const tracker = await (guard as any).getTracker(req);
      expect(tracker).toBe('ip-192.168.1.1');
    });

    it('should use x-forwarded-for header when ip is not available', async () => {
      const req = {
        headers: { 'x-forwarded-for': '10.0.0.1' },
      };

      const tracker = await (guard as any).getTracker(req);
      expect(tracker).toBe('ip-10.0.0.1');
    });

    it('should use x-real-ip header as fallback', async () => {
      const req = {
        headers: { 'x-real-ip': '10.0.0.2' },
      };

      const tracker = await (guard as any).getTracker(req);
      expect(tracker).toBe('ip-10.0.0.2');
    });

    it('should use socket remoteAddress as fallback', async () => {
      const req = {
        socket: { remoteAddress: '172.16.0.1' },
      };

      const tracker = await (guard as any).getTracker(req);
      expect(tracker).toBe('ip-172.16.0.1');
    });

    it('should return unknown when no ip info available', async () => {
      const req = {};

      const tracker = await (guard as any).getTracker(req);
      expect(tracker).toBe('ip-unknown');
    });
  });

  describe('throwThrottlingException', () => {
    it('should throw ThrottlerException with Chinese message', async () => {
      const context = {} as ExecutionContext;

      await expect((guard as any).throwThrottlingException(context)).rejects.toThrow(ThrottlerException);
      await expect((guard as any).throwThrottlingException(context)).rejects.toThrow('请求过于频繁，请稍后再试');
    });

    it('should include retry time in message when throttlerLimitDetail is provided', async () => {
      const context = {} as ExecutionContext;
      const throttlerLimitDetail = {
        timeToExpire: 30000, // 30 seconds
        timeToBlockExpire: 60000, // 60 seconds
      };

      await expect((guard as any).throwThrottlingException(context, throttlerLimitDetail)).rejects.toThrow(
        '请求过于频繁，请 60 秒后再试',
      );
    });
  });
});
