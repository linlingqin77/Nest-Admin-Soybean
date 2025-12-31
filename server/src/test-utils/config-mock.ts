import { AppConfigService } from 'src/config/app-config.service';
import {
  AppConfig,
  DatabaseConfig,
  RedisConfig,
  JwtConfig,
  TenantConfig,
  CryptoConfig,
  CosConfig,
  PermissionConfig,
  GeneratorConfig,
  UserConfig,
  ClientConfig,
  Configuration,
  LoggerConfig,
  FileConfig,
} from 'src/config/types';

/**
 * Config Mock 类型
 */
export type ConfigMock = Partial<jest.Mocked<AppConfigService>> & {
  /** 应用配置 */
  app: AppConfig;
  /** 数据库配置 */
  db: DatabaseConfig;
  /** Redis 配置 */
  redis: RedisConfig;
  /** JWT 配置 */
  jwt: JwtConfig;
  /** 租户配置 */
  tenant: TenantConfig;
  /** 加密配置 */
  crypto: CryptoConfig;
  /** COS 配置 */
  cos: CosConfig;
  /** 权限配置 */
  perm: PermissionConfig;
  /** 代码生成器配置 */
  gen: GeneratorConfig;
  /** 用户配置 */
  user: UserConfig;
  /** 客户端配置 */
  client: ClientConfig;
  /** 是否生产环境 */
  isProduction: boolean;
  /** 是否开发环境 */
  isDevelopment: boolean;
  /** 是否测试环境 */
  isTest: boolean;
  /** 获取配置值 */
  getValue: jest.Mock;
  /** 设置应用配置 */
  setApp: (config: Partial<AppConfig>) => void;
  /** 设置数据库配置 */
  setDb: (config: Partial<DatabaseConfig>) => void;
  /** 设置 Redis 配置 */
  setRedis: (config: Partial<RedisConfig>) => void;
  /** 设置 JWT 配置 */
  setJwt: (config: Partial<JwtConfig>) => void;
  /** 设置租户配置 */
  setTenant: (config: Partial<TenantConfig>) => void;
  /** 设置加密配置 */
  setCrypto: (config: Partial<CryptoConfig>) => void;
};

/**
 * 默认日志配置
 */
const defaultLoggerConfig: LoggerConfig = {
  dir: './logs',
  level: 'info',
  prettyPrint: true,
  toFile: false,
  excludePaths: [],
  sensitiveFields: ['password', 'token'],
};

/**
 * 默认文件配置
 */
const defaultFileConfig: FileConfig = {
  isLocal: true,
  location: './upload',
  domain: 'http://localhost:3000',
  serveRoot: '/upload',
  maxSize: 10,
  thumbnailEnabled: false,
};

/**
 * 默认应用配置
 */
const defaultAppConfig: AppConfig = {
  env: 'test',
  prefix: '/api',
  port: 3000,
  logger: defaultLoggerConfig,
  file: defaultFileConfig,
};

/**
 * 默认数据库配置
 */
const defaultDbConfig: DatabaseConfig = {
  postgresql: {
    host: 'localhost',
    port: 5432,
    username: 'test',
    password: 'test',
    database: 'test_db',
    schema: 'public',
    ssl: false,
  },
};

/**
 * 默认 Redis 配置
 */
const defaultRedisConfig: RedisConfig = {
  host: 'localhost',
  port: 6379,
  password: '',
  db: 0,
  keyPrefix: 'test:',
};

/**
 * 默认 JWT 配置
 */
const defaultJwtConfig: JwtConfig = {
  secretkey: 'test-secret-key-for-jwt-signing',
  expiresin: '24h',
  refreshExpiresIn: '7d',
};

/**
 * 默认租户配置
 */
const defaultTenantConfig: TenantConfig = {
  enabled: true,
  superTenantId: '000000',
  defaultTenantId: '000000',
};

/**
 * 默认加密配置
 */
const defaultCryptoConfig: CryptoConfig = {
  enabled: false,
  rsaPublicKey: '',
  rsaPrivateKey: '',
};

/**
 * 默认 COS 配置
 */
const defaultCosConfig: CosConfig = {
  secretId: '',
  secretKey: '',
  bucket: '',
  region: '',
  domain: '',
  location: '',
};

/**
 * 默认权限配置
 */
const defaultPermConfig: PermissionConfig = {
  router: {
    whitelist: [],
  },
};

/**
 * 默认代码生成器配置
 */
const defaultGenConfig: GeneratorConfig = {
  author: 'test',
  packageName: 'com.test',
  moduleName: 'test',
  autoRemovePre: false,
  tablePrefix: [],
};

/**
 * 默认用户配置
 */
const defaultUserConfig: UserConfig = {
  initialPassword: '123456',
};

/**
 * 默认客户端配置
 */
const defaultClientConfig: ClientConfig = {
  defaultClientId: 'test-client',
  defaultGrantType: 'password',
};

/**
 * 创建 Config Mock 实例
 *
 * @description
 * 创建一个完整的 AppConfigService Mock，提供默认配置值
 * 支持通过 setter 方法动态修改配置
 *
 * @example
 * ```typescript
 * const configMock = createConfigMock();
 *
 * // 使用默认配置
 * expect(configMock.app.port).toBe(3000);
 *
 * // 修改配置
 * configMock.setApp({ port: 8080 });
 * expect(configMock.app.port).toBe(8080);
 * ```
 */
export const createConfigMock = (): ConfigMock => {
  // 可变配置存储
  let appConfig = { ...defaultAppConfig };
  let dbConfig = { ...defaultDbConfig };
  let redisConfig = { ...defaultRedisConfig };
  let jwtConfig = { ...defaultJwtConfig };
  let tenantConfig = { ...defaultTenantConfig };
  let cryptoConfig = { ...defaultCryptoConfig };
  let cosConfig = { ...defaultCosConfig };
  let permConfig = { ...defaultPermConfig };
  let genConfig = { ...defaultGenConfig };
  let userConfig = { ...defaultUserConfig };
  let clientConfig = { ...defaultClientConfig };

  const mock: ConfigMock = {
    // Getter 属性
    get all(): Configuration {
      return {
        app: appConfig,
        db: dbConfig,
        redis: redisConfig,
        jwt: jwtConfig,
        tenant: tenantConfig,
        crypto: cryptoConfig,
        cos: cosConfig,
        perm: permConfig,
        gen: genConfig,
        user: userConfig,
        client: clientConfig,
      } as Configuration;
    },

    get app(): AppConfig {
      return appConfig;
    },

    get db(): DatabaseConfig {
      return dbConfig;
    },

    get redis(): RedisConfig {
      return redisConfig;
    },

    get jwt(): JwtConfig {
      return jwtConfig;
    },

    get tenant(): TenantConfig {
      return tenantConfig;
    },

    get crypto(): CryptoConfig {
      return cryptoConfig;
    },

    get cos(): CosConfig {
      return cosConfig;
    },

    get perm(): PermissionConfig {
      return permConfig;
    },

    get gen(): GeneratorConfig {
      return genConfig;
    },

    get user(): UserConfig {
      return userConfig;
    },

    get client(): ClientConfig {
      return clientConfig;
    },

    get isProduction(): boolean {
      return appConfig.env === 'production';
    },

    get isDevelopment(): boolean {
      return appConfig.env === 'development';
    },

    get isTest(): boolean {
      return appConfig.env === 'test';
    },

    // 方法
    getValue: jest.fn().mockImplementation((path: string, defaultValue?: any) => {
      const parts = path.split('.');
      let current: any = mock.all;
      for (const part of parts) {
        if (current === undefined || current === null) return defaultValue;
        current = current[part];
      }
      return current ?? defaultValue;
    }),

    // Setter 方法 - 用于测试中动态修改配置
    setApp: (config: Partial<AppConfig>) => {
      appConfig = { ...appConfig, ...config };
    },

    setDb: (config: Partial<DatabaseConfig>) => {
      dbConfig = { ...dbConfig, ...config };
    },

    setRedis: (config: Partial<RedisConfig>) => {
      redisConfig = { ...redisConfig, ...config };
    },

    setJwt: (config: Partial<JwtConfig>) => {
      jwtConfig = { ...jwtConfig, ...config };
    },

    setTenant: (config: Partial<TenantConfig>) => {
      tenantConfig = { ...tenantConfig, ...config };
    },

    setCrypto: (config: Partial<CryptoConfig>) => {
      cryptoConfig = { ...cryptoConfig, ...config };
    },
  };

  return mock;
};

/**
 * 创建自定义配置的 Config Mock
 *
 * @param overrides 要覆盖的配置
 * @returns ConfigMock 实例
 *
 * @example
 * ```typescript
 * const configMock = createConfigMockWith({
 *   app: { port: 8080, env: 'production' },
 *   jwt: { expiresin: '1h' },
 * });
 * ```
 */
export const createConfigMockWith = (
  overrides: Partial<{
    app: Partial<AppConfig>;
    db: Partial<DatabaseConfig>;
    redis: Partial<RedisConfig>;
    jwt: Partial<JwtConfig>;
    tenant: Partial<TenantConfig>;
    crypto: Partial<CryptoConfig>;
  }>,
): ConfigMock => {
  const mock = createConfigMock();

  if (overrides.app) mock.setApp(overrides.app);
  if (overrides.db) mock.setDb(overrides.db);
  if (overrides.redis) mock.setRedis(overrides.redis);
  if (overrides.jwt) mock.setJwt(overrides.jwt);
  if (overrides.tenant) mock.setTenant(overrides.tenant);
  if (overrides.crypto) mock.setCrypto(overrides.crypto);

  return mock;
};
