import { RedisModule as liaoliaoRedisModule, RedisModuleAsyncOptions } from '@songkeys/nestjs-redis';
import { DynamicModule, Global, Module } from '@nestjs/common';
import { RedisService } from './redis.service';
import { CacheManagerService } from './cache-manager.service';

@Global()
@Module({
  providers: [RedisService, CacheManagerService],
  exports: [RedisService, CacheManagerService],
})
export class RedisModule {
  static forRoot(options: RedisModuleAsyncOptions, isGlobal = true): DynamicModule {
    return {
      module: RedisModule,
      imports: [liaoliaoRedisModule.forRootAsync(options, isGlobal)],
      providers: [RedisService, CacheManagerService],
      exports: [RedisService, CacheManagerService],
    };
  }

  static forRootAsync(options: RedisModuleAsyncOptions, isGlobal = true): DynamicModule {
    return {
      module: RedisModule,
      imports: [liaoliaoRedisModule.forRootAsync(options, isGlobal)],
      providers: [RedisService, CacheManagerService],
      exports: [RedisService, CacheManagerService],
    };
  }
}
