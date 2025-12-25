import { Injectable } from '@nestjs/common';
import { HealthIndicator, HealthIndicatorResult, HealthCheckError } from '@nestjs/terminus';
import { RedisService } from 'src/module/common/redis/redis.service';

@Injectable()
export class RedisHealthIndicator extends HealthIndicator {
  constructor(private redisService: RedisService) {
    super();
  }

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    try {
      // 执行 PING 命令测试连接
      const result = await this.redisService.getClient().ping();

      if (result === 'PONG') {
        return this.getStatus(key, true, {
          message: 'Redis is healthy',
        });
      }

      throw new HealthCheckError('Redis PING failed', this.getStatus(key, false));
    } catch (error) {
      throw new HealthCheckError(
        'Redis check failed',
        this.getStatus(key, false, {
          message: error.message,
        }),
      );
    }
  }
}
