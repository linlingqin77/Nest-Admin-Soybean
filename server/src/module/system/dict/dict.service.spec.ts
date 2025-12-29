import { Test, TestingModule } from '@nestjs/testing';
import { DictService } from './dict.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { RedisService } from 'src/module/common/redis/redis.service';
import { DictTypeRepository, DictDataRepository } from './dict.repository';
import { createPrismaMock } from 'src/test-utils/prisma-mock';
import { DelFlagEnum, StatusEnum } from 'src/common/enum';
import { Status } from '@prisma/client';
import { plainToInstance } from 'class-transformer';
import { ListDictType } from './dto/list-dict-type.dto';
import { ListDictData } from './dto/list-dict-data.dto';

describe('DictService', () => {
  let service: DictService;
  let prisma: jest.Mocked<PrismaService>;
  let redis: jest.Mocked<RedisService>;
  let dictTypeRepo: jest.Mocked<DictTypeRepository>;
  let dictDataRepo: jest.Mocked<DictDataRepository>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DictService,
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
          provide: DictTypeRepository,
          useValue: {
            create: jest.fn(),
            update: jest.fn(),
            findById: jest.fn(),
            findPageWithFilter: jest.fn(),
            findAllForSelect: jest.fn(),
            softDeleteBatch: jest.fn(),
          },
        },
        {
          provide: DictDataRepository,
          useValue: {
            create: jest.fn(),
            update: jest.fn(),
            findById: jest.fn(),
            findByDictType: jest.fn(),
            findPageWithFilter: jest.fn(),
            softDeleteBatch: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<DictService>(DictService);
    prisma = module.get(PrismaService);
    redis = module.get(RedisService);
    dictTypeRepo = module.get(DictTypeRepository);
    dictDataRepo = module.get(DictDataRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createType', () => {
    it('should create dict type successfully', async () => {
      const createDto = {
        dictName: '测试字典',
        dictType: 'test_dict',
        status: Status.NORMAL,
      };

      dictTypeRepo.create.mockResolvedValue(undefined);

      const result = await service.createType(createDto);

      expect(result.code).toBe(200);
      expect(dictTypeRepo.create).toHaveBeenCalledWith(createDto);
    });
  });

  describe('deleteType', () => {
    it('should delete dict types successfully', async () => {
      const dictIds = [1, 2, 3];

      (dictTypeRepo.softDeleteBatch as jest.Mock).mockResolvedValue(3);

      const result = await service.deleteType(dictIds);

      expect(result.code).toBe(200);
      expect(dictTypeRepo.softDeleteBatch).toHaveBeenCalledWith(dictIds);
    });
  });

  describe('updateType', () => {
    it('should update dict type successfully', async () => {
      const updateDto = {
        dictId: 1,
        dictName: '更新字典',
        dictType: 'updated_dict',
      };

      dictTypeRepo.update.mockResolvedValue(undefined);

      const result = await service.updateType(updateDto);

      expect(result.code).toBe(200);
      expect(dictTypeRepo.update).toHaveBeenCalledWith(1, updateDto);
    });
  });

  describe('findAllType', () => {
    it('should return paginated dict type list', async () => {
      const query = plainToInstance(ListDictType, { pageNum: 1, pageSize: 10 });
      const mockData = {
        list: [],
        total: 0,
      };

      dictTypeRepo.findPageWithFilter.mockResolvedValue(mockData);

      const result = await service.findAllType(query);

      expect(result.code).toBe(200);
      expect(result.data.rows).toEqual([]);
      expect(result.data.total).toBe(0);
    });

    it('should filter by dictName', async () => {
      const query = plainToInstance(ListDictType, { dictName: '测试', pageNum: 1, pageSize: 10 });

      dictTypeRepo.findPageWithFilter.mockResolvedValue({ list: [], total: 0 });

      await service.findAllType(query);

      expect(dictTypeRepo.findPageWithFilter).toHaveBeenCalledWith(
        expect.objectContaining({
          dictName: { contains: '测试' },
        }),
        0,
        10,
      );
    });
  });

  describe('findOneType', () => {
    it('should return dict type by id', async () => {
      const mockDict = { 
        dictId: 1, 
        dictName: '测试字典',
        dictType: 'test_dict',
        tenantId: 'tenant1',
        status: Status.NORMAL,
        delFlag: DelFlagEnum.NORMAL,
        createBy: 'admin',
        createTime: new Date(),
        updateBy: 'admin',
        updateTime: new Date(),
        remark: '',
      } as any;

      dictTypeRepo.findById.mockResolvedValue(mockDict);

      const result = await service.findOneType(1);

      expect(result.code).toBe(200);
      expect(result.data).toEqual(mockDict);
    });
  });

  describe('createDictData', () => {
    it('should create dict data successfully', async () => {
      const createDto = {
        dictType: 'test_dict',
        dictLabel: '测试标签',
        dictValue: 'test_value',
        listClass: '',
        cssClass: '',
      } as any;

      dictDataRepo.create.mockResolvedValue(undefined);

      const result = await service.createDictData(createDto);

      expect(result.code).toBe(200);
      expect(dictDataRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          dictType: 'test_dict',
          dictLabel: '测试标签',
          dictValue: 'test_value',
        }),
      );
    });
  });

  describe('deleteDictData', () => {
    it('should delete dict data successfully', async () => {
      const dictIds = [1, 2];

      (dictDataRepo.softDeleteBatch as jest.Mock).mockResolvedValue(2);

      const result = await service.deleteDictData(dictIds);

      expect(result.code).toBe(200);
      expect(dictDataRepo.softDeleteBatch).toHaveBeenCalledWith(dictIds);
    });
  });

  describe('updateDictData', () => {
    it('should update dict data successfully', async () => {
      const updateDto = {
        dictCode: 1,
        dictLabel: '更新标签',
        dictType: 'test_dict',
        dictValue: 'test_value',
        listClass: '',
        cssClass: '',
      } as any;

      dictDataRepo.update.mockResolvedValue(undefined);

      const result = await service.updateDictData(updateDto);

      expect(result.code).toBe(200);
      expect(dictDataRepo.update).toHaveBeenCalledWith(1, updateDto);
    });
  });

  describe('findAllData', () => {
    it('should return paginated dict data list', async () => {
      const query = plainToInstance(ListDictData, { pageNum: 1, pageSize: 10 });

      dictDataRepo.findPageWithFilter.mockResolvedValue({ list: [], total: 0 });

      const result = await service.findAllData(query);

      expect(result.code).toBe(200);
      expect(result.data.rows).toEqual([]);
    });
  });

  describe('findOneDataType', () => {
    it('should return cached dict data', async () => {
      const mockData = [{ dictLabel: '测试', dictValue: 'test' }] as any;

      redis.get.mockResolvedValue(mockData);

      const result = await service.findOneDataType('test_dict');

      expect(result.code).toBe(200);
      expect(result.data).toEqual(mockData);
      expect(redis.get).toHaveBeenCalled();
    });

    it('should fetch from database if cache miss', async () => {
      const mockData = [{ dictLabel: '测试', dictValue: 'test' }] as any;

      redis.get.mockResolvedValue(null);
      (dictDataRepo.findByDictType as jest.Mock).mockResolvedValue(mockData);
      redis.set.mockResolvedValue('OK');

      const result = await service.findOneDataType('test_dict');

      expect(result.code).toBe(200);
      expect(result.data).toEqual(mockData);
      expect(dictDataRepo.findByDictType).toHaveBeenCalledWith('test_dict');
      expect(redis.set).toHaveBeenCalled();
    });
  });

  describe('resetDictCache', () => {
    it('should reset dict cache successfully', async () => {
      redis.keys.mockResolvedValue(['dict:key1', 'dict:key2']);
      redis.del.mockResolvedValue(2);
      (prisma.sysDictData.findMany as jest.Mock).mockResolvedValue([]);

      const result = await service.resetDictCache();

      expect(result.code).toBe(200);
    });
  });

  describe('loadingDictCache', () => {
    it('should load dict data into cache', async () => {
      const mockData = [
        { dictType: 'type1', dictLabel: 'label1', dictValue: 'value1', dictSort: 1 },
        { dictType: 'type1', dictLabel: 'label2', dictValue: 'value2', dictSort: 2 },
        { dictType: 'type2', dictLabel: 'label3', dictValue: 'value3', dictSort: 1 },
      ];

      (prisma.sysDictData.findMany as jest.Mock).mockResolvedValue(mockData);
      redis.set.mockResolvedValue('OK');

      await service.loadingDictCache();

      expect(prisma.sysDictData.findMany).toHaveBeenCalled();
      // 应该为每个 dictType 调用一次 set，这里有 2 个不同的 dictType
      expect(redis.set).toHaveBeenCalled();
    });
  });
});
