import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { mw as requestIpMw } from 'request-ip';
import { NestFactory } from '@nestjs/core';
import { AppModule } from 'src/app.module';
import { HttpExceptionsFilter } from 'src/common/filters/http-exceptions-filter';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Logger as PinoLogger } from 'nestjs-pino';
import path from 'path';
import { writeFileSync } from 'fs';

// API 版本信息
const API_INFO = {
  title: 'Nest-Admin',
  description: `
## Nest-Admin 后台管理系统 API 文档

### 接口说明
- 所有接口返回统一格式: \`{ code: number, msg: string, data: any }\`
- code=200 表示成功，其他表示失败
- 需要认证的接口请在请求头携带 \`Authorization: Bearer <token>\`

### 版本历史
- v2.0.0 (2024-01) - 重构优化，Enum 统一管理，DTO/VO 文件拆分
- v1.0.0 (2023-01) - 初始版本
  `,
  version: '2.0.0',
  contact: {
    name: 'Nest-Admin',
    url: 'https://github.com/linlingqin77/Nest-Admin',
  },
  license: {
    name: 'MIT',
    url: 'https://opensource.org/licenses/MIT',
  },
};

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    cors: true, // 开启跨域访问
    bufferLogs: true, // 缓冲日志
  });
  const config = app.get(ConfigService);

  // 使用 Pino Logger
  app.useLogger(app.get(PinoLogger));
  app.flushLogs(); // 刷新缓冲的日志

  // 信任代理（nginx 反向代理时需要，否则 express-rate-limit 会报错）
  app.set('trust proxy', 1);

  // 设置访问频率
  app.use(
    rateLimit({
      windowMs: 15 * 60 * 1000, // 15分钟
      max: 1000, // 限制15分钟内最多只能访问1000次
    }),
  );
  // 设置 api 访问前缀
  const prefix = config.get<string>('app.prefix');

  const rootPath = process.cwd();
  const baseDirPath = path.posix.join(rootPath, config.get('app.file.location'));
  app.useStaticAssets(baseDirPath, {
    prefix: '/profile/',
    maxAge: 86400000 * 365,
  });

  app.useStaticAssets('public', {
    prefix: '/public/',
    maxAge: 0,
  });

  app.setGlobalPrefix(prefix);
  // 全局验证
  app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));
  app.useGlobalFilters(new HttpExceptionsFilter());

  // web 安全，防常见漏洞
  // 注意： 开发环境如果开启 nest static module 需要将 crossOriginResourcePolicy 设置为 false 否则 静态资源 跨域不可访问
  app.use(
    helmet({
      crossOriginOpenerPolicy: { policy: 'same-origin-allow-popups' },
      crossOriginResourcePolicy: false,
      contentSecurityPolicy: false, // 放开 CSP 限制
    }),
  );
  const swaggerOptions = new DocumentBuilder()
    .setTitle(API_INFO.title)
    .setDescription(API_INFO.description)
    .setVersion(API_INFO.version)
    .setContact(API_INFO.contact.name, API_INFO.contact.url, '')
    .setLicense(API_INFO.license.name, API_INFO.license.url)
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        in: 'header', // 认证信息放置的位置
        name: 'Authorization', // 显式指定请求头名称
        description: '请在请求头中携带 JWT 令牌，格式：Bearer <token>',
      },
      'Authorization',
    )
    .addServer(config.get<string>('app.file.domain'))
    .build();

  const document = SwaggerModule.createDocument(app, swaggerOptions);

  // 保存OpenAPI规范文件
  writeFileSync(path.posix.join(process.cwd(), 'public', 'openApi.json'), JSON.stringify(document, null, 2));

  // 项目依赖当前文档功能，最好不要改变当前地址
  // 生产环境使用 nginx 可以将当前文档地址 屏蔽外部访问
  SwaggerModule.setup(`${prefix}/swagger-ui`, app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
    customSiteTitle: 'Nest-Admin API Docs',
  });

  // 获取真实 ip
  app.use(requestIpMw({ attributeName: 'ip' }));
  //服务端口
  const port = config.get<number>('app.port') || 8080;
  await app.listen(port);

  // 使用 Logger 而不是 console.log
  const logger = new Logger('Bootstrap');
  logger.log(`Nest-Admin 服务启动成功`);
  logger.log(`服务地址: http://localhost:${port}${prefix}/`);
  logger.log(`Swagger 文档: http://localhost:${port}${prefix}/swagger-ui/`);
  logger.log(`健康检查: http://localhost:${port}${prefix}/health`);
  logger.log(`Prometheus 指标: http://localhost:${port}${prefix}/metrics`);
}
bootstrap();
