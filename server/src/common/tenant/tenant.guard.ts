import { Injectable, CanActivate, ExecutionContext, Logger } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AppConfigService } from 'src/config/app-config.service';
import { IGNORE_TENANT_KEY } from './tenant.decorator';
import { TenantContext } from './tenant.context';

/**
 * 租户守卫 - 处理 @IgnoreTenant 装饰器
 */
@Injectable()
export class TenantGuard implements CanActivate {
  private readonly logger = new Logger(TenantGuard.name);

  constructor(
    private reflector: Reflector,
    private config: AppConfigService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    // 检查是否启用多租户
    const tenantEnabled = this.config.tenant.enabled;
    if (!tenantEnabled) {
      return true;
    }

    // 检查是否标记为忽略租户
    const ignoreTenant = this.reflector.getAllAndOverride<boolean>(IGNORE_TENANT_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (ignoreTenant) {
      // 设置忽略租户过滤标志
      TenantContext.setIgnoreTenant(true);
      this.logger.debug('Tenant filtering ignored for this request');
    }

    return true;
  }
}
