import { Test, TestingModule } from '@nestjs/testing';
import { DictTypeRepository, DictDataRepository } from './dict.repository';
import { PrismaService } from 'src/prisma/prisma.service';
import { StatusEnum, DelFlagEnum } from 'src/common/enum';

describe('DictTypeRepository', () => {
  let repository: DictTypeRepository;
  let prisma: jest.Mocked<PrismaService>;

  const mockDictType = {
    dictId: 1,
    dictName: '用户性别',
    dictType: 'sys_user_sex',
    status: StatusEnum.NORMAL,
    delFlag: DelFlagEnum.NORMAL,
    createBy: 'admin',
    createTime: new Date(),
    updateBy: 'admin',
    updateTime: new Date(),
    remark: null,
  };

  const mockPrisma = {
    sysDictType: {
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
        DictTypeRepository,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
      ],
    }).compile();

    repository = module.get<DictTypeRepository>(DictTypeRepository);
    prisma = module.get(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findByDictType', () => {
    it('should find dict type by type', async () => {
      mockPrisma.sysDictType.findFirst.mockResolvedValue(mockDictType);

      const result = await repository.findByDictType('sys_user_sex');

      expect(result).toEqual(mockDictType);
    });

    it('should return null if dict type not found', async () => {
      mockPrisma.sysDictType.findFirst.mockResolvedValue(null);

      const result = await repository.findByDictType('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('existsByDictType', () => {
    it('should return true if dict type exists', async () => {
      mockPrisma.sysDictType.count.mockResolvedValue(1);

      const result = await repository.existsByDictType('sys_user_sex');

      expect(result).toBe(true);
    });

    it('should return false if dict type does not exist', async () => {
      mockPrisma.sysDictType.count.mockResolvedValue(0);

      const result = await repository.existsByDictType('nonexistent');

      expect(result).toBe(false);
    });

    it('should exclude specific dict id when checking', async () => {
      mockPrisma.sysDictType.count.mockResolvedValue(0);

      const result = await repository.existsByDictType('sys_user_sex', 1);

      expect(result).toBe(false);
    });
  });

  describe('findPageWithFilter', () => {
    it('should return paginated dict types', async () => {
      const mockDictTypes = [mockDictType];
      mockPrisma.$transaction.mockResolvedValue([mockDictTypes, 1]);

      const result = await repository.findPageWithFilter({}, 0, 10);

      expect(result).toEqual({ list: mockDictTypes, total: 1 });
    });
  });

  describe('findAllForSelect', () => {
    it('should find all dict types for select', async () => {
      mockPrisma.sysDictType.findMany.mockResolvedValue([mockDictType]);

      const result = await repository.findAllForSelect();

      expect(result).toEqual([mockDictType]);
    });
  });

  describe('createMany', () => {
    it('should create multiple dict types', async () => {
      mockPrisma.sysDictType.createMany.mockResolvedValue({ count: 2 });

      const result = await repository.createMany([
        { dictName: 'Type 1', dictType: 'type1' } as any,
        { dictName: 'Type 2', dictType: 'type2' } as any,
      ]);

      expect(result).toEqual({ count: 2 });
    });
  });
});

describe('DictDataRepository', () => {
  let repository: DictDataRepository;
  let prisma: jest.Mocked<PrismaService>;

  const mockDictData = {
    dictCode: 1,
    dictSort: 1,
    dictLabel: '男',
    dictValue: '0',
    dictType: 'sys_user_sex',
    cssClass: null,
    listClass: 'default',
    isDefault: 'Y',
    status: StatusEnum.NORMAL,
    delFlag: DelFlagEnum.NORMAL,
    createBy: 'admin',
    createTime: new Date(),
    updateBy: 'admin',
    updateTime: new Date(),
    remark: null,
  };

  const mockPrisma = {
    sysDictData: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      createMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DictDataRepository,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
      ],
    }).compile();

    repository = module.get<DictDataRepository>(DictDataRepository);
    prisma = module.get(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findByDictType', () => {
    it('should find dict data by type', async () => {
      mockPrisma.sysDictData.findMany.mockResolvedValue([mockDictData]);

      const result = await repository.findByDictType('sys_user_sex');

      expect(result).toEqual([mockDictData]);
    });

    it('should return empty array if no data found', async () => {
      mockPrisma.sysDictData.findMany.mockResolvedValue([]);

      const result = await repository.findByDictType('nonexistent');

      expect(result).toEqual([]);
    });
  });

  describe('existsByDictLabel', () => {
    it('should return true if dict label exists', async () => {
      mockPrisma.sysDictData.count.mockResolvedValue(1);

      const result = await repository.existsByDictLabel('sys_user_sex', '男');

      expect(result).toBe(true);
    });

    it('should return false if dict label does not exist', async () => {
      mockPrisma.sysDictData.count.mockResolvedValue(0);

      const result = await repository.existsByDictLabel('sys_user_sex', '不存在');

      expect(result).toBe(false);
    });

    it('should exclude specific dict code when checking', async () => {
      mockPrisma.sysDictData.count.mockResolvedValue(0);

      const result = await repository.existsByDictLabel('sys_user_sex', '男', 1);

      expect(result).toBe(false);
    });
  });

  describe('findPageWithFilter', () => {
    it('should return paginated dict data', async () => {
      const mockDictDataList = [mockDictData];
      mockPrisma.$transaction.mockResolvedValue([mockDictDataList, 1]);

      const result = await repository.findPageWithFilter({}, 0, 10);

      expect(result).toEqual({ list: mockDictDataList, total: 1 });
    });
  });

  describe('deleteByDictType', () => {
    it('should delete dict data by type', async () => {
      mockPrisma.sysDictData.deleteMany.mockResolvedValue({ count: 3 });

      const result = await repository.deleteByDictType('sys_user_sex');

      expect(result).toBe(3);
    });

    it('should return 0 if no data deleted', async () => {
      mockPrisma.sysDictData.deleteMany.mockResolvedValue({ count: 0 });

      const result = await repository.deleteByDictType('nonexistent');

      expect(result).toBe(0);
    });
  });

  describe('createMany', () => {
    it('should create multiple dict data', async () => {
      mockPrisma.sysDictData.createMany.mockResolvedValue({ count: 2 });

      const result = await repository.createMany([
        { dictLabel: '男', dictValue: '0', dictType: 'sys_user_sex' } as any,
        { dictLabel: '女', dictValue: '1', dictType: 'sys_user_sex' } as any,
      ]);

      expect(result).toEqual({ count: 2 });
    });
  });
});
