/**
 * 租户测试辅助函数
 *
 * @description
 * 提供租户模块测试所需的辅助函数
 * 包含 runWithTenant, runIgnoringTenant, createTestTenant 等辅助函数
 *
 * @requirements 1.1, 2.1, 3.1
 */

import { TenantContext, TenantContextData } from '../../src/core/tenancy/context/tenant.context';
import { SUPER_TENANT_ID } from '../../src/core/tenancy/constants/tenant-models';
import {
  createTenantMockPrisma,
  createTenantMockRedis,
  createTenantMockConfig,
  createMockAppConfigService,
  TenantTestConfig,
  TenantTestData,
  UserTestData,
  QuotaTestData,
  generateRandomTenantId,
  generateNormalTenantId,
  generateTenantIdPair,
} from '../mocks/tenant.mock';

/**
 * 租户测试辅助类
 *
 * 提供租户上下文管理和测试数据创建的辅助方法
 */
export class TenantTestHelper {
  private mockConfig: TenantTestConfig;

  constructor(mockConfig: Partial<TenantTestConfig> = {}) {
    this.mockConfig = {
      enabled: true,
      superTenantId: SUPER_TENANT_ID,
      defaultTenantId: SUPER_TENANT_ID,
      ...mockConfig,
    };
  }

  /**
   * 在指定租户上下文中运行测试
   *
   * @param tenantId 租户ID
   * @param fn 要执行的回调函数
   * @returns 回调函数的返回值
   *
   * @example
   * ```typescript
   * const helper = new TenantTestHelper();
   * const result = helper.runWithTenant('100001', () => {
   *   return TenantContext.getTenantId();
   * });
   * expect(result).toBe('100001');
   * ```
   */
  runWithTenant<T>(tenantId: string, fn: () => T): T {
    return TenantContext.run({ tenantId }, fn);
  }

  /**
   * 在指定租户上下文中运行异步测试
   *
   * @param tenantId 租户ID
   * @param fn 要执行的异步回调函数
   * @returns Promise 包装的回调函数返回值
   */
  async runWithTenantAsync<T>(tenantId: string, fn: () => Promise<T>): Promise<T> {
    return TenantContext.run({ tenantId }, fn);
  }

  /**
   * 在忽略租户过滤的上下文中运行测试
   *
   * @param fn 要执行的回调函数
   * @returns 回调函数的返回值
   *
   * @example
   * ```typescript
   * const helper = new TenantTestHelper();
   * const result = helper.runIgnoringTenant(() => {
   *   return TenantContext.isIgnoreTenant();
   * });
   * expect(result).toBe(true);
   * ```
   */
  runIgnoringTenant<T>(fn: () => T): T {
    return TenantContext.runIgnoringTenant(fn);
  }

  /**
   * 在忽略租户过滤的上下文中运行异步测试
   *
   * @param fn 要执行的异步回调函数
   * @returns Promise 包装的回调函数返回值
   */
  async runIgnoringTenantAsync<T>(fn: () => Promise<T>): Promise<T> {
    return TenantContext.runIgnoringTenant(fn);
  }

  /**
   * 在超级租户上下文中运行测试
   *
   * @param fn 要执行的回调函数
   * @returns 回调函数的返回值
   */
  runAsSuperTenant<T>(fn: () => T): T {
    return TenantContext.run({ tenantId: SUPER_TENANT_ID }, fn);
  }

  /**
   * 在超级租户上下文中运行异步测试
   *
   * @param fn 要执行的异步回调函数
   * @returns Promise 包装的回调函数返回值
   */
  async runAsSuperTenantAsync<T>(fn: () => Promise<T>): Promise<T> {
    return TenantContext.run({ tenantId: SUPER_TENANT_ID }, fn);
  }

  /**
   * 创建测试租户数据
   *
   * @param overrides 覆盖默认值
   * @returns 租户测试数据
   */
  createTestTenant(overrides: Partial<TenantTestData> = {}): TenantTestData {
    return {
      tenantId: generateNormalTenantId(),
      companyName: '测试租户',
      status: '0',
      delFlag: '0',
      expireTime: new Date('2099-12-31'),
      accountCount: 100,
      packageId: 1,
      ...overrides,
    };
  }

  /**
   * 创建测试用户数据
   *
   * @param tenantId 租户ID
   * @param overrides 覆盖默认值
   * @returns 用户测试数据
   */
  createTestUser(tenantId: string, overrides: Partial<UserTestData> = {}): UserTestData {
    return {
      userId: Math.floor(Math.random() * 10000) + 1,
      tenantId,
      userName: `testuser_${Date.now()}`,
      status: '0',
      delFlag: '0',
      ...overrides,
    };
  }

  /**
   * 创建测试配额数据
   *
   * @param tenantId 租户ID
   * @param overrides 覆盖默认值
   * @returns 配额测试数据
   */
  createTestQuota(tenantId: string, overrides: Partial<QuotaTestData> = {}): QuotaTestData {
    return {
      tenantId,
      resource: 'users',
      quota: 100,
      currentUsage: 50,
      ...overrides,
    };
  }

  /**
   * 生成随机租户ID
   *
   * @returns 随机租户ID
   */
  generateTenantId(): string {
    return generateRandomTenantId();
  }

  /**
   * 生成非超级租户的随机租户ID
   *
   * @returns 非超级租户的随机租户ID
   */
  generateNormalTenantId(): string {
    return generateNormalTenantId();
  }

  /**
   * 生成租户ID对 (用于隔离测试)
   *
   * @returns 两个不同的租户ID
   */
  generateTenantIdPair(): [string, string] {
    return generateTenantIdPair();
  }

  /**
   * 检查是否为超级租户ID
   *
   * @param tenantId 租户ID
   * @returns 是否为超级租户
   */
  isSuperTenantId(tenantId: string): boolean {
    return tenantId === SUPER_TENANT_ID;
  }

  /**
   * 获取超级租户ID
   *
   * @returns 超级租户ID
   */
  getSuperTenantId(): string {
    return SUPER_TENANT_ID;
  }

  /**
   * 获取配置
   *
   * @returns 租户测试配置
   */
  getConfig(): TenantTestConfig {
    return this.mockConfig;
  }
}

/**
 * 在指定租户上下文中运行测试 (静态函数)
 *
 * @param tenantId 租户ID
 * @param fn 要执行的回调函数
 * @returns 回调函数的返回值
 */
export function runWithTenant<T>(tenantId: string, fn: () => T): T {
  return TenantContext.run({ tenantId }, fn);
}

/**
 * 在指定租户上下文中运行异步测试 (静态函数)
 *
 * @param tenantId 租户ID
 * @param fn 要执行的异步回调函数
 * @returns Promise 包装的回调函数返回值
 */
export async function runWithTenantAsync<T>(tenantId: string, fn: () => Promise<T>): Promise<T> {
  return TenantContext.run({ tenantId }, fn);
}

/**
 * 在忽略租户过滤的上下文中运行测试 (静态函数)
 *
 * @param fn 要执行的回调函数
 * @returns 回调函数的返回值
 */
export function runIgnoringTenant<T>(fn: () => T): T {
  return TenantContext.runIgnoringTenant(fn);
}

/**
 * 在忽略租户过滤的上下文中运行异步测试 (静态函数)
 *
 * @param fn 要执行的异步回调函数
 * @returns Promise 包装的回调函数返回值
 */
export async function runIgnoringTenantAsync<T>(fn: () => Promise<T>): Promise<T> {
  return TenantContext.runIgnoringTenant(fn);
}

/**
 * 在超级租户上下文中运行测试 (静态函数)
 *
 * @param fn 要执行的回调函数
 * @returns 回调函数的返回值
 */
export function runAsSuperTenant<T>(fn: () => T): T {
  return TenantContext.run({ tenantId: SUPER_TENANT_ID }, fn);
}

/**
 * 在超级租户上下文中运行异步测试 (静态函数)
 *
 * @param fn 要执行的异步回调函数
 * @returns Promise 包装的回调函数返回值
 */
export async function runAsSuperTenantAsync<T>(fn: () => Promise<T>): Promise<T> {
  return TenantContext.run({ tenantId: SUPER_TENANT_ID }, fn);
}

/**
 * 创建测试租户数据 (静态函数)
 *
 * @param overrides 覆盖默认值
 * @returns 租户测试数据
 */
export function createTestTenant(overrides: Partial<TenantTestData> = {}): TenantTestData {
  return {
    tenantId: generateNormalTenantId(),
    companyName: '测试租户',
    status: '0',
    delFlag: '0',
    expireTime: new Date('2099-12-31'),
    accountCount: 100,
    packageId: 1,
    ...overrides,
  };
}

/**
 * 创建测试用户数据 (静态函数)
 *
 * @param tenantId 租户ID
 * @param overrides 覆盖默认值
 * @returns 用户测试数据
 */
export function createTestUser(tenantId: string, overrides: Partial<UserTestData> = {}): UserTestData {
  return {
    userId: Math.floor(Math.random() * 10000) + 1,
    tenantId,
    userName: `testuser_${Date.now()}`,
    status: '0',
    delFlag: '0',
    ...overrides,
  };
}

/**
 * 创建测试配额数据 (静态函数)
 *
 * @param tenantId 租户ID
 * @param overrides 覆盖默认值
 * @returns 配额测试数据
 */
export function createTestQuota(tenantId: string, overrides: Partial<QuotaTestData> = {}): QuotaTestData {
  return {
    tenantId,
    resource: 'users',
    quota: 100,
    currentUsage: 50,
    ...overrides,
  };
}

/**
 * 创建租户测试辅助实例
 *
 * @param platform/config 租户配置
 * @returns TenantTestHelper 实例
 */
export function createTenantTestHelper(mockConfig: Partial<TenantTestConfig> = {}): TenantTestHelper {
  return new TenantTestHelper(mockConfig);
}

// 重新导出 Mock 创建函数
export {
  createTenantMockPrisma,
  createTenantMockRedis,
  createTenantMockConfig,
  createMockAppConfigService,
  generateRandomTenantId,
  generateNormalTenantId,
  generateTenantIdPair,
};

// 重新导出类型
export type { TenantTestConfig, TenantTestData, UserTestData, QuotaTestData };

// 导出常量
export { SUPER_TENANT_ID };
