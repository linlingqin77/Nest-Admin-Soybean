import { Injectable, CanActivate, ExecutionContext, ForbiddenException, Logger, SetMetadata } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { TenantQuotaService, QuotaResource } from '../services/quota.service';
import { TenantContext } from '../context/tenant.context';

/**
 * RequireQuota 装饰器元数据键
 */
export const REQUIRE_QUOTA_KEY = 'require_quota';

/**
 * RequireQuota 装饰器选项
 */
export interface RequireQuotaOptions {
  /** 资源类型 */
  resource: QuotaResource;
  /** 自定义错误消息 */
  message?: string;
}

/**
 * RequireQuota 装饰器
 *
 * 用于标记需要配额检查的接口
 *
 * @example
 * ```typescript
 * @RequireQuota({ resource: QuotaResource.USERS })
 * @Post()
 * async createUser() { ... }
 * ```
 */
export const RequireQuota = (options: RequireQuotaOptions) => SetMetadata(REQUIRE_QUOTA_KEY, options);

/**
 * 配额检查守卫
 *
 * 检查当前租户是否有足够的配额执行操作
 * 与 @RequireQuota 装饰器配合使用
 */
@Injectable()
export class RequireQuotaGuard implements CanActivate {
  private readonly logger = new Logger(RequireQuotaGuard.name);

  constructor(
    private readonly reflector: Reflector,
    private readonly quotaService: TenantQuotaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // 获取装饰器配置
    const options = this.reflector.getAllAndOverride<RequireQuotaOptions>(REQUIRE_QUOTA_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // 如果没有配置，允许访问
    if (!options) {
      return true;
    }

    // 获取当前租户ID
    const tenantId = TenantContext.getTenantId();

    // 如果没有租户ID，拒绝访问
    if (!tenantId) {
      this.logger.warn(`Quota check failed: no tenant context for resource ${options.resource}`);
      throw new ForbiddenException(options.message || `配额检查需要租户上下文`);
    }

    // 超级租户不受配额限制
    if (TenantContext.isSuperTenant()) {
      return true;
    }

    // 检查配额
    const result = await this.quotaService.checkQuota(tenantId, options.resource);

    if (!result.allowed) {
      const resourceName = this.getResourceDisplayName(options.resource);
      this.logger.warn(
        `Quota exceeded for tenant ${tenantId}: ${options.resource} ` +
          `(current: ${result.currentUsage}, limit: ${result.quota})`,
      );
      throw new ForbiddenException(
        options.message || `${resourceName}配额已用尽，当前使用: ${result.currentUsage}，配额上限: ${result.quota}`,
      );
    }

    this.logger.debug(
      `Quota check passed for tenant ${tenantId}: ${options.resource} ` +
        `(current: ${result.currentUsage}, limit: ${result.quota}, remaining: ${result.remaining})`,
    );
    return true;
  }

  /**
   * 获取资源显示名称
   */
  private getResourceDisplayName(resource: QuotaResource): string {
    switch (resource) {
      case QuotaResource.USERS:
        return '用户数';
      case QuotaResource.STORAGE:
        return '存储空间';
      case QuotaResource.API_CALLS:
        return 'API调用量';
      default:
        return '资源';
    }
  }
}
