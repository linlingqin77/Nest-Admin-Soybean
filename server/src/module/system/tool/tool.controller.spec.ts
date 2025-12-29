import { Test, TestingModule } from '@nestjs/testing';
import { ToolController } from './tool.controller';
import { ToolService } from './tool.service';
import { GenTableList, GenDbTableList, TableName, GenTableUpdate } from './dto/create-genTable-dto';
import { plainToInstance } from 'class-transformer';
import { OperlogService } from 'src/module/monitor/operlog/operlog.service';
import { Result } from 'src/common/response';

describe('ToolController', () => {
  let controller: ToolController;
  let service: jest.Mocked<ToolService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ToolController],
      providers: [
        {
          provide: ToolService,
          useValue: {
            findAll: jest.fn(),
            genDbList: jest.fn(),
            getDataNames: jest.fn(),
            importTable: jest.fn(),
            synchDb: jest.fn(),
            findOne: jest.fn(),
            genUpdate: jest.fn(),
            remove: jest.fn(),
            batchGenCode: jest.fn(),
            preview: jest.fn(),
          },
        },
        {
          provide: OperlogService,
          useValue: { create: jest.fn() },
        },
      ],
    }).compile();

    controller = module.get<ToolController>(ToolController);
    service = module.get(ToolService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('should return paginated table list', async () => {
      const query = plainToInstance(GenTableList, { pageNum: 1, pageSize: 10 });
      const mockResult = Result.page([], 0);
      service.findAll.mockResolvedValue(mockResult as any);

      const result = await controller.findAll(query);

      expect(result.code).toBe(200);
      expect(service.findAll).toHaveBeenCalledWith(query);
    });
  });

  describe('genDbList', () => {
    it('should return database table list', async () => {
      const query = plainToInstance(GenDbTableList, { pageNum: 1, pageSize: 10 });
      const mockResult = Result.ok({ list: [], total: 0 });
      service.genDbList.mockResolvedValue(mockResult);

      const result = await controller.genDbList(query);

      expect(result.code).toBe(200);
      expect(service.genDbList).toHaveBeenCalledWith(query);
    });
  });

  describe('getDataNames', () => {
    it('should return data source names', async () => {
      const mockResult = Result.ok(['default']);
      service.getDataNames.mockResolvedValue(mockResult);

      const result = await controller.getDataNames();

      expect(result.code).toBe(200);
      expect(service.getDataNames).toHaveBeenCalled();
    });
  });

  describe('genImportTable', () => {
    it('should import tables', async () => {
      const tableDto = { tableNames: 'sys_user,sys_role' };
      const user = { userId: 1, userName: 'admin' } as any;
      const mockResult = Result.ok();
      service.importTable.mockResolvedValue(mockResult);

      const result = await controller.genImportTable(tableDto, user);

      expect(result.code).toBe(200);
      expect(service.importTable).toHaveBeenCalledWith(tableDto, user);
    });
  });

  describe('synchDb', () => {
    it('should synchronize table structure', async () => {
      const tableName = 'sys_user';
      const mockResult = Result.ok();
      service.synchDb.mockResolvedValue(mockResult);

      const result = await controller.synchDb(tableName);

      expect(result.code).toBe(200);
      expect(service.synchDb).toHaveBeenCalledWith(tableName);
    });
  });

  describe('gen', () => {
    it('should return table details', async () => {
      const mockResult = Result.ok({ tableId: 1, tableName: 'sys_user' });
      service.findOne.mockResolvedValue(mockResult as any);

      const result = await controller.gen('1');

      expect(result.code).toBe(200);
      expect(service.findOne).toHaveBeenCalledWith(1);
    });
  });

  describe('genUpdate', () => {
    it('should update table generation config', async () => {
      const updateDto = {
        tableId: 1,
        tableName: 'sys_user',
        tableComment: 'User Table',
      } as GenTableUpdate;
      const mockResult = Result.ok();
      service.genUpdate.mockResolvedValue(mockResult);

      const result = await controller.genUpdate(updateDto);

      expect(result.code).toBe(200);
      expect(service.genUpdate).toHaveBeenCalledWith(updateDto);
    });
  });

  describe('remove', () => {
    it('should delete table', async () => {
      const mockResult = Result.ok();
      service.remove.mockResolvedValue(mockResult);

      const result = await controller.remove('1');

      expect(result.code).toBe(200);
      expect(service.remove).toHaveBeenCalledWith(1);
    });
  });

  describe('batchGenCode', () => {
    it('should generate code zip', async () => {
      const tables = { tableNames: '1,2,3' };
      const mockResponse = {
        setHeader: jest.fn(),
        end: jest.fn(),
      } as any;
      service.batchGenCode.mockResolvedValue(undefined);

      await controller.batchGenCode(tables, mockResponse);

      expect(service.batchGenCode).toHaveBeenCalledWith(tables, mockResponse);
    });
  });

  describe('preview', () => {
    it('should preview generated code', async () => {
      const mockResult = Result.ok({});
      service.preview.mockResolvedValue(mockResult);

      const result = await controller.preview('1');

      expect(result.code).toBe(200);
      expect(service.preview).toHaveBeenCalledWith(1);
    });
  });
});
