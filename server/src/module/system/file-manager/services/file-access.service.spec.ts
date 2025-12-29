import { Test, TestingModule } from '@nestjs/testing';
import { FileAccessService } from './file-access.service';
import { JwtService } from '@nestjs/jwt';
import { AppConfigService } from 'src/config/app-config.service';
import { UnauthorizedException } from '@nestjs/common';

describe('FileAccessService', () => {
  let service: FileAccessService;
  let jwtService: JwtService;
  let config: AppConfigService;

  const mockJwtService = {
    sign: jest.fn(),
    verify: jest.fn(),
  };

  const mockConfigService = {
    jwt: {
      secretkey: 'test-secret-key',
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FileAccessService,
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: AppConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<FileAccessService>(FileAccessService);
    jwtService = module.get<JwtService>(JwtService);
    config = module.get<AppConfigService>(AppConfigService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('generateAccessToken', () => {
    it('should generate access token', () => {
      const fileId = 'file-123';
      const tenantId = '000000';
      const mockToken = 'token-123';

      mockJwtService.sign.mockReturnValue(mockToken);

      const result = service.generateAccessToken(fileId, tenantId);

      expect(result).toBe(mockToken);
      expect(jwtService.sign).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'file-access',
          fileId,
          tenantId,
          exp: expect.any(Number),
        }),
        { secret: 'test-secret-key' },
      );
    });
  });

  describe('verifyAccessToken', () => {
    it('should verify valid token', () => {
      const token = 'valid-token';
      const mockPayload = {
        type: 'file-access',
        fileId: 'file-123',
        tenantId: '000000',
        exp: Math.floor(Date.now() / 1000) + 1800,
      };

      mockJwtService.verify.mockReturnValue(mockPayload);

      const result = service.verifyAccessToken(token);

      expect(result).toEqual({
        fileId: 'file-123',
        tenantId: '000000',
      });
      expect(jwtService.verify).toHaveBeenCalledWith(token, { secret: 'test-secret-key' });
    });

    it('should throw error for invalid token type', () => {
      const token = 'invalid-token';
      const mockPayload = {
        type: 'invalid-type',
        fileId: 'file-123',
        tenantId: '000000',
        exp: Math.floor(Date.now() / 1000) + 1800,
      };

      mockJwtService.verify.mockReturnValue(mockPayload);

      expect(() => service.verifyAccessToken(token)).toThrow(UnauthorizedException);
    });

    it('should throw error for expired token', () => {
      const token = 'expired-token';
      const mockPayload = {
        type: 'file-access',
        fileId: 'file-123',
        tenantId: '000000',
        exp: Math.floor(Date.now() / 1000) - 100,
      };

      mockJwtService.verify.mockReturnValue(mockPayload);

      expect(() => service.verifyAccessToken(token)).toThrow(UnauthorizedException);
    });

    it('should throw error for verification failure', () => {
      const token = 'bad-token';

      mockJwtService.verify.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      expect(() => service.verifyAccessToken(token)).toThrow(UnauthorizedException);
    });
  });

  describe('generatePreviewToken', () => {
    it('should generate preview token with shorter expiry', () => {
      const fileId = 'file-123';
      const tenantId = '000000';
      const mockToken = 'preview-token-123';

      mockJwtService.sign.mockReturnValue(mockToken);

      const result = service.generatePreviewToken(fileId, tenantId);

      expect(result).toBe(mockToken);
      expect(jwtService.sign).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'file-access',
          fileId,
          tenantId,
          exp: expect.any(Number),
        }),
        { secret: 'test-secret-key' },
      );
    });
  });
});
