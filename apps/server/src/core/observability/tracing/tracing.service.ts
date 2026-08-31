import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { NodeSDK } from '@opentelemetry/sdk-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { resourceFromAttributes } from '@opentelemetry/resources';
import { ATTR_SERVICE_NAME, ATTR_SERVICE_VERSION } from '@opentelemetry/semantic-conventions';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { BatchSpanProcessor, SimpleSpanProcessor, ConsoleSpanExporter } from '@opentelemetry/sdk-trace-node';
import { trace, context, SpanStatusCode, Span } from '@opentelemetry/api';

/**
 * 分布式追踪配置
 */
export interface TracingConfig {
  /** 是否启用追踪 */
  enabled: boolean;
  /** 服务名称 */
  serviceName: string;
  /** 服务版本 */
  serviceVersion: string;
  /** OTLP Collector 端点 */
  endpoint?: string;
  /** 是否输出到控制台（开发模式） */
  consoleExporter?: boolean;
}

/**
 * OpenTelemetry 分布式追踪服务
 *
 * 提供以下能力：
 * - 自动 HTTP/Express 请求追踪
 * - 手动 Span 创建和管理
 * - Trace Context 传播
 * - 导出到 OTLP Collector (Jaeger/Zipkin/Grafana Tempo)
 *
 * 配置通过环境变量：
 * - OTEL_ENABLED: 是否启用 (默认 false)
 * - OTEL_ENDPOINT: OTLP HTTP 端点 (默认 http://localhost:4318/v1/traces)
 * - OTEL_SERVICE_NAME: 服务名称 (默认 nest-admin)
 */
@Injectable()
export class TracingService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(TracingService.name);
  private sdk: NodeSDK | null = null;
  private readonly config: TracingConfig;

  constructor() {
    this.config = {
      enabled: process.env.OTEL_ENABLED === 'true',
      serviceName: process.env.OTEL_SERVICE_NAME || 'nest-admin',
      serviceVersion: process.env.npm_package_version || '2.0.0',
      endpoint: process.env.OTEL_ENDPOINT || 'http://localhost:4318/v1/traces',
      consoleExporter: process.env.NODE_ENV === 'development' && process.env.OTEL_CONSOLE === 'true',
    };
  }

  async onModuleInit() {
    if (!this.config.enabled) {
      this.logger.log('OpenTelemetry tracing is disabled. Set OTEL_ENABLED=true to enable.');
      return;
    }

    try {
      const resource = resourceFromAttributes({
        [ATTR_SERVICE_NAME]: this.config.serviceName,
        [ATTR_SERVICE_VERSION]: this.config.serviceVersion,
        'deployment.environment': process.env.NODE_ENV || 'development',
      });

      const spanProcessors = [];

      // OTLP HTTP Exporter（发送到 Jaeger/Zipkin/Tempo）
      if (this.config.endpoint) {
        const otlpExporter = new OTLPTraceExporter({
          url: this.config.endpoint,
        });
        spanProcessors.push(new BatchSpanProcessor(otlpExporter));
      }

      // 控制台输出（开发调试）
      if (this.config.consoleExporter) {
        spanProcessors.push(new SimpleSpanProcessor(new ConsoleSpanExporter()));
      }

      this.sdk = new NodeSDK({
        resource,
        spanProcessors,
        instrumentations: [
          getNodeAutoInstrumentations({
            // 启用 HTTP 和 Express 自动追踪
            '@opentelemetry/instrumentation-http': {
              enabled: true,
            },
            '@opentelemetry/instrumentation-express': {
              enabled: true,
            },
            // 禁用不需要的自动追踪
            '@opentelemetry/instrumentation-fs': {
              enabled: false,
            },
          }),
        ],
      });

      await this.sdk.start();
      this.logger.log(
        `OpenTelemetry tracing initialized: service=${this.config.serviceName}, endpoint=${this.config.endpoint}`,
      );
    } catch (error) {
      this.logger.error(`Failed to initialize OpenTelemetry: ${error.message}`, error.stack);
    }
  }

  async onModuleDestroy() {
    if (this.sdk) {
      try {
        await this.sdk.shutdown();
        this.logger.log('OpenTelemetry SDK shut down successfully');
      } catch (error) {
        this.logger.error(`Error shutting down OpenTelemetry: ${error.message}`);
      }
    }
  }

  /**
   * 获取当前 Trace ID
   */
  getTraceId(): string | undefined {
    const span = trace.getActiveSpan();
    return span?.spanContext().traceId;
  }

  /**
   * 获取当前 Span ID
   */
  getSpanId(): string | undefined {
    const span = trace.getActiveSpan();
    return span?.spanContext().spanId;
  }

  /**
   * 创建并启动一个新的 Span
   *
   * @param name Span 名称
   * @param fn 要在 Span 中执行的函数
   * @param attributes 可选的 Span 属性
   */
  async withSpan<T>(
    name: string,
    fn: (span: Span) => Promise<T>,
    attributes?: Record<string, string | number | boolean>,
  ): Promise<T> {
    const tracer = trace.getTracer(this.config.serviceName);
    return tracer.startActiveSpan(name, async (span) => {
      try {
        if (attributes) {
          Object.entries(attributes).forEach(([key, value]) => {
            span.setAttribute(key, value);
          });
        }

        const result = await fn(span);
        span.setStatus({ code: SpanStatusCode.OK });
        return result;
      } catch (error) {
        span.setStatus({
          code: SpanStatusCode.ERROR,
          message: error instanceof Error ? error.message : 'Unknown error',
        });
        span.recordException(error instanceof Error ? error : new Error(String(error)));
        throw error;
      } finally {
        span.end();
      }
    });
  }

  /**
   * 添加事件到当前活跃的 Span
   */
  addEvent(name: string, attributes?: Record<string, string | number | boolean>): void {
    const span = trace.getActiveSpan();
    if (span) {
      span.addEvent(name, attributes);
    }
  }

  /**
   * 设置当前 Span 的属性
   */
  setAttribute(key: string, value: string | number | boolean): void {
    const span = trace.getActiveSpan();
    if (span) {
      span.setAttribute(key, value);
    }
  }
}
