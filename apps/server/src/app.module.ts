import { Module, Global, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppConfigService } from './platform/config/app-config.service';
import { ThrottlerModule } from '@nestjs/throttler';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { BullModule } from '@nestjs/bull';
import configuration from './platform/config/index';
import { validate } from './platform/config/env.validation';
import { AppConfigModule } from './platform/config/app-config.module';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { JwtAuthGuard } from './core/auth/guards/auth.guard';
import { PermissionGuard } from './core/permissions/guards/permission.guard';
import { RolesGuard } from './core/permissions/guards/roles.guard';
import { CustomThrottlerGuard } from './core/http/guards/throttle.guard';
import { TenantGuard, TenantModule } from './core/tenancy';
import { TenantContext } from './core/tenancy/context';
import { ClsModule } from './core/tenancy/context/cls.module';
import { CryptoModule, DecryptInterceptor } from './core/crypto';
import { LoggerModule } from './platform/logger/logger.module';
import { MetricsModule } from './core/observability/metrics/metrics.module';
import { MetricsInterceptor } from './core/observability/metrics/metrics.interceptor';
import { TracingModule } from './core/observability/tracing/tracing.module';
import { GlobalExceptionFilter } from './core/http/filters/global-exception.filter';
import { ResponseInterceptor } from './core/http/interceptors/response.interceptor';
import { AuditModule } from './core/audit/audit.module';
import { LoginSecurityModule } from './core/auth/login-security.module';
import { MfaModule } from './core/auth/mfa/mfa.module';
import { DataLoaderModule } from './platform/dataloader/dataloader.module';
import { SharedServicesModule } from './shared/services/shared-services.module';

import { MainModule } from './modules/auth/main.module';
import { UploadModule } from './modules/files/upload.module';
import { SystemModule } from './modules/system.module';
import { CommonModule } from './modules/common.module';
import { MonitorModule } from './modules/monitor.module';
import { ResourceModule } from './modules/resource.module';
import { PrismaModule } from './platform/prisma/prisma.module';
import { ResilienceModule } from './platform/resilience/circuit-breaker/resilience.module';

@Global()
@Module({
  imports: [
    // 配置模块 - 强类型配置验证
    ConfigModule.forRoot({
      cache: true,
      load: [configuration],
      isGlobal: true,
      validate,
      envFilePath: [`.env.${process.env.NODE_ENV || 'development'}`, '.env'],
      validationOptions: {
        allowUnknown: true,
        abortEarly: false,
      },
    }),
    // 类型安全的配置服务模块
    AppConfigModule,
    // Pino 日志模块
    LoggerModule,
    // CLS 上下文模块 (Request ID)
    ClsModule,
    // Prometheus 指标收集模块
    MetricsModule,
    // OpenTelemetry 分布式追踪模块
    TracingModule,
    // 审计日志模块
    AuditModule,
    // DataLoader 模块 (解决 N+1 查询问题)
    DataLoaderModule,
    // 登录安全模块 (登录失败锁定、Token黑名单)
    LoginSecurityModule,
    // 多因素认证模块 (TOTP、SMS 二次验证)
    MfaModule,
    // 共享服务模块 (解决循环依赖的桥接服务)
    SharedServicesModule,
    // 数据库改为 Prisma + PostgreSQL
    PrismaModule,
    // 多租户模块
    TenantModule,
    // 加解密模块
    CryptoModule,
    // 弹性模块 (熔断器)
    ResilienceModule,
    // 事件发射器模块 (领域事件驱动架构)
    EventEmitterModule.forRoot({
      wildcard: false,
      delimiter: '.',
      maxListeners: 20,
      verboseMemoryLeak: true,
    }),
    // API 限流模块
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 100,
      },
    ]),
    // Bull 队列模块 (用于异步任务处理)
    BullModule.forRootAsync({
      inject: [AppConfigService],
      useFactory: (config: AppConfigService) => ({
        redis: {
          host: config.redis.host,
          port: config.redis.port,
          password: config.redis.password,
          db: config.redis.db,
          keyPrefix: config.redis.keyPrefix + 'bull:',
        },
        defaultJobOptions: {
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 2000,
          },
          removeOnComplete: 100, // 保留最近100个已完成任务
          removeOnFail: 500, // 保留最近500个失败任务
        },
      }),
    }),

    MainModule,
    UploadModule,

    CommonModule,
    SystemModule,
    MonitorModule,
    ResourceModule,
  ],
  providers: [
    // 全局异常过滤器 (通过 DI 注册，支持完整依赖注入)
    {
      provide: APP_FILTER,
      useClass: GlobalExceptionFilter,
    },
    // 统一响应拦截器 (为所有响应添加 requestId 和 timestamp)
    {
      provide: APP_INTERCEPTOR,
      useClass: ResponseInterceptor,
    },
    // 解密拦截器 (解密前端加密请求)
    {
      provide: APP_INTERCEPTOR,
      useClass: DecryptInterceptor,
    },
    // 指标收集拦截器 (收集 HTTP 请求指标)
    {
      provide: APP_INTERCEPTOR,
      useClass: MetricsInterceptor,
    },
    // API 限流守卫 - 最先执行，防止DDoS攻击
    {
      provide: APP_GUARD,
      useClass: CustomThrottlerGuard,
    },
    // JWT 认证守卫 - 第二执行，验证用户身份
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    // 租户守卫 - 基于已认证用户设置租户上下文
    {
      provide: APP_GUARD,
      useClass: TenantGuard,
    },
    // 角色守卫 - 检查用户角色
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
    // 权限守卫 - 检查API权限
    {
      provide: APP_GUARD,
      useClass: PermissionGuard,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // Note: Tenant middleware is now handled at the Prisma level
    // via createTenantMiddleware() in PrismaService
    // No HTTP middleware needed here
  }
}
