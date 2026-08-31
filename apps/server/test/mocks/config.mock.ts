/**
 * Config Mock 服务
 *
 * @description
 * 提供配置服务的 Mock 实现
 * 用于单元测试中隔离配置依赖
 *
 * @requirements 5.1
 */

/**
 * 默认配置值
 */
export const defaultConfig = {
  // 应用配置
  app: {
    name: 'nest-admin-test',
    port: 3000,
    env: 'test',
    apiPrefix: '/api',
  },

  // 数据库配置
  database: {
    url: 'mysql://test:test@localhost:3306/test_db',
    logging: false,
  },

  // Redis 配置
  redis: {
    host: 'localhost',
    port: 6379,
    password: '',
    db: 0,
  },

  // JWT 配置
  jwt: {
    secret: 'test-jwt-secret-key-for-testing',
    expiresIn: '24h',
    refreshExpiresIn: '7d',
  },

  // 安全配置
  core: {
    bcryptRounds: 10,
    maxLoginAttempts: 5,
    lockoutDuration: 300, // 5 minutes
    passwordMinLength: 6,
    passwordMaxLength: 20,
  },

  // 上传配置
  upload: {
    maxFileSize: 10 * 1024 * 1024, // 10MB
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'],
    uploadDir: '/tmp/uploads',
  },

  // 缓存配置
  cache: {
    ttl: 3600, // 1 hour
    max: 1000,
  },

  // 日志配置
  logger: {
    level: 'debug',
    format: 'json',
  },

  // 租户配置
  tenant: {
    enabled: true,
    defaultTenantId: '000000',
  },
};

/**
 * Config Mock 类型
 */
export interface MockConfigService {
  get: jest.Mock<any, [string, any?]>;
  getOrThrow: jest.Mock<any, [string]>;
  _config: Record<string, any>;
  _setConfig: (path: string, value: any) => void;
  _resetAll: () => void;
}

/**
 * 根据路径获取嵌套对象的值
 */
const getNestedValue = (obj: Record<string, any>, path: string): any => {
  return path.split('.').reduce((current, key) => {
    return current?.[key];
  }, obj);
};

/**
 * 根据路径设置嵌套对象的值
 */
const setNestedValue = (obj: Record<string, any>, path: string, value: any): void => {
  const keys = path.split('.');
  const lastKey = keys.pop()!;
  const target = keys.reduce((current, key) => {
    if (!(key in current)) {
      current[key] = {};
    }
    return current[key];
  }, obj);
  target[lastKey] = value;
};

/**
 * 创建 Config Mock 服务
 *
 * @param overrides 覆盖默认配置的值
 * @returns MockConfigService 实例
 *
 * @example
 * ```typescript
 * const mockConfig = createMockConfig();
 * const jwtSecret = mockConfig.get('jwt.secret');
 *
 * // 覆盖配置
 * const mockConfig = createMockConfig({ 'jwt.expiresIn': '1h' });
 * ```
 */
export const createMockConfig = (overrides: Record<string, any> = {}): MockConfigService => {
  // 深拷贝默认配置
  const platform/config = JSON.parse(JSON.stringify(defaultConfig));

  // 应用覆盖值
  Object.entries(overrides).forEach(([path, value]) => {
    setNestedValue(platform/config, path, value);
  });

  const mock: MockConfigService = {
    get: jest.fn((path: string, defaultValue?: any) => {
      const value = getNestedValue(platform/config, path);
      return value !== undefined ? value : defaultValue;
    }),

    getOrThrow: jest.fn((path: string) => {
      const value = getNestedValue(platform/config, path);
      if (value === undefined) {
        throw new Error(`Configuration key "${path}" does not exist`);
      }
      return value;
    }),

    _config: platform/config,

    _setConfig: (path: string, value: any) => {
      setNestedValue(platform/config, path, value);
    },

    _resetAll: () => {
      // 重置为默认配置
      Object.keys(platform/config).forEach((key) => delete platform/config[key]);
      Object.assign(platform/config, JSON.parse(JSON.stringify(defaultConfig)));
      mock.get.mockClear();
      mock.getOrThrow.mockClear();
    },
  };

  return mock;
};

/**
 * 创建特定环境的 Config Mock
 */
export const createTestConfig = (): MockConfigService => {
  return createMockConfig({
    'app.env': 'test',
    'database.logging': false,
    'logger.level': 'error',
  });
};

export const createDevConfig = (): MockConfigService => {
  return createMockConfig({
    'app.env': 'development',
    'database.logging': true,
    'logger.level': 'debug',
  });
};

export const createProdConfig = (): MockConfigService => {
  return createMockConfig({
    'app.env': 'production',
    'database.logging': false,
    'logger.level': 'warn',
    'core.bcryptRounds': 12,
  });
};

export default createMockConfig;
