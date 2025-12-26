import { Injectable, Logger } from '@nestjs/common';
import { AppConfigService } from 'src/config/app-config.service';
import { Prisma } from '@prisma/client';
import { TenantContext } from './tenant.context';

/**
 * 租户帮助类 - 提供租户相关的查询帮助方法
 *
 * 用法示例:
 * ```typescript
 * const users = await this.prisma.sysUser.findMany({
 *   where: this.tenantHelper.addTenantFilter({ name: 'test' }),
 * });
 * ```
 */
@Injectable()
export class TenantHelper {
  private readonly logger = new Logger(TenantHelper.name);
  private readonly enabled: boolean;

  // 需要租户隔离的模型列表
  private static readonly TENANT_MODELS = new Set([
    'sysConfig',
    'sysDept',
    'sysDictData',
    'sysDictType',
    'sysJob',
    'sysLogininfor',
    'sysMenu',
    'sysNotice',
    'sysOperLog',
    'sysPost',
    'sysRole',
    'sysUpload',
    'sysUser',
  ]);

  constructor(private config: AppConfigService) {
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
    return TenantContext.getTenantId() || TenantContext.SUPER_TENANT_ID;
  }

  /**
   * 添加租户过滤条件到 where 子句
   *
   * @example
   * ```typescript
   * // 简单查询
   * const users = await this.prisma.sysUser.findMany({
   *   where: this.tenantHelper.addTenantFilter({ status: Status.NORMAL }),
   * });
   *
   * // 复杂查询
   * const where = { OR: [{ name: 'a' }, { name: 'b' }] };
   * const users = await this.prisma.sysUser.findMany({
   *   where: this.tenantHelper.addTenantFilter(where),
   * });
   * ```
   */
  addTenantFilter<T extends object>(where?: T): T & { tenantId?: string } {
    if (!this.shouldFilter()) {
      return where || ({} as T & { tenantId?: string });
    }

    const tenantId = this.getTenantId();
    const result = { ...(where || {}), tenantId } as T & { tenantId: string };

    return result;
  }

  /**
   * 添加租户ID到创建数据
   *
   * @example
   * ```typescript
   * const user = await this.prisma.sysUser.create({
   *   data: this.tenantHelper.setTenantId({ userName: 'test', ... }),
   * });
   * ```
   */
  setTenantId<T extends object>(data: T): T & { tenantId: string } {
    const tenantId = this.getTenantId();
    return { ...data, tenantId } as T & { tenantId: string };
  }

  /**
   * 批量设置租户ID
   */
  setTenantIdForMany<T extends object>(dataList: T[]): (T & { tenantId: string })[] {
    const tenantId = this.getTenantId();
    return dataList.map((data) => ({ ...data, tenantId }));
  }

  /**
   * 检查模型是否需要租户过滤
   */
  static hasTenantField(model: string): boolean {
    return TenantHelper.TENANT_MODELS.has(model.toLowerCase()) || TenantHelper.TENANT_MODELS.has(model);
  }

  /**
   * 超级管理员租户ID
   */
  static get SUPER_TENANT_ID(): string {
    return TenantContext.SUPER_TENANT_ID;
  }
}
