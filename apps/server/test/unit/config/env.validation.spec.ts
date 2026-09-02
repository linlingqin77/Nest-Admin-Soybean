import 'reflect-metadata';
import { validate } from '@/platform/config/env.validation';

describe('env.validation', () => {
  describe('validate', () => {
    const validConfig = {
      NODE_ENV: 'development',
      DATABASE_URL: 'postgresql://user:pass@localhost:5432/db',
    };

    it('should validate valid platform/config', () => {
      const result = validate(validConfig);

      expect(result).toBeDefined();
      expect(result.NODE_ENV).toBe('development');
      expect(result.DATABASE_URL).toBe('postgresql://user:pass@localhost:5432/db');
    });

    it('should validate production environment', () => {
      const result = validate({ ...validConfig, NODE_ENV: 'production' });

      expect(result.NODE_ENV).toBe('production');
    });

    it('should validate test environment', () => {
      const result = validate({ ...validConfig, NODE_ENV: 'test' });

      expect(result.NODE_ENV).toBe('test');
    });

    it('should throw error for invalid NODE_ENV', () => {
      expect(() => validate({ ...validConfig, NODE_ENV: 'invalid' })).toThrow('环境变量验证失败');
    });

    it('should throw error for missing DATABASE_URL', () => {
      expect(() => validate({ NODE_ENV: 'development' })).toThrow('环境变量验证失败');
    });

    it('should validate optional APP_PORT', () => {
      const result = validate({ ...validConfig, APP_PORT: 3000 });

      expect(result.APP_PORT).toBe(3000);
    });

    it('should throw error for invalid APP_PORT (too high)', () => {
      expect(() => validate({ ...validConfig, APP_PORT: 70000 })).toThrow('环境变量验证失败');
    });

    it('should throw error for invalid APP_PORT (too low)', () => {
      expect(() => validate({ ...validConfig, APP_PORT: 0 })).toThrow('环境变量验证失败');
    });

    it('should validate optional LOG_LEVEL', () => {
      const result = validate({ ...validConfig, LOG_LEVEL: 'debug' });

      expect(result.LOG_LEVEL).toBe('debug');
    });

    it('should throw error for invalid LOG_LEVEL', () => {
      expect(() => validate({ ...validConfig, LOG_LEVEL: 'invalid' })).toThrow('环境变量验证失败');
    });

    it('should validate optional REDIS_PORT', () => {
      const result = validate({ ...validConfig, REDIS_PORT: 6379 });

      expect(result.REDIS_PORT).toBe(6379);
    });

    it('should validate optional REDIS_DB', () => {
      const result = validate({ ...validConfig, REDIS_DB: 0 });

      expect(result.REDIS_DB).toBe(0);
    });

    it('should throw error for invalid REDIS_DB (too high)', () => {
      expect(() => validate({ ...validConfig, REDIS_DB: 16 })).toThrow('环境变量验证失败');
    });

    it('should validate JWT_EXPIRES_IN format', () => {
      const result = validate({ ...validConfig, JWT_EXPIRES_IN: '2h' });

      expect(result.JWT_EXPIRES_IN).toBe('2h');
    });

    it('should validate JWT_EXPIRES_IN with days', () => {
      const result = validate({ ...validConfig, JWT_EXPIRES_IN: '7d' });

      expect(result.JWT_EXPIRES_IN).toBe('7d');
    });

    it('should throw error for invalid JWT_EXPIRES_IN format', () => {
      expect(() => validate({ ...validConfig, JWT_EXPIRES_IN: 'invalid' })).toThrow('环境变量验证失败');
    });

    it('should validate JWT_REFRESH_EXPIRES_IN format', () => {
      const result = validate({ ...validConfig, JWT_REFRESH_EXPIRES_IN: '30d' });

      expect(result.JWT_REFRESH_EXPIRES_IN).toBe('30d');
    });

    it('should validate optional FILE_MAX_SIZE', () => {
      const result = validate({ ...validConfig, FILE_MAX_SIZE: 50 });

      expect(result.FILE_MAX_SIZE).toBe(50);
    });

    it('should throw error for invalid FILE_MAX_SIZE (too high)', () => {
      expect(() => validate({ ...validConfig, FILE_MAX_SIZE: 300 })).toThrow('环境变量验证失败');
    });

    it('should validate optional TENANT_ENABLED', () => {
      const result = validate({ ...validConfig, TENANT_ENABLED: true });

      expect(result.TENANT_ENABLED).toBe(true);
    });

    it('should validate optional CLIENT_DEFAULT_GRANT_TYPE', () => {
      const result = validate({ ...validConfig, CLIENT_DEFAULT_GRANT_TYPE: 'password' });

      expect(result.CLIENT_DEFAULT_GRANT_TYPE).toBe('password');
    });

    it('should throw error for invalid CLIENT_DEFAULT_GRANT_TYPE', () => {
      expect(() => validate({ ...validConfig, CLIENT_DEFAULT_GRANT_TYPE: 'invalid' })).toThrow('环境变量验证失败');
    });

    it('should validate all valid grant types', () => {
      const grantTypes = ['password', 'authorization_code', 'client_credentials', 'refresh_token'];

      grantTypes.forEach((grantType) => {
        const result = validate({ ...validConfig, CLIENT_DEFAULT_GRANT_TYPE: grantType });
        expect(result.CLIENT_DEFAULT_GRANT_TYPE).toBe(grantType);
      });
    });

    it('should validate optional boolean fields', () => {
      const result = validate({
        ...validConfig,
        LOG_PRETTY_PRINT: true,
        LOG_TO_FILE: false,
        FILE_IS_LOCAL: true,
        DB_SSL: false,
        CRYPTO_ENABLED: true,
        GEN_AUTO_REMOVE_PRE: false,
      });

      expect(result.LOG_PRETTY_PRINT).toBe(true);
      expect(result.LOG_TO_FILE).toBe(false);
      expect(result.FILE_IS_LOCAL).toBe(true);
      expect(result.DB_SSL).toBe(false);
      expect(result.CRYPTO_ENABLED).toBe(true);
      expect(result.GEN_AUTO_REMOVE_PRE).toBe(false);
    });

    it('should validate optional string fields', () => {
      const result = validate({
        ...validConfig,
        APP_PREFIX: '/api',
        LOG_DIR: './logs',
        REDIS_HOST: 'localhost',
        REDIS_KEY_PREFIX: 'app:',
      });

      expect(result.APP_PREFIX).toBe('/api');
      expect(result.LOG_DIR).toBe('./logs');
      expect(result.REDIS_HOST).toBe('localhost');
      expect(result.REDIS_KEY_PREFIX).toBe('app:');
    });
  });
});
