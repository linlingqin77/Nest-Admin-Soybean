import { Module } from '@nestjs/common';
import { ClsModule as NestClsModule, ClsService } from 'nestjs-cls';
import { v4 as uuidv4 } from 'uuid';

/**
 * CLS (Continuation-Local Storage) 模块
 * 提供请求级别的上下文存储，用于：
 * 1. Request ID 追踪 - 每个请求都有唯一标识
 * 2. 用户信息传递 - 在请求生命周期内共享用户信息
 * 3. 租户上下文 - 多租户数据隔离
 */
@Module({
  imports: [
    NestClsModule.forRoot({
      global: true,
      middleware: {
        mount: true,
        generateId: true,
        idGenerator: (req) => {
          // 优先使用请求头中的 Request ID，否则生成新的 UUID
          const requestId = (req.headers['x-request-id'] as string) || uuidv4();
          req['id'] = requestId;
          req['requestId'] = requestId;
          return requestId;
        },
        setup: (cls, req, res) => {
          // 将 Request ID 添加到响应头
          const requestId = cls.getId();
          res.setHeader('X-Request-Id', requestId);

          // 存储 Request ID 到 CLS 上下文
          cls.set('requestId', requestId);

          // 存储用户信息到 CLS
          if (req['user']) {
            cls.set('user', req['user']);
          }
        },
      },
    }),
  ],
  exports: [NestClsModule],
})
export class ClsModule {}

// 导出 ClsService 以便其他模块使用
export { ClsService };
