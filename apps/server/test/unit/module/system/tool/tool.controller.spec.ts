/**
 * 代码生成器控制器单元测试
 *
 * @description 测试 ToolController 的所有接口
 * Requirements: 11.1, 15.1
 */
import { Test, TestingModule } from '@nestjs/testing';
import { ToolController } from '@/modules/tools/tool.controller';
import { ToolService } from '@/modules/tools/tool.service';
import { Response } from 'express';
import { Result } from '@/shared/response';
import { Reflector } from '@nestjs/core';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';

// Mock MultiThrottleGuard
jest.mock('@/core/http/guards/multi-throttle.guard', () => ({
  MultiThrottleGuard: jest.fn().mockImplementation(() => ({
    canActivate: jest.fn().mockReturnValue(true),
  })),
}));

// Mock OperlogInterceptor
jest.mock('@/core/http/interceptors/operlog.interceptor', () => ({
  OperlogInterceptor: jest.fn().mockImplementation(() => ({
    intercept: jest.fn().mockImplementation((context, next) => next.handle()),
  })),
}));

describe('ToolController', () => {
  let controller: ToolController;
  let mockToolService: any;
  let mockResponse: Partial<Response>;

  beforeEach(async () => {
    mockToolService = {
      findAll: jest.fn(),
      genDbList: jest.fn(),
      getDataNames: jest.fn(),
      importTable: jest.fn(),
      synchDb: jest.fn(),
      findOne: jest.fn(),
      genUpdate: jest.fn(),
      remove: jest.fn(),
      batchGenCode: jest.fn(),
      batchGenCodeByIds: jest.fn(),
      preview: jest.fn(),
    };

    mockResponse = {
      download: jest.fn(),
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
    };

    const modules: TestingModule = await Test.createTestingModule({
      controllers: [ToolController],
      providers: [
        {
          provide: ToolService,
          useValue: mockToolService,
        },
        Reflector,
      ],
    }).compile();

    controller = modules.get<ToolController>(ToolController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAll - 数据表列表', () => {
    it('应该返回分页的数据表列表', async () => {
      const query = { pageNum: 1, pageSize: 10 };
      const expectedResult = Result.page([{ tableId: 1, tableName: 'sys_user', tableComment: '用户表' }], 1, 1, 10);
      mockToolService.findAll.mockResolvedValue(expectedResult);

      const result = await controller.findAll(query as any);

      expect(mockToolService.findAll).toHaveBeenCalledWith(query);
      expect(result).toEqual(expectedResult);
    });

    it('应该支持按表名筛选', async () => {
      const query = { pageNum: 1, pageSize: 10, tableNames: 'sys_user' };
      mockToolService.findAll.mockResolvedValue(Result.page([], 0, 1, 10));

      await controller.findAll(query as any);

      expect(mockToolService.findAll).toHaveBeenCalledWith(query);
    });

    it('应该支持按表注释筛选', async () => {
      const query = { pageNum: 1, pageSize: 10, tableComment: '用户' };
      mockToolService.findAll.mockResolvedValue(Result.page([], 0, 1, 10));

      await controller.findAll(query as any);

      expect(mockToolService.findAll).toHaveBeenCalledWith(query);
    });
  });

  describe('genDbList - 查询数据库表列表', () => {
    it('应该返回未导入的数据库表列表', async () => {
      const query = { pageNum: 1, pageSize: 10 };
      const expectedResult = Result.ok({
        list: [{ tableName: 'new_table', tableComment: '新表' }],
        total: 1,
      });
      mockToolService.genDbList.mockResolvedValue(expectedResult);

      const result = await controller.genDbList(query as any);

      expect(mockToolService.genDbList).toHaveBeenCalledWith(query);
      expect(result).toEqual(expectedResult);
    });

    it('应该支持按表名模糊查询', async () => {
      const query = { pageNum: 1, pageSize: 10, tableName: 'sys' };
      mockToolService.genDbList.mockResolvedValue(Result.ok({ list: [], total: 0 }));

      await controller.genDbList(query as any);

      expect(mockToolService.genDbList).toHaveBeenCalledWith(query);
    });
  });

  describe('getDataNames - 查询数据源名称列表', () => {
    it('应该返回可用的数据源名称列表', async () => {
      const expectedResult = Result.ok(['master']);
      mockToolService.getDataNames.mockResolvedValue(expectedResult);

      const result = await controller.getDataNames();

      expect(mockToolService.getDataNames).toHaveBeenCalled();
      expect(result).toEqual(expectedResult);
    });
  });

  describe('genImportTable - 导入表', () => {
    it('应该成功导入单个表', async () => {
      const table = { tableNames: 'sys_user' };
      const user = { userName: 'admin', userId: 1 };
      const expectedResult = Result.ok('添加成功');
      mockToolService.importTable.mockResolvedValue(expectedResult);

      const result = await controller.genImportTable(table as any, user as any);

      expect(mockToolService.importTable).toHaveBeenCalledWith(table, user);
      expect(result).toEqual(expectedResult);
    });

    it('应该成功导入多个表', async () => {
      const table = { tableNames: 'sys_user,sys_role,sys_menu' };
      const user = { userName: 'admin', userId: 1 };
      mockToolService.importTable.mockResolvedValue(Result.ok('添加成功'));

      await controller.genImportTable(table as any, user as any);

      expect(mockToolService.importTable).toHaveBeenCalledWith(table, user);
    });
  });

  describe('synchDb - 同步表结构', () => {
    it('应该成功同步表结构', async () => {
      const tableName = 'sys_user';
      const expectedResult = Result.ok();
      mockToolService.synchDb.mockResolvedValue(expectedResult);

      const result = await controller.synchDb(tableName);

      expect(mockToolService.synchDb).toHaveBeenCalledWith(tableName);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('gen - 查询表详细信息', () => {
    it('应该返回表详细信息', async () => {
      const id = '1';
      const expectedResult = Result.ok({
        info: {
          tableId: 1,
          tableName: 'sys_user',
          columns: [{ columnId: 1, columnName: 'user_id' }],
        },
      });
      mockToolService.findOne.mockResolvedValue(expectedResult);

      const result = await controller.gen(id);

      expect(mockToolService.findOne).toHaveBeenCalledWith(1);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('genUpdate - 修改代码生成信息', () => {
    it('应该成功修改代码生成配置', async () => {
      const genTableUpdate = {
        tableId: 1,
        tableName: 'sys_user',
        className: 'SysUser',
        columns: [{ columnId: 1, javaField: 'userId' }],
      };
      const expectedResult = Result.ok({ genTableUpdate });
      mockToolService.genUpdate.mockResolvedValue(expectedResult);

      const result = await controller.genUpdate(genTableUpdate as any);

      expect(mockToolService.genUpdate).toHaveBeenCalledWith(genTableUpdate);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('remove - 删除表数据', () => {
    it('应该成功删除表数据', async () => {
      const id = '1';
      const expectedResult = Result.ok();
      mockToolService.remove.mockResolvedValue(expectedResult);

      const result = await controller.remove(id);

      expect(mockToolService.remove).toHaveBeenCalledWith(1);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('batchGenCode - 批量生成代码（通过表名）', () => {
    it('应该成功生成代码并返回 ZIP 文件', async () => {
      const query = { tableNames: 'sys_user,sys_role', projectName: 'test-project' };
      mockToolService.batchGenCode.mockResolvedValue(undefined);

      await controller.batchGenCode(query as any, mockResponse as Response);

      expect(mockToolService.batchGenCode).toHaveBeenCalledWith(
        { tableNames: query.tableNames },
        mockResponse,
        query.projectName,
      );
    });

    it('应该使用默认项目名称', async () => {
      const query = { tableNames: 'sys_user' };
      mockToolService.batchGenCode.mockResolvedValue(undefined);

      await controller.batchGenCode(query as any, mockResponse as Response);

      expect(mockToolService.batchGenCode).toHaveBeenCalledWith(
        { tableNames: query.tableNames },
        mockResponse,
        undefined,
      );
    });
  });

  describe('batchGenCodeByIds - 批量生成代码（通过表ID）', () => {
    it('应该成功通过表ID生成代码', async () => {
      const dto = { tableIds: [1, 2, 3], projectName: 'test-project' };
      mockToolService.batchGenCodeByIds.mockResolvedValue(undefined);

      await controller.batchGenCodeByIds(dto as any, mockResponse as Response);

      expect(mockToolService.batchGenCodeByIds).toHaveBeenCalledWith(dto.tableIds, mockResponse, dto.projectName);
    });
  });

  describe('preview - 预览生成代码', () => {
    it('应该返回预览的代码内容', async () => {
      const id = '1';
      const expectedResult = Result.ok({
        files: [{ name: 'user.controller.ts', path: 'src/controller/user.controller.ts', content: '...' }],
        fileTree: [],
        totalFiles: 1,
        totalLines: 100,
        totalSize: 2048,
      });
      mockToolService.preview.mockResolvedValue(expectedResult);

      const result = await controller.preview(id);

      expect(mockToolService.preview).toHaveBeenCalledWith(1);
      expect(result).toEqual(expectedResult);
    });
  });
});
