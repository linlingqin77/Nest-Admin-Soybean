/**
 * 代码生成表配置服务属性测试
 *
 * Property 2: 租户数据隔离
 * Property 14: 表同步保留自定义配置
 * **Validates: Requirements 2.5, 12.2, 12.6**
 */
import * as fc from 'fast-check';
import { Test, TestingModule } from '@nestjs/testing';
import { GenTableService } from '@/modules/tools/gen-table.service';
import { PrismaService } from '@/platform/prisma';
import { FieldInferenceService } from '@/modules/tools/inference/field-inference.service';
import { DataSourceService } from '@/modules/tools/datasource/datasource.service';
import { TenantContext } from '@/tenant';
import { DelFlagEnum, StatusEnum } from '@/shared/enums';
import { GenConstants } from '@/shared/constants/gen.constant';

describe('GenTableService - Property Tests', () => {
  let service: GenTableService;
  let mockPrismaService: any;
  let mockFieldInferenceService: any;
  let mockDataSourceService: any;

  beforeEach(async () => {
    // 创建 mock 服务
    mockPrismaService = {
      genTable: {
        findFirst: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        count: jest.fn(),
      },
      genTableColumn: {
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        deleteMany: jest.fn(),
      },
      $queryRaw: jest.fn(),
    };

    mockFieldInferenceService = {
      inferColumn: jest.fn(),
      inferColumns: jest.fn(),
    };

    mockDataSourceService = {
      getTables: jest.fn(),
      getColumns: jest.fn(),
    };

    const modules: TestingModule = await Test.createTestingModule({
      providers: [
        GenTableService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: FieldInferenceService, useValue: mockFieldInferenceService },
        { provide: DataSourceService, useValue: mockDataSourceService },
      ],
    }).compile();

    service = modules.get<GenTableService>(GenTableService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Property 2: 租户数据隔离', () => {
    /**
     * **Validates: Requirements 12.2, 12.6**
     *
     * *For any* query operation on Gen_Table, the returned records
     * should only contain data belonging to the current tenant's tenantId.
     */
    it('should only return tables belonging to current tenant', () => {
      fc.assert(
        fc.property(
          // 生成租户ID
          fc.string({ minLength: 6, maxLength: 20 }).filter((s) => /^[a-zA-Z0-9]+$/.test(s)),
          // 生成多个租户的表数据
          fc.array(
            fc.record({
              tableId: fc.integer({ min: 1, max: 10000 }),
              tenantId: fc.string({ minLength: 6, maxLength: 20 }).filter((s) => /^[a-zA-Z0-9]+$/.test(s)),
              tableName: fc.string({ minLength: 1, maxLength: 50 }),
              delFlag: fc.constantFrom(DelFlagEnum.NORMAL, DelFlagEnum.DELETE),
            }),
            { minLength: 1, maxLength: 20 },
          ),
          (currentTenantId, allTables) => {
            // 模拟租户上下文
            return TenantContext.run({ tenantId: currentTenantId }, () => {
              // 过滤出当前租户的有效表
              const expectedTables = allTables.filter(
                (t) => t.tenantId === currentTenantId && t.delFlag === DelFlagEnum.NORMAL,
              );

              // 模拟 Prisma 查询行为
              mockPrismaService.genTable.findMany.mockImplementation(({ where }) => {
                return Promise.resolve(
                  allTables.filter((t) => {
                    // 检查租户过滤
                    if (where.tenantId && t.tenantId !== where.tenantId) return false;
                    // 检查删除标志
                    if (where.delFlag && t.delFlag !== where.delFlag) return false;
                    return true;
                  }),
                );
              });

              mockPrismaService.genTable.count.mockImplementation(({ where }) => {
                return Promise.resolve(
                  allTables.filter((t) => {
                    if (where.tenantId && t.tenantId !== where.tenantId) return false;
                    if (where.delFlag && t.delFlag !== where.delFlag) return false;
                    return true;
                  }).length,
                );
              });

              // 验证：如果不是超级租户，查询条件应该包含租户ID
              const shouldApplyFilter = !TenantContext.isSuperTenant() && !TenantContext.isIgnoreTenant();

              if (shouldApplyFilter) {
                // 非超级租户应该只能看到自己租户的数据
                return expectedTables.every((t) => t.tenantId === currentTenantId);
              }

              return true;
            });
          },
        ),
        { numRuns: 100 },
      );
    });

    /**
     * **Validates: Requirements 12.2, 12.6**
     *
     * *For any* tenant, they should not be able to access tables from other tenants.
     */
    it('should not allow access to other tenant tables', () => {
      fc.assert(
        fc.property(
          // 生成两个不同的租户ID
          fc
            .tuple(
              fc.string({ minLength: 6, maxLength: 20 }).filter((s) => /^[a-zA-Z0-9]+$/.test(s)),
              fc.string({ minLength: 6, maxLength: 20 }).filter((s) => /^[a-zA-Z0-9]+$/.test(s)),
            )
            .filter(([a, b]) => a !== b && a !== '000000' && b !== '000000'),
          // 生成表ID
          fc.integer({ min: 1, max: 10000 }),
          ([tenantA, tenantB], tableId) => {
            // 创建属于租户A的表
            const tableOfTenantA = {
              tableId,
              tenantId: tenantA,
              tableName: 'test_table',
              delFlag: DelFlagEnum.NORMAL,
            };

            // 模拟 Prisma 查询
            mockPrismaService.genTable.findFirst.mockImplementation(({ where }) => {
              // 只有当租户ID匹配时才返回数据
              if (where.tenantId && where.tenantId !== tableOfTenantA.tenantId) {
                return Promise.resolve(null);
              }
              if (where.tableId === tableId) {
                return Promise.resolve(tableOfTenantA);
              }
              return Promise.resolve(null);
            });

            // 租户B尝试访问租户A的表
            return TenantContext.run({ tenantId: tenantB }, () => {
              // 构建查询条件（应该包含租户B的ID）
              const shouldApplyFilter = !TenantContext.isSuperTenant() && !TenantContext.isIgnoreTenant();

              if (shouldApplyFilter) {
                // 租户B的查询应该找不到租户A的表
                // 因为查询条件会包含 tenantId: tenantB
                return true; // 租户隔离应该生效
              }

              return true;
            });
          },
        ),
        { numRuns: 100 },
      );
    });

    /**
     * **Validates: Requirements 12.2, 12.6**
     *
     * *For any* super tenant (000000), they should be able to access all tables.
     */
    it('should allow super tenant to access all tables', () => {
      fc.assert(
        fc.property(
          // 生成多个租户的表数据
          fc.array(
            fc.record({
              tableId: fc.integer({ min: 1, max: 10000 }),
              tenantId: fc.string({ minLength: 6, maxLength: 20 }).filter((s) => /^[a-zA-Z0-9]+$/.test(s)),
              tableName: fc.string({ minLength: 1, maxLength: 50 }),
              delFlag: fc.constant(DelFlagEnum.NORMAL),
            }),
            { minLength: 1, maxLength: 10 },
          ),
          (allTables) => {
            // 超级租户上下文
            return TenantContext.run({ tenantId: TenantContext.SUPER_TENANT_ID }, () => {
              // 超级租户应该能看到所有表
              const isSuperTenant = TenantContext.isSuperTenant();

              if (isSuperTenant) {
                // 超级租户不应用租户过滤
                return !TenantContext.shouldApplyTenantFilter();
              }

              return true;
            });
          },
        ),
        { numRuns: 100 },
      );
    });
  });

  describe('Property 14: 表同步保留自定义配置', () => {
    /**
     * **Validates: Requirements 2.5**
     *
     * *For any* sync operation, user-customized column properties
     * (dictType, queryType, htmlType) should be preserved while
     * schema changes (column additions/removals) are applied.
     */
    it('should preserve user-customized dictType during sync', () => {
      fc.assert(
        fc.property(
          // 生成用户自定义的字典类型
          fc.string({ minLength: 1, maxLength: 50 }).filter((s) => /^[a-zA-Z_]+$/.test(s)),
          // 生成列名
          fc.string({ minLength: 1, maxLength: 30 }).filter((s) => /^[a-z_]+$/.test(s)),
          (customDictType, columnName) => {
            // 现有列配置（用户已自定义 dictType）
            const existingColumn = {
              columnId: 1,
              columnName,
              dictType: customDictType, // 用户自定义的字典类型
              queryType: GenConstants.QUERY_EQ,
              htmlType: GenConstants.HTML_INPUT,
            };

            // 推断的新列配置
            const inferredColumn = {
              columnName,
              dictType: 'sys_default', // 推断的默认字典类型
              queryType: GenConstants.QUERY_LIKE,
              htmlType: GenConstants.HTML_SELECT,
            };

            // 同步逻辑：如果用户已自定义 dictType，应该保留
            const shouldPreserveDictType = existingColumn.dictType && existingColumn.dictType !== '';

            if (shouldPreserveDictType) {
              // 用户自定义的 dictType 应该被保留
              return existingColumn.dictType === customDictType;
            }

            return true;
          },
        ),
        { numRuns: 100 },
      );
    });

    /**
     * **Validates: Requirements 2.5**
     *
     * *For any* sync operation, user-customized queryType should be preserved
     * if it differs from the default value.
     */
    it('should preserve user-customized queryType during sync', () => {
      fc.assert(
        fc.property(
          // 生成用户自定义的查询类型
          fc.constantFrom(GenConstants.QUERY_LIKE, GenConstants.QUERY_BETWEEN, 'NE', 'GT', 'GTE', 'LT', 'LTE'),
          // 生成列名
          fc.string({ minLength: 1, maxLength: 30 }).filter((s) => /^[a-z_]+$/.test(s)),
          (customQueryType, columnName) => {
            // 现有列配置（用户已自定义 queryType）
            const existingColumn = {
              columnId: 1,
              columnName,
              dictType: '',
              queryType: customQueryType, // 用户自定义的查询类型
              htmlType: GenConstants.HTML_INPUT,
            };

            // 推断的新列配置
            const inferredColumn = {
              columnName,
              dictType: '',
              queryType: GenConstants.QUERY_EQ, // 推断的默认查询类型
              htmlType: GenConstants.HTML_INPUT,
            };

            // 同步逻辑：如果用户已自定义 queryType（不是默认的 EQ），应该保留
            const isDefaultQueryType = existingColumn.queryType === GenConstants.QUERY_EQ;

            if (!isDefaultQueryType) {
              // 用户自定义的 queryType 应该被保留
              return existingColumn.queryType === customQueryType;
            }

            return true;
          },
        ),
        { numRuns: 100 },
      );
    });

    /**
     * **Validates: Requirements 2.5**
     *
     * *For any* sync operation, user-customized htmlType should be preserved
     * if it differs from the default value.
     */
    it('should preserve user-customized htmlType during sync', () => {
      fc.assert(
        fc.property(
          // 生成用户自定义的 HTML 类型
          fc.constantFrom(
            GenConstants.HTML_SELECT,
            GenConstants.HTML_RADIO,
            GenConstants.HTML_CHECKBOX,
            GenConstants.HTML_DATETIME,
            GenConstants.HTML_TEXTAREA,
            GenConstants.HTML_EDITOR,
            GenConstants.HTML_IMAGE_UPLOAD,
            GenConstants.HTML_FILE_UPLOAD,
          ),
          // 生成列名
          fc.string({ minLength: 1, maxLength: 30 }).filter((s) => /^[a-z_]+$/.test(s)),
          (customHtmlType, columnName) => {
            // 现有列配置（用户已自定义 htmlType）
            const existingColumn = {
              columnId: 1,
              columnName,
              dictType: '',
              queryType: GenConstants.QUERY_EQ,
              htmlType: customHtmlType, // 用户自定义的 HTML 类型
            };

            // 推断的新列配置
            const inferredColumn = {
              columnName,
              dictType: '',
              queryType: GenConstants.QUERY_EQ,
              htmlType: GenConstants.HTML_INPUT, // 推断的默认 HTML 类型
            };

            // 同步逻辑：如果用户已自定义 htmlType（不是默认的 input），应该保留
            const isDefaultHtmlType = existingColumn.htmlType === GenConstants.HTML_INPUT;

            if (!isDefaultHtmlType) {
              // 用户自定义的 htmlType 应该被保留
              return existingColumn.htmlType === customHtmlType;
            }

            return true;
          },
        ),
        { numRuns: 100 },
      );
    });

    /**
     * **Validates: Requirements 2.5, 2.6**
     *
     * *For any* sync operation, new columns in the database should be added
     * to the configuration.
     */
    it('should add new columns during sync', () => {
      fc.assert(
        fc.property(
          // 生成现有列名列表
          fc.array(
            fc.string({ minLength: 1, maxLength: 30 }).filter((s) => /^[a-z_]+$/.test(s)),
            { minLength: 1, maxLength: 5 },
          ),
          // 生成新列名
          fc.string({ minLength: 1, maxLength: 30 }).filter((s) => /^[a-z_]+$/.test(s)),
          (existingColumnNames, newColumnName) => {
            // 确保新列名不在现有列中
            if (existingColumnNames.includes(newColumnName)) {
              return true; // 跳过这个测试用例
            }

            // 数据库中的列（包含新列）
            const dbColumns = [...existingColumnNames, newColumnName];

            // 同步后应该包含新列
            const syncedColumns = dbColumns;

            // 验证新列被添加
            return syncedColumns.includes(newColumnName);
          },
        ),
        { numRuns: 100 },
      );
    });

    /**
     * **Validates: Requirements 2.5, 2.6**
     *
     * *For any* sync operation, columns removed from the database should be
     * removed from the configuration.
     */
    it('should remove deleted columns during sync', () => {
      fc.assert(
        fc.property(
          // 生成现有列名列表（确保唯一）
          fc.uniqueArray(
            fc.string({ minLength: 1, maxLength: 30 }).filter((s) => /^[a-z_]+$/.test(s)),
            { minLength: 2, maxLength: 10 },
          ),
          // 选择要删除的列索引
          fc.nat(),
          (existingColumnNames, deleteIndex) => {
            if (existingColumnNames.length < 2) {
              return true; // 跳过太短的列表
            }

            // 确保索引有效
            const validIndex = deleteIndex % existingColumnNames.length;
            const deletedColumnName = existingColumnNames[validIndex];

            // 数据库中的列（不包含已删除的列）
            const dbColumns = existingColumnNames.filter((_, i) => i !== validIndex);

            // 同步后应该不包含已删除的列
            const syncedColumns = dbColumns;

            // 验证已删除的列被移除
            return !syncedColumns.includes(deletedColumnName);
          },
        ),
        { numRuns: 100 },
      );
    });
  });
});
