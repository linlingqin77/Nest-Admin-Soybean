import { Test, TestingModule } from '@nestjs/testing';
import { plainToInstance } from 'class-transformer';
import { OperlogService } from 'src/module/monitor/operlog/operlog.service';
import { ConfigController } from './config.controller';
import { ConfigService } from './config.service';
import { ListConfigDto } from './dto/list-config.dto';
import { Result } from 'src/common/response';
import { Response } from 'express';

describe('ConfigController', () => {
  let controller: ConfigController;
  let service: jest.Mocked<ConfigService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ConfigController],
      providers: [
        {
          provide: ConfigService,
          useValue: {
            create: jest.fn(),
            findAll: jest.fn(),
            findOne: jest.fn(),
            findOneByConfigKey: jest.fn(),
            update: jest.fn(),
            updateByKey: jest.fn(),
            remove: jest.fn(),
            resetConfigCache: jest.fn(),
            export: jest.fn(),
          },
        },
        {
          provide: OperlogService,
          useValue: { create: jest.fn() },
        },
      ],
    }).compile();

    controller = module.get<ConfigController>(ConfigController);
    service = module.get(ConfigService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a config', async () => {
      const createDto = {
        configName: '测试配置',
        configKey: 'test.key',
        configValue: 'test_value',
        configType: 'N',
      };
      const userTool = {
        injectCreate: jest.fn((dto) => dto),
        injectUpdate: jest.fn((dto) => dto),
      };
      const mockResult = Result.ok();

      service.create.mockResolvedValue(mockResult);

      const result = await controller.create(createDto, userTool);

      expect(result.code).toBe(200);
      expect(userTool.injectCreate).toHaveBeenCalledWith(createDto);
      expect(service.create).toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('should return config list', async () => {
      const query = plainToInstance(ListConfigDto, { pageNum: 1, pageSize: 10 });
      const mockResult = Result.page([], 0);

      service.findAll.mockResolvedValue(mockResult);

      const result = await controller.findAll(query);

      expect(result.code).toBe(200);
      expect(service.findAll).toHaveBeenCalledWith(query);
    });

    it('should pass filter parameters to service', async () => {
      const query = plainToInstance(ListConfigDto, {
        configName: '测试',
        configKey: 'test.key',
        configType: 'Y',
        pageNum: 1,
        pageSize: 10,
      });
      const mockResult = Result.page([], 0);

      service.findAll.mockResolvedValue(mockResult);

      const result = await controller.findAll(query);

      expect(result.code).toBe(200);
      expect(service.findAll).toHaveBeenCalledWith(query);
    });
  });

  describe('findOne', () => {
    it('should return a single config by id', async () => {
      const mockResult = Result.ok({
        configId: 1,
        configName: '测试配置',
        configKey: 'test.key',
        configValue: 'test_value',
      });

      service.findOne.mockResolvedValue(mockResult as any);

      const result = await controller.findOne('1');

      expect(result.code).toBe(200);
      expect(service.findOne).toHaveBeenCalledWith(1);
    });

    it('should convert string id to number', async () => {
      const mockResult = Result.ok({});

      service.findOne.mockResolvedValue(mockResult as any);

      await controller.findOne('123');

      expect(service.findOne).toHaveBeenCalledWith(123);
    });
  });

  describe('findOneByconfigKey', () => {
    it('should return config value by key', async () => {
      const mockResult = Result.ok('test_value');

      service.findOneByConfigKey.mockResolvedValue(mockResult);

      const result = await controller.findOneByconfigKey('test.key');

      expect(result.code).toBe(200);
      expect(service.findOneByConfigKey).toHaveBeenCalledWith('test.key');
    });
  });

  describe('update', () => {
    it('should update a config', async () => {
      const updateDto = {
        configId: 1,
        configName: '测试配置',
        configKey: 'test.key',
        configValue: 'new_value',
        configType: 'N',
      };
      const mockResult = Result.ok();

      service.update.mockResolvedValue(mockResult);

      const result = await controller.update(updateDto);

      expect(result.code).toBe(200);
      expect(service.update).toHaveBeenCalledWith(updateDto);
    });
  });

  describe('updateByKey', () => {
    it('should update config by key', async () => {
      const updateDto = {
        configId: 1,
        configName: '测试配置',
        configKey: 'test.key',
        configValue: 'new_value',
        configType: 'N',
      };
      const mockResult = Result.ok();

      service.updateByKey.mockResolvedValue(mockResult);

      const result = await controller.updateByKey(updateDto);

      expect(result.code).toBe(200);
      expect(service.updateByKey).toHaveBeenCalledWith(updateDto);
    });
  });

  describe('refreshCache', () => {
    it('should refresh config cache', async () => {
      const mockResult = Result.ok();

      service.resetConfigCache.mockResolvedValue(mockResult);

      const result = await controller.refreshCache();

      expect(result.code).toBe(200);
      expect(service.resetConfigCache).toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('should remove single config', async () => {
      const mockResult = Result.ok(1);

      service.remove.mockResolvedValue(mockResult);

      const result = await controller.remove('1');

      expect(result.code).toBe(200);
      expect(service.remove).toHaveBeenCalledWith([1]);
    });

    it('should remove multiple configs', async () => {
      const mockResult = Result.ok(3);

      service.remove.mockResolvedValue(mockResult);

      const result = await controller.remove('1,2,3');

      expect(result.code).toBe(200);
      expect(service.remove).toHaveBeenCalledWith([1, 2, 3]);
    });

    it('should handle comma-separated ids correctly', async () => {
      const mockResult = Result.ok(3);

      service.remove.mockResolvedValue(mockResult);

      await controller.remove('10,20,30');

      expect(service.remove).toHaveBeenCalledWith([10, 20, 30]);
    });
  });

  describe('export', () => {
    it('should export config data', async () => {
      const mockResponse = {
        setHeader: jest.fn(),
        send: jest.fn(),
      } as unknown as Response;
      const body = plainToInstance(ListConfigDto, { pageNum: 1, pageSize: 100 });

      service.export.mockResolvedValue(undefined);

      await controller.export(mockResponse, body);

      expect(service.export).toHaveBeenCalledWith(mockResponse, body);
    });
  });
});
