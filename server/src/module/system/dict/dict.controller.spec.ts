import { Test, TestingModule } from '@nestjs/testing';
import { DictController } from './dict.controller';
import { DictService } from './dict.service';
import { Response } from 'express';
import { plainToInstance } from 'class-transformer';
import { ListDictType, ListDictData, CreateDictDataDto, UpdateDictDataDto } from './dto';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { OperlogInterceptor } from 'src/common/interceptors/operlog.interceptor';
import { OperlogService } from 'src/module/monitor/operlog/operlog.service';

describe('DictController', () => {
  let controller: DictController;
  let service: DictService;

  const mockDictService = {
    createType: jest.fn(),
    resetDictCache: jest.fn(),
    deleteType: jest.fn(),
    updateType: jest.fn(),
    findAllType: jest.fn(),
    findOptionselect: jest.fn(),
    findOneType: jest.fn(),
    createDictData: jest.fn(),
    deleteDictData: jest.fn(),
    updateDictData: jest.fn(),
    findAllData: jest.fn(),
    findOneDictData: jest.fn(),
    findOneDataType: jest.fn(),
    export: jest.fn(),
    exportData: jest.fn(),
  };

  const mockOperlogService = {
    create: jest.fn(),
  };

  const mockUserTool = {
    injectCreate: jest.fn((dto) => dto),
    injectUpdate: jest.fn((dto) => dto),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DictController],
      providers: [
        {
          provide: DictService,
          useValue: mockDictService,
        },
        {
          provide: OperlogService,
          useValue: mockOperlogService,
        },
        {
          provide: APP_INTERCEPTOR,
          useClass: OperlogInterceptor,
        },
      ],
    }).compile();

    controller = module.get<DictController>(DictController);
    service = module.get<DictService>(DictService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createType', () => {
    it('should create a dict type', async () => {
      const createDto = {
        dictName: '测试字典',
        dictType: 'test_dict',
        status: '0',
        remark: '测试',
      };
      const mockResult = { code: 200, msg: '创建成功' };
      mockDictService.createType.mockResolvedValue(mockResult);

      const result = await controller.createType(createDto, mockUserTool);

      expect(result).toEqual(mockResult);
      expect(service.createType).toHaveBeenCalledWith(createDto);
    });
  });

  describe('refreshCache', () => {
    it('should refresh dict cache', async () => {
      const mockResult = { code: 200, msg: '刷新成功' };
      mockDictService.resetDictCache.mockResolvedValue(mockResult);

      const result = await controller.refreshCache();

      expect(result).toEqual(mockResult);
      expect(service.resetDictCache).toHaveBeenCalled();
    });
  });

  describe('deleteType', () => {
    it('should delete dict types by ids', async () => {
      const mockResult = { code: 200, msg: '删除成功' };
      mockDictService.deleteType.mockResolvedValue(mockResult);

      const result = await controller.deleteType('1,2,3');

      expect(result).toEqual(mockResult);
      expect(service.deleteType).toHaveBeenCalledWith([1, 2, 3]);
    });

    it('should handle single id', async () => {
      const mockResult = { code: 200, msg: '删除成功' };
      mockDictService.deleteType.mockResolvedValue(mockResult);

      const result = await controller.deleteType('1');

      expect(result).toEqual(mockResult);
      expect(service.deleteType).toHaveBeenCalledWith([1]);
    });
  });

  describe('updateType', () => {
    it('should update dict type', async () => {
      const updateDto = {
        dictId: 1,
        dictName: '更新字典',
        dictType: 'test_dict',
        status: '0',
      };
      const mockResult = { code: 200, msg: '更新成功' };
      mockDictService.updateType.mockResolvedValue(mockResult);

      const result = await controller.updateType(updateDto);

      expect(result).toEqual(mockResult);
      expect(service.updateType).toHaveBeenCalledWith(updateDto);
    });
  });

  describe('findAllType', () => {
    it('should return dict type list', async () => {
      const query = plainToInstance(ListDictType, { pageNum: 1, pageSize: 10 });
      const mockResult = {
        code: 200,
        data: {
          rows: [],
          total: 0,
        },
      };
      mockDictService.findAllType.mockResolvedValue(mockResult);

      const result = await controller.findAllType(query);

      expect(result).toEqual(mockResult);
      expect(service.findAllType).toHaveBeenCalledWith(query);
    });
  });

  describe('findOptionselect', () => {
    it('should return dict type options', async () => {
      const mockResult = {
        code: 200,
        data: [
          { dictId: 1, dictName: '字典1', dictType: 'dict1' },
          { dictId: 2, dictName: '字典2', dictType: 'dict2' },
        ],
      };
      mockDictService.findOptionselect.mockResolvedValue(mockResult);

      const result = await controller.findOptionselect();

      expect(result).toEqual(mockResult);
      expect(service.findOptionselect).toHaveBeenCalled();
    });
  });

  describe('findOneType', () => {
    it('should return dict type by id', async () => {
      const mockResult = {
        code: 200,
        data: { dictId: 1, dictName: '字典1', dictType: 'dict1' },
      };
      mockDictService.findOneType.mockResolvedValue(mockResult);

      const result = await controller.findOneType('1');

      expect(result).toEqual(mockResult);
      expect(service.findOneType).toHaveBeenCalledWith(1);
    });
  });

  describe('createDictData', () => {
    it('should create dict data', async () => {
      const createDto = plainToInstance(CreateDictDataDto, {
        dictType: 'test_dict',
        dictLabel: '测试标签',
        dictValue: 'test_value',
        dictSort: 1,
        status: '0',
        listClass: 'default',
        cssClass: '',
      });
      const mockResult = { code: 200, msg: '创建成功' };
      mockDictService.createDictData.mockResolvedValue(mockResult);

      const result = await controller.createDictData(createDto, mockUserTool);

      expect(result).toEqual(mockResult);
      expect(service.createDictData).toHaveBeenCalledWith(createDto);
    });
  });

  describe('deleteDictData', () => {
    it('should delete dict data by ids', async () => {
      const mockResult = { code: 200, msg: '删除成功' };
      mockDictService.deleteDictData.mockResolvedValue(mockResult);

      const result = await controller.deleteDictData('1,2,3');

      expect(result).toEqual(mockResult);
      expect(service.deleteDictData).toHaveBeenCalledWith([1, 2, 3]);
    });
  });

  describe('updateDictData', () => {
    it('should update dict data', async () => {
      const updateDto = plainToInstance(UpdateDictDataDto, {
        dictCode: 1,
        dictType: 'test_dict',
        dictLabel: '更新标签',
        dictValue: 'test_value',
        dictSort: 1,
        status: '0',
        listClass: 'default',
        cssClass: '',
      });
      const mockResult = { code: 200, msg: '更新成功' };
      mockDictService.updateDictData.mockResolvedValue(mockResult);

      const result = await controller.updateDictData(updateDto);

      expect(result).toEqual(mockResult);
      expect(service.updateDictData).toHaveBeenCalledWith(updateDto);
    });
  });

  describe('findAllData', () => {
    it('should return dict data list', async () => {
      const query = plainToInstance(ListDictData, { dictType: 'test_dict', pageNum: 1, pageSize: 10 });
      const mockResult = {
        code: 200,
        data: {
          rows: [],
          total: 0,
        },
      };
      mockDictService.findAllData.mockResolvedValue(mockResult);

      const result = await controller.findAllData(query);

      expect(result).toEqual(mockResult);
      expect(service.findAllData).toHaveBeenCalledWith(query);
    });
  });

  describe('findOneDictData', () => {
    it('should return dict data by code', async () => {
      const mockResult = {
        code: 200,
        data: { dictCode: 1, dictLabel: '标签1', dictValue: 'value1' },
      };
      mockDictService.findOneDictData.mockResolvedValue(mockResult);

      const result = await controller.findOneDictData('1');

      expect(result).toEqual(mockResult);
      expect(service.findOneDictData).toHaveBeenCalledWith(1);
    });
  });

  describe('findOneDataType', () => {
    it('should return dict data by type', async () => {
      const mockResult = {
        code: 200,
        data: [
          { dictCode: 1, dictLabel: '标签1', dictValue: 'value1' },
          { dictCode: 2, dictLabel: '标签2', dictValue: 'value2' },
        ],
      };
      mockDictService.findOneDataType.mockResolvedValue(mockResult);

      const result = await controller.findOneDataType('test_dict');

      expect(result).toEqual(mockResult);
      expect(service.findOneDataType).toHaveBeenCalledWith('test_dict');
    });
  });

  describe('export', () => {
    it('should export dict types', async () => {
      const mockResponse = {
        setHeader: jest.fn(),
        send: jest.fn(),
      } as unknown as Response;
      const query = plainToInstance(ListDictType, { pageNum: 1, pageSize: 10 });
      mockDictService.export.mockResolvedValue(undefined);

      await controller.export(mockResponse, query);

      expect(service.export).toHaveBeenCalledWith(mockResponse, query);
    });
  });

  describe('exportData', () => {
    it('should export dict data', async () => {
      const mockResponse = {
        setHeader: jest.fn(),
        send: jest.fn(),
      } as unknown as Response;
      const query = plainToInstance(ListDictType, { pageNum: 1, pageSize: 10 });
      mockDictService.exportData.mockResolvedValue(undefined);

      await controller.exportData(mockResponse, query);

      expect(service.exportData).toHaveBeenCalledWith(mockResponse, query);
    });
  });
});
