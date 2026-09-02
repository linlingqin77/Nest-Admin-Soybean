/** @file file-access.service.spec.ts @description Migrated from src/modules/files/services/file-access.service.spec.ts */

import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { FileAccessService } from '@/modules/files/services/file-access.service';
import { AppConfigService } from '@/platform/config/app-config.service';
// @ts-expect-error
import { ConfigMock, createConfigMock } from 'test/mocks/config.mock';

describe('FileAccessService', () => {
  let service: FileAccessService;
  let jwtServiceMock: jest.Mocked<JwtService>;
  let configMock: ConfigMock;

  beforeEach(async () => {
    jwtServiceMock = {
      sign: jest.fn().mockReturnValue('test-token'),
      verify: jest.fn(),
    } as any;

    configMock = createConfigMock();

    const modules: TestingModule = await Test.createTestingModule({
      providers: [
        FileAccessService,
        { provide: JwtService, useValue: jwtServiceMock },
        { provide: AppConfigService, useValue: configMock },
      ],
    }).compile();

    service = modules.get<FileAccessService>(FileAccessService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('generateAccessToken', () => {
    it('should generate access token', () => {
      const token = service.generateAccessToken('file-123', 'tenant-001');

      expect(token).toBe('test-token');
      expect(jwtServiceMock.sign).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'file-access',
          fileId: 'file-123',
          tenantId: 'tenant-001',
          exp: expect.any(Number),
        }),
        expect.objectContaining({
          secret: configMock.jwt.secretkey,
        }),
      );
    });

    it('should set expiration to 30 minutes', () => {
      const now = Math.floor(Date.now() / 1000);
      service.generateAccessToken('file-123', 'tenant-001');

      const callArgs = jwtServiceMock.sign.mock.calls[0][0] as any;
      expect(callArgs.exp).toBeGreaterThanOrEqual(now + 30 * 60 - 1);
      expect(callArgs.exp).toBeLessThanOrEqual(now + 30 * 60 + 1);
    });
  });

  describe('verifyAccessToken', () => {
    it('should verify valid token', () => {
      const futureExp = Math.floor(Date.now() / 1000) + 1000;
      jwtServiceMock.verify.mockReturnValue({
        type: 'file-access',
        fileId: 'file-123',
        tenantId: 'tenant-001',
        exp: futureExp,
      });

      const result = service.verifyAccessToken('valid-token');

      expect(result).toEqual({
        fileId: 'file-123',
        tenantId: 'tenant-001',
      });
    });

    it('should throw error for invalid token type', () => {
      jwtServiceMock.verify.mockReturnValue({
        type: 'other-type',
        fileId: 'file-123',
        tenantId: 'tenant-001',
      });

      expect(() => service.verifyAccessToken('invalid-token')).toThrow(UnauthorizedException);
    });

    it('should throw error for expired token', () => {
      const pastExp = Math.floor(Date.now() / 1000) - 1000;
      jwtServiceMock.verify.mockReturnValue({
        type: 'file-access',
        fileId: 'file-123',
        tenantId: 'tenant-001',
        exp: pastExp,
      });

      expect(() => service.verifyAccessToken('expired-token')).toThrow(UnauthorizedException);
    });

    it('should throw error when jwt verification fails', () => {
      jwtServiceMock.verify.mockImplementation(() => {
        throw new Error('Invalid signature');
      });

      expect(() => service.verifyAccessToken('bad-token')).toThrow(UnauthorizedException);
    });
  });

  describe('generatePreviewToken', () => {
    it('should generate preview token with 5 minute expiration', () => {
      const now = Math.floor(Date.now() / 1000);
      service.generatePreviewToken('file-123', 'tenant-001');

      const callArgs = jwtServiceMock.sign.mock.calls[0][0] as any;
      expect(callArgs.exp).toBeGreaterThanOrEqual(now + 5 * 60 - 1);
      expect(callArgs.exp).toBeLessThanOrEqual(now + 5 * 60 + 1);
    });

    it('should return token', () => {
      const token = service.generatePreviewToken('file-123', 'tenant-001');
      expect(token).toBe('test-token');
    });
  });
});
