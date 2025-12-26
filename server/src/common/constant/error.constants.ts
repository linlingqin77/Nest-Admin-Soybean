/**
 * 错误消息常量
 * Error Message Constants
 *
 * 用于统一管理系统中的错误消息，避免硬编码字符串
 * Used to centrally manage error messages in the system, avoiding hardcoded strings
 */

/**
 * 通用错误消息
 * Common Error Messages
 */
export const ERROR_MESSAGES = {
  // 数据库相关错误
  DATABASE: {
    CONNECTION_FAILED: '数据库连接失败',
    QUERY_FAILED: '数据库查询失败',
    TRANSACTION_FAILED: '数据库事务失败',
    POSTGRESQL_CONFIG_MISSING: 'PostgreSQL configuration (db.postgresql) is missing.',
  },

  // Repository 相关错误
  REPOSITORY: {
    CREATE_MANY_NOT_SUPPORTED: 'createMany not supported for this model',
    UPDATE_MANY_NOT_SUPPORTED: 'updateMany not supported for this model',
    DELETE_MANY_NOT_SUPPORTED: 'deleteMany not supported for this model',
  },

  // 加密相关错误
  CRYPTO: {
    RSA_DECRYPT_FAILED: 'RSA decrypt failed',
    RSA_ENCRYPT_FAILED: 'RSA encrypt failed',
    AES_DECRYPT_FAILED: 'AES decrypt failed',
    AES_ENCRYPT_FAILED: 'AES encrypt failed',
  },

  // 配置相关错误
  CONFIG: {
    VALIDATION_FAILED: '配置验证失败',
    ENV_VALIDATION_FAILED: '环境变量验证失败',
  },

  // 健康检查相关错误
  HEALTH: {
    REDIS_PING_FAILED: 'Redis PING failed',
    REDIS_CHECK_FAILED: 'Redis check failed',
    POSTGRESQL_CHECK_FAILED: 'PostgreSQL check failed',
  },

  // 通用错误
  COMMON: {
    UNKNOWN_ERROR: '未知错误',
    OPERATION_FAILED: '操作失败',
    INVALID_INPUT: '无效的输入',
    RESOURCE_NOT_FOUND: '资源不存在',
  },
} as const;

/**
 * 错误消息类型
 * Error Message Type
 */
export type ErrorMessage = typeof ERROR_MESSAGES;
