import { ConfigTransformer } from '@/config/config.transformer';

// Mock the Configuration class
jest.mock('@/config/types', () => {
  class MockConfiguration {
    app = { port: 3000 };
    db = { postgresql: { password: 'secret' } };
    redis = { password: 'redis-secret' };
    jwt = { secretkey: 'jwt-secret' };
    crypto = { rsaPrivateKey: 'private-key' };
    cos = { secretKey: 'cos-secret' };
  }
  return { Configuration: MockConfiguration };
});

// Mock class-transformer
jest.mock('class-transformer', () => ({
  plainToInstance: jest.fn().mockImplementation((cls, obj) => {
    const instance = new cls();
    Object.assign(instance, obj);
    return instance;
  }),
}));

// Mock class-validator
jest.mock('class-validator', () => ({
  validateSync: jest.fn().mockReturnValue([]),
}));

describe('ConfigTransformer', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('transform', () => {
    it('should transform raw platform/config to Configuration instance', () => {
      const rawConfig = { app: { port: 3000 } };

      const result = ConfigTransformer.transform(rawConfig);

      expect(result).toBeDefined();
    });

    it('should throw error when validation fails', () => {
      const { validateSync } = require('class-validator');
      validateSync.mockReturnValue([
        {
          property: 'app',
          constraints: { isNotEmpty: 'app should not be empty' },
          children: [],
        },
      ]);

      expect(() => ConfigTransformer.transform({})).toThrow('配置验证失败');
    });

    it('should include nested validation errors', () => {
      const { validateSync } = require('class-validator');
      validateSync.mockReturnValue([
        {
          property: 'db',
          constraints: {},
          children: [
            {
              property: 'host',
              constraints: { isNotEmpty: 'host should not be empty' },
            },
          ],
        },
      ]);

      expect(() => ConfigTransformer.transform({})).toThrow('配置验证失败');
    });
  });

  describe('printSafe', () => {
    it('should hide sensitive information', () => {
      const platform/config = {
        app: { port: 3000 },
        db: { postgresql: { password: 'secret-password' } },
        redis: { password: 'redis-password' },
        jwt: { secretkey: 'jwt-secret-key' },
        crypto: { rsaPrivateKey: 'private-key-content' },
        cos: { secretKey: 'cos-secret-key' },
      };

      const result = ConfigTransformer.printSafe(platform/config as any);
      const parsed = JSON.parse(result);

      expect(parsed.db.postgresql.password).toBe('******');
      expect(parsed.redis.password).toBe('******');
      expect(parsed.jwt.secretkey).toBe('******');
      expect(parsed.crypto.rsaPrivateKey).toBe('******');
      expect(parsed.cos.secretKey).toBe('******');
    });

    it('should preserve non-sensitive information', () => {
      const platform/config = {
        app: { port: 3000, name: 'test-app' },
        db: { postgresql: { host: 'localhost', password: 'secret' } },
        redis: { host: 'localhost', password: 'secret' },
        jwt: { secretkey: 'secret' },
        crypto: { rsaPrivateKey: 'key' },
        cos: { secretKey: 'key' },
      };

      const result = ConfigTransformer.printSafe(platform/config as any);
      const parsed = JSON.parse(result);

      expect(parsed.app.port).toBe(3000);
      expect(parsed.app.name).toBe('test-app');
      expect(parsed.db.postgresql.host).toBe('localhost');
    });

    it('should handle missing sensitive fields', () => {
      const platform/config = {
        app: { port: 3000 },
      };

      const result = ConfigTransformer.printSafe(platform/config as any);
      const parsed = JSON.parse(result);

      expect(parsed.app.port).toBe(3000);
    });
  });
});
