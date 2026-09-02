import { Injectable } from '@nestjs/common';
import { AppConfigService } from 'src/platform/config/app-config.service';
import { TenantContext } from '../context/tenant.context';
import { hasTenantField, SUPER_TENANT_ID } from '../constants/tenant-models';

// 重新导出常量，保持向后兼容
export { SUPER_TENANT_ID, hasTenantField };

/**
 * 租户帮助类 - 提供租户相关的辅助方法
 *
 * 注意：租户过滤逻辑已迁移到 Prisma 中间件自动处理
 * 此类仅保留必要的辅助方法
 *
 * @see ../middleware/tenant.middleware.ts
 */
@Injectable()
export class TenantHelper {
  private readonly enabled: boolean;

  constructor(private readonly config: AppConfigService) {
    this.enabled = this.config.tenant.enabled;
  }

  /**
   * 检查租户功能是否启用
   */
  isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * 检查是否应该添加租户过滤
   */
  shouldFilter(): boolean {
    if (!this.enabled) return false;
    if (TenantContext.isIgnoreTenant()) return false;
    if (TenantContext.isSuperTenant()) return false;
    return !!TenantContext.getTenantId();
  }

  /**
   * 获取当前租户ID
   */
  getTenantId(): string {
    return TenantContext.getTenantId() || SUPER_TENANT_ID;
  }

  /**
   * 检查是否为超级租户
   */
  isSuperTenant(): boolean {
    return TenantContext.isSuperTenant();
  }

  /**
   * 超级管理员租户ID
   * @deprecated 请使用 SUPER_TENANT_ID 常量
   */
  static get SUPER_TENANT_ID(): string {
    return SUPER_TENANT_ID;
  }

  /**
   * 检查模型是否需要租户过滤
   * @deprecated 请使用 hasTenantField 函数
   */
  static hasTenantField(model: string): boolean {
    return hasTenantField(model);
  }
}
