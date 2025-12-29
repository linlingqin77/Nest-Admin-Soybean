import { Test, TestingModule } from '@nestjs/testing';
import { DecryptInterceptor } from './crypto.interceptor';
import { CryptoService } from './crypto.service';
import { Reflector } from '@nestjs/core';
import { ExecutionContext, CallHandler } from '@nestjs/common';
import { of } from 'rxjs';

describe('DecryptInterceptor', () => {
  let interceptor: DecryptInterceptor;
  let cryptoService: jest.Mocked<CryptoService>;
  let reflector: jest.Mocked<Reflector>;

  const mockCryptoService = {
    isEnabled: jest.fn(),
    decryptRequest: jest.fn(),
  };

  const mockReflector = {
    getAllAndOverride: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DecryptInterceptor,
        {
          provide: CryptoService,
          useValue: mockCryptoService,
        },
        {
          provide: Reflector,
          useValue: mockReflector,
        },
      ],
    }).compile();

    interceptor = module.get<DecryptInterceptor>(DecryptInterceptor);
    cryptoService = module.get(CryptoService);
    reflector = module.get(Reflector);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const createMockExecutionContext = (request: any): ExecutionContext => {
    return {
      switchToHttp: () => ({
        getRequest: () => request,
      }),
      getHandler: () => jest.fn(),
      getClass: () => jest.fn(),
    } as unknown as ExecutionContext;
  };

  const createMockCallHandler = (): CallHandler => ({
    handle: () => of({ success: true }),
  });

  describe('intercept', () => {
    it('should pass through when crypto is disabled', (done) => {
      mockCryptoService.isEnabled.mockReturnValue(false);

      const context = createMockExecutionContext({});
      const handler = createMockCallHandler();

      interceptor.intercept(context, handler).subscribe((result) => {
        expect(result).toEqual({ success: true });
        expect(mockCryptoService.decryptRequest).not.toHaveBeenCalled();
        done();
      });
    });

    it('should pass through when skipDecrypt is true', (done) => {
      mockCryptoService.isEnabled.mockReturnValue(true);
      mockReflector.getAllAndOverride.mockReturnValue(true);

      const context = createMockExecutionContext({});
      const handler = createMockCallHandler();

      interceptor.intercept(context, handler).subscribe((result) => {
        expect(result).toEqual({ success: true });
        expect(mockCryptoService.decryptRequest).not.toHaveBeenCalled();
        done();
      });
    });

    it('should pass through when x-encrypted header is not set', (done) => {
      mockCryptoService.isEnabled.mockReturnValue(true);
      mockReflector.getAllAndOverride.mockReturnValue(false);

      const request = {
        headers: {},
        body: { data: 'test' },
      };
      const context = createMockExecutionContext(request);
      const handler = createMockCallHandler();

      interceptor.intercept(context, handler).subscribe((result) => {
        expect(result).toEqual({ success: true });
        expect(mockCryptoService.decryptRequest).not.toHaveBeenCalled();
        done();
      });
    });

    it('should pass through when x-encrypted is not true', (done) => {
      mockCryptoService.isEnabled.mockReturnValue(true);
      mockReflector.getAllAndOverride.mockReturnValue(false);

      const request = {
        headers: { 'x-encrypted': 'false' },
        body: { data: 'test' },
      };
      const context = createMockExecutionContext(request);
      const handler = createMockCallHandler();

      interceptor.intercept(context, handler).subscribe((result) => {
        expect(result).toEqual({ success: true });
        expect(mockCryptoService.decryptRequest).not.toHaveBeenCalled();
        done();
      });
    });

    it('should pass through when body is empty', (done) => {
      mockCryptoService.isEnabled.mockReturnValue(true);
      mockReflector.getAllAndOverride.mockReturnValue(false);

      const request = {
        headers: { 'x-encrypted': 'true' },
        body: null,
      };
      const context = createMockExecutionContext(request);
      const handler = createMockCallHandler();

      interceptor.intercept(context, handler).subscribe((result) => {
        expect(result).toEqual({ success: true });
        expect(mockCryptoService.decryptRequest).not.toHaveBeenCalled();
        done();
      });
    });

    it('should decrypt request body when encrypted', (done) => {
      mockCryptoService.isEnabled.mockReturnValue(true);
      mockReflector.getAllAndOverride.mockReturnValue(false);
      mockCryptoService.decryptRequest.mockReturnValue({ username: 'admin', password: 'secret' });

      const request = {
        headers: { 'x-encrypted': 'true' },
        body: {
          encryptedKey: 'encrypted-aes-key',
          encryptedData: 'encrypted-data',
        },
      };
      const context = createMockExecutionContext(request);
      const handler = createMockCallHandler();

      interceptor.intercept(context, handler).subscribe((result) => {
        expect(mockCryptoService.decryptRequest).toHaveBeenCalledWith('encrypted-aes-key', 'encrypted-data');
        expect(request.body).toEqual({ username: 'admin', password: 'secret' });
        done();
      });
    });

    it('should not decrypt when encryptedKey is missing', (done) => {
      mockCryptoService.isEnabled.mockReturnValue(true);
      mockReflector.getAllAndOverride.mockReturnValue(false);

      const request = {
        headers: { 'x-encrypted': 'true' },
        body: {
          encryptedData: 'encrypted-data',
        },
      };
      const context = createMockExecutionContext(request);
      const handler = createMockCallHandler();

      interceptor.intercept(context, handler).subscribe((result) => {
        expect(mockCryptoService.decryptRequest).not.toHaveBeenCalled();
        done();
      });
    });

    it('should not decrypt when encryptedData is missing', (done) => {
      mockCryptoService.isEnabled.mockReturnValue(true);
      mockReflector.getAllAndOverride.mockReturnValue(false);

      const request = {
        headers: { 'x-encrypted': 'true' },
        body: {
          encryptedKey: 'encrypted-aes-key',
        },
      };
      const context = createMockExecutionContext(request);
      const handler = createMockCallHandler();

      interceptor.intercept(context, handler).subscribe((result) => {
        expect(mockCryptoService.decryptRequest).not.toHaveBeenCalled();
        done();
      });
    });

    it('should handle decryption errors gracefully', (done) => {
      mockCryptoService.isEnabled.mockReturnValue(true);
      mockReflector.getAllAndOverride.mockReturnValue(false);
      mockCryptoService.decryptRequest.mockImplementation(() => {
        throw new Error('Decryption failed');
      });

      const originalBody = {
        encryptedKey: 'invalid-key',
        encryptedData: 'invalid-data',
      };
      const request = {
        headers: { 'x-encrypted': 'true' },
        body: { ...originalBody },
      };
      const context = createMockExecutionContext(request);
      const handler = createMockCallHandler();

      interceptor.intercept(context, handler).subscribe((result) => {
        // 解密失败时保持原始请求体
        expect(request.body).toEqual(originalBody);
        expect(result).toEqual({ success: true });
        done();
      });
    });
  });
});
