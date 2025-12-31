import { ExecutionContext, CallHandler } from '@nestjs/common';
import { of } from 'rxjs';
import { ResponseInterceptor } from './response.interceptor';
import { Result } from '../response/result';
import { ClsService } from 'nestjs-cls';

describe('ResponseInterceptor', () => {
  let interceptor: ResponseInterceptor;
  let mockClsService: jest.Mocked<ClsService>;
  let mockExecutionContext: jest.Mocked<ExecutionContext>;
  let mockCallHandler: jest.Mocked<CallHandler>;

  const mockRequestId = 'test-request-id-123';

  beforeEach(() => {
    mockClsService = {
      get: jest.fn().mockReturnValue(mockRequestId),
    } as any;

    interceptor = new ResponseInterceptor(mockClsService);

    mockExecutionContext = {
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue({
          requestId: mockRequestId,
          id: mockRequestId,
        }),
      }),
    } as any;

    mockCallHandler = {
      handle: jest.fn(),
    } as any;
  });

  describe('intercept', () => {
    it('should add requestId and timestamp to Result instance', (done) => {
      const result = Result.ok({ id: 1 });
      mockCallHandler.handle.mockReturnValue(of(result));

      interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe((response) => {
        expect(response).toBeInstanceOf(Result);
        expect(response.requestId).toBe(mockRequestId);
        expect(response.timestamp).toBeDefined();
        expect(typeof response.timestamp).toBe('string');
        done();
      });
    });

    it('should add requestId and timestamp to object with code field', (done) => {
      const data = { code: 200, msg: '操作成功', data: { id: 1 } };
      mockCallHandler.handle.mockReturnValue(of(data));

      interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe((response) => {
        expect(response.code).toBe(200);
        expect(response.msg).toBe('操作成功');
        expect(response.data).toEqual({ id: 1 });
        expect(response.requestId).toBe(mockRequestId);
        expect(response.timestamp).toBeDefined();
        done();
      });
    });

    it('should wrap plain data in standard response format', (done) => {
      const data = { id: 1, name: 'test' };
      mockCallHandler.handle.mockReturnValue(of(data));

      interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe((response) => {
        expect(response.code).toBe(200);
        expect(response.msg).toBe('操作成功');
        expect(response.data).toEqual(data);
        expect(response.requestId).toBe(mockRequestId);
        expect(response.timestamp).toBeDefined();
        done();
      });
    });

    it('should use fallback requestId from request object when CLS is not available', (done) => {
      const interceptorWithoutCls = new ResponseInterceptor(null as any);
      const result = Result.ok({ id: 1 });
      mockCallHandler.handle.mockReturnValue(of(result));

      interceptorWithoutCls.intercept(mockExecutionContext, mockCallHandler).subscribe((response) => {
        expect(response.requestId).toBe(mockRequestId);
        done();
      });
    });

    it('should use "-" as requestId when no requestId is available', (done) => {
      const interceptorWithoutCls = new ResponseInterceptor(null as any);
      const mockContextWithoutRequestId = {
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: jest.fn().mockReturnValue({}),
        }),
      } as any;
      const result = Result.ok({ id: 1 });
      mockCallHandler.handle.mockReturnValue(of(result));

      interceptorWithoutCls.intercept(mockContextWithoutRequestId, mockCallHandler).subscribe((response) => {
        expect(response.requestId).toBe('-');
        done();
      });
    });

    it('should handle null data', (done) => {
      mockCallHandler.handle.mockReturnValue(of(null));

      interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe((response) => {
        expect(response.code).toBe(200);
        expect(response.msg).toBe('操作成功');
        expect(response.data).toBeNull();
        expect(response.requestId).toBe(mockRequestId);
        done();
      });
    });

    it('should handle primitive data', (done) => {
      mockCallHandler.handle.mockReturnValue(of('test string'));

      interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe((response) => {
        expect(response.code).toBe(200);
        expect(response.data).toBe('test string');
        expect(response.requestId).toBe(mockRequestId);
        done();
      });
    });

    it('should preserve existing Result properties', (done) => {
      const result = Result.fail(400, '参数错误', { field: 'username' });
      mockCallHandler.handle.mockReturnValue(of(result));

      interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe((response) => {
        expect(response.code).toBe(400);
        expect(response.msg).toBe('参数错误');
        expect(response.data).toEqual({ field: 'username' });
        expect(response.requestId).toBe(mockRequestId);
        done();
      });
    });
  });
});
