/**
 * 代码生成器服务单元测试
 *
 * @description 测试 ToolService 的所有方法
 * Requirements: 11.1, 15.1
 */
import { Test, TestingModule } from '@nestjs/testing';
import { ToolService } from '@/modules/tools/tool.service';
import { PrismaService } from '@/platform/prisma';
import { PreviewService } from '@/modules/tools/preview/preview.service';
import { BusinessException } from '@/shared/exceptions';
import { ResponseCode } from '@/shared/response';

describe('ToolService', () => {
  let service: ToolService;
  let mockPrismaService: any;
  let mockPreviewService: any;

  beforeEach(async () => {
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
        delete: jest.fn(),
        deleteMany: jest.fn(),
      },
      $transaction: jest.fn((callback) => {
        if (typeof callback === 'function') {
          return callback(mockPrismaService);
        }
        return Promise.all(callback);
      }),
      $queryRaw: jest.fn(),
    };

    mockPreviewService = {
      createPreviewResponse: jest.fn(),
    };

    const modules: TestingModule = await Test.createTestingModule({
      providers: [
        ToolService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: PreviewService,
          useValue: mockPreviewService,
        },
      ],
    }).compile();

    service = modules.get<ToolService>(ToolService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAll - 查询生成表数据', () => {
    it('应该返回分页的表列表', async () => {
      const query = { pageNum: 1, pageSize: 10, skip: 0, take: 10 };
      const mockTables = [
        { tableId: 1, tableName: 'sys_user', tableComment: '用户表' },
        { tableId: 2, tableName: 'sys_role', tableComment: '角色表' },
      ];

      mockPrismaService.$transaction.mockResolvedValue([mockTables, 2]);

      const result = await service.findAll(query as any);

      expect(result.code).toBe(200);
      expect(result.data!.rows).toHaveLength(2);
      expect(result.data!.total).toBe(2);
    });

    it('应该支持按表名筛选', async () => {
      const query = { pageNum: 1, pageSize: 10, skip: 0, take: 10, tableNames: 'sys_user' };
      mockPrismaService.$transaction.mockResolvedValue([[], 0]);

      await service.findAll(query as any);

      expect(mockPrismaService.$transaction).toHaveBeenCalled();
    });

    it('应该支持按表注释筛选', async () => {
      const query = { pageNum: 1, pageSize: 10, skip: 0, take: 10, tableComment: '用户' };
      mockPrismaService.$transaction.mockResolvedValue([[], 0]);

      await service.findAll(query as any);

      expect(mockPrismaService.$transaction).toHaveBeenCalled();
    });
  });

  describe('findOne - 根据ID查询表详细信息', () => {
    it('应该返回表详细信息及其列', async () => {
      const mockTable = {
        tableId: 1,
        tableName: 'sys_user',
        tableComment: '用户表',
        delFlag: '0',
      };
      const mockColumns = [
        { columnId: 1, columnName: 'user_id', javaField: 'userId' },
        { columnId: 2, columnName: 'user_name', javaField: 'userName' },
      ];

      mockPrismaService.genTable.findFirst.mockResolvedValue(mockTable);
      mockPrismaService.genTableColumn.findMany.mockResolvedValue(mockColumns);

      const result = await service.findOne(1);

      expect(result.code).toBe(200);
      // @ts-expect-error
      expect(result.data!.info.tableId).toBe(1);
      // @ts-expect-error
      expect(result.data!.info.columns).toHaveLength(2);
    });

    it('应该在表不存在时返回空', async () => {
      mockPrismaService.genTable.findFirst.mockResolvedValue(null);

      const result = await service.findOne(999);

      expect(result.code).toBe(200);
      expect(result.data!.info).toBeNull();
    });
  });

  describe('findOneByTableName - 根据表名查询表详细信息', () => {
    it('应该返回表详细信息', async () => {
      const mockTable = {
        tableId: 1,
        tableName: 'sys_user',
        delFlag: '0',
      };
      const mockColumns = [{ columnId: 1, columnName: 'user_id' }];

      mockPrismaService.genTable.findFirst.mockResolvedValue(mockTable);
      mockPrismaService.genTableColumn.findMany.mockResolvedValue(mockColumns);

      const result = await service.findOneByTableName('sys_user');

      expect(result.tableName).toBe('sys_user');
      expect(result.columns).toHaveLength(1);
    });

    it('应该在表不存在时抛出异常', async () => {
      mockPrismaService.genTable.findFirst.mockResolvedValue(null);

      await expect(service.findOneByTableName('non_existent')).rejects.toThrow(BusinessException);
    });
  });

  describe('genUpdate - 修改代码生成信息', () => {
    it('应该成功更新表和列信息', async () => {
      const genTableUpdate = {
        tableId: 1,
        tableName: 'sys_user',
        className: 'SysUser',
        columns: [
          { columnId: 1, javaField: 'userId' },
          { columnId: 2, javaField: 'userName' },
        ],
      };

      mockPrismaService.genTableColumn.update.mockResolvedValue({});
      mockPrismaService.genTable.update.mockResolvedValue(genTableUpdate);

      const result = await service.genUpdate(genTableUpdate as any);

      expect(result.code).toBe(200);
      expect(mockPrismaService.genTableColumn.update).toHaveBeenCalledTimes(2);
      expect(mockPrismaService.genTable.update).toHaveBeenCalled();
    });

    it('应该跳过没有 columnId 的列', async () => {
      const genTableUpdate = {
        tableId: 1,
        columns: [{ javaField: 'newField' }],
      };

      mockPrismaService.genTable.update.mockResolvedValue(genTableUpdate);

      await service.genUpdate(genTableUpdate as any);

      expect(mockPrismaService.genTableColumn.update).not.toHaveBeenCalled();
    });
  });

  describe('remove - 删除表', () => {
    it('应该成功删除表及其列', async () => {
      mockPrismaService.genTableColumn.deleteMany.mockResolvedValue({ count: 5 });
      mockPrismaService.genTable.delete.mockResolvedValue({ tableId: 1 });

      const result = await service.remove(1);

      expect(result.code).toBe(200);
      expect(mockPrismaService.genTableColumn.deleteMany).toHaveBeenCalledWith({
        where: { tableId: 1 },
      });
      expect(mockPrismaService.genTable.delete).toHaveBeenCalledWith({
        where: { tableId: 1 },
      });
    });
  });

  describe('genDbList - 查询数据库表列表', () => {
    it('应该返回未导入的数据库表列表', async () => {
      const query = { pageNum: 1, pageSize: 10, skip: 0, take: 10 };
      const mockTables = [
        { tableName: 'new_table', tableComment: '新表', createTime: new Date(), updateTime: new Date() },
      ];

      mockPrismaService.$queryRaw
        .mockResolvedValueOnce(mockTables)
        .mockResolvedValueOnce([{ total: BigInt(1) }]);

      const result = await service.genDbList(query as any);

      expect(result.code).toBe(200);
      expect(result.data!.list).toHaveLength(1);
      expect(result.data!.total).toBe(1);
    });

    it('应该支持按表名筛选', async () => {
      const query = { pageNum: 1, pageSize: 10, skip: 0, take: 10, tableName: 'sys' };
      mockPrismaService.$queryRaw
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([{ total: BigInt(0) }]);

      await service.genDbList(query as any);

      expect(mockPrismaService.$queryRaw).toHaveBeenCalled();
    });
  });

  describe('getDataNames - 获取数据源名称列表', () => {
    it('应该返回默认数据源名称', async () => {
      const result = await service.getDataNames();

      expect(result.code).toBe(200);
      expect(result.data).toContain('master');
    });
  });

  describe('preview - 预览生成代码', () => {
    it('应该返回预览的代码内容', async () => {
      const mockTable = {
        tableId: 1,
        tableName: 'sys_user',
        businessName: 'user',
        delFlag: '0',
      };
      const mockColumns = [
        { columnId: 1, columnName: 'user_id', isPk: '1', javaField: 'userId' },
      ];
      const mockPreviewResponse = {
        files: [{ name: 'user.controller.ts', path: 'src/controller/user.controller.ts', content: '...' }],
        fileTree: [],
        totalFiles: 1,
        totalLines: 100,
        totalSize: 2048,
      };

      mockPrismaService.genTable.findFirst.mockResolvedValue(mockTable);
      mockPrismaService.genTableColumn.findMany.mockResolvedValue(mockColumns);
      mockPreviewService.createPreviewResponse.mockReturnValue(mockPreviewResponse);

      const result = await service.preview(1);

      expect(result.code).toBe(200);
      expect(result.data!.files).toHaveLength(1);
      expect(mockPreviewService.createPreviewResponse).toHaveBeenCalled();
    });

    it('应该在表不存在时抛出异常', async () => {
      mockPrismaService.genTable.findFirst.mockResolvedValue(null);

      await expect(service.preview(999)).rejects.toThrow(BusinessException);
    });
  });

  describe('getPrimaryKey - 查询主键', () => {
    it('应该返回主键字段名', async () => {
      const columns = [
        { columnId: 1, columnName: 'user_id', isPk: '1', javaField: 'userId' },
        { columnId: 2, columnName: 'user_name', isPk: '0', javaField: 'userName' },
      ];

      const result = await service.getPrimaryKey(columns as any);

      expect(result).toBe('userId');
    });

    it('应该在没有主键时返回 null', async () => {
      const columns = [
        { columnId: 1, columnName: 'user_name', isPk: '0', javaField: 'userName' },
      ];

      const result = await service.getPrimaryKey(columns as any);

      expect(result).toBeNull();
    });
  });

  describe('initTableColumn - 初始化表列字段信息', () => {
    it('应该正确初始化字符串类型列', () => {
      const column: any = {
        columnName: 'user_name',
        columnType: 'varchar',
        isPk: '0',
      };
      const table = { tableId: 1 };

      service.initTableColumn(column, table);

      expect(column.javaField).toBe('userName');
      expect(column.javaType).toBe('String');
      expect(column.htmlType).toBe('input');
    });

    it('应该正确初始化日期类型列', () => {
      const column: any = {
        columnName: 'create_time',
        columnType: 'timestamp',
        isPk: '0',
      };
      const table = { tableId: 1 };

      service.initTableColumn(column, table);

      expect(column.javaType).toBe('Date');
      expect(column.htmlType).toBe('datetime');
    });

    it('应该正确初始化数字类型列', () => {
      const column: any = {
        columnName: 'age',
        columnType: 'integer',
        isPk: '0',
      };
      const table = { tableId: 1 };

      service.initTableColumn(column, table);

      expect(column.javaType).toBe('Number');
      expect(column.htmlType).toBe('input');
    });

    it('应该正确初始化主键列', () => {
      const column: any = {
        columnName: 'user_id',
        columnType: 'bigint',
        isPk: '1',
      };
      const table = { tableId: 1 };

      service.initTableColumn(column, table);

      expect(column.isInsert).toBe('0');
      expect(column.isEdit).toBe('1');
      expect(column.isQuery).toBe('1');
      expect(column.isList).toBe('1');
    });

    it('应该为状态字段设置单选框', () => {
      const column: any = {
        columnName: 'status',
        columnType: 'varchar',
        isPk: '0',
      };
      const table = { tableId: 1 };

      service.initTableColumn(column, table);

      expect(column.htmlType).toBe('radio');
    });

    it('应该为类型字段设置下拉框', () => {
      const column: any = {
        columnName: 'user_type',
        columnType: 'varchar',
        isPk: '0',
      };
      const table = { tableId: 1 };

      service.initTableColumn(column, table);

      expect(column.htmlType).toBe('select');
    });

    it('应该为名称字段设置模糊查询', () => {
      const column: any = {
        columnName: 'user_name',
        columnType: 'varchar',
        isPk: '0',
      };
      const table = { tableId: 1 };

      service.initTableColumn(column, table);

      expect(column.queryType).toBe('LIKE');
    });
  });
});
