import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { PrismaHealthIndicator } from './prisma.health';
import { RedisHealthIndicator } from './redis.health';
import { PrismaService } from 'src/platform/prisma';
import { RedisService } from 'src/platform/redis/redis.service';

@Module({
  imports: [TerminusModule],
  providers: [PrismaHealthIndicator, RedisHealthIndicator, PrismaService, RedisService],
  exports: [PrismaHealthIndicator, RedisHealthIndicator],
})
export class HealthModule {}
