import { Test, TestingModule } from '@nestjs/testing';
import { AppLogger } from './app-logger.service';
import { PinoLogger } from 'nestjs-pino';
import { ClsService } from 'nestjs-cls';

describe('AppLogger', () => {
  let logger: AppLogger;
  let pinoLogger: jest.Mocked<PinoLogger>;
  let clsService: jest.Mocked<ClsService>;

  const mockPinoLogger = {
    setContext: jest.fn(),
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
    trace: jest.fn(),
  };

  const mockClsService = {
    get: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AppLogger,
        {
          provide: PinoLogger,
          useValue: mockPinoLogger,
        },
        {
          provide: ClsService,
          useValue: mockClsService,
        },
      ],
    }).compile();

    logger = await module.resolve<AppLogger>(AppLogger);
    pinoLogger = module.get(PinoLogger);
    clsService = module.get(ClsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('setContext', () => {
    it('should set context on pino logger', () => {
      logger.setContext('TestService');

      expect(mockPinoLogger.setContext).toHaveBeenCalledWith('TestService');
    });
  });

  describe('log', () => {
    it('should log info message with context info', () => {
      mockClsService.get.mockImplementation((key: string) => {
        if (key === 'tenantId') return 1;
        if (key === 'userId') return 100;
        return undefined;
      });

      logger.log('Test message', 'TestContext');

      expect(mockPinoLogger.info).toHaveBeenCalledWith({
        tenantId: 1,
        userId: 100,
        message: 'Test message',
        context: 'TestContext',
      });
    });

    it('should log without context', () => {
      mockClsService.get.mockReturnValue(undefined);

      logger.log('Test message');

      expect(mockPinoLogger.info).toHaveBeenCalledWith({
        tenantId: undefined,
        userId: undefined,
        message: 'Test message',
        context: undefined,
      });
    });

    it('should extract userId from user object', () => {
      mockClsService.get.mockImplementation((key: string) => {
        if (key === 'user') return { userId: 200 };
        return undefined;
      });

      logger.log('Test message');

      expect(mockPinoLogger.info).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 200,
        })
      );
    });

    it('should extract userId from nested user object', () => {
      mockClsService.get.mockImplementation((key: string) => {
        if (key === 'user') return { user: { userId: 300 } };
        return undefined;
      });

      logger.log('Test message');

      expect(mockPinoLogger.info).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 300,
        })
      );
    });
  });

  describe('error', () => {
    it('should log error message with trace', () => {
      mockClsService.get.mockImplementation((key: string) => {
        if (key === 'tenantId') return 1;
        return undefined;
      });

      logger.error('Error occurred', 'Error stack trace', 'ErrorContext');

      expect(mockPinoLogger.error).toHaveBeenCalledWith({
        tenantId: 1,
        userId: undefined,
        message: 'Error occurred',
        trace: 'Error stack trace',
        context: 'ErrorContext',
      });
    });

    it('should log error without trace', () => {
      mockClsService.get.mockReturnValue(undefined);

      logger.error('Error occurred');

      expect(mockPinoLogger.error).toHaveBeenCalledWith({
        tenantId: undefined,
        userId: undefined,
        message: 'Error occurred',
        trace: undefined,
        context: undefined,
      });
    });
  });

  describe('warn', () => {
    it('should log warning message', () => {
      mockClsService.get.mockImplementation((key: string) => {
        if (key === 'tenantId') return 2;
        if (key === 'userId') return 50;
        return undefined;
      });

      logger.warn('Warning message', 'WarnContext');

      expect(mockPinoLogger.warn).toHaveBeenCalledWith({
        tenantId: 2,
        userId: 50,
        message: 'Warning message',
        context: 'WarnContext',
      });
    });

    it('should log warning without context', () => {
      mockClsService.get.mockReturnValue(undefined);

      logger.warn('Warning message');

      expect(mockPinoLogger.warn).toHaveBeenCalledWith({
        tenantId: undefined,
        userId: undefined,
        message: 'Warning message',
        context: undefined,
      });
    });
  });

  describe('debug', () => {
    it('should log debug message', () => {
      mockClsService.get.mockReturnValue(undefined);

      logger.debug('Debug message', 'DebugContext');

      expect(mockPinoLogger.debug).toHaveBeenCalledWith({
        tenantId: undefined,
        userId: undefined,
        message: 'Debug message',
        context: 'DebugContext',
      });
    });
  });

  describe('verbose', () => {
    it('should log verbose message using trace', () => {
      mockClsService.get.mockReturnValue(undefined);

      logger.verbose('Verbose message', 'VerboseContext');

      expect(mockPinoLogger.trace).toHaveBeenCalledWith({
        tenantId: undefined,
        userId: undefined,
        message: 'Verbose message',
        context: 'VerboseContext',
      });
    });
  });

  describe('context info extraction', () => {
    it('should prioritize direct userId over user object', () => {
      mockClsService.get.mockImplementation((key: string) => {
        if (key === 'userId') return 100;
        if (key === 'user') return { userId: 200 };
        return undefined;
      });

      logger.log('Test');

      expect(mockPinoLogger.info).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 100,
        })
      );
    });

    it('should handle missing context gracefully', () => {
      mockClsService.get.mockReturnValue(undefined);

      logger.log('Test');

      expect(mockPinoLogger.info).toHaveBeenCalledWith({
        tenantId: undefined,
        userId: undefined,
        message: 'Test',
        context: undefined,
      });
    });
  });
});
