import { Test, TestingModule } from '@nestjs/testing';
import { AppLogger } from './app-logger.service';
import { PinoLogger } from 'nestjs-pino';
import { ClsService } from 'nestjs-cls';

describe('AppLogger', () => {
  let appLogger: AppLogger;
  let pinoLogger: PinoLogger;
  let clsService: ClsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
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

    // Use resolve() for transient-scoped providers
    appLogger = await module.resolve<AppLogger>(AppLogger);
    pinoLogger = module.get<PinoLogger>(PinoLogger);
    clsService = module.get<ClsService>(ClsService);
  });

  it('should be defined', () => {
    expect(appLogger).toBeDefined();
  });

  describe('log', () => {
    it('should call pinoLogger.info with context information', () => {
      const tenantId = 'tenant-123';
      const userId = 456;
      jest.spyOn(clsService, 'get').mockImplementation((key?: string | symbol) => {
        if (key === 'tenantId') return tenantId;
        if (key === 'userId') return userId;
        return undefined;
      });

      appLogger.log('Test message', 'TestContext');

      expect(pinoLogger.info).toHaveBeenCalledWith({
        tenantId,
        userId,
        message: 'Test message',
        context: 'TestContext',
      });
    });

    it('should work without context information', () => {
      jest.spyOn(clsService, 'get').mockReturnValue(undefined);

      appLogger.log('Test message');

      expect(pinoLogger.info).toHaveBeenCalledWith({
        tenantId: undefined,
        userId: undefined,
        message: 'Test message',
        context: undefined,
      });
    });
  });

  describe('error', () => {
    it('should call pinoLogger.error with trace and context information', () => {
      const tenantId = 'tenant-123';
      const userId = 456;
      jest.spyOn(clsService, 'get').mockImplementation((key?: string | symbol) => {
        if (key === 'tenantId') return tenantId;
        if (key === 'userId') return userId;
        return undefined;
      });

      const trace = 'Error stack trace';
      appLogger.error('Error message', trace, 'ErrorContext');

      expect(pinoLogger.error).toHaveBeenCalledWith({
        tenantId,
        userId,
        message: 'Error message',
        trace,
        context: 'ErrorContext',
      });
    });
  });

  describe('warn', () => {
    it('should call pinoLogger.warn with context information', () => {
      const tenantId = 'tenant-123';
      jest.spyOn(clsService, 'get').mockImplementation((key?: string | symbol) => {
        if (key === 'tenantId') return tenantId;
        return undefined;
      });

      appLogger.warn('Warning message', 'WarnContext');

      expect(pinoLogger.warn).toHaveBeenCalledWith({
        tenantId,
        userId: undefined,
        message: 'Warning message',
        context: 'WarnContext',
      });
    });
  });

  describe('debug', () => {
    it('should call pinoLogger.debug with context information', () => {
      const userId = 789;
      jest.spyOn(clsService, 'get').mockImplementation((key?: string | symbol) => {
        if (key === 'userId') return userId;
        return undefined;
      });

      appLogger.debug('Debug message', 'DebugContext');

      expect(pinoLogger.debug).toHaveBeenCalledWith({
        tenantId: undefined,
        userId,
        message: 'Debug message',
        context: 'DebugContext',
      });
    });
  });

  describe('verbose', () => {
    it('should call pinoLogger.trace with context information', () => {
      const tenantId = 'tenant-123';
      const userId = 456;
      jest.spyOn(clsService, 'get').mockImplementation((key?: string | symbol) => {
        if (key === 'tenantId') return tenantId;
        if (key === 'userId') return userId;
        return undefined;
      });

      appLogger.verbose('Verbose message', 'VerboseContext');

      expect(pinoLogger.trace).toHaveBeenCalledWith({
        tenantId,
        userId,
        message: 'Verbose message',
        context: 'VerboseContext',
      });
    });
  });

  describe('setContext', () => {
    it('should call pinoLogger.setContext', () => {
      appLogger.setContext('NewContext');

      expect(pinoLogger.setContext).toHaveBeenCalledWith('NewContext');
    });
  });

  describe('context extraction from user object', () => {
    it('should extract userId from nested user object', () => {
      const user = {
        userId: 123,
        userName: 'testuser',
      };
      jest.spyOn(clsService, 'get').mockImplementation((key?: string | symbol) => {
        if (key === 'user') return user;
        return undefined;
      });

      appLogger.log('Test message');

      expect(pinoLogger.info).toHaveBeenCalledWith({
        tenantId: undefined,
        userId: 123,
        message: 'Test message',
        context: undefined,
      });
    });

    it('should extract userId from deeply nested user object', () => {
      const user = {
        user: {
          userId: 456,
          userName: 'testuser',
        },
      };
      jest.spyOn(clsService, 'get').mockImplementation((key?: string | symbol) => {
        if (key === 'user') return user;
        return undefined;
      });

      appLogger.log('Test message');

      expect(pinoLogger.info).toHaveBeenCalledWith({
        tenantId: undefined,
        userId: 456,
        message: 'Test message',
        context: undefined,
      });
    });
  });
});
