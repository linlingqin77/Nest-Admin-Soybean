import { Test, TestingModule } from '@nestjs/testing';
import { HealthController } from './health.controller';
import { HealthCheckService, MemoryHealthIndicator, DiskHealthIndicator } from '@nestjs/terminus';
import { PrismaHealthIndicator } from './prisma.health';
import { RedisHealthIndicator } from './redis.health';

describe('HealthController', () => {
  let controller: HealthController;
  let healthCheckService: jest.Mocked<HealthCheckService>;
  let memoryHealthIndicator: jest.Mocked<MemoryHealthIndicator>;
  let diskHealthIndicator: jest.Mocked<DiskHealthIndicator>;
  let prismaHealthIndicator: jest.Mocked<PrismaHealthIndicator>;
  let redisHealthIndicator: jest.Mocked<RedisHealthIndicator>;

  const mockHealthCheckResult = {
    status: 'ok',
    info: {
      database: { status: 'up' },
      redis: { status: 'up' },
      memory_heap: { status: 'up' },
      disk: { status: 'up' },
    },
    error: {},
    details: {
      database: { status: 'up' },
      redis: { status: 'up' },
      memory_heap: { status: 'up' },
      disk: { status: 'up' },
    },
  };

  beforeEach(async () => {
    const mockHealthCheckService = {
      check: jest.fn().mockResolvedValue(mockHealthCheckResult),
    };

    const mockMemoryHealthIndicator = {
      checkHeap: jest.fn().mockResolvedValue({ memory_heap: { status: 'up' } }),
    };

    const mockDiskHealthIndicator = {
      checkStorage: jest.fn().mockResolvedValue({ disk: { status: 'up' } }),
    };

    const mockPrismaHealthIndicator = {
      isHealthy: jest.fn().mockResolvedValue({ database: { status: 'up' } }),
    };

    const mockRedisHealthIndicator = {
      isHealthy: jest.fn().mockResolvedValue({ redis: { status: 'up' } }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        {
          provide: HealthCheckService,
          useValue: mockHealthCheckService,
        },
        {
          provide: MemoryHealthIndicator,
          useValue: mockMemoryHealthIndicator,
        },
        {
          provide: DiskHealthIndicator,
          useValue: mockDiskHealthIndicator,
        },
        {
          provide: PrismaHealthIndicator,
          useValue: mockPrismaHealthIndicator,
        },
        {
          provide: RedisHealthIndicator,
          useValue: mockRedisHealthIndicator,
        },
      
      ],
      }).compile();

    controller = module.get<HealthController>(HealthController);
    healthCheckService = module.get(HealthCheckService);
    memoryHealthIndicator = module.get(MemoryHealthIndicator);
    diskHealthIndicator = module.get(DiskHealthIndicator);
    prismaHealthIndicator = module.get(PrismaHealthIndicator);
    redisHealthIndicator = module.get(RedisHealthIndicator);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('check', () => {
    it('should perform comprehensive health check', async () => {
      const result = await controller.check();

      expect(result.status).toBe('ok');
      expect(healthCheckService.check).toHaveBeenCalled();
    });

    it('should check all health indicators', async () => {
      await controller.check();

      const checkCalls = healthCheckService.check.mock.calls[0][0];
      expect(checkCalls).toHaveLength(4);
    });
  });

  describe('checkLiveness', () => {
    it('should perform liveness probe check', async () => {
      const result = await controller.checkLiveness();

      expect(result.status).toBe('ok');
      expect(healthCheckService.check).toHaveBeenCalled();
    });

    it('should only check memory for liveness', async () => {
      await controller.checkLiveness();

      const checkCalls = healthCheckService.check.mock.calls[0][0];
      expect(checkCalls).toHaveLength(1);
    });
  });

  describe('checkReadiness', () => {
    it('should perform readiness probe check', async () => {
      const result = await controller.checkReadiness();

      expect(result.status).toBe('ok');
      expect(healthCheckService.check).toHaveBeenCalled();
    });

    it('should check database and redis for readiness', async () => {
      await controller.checkReadiness();

      const checkCalls = healthCheckService.check.mock.calls[0][0];
      expect(checkCalls).toHaveLength(2);
    });
  });
});
