import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
// import csurf from 'csurf';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { mw as requestIpMw } from 'request-ip';
import { NestFactory } from '@nestjs/core';
import { AppModule } from 'src/app.module';
import { GlobalExceptionFilter } from 'src/common/filters/global-exception.filter';
import { ValidationPipe, Logger } from '@nestjs/common';
import { AppConfigService } from 'src/config/app-config.service';
import { Logger as PinoLogger } from 'nestjs-pino';
import path from 'path';
import { writeFileSync } from 'fs';

// API 版本信息
const API_INFO = {
  title: 'Nest-Admin-Soybean',
  description: `
## Nest-Admin-Soybean 后台管理系统 API 文档

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
    name: 'Nest-Admin-Soybean',
    url: 'https://github.com/linlingqin77/Nest-Admin-Soybean',
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
  const config = app.get(AppConfigService);

  // 使用 Pino Logger
  app.useLogger(app.get(PinoLogger));
  app.flushLogs(); // 刷新缓冲的日志

  // 信任代理（nginx 反向代理时需要，否则 express-rate-limit 会报错）
  app.set('trust proxy', 1);

  // 设置全局限流（保留作为后备）
  app.use(
    rateLimit({
      windowMs: 15 * 60 * 1000, // 15分钟
      max: 1000, // 限制15分钟内最多只能访问1000次
      message: '请求过于频繁,请稍后再试',
      standardHeaders: true, // 返回限流信息在 `RateLimit-*` 头中
      legacyHeaders: false, // 禁用 `X-RateLimit-*` 头
    }),
  );

  // CSRF 保护 (如需启用,取消注释)
  // const csrf = require('csurf');
  // app.use(csrf({
  //   cookie: {
  //     httpOnly: true,
  //     sameSite: 'strict',
  //     secure: process.env.NODE_ENV === 'production'
  //   }
  // }));
  // 设置 api 访问前缀
  const prefix = config.app.prefix;

  const rootPath = process.cwd();
  const baseDirPath = path.posix.join(rootPath, config.app.file.location);
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
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true, // 禁止未定义的属性
      transformOptions: {
        enableImplicitConversion: true, // 启用隐式类型转换
      },
    }),
  );
  app.useGlobalFilters(new GlobalExceptionFilter());

  // web 安全，防常见漏洞
  // 注意： 开发环境如果开启 nest static module 需要将 crossOriginResourcePolicy 设置为 false 否则 静态资源 跨域不可访问
  app.use(
    helmet({
      crossOriginOpenerPolicy: { policy: 'same-origin-allow-popups' },
      crossOriginResourcePolicy: false,
      // 完善 CSP 策略
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", 'data:', 'https:', 'http:'],
          connectSrc: ["'self'"],
          fontSrc: ["'self'", 'data:'],
          objectSrc: ["'none'"],
          mediaSrc: ["'self'"],
          frameSrc: ["'self'"],
        },
      },
      // 其他安全头
      hsts: {
        maxAge: 31536000, // 1年
        includeSubDomains: true,
        preload: true,
      },
      noSniff: true, // X-Content-Type-Options
      xssFilter: true, // X-XSS-Protection
      referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    }),
  );
  // cookie parser (required for CSRF when using cookie option)
  app.use(cookieParser());

  // CSRF 保护已禁用
  // app.use(
  //   csurf({
  //     cookie: {
  //       httpOnly: true,
  //       sameSite: 'strict',
  //       secure: process.env.NODE_ENV === 'production',
  //     },
  //   }),
  // );
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
    .addServer(config.app.file.domain)
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
    customSiteTitle: 'Nest-Admin-Soybean API Docs',
  });

  // 获取真实 ip
  app.use(requestIpMw({ attributeName: 'ip' }));
  //服务端口
  const port = config.app.port || 8080;
  await app.listen(port);

  // 使用 Logger 而不是 console.log
  const logger = new Logger('Bootstrap');
  logger.log(`Nest-Admin-Soybean 服务启动成功`);
  logger.log(`服务地址: http://localhost:${port}${prefix}/`);
  logger.log(`Swagger 文档: http://localhost:${port}${prefix}/swagger-ui/`);
  logger.log(`健康检查: http://localhost:${port}${prefix}/health`);
  logger.log(`Prometheus 指标: http://localhost:${port}${prefix}/metrics`);
}
bootstrap();
