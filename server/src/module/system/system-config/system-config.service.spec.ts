import { Test, TestingModule } from '@nestjs/testing';
import { SystemConfigService } from './system-config.service';
import { SystemPrismaService } from 'src/common/prisma/system-prisma.service';
import { RedisService } from 'src/module/common/redis/redis.service';
import { StatusEnum, DelFlagEnum } from 'src/common/enum/index';

describe('SystemConfigService', () => {
  let service: SystemConfigService;
  let systemPrisma: jest.Mocked<SystemPrismaService>;
  let redis: jest.Mocked<RedisService>;

  const mockConfig = {
    configId: 1,
    configName: '测试配置',
    configKey: 'test.key',
    configValue: 'test value',
    configType: 'Y',
    status: StatusEnum.NORMAL,
    delFlag: DelFlagEnum.NORMAL,
    createBy: 'admin',
    createTime: new Date(),
    updateBy: 'admin',
    updateTime: new Date(),
    remark: null,
  };

  const mockSystemPrisma = {
    sysSystemConfig: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
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

    it('should return null if config value is empty', async () => {
      mockSystemPrisma.sysSystemConfig.findFirst.mockResolvedValue({ ...mockConfig, configValue: '' });

      const result = await service.getConfigValue('test.key');

      // 空字符串会被 || null 转换为 null
      expect(result).toBeNull();
    });
  });

  describe('getConfig', () => {
    it('should return config object', async () => {
      mockSystemPrisma.sysSystemConfig.findFirst.mockResolvedValue(mockConfig);

      const result = await service.getConfig('test.key');

      expect(result).toEqual(mockConfig);
      expect(mockSystemPrisma.sysSystemConfig.findFirst).toHaveBeenCalled();
    });

    it('should return null if config not found', async () => {
      mockSystemPrisma.sysSystemConfig.findFirst.mockResolvedValue(null);

      const result = await service.getConfig('nonexistent.key');

      expect(result).toBeNull();
    });
  });

  describe('getAllConfigs', () => {
    it('should return all configs', async () => {
      const mockConfigs = [mockConfig, { ...mockConfig, configKey: 'key2' }];
      mockSystemPrisma.sysSystemConfig.findMany.mockResolvedValue(mockConfigs);

      const result = await service.getAllConfigs();

      expect(result).toEqual(mockConfigs);
      expect(result).toHaveLength(2);
      expect(mockSystemPrisma.sysSystemConfig.findMany).toHaveBeenCalled();
    });

    it('should return empty array if no configs', async () => {
      mockSystemPrisma.sysSystemConfig.findMany.mockResolvedValue([]);

      const result = await service.getAllConfigs();

      expect(result).toEqual([]);
    });
  });

  describe('getConfigsByType', () => {
    it('should return configs by type', async () => {
      const mockConfigs = [mockConfig];
      mockSystemPrisma.sysSystemConfig.findMany.mockResolvedValue(mockConfigs);

      const result = await service.getConfigsByType('Y');

      expect(result).toEqual(mockConfigs);
      expect(mockSystemPrisma.sysSystemConfig.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            configType: 'Y',
          }),
        })
      );
    });

    it('should return empty array for non-existent type', async () => {
      mockSystemPrisma.sysSystemConfig.findMany.mockResolvedValue([]);

      const result = await service.getConfigsByType('X');

      expect(result).toEqual([]);
    });
  });

  describe('createConfig', () => {
    it('should create a new config', async () => {
      const createData = {
        configName: '新配置',
        configKey: 'new.key',
        configValue: 'new value',
        configType: 'N',
        remark: '测试备注',
        createBy: 'admin',
      };

      mockSystemPrisma.sysSystemConfig.create.mockResolvedValue({
        ...mockConfig,
        ...createData,
      });

      const result = await service.createConfig(createData);

      expect(result.configKey).toBe('new.key');
      expect(mockSystemPrisma.sysSystemConfig.create).toHaveBeenCalled();
    });

    it('should use default createBy if not provided', async () => {
      const createData = {
        configName: '新配置',
        configKey: 'new.key',
        configValue: 'new value',
        configType: 'N',
      };

      mockSystemPrisma.sysSystemConfig.create.mockResolvedValue(mockConfig);

      await service.createConfig(createData);

      expect(mockSystemPrisma.sysSystemConfig.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            createBy: 'system',
          }),
        })
      );
    });
  });

  describe('updateConfig', () => {
    it('should update config value', async () => {
      const updateData = {
        configValue: 'updated value',
        updateBy: 'admin',
      };

      mockSystemPrisma.sysSystemConfig.update.mockResolvedValue({
        ...mockConfig,
        configValue: 'updated value',
      });

      const result = await service.updateConfig('test.key', updateData);

      expect(result.configValue).toBe('updated value');
      expect(mockSystemPrisma.sysSystemConfig.update).toHaveBeenCalledWith({
        where: { configKey: 'test.key' },
        data: expect.objectContaining({
          configValue: 'updated value',
        }),
      });
    });

    it('should update config name', async () => {
      const updateData = {
        configName: '更新后的名称',
      };

      mockSystemPrisma.sysSystemConfig.update.mockResolvedValue({
        ...mockConfig,
        configName: '更新后的名称',
      });

      const result = await service.updateConfig('test.key', updateData);

      expect(result.configName).toBe('更新后的名称');
    });

    it('should update config status', async () => {
      const updateData = {
        status: StatusEnum.DISABLED,
      };

      mockSystemPrisma.sysSystemConfig.update.mockResolvedValue({
        ...mockConfig,
        status: StatusEnum.DISABLED,
      });

      await service.updateConfig('test.key', updateData);

      expect(mockSystemPrisma.sysSystemConfig.update).toHaveBeenCalledWith({
        where: { configKey: 'test.key' },
        data: expect.objectContaining({
          status: StatusEnum.DISABLED,
        }),
      });
    });

    it('should update config remark', async () => {
      const updateData = {
        remark: '新备注',
      };

      mockSystemPrisma.sysSystemConfig.update.mockResolvedValue({
        ...mockConfig,
        remark: '新备注',
      });

      await service.updateConfig('test.key', updateData);

      expect(mockSystemPrisma.sysSystemConfig.update).toHaveBeenCalled();
    });
  });

  describe('deleteConfig', () => {
    it('should soft delete config', async () => {
      mockSystemPrisma.sysSystemConfig.update.mockResolvedValue({
        ...mockConfig,
        delFlag: DelFlagEnum.DELETED,
      });

      const result = await service.deleteConfig('test.key', 'admin');

      expect(result.delFlag).toBe(DelFlagEnum.DELETED);
      expect(mockSystemPrisma.sysSystemConfig.update).toHaveBeenCalledWith({
        where: { configKey: 'test.key' },
        data: expect.objectContaining({
          delFlag: DelFlagEnum.DELETED,
          updateBy: 'admin',
        }),
      });
    });

    it('should use default deleteBy if not provided', async () => {
      mockSystemPrisma.sysSystemConfig.update.mockResolvedValue({
        ...mockConfig,
        delFlag: DelFlagEnum.DELETED,
      });

      await service.deleteConfig('test.key');

      expect(mockSystemPrisma.sysSystemConfig.update).toHaveBeenCalledWith({
        where: { configKey: 'test.key' },
        data: expect.objectContaining({
          updateBy: 'system',
        }),
      });
    });
  });

  describe('batchUpdateConfigs', () => {
    it('should batch update configs', async () => {
      const configs = [
        { configKey: 'key1', configValue: 'value1' },
        { configKey: 'key2', configValue: 'value2' },
      ];

      mockSystemPrisma.sysSystemConfig.update.mockResolvedValue(mockConfig);

      const result = await service.batchUpdateConfigs(configs, 'admin');

      expect(result).toBe(2);
      expect(mockSystemPrisma.sysSystemConfig.update).toHaveBeenCalledTimes(2);
    });

    it('should use default updateBy if not provided', async () => {
      const configs = [{ configKey: 'key1', configValue: 'value1' }];

      mockSystemPrisma.sysSystemConfig.update.mockResolvedValue(mockConfig);

      await service.batchUpdateConfigs(configs);

      expect(mockSystemPrisma.sysSystemConfig.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            updateBy: 'system',
          }),
        })
      );
    });
  });

  describe('refreshCache', () => {
    it('should refresh single config cache', async () => {
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

    it('should not call del if no keys found', async () => {
      redis.keys.mockResolvedValue([]);

      await service.refreshCache();

      expect(redis.keys).toHaveBeenCalledWith('system:config:*');
      expect(redis.del).not.toHaveBeenCalled();
    });

    it('should handle null keys response', async () => {
      redis.keys.mockResolvedValue(null as any);

      await service.refreshCache();

      expect(redis.del).not.toHaveBeenCalled();
    });
  });

  describe('isConfigExists', () => {
    it('should return true if config exists', async () => {
      mockSystemPrisma.sysSystemConfig.count.mockResolvedValue(1);

      const result = await service.isConfigExists('test.key');

      expect(result).toBe(true);
    });

    it('should return false if config does not exist', async () => {
      mockSystemPrisma.sysSystemConfig.count.mockResolvedValue(0);

      const result = await service.isConfigExists('nonexistent.key');

      expect(result).toBe(false);
    });
  });
});
