/**
 * 历史服务属性测试
 *
 * Property 12: 生成历史数量限制
 * **Validates: Requirements 9.2**
 */
import * as fc from 'fast-check';
import { HistoryService } from '@/modules/tools/history/history.service';
import { PrismaService } from '@/platform/prisma';
import { Test, TestingModule } from '@nestjs/testing';
import { TenantContext } from '@/core/tenancy/context/tenant.context';

describe('HistoryService - Property Tests', () => {
  let service: HistoryService;
  let mockPrismaService: any;

  // 模拟存储的历史记录
  let mockHistoryStore: Map<string, any[]>;

  beforeEach(async () => {
    // 重置模拟存储
    mockHistoryStore = new Map();

    // 创建 mock PrismaService
    mockPrismaService = {
      genHistory: {
        create: jest.fn().mockImplementation(async ({ data }) => {
          const key = `${data.tenantId}-${data.tableId}`;
          if (!mockHistoryStore.has(key)) {
            mockHistoryStore.set(key, []);
          }
          const history = {
            id: Math.floor(Math.random() * 100000),
            ...data,
          };
          mockHistoryStore.get(key)!.push(history);
          return history;
        }),
        findMany: jest.fn().mockImplementation(async ({ where, orderBy, select }) => {
          const key = `${where.tenantId}-${where.tableId}`;
          const histories = mockHistoryStore.get(key) || [];
          // 按时间降序排序
          const sorted = [...histories].sort(
            (a, b) => new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime(),
          );
          if (select) {
            return sorted.map((h) => ({ id: h.id }));
          }
          return sorted;
        }),
        findFirst: jest.fn().mockImplementation(async ({ where }) => {
          const key = `${where.tenantId}-${where.tableId || where.id}`;
          const histories = mockHistoryStore.get(key) || [];
          if (where.id) {
            // 查找所有存储中的记录
            for (const [, records] of mockHistoryStore) {
              const found = records.find((h) => h.id === where.id);
              if (found && found.tenantId === where.tenantId) {
                return found;
              }
            }
            return null;
          }
          return histories[0] || null;
        }),
        count: jest.fn().mockImplementation(async ({ where }) => {
          const key = `${where.tenantId}-${where.tableId}`;
          return (mockHistoryStore.get(key) || []).length;
        }),
        deleteMany: jest.fn().mockImplementation(async ({ where }) => {
          if (where.id?.in) {
            // 删除指定 ID 的记录
            const idsToDelete = new Set(where.id.in);
            let deletedCount = 0;
            for (const [key, histories] of mockHistoryStore) {
              const before = histories.length;
              const filtered = histories.filter((h) => !idsToDelete.has(h.id));
              mockHistoryStore.set(key, filtered);
              deletedCount += before - filtered.length;
            }
            return { count: deletedCount };
          }
          if (where.generatedAt?.lt) {
            // 删除过期记录
            const cutoff = new Date(where.generatedAt.lt);
            let deletedCount = 0;
            for (const [key, histories] of mockHistoryStore) {
              const before = histories.length;
              const filtered = histories.filter((h) => new Date(h.generatedAt) >= cutoff);
              mockHistoryStore.set(key, filtered);
              deletedCount += before - filtered.length;
            }
            return { count: deletedCount };
          }
          return { count: 0 };
        }),
        delete: jest.fn().mockImplementation(async ({ where }) => {
          for (const [key, histories] of mockHistoryStore) {
            const index = histories.findIndex((h) => h.id === where.id);
            if (index !== -1) {
              const deleted = histories.splice(index, 1)[0];
              return deleted;
            }
          }
          return null;
        }),
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

  describe('Property 12: 生成历史数量限制', () => {
    /**
     * **Validates: Requirements 9.2**
     *
     * *For any* table, the number of stored generation history records
     * should not exceed 10.
     */
    it('should enforce maximum history limit of 10 per table', async () => {
      const MAX_LIMIT = service.getMaxHistoryLimit();

      await fc.assert(
        fc.asyncProperty(
          // 生成随机的表ID
          fc.integer({ min: 1, max: 1000 }),
          // 生成随机的历史记录数量（超过限制）
          fc.integer({ min: MAX_LIMIT + 1, max: MAX_LIMIT + 20 }),
          async (tableId, recordCount) => {
            // 重置存储
            mockHistoryStore.clear();

            const mockUser = { userName: 'testUser', userId: 1 };
            const mockSnapshot = {
              files: [],
              fileTree: [],
              totalFiles: 0,
              totalLines: 0,
              totalSize: 0,
            };

            // 创建多条历史记录
            for (let i = 0; i < recordCount; i++) {
              await service.record(tableId, `test_table_${tableId}`, 1, mockSnapshot, mockUser as any);
            }

            // 验证历史记录数量不超过限制
            const count = await service.getHistoryCount(tableId);
            return count <= MAX_LIMIT;
          },
        ),
        { numRuns: 100 },
      );
    });

    /**
     * **Validates: Requirements 9.2**
     *
     * *For any* sequence of record operations on the same table,
     * the count should never exceed the limit after each operation.
     */
    it('should never exceed limit after any record operation', async () => {
      const MAX_LIMIT = service.getMaxHistoryLimit();

      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 1, max: 1000 }),
          fc.integer({ min: MAX_LIMIT + 1, max: MAX_LIMIT + 15 }),
          async (tableId, recordCount) => {
            // 重置存储
            mockHistoryStore.clear();

            const mockUser = { userName: 'testUser', userId: 1 };
            const mockSnapshot = {
              files: [],
              fileTree: [],
              totalFiles: 0,
              totalLines: 0,
              totalSize: 0,
            };

            // 创建超过限制的记录，每次创建后检查数量
            for (let i = 0; i < recordCount; i++) {
              await service.record(tableId, `test_table_${tableId}`, 1, mockSnapshot, mockUser as any);

              // 每次记录后，验证数量不超过限制
              const count = await service.getHistoryCount(tableId);
              if (count > MAX_LIMIT) {
                return false;
              }
            }

            // 最终验证
            const finalCount = await service.getHistoryCount(tableId);
            return finalCount <= MAX_LIMIT;
          },
        ),
        { numRuns: 100 },
      );
    });

    /**
     * **Validates: Requirements 9.2**
     *
     * *For any* number of records less than or equal to the limit,
     * all records should be preserved.
     */
    it('should preserve all records when under limit', async () => {
      const MAX_LIMIT = service.getMaxHistoryLimit();

      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 1, max: 1000 }),
          fc.integer({ min: 1, max: MAX_LIMIT }),
          async (tableId, recordCount) => {
            // 重置存储
            mockHistoryStore.clear();

            const mockUser = { userName: 'testUser', userId: 1 };
            const mockSnapshot = {
              files: [],
              fileTree: [],
              totalFiles: 0,
              totalLines: 0,
              totalSize: 0,
            };

            // 创建不超过限制的记录
            for (let i = 0; i < recordCount; i++) {
              await service.record(tableId, `test_table_${tableId}`, 1, mockSnapshot, mockUser as any);
            }

            // 验证所有记录都被保留
            const count = await service.getHistoryCount(tableId);
            return count === recordCount;
          },
        ),
        { numRuns: 100 },
      );
    });

    /**
     * **Validates: Requirements 9.2**
     *
     * *For any* two different tables, their history limits should be independent.
     */
    it('should maintain independent limits for different tables', async () => {
      const MAX_LIMIT = service.getMaxHistoryLimit();

      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 1, max: 500 }),
          fc.integer({ min: 501, max: 1000 }),
          fc.integer({ min: MAX_LIMIT + 1, max: MAX_LIMIT + 10 }),
          fc.integer({ min: MAX_LIMIT + 1, max: MAX_LIMIT + 10 }),
          async (tableId1, tableId2, recordCount1, recordCount2) => {
            // 重置存储
            mockHistoryStore.clear();

            const mockUser = { userName: 'testUser', userId: 1 };
            const mockSnapshot = {
              files: [],
              fileTree: [],
              totalFiles: 0,
              totalLines: 0,
              totalSize: 0,
            };

            // 为两个表创建记录
            for (let i = 0; i < recordCount1; i++) {
              await service.record(tableId1, `table_${tableId1}`, 1, mockSnapshot, mockUser as any);
            }

            for (let i = 0; i < recordCount2; i++) {
              await service.record(tableId2, `table_${tableId2}`, 1, mockSnapshot, mockUser as any);
            }

            // 验证两个表的记录数量都不超过限制
            const count1 = await service.getHistoryCount(tableId1);
            const count2 = await service.getHistoryCount(tableId2);

            return count1 <= MAX_LIMIT && count2 <= MAX_LIMIT;
          },
        ),
        { numRuns: 100 },
      );
    });
  });
});
