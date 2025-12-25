import { Module } from '@nestjs/common';
import { ClsModule as NestClsModule } from 'nestjs-cls';
import { v4 as uuidv4 } from 'uuid';

@Module({
  imports: [
    NestClsModule.forRoot({
      global: true,
      middleware: {
        mount: true,
        generateId: true,
        idGenerator: (req) => {
          // 生成 UUID 作为 Request ID
          const requestId = uuidv4();
          req['id'] = requestId;
          return requestId;
        },
        setup: (cls, req, res) => {
          // 将 Request ID 添加到响应头
          res.setHeader('X-Request-ID', cls.getId());

          // 存储用户信息到 CLS
          if (req['user']) {
            cls.set('user', req['user']);
          }
        },
      },
    }),
  ],
})
export class ClsModule {}
