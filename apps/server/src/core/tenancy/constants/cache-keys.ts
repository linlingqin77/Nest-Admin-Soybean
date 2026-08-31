/**
 * 租户缓存键常量和生成函数
 *
 * 统一管理租户相关的缓存键，确保缓存隔离
 */

/**
 * 缓存键前缀
 */
export const CACHE_PREFIX = {
  /** 租户功能开关 */
  TENANT_FEATURE: 'tenant:feature:',
  /** 租户配额 */
  TENANT_QUOTA: 'tenant:quota:',
  /** 租户使用量 */
  TENANT_USAGE: 'tenant:usage:',
  /** 租户信息 */
  TENANT_INFO: 'tenant:info:',
  /** 用户信息 */
  USER_INFO: 'user:info:',
  /** 角色信息 */
  ROLE_INFO: 'role:info:',
  /** 部门信息 */
  DEPT_INFO: 'dept:info:',
  /** 菜单信息 */
  MENU_INFO: 'menu:info:',
  /** 字典信息 */
  DICT_INFO: 'dict:info:',
  /** 配置信息 */
  CONFIG_INFO: 'config:info:',
} as const;

/**
 * 缓存过期时间（秒）
 */
export const CACHE_TTL = {
  /** 短期缓存 - 1分钟 */
  SHORT: 60,
  /** 中期缓存 - 5分钟 */
  MEDIUM: 300,
  /** 长期缓存 - 30分钟 */
  LONG: 1800,
  /** 超长期缓存 - 1小时 */
  EXTRA_LONG: 3600,
} as const;

/**
 * 生成租户隔离的缓存键
 *
 * @param prefix 缓存键前缀
 * @param tenantId 租户ID
 * @param key 业务键
 * @returns 完整的缓存键
 */
export function getTenantCacheKey(prefix: string, tenantId: string, key?: string): string {
  if (key) {
    return `${prefix}${tenantId}:${key}`;
  }
  return `${prefix}${tenantId}`;
}

/**
 * 生成租户功能开关缓存键
 */
export function getFeatureCacheKey(tenantId: string): string {
  return getTenantCacheKey(CACHE_PREFIX.TENANT_FEATURE, tenantId);
}

/**
 * 生成租户配额缓存键
 */
export function getQuotaCacheKey(tenantId: string): string {
  return getTenantCacheKey(CACHE_PREFIX.TENANT_QUOTA, tenantId);
}

/**
 * 生成租户使用量缓存键
 */
export function getUsageCacheKey(tenantId: string, resource: string, date?: string): string {
  const dateStr = date || new Date().toISOString().split('T')[0];
  return getTenantCacheKey(CACHE_PREFIX.TENANT_USAGE, tenantId, `${resource}:${dateStr}`);
}

/**
 * 生成租户信息缓存键
 */
export function getTenantInfoCacheKey(tenantId: string): string {
  return getTenantCacheKey(CACHE_PREFIX.TENANT_INFO, tenantId);
}

/**
 * 生成用户信息缓存键
 */
export function getUserCacheKey(tenantId: string, userId: number | string): string {
  return getTenantCacheKey(CACHE_PREFIX.USER_INFO, tenantId, String(userId));
}

/**
 * 生成角色信息缓存键
 */
export function getRoleCacheKey(tenantId: string, roleId: number | string): string {
  return getTenantCacheKey(CACHE_PREFIX.ROLE_INFO, tenantId, String(roleId));
}

/**
 * 生成部门信息缓存键
 */
export function getDeptCacheKey(tenantId: string, deptId: number | string): string {
  return getTenantCacheKey(CACHE_PREFIX.DEPT_INFO, tenantId, String(deptId));
}

/**
 * 生成菜单信息缓存键
 */
export function getMenuCacheKey(tenantId: string, menuId?: number | string): string {
  if (menuId) {
    return getTenantCacheKey(CACHE_PREFIX.MENU_INFO, tenantId, String(menuId));
  }
  return getTenantCacheKey(CACHE_PREFIX.MENU_INFO, tenantId);
}

/**
 * 生成字典信息缓存键
 */
export function getDictCacheKey(tenantId: string, dictType?: string): string {
  if (dictType) {
    return getTenantCacheKey(CACHE_PREFIX.DICT_INFO, tenantId, dictType);
  }
  return getTenantCacheKey(CACHE_PREFIX.DICT_INFO, tenantId);
}

/**
 * 生成配置信息缓存键
 */
export function getConfigCacheKey(tenantId: string, configKey?: string): string {
  if (configKey) {
    return getTenantCacheKey(CACHE_PREFIX.CONFIG_INFO, tenantId, configKey);
  }
  return getTenantCacheKey(CACHE_PREFIX.CONFIG_INFO, tenantId);
}

/**
 * 生成租户缓存键模式（用于批量删除）
 *
 * @param prefix 缓存键前缀
 * @param tenantId 租户ID
 * @returns 缓存键模式
 */
export function getTenantCachePattern(prefix: string, tenantId: string): string {
  return `${prefix}${tenantId}:*`;
}
