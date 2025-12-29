import { UploadService } from './upload.service';
import { createPrismaMock, PrismaMock } from 'src/test-utils/prisma-mock';
import { Result, ResponseCode } from 'src/common/response';
import { BadRequestException } from '@nestjs/common';
import { StatusEnum, DelFlagEnum } from 'src/common/enum/index';
import * as fs from 'fs';
import * as path from 'path';

jest.mock('cos-nodejs-sdk-v5', () => {
  const Cos = jest.fn().mockImplementation(() => ({
    headObject: jest.fn().mockResolvedValue({ statusCode: 404 }),
    putObject: jest.fn().mockResolvedValue({ Location: 'cos.example.com/test.txt' }),
    uploadFile: jest.fn().mockResolvedValue({}),
  }));
  (Cos as any).getAuthorization = jest.fn().mockReturnValue('signature');
  return Cos;
});
const COS = jest.requireMock('cos-nodejs-sdk-v5');

jest.mock('iconv-lite', () => ({
  decode: jest.fn().mockImplementation((buffer: Buffer) => buffer.toString()),
}));

jest.mock('mime-types', () => ({
  lookup: jest.fn().mockReturnValue('text/plain'),
  extension: jest.fn().mockReturnValue('txt'),
}));

jest.mock('fs', () => ({
  existsSync: jest.fn().mockReturnValue(false),
  mkdirSync: jest.fn(),
  writeFileSync: jest.fn(),
  readFileSync: jest.fn(),
  readdirSync: jest.fn().mockReturnValue([]),
  lstatSync: jest.fn().mockReturnValue({ isFile: () => true }),
  createWriteStream: jest.fn().mockReturnValue({
    on: jest.fn((event, cb) => {
      if (event === 'close') setTimeout(cb, 10);
    }),
  }),
  createReadStream: jest.fn().mockReturnValue({
    pipe: jest.fn().mockReturnThis(),
    on: jest.fn((event, cb) => {
      if (event === 'end') setTimeout(cb, 10);
    }),
  }),
  rmdirSync: jest.fn(),
  statSync: jest.fn().mockReturnValue({ size: 1024 }),
  unlinkSync: jest.fn(),
}));

// Mock TenantContext
jest.mock('src/common/tenant/tenant.context', () => ({
  TenantContext: {
    getTenantId: jest.fn().mockReturnValue('000000'),
  },
}));

describe('UploadService', () => {
  let prisma: PrismaMock;
  let service: UploadService;
  const configService = {
    app: {
      file: {
        isLocal: true,
        maxSize: 10,
        location: 'uploads',
        domain: 'http://localhost',
        serveRoot: '/static',
        thumbnailEnabled: true,
      },
    },
    cos: {
      secretId: 'id',
      secretKey: 'key',
      bucket: 'bucket',
      region: 'ap-guangzhou',
      location: 'cos',
      domain: 'https://cos.example.com',
    },
  };
  const versionService = {
    checkAndCleanOldVersions: jest.fn(),
  };
  const thumbnailQueue = {
    add: jest.fn().mockResolvedValue({}),
  };

  beforeEach(() => {
    prisma = createPrismaMock();
    service = new UploadService(prisma, configService as any, versionService as any, thumbnailQueue as any);
    jest.clearAllMocks();
  });

  describe('getChunkUploadId', () => {
    it('should create chunk upload id', async () => {
      const res = await service.getChunkUploadId();
      expect(res.code).toBe(200);
      expect(res.data.uploadId).toBeDefined();
    });
  });

  describe('getNewFileName', () => {
    it('should append timestamp when generating new filename', () => {
      const nowSpy = jest.spyOn(Date.prototype, 'getTime').mockReturnValue(1700000000000);
      const value = service.getNewFileName('demo.txt');
      expect(value).toBe('demo_1700000000000.txt');
      nowSpy.mockRestore();
    });

    it('should handle filename without extension', () => {
      const nowSpy = jest.spyOn(Date.prototype, 'getTime').mockReturnValue(1700000000000);
      const value = service.getNewFileName('demo');
      expect(value).toBe('demo_1700000000000');
      nowSpy.mockRestore();
    });

    it('should return original name if empty', () => {
      const value = service.getNewFileName('');
      expect(value).toBe('');
    });

    it('should handle null/undefined input', () => {
      const value = service.getNewFileName(null as any);
      expect(value).toBeFalsy();
    });
  });

  describe('getAuthorization', () => {
    it('should proxy cos authorization response', async () => {
      const res = await service.getAuthorization('test.txt');
      expect(COS.getAuthorization).toHaveBeenCalled();
      expect(res).toEqual(Result.ok({ sign: 'signature' }));
    });
  });

  describe('chunkFileUpload', () => {
    it('should upload chunk file successfully', async () => {
      const file = {
        buffer: Buffer.from('test content'),
        originalname: 'test.txt',
      } as Express.Multer.File;

      const body = {
        uploadId: 'test-upload-id',
        fileName: 'test.txt',
        index: 0,
      };

      // Mock directory exists
      (fs.existsSync as jest.Mock).mockReturnValue(true);

      const result = await service.chunkFileUpload(file, body as any);

      expect(result.code).toBe(200);
    });

    it('should skip if chunk already exists', async () => {
      const file = {
        buffer: Buffer.from('test content'),
        originalname: 'test.txt',
      } as Express.Multer.File;

      const body = {
        uploadId: 'test-upload-id',
        fileName: 'test.txt',
        index: 0,
      };

      (fs.existsSync as jest.Mock)
        .mockReturnValueOnce(true) // chunk dir exists
        .mockReturnValueOnce(true); // chunk file exists

      const result = await service.chunkFileUpload(file, body as any);

      expect(result.code).toBe(200);
    });
  });

  describe('checkChunkFile', () => {
    it('should return ok if chunk exists', async () => {
      const body = {
        uploadId: 'test-upload-id',
        fileName: 'test.txt',
        index: 0,
      };

      (fs.existsSync as jest.Mock).mockReturnValue(true);

      const result = await service.checkChunkFile(body);

      expect(result.code).toBe(200);
    });

    it('should return fail if chunk does not exist', async () => {
      const body = {
        uploadId: 'test-upload-id',
        fileName: 'test.txt',
        index: 0,
      };

      (fs.existsSync as jest.Mock).mockReturnValue(false);

      const result = await service.checkChunkFile(body);

      expect(result.code).toBe(ResponseCode.INTERNAL_SERVER_ERROR);
    });
  });

  describe('mkdirsSync', () => {
    it('should return true if directory exists', () => {
      (fs.existsSync as jest.Mock).mockReturnValue(true);

      const result = service.mkdirsSync('/test/dir');

      expect(result).toBe(true);
    });

    it('should create directory when parent exists', () => {
      (fs.existsSync as jest.Mock)
        .mockReturnValueOnce(false) // /test/dir doesn't exist
        .mockReturnValueOnce(true); // /test exists

      const result = service.mkdirsSync('/test/dir');

      expect(result).toBe(true);
      expect(fs.mkdirSync).toHaveBeenCalled();
    });
  });

  describe('getChunkUploadResult', () => {
    it('should return upload result when file exists', async () => {
      const mockUpload = {
        status: StatusEnum.NORMAL,
        fileName: 'test.txt',
        newFileName: 'test_123.txt',
        url: 'http://localhost/test_123.txt',
      };

      (prisma.sysUpload.findUnique as jest.Mock).mockResolvedValue(mockUpload);

      const result = await service.getChunkUploadResult('test-upload-id');

      expect(result.code).toBe(200);
      expect(result.data.data.fileName).toBe('test.txt');
    });

    it('should return fail when file does not exist', async () => {
      (prisma.sysUpload.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await service.getChunkUploadResult('non-existent-id');

      expect(result.code).toBe(ResponseCode.INTERNAL_SERVER_ERROR);
    });

    it('should indicate uploading status', async () => {
      const mockUpload = {
        status: StatusEnum.DISABLED,
        fileName: 'test.txt',
        newFileName: 'test_123.txt',
        url: 'http://localhost/test_123.txt',
      };

      (prisma.sysUpload.findUnique as jest.Mock).mockResolvedValue(mockUpload);

      const result = await service.getChunkUploadResult('test-upload-id');

      expect(result.code).toBe(200);
      expect(result.data.msg).toBe('上传中');
    });
  });

  describe('singleFileUpload', () => {
    const mockFile = {
      buffer: Buffer.from('test content'),
      originalname: 'test.txt',
      size: 1024,
    } as Express.Multer.File;

    beforeEach(() => {
      // Mock tenant check
      (prisma.sysTenant.findUnique as jest.Mock).mockResolvedValue({
        storageQuota: 1000,
        storageUsed: 100,
        companyName: 'Test Company',
      });
      (prisma.sysTenant.update as jest.Mock).mockResolvedValue({});
      (prisma.sysConfig.findFirst as jest.Mock).mockResolvedValue({ configValue: 'overwrite' });
      (prisma.sysUpload.create as jest.Mock).mockResolvedValue({
        uploadId: 'new-upload-id',
        fileName: 'test.txt',
        url: 'http://localhost/test.txt',
      });
      // Mock fs.existsSync to return true for directory checks
      (fs.existsSync as jest.Mock).mockReturnValue(true);
    });

    it('should throw error when file size exceeds limit', async () => {
      const largeFile = {
        ...mockFile,
        size: 100 * 1024 * 1024, // 100MB
      } as Express.Multer.File;

      await expect(service.singleFileUpload(largeFile)).rejects.toThrow(BadRequestException);
    });

    it('should throw error when storage quota exceeded', async () => {
      (prisma.sysTenant.findUnique as jest.Mock).mockResolvedValue({
        storageQuota: 10,
        storageUsed: 10,
        companyName: 'Test Company',
      });

      await expect(service.singleFileUpload(mockFile)).rejects.toThrow(BadRequestException);
    });

    it('should throw error when tenant not found', async () => {
      (prisma.sysTenant.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.singleFileUpload(mockFile)).rejects.toThrow(BadRequestException);
    });

    it('should perform instant upload when file MD5 matches', async () => {
      const existingFile = {
        uploadId: 'existing-id',
        fileName: 'existing.txt',
        newFileName: 'existing_123.txt',
        url: 'http://localhost/existing_123.txt',
        ext: 'txt',
        size: 1024,
        mimeType: 'text/plain',
        storageType: 'local',
        fileMd5: 'abc123',
        thumbnail: null,
      };

      (prisma.sysUpload.findFirst as jest.Mock).mockResolvedValue(existingFile);

      const result = await service.singleFileUpload(mockFile);

      expect(result.instantUpload).toBe(true);
    });
  });

  describe('chunkMergeFile', () => {
    it('should return fail when source directory does not exist', async () => {
      (fs.existsSync as jest.Mock).mockReturnValue(false);

      const body = {
        uploadId: 'test-upload-id',
        fileName: 'test.txt',
      };

      const result = await service.chunkMergeFile(body as any);

      expect(result.code).toBe(ResponseCode.INTERNAL_SERVER_ERROR);
    });
  });

  describe('saveFileLocal', () => {
    it('should save file to local storage', async () => {
      const file = {
        buffer: Buffer.from('test content'),
        originalname: 'test.txt',
      } as Express.Multer.File;

      (fs.existsSync as jest.Mock).mockReturnValue(true);

      const result = await service.saveFileLocal(file);

      expect(result).toBeDefined();
      expect(result.url).toContain('http://localhost');
      expect(fs.writeFileSync).toHaveBeenCalled();
    });
  });

  describe('cosHeadObject', () => {
    it('should check if cos object exists', async () => {
      const result = await service.cosHeadObject('test.txt');

      expect(result).toBeDefined();
    });
  });
});
