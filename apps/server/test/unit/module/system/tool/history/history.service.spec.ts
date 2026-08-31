/**
 * 历史记录服务单元测试
 *
 * @description 测试 HistoryService 的所有方法
 * Requirements: 9.1, 9.2, 9.3, 9.5, 11.1
 */
import { Test, TestingModule } from '@nestjs/testing';
import { HistoryService } from '@/modules/tools/history/history.service';
import { PrismaService } from '@/platform/prisma';
import { TenantContext } from '@/core/tenancy/context/tenant.context';
import { ResponseCode } from '@/shared/response';

describe('HistoryService', () => {
  let service: HistoryService;
  let mockPrismaService: any;

  beforeEach(async () => {
    mockPrismaService = {
      genHistory: {
        create: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
        delete: jest.fn(),
        deleteMany: jest.fn(),
      },
    };

    const modules: TestingModule = await Test.createTestingModule({
      providers: [
        HistoryService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = modules.get<HistoryService>(HistoryService);

    // 设置租户上下文
    jest.spyOn(TenantContext, 'getTenantId').mockReturnValue('000000');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('record - 记录生成历史', () => {
    it('应该成功记录生成历史', async () => {
      const tableId = 1;
      const tableName = 'sys_user';
      const templateGroupId = 1;
      const snapshot = {
        files: [{ name: 'user.controller.ts', content: '...' }],
        totalFiles: 1,
        totalLines: 100,
        totalSize: 2048,
      };
      const user = { userName: 'admin', userId: 1 };

      mockPrismaService.genHistory.create.mockResolvedValue({
        id: 1,
        tableId,
        tableName,
        templateGroupId,
        snapshot: JSON.stringify(snapshot),
        generatedBy: user.userName,
      });
      mockPrismaService.genHistory.findMany.mockResolvedValue([]);

      const result = await service.record(tableId, tableName, templateGroupId, snapshot as any, user as any);

      expect(result.code).toBe(200);
      expect(result.msg).toBe('记录成功');
      expect(mockPrismaService.genHistory.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            tableId,
            tableName,
            templateGroupId,
            generatedBy: user.userName,
          }),
        }),
      );
    });

    it('应该在记录后清理超出限制的历史', async () => {
      const tableId = 1;
      const tableName = 'sys_user';
      const snapshot = { files: [], totalFiles: 0, totalLines: 0, totalSize: 0 };
      const user = { userName: 'admin', userId: 1 };

      // 模拟已有 11 条记录（超出限制）
      const existingHistories = Array.from({ length: 11 }, (_, i) => ({
        id: i + 1,
        generatedAt: new Date(Date.now() - i * 1000),
      }));

      mockPrismaService.genHistory.create.mockResolvedValue({ id: 12 });
      mockPrismaService.genHistory.findMany.mockResolvedValue(existingHistories);
      mockPrismaService.genHistory.deleteMany.mockResolvedValue({ count: 1 });

      await service.record(tableId, tableName, 1, snapshot as any, user as any);

      expect(mockPrismaService.genHistory.deleteMany).toHaveBeenCalled();
    });
  });

  describe('getHistory - 获取历史记录列表', () => {
    it('应该返回分页的历史记录列表', async () => {
      const query = { pageNum: 1, pageSize: 10 };
      const mockHistories = [
        {
          id: 1,
          tableId: 1,
          tableName: 'sys_user',
          generatedBy: 'admin',
          generatedAt: new Date(),
          table: { tableName: 'sys_user', tableComment: '用户表' },
          templateGroup: { name: 'default' },
        },
      ];

      mockPrismaService.genHistory.findMany.mockResolvedValue(mockHistories);
      mockPrismaService.genHistory.count.mockResolvedValue(1);

      const result = await service.getHistory(query);

      expect(result.code).toBe(200);
      expect(result.data.rows).toHaveLength(1);
      expect(result.data.total).toBe(1);
    });

    it('应该支持按表ID筛选', async () => {
      const query = { tableId: 1, pageNum: 1, pageSize: 10 };

      mockPrismaService.genHistory.findMany.mockResolvedValue([]);
      mockPrismaService.genHistory.count.mockResolvedValue(0);

      await service.getHistory(query);

      expect(mockPrismaService.genHistory.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ tableId: 1 }),
        }),
      );
    });

    it('应该支持按表名模糊筛选', async () => {
      const query = { tableName: 'sys', pageNum: 1, pageSize: 10 };

      mockPrismaService.genHistory.findMany.mockResolvedValue([]);
      mockPrismaService.genHistory.count.mockResolvedValue(0);

      await service.getHistory(query);

      expect(mockPrismaService.genHistory.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            tableName: { contains: 'sys' },
          }),
        }),
      );
    });
  });

  describe('getHistoryDetail - 获取历史记录详情', () => {
    it('应该返回历史记录详情及解析后的快照', async () => {
      const historyId = 1;
      const snapshotData = {
        files: [{ name: 'user.controller.ts', content: '...' }],
        totalFiles: 1,
      };
      const mockHistory = {
        id: 1,
        tableId: 1,
        tableName: 'sys_user',
        snapshot: JSON.stringify(snapshotData),
        table: { tableName: 'sys_user' },
        templateGroup: { name: 'default' },
      };

      mockPrismaService.genHistory.findFirst.mockResolvedValue(mockHistory);

      const result = await service.getHistoryDetail(historyId);

      expect(result.code).toBe(200);
      expect(result.data?.snapshotData).toEqual(snapshotData);
    });

    it('应该在历史记录不存在时返回错误', async () => {
      const historyId = 999;

      mockPrismaService.genHistory.findFirst.mockResolvedValue(null);

      const result = await service.getHistoryDetail(historyId);

      expect(result.code).toBe(ResponseCode.DATA_NOT_FOUND);
    });

    it('应该在快照解析失败时返回错误', async () => {
      const historyId = 1;
      const mockHistory = {
        id: 1,
        snapshot: 'invalid json',
        table: {},
        templateGroup: {},
      };

      mockPrismaService.genHistory.findFirst.mockResolvedValue(mockHistory);

      const result = await service.getHistoryDetail(historyId);

      expect(result.code).toBe(ResponseCode.OPERATION_FAILED);
    });
  });

  describe('getHistoryCount - 获取表的历史记录数量', () => {
    it('应该返回历史记录数量', async () => {
      const tableId = 1;

      mockPrismaService.genHistory.count.mockResolvedValue(5);

      const result = await service.getHistoryCount(tableId);

      expect(result).toBe(5);
      expect(mockPrismaService.genHistory.count).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ tableId }),
        }),
      );
    });
  });

  describe('cleanupOldHistory - 清理过期历史记录', () => {
    it('应该使用默认天数清理过期记录', async () => {
      mockPrismaService.genHistory.deleteMany.mockResolvedValue({ count: 10 });

      const result = await service.cleanupOldHistory();

      expect(result.code).toBe(200);
      expect(result.data).toBe(10);
      expect(result.msg).toBe('成功清理 10 条过期记录');
    });

    it('应该使用指定天数清理过期记录', async () => {
      const days = 7;

      mockPrismaService.genHistory.deleteMany.mockResolvedValue({ count: 5 });

      const result = await service.cleanupOldHistory(days);

      expect(result.code).toBe(200);
      expect(result.data).toBe(5);
      expect(mockPrismaService.genHistory.deleteMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            generatedAt: expect.objectContaining({ lt: expect.any(Date) }),
          }),
        }),
      );
    });

    it('应该在清理失败时返回错误', async () => {
      mockPrismaService.genHistory.deleteMany.mockRejectedValue(new Error('Database error'));

      const result = await service.cleanupOldHistory();

      expect(result.code).toBe(ResponseCode.OPERATION_FAILED);
    });
  });

  describe('deleteHistory - 删除指定历史记录', () => {
    it('应该成功删除历史记录', async () => {
      const historyId = 1;

      mockPrismaService.genHistory.findFirst.mockResolvedValue({ id: 1 });
      mockPrismaService.genHistory.delete.mockResolvedValue({ id: 1 });

      const result = await service.deleteHistory(historyId);

      expect(result.code).toBe(200);
      expect(result.msg).toBe('删除成功');
    });

    it('应该在历史记录不存在时返回错误', async () => {
      const historyId = 999;

      mockPrismaService.genHistory.findFirst.mockResolvedValue(null);

      const result = await service.deleteHistory(historyId);

      expect(result.code).toBe(ResponseCode.DATA_NOT_FOUND);
    });

    it('应该在删除失败时返回错误', async () => {
      const historyId = 1;

      mockPrismaService.genHistory.findFirst.mockResolvedValue({ id: 1 });
      mockPrismaService.genHistory.delete.mockRejectedValue(new Error('Database error'));

      const result = await service.deleteHistory(historyId);

      expect(result.code).toBe(ResponseCode.OPERATION_FAILED);
    });
  });

  describe('batchDeleteHistory - 批量删除历史记录', () => {
    it('应该成功批量删除历史记录', async () => {
      const historyIds = [1, 2, 3];

      mockPrismaService.genHistory.deleteMany.mockResolvedValue({ count: 3 });

      const result = await service.batchDeleteHistory(historyIds);

      expect(result.code).toBe(200);
      expect(result.data).toBe(3);
      expect(result.msg).toBe('成功删除 3 条记录');
    });

    it('应该处理空数组', async () => {
      const historyIds: number[] = [];

      mockPrismaService.genHistory.deleteMany.mockResolvedValue({ count: 0 });

      const result = await service.batchDeleteHistory(historyIds);

      expect(result.data).toBe(0);
    });

    it('应该在删除失败时返回错误', async () => {
      const historyIds = [1, 2, 3];

      mockPrismaService.genHistory.deleteMany.mockRejectedValue(new Error('Database error'));

      const result = await service.batchDeleteHistory(historyIds);

      expect(result.code).toBe(ResponseCode.OPERATION_FAILED);
    });
  });

  describe('getMaxHistoryLimit - 获取最大历史记录数限制', () => {
    it('应该返回最大历史记录数限制', () => {
      const limit = service.getMaxHistoryLimit();

      expect(limit).toBe(10);
    });
  });
});
