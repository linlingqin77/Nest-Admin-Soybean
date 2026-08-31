import { Injectable, ExecutionContext } from '@nestjs/common';
import { ThrottlerGuard, ThrottlerException, ThrottlerLimitDetail } from '@nestjs/throttler';

/**
 * 自定义限流守卫
 *
 * @description
 * 继承自 @nestjs/throttler 的 ThrottlerGuard，提供以下增强功能：
 * 1. 支持基于用户 ID 的限流追踪（已登录用户）
 * 2. 支持基于 IP 的限流追踪（未登录用户）
 * 3. 自定义中文错误消息
 * 4. 支持方法级别的 @ApiThrottle 装饰器配置
 *
 * @example
 * ```typescript
 * // 全局配置（在 app.modules.ts 中）
 * ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }])
 *
 * // 方法级别覆盖（在 Controller 中）
 * @ApiThrottle({ ttl: 60000, limit: 10 })
 * async login() {}
 *
 * // 跳过限流
 * @ApiSkipThrottle()
 * async healthCheck() {}
 * ```
 */
@Injectable()
export class CustomThrottlerGuard extends ThrottlerGuard {
  /**
   * 获取请求追踪标识
   *
   * @description
   * 优先使用用户 ID 作为追踪标识，这样可以实现：
   * - 已登录用户：基于用户 ID 限流，同一用户在不同设备上共享限流配额
   * - 未登录用户：基于 IP 限流
   *
   * @param req 请求对象
   * @returns 追踪标识字符串
   */
  protected async getTracker(req: Record<string, unknown>): Promise<string> {
    // 优先使用用户 ID 作为追踪标识
    const user = req.user as { userId?: number; tenantId?: string } | undefined;
    if (user && user.userId) {
      // 包含租户 ID 以实现租户级别的隔离
      const tenantId = user.tenantId || 'default';
      return `user-${tenantId}-${user.userId}`;
    }

    // 未登录用户使用 IP 作为追踪标识
    const ip = this.getClientIp(req);
    return `ip-${ip}`;
  }

  /**
   * 获取客户端 IP 地址
   *
   * @param req 请求对象
   * @returns IP 地址字符串
   */
  private getClientIp(req: Record<string, unknown>): string {
    // 优先从 X-Forwarded-For 头获取（反向代理场景）
    const headers = req.headers as Record<string, string | string[]> | undefined;
    if (headers) {
      const forwarded = headers['x-forwarded-for'];
      if (forwarded) {
        const ips = (Array.isArray(forwarded) ? forwarded[0] : forwarded).split(',');
        return ips[0].trim();
      }
      // 也检查 X-Real-IP 头（Nginx 常用）
      const realIp = headers['x-real-ip'];
      if (realIp) {
        return Array.isArray(realIp) ? realIp[0] : realIp;
      }
    }

    // 从请求对象获取 IP
    const ip = req.ip as string | undefined;
    if (ip) return ip;

    // 从 socket 获取 IP
    const socket = req.socket as { remoteAddress?: string } | undefined;
    if (socket?.remoteAddress) return socket.remoteAddress;

    return 'unknown';
  }

  /**
   * 抛出限流异常
   *
   * @description
   * 自定义限流异常消息，提供更友好的中文提示
   *
   * @param context 执行上下文
   * @param throttlerLimitDetail 限流详情
   */
  protected async throwThrottlingException(
    context: ExecutionContext,
    throttlerLimitDetail?: ThrottlerLimitDetail,
  ): Promise<void> {
    const retryAfter = throttlerLimitDetail?.timeToBlockExpire || throttlerLimitDetail?.timeToExpire;
    const retryAfterSeconds = retryAfter ? Math.ceil(retryAfter / 1000) : undefined;

    let message = '请求过于频繁，请稍后再试';
    if (retryAfterSeconds && retryAfterSeconds > 0) {
      message = `请求过于频繁，请 ${retryAfterSeconds} 秒后再试`;
    }

    throw new ThrottlerException(message);
  }
}
