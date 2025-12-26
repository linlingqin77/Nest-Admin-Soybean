/**
 * 配置相关常量
 * Configuration Constants
 *
 * 用于统一管理系统配置键名和配置相关常量
 * Used to centrally manage system configuration keys and related constants
 */

/**
 * 系统配置键名常量
 * System Configuration Key Constants
 */
export const CONFIG_KEYS = {
  // 账户相关配置
  ACCOUNT: {
    CAPTCHA_ENABLED: 'sys.account.captchaEnabled',
  },

  // 文件相关配置
  FILE: {
    AUTO_CLEAN_VERSIONS: 'sys.file.autoCleanVersions',
    MAX_VERSIONS: 'sys.file.maxVersions',
  },

  // 系统相关配置
  SYSTEM: {
    // 可以根据需要添加更多系统配置键
  },
} as const;

/**
 * 缓存键前缀常量
 * Cache Key Prefix Constants
 */
export const CACHE_KEYS = {
  // 系统配置缓存
  SYSTEM_CONFIG: 'system:config',

  // 租户配置缓存
  TENANT_CONFIG: 'tenant:config',

  // 用户缓存
  USER: 'user',

  // 角色缓存
  ROLE: 'role',

  // 权限缓存
  PERMISSION: 'permission',

  // 菜单缓存
  MENU: 'menu',

  // 字典缓存
  DICT: 'dict',
} as const;

/**
 * Redis Key 前缀常量
 * Redis Key Prefix Constants
 */
export const REDIS_KEY_PREFIX = {
  // 登录令牌
  LOGIN_TOKEN: 'login:token',

  // 验证码
  CAPTCHA: 'captcha',

  // 在线用户
  ONLINE_USER: 'online:user',

  // 限流
  RATE_LIMIT: 'rate:limit',
} as const;

/**
 * 环境变量键名常量
 * Environment Variable Key Constants
 */
export const ENV_KEYS = {
  NODE_ENV: 'NODE_ENV',
  PORT: 'PORT',

  // 数据库
  DB_HOST: 'DB_HOST',
  DB_PORT: 'DB_PORT',
  DB_USERNAME: 'DB_USERNAME',
  DB_PASSWORD: 'DB_PASSWORD',
  DB_DATABASE: 'DB_DATABASE',

  // Redis
  REDIS_HOST: 'REDIS_HOST',
  REDIS_PORT: 'REDIS_PORT',
  REDIS_PASSWORD: 'REDIS_PASSWORD',
  REDIS_DB: 'REDIS_DB',

  // JWT
  JWT_SECRET: 'JWT_SECRET',
  JWT_EXPIRES_IN: 'JWT_EXPIRES_IN',

  // 租户
  TENANT_ENABLED: 'TENANT_ENABLED',
} as const;

/**
 * 配置类型常量
 * Configuration Type Constants
 */
export type ConfigKey = typeof CONFIG_KEYS;
export type CacheKey = typeof CACHE_KEYS;
export type RedisKeyPrefix = typeof REDIS_KEY_PREFIX;
export type EnvKey = typeof ENV_KEYS;
