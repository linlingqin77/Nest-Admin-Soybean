import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, CallHandler } from '@nestjs/common';
import { of, throwError } from 'rxjs';
import { OperlogInterceptor } from '@/core/http/interceptors/operlog.interceptor';
import { OperlogService } from '@/modules/oper-logs/operlog.service';
import { Reflector } from '@nestjs/core';

describe('OperlogInterceptor', () => {
  let interceptor: OperlogInterceptor;
  let operlogServiceMock: jest.Mocked<OperlogService>;

  beforeEach(async () => {
    operlogServiceMock = {
      logAction: jest.fn(),
    } as any;

    const modules: TestingModule = await Test.createTestingModule({
      providers: [OperlogInterceptor, { provide: OperlogService, useValue: operlogServiceMock }],
    }).compile();

    interceptor = modules.get<OperlogInterceptor>(OperlogInterceptor);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const createMockContext = (): ExecutionContext => {
    return {
      getHandler: () => ({
        name: 'testHandler',
      }),
      getClass: () => ({}),
      switchToHttp: () => ({
        getRequest: () => ({}),
        getResponse: () => ({}),
      }),
    } as ExecutionContext;
  };

  const createMockCallHandler = (response: any): CallHandler => ({
    handle: () => of(response),
  });

  const createErrorCallHandler = (error: any): CallHandler => ({
    handle: () => throwError(() => error),
  });

  describe('intercept', () => {
    beforeEach(() => {
      // Mock reflector
      jest.spyOn(interceptor['reflector'], 'getAllAndOverride').mockReturnValue({
        summary: 'Test Operation',
      });
      jest.spyOn(interceptor['reflector'], 'get').mockReturnValue({
        businessType: 1,
      });
    });

    it('should log successful operation with code 200', (done) => {
      const context = createMockContext();
      const callHandler = createMockCallHandler({ code: 200, data: 'success' });

      interceptor.intercept(context, callHandler).subscribe({
        next: (result) => {
          expect(result).toEqual({ code: 200, data: 'success' });
          expect(operlogServiceMock.logAction).toHaveBeenCalledWith(
            expect.objectContaining({
              resultData: { code: 200, data: 'success' },
              handlerName: 'testHandler',
              title: 'Test Operation',
              businessType: 1,
            }),
          );
          done();
        },
      });
    });

    it('should log business error when code is not 200', (done) => {
      const context = createMockContext();
      const callHandler = createMockCallHandler({ code: 500, msg: 'Error occurred' });

      interceptor.intercept(context, callHandler).subscribe({
        next: (result) => {
          expect(result).toEqual({ code: 500, msg: 'Error occurred' });
          expect(operlogServiceMock.logAction).toHaveBeenCalledWith(
            expect.objectContaining({
              errorMsg: 'Error occurred',
              handlerName: 'testHandler',
            }),
          );
          done();
        },
      });
    });

    it('should handle non-standard response (file download)', (done) => {
      const context = createMockContext();
      const callHandler = createMockCallHandler(Buffer.from('file content'));

      interceptor.intercept(context, callHandler).subscribe({
        next: (result) => {
          expect(operlogServiceMock.logAction).toHaveBeenCalledWith(
            expect.objectContaining({
              resultData: { code: 200 },
            }),
          );
          done();
        },
      });
    });

    it('should handle null response', (done) => {
      const context = createMockContext();
      const callHandler = createMockCallHandler(null);

      interceptor.intercept(context, callHandler).subscribe({
        next: () => {
          expect(operlogServiceMock.logAction).toHaveBeenCalledWith(
            expect.objectContaining({
              resultData: { code: 200 },
            }),
          );
          done();
        },
      });
    });

    it('should log error when exception is thrown', (done) => {
      const context = createMockContext();
      const error = { response: 'Internal error' };
      const callHandler = createErrorCallHandler(error);

      interceptor.intercept(context, callHandler).subscribe({
        error: (err) => {
          expect(err).toBe(error);
          expect(operlogServiceMock.logAction).toHaveBeenCalledWith(
            expect.objectContaining({
              errorMsg: 'Internal error',
              handlerName: 'testHandler',
            }),
          );
          done();
        },
      });
    });

    it('should calculate cost time correctly', (done) => {
      const context = createMockContext();
      const callHandler = createMockCallHandler({ code: 200 });

      interceptor.intercept(context, callHandler).subscribe({
        next: () => {
          expect(operlogServiceMock.logAction).toHaveBeenCalledWith(
            expect.objectContaining({
              costTime: expect.any(Number),
            }),
          );
          done();
        },
      });
    });
  });
});
