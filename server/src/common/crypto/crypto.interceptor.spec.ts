import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, CallHandler } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { of } from 'rxjs';
import { DecryptInterceptor } from './crypto.interceptor';
import { CryptoService } from './crypto.service';
import { SKIP_DECRYPT_KEY } from './crypto.decorator';

describe('DecryptInterceptor', () => {
  let interceptor: DecryptInterceptor;
  let reflector: Reflector;
  let cryptoService: CryptoService;

  const mockCryptoService = {
    isEnabled: jest.fn(),
    decryptRequest: jest.fn(),
  };

  const createMockContext = (options: {
    body?: any;
    headers?: Record<string, string>;
  } = {}): ExecutionContext => {
    const { body = {}, headers = {} } = options;
    return {
      switchToHttp: () => ({
        getRequest: () => ({
          body,
          headers,
        }),
      }),
      getHandler: () => ({}),
      getClass: () => ({}),
    } as ExecutionContext;
  };

  const createMockCallHandler = (): CallHandler => ({
    handle: () => of({ success: true }),
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DecryptInterceptor,
        {
          provide: Reflector,
          useValue: {
            getAllAndOverride: jest.fn(),
          },
        },
        {
          provide: CryptoService,
          useValue: mockCryptoService,
        },
      ],
    }).compile();

    interceptor = module.get<DecryptInterceptor>(DecryptInterceptor);
    reflector = module.get<Reflector>(Reflector);
    cryptoService = module.get<CryptoService>(CryptoService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('intercept', () => {
    it('should pass through when crypto is disabled', (done) => {
      mockCryptoService.isEnabled.mockReturnValue(false);
      const context = createMockContext();
      const next = createMockCallHandler();

      interceptor.intercept(context, next).subscribe({
        next: (result) => {
          expect(result).toEqual({ success: true });
          expect(mockCryptoService.decryptRequest).not.toHaveBeenCalled();
          done();
        },
      });
    });

    it('should pass through when @SkipDecrypt is set', (done) => {
      mockCryptoService.isEnabled.mockReturnValue(true);
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(true);
      const context = createMockContext();
      const next = createMockCallHandler();

      interceptor.intercept(context, next).subscribe({
        next: (result) => {
          expect(result).toEqual({ success: true });
          expect(mockCryptoService.decryptRequest).not.toHaveBeenCalled();
          done();
        },
      });
    });

    it('should pass through when x-encrypted header is not set', (done) => {
      mockCryptoService.isEnabled.mockReturnValue(true);
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);
      const context = createMockContext({
        headers: {},
        body: { data: 'test' },
      });
      const next = createMockCallHandler();

      interceptor.intercept(context, next).subscribe({
        next: (result) => {
          expect(result).toEqual({ success: true });
          expect(mockCryptoService.decryptRequest).not.toHaveBeenCalled();
          done();
        },
      });
    });

    it('should pass through when body is empty', (done) => {
      mockCryptoService.isEnabled.mockReturnValue(true);
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);
      const context = createMockContext({
        headers: { 'x-encrypted': 'true' },
        body: null,
      });
      const next = createMockCallHandler();

      interceptor.intercept(context, next).subscribe({
        next: (result) => {
          expect(result).toEqual({ success: true });
          expect(mockCryptoService.decryptRequest).not.toHaveBeenCalled();
          done();
        },
      });
    });

    it('should decrypt request body when encrypted', (done) => {
      mockCryptoService.isEnabled.mockReturnValue(true);
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);
      mockCryptoService.decryptRequest.mockReturnValue({ username: 'test', password: '123456' });

      // Create a shared request object so body mutation is visible
      const request = {
        body: {
          encryptedKey: 'encrypted-aes-key',
          encryptedData: 'encrypted-data',
        },
        headers: { 'x-encrypted': 'true' },
      };
      const context = {
        switchToHttp: () => ({
          getRequest: () => request,
        }),
        getHandler: () => ({}),
        getClass: () => ({}),
      } as ExecutionContext;
      const next = createMockCallHandler();

      interceptor.intercept(context, next).subscribe({
        next: () => {
          expect(mockCryptoService.decryptRequest).toHaveBeenCalledWith(
            'encrypted-aes-key',
            'encrypted-data',
          );
          // Verify body was replaced
          expect(request.body).toEqual({ username: 'test', password: '123456' });
          done();
        },
      });
    });

    it('should pass through when encryptedKey or encryptedData is missing', (done) => {
      mockCryptoService.isEnabled.mockReturnValue(true);
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);

      const context = createMockContext({
        headers: { 'x-encrypted': 'true' },
        body: { someOtherField: 'value' },
      });
      const next = createMockCallHandler();

      interceptor.intercept(context, next).subscribe({
        next: (result) => {
          expect(result).toEqual({ success: true });
          expect(mockCryptoService.decryptRequest).not.toHaveBeenCalled();
          done();
        },
      });
    });

    it('should handle decryption errors gracefully', (done) => {
      mockCryptoService.isEnabled.mockReturnValue(true);
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);
      mockCryptoService.decryptRequest.mockImplementation(() => {
        throw new Error('Decryption failed');
      });

      const originalBody = {
        encryptedKey: 'invalid-key',
        encryptedData: 'invalid-data',
      };
      const context = createMockContext({
        headers: { 'x-encrypted': 'true' },
        body: { ...originalBody },
      });
      const next = createMockCallHandler();

      interceptor.intercept(context, next).subscribe({
        next: (result) => {
          // Should continue with original body on error
          expect(result).toEqual({ success: true });
          done();
        },
      });
    });

    it('should check both handler and class for @SkipDecrypt decorator', (done) => {
      mockCryptoService.isEnabled.mockReturnValue(true);
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);
      const context = createMockContext();
      const next = createMockCallHandler();

      interceptor.intercept(context, next).subscribe({
        next: () => {
          expect(reflector.getAllAndOverride).toHaveBeenCalledWith(SKIP_DECRYPT_KEY, [
            context.getHandler(),
            context.getClass(),
          ]);
          done();
        },
      });
    });
  });
});
