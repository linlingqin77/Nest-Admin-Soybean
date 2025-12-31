import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { HttpModule } from '@nestjs/axios';
import { HealthController } from './health.controller';
import { InfoController } from './info.controller';
import { PrismaHealthIndicator } from 'src/common/health/prisma.health';
import { RedisHealthIndicator } from 'src/common/health/redis.health';
import { InfoService } from './info.service';

/**
 * 健康检查模块
 * 提供完整的健康检查端点:
 * - /health - 综合健康检查
 * - /health/live - 存活探针
 * - /health/ready - 就绪探针
 * - /info - 应用信息
 */
@Module({
  imports: [TerminusModule, HttpModule],
  controllers: [HealthController, InfoController],
  providers: [PrismaHealthIndicator, RedisHealthIndicator, InfoService],
  exports: [InfoService],
})
export class HealthModule {}
