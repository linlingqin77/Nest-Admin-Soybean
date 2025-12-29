import { createPinoConfig } from './pino-logger.config';
import * as fs from 'fs';

jest.mock('fs', () => ({
  existsSync: jest.fn(),
  mkdirSync: jest.fn(),
}));

describe('createPinoConfig', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('basic configuration', () => {
    it('should create config with pretty print only', () => {
      const config = createPinoConfig(
        'logs',
        'info',
        true,
        false,
        ['/health'],
        ['password', 'token']
      );

      expect(config).toBeDefined();
      expect(config.pinoHttp).toBeDefined();
      expect((config.pinoHttp as any).level).toBe('info');
    });

    it('should create config with file output only', () => {
      (fs.existsSync as jest.Mock).mockReturnValue(false);

      const config = createPinoConfig(
        'logs',
        'info',
        false,
        true,
        ['/health'],
        ['password']
      );

      expect(config).toBeDefined();
      expect(fs.mkdirSync).toHaveBeenCalled();
    });

    it('should create config with both pretty print and file output', () => {
      (fs.existsSync as jest.Mock).mockReturnValue(false);

      const config = createPinoConfig(
        'logs',
        'debug',
        true,
        true,
        ['/health', '/metrics'],
        ['password', 'secret']
      );

      expect(config).toBeDefined();
      expect(fs.mkdirSync).toHaveBeenCalled();
    });

    it('should not create directory if it exists', () => {
      (fs.existsSync as jest.Mock).mockReturnValue(true);

      const config = createPinoConfig(
        'logs',
        'info',
        false,
        true,
        [],
        []
      );

      expect(config).toBeDefined();
      expect(fs.mkdirSync).not.toHaveBeenCalled();
    });

    it('should create config without file output', () => {
      const config = createPinoConfig(
        'logs',
        'warn',
        false,
        false,
        [],
        []
      );

      expect(config).toBeDefined();
      expect((config.pinoHttp as any).level).toBe('warn');
    });
  });

  describe('redact configuration', () => {
    it('should configure redact paths for sensitive fields', () => {
      const config = createPinoConfig(
        'logs',
        'info',
        true,
        false,
        [],
        ['password', 'token', 'secret']
      );

      expect((config.pinoHttp as any).redact).toBeDefined();
      expect((config.pinoHttp as any).redact.paths).toContain('req.body.password');
      expect((config.pinoHttp as any).redact.paths).toContain('req.body.token');
      expect((config.pinoHttp as any).redact.paths).toContain('req.body.secret');
      expect((config.pinoHttp as any).redact.censor).toBe('***REDACTED***');
    });
  });

  describe('custom props', () => {
    it('should add custom props to request', () => {
      const config = createPinoConfig(
        'logs',
        'info',
        true,
        false,
        [],
        []
      );

      const mockReq = {
        id: 'req-123',
        headers: { 'user-agent': 'test-agent' },
        ip: '127.0.0.1',
        user: { userId: 1, userName: 'admin' },
      };
      const mockRes = {};

      const customProps = (config.pinoHttp as any).customProps(mockReq as any, mockRes as any);

      expect(customProps.requestId).toBe('req-123');
      expect(customProps.userAgent).toBe('test-agent');
      expect(customProps.ip).toBe('127.0.0.1');
    });

    it('should handle nested user object', () => {
      const config = createPinoConfig(
        'logs',
        'info',
        true,
        false,
        [],
        []
      );

      const mockReq = {
        id: 'req-123',
        headers: {},
        user: { user: { userId: 2, userName: 'test' } },
      };
      const mockRes = {};

      const customProps = (config.pinoHttp as any).customProps(mockReq as any, mockRes as any);

      expect(customProps.userId).toBe(2);
      expect(customProps.username).toBe('test');
    });

    it('should handle missing user', () => {
      const config = createPinoConfig(
        'logs',
        'info',
        true,
        false,
        [],
        []
      );

      const mockReq = {
        id: 'req-123',
        headers: {},
      };
      const mockRes = {};

      const customProps = (config.pinoHttp as any).customProps(mockReq as any, mockRes as any);

      expect(customProps.username).toBe('anonymous');
    });
  });

  describe('custom log level', () => {
    it('should return error for 5xx status', () => {
      const config = createPinoConfig('logs', 'info', true, false, [], []);

      const level = (config.pinoHttp as any).customLogLevel({} as any, { statusCode: 500 } as any, null);

      expect(level).toBe('error');
    });

    it('should return error when error exists', () => {
      const config = createPinoConfig('logs', 'info', true, false, [], []);

      const level = (config.pinoHttp as any).customLogLevel({} as any, { statusCode: 200 } as any, new Error('test'));

      expect(level).toBe('error');
    });

    it('should return warn for 4xx status', () => {
      const config = createPinoConfig('logs', 'info', true, false, [], []);

      const level = (config.pinoHttp as any).customLogLevel({} as any, { statusCode: 404 } as any, null);

      expect(level).toBe('warn');
    });

    it('should return info for 2xx status', () => {
      const config = createPinoConfig('logs', 'info', true, false, [], []);

      const level = (config.pinoHttp as any).customLogLevel({} as any, { statusCode: 200 } as any, null);

      expect(level).toBe('info');
    });
  });

  describe('custom messages', () => {
    it('should return resource not found for 404', () => {
      const config = createPinoConfig('logs', 'info', true, false, [], []);

      const message = (config.pinoHttp as any).customSuccessMessage(
        { method: 'GET', url: '/test' } as any,
        { statusCode: 404 } as any
      );

      expect(message).toBe('Resource not found');
    });

    it('should return completed message for success', () => {
      const config = createPinoConfig('logs', 'info', true, false, [], []);

      const message = (config.pinoHttp as any).customSuccessMessage(
        { method: 'GET', url: '/test' } as any,
        { statusCode: 200 } as any
      );

      expect(message).toBe('GET /test completed');
    });

    it('should return error message for failures', () => {
      const config = createPinoConfig('logs', 'info', true, false, [], []);

      const message = (config.pinoHttp as any).customErrorMessage(
        { method: 'POST', url: '/api/test' } as any,
        {} as any,
        new Error('Something went wrong')
      );

      expect(message).toBe('POST /api/test failed: Something went wrong');
    });
  });

  describe('auto logging', () => {
    it('should ignore excluded paths', () => {
      const config = createPinoConfig('logs', 'info', true, false, ['/health', '/metrics'], []);

      const shouldIgnore = (config.pinoHttp as any).autoLogging.ignore({ url: '/health' } as any);

      expect(shouldIgnore).toBe(true);
    });

    it('should not ignore non-excluded paths', () => {
      const config = createPinoConfig('logs', 'info', true, false, ['/health'], []);

      const shouldIgnore = (config.pinoHttp as any).autoLogging.ignore({ url: '/api/users' } as any);

      expect(shouldIgnore).toBe(false);
    });
  });

  describe('serializers', () => {
    it('should serialize request', () => {
      const config = createPinoConfig('logs', 'info', true, false, [], []);

      const mockReq = {
        id: 'req-123',
        method: 'POST',
        url: '/api/test',
        query: { page: '1' },
        params: { id: '123' },
        raw: { body: { data: 'test' } },
        headers: {
          host: 'localhost',
          'content-type': 'application/json',
          'user-agent': 'test',
          referer: 'http://localhost',
          'x-tenant-id': '000000',
          'x-encrypted': 'false',
        },
      };

      const serialized = (config.pinoHttp as any).serializers.req(mockReq);

      expect(serialized.id).toBe('req-123');
      expect(serialized.method).toBe('POST');
      expect(serialized.url).toBe('/api/test');
    });

    it('should serialize response', () => {
      const config = createPinoConfig('logs', 'info', true, false, [], []);

      const mockRes = {
        statusCode: 200,
        getHeaders: () => ({}),
        getHeader: (name: string) => {
          if (name === 'content-type') return 'application/json';
          if (name === 'content-length') return '100';
          return undefined;
        },
      };

      const serialized = (config.pinoHttp as any).serializers.res(mockRes);

      expect(serialized.statusCode).toBe(200);
    });

    it('should serialize response without getHeaders', () => {
      const config = createPinoConfig('logs', 'info', true, false, [], []);

      const mockRes = {
        statusCode: 200,
      };

      const serialized = (config.pinoHttp as any).serializers.res(mockRes);

      expect(serialized.statusCode).toBe(200);
      expect(serialized.headers).toEqual({});
    });

    it('should serialize error', () => {
      const config = createPinoConfig('logs', 'info', true, false, [], []);

      const mockError = new Error('Test error');
      (mockError as any).code = 'ERR_TEST';
      (mockError as any).response = { message: 'error response' };
      (mockError as any).status = 400;

      const serialized = (config.pinoHttp as any).serializers.err(mockError);

      expect(serialized.type).toBe('Error');
      expect(serialized.message).toBe('Test error');
      expect(serialized.code).toBe('ERR_TEST');
    });
  });

  describe('absolute path handling', () => {
    it('should handle absolute log directory path', () => {
      (fs.existsSync as jest.Mock).mockReturnValue(false);

      const config = createPinoConfig(
        '/var/log/app',
        'info',
        false,
        true,
        [],
        []
      );

      expect(config).toBeDefined();
      expect(fs.mkdirSync).toHaveBeenCalledWith('/var/log/app', { recursive: true });
    });
  });
});
