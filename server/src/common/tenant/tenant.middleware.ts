import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { AppConfigService } from 'src/config/app-config.service';
import { TenantContext } from './tenant.context';

/**
 * 租户中间件 - 从请求中提取租户信息并设置到上下文
 */
@Injectable()
export class TenantMiddleware implements NestMiddleware {
  private readonly logger = new Logger(TenantMiddleware.name);

  constructor(private config: AppConfigService) {}

  use(req: Request, res: Response, next: NextFunction) {
    // 检查是否启用多租户
    const tenantEnabled = this.config.tenant.enabled;

    if (!tenantEnabled) {
      // 未启用多租户时，使用默认租户ID
      TenantContext.run({ tenantId: TenantContext.SUPER_TENANT_ID }, () => {
        next();
      });
      return;
    }

    // 从请求头获取租户ID（Soybean 前端约定的 header 名称）
    const tenantId = this.extractTenantId(req);

    if (!tenantId) {
      // 未提供租户ID时，使用默认租户ID
      TenantContext.run({ tenantId: TenantContext.SUPER_TENANT_ID }, () => {
        next();
      });
      return;
    }

    this.logger.debug(`Request tenant: ${tenantId}`);

    // 设置租户上下文并继续处理请求
    TenantContext.run({ tenantId }, () => {
      next();
    });
  }

  /**
   * 从请求中提取租户ID
   * 支持多种方式：header、query、subdomain
   */
  private extractTenantId(req: Request): string | undefined {
    // 1. 从 header 获取 (优先级最高)
    // Soybean 前端使用 'tenant-id' header
    const headerTenantId = req.headers['tenant-id'] as string;
    if (headerTenantId) {
      return headerTenantId;
    }

    // 2. 从 query 参数获取
    const queryTenantId = req.query['tenantId'] as string;
    if (queryTenantId) {
      return queryTenantId;
    }

    // 3. 从子域名获取 (可选，用于 SaaS 场景)
    // 例如: tenant1.example.com -> tenant1
    const host = req.headers.host;
    if (host) {
      const subdomain = this.extractSubdomain(host);
      if (subdomain && subdomain !== 'www' && subdomain !== 'api') {
        // 需要查询数据库将域名映射为租户ID，这里简化处理
        // 实际项目中可以缓存这个映射关系
        return undefined;
      }
    }

    return undefined;
  }

  /**
   * 从 host 中提取子域名
   */
  private extractSubdomain(host: string): string | undefined {
    const parts = host.split('.');
    if (parts.length >= 3) {
      return parts[0];
    }
    return undefined;
  }
}
