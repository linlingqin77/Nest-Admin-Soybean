import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { HealthCheckService, HealthCheck, MemoryHealthIndicator, DiskHealthIndicator } from '@nestjs/terminus';
import { PrismaHealthIndicator } from 'src/common/health/prisma.health';
import { RedisHealthIndicator } from 'src/common/health/redis.health';
import { NotRequireAuth } from 'src/module/system/user/user.decorator';
import { InfoService } from './info.service';

@ApiTags('系统健康检查')
@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private memory: MemoryHealthIndicator,
    private disk: DiskHealthIndicator,
    private prismaHealth: PrismaHealthIndicator,
    private redisHealth: RedisHealthIndicator,
    private infoService: InfoService,
  ) {}

  @Get()
  @HealthCheck()
  @NotRequireAuth()
  @ApiOperation({ summary: '综合健康检查' })
  @ApiResponse({ status: 200, description: '健康检查成功' })
  @ApiResponse({ status: 503, description: '服务不健康' })
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

  @Get('/live')
  @HealthCheck()
  @NotRequireAuth()
  @ApiOperation({ summary: '存活探针 (Kubernetes Liveness Probe)' })
  @ApiResponse({ status: 200, description: '应用存活' })
  @ApiResponse({ status: 503, description: '应用不存活' })
  checkLive() {
    // 简单的存活检查,应用正在运行即可
    return this.health.check([() => this.memory.checkHeap('memory', 500 * 1024 * 1024)]);
  }

  @Get('/liveness')
  @HealthCheck()
  @NotRequireAuth()
  @ApiOperation({ summary: '存活探针 (Kubernetes Liveness Probe) - 别名' })
  @ApiResponse({ status: 200, description: '应用存活' })
  @ApiResponse({ status: 503, description: '应用不存活' })
  checkLiveness() {
    // 简单的存活检查,应用正在运行即可
    return this.health.check([() => this.memory.checkHeap('memory', 500 * 1024 * 1024)]);
  }

  @Get('/ready')
  @HealthCheck()
  @NotRequireAuth()
  @ApiOperation({ summary: '就绪探针 (Kubernetes Readiness Probe)' })
  @ApiResponse({ status: 200, description: '应用就绪' })
  @ApiResponse({ status: 503, description: '应用未就绪' })
  checkReady() {
    // 就绪检查,确保依赖服务都可用
    return this.health.check([
      () => this.prismaHealth.isHealthy('database'),
      () => this.redisHealth.isHealthy('redis'),
    ]);
  }

  @Get('/readiness')
  @HealthCheck()
  @NotRequireAuth()
  @ApiOperation({ summary: '就绪探针 (Kubernetes Readiness Probe) - 别名' })
  @ApiResponse({ status: 200, description: '应用就绪' })
  @ApiResponse({ status: 503, description: '应用未就绪' })
  checkReadiness() {
    // 就绪检查,确保依赖服务都可用
    return this.health.check([
      () => this.prismaHealth.isHealthy('database'),
      () => this.redisHealth.isHealthy('redis'),
    ]);
  }

  @Get('/info')
  @NotRequireAuth()
  @ApiOperation({ summary: '应用信息' })
  @ApiResponse({ status: 200, description: '返回应用信息' })
  getInfo() {
    return this.infoService.getInfo();
  }
}
