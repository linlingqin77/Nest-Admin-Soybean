import { AsyncLocalStorage } from 'async_hooks';
import { randomUUID } from 'crypto';

/**
 * 租户上下文数据
 */
export interface TenantContextData {
  /** 租户ID */
  tenantId: string;
  /** 是否忽略租户过滤 */
  ignoreTenant?: boolean;
  /** 请求ID（用于链路追踪） */
  requestId?: string;
}

/**
 * 租户上下文 - 使用 AsyncLocalStorage 在异步操作中传递租户信息
 *
 * 提供租户隔离的核心上下文管理功能，支持：
 * - 租户ID的设置和获取
 * - 忽略租户过滤的控制
 * - 临时切换租户执行操作
 * - 请求链路追踪
 */
export class TenantContext {
  private static storage = new AsyncLocalStorage<TenantContextData>();

  /**
   * 超级管理员租户ID
   */
  static readonly SUPER_TENANT_ID = '000000';

  /**
   * 设置当前租户上下文并执行回调
   *
   * @param data 租户上下文数据
   * @param fn 要执行的回调函数
   * @returns 回调函数的返回值
   */
  static run<T>(data: TenantContextData, fn: () => T): T {
    // 如果没有提供 requestId，自动生成一个
    const contextData: TenantContextData = {
      ...data,
      requestId: data.requestId || randomUUID(),
    };
    return this.storage.run(contextData, fn);
  }

  /**
   * 临时切换到指定租户执行操作
   *
   * 用于需要临时以其他租户身份执行操作的场景，
   * 执行完成后自动恢复原租户上下文
   *
   * @param tenantId 目标租户ID
   * @param fn 要执行的回调函数
   * @param options 可选配置
   * @returns 回调函数的返回值
   */
  static runWithTenant<T>(tenantId: string, fn: () => T, options?: { ignoreTenant?: boolean }): T {
    const currentStore = this.storage.getStore();
    const newContext: TenantContextData = {
      tenantId,
      ignoreTenant: options?.ignoreTenant ?? false,
      requestId: currentStore?.requestId || randomUUID(),
    };
    return this.storage.run(newContext, fn);
  }

  /**
   * 临时忽略租户过滤执行操作
   *
   * 用于需要跨租户查询的场景，如管理员操作
   *
   * @param fn 要执行的回调函数
   * @returns 回调函数的返回值
   */
  static runIgnoringTenant<T>(fn: () => T): T {
    const currentStore = this.storage.getStore();
    const newContext: TenantContextData = {
      tenantId: currentStore?.tenantId || this.SUPER_TENANT_ID,
      ignoreTenant: true,
      requestId: currentStore?.requestId || randomUUID(),
    };
    return this.storage.run(newContext, fn);
  }

  /**
   * 获取当前租户ID
   */
  static getTenantId(): string | undefined {
    return this.storage.getStore()?.tenantId;
  }

  /**
   * 设置租户ID (在已存在的上下文中更新)
   */
  static setTenantId(tenantId: string): void {
    const store = this.storage.getStore();
    if (store) {
      store.tenantId = tenantId;
    }
  }

  /**
   * 获取当前请求ID
   */
  static getRequestId(): string | undefined {
    return this.storage.getStore()?.requestId;
  }

  /**
   * 检查是否忽略租户过滤
   */
  static isIgnoreTenant(): boolean {
    return this.storage.getStore()?.ignoreTenant ?? false;
  }

  /**
   * 设置忽略租户过滤
   */
  static setIgnoreTenant(ignore: boolean): void {
    const store = this.storage.getStore();
    if (store) {
      store.ignoreTenant = ignore;
    }
  }

  /**
   * 获取当前上下文数据
   */
  static getStore(): TenantContextData | undefined {
    return this.storage.getStore();
  }

  /**
   * 判断是否为超级管理员租户
   */
  static isSuperTenant(): boolean {
    return this.getTenantId() === this.SUPER_TENANT_ID;
  }

  /**
   * 判断当前是否在租户上下文中
   */
  static hasContext(): boolean {
    return this.storage.getStore() !== undefined;
  }

  /**
   * 判断是否应该应用租户过滤
   *
   * 以下情况不应用租户过滤：
   * - 没有租户上下文
   * - 设置了忽略租户
   * - 是超级租户
   */
  static shouldApplyTenantFilter(): boolean {
    if (!this.hasContext()) {
      return false;
    }
    if (this.isIgnoreTenant()) {
      return false;
    }
    if (this.isSuperTenant()) {
      return false;
    }
    return true;
  }
}
