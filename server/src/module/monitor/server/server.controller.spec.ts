import { Test, TestingModule } from '@nestjs/testing';
import { ServerController } from './server.controller';
import { ServerService } from './server.service';
import { Result } from 'src/common/response';

describe('ServerController', () => {
  let controller: ServerController;
  let service: jest.Mocked<ServerService>;

  const mockServerInfo = {
    cpu: {
      cpuNum: 8,
      total: 1000000,
      sys: '10.00',
      used: '30.00',
      free: '60.00',
      wait: 0.0,
    },
    mem: {
      total: '16.00',
      used: '8.00',
      free: '8.00',
      usage: '50.00',
    },
    sys: {
      computerName: 'test-server',
      computerIp: '192.168.1.1',
      userDir: '/app',
      osName: 'linux' as NodeJS.Platform,
      osArch: 'x64',
    },
    sysFiles: [
      {
        dirName: '/',
        typeName: 'ext4',
        total: '100GB',
        used: '50GB',
        free: '50GB',
        usage: '50.00',
      },
    ],
  };

  beforeEach(async () => {
    const mockService = {
      getInfo: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ServerController],
      providers: [
        {
          provide: ServerService,
          useValue: mockService,
        },
      
      ],
      }).compile();

    controller = module.get<ServerController>(ServerController);
    service = module.get(ServerService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getInfo', () => {
    it('should return server monitoring information', async () => {
      const mockResult = Result.ok(mockServerInfo);
      service.getInfo.mockResolvedValue(mockResult);

      const result = await controller.getInfo();

      expect(result.code).toBe(200);
      expect(result.data).toHaveProperty('cpu');
      expect(result.data).toHaveProperty('mem');
      expect(result.data).toHaveProperty('sys');
      expect(result.data).toHaveProperty('sysFiles');
      expect(service.getInfo).toHaveBeenCalled();
    });

    it('should include CPU information', async () => {
      const mockResult = Result.ok(mockServerInfo);
      service.getInfo.mockResolvedValue(mockResult);

      const result = await controller.getInfo();

      expect(result.data.cpu).toHaveProperty('cpuNum');
      expect(result.data.cpu).toHaveProperty('total');
      expect(result.data.cpu).toHaveProperty('sys');
      expect(result.data.cpu).toHaveProperty('used');
      expect(result.data.cpu).toHaveProperty('free');
    });

    it('should include memory information', async () => {
      const mockResult = Result.ok(mockServerInfo);
      service.getInfo.mockResolvedValue(mockResult);

      const result = await controller.getInfo();

      expect(result.data.mem).toHaveProperty('total');
      expect(result.data.mem).toHaveProperty('used');
      expect(result.data.mem).toHaveProperty('free');
      expect(result.data.mem).toHaveProperty('usage');
    });

    it('should include system information', async () => {
      const mockResult = Result.ok(mockServerInfo);
      service.getInfo.mockResolvedValue(mockResult);

      const result = await controller.getInfo();

      expect(result.data.sys).toHaveProperty('computerName');
      expect(result.data.sys).toHaveProperty('computerIp');
      expect(result.data.sys).toHaveProperty('userDir');
      expect(result.data.sys).toHaveProperty('osName');
      expect(result.data.sys).toHaveProperty('osArch');
    });

    it('should include disk information', async () => {
      const mockResult = Result.ok(mockServerInfo);
      service.getInfo.mockResolvedValue(mockResult);

      const result = await controller.getInfo();

      expect(Array.isArray(result.data.sysFiles)).toBe(true);
      if (result.data.sysFiles.length > 0) {
        expect(result.data.sysFiles[0]).toHaveProperty('dirName');
        expect(result.data.sysFiles[0]).toHaveProperty('typeName');
        expect(result.data.sysFiles[0]).toHaveProperty('total');
        expect(result.data.sysFiles[0]).toHaveProperty('used');
        expect(result.data.sysFiles[0]).toHaveProperty('free');
        expect(result.data.sysFiles[0]).toHaveProperty('usage');
      }
    });
  });
});
