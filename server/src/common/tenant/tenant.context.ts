import { AsyncLocalStorage } from 'async_hooks';
import type { TenantContext as TenantContextData } from '../types/tenant';

// Re-export for backward compatibility
export type { TenantContext as TenantContextData } from '../types/tenant';

/**
 * 租户上下文 - 使用 AsyncLocalStorage 在异步操作中传递租户信息
 */
export class TenantContext {
  private static storage = new AsyncLocalStorage<TenantContextData>();

  /**
   * 设置当前租户上下文并执行回调
   */
  static run<T>(data: TenantContextData, fn: () => T): T {
    return this.storage.run(data, fn);
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
   * 超级管理员租户ID
   */
  static readonly SUPER_TENANT_ID = '000000';

  /**
   * 判断是否为超级管理员租户
   */
  static isSuperTenant(): boolean {
    return this.getTenantId() === this.SUPER_TENANT_ID;
  }
}
