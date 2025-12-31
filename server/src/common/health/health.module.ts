import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { HttpModule } from '@nestjs/axios';
import { PrismaHealthIndicator } from './prisma.health';
import { RedisHealthIndicator } from './redis.health';

/**
 * 健康检查模块
 * 提供 Prisma 和 Redis 健康检查指示器
 * 
 * 使用方式:
 * 1. 在需要健康检查的模块中导入 HealthModule
 * 2. 注入 PrismaHealthIndicator 和 RedisHealthIndicator
 * 3. 在 HealthController 中使用这些指示器
 */
@Module({
  imports: [TerminusModule, HttpModule],
  providers: [PrismaHealthIndicator, RedisHealthIndicator],
  exports: [TerminusModule, PrismaHealthIndicator, RedisHealthIndicator],
})
export class HealthModule {}
