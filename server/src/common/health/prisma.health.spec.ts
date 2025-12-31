import { Test, TestingModule } from '@nestjs/testing';
import { PrismaHealthIndicator } from './prisma.health';
import { PrismaService } from 'src/prisma/prisma.service';
import { HealthCheckError } from '@nestjs/terminus';

describe('PrismaHealthIndicator', () => {
  let indicator: PrismaHealthIndicator;
  let prismaService: jest.Mocked<PrismaService>;

  beforeEach(async () => {
    const mockPrismaService = {
      $queryRaw: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PrismaHealthIndicator,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    indicator = module.get<PrismaHealthIndicator>(PrismaHealthIndicator);
    prismaService = module.get(PrismaService);
  });

  it('should be defined', () => {
    expect(indicator).toBeDefined();
  });

  describe('isHealthy', () => {
    it('should return healthy status when database is connected', async () => {
      prismaService.$queryRaw.mockResolvedValue([{ '?column?': 1 }]);

      const result = await indicator.isHealthy('database');

      expect(result).toEqual({
        database: {
          status: 'up',
          message: 'PostgreSQL is healthy',
          responseTime: expect.stringMatching(/^\d+ms$/),
        },
      });
    });

    it('should throw HealthCheckError when database connection fails', async () => {
      const error = new Error('Connection refused');
      prismaService.$queryRaw.mockRejectedValue(error);

      await expect(indicator.isHealthy('database')).rejects.toThrow(HealthCheckError);
    });

    it('should include error message in health check error', async () => {
      const errorMessage = 'Database connection timeout';
      prismaService.$queryRaw.mockRejectedValue(new Error(errorMessage));

      try {
        await indicator.isHealthy('database');
        fail('Expected HealthCheckError to be thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(HealthCheckError);
        expect(error.causes).toEqual({
          database: {
            status: 'down',
            message: errorMessage,
          },
        });
      }
    });
  });
});
