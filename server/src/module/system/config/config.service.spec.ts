import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from './config.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { RedisService } from 'src/module/common/redis/redis.service';
import { ConfigRepository } from './config.repository';
import { SystemConfigService } from '../system-config/system-config.service';
import { createPrismaMock } from 'src/test-utils/prisma-mock';
import { ConfigFactory } from 'src/test-utils';
import { DelFlagEnum } from 'src/common/enum';
import { BusinessException } from 'src/common/exceptions';

describe('ConfigService', () => {
  let service: ConfigService;
  let prisma: jest.Mocked<PrismaService>;
  let redis: jest.Mocked<RedisService>;
  let configRepo: jest.Mocked<ConfigRepository>;
  let systemConfigService: jest.Mocked<SystemConfigService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ConfigService,
        {
          provide: PrismaService,
          useValue: createPrismaMock(),
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
        {
          provide: ConfigRepository,
          useValue: {
            create: jest.fn(),
            findPageWithFilter: jest.fn(),
            findById: jest.fn(),
            findByConfigKey: jest.fn(),
            findMany: jest.fn(),
            update: jest.fn(),
            softDeleteBatch: jest.fn(),
          },
        },
        {
          provide: SystemConfigService,
          useValue: {
            getConfigValue: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<ConfigService>(ConfigService);
    prisma = module.get(PrismaService);
    redis = module.get(RedisService);
    configRepo = module.get(ConfigRepository);
    systemConfigService = module.get(SystemConfigService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a config successfully', async () => {
      const createDto = {
        configName: '测试配置',
        configKey: 'test.key',
        configValue: 'test_value',
        configType: 'N',
      };

      configRepo.create.mockResolvedValue(undefined);

      const result = await service.create(createDto);

      expect(result.code).toBe(200);
      expect(configRepo.create).toHaveBeenCalledWith(createDto);
    });
  });

  describe('findAll', () => {
    it('should return paginated config list', async () => {
      const mockConfigs = ConfigFactory.createMany(3);
      const query = { skip: 0, take: 10 } as any;

      configRepo.findPageWithFilter.mockResolvedValue({
        list: mockConfigs,
        total: 3,
      });

      const result = await service.findAll(query);

      expect(result.code).toBe(200);
      expect(result.data.rows).toHaveLength(3);
      expect(result.data.total).toBe(3);
      expect(configRepo.findPageWithFilter).toHaveBeenCalledWith(
        { delFlag: DelFlagEnum.NORMAL },
        0,
        10,
      );
    });

    it('should filter by configName', async () => {
      const mockConfigs = ConfigFactory.createMany(1);
      const query = { configName: '测试', skip: 0, take: 10 } as any;

      configRepo.findPageWithFilter.mockResolvedValue({
        list: mockConfigs,
        total: 1,
      });

      const result = await service.findAll(query);

      expect(result.code).toBe(200);
      expect(configRepo.findPageWithFilter).toHaveBeenCalledWith(
        expect.objectContaining({
          configName: { contains: '测试' },
        }),
        0,
        10,
      );
    });

    it('should filter by configKey', async () => {
      const mockConfigs = ConfigFactory.createMany(1);
      const query = { configKey: 'test.key', skip: 0, take: 10 } as any;

      configRepo.findPageWithFilter.mockResolvedValue({
        list: mockConfigs,
        total: 1,
      });

      const result = await service.findAll(query);

      expect(result.code).toBe(200);
      expect(configRepo.findPageWithFilter).toHaveBeenCalledWith(
        expect.objectContaining({
          configKey: { contains: 'test.key' },
        }),
        0,
        10,
      );
    });

    it('should filter by configType', async () => {
      const mockConfigs = ConfigFactory.createMany(1);
      const query = { configType: 'Y', skip: 0, take: 10 } as any;

      configRepo.findPageWithFilter.mockResolvedValue({
        list: mockConfigs,
        total: 1,
      });

      const result = await service.findAll(query);

      expect(result.code).toBe(200);
      expect(configRepo.findPageWithFilter).toHaveBeenCalledWith(
        expect.objectContaining({
          configType: 'Y',
        }),
        0,
        10,
      );
    });

    it('should filter by date range', async () => {
      const mockConfigs = ConfigFactory.createMany(1);
      const query = {
        params: {
          beginTime: '2024-01-01',
          endTime: '2024-12-31',
        },
        skip: 0,
        take: 10,
      } as any;

      configRepo.findPageWithFilter.mockResolvedValue({
        list: mockConfigs,
        total: 1,
      });

      const result = await service.findAll(query);

      expect(result.code).toBe(200);
      expect(configRepo.findPageWithFilter).toHaveBeenCalledWith(
        expect.objectContaining({
          createTime: {
            gte: expect.any(Date),
            lte: expect.any(Date),
          },
        }),
        0,
        10,
      );
    });
  });

  describe('findOne', () => {
    it('should return a single config by id', async () => {
      const mockConfig = ConfigFactory.create();
      configRepo.findById.mockResolvedValue(mockConfig);

      const result = await service.findOne(1);

      expect(result.code).toBe(200);
      expect(result.data).toEqual(mockConfig);
      expect(configRepo.findById).toHaveBeenCalledWith(1);
    });
  });

  describe('findOneByConfigKey', () => {
    it('should return config value by key', async () => {
      const mockConfig = ConfigFactory.create({ configValue: 'test_value' });
      configRepo.findByConfigKey.mockResolvedValue(mockConfig);

      const result = await service.findOneByConfigKey('test.key');

      expect(result.code).toBe(200);
      expect(result.data).toBe('test_value');
    });
  });

  describe('getConfigValue', () => {
    it('should return config value from cache', async () => {
      const mockConfig = ConfigFactory.create({ configValue: 'cached_value' });
      configRepo.findByConfigKey.mockResolvedValue(mockConfig);

      const result = await service.getConfigValue('test.key');

      expect(result).toBe('cached_value');
      expect(configRepo.findByConfigKey).toHaveBeenCalledWith('test.key');
    });

    it('should return null if config not found', async () => {
      configRepo.findByConfigKey.mockResolvedValue(null);

      const result = await service.getConfigValue('nonexistent.key');

      expect(result).toBeNull();
    });
  });

  describe('getSystemConfigValue', () => {
    it('should return value from system config service', async () => {
      systemConfigService.getConfigValue.mockResolvedValue('system_value');

      const result = await service.getSystemConfigValue('test.key');

      expect(result).toBe('system_value');
      expect(systemConfigService.getConfigValue).toHaveBeenCalledWith('test.key');
    });

    it('should fallback to public config if system config returns null', async () => {
      systemConfigService.getConfigValue.mockResolvedValue(null);
      (prisma.$queryRaw as jest.Mock).mockResolvedValue([{ config_value: 'public_value' }]);

      const result = await service.getSystemConfigValue('test.key');

      expect(result).toBe('public_value');
    });
  });

  describe('getPublicConfigValue', () => {
    it('should return public config value', async () => {
      (prisma.$queryRaw as jest.Mock).mockResolvedValue([{ config_value: 'public_value' }]);

      const result = await service.getPublicConfigValue('test.key');

      expect(result).toBe('public_value');
    });

    it('should return null if public config not found', async () => {
      (prisma.$queryRaw as jest.Mock).mockResolvedValue([]);

      const result = await service.getPublicConfigValue('nonexistent.key');

      expect(result).toBeNull();
    });
  });

  describe('update', () => {
    it('should update config successfully', async () => {
      const updateDto = {
        configId: 1,
        configName: 'Test Config',
        configKey: 'test.key',
        configValue: 'new_value',
        configType: 'N',
      };

      configRepo.update.mockResolvedValue(undefined);

      const result = await service.update(updateDto as any);

      expect(result.code).toBe(200);
      expect(configRepo.update).toHaveBeenCalledWith(1, updateDto);
    });
  });

  describe('updateByKey', () => {
    it('should update config by key successfully', async () => {
      const mockConfig = ConfigFactory.create({ configId: 1 });
      const updateDto = {
        configId: 1,
        configName: 'Test Config',
        configKey: 'test.key',
        configValue: 'new_value',
        configType: 'Y',
      };

      configRepo.findByConfigKey.mockResolvedValue(mockConfig);
      configRepo.update.mockResolvedValue(undefined);

      const result = await service.updateByKey(updateDto);

      expect(result.code).toBe(200);
      expect(configRepo.findByConfigKey).toHaveBeenCalledWith('test.key');
      expect(configRepo.update).toHaveBeenCalledWith(1, {
        configValue: 'new_value',
      });
    });

    it('should throw error if config not found', async () => {
      const updateDto = {
        configId: 1,
        configName: 'Test Config',
        configKey: 'nonexistent.key',
        configValue: 'new_value',
        configType: 'Y',
      };

      configRepo.findByConfigKey.mockResolvedValue(null);

      await expect(service.updateByKey(updateDto)).rejects.toThrow(BusinessException);
    });
  });

  describe('remove', () => {
    it('should remove configs successfully', async () => {
      const configIds = [1, 2, 3];
      const mockConfigs = [
        { 
          configId: 1,
          configType: 'N' as any, 
          configKey: 'test.key1',
          tenantId: '000000',
          status: 'NORMAL' as any,
          delFlag: 'NORMAL' as any,
          createBy: 'admin',
          createTime: new Date(),
          updateBy: 'admin',
          updateTime: new Date(),
          remark: '',
          configName: 'Test Config 1',
          configValue: 'value1',
        },
        { 
          configId: 2,
          configType: 'N' as any, 
          configKey: 'test.key2',
          tenantId: '000000',
          status: 'NORMAL' as any,
          delFlag: 'NORMAL' as any,
          createBy: 'admin',
          createTime: new Date(),
          updateBy: 'admin',
          updateTime: new Date(),
          remark: '',
          configName: 'Test Config 2',
          configValue: 'value2',
        },
      ];

      configRepo.findMany.mockResolvedValue(mockConfigs);
      configRepo.softDeleteBatch.mockResolvedValue(2);

      const result = await service.remove(configIds);

      expect(result.code).toBe(200);
      expect(configRepo.softDeleteBatch).toHaveBeenCalledWith(configIds);
    });

    it('should throw error when trying to delete system config', async () => {
      const configIds = [1, 2];
      const mockConfigs = [
        { 
          configId: 1,
          configType: 'YES' as any, 
          configKey: 'sys.config',
          tenantId: '000000',
          status: 'NORMAL' as any,
          delFlag: 'NORMAL' as any,
          createBy: 'admin',
          createTime: new Date(),
          updateBy: 'admin',
          updateTime: new Date(),
          remark: '',
          configName: 'System Config',
          configValue: 'value',
        },
        { 
          configId: 2,
          configType: 'NO' as any, 
          configKey: 'test.key',
          tenantId: '000000',
          status: 'NORMAL' as any,
          delFlag: 'NORMAL' as any,
          createBy: 'admin',
          createTime: new Date(),
          updateBy: 'admin',
          updateTime: new Date(),
          remark: '',
          configName: 'Test Config',
          configValue: 'value',
        },
      ];

      configRepo.findMany.mockResolvedValue(mockConfigs);

      await expect(service.remove(configIds)).rejects.toThrow(BusinessException);
    });
  });

  describe('resetConfigCache', () => {
    it('should reset config cache successfully', async () => {
      const mockConfigs = ConfigFactory.createMany(3);
      configRepo.findMany.mockResolvedValue(mockConfigs);
      redis.keys.mockResolvedValue(['config:key1', 'config:key2']);
      redis.del.mockResolvedValue(2);
      redis.set.mockResolvedValue('OK');

      const result = await service.resetConfigCache();

      expect(result.code).toBe(200);
      expect(configRepo.findMany).toHaveBeenCalled();
      expect(redis.set).toHaveBeenCalledTimes(3);
    });
  });

  describe('loadingConfigCache', () => {
    it('should load all configs into cache', async () => {
      const mockConfigs = ConfigFactory.createMany(3);
      configRepo.findMany.mockResolvedValue(mockConfigs);
      redis.set.mockResolvedValue('OK');

      await service.loadingConfigCache();

      expect(configRepo.findMany).toHaveBeenCalledWith({
        where: { delFlag: DelFlagEnum.NORMAL },
      });
      expect(redis.set).toHaveBeenCalledTimes(3);
    });

    it('should skip configs without configKey', async () => {
      const mockConfigs = [
        ConfigFactory.create({ configKey: 'test.key1' }),
        ConfigFactory.create({ configKey: null }),
        ConfigFactory.create({ configKey: 'test.key2' }),
      ];
      configRepo.findMany.mockResolvedValue(mockConfigs);
      redis.set.mockResolvedValue('OK');

      await service.loadingConfigCache();

      expect(redis.set).toHaveBeenCalledTimes(2);
    });
  });
});
