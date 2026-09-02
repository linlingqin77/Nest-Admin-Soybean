/**
 * @file Health Controller Unit Tests
 * @description Migrated from src/modules/health/health.controller.spec.ts
 */
import { Test, TestingModule } from '@nestjs/testing';
import { HealthController } from '@/modules/health/health.controller';
import { DiskHealthIndicator, HealthCheckService, MemoryHealthIndicator } from '@nestjs/terminus';
import { PrismaHealthIndicator } from '@/core/observability/health/prisma.health';
import { RedisHealthIndicator } from '@/core/observability/health/redis.health';
import { InfoService } from '@/modules/health/info.service';

describe('HealthController', () => {
  let controller: HealthController;
  let healthCheckServiceMock: any;
  let memoryMock: any;
  let diskMock: any;
  let prismaHealthMock: any;
  let redisHealthMock: any;
  let infoServiceMock: any;

  beforeEach(async () => {
    healthCheckServiceMock = {
      check: jest.fn().mockResolvedValue({
        status: 'ok',
        info: {},
        error: {},
        details: {},
      }),
    };

    memoryMock = {
      checkHeap: jest.fn().mockResolvedValue({ memory_heap: { status: 'up' } }),
    };

    diskMock = {
      checkStorage: jest.fn().mockResolvedValue({ disk: { status: 'up' } }),
    };

    prismaHealthMock = {
      isHealthy: jest.fn().mockResolvedValue({ database: { status: 'up' } }),
    };

    redisHealthMock = {
      isHealthy: jest.fn().mockResolvedValue({ redis: { status: 'up' } }),
    };

    infoServiceMock = {
      getInfo: jest.fn().mockReturnValue({
        name: 'nest-admin',
        version: '1.0.0',
      }),
    };

    const modules: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        { provide: HealthCheckService, useValue: healthCheckServiceMock },
        { provide: MemoryHealthIndicator, useValue: memoryMock },
        { provide: DiskHealthIndicator, useValue: diskMock },
        { provide: PrismaHealthIndicator, useValue: prismaHealthMock },
        { provide: RedisHealthIndicator, useValue: redisHealthMock },
        { provide: InfoService, useValue: infoServiceMock },
      ],
    }).compile();

    controller = modules.get<HealthController>(HealthController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('check', () => {
    it('should perform comprehensive health check', async () => {
      const result = await controller.check();

      expect(result.status).toBe('ok');
      expect(healthCheckServiceMock.check).toHaveBeenCalled();
    });
  });

  describe('checkLive', () => {
    it('should perform liveness check', async () => {
      const result = await controller.checkLive();

      expect(result.status).toBe('ok');
      expect(healthCheckServiceMock.check).toHaveBeenCalled();
    });
  });

  describe('checkLiveness', () => {
    it('should perform liveness check (alias)', async () => {
      const result = await controller.checkLiveness();

      expect(result.status).toBe('ok');
      expect(healthCheckServiceMock.check).toHaveBeenCalled();
    });
  });

  describe('checkReady', () => {
    it('should perform readiness check', async () => {
      const result = await controller.checkReady();

      expect(result.status).toBe('ok');
      expect(healthCheckServiceMock.check).toHaveBeenCalled();
    });
  });

  describe('checkReadiness', () => {
    it('should perform readiness check (alias)', async () => {
      const result = await controller.checkReadiness();

      expect(result.status).toBe('ok');
      expect(healthCheckServiceMock.check).toHaveBeenCalled();
    });
  });

  describe('getInfo', () => {
    it('should return application info', () => {
      const result = controller.getInfo();

      expect(result).toHaveProperty('name');
      expect(result).toHaveProperty('version');
      expect(infoServiceMock.getInfo).toHaveBeenCalled();
    });
  });
});
