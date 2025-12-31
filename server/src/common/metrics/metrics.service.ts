import { Injectable, OnModuleInit } from '@nestjs/common';
import { Counter, Histogram, Gauge, Registry, collectDefaultMetrics } from 'prom-client';

/**
 * Prometheus 指标收集服务
 *
 * @description 提供 HTTP 请求指标、业务指标的收集和管理
 * 实现需求 2.3 和 2.4
 */
@Injectable()
export class MetricsService implements OnModuleInit {
  private readonly registry: Registry;

  // HTTP 请求指标
  public readonly httpRequestsTotal: Counter<string>;
  public readonly httpRequestDuration: Histogram<string>;

  // 业务指标
  public readonly loginAttemptsTotal: Counter<string>;
  public readonly apiCallsByTenant: Counter<string>;
  public readonly cacheHitRate: Gauge<string>;
  public readonly cacheHits: Counter<string>;
  public readonly cacheMisses: Counter<string>;

  // 系统指标
  public readonly activeConnections: Gauge<string>;
  public readonly queueJobsTotal: Counter<string>;

  constructor() {
    this.registry = new Registry();

    // HTTP 请求计数器
    this.httpRequestsTotal = new Counter({
      name: 'nest_admin_http_requests_total',
      help: 'Total number of HTTP requests',
      labelNames: ['method', 'path', 'status_code'],
      registers: [this.registry],
    });

    // HTTP 请求延迟直方图
    this.httpRequestDuration = new Histogram({
      name: 'nest_admin_http_request_duration_seconds',
      help: 'HTTP request duration in seconds',
      labelNames: ['method', 'path', 'status_code'],
      buckets: [0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
      registers: [this.registry],
    });

    // 登录尝试计数器
    this.loginAttemptsTotal = new Counter({
      name: 'nest_admin_login_attempts_total',
      help: 'Total number of login attempts',
      labelNames: ['tenant_id', 'status'],
      registers: [this.registry],
    });

    // 按租户 API 调用计数器
    this.apiCallsByTenant = new Counter({
      name: 'nest_admin_api_calls_by_tenant_total',
      help: 'Total number of API calls by tenant',
      labelNames: ['tenant_id', 'method', 'path'],
      registers: [this.registry],
    });

    // 缓存命中率 Gauge
    this.cacheHitRate = new Gauge({
      name: 'nest_admin_cache_hit_rate',
      help: 'Cache hit rate (0-1)',
      labelNames: ['cache_name'],
      registers: [this.registry],
    });

    // 缓存命中计数器
    this.cacheHits = new Counter({
      name: 'nest_admin_cache_hits_total',
      help: 'Total number of cache hits',
      labelNames: ['cache_name'],
      registers: [this.registry],
    });

    // 缓存未命中计数器
    this.cacheMisses = new Counter({
      name: 'nest_admin_cache_misses_total',
      help: 'Total number of cache misses',
      labelNames: ['cache_name'],
      registers: [this.registry],
    });

    // 活跃连接数 Gauge
    this.activeConnections = new Gauge({
      name: 'nest_admin_active_connections',
      help: 'Number of active connections',
      labelNames: ['type'],
      registers: [this.registry],
    });

    // 队列任务计数器
    this.queueJobsTotal = new Counter({
      name: 'nest_admin_queue_jobs_total',
      help: 'Total number of queue jobs',
      labelNames: ['queue_name', 'status'],
      registers: [this.registry],
    });
  }

  onModuleInit() {
    // 收集默认的 Node.js 指标
    collectDefaultMetrics({
      register: this.registry,
      prefix: 'nest_admin_',
    });
  }

  /**
   * 获取指标注册表
   */
  getRegistry(): Registry {
    return this.registry;
  }

  /**
   * 获取所有指标（Prometheus 格式）
   */
  async getMetrics(): Promise<string> {
    return this.registry.metrics();
  }

  /**
   * 记录 HTTP 请求
   */
  recordHttpRequest(method: string, path: string, statusCode: number, durationSeconds: number): void {
    const normalizedPath = this.normalizePath(path);
    const labels = { method, path: normalizedPath, status_code: String(statusCode) };

    this.httpRequestsTotal.inc(labels);
    this.httpRequestDuration.observe(labels, durationSeconds);
  }

  /**
   * 记录登录尝试
   */
  recordLoginAttempt(tenantId: string, success: boolean): void {
    this.loginAttemptsTotal.inc({
      tenant_id: tenantId || 'unknown',
      status: success ? 'success' : 'failure',
    });
  }

  /**
   * 记录租户 API 调用
   */
  recordTenantApiCall(tenantId: string, method: string, path: string): void {
    const normalizedPath = this.normalizePath(path);
    this.apiCallsByTenant.inc({
      tenant_id: tenantId || 'unknown',
      method,
      path: normalizedPath,
    });
  }

  /**
   * 记录缓存命中
   */
  recordCacheHit(cacheName: string): void {
    this.cacheHits.inc({ cache_name: cacheName });
    this.updateCacheHitRate(cacheName);
  }

  /**
   * 记录缓存未命中
   */
  recordCacheMiss(cacheName: string): void {
    this.cacheMisses.inc({ cache_name: cacheName });
    this.updateCacheHitRate(cacheName);
  }

  /**
   * 更新缓存命中率
   */
  private async updateCacheHitRate(cacheName: string): Promise<void> {
    const hits = await this.getCacheHitsCount(cacheName);
    const misses = await this.getCacheMissesCount(cacheName);
    const total = hits + misses;

    if (total > 0) {
      this.cacheHitRate.set({ cache_name: cacheName }, hits / total);
    }
  }

  /**
   * 获取缓存命中次数
   */
  private async getCacheHitsCount(cacheName: string): Promise<number> {
    const metric = await this.registry.getSingleMetricAsString('nest_admin_cache_hits_total');
    const match = metric.match(new RegExp(`cache_name="${cacheName}"[^}]*}\\s+(\\d+)`));
    return match ? parseInt(match[1], 10) : 0;
  }

  /**
   * 获取缓存未命中次数
   */
  private async getCacheMissesCount(cacheName: string): Promise<number> {
    const metric = await this.registry.getSingleMetricAsString('nest_admin_cache_misses_total');
    const match = metric.match(new RegExp(`cache_name="${cacheName}"[^}]*}\\s+(\\d+)`));
    return match ? parseInt(match[1], 10) : 0;
  }

  /**
   * 设置活跃连接数
   */
  setActiveConnections(type: string, count: number): void {
    this.activeConnections.set({ type }, count);
  }

  /**
   * 记录队列任务
   */
  recordQueueJob(queueName: string, status: 'completed' | 'failed' | 'active'): void {
    this.queueJobsTotal.inc({ queue_name: queueName, status });
  }

  /**
   * 规范化路径，移除动态参数
   * 例如: /api/users/123 -> /api/users/:id
   */
  private normalizePath(path: string): string {
    if (!path) return 'unknown';

    return (
      path
        // 移除查询参数
        .split('?')[0]
        // 替换 UUID (必须在数字 ID 之前处理)
        .replace(/\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, '/:uuid')
        // 替换长数字字符串（如租户 ID）
        .replace(/\/[0-9]{6,}/g, '/:id')
        // 替换数字 ID
        .replace(/\/\d+/g, '/:id')
    );
  }
}
