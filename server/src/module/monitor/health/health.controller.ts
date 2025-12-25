import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { HealthCheckService, HealthCheck, MemoryHealthIndicator, DiskHealthIndicator } from '@nestjs/terminus';
import { PrismaHealthIndicator } from './prisma.health';
import { RedisHealthIndicator } from './redis.health';
import { NotRequireAuth } from 'src/module/system/user/user.decorator';

@ApiTags('系统健康检查')
@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private memory: MemoryHealthIndicator,
    private disk: DiskHealthIndicator,
    private prismaHealth: PrismaHealthIndicator,
    private redisHealth: RedisHealthIndicator,
  ) {}

  @Get()
  @HealthCheck()
  @NotRequireAuth()
  @ApiOperation({ summary: '综合健康检查' })
  check() {
    return this.health.check([
      // 数据库检查
      () => this.prismaHealth.isHealthy('database'),

      // Redis 检查
      () => this.redisHealth.isHealthy('redis'),

      // 内存检查 (堆内存不超过 300MB)
      () => this.memory.checkHeap('memory_heap', 300 * 1024 * 1024),

      // 磁盘检查 (使用率不超过 90%)
      () =>
        this.disk.checkStorage('disk', {
          thresholdPercent: 0.9,
          path: process.cwd(),
        }),
    ]);
  }

  @Get('/liveness')
  @HealthCheck()
  @NotRequireAuth()
  @ApiOperation({ summary: '存活探针 (Kubernetes Liveness Probe)' })
  checkLiveness() {
    // 简单的存活检查,应用正在运行即可
    return this.health.check([() => this.memory.checkHeap('memory', 500 * 1024 * 1024)]);
  }

  @Get('/readiness')
  @HealthCheck()
  @NotRequireAuth()
  @ApiOperation({ summary: '就绪探针 (Kubernetes Readiness Probe)' })
  checkReadiness() {
    // 就绪检查,确保依赖服务都可用
    return this.health.check([
      () => this.prismaHealth.isHealthy('database'),
      () => this.redisHealth.isHealthy('redis'),
    ]);
  }
}
