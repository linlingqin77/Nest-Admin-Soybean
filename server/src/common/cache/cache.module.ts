import { Module, Global } from '@nestjs/common';
import { MultiLevelCacheService } from './multi-level-cache.service';

/**
 * 缓存模块
 *
 * 提供多级缓存服务，包括：
 * - L1: 本地内存缓存（node-cache）
 * - L2: Redis 分布式缓存
 *
 * 使用 @Global() 装饰器使其在整个应用中可用
 *
 * 注意：RedisModule 已经是全局模块，无需在此导入
 */
@Global()
@Module({
  providers: [MultiLevelCacheService],
  exports: [MultiLevelCacheService],
})
export class CacheModule {}
