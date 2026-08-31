import { ExecutionContext } from '@nestjs/common';
import { ROUTE_ARGS_METADATA } from '@nestjs/common/constants';
import { ClientInfo } from '@/core/auth/decorators/common.decorator';

describe('Common Decorators', () => {
  describe('ClientInfo', () => {
    const createMockContext = (userAgent: string, ip: string, user?: any): ExecutionContext =>
      ({
        switchToHttp: () => ({
          getRequest: () => ({
            headers: { 'user-agent': userAgent },
            ip,
            user,
          }),
        }),
        getHandler: () => jest.fn(),
        getClass: () => jest.fn(),
        getType: () => 'http',
        getArgs: () => [],
        getArgByIndex: () => ({}),
        switchToRpc: () => ({}) as any,
        switchToWs: () => ({}) as any,
      }) as unknown as ExecutionContext;

    // Helper to get the decorator factory
    const getDecoratorFactory = () => {
      class TestClass {
        test(@ClientInfo() info: any) {
          return info;
        }
      }
      const metadata = Reflect.getMetadata(ROUTE_ARGS_METADATA, TestClass, 'test');
      const key = Object.keys(metadata)[0];
      return metadata[key].factory;
    };

    it('should extract client info from Chrome on Windows', () => {
      const userAgent =
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
      const ctx = createMockContext(userAgent, '192.168.1.1');
      const factory = getDecoratorFactory();

      const result = factory(undefined, ctx);

      expect(result.ipaddr).toBe('192.168.1.1');
      expect(result.browser).toContain('Chrome');
      expect(result.os).toBe('Windows');
      expect(result.deviceType).toBe('0'); // PC
    });

    it('should extract client info from Safari on iOS', () => {
      const userAgent =
        'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1';
      const ctx = createMockContext(userAgent, '10.0.0.1');
      const factory = getDecoratorFactory();

      const result = factory(undefined, ctx);

      expect(result.ipaddr).toBe('10.0.0.1');
      expect(result.browser).toContain('Safari');
      expect(result.deviceType).toBe('1'); // Mobile
    });

    it('should extract client info from Android device', () => {
      const userAgent =
        'Mozilla/5.0 (Linux; Android 13; SM-G991B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36';
      const ctx = createMockContext(userAgent, '172.16.0.1');
      const factory = getDecoratorFactory();

      const result = factory(undefined, ctx);

      expect(result.ipaddr).toBe('172.16.0.1');
      expect(result.deviceType).toBe('1'); // Mobile
    });

    it('should include userName when user is authenticated', () => {
      const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0';
      const ctx = createMockContext(userAgent, '127.0.0.1', { user: { userName: 'admin' } });
      const factory = getDecoratorFactory();

      const result = factory(undefined, ctx);

      expect(result.userName).toBe('admin');
    });

    it('should handle missing user', () => {
      const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0';
      const ctx = createMockContext(userAgent, '127.0.0.1');
      const factory = getDecoratorFactory();

      const result = factory(undefined, ctx);

      expect(result.userName).toBeUndefined();
    });

    it('should handle Firefox on macOS', () => {
      const userAgent = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:121.0) Gecko/20100101 Firefox/121.0';
      const ctx = createMockContext(userAgent, '192.168.0.100');
      const factory = getDecoratorFactory();

      const result = factory(undefined, ctx);

      expect(result.browser).toContain('Firefox');
      expect(result.os).toBe('Mac OS X');
      expect(result.deviceType).toBe('0'); // PC
    });

    it('should set loginLocation to empty string', () => {
      const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0';
      const ctx = createMockContext(userAgent, '127.0.0.1');
      const factory = getDecoratorFactory();

      const result = factory(undefined, ctx);

      expect(result.loginLocation).toBe('');
    });
  });
});
