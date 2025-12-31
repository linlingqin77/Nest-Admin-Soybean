import { Test, TestingModule } from '@nestjs/testing';
import { InfoService, AppInfo } from './info.service';

describe('InfoService', () => {
  let service: InfoService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [InfoService],
    }).compile();

    service = module.get<InfoService>(InfoService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getInfo', () => {
    it('should return application info with required fields', () => {
      const info = service.getInfo();

      // Check required fields exist
      expect(info).toHaveProperty('name');
      expect(info).toHaveProperty('version');
      expect(info).toHaveProperty('description');
      expect(info).toHaveProperty('startTime');
      expect(info).toHaveProperty('uptime');
      expect(info).toHaveProperty('uptimeFormatted');
      expect(info).toHaveProperty('nodeVersion');
      expect(info).toHaveProperty('environment');
      expect(info).toHaveProperty('system');
      expect(info).toHaveProperty('process');
    });

    it('should return valid version string', () => {
      const info = service.getInfo();

      expect(typeof info.version).toBe('string');
      expect(info.version).toMatch(/^\d+\.\d+\.\d+/);
    });

    it('should return valid Node.js version', () => {
      const info = service.getInfo();

      expect(info.nodeVersion).toBe(process.version);
      expect(info.nodeVersion).toMatch(/^v\d+\.\d+\.\d+/);
    });

    it('should return valid startTime in ISO format', () => {
      const info = service.getInfo();

      expect(typeof info.startTime).toBe('string');
      expect(new Date(info.startTime).toISOString()).toBe(info.startTime);
    });

    it('should return non-negative uptime', () => {
      const info = service.getInfo();

      expect(typeof info.uptime).toBe('number');
      expect(info.uptime).toBeGreaterThanOrEqual(0);
    });

    it('should return formatted uptime string', () => {
      const info = service.getInfo();

      expect(typeof info.uptimeFormatted).toBe('string');
      expect(info.uptimeFormatted.length).toBeGreaterThan(0);
    });

    it('should return system information', () => {
      const info = service.getInfo();

      expect(info.system).toHaveProperty('platform');
      expect(info.system).toHaveProperty('arch');
      expect(info.system).toHaveProperty('hostname');
      expect(info.system).toHaveProperty('cpuCount');
      expect(info.system).toHaveProperty('totalMemory');
      expect(info.system).toHaveProperty('freeMemory');

      expect(typeof info.system.platform).toBe('string');
      expect(typeof info.system.arch).toBe('string');
      expect(typeof info.system.hostname).toBe('string');
      expect(typeof info.system.cpuCount).toBe('number');
      expect(info.system.cpuCount).toBeGreaterThan(0);
      expect(typeof info.system.totalMemory).toBe('number');
      expect(info.system.totalMemory).toBeGreaterThan(0);
      expect(typeof info.system.freeMemory).toBe('number');
    });

    it('should return process information', () => {
      const info = service.getInfo();

      expect(info.process).toHaveProperty('pid');
      expect(info.process).toHaveProperty('memoryUsage');
      expect(info.process).toHaveProperty('heapUsed');
      expect(info.process).toHaveProperty('heapTotal');

      expect(info.process.pid).toBe(process.pid);
      expect(typeof info.process.memoryUsage).toBe('number');
      expect(info.process.memoryUsage).toBeGreaterThan(0);
      expect(typeof info.process.heapUsed).toBe('number');
      expect(info.process.heapUsed).toBeGreaterThan(0);
      expect(typeof info.process.heapTotal).toBe('number');
      expect(info.process.heapTotal).toBeGreaterThan(0);
    });

    it('should return environment from NODE_ENV', () => {
      const info = service.getInfo();

      expect(info.environment).toBe(process.env.NODE_ENV || 'development');
    });
  });
});
