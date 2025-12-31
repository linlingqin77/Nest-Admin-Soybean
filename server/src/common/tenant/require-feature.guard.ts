import { Injectable, CanActivate, ExecutionContext, ForbiddenException, Logger } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { REQUIRE_FEATURE_KEY, RequireFeatureOptions } from './require-feature.decorator';
import { FeatureToggleService } from './feature-toggle.service';
import { TenantContext } from './tenant.context';

/**
 * 功能开关守卫 (需求 5.1)
 *
 * 检查当前租户是否启用了指定功能
 * 与 @RequireFeature 装饰器配合使用
 */
@Injectable()
export class RequireFeatureGuard implements CanActivate {
  private readonly logger = new Logger(RequireFeatureGuard.name);

  constructor(
    private readonly reflector: Reflector,
    private readonly featureToggleService: FeatureToggleService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // 获取装饰器配置
    const options = this.reflector.getAllAndOverride<RequireFeatureOptions>(REQUIRE_FEATURE_KEY, [
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
      this.logger.warn(`Feature check failed: no tenant context for feature ${options.feature}`);
      throw new ForbiddenException(options.message || `功能 ${options.feature} 需要租户上下文`);
    }

    // 检查功能是否启用
    const isEnabled = await this.featureToggleService.isEnabled(tenantId, options.feature);

    if (!isEnabled) {
      this.logger.warn(`Feature ${options.feature} is not enabled for tenant ${tenantId}`);
      throw new ForbiddenException(
        options.message || `功能 ${options.feature} 未启用，请联系管理员`,
      );
    }

    this.logger.debug(`Feature ${options.feature} is enabled for tenant ${tenantId}`);
    return true;
  }
}
