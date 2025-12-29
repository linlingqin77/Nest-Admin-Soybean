import { Test, TestingModule } from '@nestjs/testing';
import { SystemConfigService } from './system-config.service';
import { SystemPrismaService } from 'src/common/prisma/system-prisma.service';
import { RedisService } from 'src/module/common/redis/redis.service';

describe('SystemConfigService', () => {
  let service: SystemConfigService;
  let systemPrisma: jest.Mocked<SystemPrismaService>;
  let redis: jest.Mocked<RedisService>;

  const mockSystemPrisma = {
    sysSystemConfig: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SystemConfigService,
        {
          provide: SystemPrismaService,
          useValue: mockSystemPrisma,
        },
        {
          provide: RedisService,
          useValue: {
            get: jest.fn(),
            set: jest.fn(),
            del: jest.fn(),
            keys: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<SystemConfigService>(SystemConfigService);
    systemPrisma = module.get(SystemPrismaService);
    redis = module.get(RedisService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getConfigValue', () => {
    it('should return config value from database', async () => {
      const configKey = 'test.key';
      const mockConfig = { configKey, configValue: 'test value' };
      mockSystemPrisma.sysSystemConfig.findFirst.mockResolvedValue(mockConfig);

      const result = await service.getConfigValue(configKey);

      expect(result).toBe('test value');
      expect(mockSystemPrisma.sysSystemConfig.findFirst).toHaveBeenCalled();
    });

    it('should return null if config not found', async () => {
      const configKey = 'nonexistent.key';
      mockSystemPrisma.sysSystemConfig.findFirst.mockResolvedValue(null);

      const result = await service.getConfigValue(configKey);

      expect(result).toBeNull();
    });
  });

  describe('getConfig', () => {
    it('should return config object', async () => {
      const configKey = 'test.key';
      const mockConfig = { configKey, configValue: 'test value', configName: 'Test' };
      mockSystemPrisma.sysSystemConfig.findFirst.mockResolvedValue(mockConfig);

      const result = await service.getConfig(configKey);

      expect(result).toEqual(mockConfig);
      expect(mockSystemPrisma.sysSystemConfig.findFirst).toHaveBeenCalled();
    });
  });

  describe('getAllConfigs', () => {
    it('should return all configs', async () => {
      const mockConfigs = [
        { configKey: 'key1', configValue: 'value1' },
        { configKey: 'key2', configValue: 'value2' },
      ];
      mockSystemPrisma.sysSystemConfig.findMany.mockResolvedValue(mockConfigs);

      const result = await service.getAllConfigs();

      expect(result).toEqual(mockConfigs);
      expect(mockSystemPrisma.sysSystemConfig.findMany).toHaveBeenCalled();
    });
  });

  describe('refreshCache', () => {
    it('should refresh config cache', async () => {
      redis.del.mockResolvedValue(1);

      await service.refreshCache('test.key');

      expect(redis.del).toHaveBeenCalledWith('system:config:test.key');
      expect(redis.del).toHaveBeenCalledWith('system:config:detail:test.key');
    });

    it('should refresh all configs cache', async () => {
      redis.keys.mockResolvedValue(['system:config:key1', 'system:config:key2']);
      redis.del.mockResolvedValue(2);

      await service.refreshCache();

      expect(redis.keys).toHaveBeenCalledWith('system:config:*');
      expect(redis.del).toHaveBeenCalledWith(['system:config:key1', 'system:config:key2']);
    });
  });
});
