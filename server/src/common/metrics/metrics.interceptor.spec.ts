import { ExecutionContext, CallHandler } from '@nestjs/common';
import { of, throwError } from 'rxjs';
import { MetricsInterceptor } from './metrics.interceptor';
import { MetricsService } from './metrics.service';

describe('MetricsInterceptor', () => {
  let interceptor: MetricsInterceptor;
  let metricsService: jest.Mocked<MetricsService>;

  const createMockExecutionContext = (
    method: string,
    path: string,
    statusCode: number,
    tenantId?: string,
  ): ExecutionContext => {
    const mockRequest = {
      method,
      path,
      url: path,
      route: { path },
      user: tenantId ? { tenantId } : undefined,
    };

    const mockResponse = {
      statusCode,
    };

    return {
      switchToHttp: () => ({
        getRequest: () => mockRequest,
        getResponse: () => mockResponse,
      }),
      getHandler: () => ({}),
      getClass: () => ({}),
    } as unknown as ExecutionContext;
  };

  const createMockCallHandler = (result: any = {}, shouldThrow = false): CallHandler => {
    return {
      handle: () => (shouldThrow ? throwError(() => result) : of(result)),
    };
  };

  beforeEach(() => {
    metricsService = {
      recordHttpRequest: jest.fn(),
      recordTenantApiCall: jest.fn(),
    } as unknown as jest.Mocked<MetricsService>;

    interceptor = new MetricsInterceptor(metricsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('intercept', () => {
    it('should be defined', () => {
      expect(interceptor).toBeDefined();
    });

    it('should record HTTP request metrics on successful request', (done) => {
      const context = createMockExecutionContext('GET', '/api/users', 200);
      const callHandler = createMockCallHandler({ data: 'test' });

      interceptor.intercept(context, callHandler).subscribe({
        next: () => {
          expect(metricsService.recordHttpRequest).toHaveBeenCalledWith(
            'GET',
            '/api/users',
            200,
            expect.any(Number),
          );
          done();
        },
      });
    });

    it('should record HTTP request metrics on error', (done) => {
      const context = createMockExecutionContext('POST', '/api/users', 500);
      const error = { status: 500, message: 'Internal Server Error' };
      const callHandler = createMockCallHandler(error, true);

      interceptor.intercept(context, callHandler).subscribe({
        error: () => {
          expect(metricsService.recordHttpRequest).toHaveBeenCalledWith(
            'POST',
            '/api/users',
            500,
            expect.any(Number),
          );
          done();
        },
      });
    });

    it('should record tenant API call when tenant ID is present', (done) => {
      const context = createMockExecutionContext('GET', '/api/users', 200, 'tenant001');
      const callHandler = createMockCallHandler({ data: 'test' });

      interceptor.intercept(context, callHandler).subscribe({
        next: () => {
          expect(metricsService.recordTenantApiCall).toHaveBeenCalledWith('tenant001', 'GET', '/api/users');
          done();
        },
      });
    });

    it('should not record tenant API call when tenant ID is not present', (done) => {
      const context = createMockExecutionContext('GET', '/api/users', 200);
      const callHandler = createMockCallHandler({ data: 'test' });

      interceptor.intercept(context, callHandler).subscribe({
        next: () => {
          expect(metricsService.recordTenantApiCall).not.toHaveBeenCalled();
          done();
        },
      });
    });

    it('should handle different HTTP methods', (done) => {
      const methods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'];
      let completed = 0;

      methods.forEach((method) => {
        const context = createMockExecutionContext(method, '/api/test', 200);
        const callHandler = createMockCallHandler({ data: 'test' });

        interceptor.intercept(context, callHandler).subscribe({
          next: () => {
            expect(metricsService.recordHttpRequest).toHaveBeenCalledWith(
              method,
              '/api/test',
              200,
              expect.any(Number),
            );
            completed++;
            if (completed === methods.length) {
              done();
            }
          },
        });
      });
    });

    it('should handle different status codes', (done) => {
      const statusCodes = [200, 201, 400, 401, 403, 404, 500];
      let completed = 0;

      statusCodes.forEach((statusCode) => {
        const context = createMockExecutionContext('GET', '/api/test', statusCode);
        const callHandler = createMockCallHandler({ data: 'test' });

        interceptor.intercept(context, callHandler).subscribe({
          next: () => {
            expect(metricsService.recordHttpRequest).toHaveBeenCalledWith(
              'GET',
              '/api/test',
              statusCode,
              expect.any(Number),
            );
            completed++;
            if (completed === statusCodes.length) {
              done();
            }
          },
        });
      });
    });

    it('should use statusCode from error when available', (done) => {
      const context = createMockExecutionContext('GET', '/api/users', 200);
      const error = { statusCode: 404, message: 'Not Found' };
      const callHandler = createMockCallHandler(error, true);

      interceptor.intercept(context, callHandler).subscribe({
        error: () => {
          expect(metricsService.recordHttpRequest).toHaveBeenCalledWith(
            'GET',
            '/api/users',
            404,
            expect.any(Number),
          );
          done();
        },
      });
    });

    it('should default to 500 when error has no status', (done) => {
      const context = createMockExecutionContext('GET', '/api/users', 200);
      const error = { message: 'Unknown Error' };
      const callHandler = createMockCallHandler(error, true);

      interceptor.intercept(context, callHandler).subscribe({
        error: () => {
          expect(metricsService.recordHttpRequest).toHaveBeenCalledWith(
            'GET',
            '/api/users',
            500,
            expect.any(Number),
          );
          done();
        },
      });
    });

    it('should record duration in seconds', (done) => {
      const context = createMockExecutionContext('GET', '/api/users', 200);
      const callHandler = createMockCallHandler({ data: 'test' });

      interceptor.intercept(context, callHandler).subscribe({
        next: () => {
          const durationArg = metricsService.recordHttpRequest.mock.calls[0][3];
          expect(typeof durationArg).toBe('number');
          expect(durationArg).toBeGreaterThanOrEqual(0);
          expect(durationArg).toBeLessThan(1); // Should be less than 1 second for a mock call
          done();
        },
      });
    });
  });
});
