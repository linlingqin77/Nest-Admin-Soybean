import { Test, TestingModule } from '@nestjs/testing';
import { ConfigRepository } from './config.repository';
import { PrismaService } from 'src/prisma/prisma.service';
import { StatusEnum, DelFlagEnum } from 'src/common/enum';

describe('ConfigRepository', () => {
  let repository: ConfigRepository;
  let prisma: jest.Mocked<PrismaService>;

  const mockConfig = {
    configId: 1,
    configName: '主框架页-默认皮肤样式名称',
    configKey: 'sys.index.skinName',
    configValue: 'skin-blue',
    configType: 'Y',
    tenantId: '000000',
    status: StatusEnum.NORMAL,
    delFlag: DelFlagEnum.NORMAL,
    createBy: 'admin',
    createTime: new Date(),
    updateBy: 'admin',
    updateTime: new Date(),
    remark: null,
  };

  const mockPrisma = {
    sysConfig: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      createMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ConfigRepository,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
      ],
    }).compile();

    repository = module.get<ConfigRepository>(ConfigRepository);
    prisma = module.get(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findByConfigKey', () => {
    it('should find config by key', async () => {
      mockPrisma.sysConfig.findFirst.mockResolvedValue(mockConfig);

      const result = await repository.findByConfigKey('sys.index.skinName');

      expect(result).toEqual(mockConfig);
    });

    it('should return null if config not found', async () => {
      mockPrisma.sysConfig.findFirst.mockResolvedValue(null);

      const result = await repository.findByConfigKey('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('existsByConfigKey', () => {
    it('should return true if config key exists', async () => {
      mockPrisma.sysConfig.count.mockResolvedValue(1);

      const result = await repository.existsByConfigKey('sys.index.skinName');

      expect(result).toBe(true);
    });

    it('should return false if config key does not exist', async () => {
      mockPrisma.sysConfig.count.mockResolvedValue(0);

      const result = await repository.existsByConfigKey('nonexistent');

      expect(result).toBe(false);
    });

    it('should exclude specific config id when checking', async () => {
      mockPrisma.sysConfig.count.mockResolvedValue(0);

      const result = await repository.existsByConfigKey('sys.index.skinName', 1);

      expect(result).toBe(false);
    });
  });

  describe('findPageWithFilter', () => {
    it('should return paginated configs', async () => {
      const mockConfigs = [mockConfig];
      mockPrisma.$transaction.mockResolvedValue([mockConfigs, 1]);

      const result = await repository.findPageWithFilter({}, 0, 10);

      expect(result).toEqual({ list: mockConfigs, total: 1 });
    });

    it('should apply where conditions', async () => {
      mockPrisma.$transaction.mockResolvedValue([[], 0]);

      const where = { configType: 'Y' as any };
      await repository.findPageWithFilter(where, 0, 10);

      expect(mockPrisma.$transaction).toHaveBeenCalled();
    });
  });

  describe('findByTenantId', () => {
    it('should find configs by tenant id', async () => {
      mockPrisma.sysConfig.findMany.mockResolvedValue([mockConfig]);

      const result = await repository.findByTenantId('000000');

      expect(result).toEqual([mockConfig]);
    });

    it('should return empty array if no configs found', async () => {
      mockPrisma.sysConfig.findMany.mockResolvedValue([]);

      const result = await repository.findByTenantId('nonexistent');

      expect(result).toEqual([]);
    });
  });

  describe('createMany', () => {
    it('should create multiple configs', async () => {
      mockPrisma.sysConfig.createMany.mockResolvedValue({ count: 2 });

      const result = await repository.createMany([
        { configName: 'Config 1', configKey: 'key1', configValue: 'value1' } as any,
        { configName: 'Config 2', configKey: 'key2', configValue: 'value2' } as any,
      ]);

      expect(result).toEqual({ count: 2 });
    });
  });

  describe('inherited methods from SoftDeleteRepository', () => {
    it('should have access to findById', async () => {
      mockPrisma.sysConfig.findFirst.mockResolvedValue(mockConfig);

      const result = await repository.findById(1);

      expect(result).toEqual(mockConfig);
    });

    it('should have access to findAll', async () => {
      mockPrisma.sysConfig.findMany.mockResolvedValue([mockConfig]);

      const result = await repository.findAll();

      expect(result).toEqual([mockConfig]);
    });

    it('should have access to create', async () => {
      mockPrisma.sysConfig.create.mockResolvedValue(mockConfig);

      const result = await repository.create({
        configName: '新配置',
        configKey: 'new.key',
        configValue: 'new value',
      } as any);

      expect(result).toEqual(mockConfig);
    });

    it('should have access to update', async () => {
      const updatedConfig = { ...mockConfig, configValue: 'Updated' };
      mockPrisma.sysConfig.update.mockResolvedValue(updatedConfig);

      const result = await repository.update(1, { configValue: 'Updated' });

      expect(result.configValue).toBe('Updated');
    });

    it('should have access to softDelete', async () => {
      const deletedConfig = { ...mockConfig, delFlag: DelFlagEnum.DELETED };
      mockPrisma.sysConfig.update.mockResolvedValue(deletedConfig);

      const result = await repository.softDelete(1);

      expect(result.delFlag).toBe(DelFlagEnum.DELETED);
    });
  });
});
