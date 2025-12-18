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
    get: jest.fn((key: string) => {
      switch (key) {
        case 'app.file.isLocal':
          return true;
        case 'app.file.maxSize':
          return 10;
        case 'app.file.location':
          return 'uploads';
        case 'app.file.domain':
          return 'http://localhost';
        case 'app.file.serveRoot':
          return '/static';
        case 'cos.secretId':
          return 'id';
        case 'cos.secretKey':
          return 'key';
        case 'cos.bucket':
          return 'bucket';
        case 'cos.region':
          return 'ap-guangzhou';
        case 'cos.location':
          return 'cos';
        default:
          return '';
      }
    }),
  };

  beforeEach(() => {
    prisma = createPrismaMock();
    service = new UploadService(prisma, configService as any);
  });

  it('should create chunk upload id', async () => {
    const res = await service.getChunkUploadId();
    expect(res.code).toBe(200);
    expect(res.data.uploadId).toBeDefined();
  });

  it('should append timestamp when generating new filename', () => {
    const nowSpy = jest.spyOn(Date.prototype, 'getTime').mockReturnValue(1700000000000);
    const value = service.getNewFileName('demo.txt');
    expect(value).toBe('demo.txt_1700000000000');
    nowSpy.mockRestore();
  });

  it('should proxy cos authorization response', async () => {
    const res = await service.getAuthorization('test.txt');
    expect(COS.getAuthorization).toHaveBeenCalled();
    expect(res).toEqual(Result.ok({ sign: 'signature' }));
  });
});
