/**
 * 数据源控制器单元测试
 *
 * @description 测试 DataSourceController 的所有接口
 * Requirements: 1.1, 1.2, 1.3, 11.1, 15.1
 */
import { Test, TestingModule } from '@nestjs/testing';
import { DataSourceController } from '@/modules/tools/datasource/datasource.controller';
import { DataSourceService } from '@/modules/tools/datasource/datasource.service';
import { Result } from '@/shared/response';
import { Reflector } from '@nestjs/core';

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

describe('DataSourceController', () => {
  let controller: DataSourceController;
  let mockDataSourceService: any;

  const mockUser = { userName: 'admin', userId: 1 };

  beforeEach(async () => {
    mockDataSourceService = {
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findAll: jest.fn(),
      findOne: jest.fn(),
      testConnection: jest.fn(),
      testConnectionById: jest.fn(),
      getTables: jest.fn(),
      getColumns: jest.fn(),
    };

    const modules: TestingModule = await Test.createTestingModule({
      controllers: [DataSourceController],
      providers: [
        {
          provide: DataSourceService,
          useValue: mockDataSourceService,
        },
        Reflector,
      ],
    }).compile();

    controller = modules.get<DataSourceController>(DataSourceController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create - 创建数据源', () => {
    it('应该成功创建数据源', async () => {
      const dto = {
        name: 'test-db',
        type: 'postgresql',
        host: 'localhost',
        port: 5432,
        database: 'testdb',
        username: 'admin',
        password: 'password123',
      };
      const expectedResult = Result.ok({ id: 1, ...dto, password: undefined }, '创建成功');
      mockDataSourceService.create.mockResolvedValue(expectedResult);

      const result = await controller.create(dto as any, mockUser as any);

      expect(mockDataSourceService.create).toHaveBeenCalledWith(dto, mockUser.userName);
      expect(result).toEqual(expectedResult);
    });

    it('应该在名称重复时返回错误', async () => {
      const dto = { name: 'existing-db' };
      const expectedResult = Result.fail(409, '数据源名称已存在');
      mockDataSourceService.create.mockResolvedValue(expectedResult);

      const result = await controller.create(dto as any, mockUser as any);

      expect(result.code).toBe(409);
    });
  });

  describe('update - 更新数据源', () => {
    it('应该成功更新数据源', async () => {
      const id = 1;
      const dto = { name: 'updated-db', host: 'new-host' };
      const expectedResult = Result.ok({ id, ...dto }, '更新成功');
      mockDataSourceService.update.mockResolvedValue(expectedResult);

      const result = await controller.update(id, dto as any, mockUser as any);

      expect(mockDataSourceService.update).toHaveBeenCalledWith(id, dto, mockUser.userName);
      expect(result).toEqual(expectedResult);
    });

    it('应该在数据源不存在时返回错误', async () => {
      const id = 999;
      const dto = { name: 'updated-db' };
      const expectedResult = Result.fail(404, '数据源不存在');
      mockDataSourceService.update.mockResolvedValue(expectedResult);

      const result = await controller.update(id, dto as any, mockUser as any);

      expect(result.code).toBe(404);
    });
  });

  describe('delete - 删除数据源', () => {
    it('应该成功删除数据源', async () => {
      const id = 1;
      const expectedResult = Result.ok(null, '删除成功');
      mockDataSourceService.delete.mockResolvedValue(expectedResult);

      const result = await controller.delete(id, mockUser as any);

      expect(mockDataSourceService.delete).toHaveBeenCalledWith(id, mockUser.userName);
      expect(result).toEqual(expectedResult);
    });

    it('应该在数据源被使用时返回错误', async () => {
      const id = 1;
      const expectedResult = Result.fail(409, '该数据源已被使用，无法删除');
      mockDataSourceService.delete.mockResolvedValue(expectedResult);

      const result = await controller.delete(id, mockUser as any);

      expect(result.code).toBe(409);
    });
  });

  describe('list - 查询数据源列表', () => {
    it('应该返回分页的数据源列表', async () => {
      const query = { pageNum: 1, pageSize: 10 };
      const expectedResult = Result.page(
        [{ id: 1, name: 'test-db', type: 'postgresql' }],
        1,
        1,
        10,
      );
      mockDataSourceService.findAll.mockResolvedValue(expectedResult);

      const result = await controller.list(query as any);

      expect(mockDataSourceService.findAll).toHaveBeenCalledWith(query);
      expect(result).toEqual(expectedResult);
    });

    it('应该支持按名称筛选', async () => {
      const query = { pageNum: 1, pageSize: 10, name: 'test' };
      mockDataSourceService.findAll.mockResolvedValue(Result.page([], 0, 1, 10));

      await controller.list(query as any);

      expect(mockDataSourceService.findAll).toHaveBeenCalledWith(query);
    });

    it('应该支持按类型筛选', async () => {
      const query = { pageNum: 1, pageSize: 10, type: 'postgresql' };
      mockDataSourceService.findAll.mockResolvedValue(Result.page([], 0, 1, 10));

      await controller.list(query as any);

      expect(mockDataSourceService.findAll).toHaveBeenCalledWith(query);
    });
  });

  describe('findOne - 查询数据源详情', () => {
    it('应该返回数据源详情', async () => {
      const id = 1;
      const expectedResult = Result.ok({
        id: 1,
        name: 'test-db',
        type: 'postgresql',
        host: 'localhost',
        port: 5432,
        database: 'testdb',
        username: 'admin',
      });
      mockDataSourceService.findOne.mockResolvedValue(expectedResult);

      const result = await controller.findOne(id);

      expect(mockDataSourceService.findOne).toHaveBeenCalledWith(id);
      expect(result).toEqual(expectedResult);
    });

    it('应该在数据源不存在时返回错误', async () => {
      const id = 999;
      const expectedResult = Result.fail(404, '数据源不存在');
      mockDataSourceService.findOne.mockResolvedValue(expectedResult);

      const result = await controller.findOne(id);

      expect(result.code).toBe(404);
    });
  });

  describe('testConnection - 测试数据源连接', () => {
    it('应该在连接成功时返回成功', async () => {
      const dto = {
        type: 'postgresql',
        host: 'localhost',
        port: 5432,
        database: 'testdb',
        username: 'admin',
        password: 'password123',
      };
      const expectedResult = Result.ok(true, '连接成功');
      mockDataSourceService.testConnection.mockResolvedValue(expectedResult);

      const result = await controller.testConnection(dto as any);

      expect(mockDataSourceService.testConnection).toHaveBeenCalledWith(dto);
      expect(result).toEqual(expectedResult);
    });

    it('应该在连接失败时返回错误', async () => {
      const dto = {
        type: 'postgresql',
        host: 'invalid-host',
        port: 5432,
        database: 'testdb',
        username: 'admin',
        password: 'password123',
      };
      const expectedResult = Result.fail(400, '连接被拒绝，请检查数据库服务是否启动');
      mockDataSourceService.testConnection.mockResolvedValue(expectedResult);

      const result = await controller.testConnection(dto as any);

      expect(result.code).toBe(400);
    });
  });

  describe('testConnectionById - 测试已保存的数据源连接', () => {
    it('应该成功测试已保存的数据源连接', async () => {
      const id = 1;
      const expectedResult = Result.ok(true, '连接成功');
      mockDataSourceService.testConnectionById.mockResolvedValue(expectedResult);

      const result = await controller.testConnectionById(id);

      expect(mockDataSourceService.testConnectionById).toHaveBeenCalledWith(id);
      expect(result).toEqual(expectedResult);
    });

    it('应该在数据源不存在时返回错误', async () => {
      const id = 999;
      const expectedResult = Result.fail(404, '数据源不存在');
      mockDataSourceService.testConnectionById.mockResolvedValue(expectedResult);

      const result = await controller.testConnectionById(id);

      expect(result.code).toBe(404);
    });
  });

  describe('getTables - 获取数据源的表列表', () => {
    it('应该返回表列表', async () => {
      const id = 1;
      const expectedResult = Result.ok([
        { tableName: 'sys_user', tableComment: '用户表' },
        { tableName: 'sys_role', tableComment: '角色表' },
      ]);
      mockDataSourceService.getTables.mockResolvedValue(expectedResult);

      const result = await controller.getTables(id);

      expect(mockDataSourceService.getTables).toHaveBeenCalledWith(id);
      expect(result).toEqual(expectedResult);
    });

    it('应该在数据源不存在时返回错误', async () => {
      const id = 999;
      const expectedResult = Result.fail(404, '数据源不存在');
      mockDataSourceService.getTables.mockResolvedValue(expectedResult);

      const result = await controller.getTables(id);

      expect(result.code).toBe(404);
    });
  });

  describe('getColumns - 获取表的列信息', () => {
    it('应该返回列信息', async () => {
      const id = 1;
      const tableName = 'sys_user';
      const expectedResult = Result.ok([
        { columnName: 'user_id', columnType: 'bigint', isPrimaryKey: true },
        { columnName: 'user_name', columnType: 'varchar', isPrimaryKey: false },
      ]);
      mockDataSourceService.getColumns.mockResolvedValue(expectedResult);

      const result = await controller.getColumns(id, tableName);

      expect(mockDataSourceService.getColumns).toHaveBeenCalledWith(id, tableName);
      expect(result).toEqual(expectedResult);
    });

    it('应该在数据源不存在时返回错误', async () => {
      const id = 999;
      const tableName = 'sys_user';
      const expectedResult = Result.fail(404, '数据源不存在');
      mockDataSourceService.getColumns.mockResolvedValue(expectedResult);

      const result = await controller.getColumns(id, tableName);

      expect(result.code).toBe(404);
    });
  });
});
