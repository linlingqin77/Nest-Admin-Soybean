import { Controller, Sse, Query, Req, Get, Post, Body, MessageEvent, SetMetadata } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { Observable } from 'rxjs';
import { Request } from 'express';
import { SseService } from './sse.service';
import { Result } from 'src/common/response';
import { v4 as uuidv4 } from 'uuid';

// 跳过认证的装饰器
const NotRequireAuth = () => SetMetadata('notRequireAuth', true);

@ApiTags('SSE消息推送')
@Controller('resource')
@ApiBearerAuth('Authorization')
export class SseController {
  constructor(private readonly sseService: SseService) {}

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
      // 如果没有token，返回一个空的Observable
      return new Observable<MessageEvent>((subscriber) => {
        subscriber.next({ data: 'Unauthorized' } as MessageEvent);
        subscriber.complete();
      });
    }

    // 生成唯一的客户端ID
    const uniqueClientId = `${clientid || 'unknown'}_${uuidv4()}`;

    // 这里简化处理，实际应该解析JWT获取userId
    // 暂时使用默认值1，你可以根据需要完善JWT解析逻辑
    const userId = 1;

    // 添加客户端连接
    const observable = this.sseService.addClient(uniqueClientId, userId);

    // 当连接关闭时，移除客户端
    req.on('close', () => {
      this.sseService.removeClient(uniqueClientId);
    });

    // 发送连接成功消息
    setTimeout(() => {
      this.sseService.sendToUser(userId, 'SSE连接成功');
    }, 100);

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
