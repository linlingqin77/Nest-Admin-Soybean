import { Test, TestingModule } from '@nestjs/testing';
import { MetricsService } from './metrics.service';

describe('MetricsService', () => {
  let service: MetricsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MetricsService],
    }).compile();

    service = module.get<MetricsService>(MetricsService);
  });

  afterEach(async () => {
    // 清理注册表
    const registry = service.getRegistry();
    registry.clear();
  });

  describe('initialization', () => {
    it('should be defined', () => {
      expect(service).toBeDefined();
    });

    it('should have all metrics initialized', () => {
      expect(service.httpRequestsTotal).toBeDefined();
      expect(service.httpRequestDuration).toBeDefined();
      expect(service.loginAttemptsTotal).toBeDefined();
      expect(service.apiCallsByTenant).toBeDefined();
      expect(service.cacheHitRate).toBeDefined();
      expect(service.cacheHits).toBeDefined();
      expect(service.cacheMisses).toBeDefined();
      expect(service.activeConnections).toBeDefined();
      expect(service.queueJobsTotal).toBeDefined();
    });

    it('should return registry', () => {
      const registry = service.getRegistry();
      expect(registry).toBeDefined();
    });
  });

  describe('getMetrics', () => {
    it('should return metrics in Prometheus format', async () => {
      const metrics = await service.getMetrics();
      expect(typeof metrics).toBe('string');
      expect(metrics).toContain('nest_admin_http_requests_total');
    });
  });

  describe('recordHttpRequest', () => {
    it('should increment HTTP request counter', async () => {
      service.recordHttpRequest('GET', '/api/users', 200, 0.1);

      const metrics = await service.getMetrics();
      expect(metrics).toContain('nest_admin_http_requests_total');
      expect(metrics).toContain('method="GET"');
      expect(metrics).toContain('path="/api/users"');
      expect(metrics).toContain('status_code="200"');
    });

    it('should record HTTP request duration', async () => {
      service.recordHttpRequest('POST', '/api/users', 201, 0.5);

      const metrics = await service.getMetrics();
      expect(metrics).toContain('nest_admin_http_request_duration_seconds');
    });

    it('should normalize paths with numeric IDs', async () => {
      service.recordHttpRequest('GET', '/api/users/123', 200, 0.1);

      const metrics = await service.getMetrics();
      expect(metrics).toContain('path="/api/users/:id"');
    });

    it('should normalize paths with UUIDs', async () => {
      service.recordHttpRequest('GET', '/api/users/550e8400-e29b-41d4-a716-446655440000', 200, 0.1);

      const metrics = await service.getMetrics();
      expect(metrics).toContain('path="/api/users/:uuid"');
    });

    it('should handle paths with query parameters', async () => {
      service.recordHttpRequest('GET', '/api/users?page=1&size=10', 200, 0.1);

      const metrics = await service.getMetrics();
      expect(metrics).toContain('path="/api/users"');
      expect(metrics).not.toContain('page=1');
    });
  });

  describe('recordLoginAttempt', () => {
    it('should record successful login attempt', async () => {
      service.recordLoginAttempt('tenant001', true);

      const metrics = await service.getMetrics();
      expect(metrics).toContain('nest_admin_login_attempts_total');
      expect(metrics).toContain('tenant_id="tenant001"');
      expect(metrics).toContain('status="success"');
    });

    it('should record failed login attempt', async () => {
      service.recordLoginAttempt('tenant001', false);

      const metrics = await service.getMetrics();
      expect(metrics).toContain('status="failure"');
    });

    it('should handle missing tenant ID', async () => {
      service.recordLoginAttempt('', true);

      const metrics = await service.getMetrics();
      expect(metrics).toContain('tenant_id="unknown"');
    });
  });

  describe('recordTenantApiCall', () => {
    it('should record tenant API call', async () => {
      service.recordTenantApiCall('tenant001', 'GET', '/api/users');

      const metrics = await service.getMetrics();
      expect(metrics).toContain('nest_admin_api_calls_by_tenant_total');
      expect(metrics).toContain('tenant_id="tenant001"');
      expect(metrics).toContain('method="GET"');
    });

    it('should normalize path in tenant API call', async () => {
      service.recordTenantApiCall('tenant001', 'GET', '/api/users/123');

      const metrics = await service.getMetrics();
      expect(metrics).toContain('path="/api/users/:id"');
    });
  });

  describe('cache metrics', () => {
    it('should record cache hit', async () => {
      service.recordCacheHit('user_cache');

      const metrics = await service.getMetrics();
      expect(metrics).toContain('nest_admin_cache_hits_total');
      expect(metrics).toContain('cache_name="user_cache"');
    });

    it('should record cache miss', async () => {
      service.recordCacheMiss('user_cache');

      const metrics = await service.getMetrics();
      expect(metrics).toContain('nest_admin_cache_misses_total');
      expect(metrics).toContain('cache_name="user_cache"');
    });

    it('should update cache hit rate', async () => {
      // Record some hits and misses
      service.recordCacheHit('test_cache');
      service.recordCacheHit('test_cache');
      service.recordCacheMiss('test_cache');

      const metrics = await service.getMetrics();
      expect(metrics).toContain('nest_admin_cache_hit_rate');
    });
  });

  describe('setActiveConnections', () => {
    it('should set active connections gauge', async () => {
      service.setActiveConnections('database', 5);

      const metrics = await service.getMetrics();
      expect(metrics).toContain('nest_admin_active_connections');
      expect(metrics).toContain('type="database"');
    });

    it('should update active connections', async () => {
      service.setActiveConnections('redis', 3);
      service.setActiveConnections('redis', 5);

      const metrics = await service.getMetrics();
      expect(metrics).toContain('nest_admin_active_connections{type="redis"} 5');
    });
  });

  describe('recordQueueJob', () => {
    it('should record completed queue job', async () => {
      service.recordQueueJob('email', 'completed');

      const metrics = await service.getMetrics();
      expect(metrics).toContain('nest_admin_queue_jobs_total');
      expect(metrics).toContain('queue_name="email"');
      expect(metrics).toContain('status="completed"');
    });

    it('should record failed queue job', async () => {
      service.recordQueueJob('email', 'failed');

      const metrics = await service.getMetrics();
      expect(metrics).toContain('status="failed"');
    });
  });
});
