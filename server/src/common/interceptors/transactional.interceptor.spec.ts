import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, CallHandler } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { of, throwError } from 'rxjs';
import { TransactionalInterceptor } from './transactional.interceptor';
import { PrismaService } from '../../prisma/prisma.service';
import {
  TRANSACTIONAL_KEY,
  IsolationLevel,
  Propagation,
} from '../decorators/transactional.decorator';

describe('TransactionalInterceptor', () => {
  let interceptor: TransactionalInterceptor;
  let reflector: Reflector;
  let prismaService: PrismaService;

  const mockPrismaService = {
    $transaction: jest.fn(),
  };

  const createMockContext = (): ExecutionContext => {
    return {
      switchToHttp: () => ({
        getRequest: () => ({}),
      }),
      getHandler: () => ({}),
      getClass: () => ({}),
    } as ExecutionContext;
  };

  const createMockCallHandler = (result: any = { success: true }): CallHandler => ({
    handle: () => of(result),
  });

  const createErrorCallHandler = (error: Error): CallHandler => ({
    handle: () => throwError(() => error),
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TransactionalInterceptor,
        {
          provide: Reflector,
          useValue: {
            get: jest.fn(),
          },
        },
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    interceptor = module.get<TransactionalInterceptor>(TransactionalInterceptor);
    reflector = module.get<Reflector>(Reflector);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('intercept', () => {
    it('should pass through when no @Transactional decorator is set', (done) => {
      jest.spyOn(reflector, 'get').mockReturnValue(undefined);
      const context = createMockContext();
      const next = createMockCallHandler();

      interceptor.intercept(context, next).subscribe({
        next: (result) => {
          expect(result).toEqual({ success: true });
          expect(mockPrismaService.$transaction).not.toHaveBeenCalled();
          done();
        },
      });
    });

    it('should pass through when readOnly is true', (done) => {
      jest.spyOn(reflector, 'get').mockReturnValue({
        readOnly: true,
        propagation: Propagation.REQUIRED,
        isolationLevel: IsolationLevel.ReadCommitted,
      });
      const context = createMockContext();
      const next = createMockCallHandler();

      interceptor.intercept(context, next).subscribe({
        next: (result) => {
          expect(result).toEqual({ success: true });
          expect(mockPrismaService.$transaction).not.toHaveBeenCalled();
          done();
        },
      });
    });

    it('should pass through when propagation is NOT_SUPPORTED', (done) => {
      jest.spyOn(reflector, 'get').mockReturnValue({
        propagation: Propagation.NOT_SUPPORTED,
        isolationLevel: IsolationLevel.ReadCommitted,
      });
      const context = createMockContext();
      const next = createMockCallHandler();

      interceptor.intercept(context, next).subscribe({
        next: (result) => {
          expect(result).toEqual({ success: true });
          expect(mockPrismaService.$transaction).not.toHaveBeenCalled();
          done();
        },
      });
    });

    it('should pass through when propagation is NEVER', (done) => {
      jest.spyOn(reflector, 'get').mockReturnValue({
        propagation: Propagation.NEVER,
        isolationLevel: IsolationLevel.ReadCommitted,
      });
      const context = createMockContext();
      const next = createMockCallHandler();

      interceptor.intercept(context, next).subscribe({
        next: (result) => {
          expect(result).toEqual({ success: true });
          expect(mockPrismaService.$transaction).not.toHaveBeenCalled();
          done();
        },
      });
    });

    it('should pass through when propagation is SUPPORTS', (done) => {
      jest.spyOn(reflector, 'get').mockReturnValue({
        propagation: Propagation.SUPPORTS,
        isolationLevel: IsolationLevel.ReadCommitted,
      });
      const context = createMockContext();
      const next = createMockCallHandler();

      interceptor.intercept(context, next).subscribe({
        next: (result) => {
          expect(result).toEqual({ success: true });
          expect(mockPrismaService.$transaction).not.toHaveBeenCalled();
          done();
        },
      });
    });

    it('should wrap in transaction when propagation is REQUIRED', (done) => {
      jest.spyOn(reflector, 'get').mockReturnValue({
        propagation: Propagation.REQUIRED,
        isolationLevel: IsolationLevel.ReadCommitted,
        timeout: 5000,
      });
      mockPrismaService.$transaction.mockImplementation(async (fn) => {
        return { transactionResult: true };
      });

      const context = createMockContext();
      const next = createMockCallHandler({ data: 'test' });

      interceptor.intercept(context, next).subscribe({
        next: (result) => {
          expect(mockPrismaService.$transaction).toHaveBeenCalled();
          done();
        },
      });
    });

    it('should wrap in transaction when propagation is REQUIRES_NEW', (done) => {
      jest.spyOn(reflector, 'get').mockReturnValue({
        propagation: Propagation.REQUIRES_NEW,
        isolationLevel: IsolationLevel.Serializable,
        timeout: 10000,
      });
      mockPrismaService.$transaction.mockImplementation(async (fn) => {
        return { transactionResult: true };
      });

      const context = createMockContext();
      const next = createMockCallHandler();

      interceptor.intercept(context, next).subscribe({
        next: () => {
          expect(mockPrismaService.$transaction).toHaveBeenCalled();
          done();
        },
      });
    });

    it('should use correct isolation level', (done) => {
      jest.spyOn(reflector, 'get').mockReturnValue({
        propagation: Propagation.REQUIRED,
        isolationLevel: IsolationLevel.Serializable,
      });
      mockPrismaService.$transaction.mockImplementation(async (fn, options) => {
        expect(options.isolationLevel).toBe('Serializable');
        return { success: true };
      });

      const context = createMockContext();
      const next = createMockCallHandler();

      interceptor.intercept(context, next).subscribe({
        next: () => {
          done();
        },
      });
    });

    it('should use timeout from options', (done) => {
      jest.spyOn(reflector, 'get').mockReturnValue({
        propagation: Propagation.REQUIRED,
        isolationLevel: IsolationLevel.ReadCommitted,
        timeout: 15000,
      });
      mockPrismaService.$transaction.mockImplementation(async (fn, options) => {
        expect(options.timeout).toBe(15000);
        return { success: true };
      });

      const context = createMockContext();
      const next = createMockCallHandler();

      interceptor.intercept(context, next).subscribe({
        next: () => {
          done();
        },
      });
    });
  });

  describe('shouldRollback', () => {
    it('should rollback by default on any error', () => {
      const options = {
        propagation: Propagation.REQUIRED,
        isolationLevel: IsolationLevel.ReadCommitted,
        rollbackFor: [],
        noRollbackFor: [],
      };
      const error = new Error('Test error');

      // Access private method through any cast
      const result = (interceptor as any).shouldRollback(error, options);

      expect(result).toBe(true);
    });

    it('should not rollback when error is in noRollbackFor list', () => {
      class CustomError extends Error {}
      const options = {
        propagation: Propagation.REQUIRED,
        isolationLevel: IsolationLevel.ReadCommitted,
        rollbackFor: [],
        noRollbackFor: [CustomError],
      };
      const error = new CustomError('Custom error');

      const result = (interceptor as any).shouldRollback(error, options);

      expect(result).toBe(false);
    });

    it('should rollback when error is in rollbackFor list', () => {
      class CustomError extends Error {}
      const options = {
        propagation: Propagation.REQUIRED,
        isolationLevel: IsolationLevel.ReadCommitted,
        rollbackFor: [CustomError],
        noRollbackFor: [],
      };
      const error = new CustomError('Custom error');

      const result = (interceptor as any).shouldRollback(error, options);

      expect(result).toBe(true);
    });

    it('should not rollback when error is not in rollbackFor list', () => {
      class CustomError extends Error {}
      class OtherError extends Error {}
      const options = {
        propagation: Propagation.REQUIRED,
        isolationLevel: IsolationLevel.ReadCommitted,
        rollbackFor: [CustomError],
        noRollbackFor: [],
      };
      const error = new OtherError('Other error');

      const result = (interceptor as any).shouldRollback(error, options);

      expect(result).toBe(false);
    });
  });
});
