import { Injectable, Logger, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { randomUUID } from 'node:crypto';
import { TenantContext } from '../context/tenant.context';

/**
 * HTTP 请求租户中间件
 *
 * 从 HTTP 请求中提取租户信息并初始化租户上下文
 *
 * 重要（C1 安全修复）：只从 JWT Token 解析出的 req.user.tenantId 提取租户 ID，
 * 严禁信任请求头 X-Tenant-Id 或查询参数 tenantId —— 否则任意已认证用户
 * 都能通过传入 ?tenantId=other_tenant 触发跨租户 IDOR。
 */
@Injectable()
export class TenantHttpMiddleware implements NestMiddleware {
  private readonly logger = new Logger(TenantHttpMiddleware.name);

  /**
   * 仅用于日志记录的 header 名（不再参与租户识别）
   */
  private static readonly TENANT_HEADER = 'x-tenant-id';

  /**
   * 仅用于日志记录的 query 名（不再参与租户识别）
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
      // 没有租户ID时，使用超级租户上下文（ignoreTenant=true 表示跳过 tenant 过滤）
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
   * 安全：只从 JWT 解析出的 req.user.tenantId 取值。
   * 请求头和查询参数都可能被前端或攻击者任意注入，信任它们就会造成跨租户越权。
   */
  private extractTenantId(req: Request): string | undefined {
    const user = (req as Request & { user?: { tenantId?: string } }).user;
    if (user?.tenantId) {
      return user.tenantId;
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
    return randomUUID();
  }
}
