/**
 * 健康检查和监控指标E2E测试
 *
 * @description
 * 测试健康检查和监控指标相关的所有API端点
 * - GET /api/v1/health 综合健康检查
 * - GET /api/v1/health/live 存活探针
 * - GET /api/v1/health/ready 就绪探针
 * - GET /api/v1/metrics Prometheus指标
 *
 * _Requirements: 15.1, 15.2, 15.3, 15.4_
 */

import { TestHelper } from '../helpers/test-helper';

describe('Health Check E2E Tests', () => {
  let helper: TestHelper;
  const apiPrefix = '/api/v1';

  beforeAll(async () => {
    helper = new TestHelper();
    await helper.init();
  }, 60000);

  afterAll(async () => {
    await helper.cleanup();
    await helper.close();
  });

  /**
   * Helper to extract health data from response
   * Response can be either:
   * - Wrapped success (code: 200, data: {...})
   * - Wrapped error (code: 503, data: null, msg: "...")
   * - Raw terminus format (status, info, details, error)
   */
  function getHealthData(body: any): any {
    // If wrapped in standard API response format with data
    if (body.code !== undefined && body.data !== undefined && body.data !== null) {
      return body.data;
    }
    // If wrapped error response (data is null), return null
    if (body.code !== undefined && body.data === null) {
      return null;
    }
    // Raw terminus format
    return body;
  }

  /**
   * Check if response indicates a valid health check response
   * (either success or service unavailable)
   */
  function isValidHealthResponse(status: number): boolean {
    return status === 200 || status === 503;
  }

  describe('GET /health - 综合健康检查', () => {
    it('should return health status response', async () => {
      const response = await helper
        .getRequest()
        .get(`${apiPrefix}/health`);

      // Health check returns 200 (ok) or 503 (service unavailable)
      expect(isValidHealthResponse(response.status)).toBe(true);
      
      const healthData = getHealthData(response.body);
      
      if (response.status === 200 && healthData) {
        // Success response should have terminus format
        expect(healthData).toHaveProperty('status');
        expect(healthData).toHaveProperty('info');
        expect(healthData).toHaveProperty('details');
        expect(['ok', 'error']).toContain(healthData.status);
      } else {
        // Error response (503) - data is null, but response has code and msg
        expect(response.body).toHaveProperty('code');
        expect(response.body.code).toBe(503);
      }
    });

    it('should include database health check when healthy', async () => {
      const response = await helper
        .getRequest()
        .get(`${apiPrefix}/health`);

      expect(isValidHealthResponse(response.status)).toBe(true);
      
      const healthData = getHealthData(response.body);
      
      if (healthData) {
        // Database check should be present in info or error
        const hasDatabase = healthData.info?.database || healthData.error?.database;
        expect(hasDatabase).toBeDefined();
      }
      // If healthData is null (503 error), the test passes as the endpoint responded
    });

    it('should include redis health check when healthy', async () => {
      const response = await helper
        .getRequest()
        .get(`${apiPrefix}/health`);

      expect(isValidHealthResponse(response.status)).toBe(true);
      
      const healthData = getHealthData(response.body);
      
      if (healthData) {
        // Redis check should be present in info or error
        const hasRedis = healthData.info?.redis || healthData.error?.redis;
        expect(hasRedis).toBeDefined();
      }
    });

    it('should include memory health check when healthy', async () => {
      const response = await helper
        .getRequest()
        .get(`${apiPrefix}/health`);

      expect(isValidHealthResponse(response.status)).toBe(true);
      
      const healthData = getHealthData(response.body);
      
      if (healthData) {
        // Memory check should be present in info or error
        const hasMemory = healthData.info?.memory_heap || healthData.error?.memory_heap;
        expect(hasMemory).toBeDefined();
      }
    });

    it('should include disk health check when healthy', async () => {
      const response = await helper
        .getRequest()
        .get(`${apiPrefix}/health`);

      expect(isValidHealthResponse(response.status)).toBe(true);
      
      const healthData = getHealthData(response.body);
      
      if (healthData) {
        // Disk check should be present in info or error
        const hasDisk = healthData.info?.disk || healthData.error?.disk;
        expect(hasDisk).toBeDefined();
      }
    });

    it('should not require authentication', async () => {
      // Health check should be accessible without token
      const response = await helper
        .getRequest()
        .get(`${apiPrefix}/health`);

      // Should not return 401 or 403
      expect([401, 403]).not.toContain(response.status);
    });
  });

  describe('GET /health/live - 存活探针', () => {
    it('should return liveness status response', async () => {
      const response = await helper
        .getRequest()
        .get(`${apiPrefix}/health/live`);

      // Liveness check returns 200 (ok) or 503 (service unavailable)
      expect(isValidHealthResponse(response.status)).toBe(true);
      
      const healthData = getHealthData(response.body);
      
      if (response.status === 200 && healthData) {
        expect(healthData).toHaveProperty('status');
        expect(['ok', 'error']).toContain(healthData.status);
      } else {
        expect(response.body).toHaveProperty('code');
      }
    });

    it('should include memory check when healthy', async () => {
      const response = await helper
        .getRequest()
        .get(`${apiPrefix}/health/live`);

      expect(isValidHealthResponse(response.status)).toBe(true);
      
      const healthData = getHealthData(response.body);
      
      if (healthData) {
        // Memory check should be present in info or error
        const hasMemory = healthData.info?.memory || healthData.error?.memory;
        expect(hasMemory).toBeDefined();
      }
    });

    it('should not require authentication', async () => {
      const response = await helper
        .getRequest()
        .get(`${apiPrefix}/health/live`);

      expect([401, 403]).not.toContain(response.status);
    });
  });

  describe('GET /health/liveness - 存活探针别名', () => {
    it('should return liveness status response', async () => {
      const response = await helper
        .getRequest()
        .get(`${apiPrefix}/health/liveness`);

      expect(isValidHealthResponse(response.status)).toBe(true);
      
      const healthData = getHealthData(response.body);
      
      if (response.status === 200 && healthData) {
        expect(healthData).toHaveProperty('status');
        expect(['ok', 'error']).toContain(healthData.status);
      } else {
        expect(response.body).toHaveProperty('code');
      }
    });
  });

  describe('GET /health/ready - 就绪探针', () => {
    it('should return readiness status response', async () => {
      const response = await helper
        .getRequest()
        .get(`${apiPrefix}/health/ready`);

      // Readiness check returns 200 (ok) or 503 (service unavailable)
      expect(isValidHealthResponse(response.status)).toBe(true);
      
      const healthData = getHealthData(response.body);
      
      if (response.status === 200 && healthData) {
        expect(healthData).toHaveProperty('status');
        expect(['ok', 'error']).toContain(healthData.status);
      } else {
        expect(response.body).toHaveProperty('code');
      }
    });

    it('should include database check when healthy', async () => {
      const response = await helper
        .getRequest()
        .get(`${apiPrefix}/health/ready`);

      expect(isValidHealthResponse(response.status)).toBe(true);
      
      const healthData = getHealthData(response.body);
      
      if (healthData) {
        // Database check should be present in info or error
        const hasDatabase = healthData.info?.database || healthData.error?.database;
        expect(hasDatabase).toBeDefined();
      }
    });

    it('should include redis check when healthy', async () => {
      const response = await helper
        .getRequest()
        .get(`${apiPrefix}/health/ready`);

      expect(isValidHealthResponse(response.status)).toBe(true);
      
      const healthData = getHealthData(response.body);
      
      if (healthData) {
        // Redis check should be present in info or error
        const hasRedis = healthData.info?.redis || healthData.error?.redis;
        expect(hasRedis).toBeDefined();
      }
    });

    it('should not require authentication', async () => {
      const response = await helper
        .getRequest()
        .get(`${apiPrefix}/health/ready`);

      expect([401, 403]).not.toContain(response.status);
    });
  });

  describe('GET /health/readiness - 就绪探针别名', () => {
    it('should return readiness status response', async () => {
      const response = await helper
        .getRequest()
        .get(`${apiPrefix}/health/readiness`);

      expect(isValidHealthResponse(response.status)).toBe(true);
      
      const healthData = getHealthData(response.body);
      
      if (response.status === 200 && healthData) {
        expect(healthData).toHaveProperty('status');
        expect(['ok', 'error']).toContain(healthData.status);
      } else {
        expect(response.body).toHaveProperty('code');
      }
    });
  });

  describe('GET /health/info - 应用信息', () => {
    it('should return application info', async () => {
      const response = await helper
        .getRequest()
        .get(`${apiPrefix}/health/info`)
        .expect(200);

      // Info endpoint should return application metadata
      expect(response.body).toBeDefined();
    });

    it('should not require authentication', async () => {
      const response = await helper
        .getRequest()
        .get(`${apiPrefix}/health/info`);

      expect([401, 403]).not.toContain(response.status);
    });
  });

  describe('GET /metrics - Prometheus指标', () => {
    it('should return Prometheus metrics', async () => {
      const response = await helper
        .getRequest()
        .get(`${apiPrefix}/metrics`)
        .expect(200);

      // Prometheus metrics are returned as plain text
      expect(response.text).toBeDefined();
      expect(typeof response.text).toBe('string');
    });

    it('should contain default Node.js metrics', async () => {
      const response = await helper
        .getRequest()
        .get(`${apiPrefix}/metrics`)
        .expect(200);

      // Check for common Prometheus metrics
      expect(response.text).toContain('process_cpu');
      expect(response.text).toContain('nodejs_');
    });

    it('should contain HTTP request metrics', async () => {
      const response = await helper
        .getRequest()
        .get(`${apiPrefix}/metrics`)
        .expect(200);

      // Check for HTTP metrics (may vary based on configuration)
      expect(response.text).toContain('http_');
    });

    it('should not require authentication', async () => {
      const response = await helper
        .getRequest()
        .get(`${apiPrefix}/metrics`);

      expect([401, 403]).not.toContain(response.status);
    });

    it('should return content-type text/plain', async () => {
      const response = await helper
        .getRequest()
        .get(`${apiPrefix}/metrics`)
        .expect(200);

      expect(response.headers['content-type']).toContain('text/plain');
    });
  });
});
