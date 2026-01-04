/**
 * 字典服务单元测试
 *
 * @description
 * 测试DictService的核心业务逻辑
 * - 字典类型CRUD方法
 * - 字典数据CRUD方法
 * - 字典缓存逻辑
 *
 * _Requirements: 6.2, 6.4, 6.5, 6.7, 6.8, 6.9_
 */

import { DictService } from './dict.service';
import { createPrismaMock, PrismaMock } from 'src/test-utils/prisma-mock';
import { CacheEnum, DelFlagEnum } from 'src/common/enum/index';

describe('DictService', () => {
  let prisma: PrismaMock;
  let service: DictService;

  const redisService = {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    keys: jest.fn(),
  };

  const dictTypeRepo = {
    create: jest.fn(),
    update: jest.fn(),
    softDeleteBatch: jest.fn(),
    findById: jest.fn(),
    findPageWithFilter: jest.fn(),
    findAllForSelect: jest.fn(),
  };

  const dictDataRepo = {
    create: jest.fn(),
    update: jest.fn(),
    softDeleteBatch: jest.fn(),
    findById: jest.fn(),
    findPageWithFilter: jest.fn(),
    findByDictType: jest.fn(),
  };

  beforeEach(() => {
    prisma = createPrismaMock();
    service = new DictService(
      prisma,
      redisService as any,
      dictTypeRepo as any,
      dictDataRepo as any,
    );
    jest.clearAllMocks();
  });

  describe('字典类型CRUD', () => {
    describe('createType', () => {
      it('should create dict type successfully', async () => {
        const createDto = {
          dictName: '测试字典',
          dictType: 'test_dict',
          status: '0',
        };

        dictTypeRepo.create.mockResolvedValue({ dictId: 1, ...createDto });

        const result = await service.createType(createDto as any);

        expect(result.code).toBe(200);
        expect(dictTypeRepo.create).toHaveBeenCalledWith(createDto);
      });
    });

    describe('updateType', () => {
      it('should update dict type successfully', async () => {
        const updateDto = {
          dictId: 1,
          dictName: '更新后的字典',
          dictType: 'test_dict',
          status: '0',
        };

        dictTypeRepo.update.mockResolvedValue({ ...updateDto });

        const result = await service.updateType(updateDto as any);

        expect(result.code).toBe(200);
        expect(dictTypeRepo.update).toHaveBeenCalledWith(1, updateDto);
      });
    });

    describe('deleteType', () => {
      it('should soft delete dict types successfully', async () => {
        const dictIds = [1, 2, 3];

        dictTypeRepo.softDeleteBatch.mockResolvedValue({ count: 3 });

        const result = await service.deleteType(dictIds);

        expect(result.code).toBe(200);
        expect(dictTypeRepo.softDeleteBatch).toHaveBeenCalledWith(dictIds);
      });
    });

    describe('findAllType', () => {
      it('should return paginated dict type list', async () => {
        const query = {
          pageNum: 1,
          pageSize: 10,
          skip: 0,
          take: 10,
        };

        const mockList = [
          { dictId: 1, dictName: '字典1', dictType: 'dict1', status: '0' },
          { dictId: 2, dictName: '字典2', dictType: 'dict2', status: '0' },
        ];

        dictTypeRepo.findPageWithFilter.mockResolvedValue({
          list: mockList,
          total: 2,
        });

        const result = await service.findAllType(query as any);

        expect(result.code).toBe(200);
        expect(result.data.rows).toHaveLength(2);
        expect(result.data.total).toBe(2);
      });

      it('should filter by dictName', async () => {
        const query = {
          pageNum: 1,
          pageSize: 10,
          skip: 0,
          take: 10,
          dictName: '用户',
        };

        dictTypeRepo.findPageWithFilter.mockResolvedValue({
          list: [{ dictId: 1, dictName: '用户性别', dictType: 'sys_user_sex' }],
          total: 1,
        });

        const result = await service.findAllType(query as any);

        expect(result.code).toBe(200);
        expect(dictTypeRepo.findPageWithFilter).toHaveBeenCalledWith(
          expect.objectContaining({
            dictName: { contains: '用户' },
          }),
          0,
          10,
        );
      });

      it('should filter by dictType', async () => {
        const query = {
          pageNum: 1,
          pageSize: 10,
          skip: 0,
          take: 10,
          dictType: 'sys_',
        };

        dictTypeRepo.findPageWithFilter.mockResolvedValue({
          list: [],
          total: 0,
        });

        await service.findAllType(query as any);

        expect(dictTypeRepo.findPageWithFilter).toHaveBeenCalledWith(
          expect.objectContaining({
            dictType: { contains: 'sys_' },
          }),
          0,
          10,
        );
      });

      it('should filter by status', async () => {
        const query = {
          pageNum: 1,
          pageSize: 10,
          skip: 0,
          take: 10,
          status: '0',
        };

        dictTypeRepo.findPageWithFilter.mockResolvedValue({
          list: [],
          total: 0,
        });

        await service.findAllType(query as any);

        expect(dictTypeRepo.findPageWithFilter).toHaveBeenCalledWith(
          expect.objectContaining({
            status: '0',
          }),
          0,
          10,
        );
      });
    });

    describe('findOneType', () => {
      it('should return dict type by id', async () => {
        const mockDictType = {
          dictId: 1,
          dictName: '用户性别',
          dictType: 'sys_user_sex',
          status: '0',
        };

        dictTypeRepo.findById.mockResolvedValue(mockDictType);

        const result = await service.findOneType(1);

        expect(result.code).toBe(200);
        expect(result.data).toEqual(mockDictType);
        expect(dictTypeRepo.findById).toHaveBeenCalledWith(1);
      });
    });

    describe('findOptionselect', () => {
      it('should return all dict types for select', async () => {
        const mockTypes = [
          { dictId: 1, dictName: '字典1', dictType: 'dict1' },
          { dictId: 2, dictName: '字典2', dictType: 'dict2' },
        ];

        dictTypeRepo.findAllForSelect.mockResolvedValue(mockTypes);

        const result = await service.findOptionselect();

        expect(result.code).toBe(200);
        expect(result.data).toEqual(mockTypes);
      });
    });
  });

  describe('字典数据CRUD', () => {
    describe('createDictData', () => {
      it('should create dict data successfully', async () => {
        const createDto = {
          dictType: 'sys_user_sex',
          dictLabel: '男',
          dictValue: '0',
          dictSort: 1,
          status: '0',
        };

        dictDataRepo.create.mockResolvedValue({ dictCode: 1, ...createDto });

        const result = await service.createDictData(createDto as any);

        expect(result.code).toBe(200);
        expect(dictDataRepo.create).toHaveBeenCalledWith(
          expect.objectContaining({
            dictType: 'sys_user_sex',
            dictLabel: '男',
            dictValue: '0',
            dictSort: 1,
            status: '0',
            isDefault: 'N',
            delFlag: DelFlagEnum.NORMAL,
          }),
        );
      });

      it('should use default values when not provided', async () => {
        const createDto = {
          dictType: 'sys_user_sex',
          dictLabel: '男',
          dictValue: '0',
        };

        dictDataRepo.create.mockResolvedValue({ dictCode: 1, ...createDto });

        await service.createDictData(createDto as any);

        expect(dictDataRepo.create).toHaveBeenCalledWith(
          expect.objectContaining({
            dictSort: 0,
            status: '0',
          }),
        );
      });
    });

    describe('updateDictData', () => {
      it('should update dict data successfully', async () => {
        const updateDto = {
          dictCode: 1,
          dictType: 'sys_user_sex',
          dictLabel: '男性',
          dictValue: '0',
        };

        dictDataRepo.update.mockResolvedValue({ ...updateDto });

        const result = await service.updateDictData(updateDto as any);

        expect(result.code).toBe(200);
        expect(dictDataRepo.update).toHaveBeenCalledWith(1, updateDto);
      });
    });

    describe('deleteDictData', () => {
      it('should soft delete dict data successfully', async () => {
        const dictCodes = [1, 2, 3];

        dictDataRepo.softDeleteBatch.mockResolvedValue({ count: 3 });

        const result = await service.deleteDictData(dictCodes);

        expect(result.code).toBe(200);
        expect(dictDataRepo.softDeleteBatch).toHaveBeenCalledWith(dictCodes);
      });
    });

    describe('findAllData', () => {
      it('should return paginated dict data list', async () => {
        const query = {
          pageNum: 1,
          pageSize: 10,
          skip: 0,
          take: 10,
          dictType: 'sys_user_sex',
        };

        const mockList = [
          { dictCode: 1, dictLabel: '男', dictValue: '0' },
          { dictCode: 2, dictLabel: '女', dictValue: '1' },
        ];

        dictDataRepo.findPageWithFilter.mockResolvedValue({
          list: mockList,
          total: 2,
        });

        const result = await service.findAllData(query as any);

        expect(result.code).toBe(200);
        expect(result.data.rows).toHaveLength(2);
        expect(result.data.total).toBe(2);
      });

      it('should filter by dictLabel', async () => {
        const query = {
          pageNum: 1,
          pageSize: 10,
          skip: 0,
          take: 10,
          dictLabel: '男',
        };

        dictDataRepo.findPageWithFilter.mockResolvedValue({
          list: [],
          total: 0,
        });

        await service.findAllData(query as any);

        expect(dictDataRepo.findPageWithFilter).toHaveBeenCalledWith(
          expect.objectContaining({
            dictLabel: { contains: '男' },
          }),
          0,
          10,
        );
      });
    });

    describe('findOneDictData', () => {
      it('should return dict data by code', async () => {
        const mockDictData = {
          dictCode: 1,
          dictType: 'sys_user_sex',
          dictLabel: '男',
          dictValue: '0',
        };

        dictDataRepo.findById.mockResolvedValue(mockDictData);

        const result = await service.findOneDictData(1);

        expect(result.code).toBe(200);
        expect(result.data).toEqual(mockDictData);
        expect(dictDataRepo.findById).toHaveBeenCalledWith(1);
      });
    });
  });

  describe('字典缓存逻辑', () => {
    describe('findOneDataType', () => {
      it('should return cached data when available', async () => {
        const cachedData = [
          { dictCode: 1, dictLabel: '男', dictValue: '0' },
          { dictCode: 2, dictLabel: '女', dictValue: '1' },
        ];

        redisService.get.mockResolvedValue(cachedData);

        const result = await service.findOneDataType('sys_user_sex');

        expect(result.code).toBe(200);
        expect(result.data).toEqual(cachedData);
        expect(redisService.get).toHaveBeenCalledWith(
          `${CacheEnum.SYS_DICT_KEY}sys_user_sex`,
        );
        expect(dictDataRepo.findByDictType).not.toHaveBeenCalled();
      });

      it('should fetch from database and cache when not in cache', async () => {
        const dbData = [
          { dictCode: 1, dictLabel: '男', dictValue: '0' },
          { dictCode: 2, dictLabel: '女', dictValue: '1' },
        ];

        redisService.get.mockResolvedValue(null);
        dictDataRepo.findByDictType.mockResolvedValue(dbData);

        const result = await service.findOneDataType('sys_user_sex');

        expect(result.code).toBe(200);
        expect(result.data).toEqual(dbData);
        expect(dictDataRepo.findByDictType).toHaveBeenCalledWith('sys_user_sex');
        expect(redisService.set).toHaveBeenCalledWith(
          `${CacheEnum.SYS_DICT_KEY}sys_user_sex`,
          dbData,
        );
      });
    });

    describe('resetDictCache', () => {
      it('should clear and reload dict cache', async () => {
        const clearSpy = jest.spyOn(service, 'clearDictCache').mockResolvedValue();
        const loadSpy = jest.spyOn(service, 'loadingDictCache').mockResolvedValue();

        const result = await service.resetDictCache();

        expect(result.code).toBe(200);
        expect(clearSpy).toHaveBeenCalled();
        expect(loadSpy).toHaveBeenCalled();
      });
    });

    describe('clearDictCache', () => {
      it('should delete all dict cache keys', async () => {
        const cacheKeys = [
          `${CacheEnum.SYS_DICT_KEY}sys_user_sex`,
          `${CacheEnum.SYS_DICT_KEY}sys_normal_disable`,
        ];

        redisService.keys.mockResolvedValue(cacheKeys);

        await service.clearDictCache();

        expect(redisService.keys).toHaveBeenCalledWith(
          `${CacheEnum.SYS_DICT_KEY}*`,
        );
        expect(redisService.del).toHaveBeenCalledWith(cacheKeys);
      });

      it('should not call del when no cache keys exist', async () => {
        redisService.keys.mockResolvedValue([]);

        await service.clearDictCache();

        expect(redisService.del).not.toHaveBeenCalled();
      });
    });

    describe('loadingDictCache', () => {
      it('should load all dict data into cache grouped by type', async () => {
        const mockDictData = [
          { dictType: 'sys_user_sex', dictCode: 1, dictLabel: '男', dictValue: '0', dictSort: 1 },
          { dictType: 'sys_user_sex', dictCode: 2, dictLabel: '女', dictValue: '1', dictSort: 2 },
          { dictType: 'sys_normal_disable', dictCode: 3, dictLabel: '正常', dictValue: '0', dictSort: 1 },
        ];

        (prisma.sysDictData.findMany as jest.Mock).mockResolvedValue(mockDictData);

        // Mock the redis property on the service instance for the decorator
        (service as any).redis = redisService;
        redisService.get.mockResolvedValue(null);

        await service.loadingDictCache();

        expect(prisma.sysDictData.findMany).toHaveBeenCalledWith({
          where: { delFlag: DelFlagEnum.NORMAL },
          orderBy: [{ dictType: 'asc' }, { dictSort: 'asc' }],
        });

        // Should set cache for each dict type
        expect(redisService.set).toHaveBeenCalledWith(
          `${CacheEnum.SYS_DICT_KEY}sys_user_sex`,
          expect.arrayContaining([
            expect.objectContaining({ dictLabel: '男' }),
            expect.objectContaining({ dictLabel: '女' }),
          ]),
        );
        expect(redisService.set).toHaveBeenCalledWith(
          `${CacheEnum.SYS_DICT_KEY}sys_normal_disable`,
          expect.arrayContaining([
            expect.objectContaining({ dictLabel: '正常' }),
          ]),
        );
      });
    });
  });
});
