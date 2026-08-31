import { Module, Global } from '@nestjs/common';
import { TracingService } from './tracing.service';

/**
 * OpenTelemetry 分布式追踪模块
 *
 * 提供自动化的 HTTP/Express 请求追踪和手动 Span 管理能力。
 * 通过环境变量控制：
 * - OTEL_ENABLED=true 启用追踪
 * - OTEL_ENDPOINT=http://localhost:4318/v1/traces OTLP 导出端点
 * - OTEL_SERVICE_NAME=nest-admin 服务名称
 */
@Global()
@Module({
  providers: [TracingService],
  exports: [TracingService],
})
export class TracingModule {}
