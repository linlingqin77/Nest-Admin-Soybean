import { Injectable, Logger } from '@nestjs/common';
import { RedisService } from 'src/module/common/redis/redis.service';
import { PrismaService } from 'src/prisma/prisma.service';

/**
 * 租户功能开关缓存键前缀
 */
const TENANT_FEATURE_CACHE_PREFIX = 'tenant:feature:';

/**
 * 租户功能开关缓存过期时间（秒）
 */
const TENANT_FEATURE_CACHE_TTL = 300; // 5 minutes

/**
 * 功能开关配置接口
 */
export interface FeatureConfig {
  enabled: boolean;
  config?: Record<string, unknown>;
}

/**
 * 租户功能开关服务 (需求 5.1)
 *
 * 支持租户级别功能开关，使用 Redis Hash 存储
 * 提供功能开关的查询、设置、批量操作等功能
 */
@Injectable()
export class FeatureToggleService {
  private readonly logger = new Logger(FeatureToggleService.name);

  constructor(
    private readonly redisService: RedisService,
    private readonly prismaService: PrismaService,
  ) {}

  /**
   * 获取 Redis 缓存键
   */
  private getCacheKey(tenantId: string): string {
    return `${TENANT_FEATURE_CACHE_PREFIX}${tenantId}`;
  }

  /**
   * 检查租户功能是否启用
   *
   * @param tenantId 租户ID
   * @param feature 功能键
   * @returns 功能是否启用
   */
  async isEnabled(tenantId: string, feature: string): Promise<boolean> {
    if (!tenantId || !feature) {
      return false;
    }

    try {
      // 先从 Redis 缓存获取
      const cacheKey = this.getCacheKey(tenantId);
      const cachedValue = await this.redisService.hget(cacheKey, feature);

      if (cachedValue !== null && cachedValue !== undefined) {
        return cachedValue === '1' || cachedValue === 'true';
      }

      // 缓存未命中，从数据库获取
      const dbFeature = await this.prismaService.sysTenantFeature.findUnique({
        where: {
          tenantId_featureKey: {
            tenantId,
            featureKey: feature,
          },
        },
      });

      const enabled = dbFeature?.enabled ?? false;

      // 写入缓存
      await this.redisService.hset(cacheKey, feature, enabled ? '1' : '0');
      // 设置过期时间
      const client = this.redisService.getClient();
      await client.expire(cacheKey, TENANT_FEATURE_CACHE_TTL);

      return enabled;
    } catch (error) {
      this.logger.error(`Failed to check feature ${feature} for tenant ${tenantId}: ${error.message}`);
      return false;
    }
  }

  /**
   * 设置租户功能开关
   *
   * @param tenantId 租户ID
   * @param feature 功能键
   * @param enabled 是否启用
   * @param config 可选的功能配置
   */
  async setFeature(
    tenantId: string,
    feature: string,
    enabled: boolean,
    config?: Record<string, unknown>,
  ): Promise<void> {
    if (!tenantId || !feature) {
      throw new Error('tenantId and feature are required');
    }

    try {
      // 更新数据库
      await this.prismaService.sysTenantFeature.upsert({
        where: {
          tenantId_featureKey: {
            tenantId,
            featureKey: feature,
          },
        },
        update: {
          enabled,
          config: config ? JSON.stringify(config) : null,
          updateTime: new Date(),
        },
        create: {
          tenantId,
          featureKey: feature,
          enabled,
          config: config ? JSON.stringify(config) : null,
        },
      });

      // 更新 Redis 缓存
      const cacheKey = this.getCacheKey(tenantId);
      await this.redisService.hset(cacheKey, feature, enabled ? '1' : '0');

      this.logger.log(`Feature ${feature} set to ${enabled} for tenant ${tenantId}`);
    } catch (error) {
      this.logger.error(`Failed to set feature ${feature} for tenant ${tenantId}: ${error.message}`);
      throw error;
    }
  }

  /**
   * 获取租户所有功能开关状态
   *
   * @param tenantId 租户ID
   * @returns 功能开关状态映射
   */
  async getTenantFeatures(tenantId: string): Promise<Record<string, boolean>> {
    if (!tenantId) {
      return {};
    }

    try {
      // 先尝试从 Redis 获取
      const cacheKey = this.getCacheKey(tenantId);
      const cachedFeatures = await this.redisService.hGetAll(cacheKey);

      if (cachedFeatures && Object.keys(cachedFeatures).length > 0) {
        return Object.fromEntries(
          Object.entries(cachedFeatures).map(([k, v]) => [k, v === '1' || v === 'true']),
        );
      }

      // 从数据库获取
      const dbFeatures = await this.prismaService.sysTenantFeature.findMany({
        where: { tenantId },
      });

      const features: Record<string, boolean> = {};

      for (const feature of dbFeatures) {
        features[feature.featureKey] = feature.enabled;
        // 写入缓存
        await this.redisService.hset(cacheKey, feature.featureKey, feature.enabled ? '1' : '0');
      }

      // 设置过期时间
      if (dbFeatures.length > 0) {
        const client = this.redisService.getClient();
        await client.expire(cacheKey, TENANT_FEATURE_CACHE_TTL);
      }

      return features;
    } catch (error) {
      this.logger.error(`Failed to get features for tenant ${tenantId}: ${error.message}`);
      return {};
    }
  }

  /**
   * 获取功能的详细配置
   *
   * @param tenantId 租户ID
   * @param feature 功能键
   * @returns 功能配置
   */
  async getFeatureConfig(tenantId: string, feature: string): Promise<FeatureConfig | null> {
    if (!tenantId || !feature) {
      return null;
    }

    try {
      const dbFeature = await this.prismaService.sysTenantFeature.findUnique({
        where: {
          tenantId_featureKey: {
            tenantId,
            featureKey: feature,
          },
        },
      });

      if (!dbFeature) {
        return null;
      }

      return {
        enabled: dbFeature.enabled,
        config: dbFeature.config ? JSON.parse(dbFeature.config) : undefined,
      };
    } catch (error) {
      this.logger.error(`Failed to get feature config ${feature} for tenant ${tenantId}: ${error.message}`);
      return null;
    }
  }

  /**
   * 删除租户功能开关
   *
   * @param tenantId 租户ID
   * @param feature 功能键
   */
  async deleteFeature(tenantId: string, feature: string): Promise<void> {
    if (!tenantId || !feature) {
      return;
    }

    try {
      // 从数据库删除
      await this.prismaService.sysTenantFeature.deleteMany({
        where: {
          tenantId,
          featureKey: feature,
        },
      });

      // 从缓存删除
      const cacheKey = this.getCacheKey(tenantId);
      await this.redisService.hdel(cacheKey, feature);

      this.logger.log(`Feature ${feature} deleted for tenant ${tenantId}`);
    } catch (error) {
      this.logger.error(`Failed to delete feature ${feature} for tenant ${tenantId}: ${error.message}`);
      throw error;
    }
  }

  /**
   * 清除租户功能缓存
   *
   * @param tenantId 租户ID
   */
  async clearCache(tenantId: string): Promise<void> {
    if (!tenantId) {
      return;
    }

    try {
      const cacheKey = this.getCacheKey(tenantId);
      await this.redisService.del(cacheKey);
      this.logger.log(`Feature cache cleared for tenant ${tenantId}`);
    } catch (error) {
      this.logger.error(`Failed to clear feature cache for tenant ${tenantId}: ${error.message}`);
    }
  }

  /**
   * 批量设置租户功能开关
   *
   * @param tenantId 租户ID
   * @param features 功能开关映射
   */
  async setFeatures(tenantId: string, features: Record<string, boolean>): Promise<void> {
    if (!tenantId || !features || Object.keys(features).length === 0) {
      return;
    }

    try {
      // 使用事务批量更新数据库
      await this.prismaService.$transaction(
        Object.entries(features).map(([featureKey, enabled]) =>
          this.prismaService.sysTenantFeature.upsert({
            where: {
              tenantId_featureKey: {
                tenantId,
                featureKey,
              },
            },
            update: {
              enabled,
              updateTime: new Date(),
            },
            create: {
              tenantId,
              featureKey,
              enabled,
            },
          }),
        ),
      );

      // 批量更新 Redis 缓存
      const cacheKey = this.getCacheKey(tenantId);
      const cacheData: Record<string, string> = {};
      for (const [featureKey, enabled] of Object.entries(features)) {
        cacheData[featureKey] = enabled ? '1' : '0';
      }
      await this.redisService.hmset(cacheKey, cacheData, TENANT_FEATURE_CACHE_TTL);

      this.logger.log(`Batch set ${Object.keys(features).length} features for tenant ${tenantId}`);
    } catch (error) {
      this.logger.error(`Failed to batch set features for tenant ${tenantId}: ${error.message}`);
      throw error;
    }
  }
}
