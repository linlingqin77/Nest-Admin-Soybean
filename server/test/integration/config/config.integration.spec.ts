/**
 * 配置模块集成测试
 * _Requirements: 8.6, 8.7, 8.8_
 */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe, VersioningType } from '@nestjs/common';
import { AppModule } from 'src/app.module';
import { PrismaService } from 'src/prisma/prisma.service';
import { RedisService } from 'src/module/common/redis/redis.service';
import { ConfigService } from 'src/module/system/config/config.service';
import { CacheEnum, DelFlagEnum } from 'src/common/enum/index';

describe('Config Integration Tests', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let redisService: RedisService;
  let configService: ConfigService;
  const existingConfigKey = 'sys.index.skinName';

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1', prefix: 'v' });
    app.useGlobalPipes(new ValidationPipe({
      transform: true, whitelist: true, transformOptions: { enableImplicitConversion: true },
    }));

    await app.init();
    prisma = app.get(PrismaService);
    redisService = app.get(RedisService);
    configService = app.get(ConfigService);
  }, 60000);

  afterAll(async () => {
    await app.close();
  });

  describe('Config Cache Integration', () => {
    it('should cache config value after first retrieval', async () => {
      await redisService.del(`${CacheEnum.SYS_CONFIG_KEY}${existingConfigKey}`);
      const value1 = await configService.getConfigValue(existingConfigKey);
      expect(value1).toBeDefined();
      const cachedValue = await redisService.get(`${CacheEnum.SYS_CONFIG_KEY}${existingConfigKey}`);
      expect(cachedValue).toBe(value1);
    });

    it('should refresh cache when resetConfigCache is called', async () => {
      const originalConfig = await prisma.sysConfig.findFirst({
        where: { configKey: existingConfigKey, delFlag: DelFlagEnum.NORMAL },
      });
      expect(originalConfig).toBeDefined();
      await redisService.set(`${CacheEnum.SYS_CONFIG_KEY}${existingConfigKey}`, 'stale-cached-value');
      const result = await configService.resetConfigCache();
      expect(result.code).toBe(200);
      const refreshedCached = await redisService.get(`${CacheEnum.SYS_CONFIG_KEY}${existingConfigKey}`);
      expect(refreshedCached).toBe(originalConfig!.configValue);
    });

    it('should load all configs into cache', async () => {
      await redisService.del(`${CacheEnum.SYS_CONFIG_KEY}${existingConfigKey}`);
      await configService.loadingConfigCache();
      const cachedValue = await redisService.get(`${CacheEnum.SYS_CONFIG_KEY}${existingConfigKey}`);
      expect(cachedValue).toBeDefined();
    });
  });

  describe('Get Config By Key Integration', () => {
    it('should return config value by key', async () => {
      const result = await configService.findOneByConfigKey(existingConfigKey);
      expect(result.code).toBe(200);
      expect(result.data).toBeDefined();
    });

    it('should return null for non-existent key', async () => {
      const result = await configService.findOneByConfigKey('non.existent.key.xyz123');
      expect(result.code).toBe(200);
      expect(result.data).toBeNull();
    });

    it('should return system config value', async () => {
      const result = await configService.getSystemConfigValue('sys.account.captchaEnabled');
      expect(['true', 'false', null]).toContain(result);
    });
  });

  describe('Config List with Filters Integration', () => {
    it('should return paginated config list', async () => {
      const result = await configService.findAll({ pageNum: 1, pageSize: 10, skip: 0, take: 10 } as any);
      expect(result.code).toBe(200);
      expect(result.data).toHaveProperty('rows');
      expect(result.data).toHaveProperty('total');
    });

    it('should filter configs by configKey', async () => {
      const result = await configService.findAll({ pageNum: 1, pageSize: 10, skip: 0, take: 10, configKey: 'sys.index' } as any);
      expect(result.code).toBe(200);
      result.data.rows.forEach((config: any) => {
        expect(config.configKey.toLowerCase()).toContain('sys.index');
      });
    });

    it('should filter configs by configType', async () => {
      const result = await configService.findAll({ pageNum: 1, pageSize: 10, skip: 0, take: 10, configType: 'Y' } as any);
      expect(result.code).toBe(200);
      result.data.rows.forEach((config: any) => {
        expect(config.configType).toBe('Y');
      });
    });
  });

  describe('Config findOne Integration', () => {
    it('should return config by id', async () => {
      const listResult = await configService.findAll({ pageNum: 1, pageSize: 1, skip: 0, take: 1 } as any);
      expect(listResult.data.rows.length).toBeGreaterThan(0);
      const configId = listResult.data.rows[0].configId;
      const result = await configService.findOne(configId);
      expect(result.code).toBe(200);
      expect(result.data.configId).toBe(configId);
    });
  });
});
