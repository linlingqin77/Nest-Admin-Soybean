/**
 * 登录用户 redis key 过期时间
 * 24h
 */
export const LOGIN_TOKEN_EXPIRESIN = 1000 * 60 * 60 * 24;

/**
 * 超级管理员用户 ID
 * 系统内置的超级管理员用户，不可被修改或删除
 */
export const SUPER_ADMIN_USER_ID = 1;

/**
 * 超级管理员角色 ID
 * 系统内置的超级管理员角色，不可被分配给普通用户
 */
export const SUPER_ADMIN_ROLE_ID = 1;

/**
 * 用户类型
 * 00系统用户,10自定义用户
 *
 * 20 客户端用户
 */
export const enum SYS_USER_TYPE {
  SYS = '00',
  CUSTOM = '10',
  CLIENT = '20',
}

// Re-export all constants
export * from './api-version';
export * from './business.constant';
export * from './gen.constant';
export * from './config-keys.constant';
