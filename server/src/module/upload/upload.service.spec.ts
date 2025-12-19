import { UploadService } from './upload.service';
import { createPrismaMock, PrismaMock } from 'src/test-utils/prisma-mock';
import { Result } from 'src/common/response';

jest.mock('cos-nodejs-sdk-v5', () => {
  const Cos = jest.fn().mockImplementation(() => ({
    headObject: jest.fn().mockResolvedValue({ statusCode: 404 }),
    putObject: jest.fn(),
    uploadFile: jest.fn(),
  }));
  (Cos as any).getAuthorization = jest.fn().mockReturnValue('signature');
  return Cos;
});
const COS = jest.requireMock('cos-nodejs-sdk-v5');

jest.mock('iconv-lite', () => ({
  decode: jest.fn().mockImplementation((buffer: Buffer) => buffer.toString()),
}));

jest.mock('mime-types', () => ({
  extension: jest.fn().mockReturnValue('txt'),
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
    add: jest.fn(),
  };

  beforeEach(() => {
    prisma = createPrismaMock();
    service = new UploadService(
      prisma,
      configService as any,
      versionService as any,
      thumbnailQueue as any
    );
  });

  it('should create chunk upload id', async () => {
    const res = await service.getChunkUploadId();
    expect(res.code).toBe(200);
    expect(res.data.uploadId).toBeDefined();
  });

  it('should append timestamp when generating new filename', () => {
    const nowSpy = jest.spyOn(Date.prototype, 'getTime').mockReturnValue(1700000000000);
    const value = service.getNewFileName('demo.txt');
    expect(value).toBe('demo_1700000000000.txt');
    nowSpy.mockRestore();
  });

  it('should proxy cos authorization response', async () => {
    const res = await service.getAuthorization('test.txt');
    expect(COS.getAuthorization).toHaveBeenCalled();
    expect(res).toEqual(Result.ok({ sign: 'signature' }));
  });
});
