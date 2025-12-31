import { Test, TestingModule } from '@nestjs/testing';
import { RedisHealthIndicator } from './redis.health';
import { RedisService } from 'src/module/common/redis/redis.service';
import { HealthCheckError } from '@nestjs/terminus';

describe('RedisHealthIndicator', () => {
  let indicator: RedisHealthIndicator;
  let redisService: jest.Mocked<RedisService>;
  let mockRedisClient: { ping: jest.Mock };

  beforeEach(async () => {
    mockRedisClient = {
      ping: jest.fn(),
    };

    const mockRedisService = {
      getClient: jest.fn().mockReturnValue(mockRedisClient),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RedisHealthIndicator,
        {
          provide: RedisService,
          useValue: mockRedisService,
        },
      ],
    }).compile();

    indicator = module.get<RedisHealthIndicator>(RedisHealthIndicator);
    redisService = module.get(RedisService);
  });

  it('should be defined', () => {
    expect(indicator).toBeDefined();
  });

  describe('isHealthy', () => {
    it('should return healthy status when Redis responds with PONG', async () => {
      mockRedisClient.ping.mockResolvedValue('PONG');

      const result = await indicator.isHealthy('redis');

      expect(result).toEqual({
        redis: {
          status: 'up',
          message: 'Redis is healthy',
          responseTime: expect.stringMatching(/^\d+ms$/),
        },
      });
    });

    it('should throw HealthCheckError when Redis does not respond with PONG', async () => {
      mockRedisClient.ping.mockResolvedValue('ERROR');

      await expect(indicator.isHealthy('redis')).rejects.toThrow(HealthCheckError);
    });

    it('should throw HealthCheckError when Redis connection fails', async () => {
      const error = new Error('Connection refused');
      mockRedisClient.ping.mockRejectedValue(error);

      await expect(indicator.isHealthy('redis')).rejects.toThrow(HealthCheckError);
    });

    it('should include error message in health check error', async () => {
      const errorMessage = 'Redis connection timeout';
      mockRedisClient.ping.mockRejectedValue(new Error(errorMessage));

      try {
        await indicator.isHealthy('redis');
        fail('Expected HealthCheckError to be thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(HealthCheckError);
        expect(error.causes).toEqual({
          redis: {
            status: 'down',
            message: errorMessage,
          },
        });
      }
    });
  });
});
