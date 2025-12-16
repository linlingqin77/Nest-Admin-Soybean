/**
 * Pure environment variable configuration loader.
 * Environment variables are the single source of truth.
 */

const env = process.env.NODE_ENV || 'development';

const bool = (val: string | undefined, fallback: boolean) => {
  if (val === undefined) return fallback;
  return val === 'true' || val === '1';
};

const num = (val: string | undefined, fallback: number) => {
  const parsed = Number(val);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const json = <T>(val: string | undefined, fallback: T): T => {
  if (!val) return fallback;
  try {
    return JSON.parse(val) as T;
  } catch (e) {
    // Fallback when JSON parse fails
    return fallback;
  }
};

const defaultWhitelist = [
  { path: '/captchaImage', method: 'GET' },
  { path: '/login', method: 'POST' },
  { path: '/logout', method: 'POST' },
  { path: '/getInfo', method: 'GET' },
];

export default () => ({
  app: {
    env,
    prefix: process.env.APP_PREFIX || '/api',
    port: num(process.env.APP_PORT, 8080),
    logger: {
      dir:
        process.env.LOG_DIR ||
        (env === 'production' ? '/var/log/nest-admin-soybean' : '../logs'),
      level: process.env.LOG_LEVEL || (env === 'production' ? 'info' : 'debug'),
      prettyPrint: bool(process.env.LOG_PRETTY_PRINT, env === 'development'),
      toFile: bool(process.env.LOG_TO_FILE, env === 'production'),
      excludePaths: json(process.env.LOG_EXCLUDE_PATHS, [
        '/health',
        '/metrics',
        '/api-docs',
        '/favicon.ico',
      ]),
      sensitiveFields: json(process.env.LOG_SENSITIVE_FIELDS, [
        'password',
        'passwd',
        'pwd',
        'token',
        'accessToken',
        'refreshToken',
        'access_token',
        'refresh_token',
        'authorization',
        'cookie',
        'secret',
        'secretKey',
        'apiKey',
        'api_key',
      ]),
    },
    file: {
      isLocal: bool(process.env.FILE_IS_LOCAL, env !== 'production'),
      location:
        process.env.FILE_UPLOAD_LOCATION ||
        (env === 'production' ? '/data/upload' : '../upload'),
      domain:
        process.env.FILE_DOMAIN ||
        (env === 'production' ? 'https://your-domain.com' : 'http://localhost:8080'),
      serveRoot: process.env.FILE_SERVE_ROOT || '/profile',
      maxSize: num(process.env.FILE_MAX_SIZE, 10),
    },
  },

  cos: {
    secretId: process.env.COS_SECRET_ID || '',
    secretKey: process.env.COS_SECRET_KEY || '',
    bucket: process.env.COS_BUCKET || '',
    region: process.env.COS_REGION || '',
    domain: process.env.COS_DOMAIN || '',
    location: process.env.COS_LOCATION || '',
  },

  db: {
    postgresql: {
      host: process.env.DB_HOST || '127.0.0.1',
      username: process.env.DB_USERNAME || 'postgres',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_DATABASE || 'nest-admin-soybean',
      port: num(process.env.DB_PORT, 5432),
      ssl: bool(process.env.DB_SSL, env === 'production'),
      schema: process.env.DB_SCHEMA || 'public',
    },
  },

  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    password: process.env.REDIS_PASSWORD || '',
    port: num(process.env.REDIS_PORT, 6379),
    db: num(process.env.REDIS_DB, env === 'production' ? 0 : 2),
    keyPrefix: process.env.REDIS_KEY_PREFIX || (env === 'production' ? 'nest-admin-soybean:' : ''),
  },

  jwt: {
    secretkey: process.env.JWT_SECRET || 'change-me-in-production',
    expiresin: process.env.JWT_EXPIRES_IN || '1h',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '2h',
  },

  perm: {
    router: {
      whitelist: json(process.env.PERM_WHITELIST, defaultWhitelist),
    },
  },

  gen: {
    author: process.env.GEN_AUTHOR || 'linlingqin77',
    packageName: process.env.GEN_PACKAGE_NAME || 'system',
    moduleName: process.env.GEN_MODULE_NAME || 'system',
    autoRemovePre: bool(process.env.GEN_AUTO_REMOVE_PRE, false),
    tablePrefix: (process.env.GEN_TABLE_PREFIX || 'sys_').split(','),
  },

  user: {
    initialPassword: process.env.USER_INITIAL_PASSWORD || '123456',
  },

  tenant: {
    enabled: bool(process.env.TENANT_ENABLED, true),
    superTenantId: process.env.TENANT_SUPER_ID || '000000',
    defaultTenantId: process.env.TENANT_DEFAULT_ID || '000000',
  },

  crypto: {
    enabled: bool(process.env.CRYPTO_ENABLED, false),
    rsaPublicKey: process.env.CRYPTO_RSA_PUBLIC_KEY || '',
    rsaPrivateKey: process.env.CRYPTO_RSA_PRIVATE_KEY || '',
  },

  client: {
    defaultClientId: process.env.CLIENT_DEFAULT_ID || 'pc',
    defaultGrantType: process.env.CLIENT_DEFAULT_GRANT_TYPE || 'password',
  },
});
