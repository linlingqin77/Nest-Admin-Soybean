import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { TenantContext } from '../context/tenant.context';

/**
 * HTTP 请求租户中间件
 *
 * 从 HTTP 请求中提取租户信息并初始化租户上下文
 * 支持从以下来源获取租户ID：
 * 1. JWT Token 中的 tenantId 字段
 * 2. 请求头 X-Tenant-Id
 * 3. 查询参数 tenantId
 */
@Injectable()
export class TenantHttpMiddleware implements NestMiddleware {
  private readonly logger = new Logger(TenantHttpMiddleware.name);

  /**
   * 请求头名称
   */
  private static readonly TENANT_HEADER = 'x-tenant-id';

  /**
   * 查询参数名称
   */
  private static readonly TENANT_QUERY_PARAM = 'tenantId';

  use(req: Request, res: Response, next: NextFunction): void {
    const tenantId = this.extractTenantId(req);
    const requestId = this.extractRequestId(req);

    if (tenantId) {
      TenantContext.run(
        {
          tenantId,
          ignoreTenant: false,
          requestId,
        },
        () => {
          next();
        },
      );
    } else {
      // 没有租户ID时，使用超级租户上下文
      TenantContext.run(
        {
          tenantId: TenantContext.SUPER_TENANT_ID,
          ignoreTenant: true,
          requestId,
        },
        () => {
          next();
        },
      );
    }
  }

  /**
   * 从请求中提取租户ID
   *
   * 优先级：JWT > Header > Query
   */
  private extractTenantId(req: Request): string | undefined {
    // 1. 从 JWT Token 中获取（如果已解析）
    const user = (req as Request & { user?: { tenantId?: string } }).user;
    if (user?.tenantId) {
      return user.tenantId;
    }

    // 2. 从请求头获取
    const headerTenantId = req.headers[TenantHttpMiddleware.TENANT_HEADER] as string;
    if (headerTenantId) {
      return headerTenantId;
    }

    // 3. 从查询参数获取
    const queryTenantId = req.query[TenantHttpMiddleware.TENANT_QUERY_PARAM] as string;
    if (queryTenantId) {
      return queryTenantId;
    }

    return undefined;
  }

  /**
   * 从请求中提取或生成请求ID
   */
  private extractRequestId(req: Request): string {
    const requestIdHeader = req.headers['x-request-id'] as string;
    if (requestIdHeader) {
      return requestIdHeader;
    }

    // 生成新的请求ID
    return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
  }
}
