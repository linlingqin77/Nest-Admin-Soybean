import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { ClsService } from 'nestjs-cls';

/**
 * Request ID 中间件
 * 为每个请求生成或提取唯一的 Request ID，用于请求追踪
 *
 * 功能：
 * 1. 从请求头 X-Request-Id 提取已有的 Request ID
 * 2. 如果没有则生成新的 UUID v4
 * 3. 将 Request ID 设置到响应头 X-Request-Id
 * 4. 将 Request ID 存储到 CLS 上下文中供日志使用
 */
@Injectable()
export class RequestIdMiddleware implements NestMiddleware {
  constructor(private readonly cls: ClsService) {}

  use(req: Request, res: Response, next: NextFunction): void {
    // 从请求头提取 Request ID，如果没有则生成新的
    const requestId = (req.headers['x-request-id'] as string) || uuidv4();

    // 将 Request ID 存储到请求对象
    req['requestId'] = requestId;
    req['id'] = requestId;

    // 设置响应头
    res.setHeader('X-Request-Id', requestId);

    // 存储到 CLS 上下文
    if (this.cls) {
      this.cls.set('requestId', requestId);
    }

    next();
  }
}
