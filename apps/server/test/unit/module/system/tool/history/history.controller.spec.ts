/**
 * 历史记录控制器单元测试
 *
 * @description 测试 HistoryController 的所有接口
 * Requirements: 9.3, 9.5, 11.1
 */
import { Test, TestingModule } from '@nestjs/testing';
import { HistoryController } from '@/modules/tools/history/history.controller';
import { HistoryService } from '@/modules/tools/history/history.service';
import { Result } from '@/shared/response';
import { Response } from 'express';
import { Reflector } from '@nestjs/core';

// Mock guards
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

describe('HistoryController', () => {
  let controller: HistoryController;
  let mockHistoryService: any;
  let mockResponse: Partial<Response>;

  beforeEach(async () => {
    mockHistoryService = {
      getHistory: jest.fn(),
      getHistoryDetail: jest.fn(),
      deleteHistory: jest.fn(),
      batchDeleteHistory: jest.fn(),
      cleanupOldHistory: jest.fn(),
    };

    mockResponse = {
      download: jest.fn(),
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      send: jest.fn(),
    };

    const modules: TestingModule = await Test.createTestingModule({
      controllers: [HistoryController],
      providers: [
        {
          provide: HistoryService,
          useValue: mockHistoryService,
        },
        Reflector,
      ],
    }).compile();

    controller = modules.get<HistoryController>(HistoryController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('list - 查询历史记录列表', () => {
    it('应该返回分页的历史记录列表', async () => {
      const query = { pageNum: 1, pageSize: 10 };
      const expectedResult = Result.page(
        [
          {
            id: 1,
            tableId: 1,
            tableName: 'sys_user',
            generatedBy: 'admin',
            generatedAt: new Date(),
          },
        ],
        1,
        1,
        10,
      );
      mockHistoryService.getHistory.mockResolvedValue(expectedResult);

      const result = await controller.list(query as any);

      expect(mockHistoryService.getHistory).toHaveBeenCalledWith({
        tableId: undefined,
        tableName: undefined,
        pageNum: 1,
        pageSize: 10,
      });
      expect(result).toEqual(expectedResult);
    });

    it('应该支持按表ID筛选', async () => {
      const query = { pageNum: 1, pageSize: 10, tableId: 1 };
      mockHistoryService.getHistory.mockResolvedValue(Result.page([], 0, 1, 10));

      await controller.list(query as any);

      expect(mockHistoryService.getHistory).toHaveBeenCalledWith(
        expect.objectContaining({ tableId: 1 }),
      );
    });

    it('应该支持按表名筛选', async () => {
      const query = { pageNum: 1, pageSize: 10, tableName: 'sys_user' };
      mockHistoryService.getHistory.mockResolvedValue(Result.page([], 0, 1, 10));

      await controller.list(query as any);

      expect(mockHistoryService.getHistory).toHaveBeenCalledWith(
        expect.objectContaining({ tableName: 'sys_user' }),
      );
    });
  });

  describe('findOne - 查询历史记录详情', () => {
    it('应该返回历史记录详情', async () => {
      const id = 1;
      const expectedResult = Result.ok({
        id: 1,
        tableId: 1,
        tableName: 'sys_user',
        snapshotData: {
          files: [{ name: 'user.controller.ts', content: '...' }],
          totalFiles: 1,
        },
      });
      mockHistoryService.getHistoryDetail.mockResolvedValue(expectedResult);

      const result = await controller.findOne(id);

      expect(mockHistoryService.getHistoryDetail).toHaveBeenCalledWith(id);
      expect(result).toEqual(expectedResult);
    });

    it('应该在历史记录不存在时返回错误', async () => {
      const id = 999;
      const expectedResult = Result.fail(404, '历史记录不存在');
      mockHistoryService.getHistoryDetail.mockResolvedValue(expectedResult);

      const result = await controller.findOne(id);

      expect(result.code).toBe(404);
    });
  });

  describe('download - 下载历史版本代码', () => {
    it('应该成功下载历史版本代码', async () => {
      const id = 1;
      const mockHistory = {
        id: 1,
        tableName: 'sys_user',
        snapshotData: {
          files: [
            { name: 'user.controller.ts', path: 'src/controller/user.controller.ts', content: 'content' },
          ],
        },
      };
      const mockResult = Result.ok(mockHistory);
      mockResult.isSuccess = () => true;
      mockHistoryService.getHistoryDetail.mockResolvedValue(mockResult);

      // 由于 download 方法涉及文件系统操作，这里只验证服务调用
      await controller.download(id, mockResponse as Response);

      expect(mockHistoryService.getHistoryDetail).toHaveBeenCalledWith(id);
    });

    it('应该在历史记录不存在时返回 404', async () => {
      const id = 999;
      const mockResult = Result.fail(404, '历史记录不存在');
      mockResult.isSuccess = () => false;
      mockHistoryService.getHistoryDetail.mockResolvedValue(mockResult);

      await controller.download(id, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalled();
    });
  });

  describe('delete - 删除历史记录', () => {
    it('应该成功删除历史记录', async () => {
      const id = 1;
      const expectedResult = Result.ok(null, '删除成功');
      mockHistoryService.deleteHistory.mockResolvedValue(expectedResult);

      const result = await controller.delete(id);

      expect(mockHistoryService.deleteHistory).toHaveBeenCalledWith(id);
      expect(result).toEqual(expectedResult);
    });

    it('应该在历史记录不存在时返回错误', async () => {
      const id = 999;
      const expectedResult = Result.fail(404, '历史记录不存在');
      mockHistoryService.deleteHistory.mockResolvedValue(expectedResult);

      const result = await controller.delete(id);

      expect(result.code).toBe(404);
    });
  });

  describe('batchDelete - 批量删除历史记录', () => {
    it('应该成功批量删除历史记录', async () => {
      const dto = { historyIds: [1, 2, 3] };
      const expectedResult = Result.ok(3, '成功删除 3 条记录');
      mockHistoryService.batchDeleteHistory.mockResolvedValue(expectedResult);

      const result = await controller.batchDelete(dto as any);

      expect(mockHistoryService.batchDeleteHistory).toHaveBeenCalledWith(dto.historyIds);
      expect(result).toEqual(expectedResult);
    });

    it('应该处理空数组', async () => {
      const dto = { historyIds: [] };
      const expectedResult = Result.ok(0, '成功删除 0 条记录');
      mockHistoryService.batchDeleteHistory.mockResolvedValue(expectedResult);

      const result = await controller.batchDelete(dto as any);

      expect(result.data).toBe(0);
    });
  });

  describe('cleanup - 清理过期历史记录', () => {
    it('应该使用默认天数清理过期记录', async () => {
      const expectedResult = Result.ok(10, '成功清理 10 条过期记录');
      mockHistoryService.cleanupOldHistory.mockResolvedValue(expectedResult);

      const result = await controller.cleanup();

      expect(mockHistoryService.cleanupOldHistory).toHaveBeenCalledWith(undefined);
      expect(result).toEqual(expectedResult);
    });

    it('应该使用指定天数清理过期记录', async () => {
      const days = 7;
      const expectedResult = Result.ok(5, '成功清理 5 条过期记录');
      mockHistoryService.cleanupOldHistory.mockResolvedValue(expectedResult);

      const result = await controller.cleanup(days);

      expect(mockHistoryService.cleanupOldHistory).toHaveBeenCalledWith(7);
      expect(result).toEqual(expectedResult);
    });
  });
});
