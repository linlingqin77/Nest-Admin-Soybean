import { Test, TestingModule } from '@nestjs/testing';
import { ServerService } from './server.service';

describe('ServerService', () => {
  let service: ServerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ServerService],
    }).compile();

    service = module.get<ServerService>(ServerService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getInfo', () => {
    it('should return server monitoring information', async () => {
      const result = await service.getInfo();

      expect(result.code).toBe(200);
      expect(result.data).toHaveProperty('cpu');
      expect(result.data).toHaveProperty('mem');
      expect(result.data).toHaveProperty('sys');
      expect(result.data).toHaveProperty('sysFiles');
    });

    it('should include CPU information', async () => {
      const result = await service.getInfo();

      expect(result.data.cpu).toHaveProperty('cpuNum');
      expect(result.data.cpu).toHaveProperty('total');
      expect(result.data.cpu).toHaveProperty('sys');
      expect(result.data.cpu).toHaveProperty('used');
      expect(result.data.cpu).toHaveProperty('free');
    });

    it('should include memory information', async () => {
      const result = await service.getInfo();

      expect(result.data.mem).toHaveProperty('total');
      expect(result.data.mem).toHaveProperty('used');
      expect(result.data.mem).toHaveProperty('free');
      expect(result.data.mem).toHaveProperty('usage');
    });

    it('should include system information', async () => {
      const result = await service.getInfo();

      expect(result.data.sys).toHaveProperty('computerName');
      expect(result.data.sys).toHaveProperty('computerIp');
      expect(result.data.sys).toHaveProperty('userDir');
      expect(result.data.sys).toHaveProperty('osName');
      expect(result.data.sys).toHaveProperty('osArch');
    });
  });

  describe('getCpuInfo', () => {
    it('should return CPU information', () => {
      const cpuInfo = service.getCpuInfo();

      expect(cpuInfo).toHaveProperty('cpuNum');
      expect(cpuInfo).toHaveProperty('total');
      expect(cpuInfo).toHaveProperty('sys');
      expect(cpuInfo).toHaveProperty('used');
      expect(cpuInfo).toHaveProperty('free');
      expect(typeof cpuInfo.cpuNum).toBe('number');
      expect(cpuInfo.cpuNum).toBeGreaterThan(0);
    });

    it('should calculate CPU usage percentages', () => {
      const cpuInfo = service.getCpuInfo();

      const totalPercentage = parseFloat(cpuInfo.sys) + parseFloat(cpuInfo.used) + parseFloat(cpuInfo.free);
      expect(totalPercentage).toBeCloseTo(100, 0);
    });
  });

  describe('getMemInfo', () => {
    it('should return memory information', () => {
      const memInfo = service.getMemInfo();

      expect(memInfo).toHaveProperty('total');
      expect(memInfo).toHaveProperty('used');
      expect(memInfo).toHaveProperty('free');
      expect(memInfo).toHaveProperty('usage');
    });

    it('should calculate memory usage correctly', () => {
      const memInfo = service.getMemInfo();

      const total = parseFloat(memInfo.total);
      const used = parseFloat(memInfo.used);
      const free = parseFloat(memInfo.free);

      expect(total).toBeCloseTo(used + free, 1);
    });

    it('should return usage as percentage', () => {
      const memInfo = service.getMemInfo();

      const usage = parseFloat(memInfo.usage);
      expect(usage).toBeGreaterThanOrEqual(0);
      expect(usage).toBeLessThanOrEqual(100);
    });
  });

  describe('getServerIP', () => {
    it('should return server IP address or undefined', () => {
      const ip = service.getServerIP();

      if (ip) {
        expect(typeof ip).toBe('string');
        expect(ip).toMatch(/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/);
      } else {
        expect(ip).toBeUndefined();
      }
    });
  });

  describe('bytesToGB', () => {
    it('should convert bytes to GB', () => {
      const bytes = 1073741824; // 1 GB
      const result = service.bytesToGB(bytes);

      expect(result).toBe('1.00');
    });

    it('should handle zero bytes', () => {
      const result = service.bytesToGB(0);

      expect(result).toBe('0.00');
    });

    it('should round to 2 decimal places', () => {
      const bytes = 1610612736; // 1.5 GB
      const result = service.bytesToGB(bytes);

      expect(result).toBe('1.50');
    });
  });

  describe('getDiskStatus', () => {
    it('should return disk information', async () => {
      const disks = await service.getDiskStatus();

      expect(Array.isArray(disks)).toBe(true);
      if (disks.length > 0) {
        expect(disks[0]).toHaveProperty('dirName');
        expect(disks[0]).toHaveProperty('typeName');
        expect(disks[0]).toHaveProperty('total');
        expect(disks[0]).toHaveProperty('used');
        expect(disks[0]).toHaveProperty('free');
        expect(disks[0]).toHaveProperty('usage');
      }
    });
  });
});
