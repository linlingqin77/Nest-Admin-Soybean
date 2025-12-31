import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from './config.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { RedisService } from 'src/module/common/redis/redis.service';
import { ConfigRepository } from './config.repository';
import { SystemConfigService } from '../system-config/system-config.service';
import { DelFlagEnum } from 'src/common/enum/index';
import { ResponseCode } from 'src/common/response';
import { BusinessException } from 'src/common/exceptions';

describe('ConfigService', () => {
  let service: ConfigService;
  let prisma: PrismaService;
  let redisService: RedisService;
  let configRepo: ConfigRepository;
  let systemConfigService: SystemConfigService;

  const mockConfig = {
    configId: 1,
    tenantId: '000000',
    configName: '主框架页-默认皮肤样式名称',
    configKey: 'sys.index.skinName',
    configValue: 'skin-blue',
    configType: 'Y',
    createBy: 'admin',
    createTime: new Date(),
    updateBy: null,
    updateTime: null,
    remark: '蓝色 skin-blue、绿色 skin-green',
    delFlag: DelFlagEnum.NORMAL,
  };

  const mockConfig2 = {
    ...mockConfig,
    configId: 2,
    configName: '用户管理-账号初始密码',
    configKey: 'sys.user.initPassword',
    configValue: '123456',
    configType: 'N',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ConfigService,
        {
          provide: PrismaService,
          useValue: {
            sysConfig: {
              create: jest.fn(),
              update: jest.fn(),
              updateMany: jest.fn(),
              findMany: jest.fn(),
              findUnique: jest.fn(),
              count: jest.fn(),
            },
            $queryRaw: jest.fn(),
          },
        },
        {
          provide: RedisService,
          useValue: {
            get: jest.fn(),
            set: jest.fn(),
            del: jest.fn(),
            keys: jest.fn().mockResolvedValue([]),
            getClient: jest.fn(() => ({
              get: jest.fn(),
              set: jest.fn(),
              del: jest.fn(),
            })),
          },
        },
        {
          provide: ConfigRepository,
          useValue: {
            findById: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            softDelete: jest.fn(),
            softDeleteBatch: jest.fn(),
            findByConfigKey: jest.fn(),
            findPageWithFilter: jest.fn(),
            findMany: jest.fn(),
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
    prisma = module.get<PrismaService>(PrismaService);
    redisService = module.get<RedisService>(RedisService);
    configRepo = module.get<ConfigRepository>(ConfigRepository);
    systemConfigService = module.get<SystemConfigService>(SystemConfigService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a config', async () => {
      const createDto = {
        configName: '新配置',
        configKey: 'sys.new.config',
        configValue: 'value',
        configType: 'N',
      };

      (configRepo.create as jest.Mock).mockResolvedValue({ configId: 3, ...createDto });

      const result = await service.create(createDto as any);

      expect(result.code).toBe(ResponseCode.SUCCESS);
      expect(configRepo.create).toHaveBeenCalledWith(createDto);
    });
  });

  describe('findAll', () => {
    it('should return paginated config list', async () => {
      const query = {
        pageNum: 1,
        pageSize: 10,
        skip: 0,
        take: 10,
      };

      (configRepo.findPageWithFilter as jest.Mock).mockResolvedValue({
        list: [mockConfig],
        total: 1,
      });

      const result = await service.findAll(query as any);

      expect(result.code).toBe(ResponseCode.SUCCESS);
      expect(result.data.rows).toHaveLength(1);
      expect(result.data.total).toBe(1);
    });

    it('should filter configs by configName', async () => {
      const query = {
        pageNum: 1,
        pageSize: 10,
        skip: 0,
        take: 10,
        configName: '主框架',
      };

      (configRepo.findPageWithFilter as jest.Mock).mockResolvedValue({
        list: [mockConfig],
        total: 1,
      });

      await service.findAll(query as any);

      expect(configRepo.findPageWithFilter).toHaveBeenCalledWith(
        expect.objectContaining({
          configName: { contains: '主框架' },
        }),
        0,
        10,
      );
    });

    it('should filter configs by configKey', async () => {
      const query = {
        pageNum: 1,
        pageSize: 10,
        skip: 0,
        take: 10,
        configKey: 'sys.index',
      };

      (configRepo.findPageWithFilter as jest.Mock).mockResolvedValue({
        list: [mockConfig],
        total: 1,
      });

      await service.findAll(query as any);

      expect(configRepo.findPageWithFilter).toHaveBeenCalledWith(
        expect.objectContaining({
          configKey: { contains: 'sys.index' },
        }),
        0,
        10,
      );
    });

    it('should filter configs by configType', async () => {
      const query = {
        pageNum: 1,
        pageSize: 10,
        skip: 0,
        take: 10,
        configType: 'Y',
      };

      (configRepo.findPageWithFilter as jest.Mock).mockResolvedValue({
        list: [mockConfig],
        total: 1,
      });

      await service.findAll(query as any);

      expect(configRepo.findPageWithFilter).toHaveBeenCalledWith(
        expect.objectContaining({
          configType: 'Y',
        }),
        0,
        10,
      );
    });

    it('should filter configs by date range', async () => {
      const query = {
        pageNum: 1,
        pageSize: 10,
        skip: 0,
        take: 10,
        params: {
          beginTime: '2024-01-01',
          endTime: '2024-12-31',
        },
      };

      (configRepo.findPageWithFilter as jest.Mock).mockResolvedValue({
        list: [mockConfig],
        total: 1,
      });

      await service.findAll(query as any);

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
    it('should return a config by id', async () => {
      (configRepo.findById as jest.Mock).mockResolvedValue(mockConfig);

      const result = await service.findOne(1);

      expect(result.code).toBe(ResponseCode.SUCCESS);
      expect(result.data).toEqual(mockConfig);
    });
  });

  describe('findOneByConfigKey', () => {
    it('should return config value by key', async () => {
      (configRepo.findByConfigKey as jest.Mock).mockResolvedValue(mockConfig);

      const result = await service.findOneByConfigKey('sys.index.skinName');

      expect(result.code).toBe(ResponseCode.SUCCESS);
      expect(result.data).toBe('skin-blue');
    });
  });

  describe('getConfigValue', () => {
    it('should return config value', async () => {
      (configRepo.findByConfigKey as jest.Mock).mockResolvedValue(mockConfig);

      const result = await service.getConfigValue('sys.index.skinName');

      expect(result).toBe('skin-blue');
    });

    it('should return null when config not found', async () => {
      (configRepo.findByConfigKey as jest.Mock).mockResolvedValue(null);

      const result = await service.getConfigValue('non.existent.key');

      expect(result).toBeNull();
    });
  });

  describe('getSystemConfigValue', () => {
    it('should return value from system config service', async () => {
      (systemConfigService.getConfigValue as jest.Mock).mockResolvedValue('true');

      const result = await service.getSystemConfigValue('sys.account.captchaEnabled');

      expect(result).toBe('true');
      expect(systemConfigService.getConfigValue).toHaveBeenCalledWith('sys.account.captchaEnabled');
    });

    it('should fallback to public config when system config not found', async () => {
      (systemConfigService.getConfigValue as jest.Mock).mockResolvedValue(null);
      (prisma.$queryRaw as jest.Mock).mockResolvedValue([{ config_value: 'fallback' }]);

      const result = await service.getSystemConfigValue('sys.account.captchaEnabled');

      expect(result).toBe('fallback');
    });

    it('should return null when no config found', async () => {
      (systemConfigService.getConfigValue as jest.Mock).mockResolvedValue(null);
      (prisma.$queryRaw as jest.Mock).mockResolvedValue([]);

      const result = await service.getSystemConfigValue('non.existent.key');

      expect(result).toBeNull();
    });
  });

  describe('getPublicConfigValue', () => {
    it('should return config value from super tenant', async () => {
      (prisma.$queryRaw as jest.Mock).mockResolvedValue([{ config_value: 'public-value' }]);

      const result = await service.getPublicConfigValue('sys.index.skinName');

      expect(result).toBe('public-value');
    });

    it('should return null when config not found', async () => {
      (prisma.$queryRaw as jest.Mock).mockResolvedValue([]);

      const result = await service.getPublicConfigValue('non.existent.key');

      expect(result).toBeNull();
    });
  });

  describe('update', () => {
    it('should update a config', async () => {
      const updateDto = {
        configId: 1,
        configKey: 'sys.index.skinName',
        configValue: 'skin-green',
      };

      (configRepo.update as jest.Mock).mockResolvedValue({ ...mockConfig, ...updateDto });

      const result = await service.update(updateDto as any);

      expect(result.code).toBe(ResponseCode.SUCCESS);
      expect(configRepo.update).toHaveBeenCalledWith(1, updateDto);
    });
  });

  describe('updateByKey', () => {
    it('should update config by key', async () => {
      const updateDto = {
        configKey: 'sys.index.skinName',
        configValue: 'skin-green',
      };

      (configRepo.findByConfigKey as jest.Mock).mockResolvedValue(mockConfig);
      (configRepo.update as jest.Mock).mockResolvedValue({ ...mockConfig, configValue: 'skin-green' });

      const result = await service.updateByKey(updateDto as any);

      expect(result.code).toBe(ResponseCode.SUCCESS);
      expect(configRepo.update).toHaveBeenCalledWith(1, { configValue: 'skin-green' });
    });

    it('should throw error when config not found', async () => {
      const updateDto = {
        configKey: 'non.existent.key',
        configValue: 'value',
      };

      (configRepo.findByConfigKey as jest.Mock).mockResolvedValue(null);

      await expect(service.updateByKey(updateDto as any)).rejects.toThrow(BusinessException);
    });
  });

  describe('remove', () => {
    it('should soft delete configs', async () => {
      (configRepo.findMany as jest.Mock).mockResolvedValue([mockConfig2]);
      (configRepo.softDeleteBatch as jest.Mock).mockResolvedValue({ count: 1 });

      const result = await service.remove([2]);

      expect(result.code).toBe(ResponseCode.SUCCESS);
      expect(configRepo.softDeleteBatch).toHaveBeenCalledWith([2]);
    });

    it('should throw error when trying to delete built-in config', async () => {
      (configRepo.findMany as jest.Mock).mockResolvedValue([mockConfig]); // configType: 'Y'

      await expect(service.remove([1])).rejects.toThrow(BusinessException);
    });
  });

  describe('resetConfigCache', () => {
    it('should clear and reload config cache', async () => {
      (configRepo.findMany as jest.Mock).mockResolvedValue([mockConfig]);

      const result = await service.resetConfigCache();

      expect(result.code).toBe(ResponseCode.SUCCESS);
      expect(redisService.set).toHaveBeenCalled();
    });
  });

  describe('loadingConfigCache', () => {
    it('should load all configs into cache', async () => {
      (configRepo.findMany as jest.Mock).mockResolvedValue([mockConfig, mockConfig2]);

      await service.loadingConfigCache();

      expect(redisService.set).toHaveBeenCalledTimes(2);
    });
  });
});
