import { Injectable, ExecutionContext } from '@nestjs/common';
import { ThrottlerGuard, ThrottlerException, ThrottlerLimitDetail } from '@nestjs/throttler';

@Injectable()
export class CustomThrottlerGuard extends ThrottlerGuard {
  protected async getTracker(req: Record<string, unknown>): Promise<string> {
    // In newer versions, req is already the request object, not ExecutionContext
    const user = req.user as { userId?: number } | undefined;
    if (user && user.userId) return `user-${user.userId}`;

    const ip = req.ip || (req.headers as Record<string, string>)?.['x-forwarded-for'] || (req.socket as { remoteAddress?: string })?.remoteAddress || 'unknown';
    return `ip-${ip}`;
  }

  // ThrottlerGuard in newer versions expects an async method with this signature
  protected async throwThrottlingException(context: ExecutionContext, _throttlerLimitDetail?: ThrottlerLimitDetail): Promise<void> {
    throw new ThrottlerException('请求过于频繁，请稍后再试');
  }
}
