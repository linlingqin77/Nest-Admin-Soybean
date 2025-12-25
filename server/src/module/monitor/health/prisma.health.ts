import { Injectable } from '@nestjs/common';
import { HealthIndicator, HealthIndicatorResult, HealthCheckError } from '@nestjs/terminus';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class PrismaHealthIndicator extends HealthIndicator {
  constructor(private prisma: PrismaService) {
    super();
  }

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    try {
      // 执行简单查询测试连接
      await this.prisma.$queryRaw`SELECT 1`;

      return this.getStatus(key, true, {
        message: 'PostgreSQL is healthy',
      });
    } catch (error) {
      throw new HealthCheckError(
        'PostgreSQL check failed',
        this.getStatus(key, false, {
          message: error.message,
        }),
      );
    }
  }
}
