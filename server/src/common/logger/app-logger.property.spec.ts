import { Test, TestingModule } from '@nestjs/testing';
import { AppLogger } from './app-logger.service';
import { PinoLogger } from 'nestjs-pino';
import { ClsService } from 'nestjs-cls';
import * as fc from 'fast-check';

/**
 * Property-Based Tests for AppLogger
 *
 * Feature: type-safety-refactor
 * These tests validate universal properties that should hold for all inputs
 */
describe('AppLogger - Property-Based Tests', () => {
  let module: TestingModule;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      providers: [
        AppLogger,
        {
          provide: PinoLogger,
          useValue: {
            info: jest.fn(),
            error: jest.fn(),
            warn: jest.fn(),
            debug: jest.fn(),
            trace: jest.fn(),
            setContext: jest.fn(),
          },
        },
        {
          provide: ClsService,
          useValue: {
            get: jest.fn(),
          },
        },
      ],
    }).compile();
  });

  afterEach(async () => {
    await module.close();
  });

  /**
   * Property 3: 日志输出包含上下文信息
   * Feature: type-safety-refactor, Property 3
   * Validates: Requirements 2.3
   *
   * For any log message and context information (tenantId, userId),
   * the logger output should include these context fields when available in CLS
   */
  describe('Property 3: 日志输出包含上下文信息', () => {
    it('should include tenantId and userId in log output when available in CLS', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 1, maxLength: 100 }), // message
          fc.oneof(
            fc.string({ minLength: 1, maxLength: 50 }), // tenantId as string
            fc.integer({ min: 1, max: 999999 }), // tenantId as number
            fc.constant(undefined), // no tenantId
          ),
          fc.oneof(
            fc.integer({ min: 1, max: 999999 }), // userId as number
            fc.constant(undefined), // no userId
          ),
          fc.option(fc.string({ minLength: 1, maxLength: 50 }), { nil: undefined }), // context
          async (message, tenantId, userId, context) => {
            // Arrange: Create a fresh logger instance for each test
            const appLogger = await module.resolve<AppLogger>(AppLogger);
            const pinoLogger = module.get<PinoLogger>(PinoLogger);
            const clsService = module.get<ClsService>(ClsService);

            // Mock CLS to return the generated values
            jest.spyOn(clsService, 'get').mockImplementation((key?: string | symbol) => {
              if (key === 'tenantId') return tenantId;
              if (key === 'userId') return userId;
              return undefined;
            });

            // Clear previous calls
            jest.clearAllMocks();

            // Act: Call the log method
            appLogger.log(message, context);

            // Assert: Verify the output includes context information
            expect(pinoLogger.info).toHaveBeenCalledTimes(1);
            const callArgs = (pinoLogger.info as jest.Mock).mock.calls[0][0];

            // The output should always include tenantId and userId fields
            expect(callArgs).toHaveProperty('tenantId');
            expect(callArgs).toHaveProperty('userId');
            expect(callArgs).toHaveProperty('message', message);
            expect(callArgs).toHaveProperty('context', context);

            // If tenantId was provided in CLS, it should be in the output
            if (tenantId !== undefined) {
              expect(callArgs.tenantId).toBe(tenantId);
            } else {
              expect(callArgs.tenantId).toBeUndefined();
            }

            // If userId was provided in CLS, it should be in the output
            if (userId !== undefined) {
              expect(callArgs.userId).toBe(userId);
            } else {
              expect(callArgs.userId).toBeUndefined();
            }
          },
        ),
        { numRuns: 20 },
      );
    });

    it('should include context information for all log levels', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 1, maxLength: 100 }), // message
          fc.constantFrom('log', 'warn', 'debug', 'verbose'), // log level
          fc.string({ minLength: 1, maxLength: 50 }), // tenantId
          fc.integer({ min: 1, max: 999999 }), // userId
          async (message, logLevel, tenantId, userId) => {
            // Arrange
            const appLogger = await module.resolve<AppLogger>(AppLogger);
            const pinoLogger = module.get<PinoLogger>(PinoLogger);
            const clsService = module.get<ClsService>(ClsService);

            jest.spyOn(clsService, 'get').mockImplementation((key?: string | symbol) => {
              if (key === 'tenantId') return tenantId;
              if (key === 'userId') return userId;
              return undefined;
            });

            jest.clearAllMocks();

            // Act: Call the appropriate log method
            switch (logLevel) {
              case 'log':
                appLogger.log(message);
                break;
              case 'warn':
                appLogger.warn(message);
                break;
              case 'debug':
                appLogger.debug(message);
                break;
              case 'verbose':
                appLogger.verbose(message);
                break;
            }

            // Assert: Verify context is included regardless of log level
            const pinoMethod =
              logLevel === 'log' ? pinoLogger.info : logLevel === 'verbose' ? pinoLogger.trace : pinoLogger[logLevel];

            expect(pinoMethod).toHaveBeenCalledTimes(1);
            const callArgs = (pinoMethod as jest.Mock).mock.calls[0][0];

            expect(callArgs.tenantId).toBe(tenantId);
            expect(callArgs.userId).toBe(userId);
            expect(callArgs.message).toBe(message);
          },
        ),
        { numRuns: 20 },
      );
    });
  });

  /**
   * Property 4: Error 级别日志包含堆栈信息
   * Feature: type-safety-refactor, Property 4
   * Validates: Requirements 2.5
   *
   * For any error log with a trace parameter,
   * the logger output should include the trace field
   */
  describe('Property 4: Error 级别日志包含堆栈信息', () => {
    it('should include trace in error log output when provided', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 1, maxLength: 100 }), // error message
          fc.string({ minLength: 10, maxLength: 500 }), // stack trace
          fc.option(fc.string({ minLength: 1, maxLength: 50 }), { nil: undefined }), // context
          fc.oneof(
            fc.string({ minLength: 1, maxLength: 50 }),
            fc.integer({ min: 1, max: 999999 }),
            fc.constant(undefined),
          ), // tenantId
          fc.oneof(fc.integer({ min: 1, max: 999999 }), fc.constant(undefined)), // userId
          async (message, trace, context, tenantId, userId) => {
            // Arrange
            const appLogger = await module.resolve<AppLogger>(AppLogger);
            const pinoLogger = module.get<PinoLogger>(PinoLogger);
            const clsService = module.get<ClsService>(ClsService);

            jest.spyOn(clsService, 'get').mockImplementation((key?: string | symbol) => {
              if (key === 'tenantId') return tenantId;
              if (key === 'userId') return userId;
              return undefined;
            });

            jest.clearAllMocks();

            // Act: Call error method with trace
            appLogger.error(message, trace, context);

            // Assert: Verify trace is included in the output
            expect(pinoLogger.error).toHaveBeenCalledTimes(1);
            const callArgs = (pinoLogger.error as jest.Mock).mock.calls[0][0];

            expect(callArgs).toHaveProperty('message', message);
            expect(callArgs).toHaveProperty('trace', trace);
            expect(callArgs).toHaveProperty('context', context);

            // Context information should also be present
            expect(callArgs).toHaveProperty('tenantId');
            expect(callArgs).toHaveProperty('userId');

            if (tenantId !== undefined) {
              expect(callArgs.tenantId).toBe(tenantId);
            }
            if (userId !== undefined) {
              expect(callArgs.userId).toBe(userId);
            }
          },
        ),
        { numRuns: 20 },
      );
    });

    it('should handle error logs without trace gracefully', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 1, maxLength: 100 }), // error message
          fc.string({ minLength: 1, maxLength: 50 }), // tenantId
          fc.integer({ min: 1, max: 999999 }), // userId
          async (message, tenantId, userId) => {
            // Arrange
            const appLogger = await module.resolve<AppLogger>(AppLogger);
            const pinoLogger = module.get<PinoLogger>(PinoLogger);
            const clsService = module.get<ClsService>(ClsService);

            jest.spyOn(clsService, 'get').mockImplementation((key?: string | symbol) => {
              if (key === 'tenantId') return tenantId;
              if (key === 'userId') return userId;
              return undefined;
            });

            jest.clearAllMocks();

            // Act: Call error method without trace
            appLogger.error(message);

            // Assert: Verify it still works and includes context
            expect(pinoLogger.error).toHaveBeenCalledTimes(1);
            const callArgs = (pinoLogger.error as jest.Mock).mock.calls[0][0];

            expect(callArgs.message).toBe(message);
            expect(callArgs.trace).toBeUndefined();
            expect(callArgs.tenantId).toBe(tenantId);
            expect(callArgs.userId).toBe(userId);
          },
        ),
        { numRuns: 20 },
      );
    });

    it('should always include trace field when provided, regardless of content', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 1, maxLength: 100 }), // error message
          fc.oneof(
            fc.string({ minLength: 1, maxLength: 500 }), // normal trace
            fc.constant(''), // empty trace
            fc.string().filter((s) => s.includes('\n')), // multiline trace
            fc.string().filter((s) => /[^\x20-\x7E]/.test(s)), // trace with special chars
          ),
          async (message, trace) => {
            // Arrange
            const appLogger = await module.resolve<AppLogger>(AppLogger);
            const pinoLogger = module.get<PinoLogger>(PinoLogger);
            const clsService = module.get<ClsService>(ClsService);

            jest.spyOn(clsService, 'get').mockReturnValue(undefined);
            jest.clearAllMocks();

            // Act
            appLogger.error(message, trace);

            // Assert: trace should be present in output
            expect(pinoLogger.error).toHaveBeenCalledTimes(1);
            const callArgs = (pinoLogger.error as jest.Mock).mock.calls[0][0];

            expect(callArgs).toHaveProperty('trace', trace);
            expect(callArgs.message).toBe(message);
          },
        ),
        { numRuns: 20 },
      );
    });
  });
});
