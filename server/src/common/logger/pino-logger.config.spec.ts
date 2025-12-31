import { createPinoConfig, getRequestId } from './pino-logger.config';
import { Request } from 'express';

describe('PinoLoggerConfig', () => {
  describe('getRequestId', () => {
    it('should return requestId from request object', () => {
      const req = {
        requestId: 'test-request-id-123',
        headers: {},
      } as unknown as Request;

      expect(getRequestId(req)).toBe('test-request-id-123');
    });

    it('should return id from request object if requestId is not set', () => {
      const req = {
        id: 'test-id-456',
        headers: {},
      } as unknown as Request;

      expect(getRequestId(req)).toBe('test-id-456');
    });

    it('should return x-request-id from headers if neither requestId nor id is set', () => {
      const req = {
        headers: {
          'x-request-id': 'header-request-id-789',
        },
      } as unknown as Request;

      expect(getRequestId(req)).toBe('header-request-id-789');
    });

    it('should return "unknown" if no request id is available', () => {
      const req = {
        headers: {},
      } as unknown as Request;

      expect(getRequestId(req)).toBe('unknown');
    });

    it('should prioritize requestId over id', () => {
      const req = {
        requestId: 'request-id-priority',
        id: 'id-fallback',
        headers: {
          'x-request-id': 'header-fallback',
        },
      } as unknown as Request;

      expect(getRequestId(req)).toBe('request-id-priority');
    });

    it('should prioritize id over header', () => {
      const req = {
        id: 'id-priority',
        headers: {
          'x-request-id': 'header-fallback',
        },
      } as unknown as Request;

      expect(getRequestId(req)).toBe('id-priority');
    });
  });

  describe('createPinoConfig', () => {
    const defaultParams = {
      logDir: './logs',
      level: 'info',
      prettyPrint: false,
      toFile: false,
      excludePaths: ['/health'],
      sensitiveFields: ['password', 'token'],
    };

    it('should create a valid pino config', () => {
      const config = createPinoConfig(
        defaultParams.logDir,
        defaultParams.level,
        defaultParams.prettyPrint,
        defaultParams.toFile,
        defaultParams.excludePaths,
        defaultParams.sensitiveFields,
      );

      expect(config).toBeDefined();
      expect(config.pinoHttp).toBeDefined();

      const pinoHttpConfig = config.pinoHttp as Record<string, any>;
      expect(pinoHttpConfig.level).toBe('info');
    });

    it('should include genReqId function for request ID generation', () => {
      const config = createPinoConfig(
        defaultParams.logDir,
        defaultParams.level,
        defaultParams.prettyPrint,
        defaultParams.toFile,
        defaultParams.excludePaths,
        defaultParams.sensitiveFields,
      );

      const pinoHttpConfig = config.pinoHttp as Record<string, any>;
      expect(pinoHttpConfig.genReqId).toBeDefined();
      expect(typeof pinoHttpConfig.genReqId).toBe('function');

      // Test genReqId function
      const mockReq = {
        requestId: 'gen-req-id-test',
        headers: {},
      } as unknown as Request;

      const genReqId = pinoHttpConfig.genReqId as (req: Request) => string;
      expect(genReqId(mockReq)).toBe('gen-req-id-test');
    });

    it('should include customProps function that returns requestId', () => {
      const config = createPinoConfig(
        defaultParams.logDir,
        defaultParams.level,
        defaultParams.prettyPrint,
        defaultParams.toFile,
        defaultParams.excludePaths,
        defaultParams.sensitiveFields,
      );

      const pinoHttpConfig = config.pinoHttp as Record<string, any>;
      expect(pinoHttpConfig.customProps).toBeDefined();
      expect(typeof pinoHttpConfig.customProps).toBe('function');

      // Test customProps function
      const mockReq = {
        requestId: 'custom-props-test-id',
        headers: {},
        ip: '127.0.0.1',
      } as unknown as Request;

      const mockRes = {} as any;

      const customProps = pinoHttpConfig.customProps as (req: Request, res: any) => Record<string, any>;
      const props = customProps(mockReq, mockRes);

      expect(props.requestId).toBe('custom-props-test-id');
      expect(props.ip).toBe('127.0.0.1');
    });

    it('should configure redact paths for sensitive fields', () => {
      const config = createPinoConfig(
        defaultParams.logDir,
        defaultParams.level,
        defaultParams.prettyPrint,
        defaultParams.toFile,
        defaultParams.excludePaths,
        defaultParams.sensitiveFields,
      );

      const pinoHttpConfig = config.pinoHttp as Record<string, any>;
      expect(pinoHttpConfig.redact).toBeDefined();
      expect(pinoHttpConfig.redact.paths).toContain('req.body.password');
      expect(pinoHttpConfig.redact.paths).toContain('req.body.token');
      // Now uses smart masking function instead of static string
      expect(typeof pinoHttpConfig.redact.censor).toBe('function');
    });

    it('should configure pretty print transport when enabled', () => {
      const config = createPinoConfig(
        defaultParams.logDir,
        defaultParams.level,
        true, // prettyPrint
        false,
        defaultParams.excludePaths,
        defaultParams.sensitiveFields,
      );

      const pinoHttpConfig = config.pinoHttp as Record<string, any>;
      expect(pinoHttpConfig.transport).toBeDefined();
      expect(pinoHttpConfig.transport.target).toBe('pino-pretty');
    });

    it('should configure auto logging exclusion', () => {
      const config = createPinoConfig(
        defaultParams.logDir,
        defaultParams.level,
        defaultParams.prettyPrint,
        defaultParams.toFile,
        defaultParams.excludePaths,
        defaultParams.sensitiveFields,
      );

      const pinoHttpConfig = config.pinoHttp as Record<string, any>;
      expect(pinoHttpConfig.autoLogging).toBeDefined();
      expect(pinoHttpConfig.autoLogging.ignore).toBeDefined();

      // Test ignore function
      const ignoreFunc = pinoHttpConfig.autoLogging.ignore as (req: any) => boolean;
      expect(ignoreFunc({ url: '/health' })).toBe(true);
      expect(ignoreFunc({ url: '/api/users' })).toBe(false);
    });
  });
});


describe('Smart Masking Functions', () => {
  const { smartMask, maskObjectDeep } = require('./pino-logger.config');

  describe('smartMask', () => {
    it('should mask phone numbers', () => {
      expect(smartMask('13812345678', 'phone')).toBe('138****5678');
      expect(smartMask('13812345678', 'phoneNumber')).toBe('138****5678');
      expect(smartMask('13812345678', 'mobile')).toBe('138****5678');
    });

    it('should mask email addresses', () => {
      expect(smartMask('test@example.com', 'email')).toBe('t**t@example.com');
      expect(smartMask('ab@example.com', 'mail')).toBe('**@example.com');
    });

    it('should mask ID cards', () => {
      expect(smartMask('110101199001011234', 'idCard')).toBe('110***********1234');
    });

    it('should mask passwords', () => {
      expect(smartMask('secretpassword', 'password')).toBe('******');
      expect(smartMask('mytoken123', 'token')).toBe('******');
    });

    it('should mask bank cards', () => {
      expect(smartMask('6222021234567890123', 'bankCard')).toBe('6222***********0123');
    });

    it('should auto-detect email format', () => {
      expect(smartMask('user@domain.com', 'unknownField')).toBe('u**r@domain.com');
    });

    it('should auto-detect phone format', () => {
      expect(smartMask('13912345678', 'unknownField')).toBe('139****5678');
    });

    it('should return original value for non-sensitive fields', () => {
      expect(smartMask('normalValue', 'name')).toBe('normalValue');
    });

    it('should handle null and undefined', () => {
      expect(smartMask(null, 'phone')).toBe(null);
      expect(smartMask(undefined, 'phone')).toBe(undefined);
    });
  });

  describe('maskObjectDeep', () => {
    it('should mask sensitive fields in object', () => {
      const obj = {
        phone: '13812345678',
        email: 'test@example.com',
        name: 'John',
      };
      const sensitiveFields = ['phone', 'email'];
      const masked = maskObjectDeep(obj, sensitiveFields);

      expect(masked.phone).toBe('138****5678');
      expect(masked.email).toBe('t**t@example.com');
      expect(masked.name).toBe('John');
    });

    it('should mask nested objects', () => {
      const obj = {
        user: {
          phone: '13812345678',
          profile: {
            email: 'test@example.com',
          },
        },
      };
      const sensitiveFields = ['phone', 'email'];
      const masked = maskObjectDeep(obj, sensitiveFields);

      expect(masked.user.phone).toBe('138****5678');
      expect(masked.user.profile.email).toBe('t**t@example.com');
    });

    it('should handle arrays', () => {
      const obj = {
        users: [{ phone: '13812345678' }, { phone: '13987654321' }],
      };
      const sensitiveFields = ['phone'];
      const masked = maskObjectDeep(obj, sensitiveFields);

      expect(masked.users[0].phone).toBe('138****5678');
      expect(masked.users[1].phone).toBe('139****4321');
    });

    it('should handle null and undefined', () => {
      expect(maskObjectDeep(null, ['phone'])).toBe(null);
      expect(maskObjectDeep(undefined, ['phone'])).toBe(undefined);
    });
  });
});
