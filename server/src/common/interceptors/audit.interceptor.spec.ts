import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, CallHandler } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { of, throwError } from 'rxjs';
import { AuditInterceptor } from './audit.interceptor';
import { AuditService } from '../audit/audit.service';
import { ClsService } from 'nestjs-cls';
import { AUDIT_KEY, AuditConfig, AuditAction } from '../decorators/audit.decorator';

describe('AuditInterceptor', () => {
  let interceptor: AuditInterceptor;
  let mockReflector: jest.Mocked<Reflector>;
  let mockAuditService: jest.Mocked<AuditService>;
  let mockClsService: jest.Mocked<ClsService>;

  const createMockExecutionContext = (
    request: any = {},
    handler: any = jest.fn(),
  ): ExecutionContext => {
    return {
      switchToHttp: () => ({
        getRequest: () => ({
          ip: '127.0.0.1',
          headers: { 'user-agent': 'test-agent' },
          params: {},
          body: {},
          ...request,
        }),
        getResponse: () => ({}),
      }),
      getHandler: () => handler,
      getClass: () => class {},
      getArgs: () => [],
      getArgByIndex: () => ({}),
      switchToRpc: () => ({} as any),
      switchToWs: () => ({} as any),
      getType: () => 'http' as any,
    } as unknown as ExecutionContext;
  };

  const createMockCallHandler = (response: any = { code: 200 }): CallHandler => ({
    handle: () => of(response),
  });

  const createErrorCallHandler = (error: Error): CallHandler => ({
    handle: () => throwError(() => error),
  });

  beforeEach(async () => {
    mockReflector = {
      get: jest.fn(),
    } as unknown as jest.Mocked<Reflector>;

    mockAuditService = {
      log: jest.fn().mockResolvedValue(undefined),
    } as unknown as jest.Mocked<AuditService>;

    mockClsService = {
      get: jest.fn(),
      set: jest.fn(),
    } as unknown as jest.Mocked<ClsService>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuditInterceptor,
        { provide: Reflector, useValue: mockReflector },
        { provide: AuditService, useValue: mockAuditService },
        { provide: ClsService, useValue: mockClsService },
      ],
    }).compile();

    interceptor = module.get<AuditInterceptor>(AuditInterceptor);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('intercept', () => {
    it('should pass through when no audit config', (done) => {
      mockReflector.get.mockReturnValue(undefined);

      const context = createMockExecutionContext();
      const handler = createMockCallHandler({ data: 'test' });

      interceptor.intercept(context, handler).subscribe({
        next: (result) => {
          expect(result).toEqual({ data: 'test' });
          expect(mockAuditService.log).not.toHaveBeenCalled();
          done();
        },
      });
    });

    it('should log audit on successful operation', (done) => {
      const auditConfig: AuditConfig = {
        action: AuditAction.CREATE,
        module: 'system',
        targetType: 'User',
        recordNewValue: true,
        recordOldValue: false,
      };
      mockReflector.get.mockReturnValue(auditConfig);

      const context = createMockExecutionContext({
        body: { name: 'test' },
        params: { id: '123' },
      });
      const handler = createMockCallHandler({ code: 200 });

      interceptor.intercept(context, handler).subscribe({
        next: () => {
          expect(mockAuditService.log).toHaveBeenCalledWith(
            expect.objectContaining({
              action: AuditAction.CREATE,
              module: 'system',
              targetType: 'User',
              status: '0',
            }),
          );
          done();
        },
      });
    });

    it('should log audit on failed operation', (done) => {
      const auditConfig: AuditConfig = {
        action: AuditAction.DELETE,
        module: 'system',
        targetType: 'User',
        recordNewValue: false,
        recordOldValue: false,
      };
      mockReflector.get.mockReturnValue(auditConfig);

      const context = createMockExecutionContext({ params: { id: '123' } });
      const handler = createErrorCallHandler(new Error('Delete failed'));

      interceptor.intercept(context, handler).subscribe({
        error: (err) => {
          expect(err.message).toBe('Delete failed');
          expect(mockAuditService.log).toHaveBeenCalledWith(
            expect.objectContaining({
              action: AuditAction.DELETE,
              module: 'system',
              status: '1',
              errorMsg: 'Delete failed',
            }),
          );
          done();
        },
      });
    });

    it('should extract target ID from params', (done) => {
      const auditConfig: AuditConfig = {
        action: AuditAction.UPDATE,
        module: 'system',
        targetType: 'User',
        targetIdParam: 'userId',
        recordNewValue: false,
        recordOldValue: false,
      };
      mockReflector.get.mockReturnValue(auditConfig);

      const context = createMockExecutionContext({
        params: { userId: '456' },
      });
      const handler = createMockCallHandler();

      interceptor.intercept(context, handler).subscribe({
        next: () => {
          expect(mockAuditService.log).toHaveBeenCalledWith(
            expect.objectContaining({
              targetId: '456',
            }),
          );
          done();
        },
      });
    });

    it('should extract target ID from body', (done) => {
      const auditConfig: AuditConfig = {
        action: AuditAction.CREATE,
        module: 'system',
        targetType: 'User',
        targetIdBody: 'id',
        recordNewValue: false,
        recordOldValue: false,
      };
      mockReflector.get.mockReturnValue(auditConfig);

      const context = createMockExecutionContext({
        body: { id: 789, name: 'test' },
      });
      const handler = createMockCallHandler();

      interceptor.intercept(context, handler).subscribe({
        next: () => {
          expect(mockAuditService.log).toHaveBeenCalledWith(
            expect.objectContaining({
              targetId: '789',
            }),
          );
          done();
        },
      });
    });

    it('should sanitize sensitive fields in request body', (done) => {
      const auditConfig: AuditConfig = {
        action: AuditAction.CREATE,
        module: 'auth',
        targetType: 'User',
        recordNewValue: true,
        recordOldValue: false,
      };
      mockReflector.get.mockReturnValue(auditConfig);

      const context = createMockExecutionContext({
        body: { username: 'test', password: 'secret123' },
      });
      const handler = createMockCallHandler();

      interceptor.intercept(context, handler).subscribe({
        next: () => {
          const logCall = mockAuditService.log.mock.calls[0][0];
          expect(logCall.newValue).toContain('******');
          expect(logCall.newValue).not.toContain('secret123');
          done();
        },
      });
    });

    it('should get client IP from x-forwarded-for header', (done) => {
      const auditConfig: AuditConfig = {
        action: AuditAction.LOGIN,
        module: 'auth',
        recordNewValue: false,
        recordOldValue: false,
      };
      mockReflector.get.mockReturnValue(auditConfig);

      const context = createMockExecutionContext({
        headers: {
          'x-forwarded-for': '10.0.0.1, 192.168.1.1',
          'user-agent': 'test',
        },
      });
      const handler = createMockCallHandler();

      interceptor.intercept(context, handler).subscribe({
        next: () => {
          expect(mockClsService.set).toHaveBeenCalledWith(
            'request',
            expect.objectContaining({
              ip: '10.0.0.1',
            }),
          );
          done();
        },
      });
    });

    it('should record old value when configured', (done) => {
      const auditConfig: AuditConfig = {
        action: AuditAction.UPDATE,
        module: 'system',
        targetType: 'User',
        recordOldValue: true,
        recordNewValue: false,
      };
      mockReflector.get.mockReturnValue(auditConfig);
      mockClsService.get.mockImplementation((key) => {
        if (key === 'auditOldValue') return '{"id":1,"name":"old"}';
        return undefined;
      });

      const context = createMockExecutionContext();
      const handler = createMockCallHandler();

      interceptor.intercept(context, handler).subscribe({
        next: () => {
          expect(mockAuditService.log).toHaveBeenCalledWith(
            expect.objectContaining({
              oldValue: '{"id":1,"name":"old"}',
            }),
          );
          done();
        },
      });
    });
  });
});
