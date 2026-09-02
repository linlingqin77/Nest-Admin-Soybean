import { Body, Controller, Get, Logger, MessageEvent, Post, Query, Req, SetMetadata, Sse } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Observable } from 'rxjs';
import { Request } from 'express';
import { JwtService } from '@nestjs/jwt';
import { SseService } from './sse.service';
import { Result } from 'src/shared/response';
import { RedisService } from 'src/platform/redis/redis.service';
import { CacheEnum } from 'src/shared/enums/index';
import { METADATA_KEYS } from 'src/shared/constants/metadata.constants';
import { v4 as uuidv4 } from 'uuid';

// 跳过认证的装饰器（SSE 通过 Query 参数传递 token）
const NotRequireAuth = () => SetMetadata(METADATA_KEYS.NOT_REQUIRE_AUTH, true);

@ApiTags('SSE消息推送')
@Controller('resource')
@ApiBearerAuth('Authorization')
export class SseController {
  private readonly logger = new Logger(SseController.name);

  constructor(
    private readonly sseService: SseService,
    private readonly jwtService: JwtService,
    private readonly redisService: RedisService,
  ) {}

  @ApiOperation({ summary: 'SSE连接' })
  @NotRequireAuth()
  @Sse('sse')
  sse(
    @Query('Authorization') authorization: string,
    @Query('clientid') clientid: string,
    @Req() req: Request,
  ): Observable<MessageEvent> {
    // 从 Authorization 参数中提取 token
    const token = authorization?.replace('Bearer ', '');

    if (!token) {
      return new Observable<MessageEvent>((subscriber) => {
        subscriber.next({
          data: JSON.stringify({ type: 'error', message: 'Unauthorized: No token provided' }),
        } as MessageEvent);
        subscriber.complete();
      });
    }

    // 解析 JWT 获取用户信息
    let userId: number;
    try {
      const payload = this.jwtService.verify(token);
      if (!payload?.uuid || !payload?.userId) {
        return new Observable<MessageEvent>((subscriber) => {
          subscriber.next({
            data: JSON.stringify({ type: 'error', message: 'Unauthorized: Invalid token payload' }),
          } as MessageEvent);
          subscriber.complete();
        });
      }
      userId = payload.userId;

      // 验证 Redis 中 token 是否有效（与 AuthStrategy 逻辑一致）
      this.redisService.get(`${CacheEnum.LOGIN_TOKEN_KEY}${payload.uuid}`).then((user) => {
        if (!user) {
          this.logger.warn(`SSE connection rejected: token expired for userId=${userId}`);
          this.sseService.removeClient(uniqueClientId);
        }
      });
    } catch (error) {
      this.logger.warn(
        `SSE connection rejected: JWT verification failed - ${error instanceof Error ? error.message : String(error)}`,
      );
      return new Observable<MessageEvent>((subscriber) => {
        subscriber.next({
          data: JSON.stringify({ type: 'error', message: 'Unauthorized: Token expired or invalid' }),
        } as MessageEvent);
        subscriber.complete();
      });
    }

    // 生成唯一的客户端ID
    const uniqueClientId = `${clientid || 'unknown'}_${uuidv4()}`;

    // 添加客户端连接
    const observable = this.sseService.addClient(uniqueClientId, userId);

    // 发送连接成功消息
    const timeoutId = setTimeout(() => {
      this.sseService.sendToUser(userId, JSON.stringify({ type: 'connected', message: 'SSE连接成功' }));
    }, 100);

    // 当连接关闭时，清理定时器并移除客户端
    req.on('close', () => {
      clearTimeout(timeoutId);
      this.sseService.removeClient(uniqueClientId);
    });

    return observable;
  }

  @ApiOperation({ summary: '关闭SSE连接' })
  @Get('sse/close')
  closeSse(): Result {
    // 这个接口主要是前端调用,用于优雅地通知后端关闭连接
    // 实际的连接关闭是在客户端断开时自动处理的
    return Result.ok(null, 'SSE连接已关闭');
  }

  @ApiOperation({ summary: '发送消息给指定用户' })
  @Post('sse/send')
  sendMessage(@Body('userId') userId: number, @Body('message') message: string): Result {
    this.sseService.sendToUser(userId, message);
    return Result.ok(null, '消息发送成功');
  }

  @ApiOperation({ summary: '广播消息给所有用户' })
  @Post('sse/broadcast')
  broadcast(@Body('message') message: string): Result {
    this.sseService.broadcast(message);
    return Result.ok(null, '广播成功');
  }

  @ApiOperation({ summary: '获取在线连接数' })
  @Post('sse/count')
  getCount(): Result {
    const count = this.sseService.getClientCount();
    return Result.ok({ count });
  }
}
