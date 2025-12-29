import { Test, TestingModule } from '@nestjs/testing';
import { DatabaseIntrospectorService } from './database-introspector.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { createPrismaMock } from 'src/test-utils/prisma-mock';
import { GenConstants } from 'src/common/constant/gen.constant';

describe('DatabaseIntrospectorService', () => {
  let service: DatabaseIntrospectorService;
  let prisma: ReturnType<typeof createPrismaMock>;

  beforeEach(async () => {
    prisma = createPrismaMock();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DatabaseIntrospectorService,
        {
          provide: PrismaService,
          useValue: prisma,
        },
      ],
    }).compile();

    service = module.get<DatabaseIntrospectorService>(DatabaseIntrospectorService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('listTables', () => {
    it('should return list of tables', async () => {
      const mockTables = [
        { tableName: 'sys_user', tableComment: '用户表', createTime: new Date(), updateTime: new Date() },
        { tableName: 'sys_role', tableComment: '角色表', createTime: new Date(), updateTime: new Date() },
      ];
      (prisma.$queryRaw as jest.Mock).mockResolvedValue(mockTables);

      const result = await service.listTables();

      expect(result).toEqual(mockTables);
      expect(prisma.$queryRaw).toHaveBeenCalled();
    });

    it('should filter tables by name', async () => {
      const mockTables = [
        { tableName: 'sys_user', tableComment: '用户表', createTime: new Date(), updateTime: new Date() },
      ];
      (prisma.$queryRaw as jest.Mock).mockResolvedValue(mockTables);

      const result = await service.listTables('user');

      expect(result).toEqual(mockTables);
      expect(prisma.$queryRaw).toHaveBeenCalled();
    });

    it('should filter tables by comment', async () => {
      const mockTables = [
        { tableName: 'sys_user', tableComment: '用户表', createTime: new Date(), updateTime: new Date() },
      ];
      (prisma.$queryRaw as jest.Mock).mockResolvedValue(mockTables);

      const result = await service.listTables(undefined, '用户');

      expect(result).toEqual(mockTables);
      expect(prisma.$queryRaw).toHaveBeenCalled();
    });

    it('should return empty array when no tables found', async () => {
      (prisma.$queryRaw as jest.Mock).mockResolvedValue([]);

      const result = await service.listTables();

      expect(result).toEqual([]);
    });
  });

  describe('getTablesByNames', () => {
    it('should return tables by names', async () => {
      const mockTables = [
        { tableName: 'sys_user', tableComment: '用户表', createTime: new Date(), updateTime: new Date() },
      ];
      (prisma.$queryRaw as jest.Mock).mockResolvedValue(mockTables);

      const result = await service.getTablesByNames(['sys_user']);

      expect(result).toEqual(mockTables);
    });

    it('should return empty array for empty input', async () => {
      const result = await service.getTablesByNames([]);

      expect(result).toEqual([]);
      expect(prisma.$queryRaw).not.toHaveBeenCalled();
    });
  });

  describe('getTableColumns', () => {
    it('should return columns for a table', async () => {
      const mockColumns = [
        {
          columnName: 'user_id',
          columnComment: '用户ID',
          columnType: 'bigint',
          isRequired: '1',
          isPk: '1',
          isIncrement: '1',
          columnDefault: null,
          sort: 1,
          maxLength: null,
        },
        {
          columnName: 'user_name',
          columnComment: '用户名',
          columnType: 'character varying',
          isRequired: '1',
          isPk: '0',
          isIncrement: '0',
          columnDefault: null,
          sort: 2,
          maxLength: 50,
        },
      ];
      (prisma.$queryRaw as jest.Mock).mockResolvedValue(mockColumns);

      const result = await service.getTableColumns('sys_user');

      expect(result).toEqual(mockColumns);
      expect(prisma.$queryRaw).toHaveBeenCalled();
    });

    it('should return empty array for empty table name', async () => {
      const result = await service.getTableColumns('');

      expect(result).toEqual([]);
      expect(prisma.$queryRaw).not.toHaveBeenCalled();
    });
  });

  describe('tableExists', () => {
    it('should return true when table exists', async () => {
      (prisma.$queryRaw as jest.Mock).mockResolvedValue([{ exists: true }]);

      const result = await service.tableExists('sys_user');

      expect(result).toBe(true);
    });

    it('should return false when table does not exist', async () => {
      (prisma.$queryRaw as jest.Mock).mockResolvedValue([{ exists: false }]);

      const result = await service.tableExists('nonexistent_table');

      expect(result).toBe(false);
    });
  });

  describe('initColumnConfig', () => {
    const baseColumn = {
      columnName: 'test_column',
      columnComment: '测试列',
      columnType: 'character varying',
      isRequired: '0',
      isPk: '0',
      isIncrement: '0',
      columnDefault: null,
      sort: 1,
      maxLength: 50,
    };

    it('should initialize basic column config', () => {
      const result = service.initColumnConfig(baseColumn, 1, 'admin');

      expect(result.tableId).toBe(1);
      expect(result.columnName).toBe('test_column');
      expect(result.columnComment).toBe('测试列');
      expect(result.javaField).toBe('testColumn');
      expect(result.createBy).toBe('admin');
    });

    it('should set primary key config correctly', () => {
      const pkColumn = { ...baseColumn, isPk: '1', isIncrement: '1' };
      const result = service.initColumnConfig(pkColumn, 1);

      expect(result.isPk).toBe('1');
      expect(result.isIncrement).toBe('1');
      expect(result.isInsert).toBe(GenConstants.NOT_REQUIRE);
      expect(result.isEdit).toBe(GenConstants.REQUIRE);
      expect(result.isQuery).toBe(GenConstants.REQUIRE);
      expect(result.isList).toBe(GenConstants.REQUIRE);
    });

    it('should set textarea for text type', () => {
      const textColumn = { ...baseColumn, columnType: 'text' };
      const result = service.initColumnConfig(textColumn, 1);

      expect(result.htmlType).toBe(GenConstants.HTML_TEXTAREA);
    });

    it('should set textarea for long varchar', () => {
      const longVarcharColumn = { ...baseColumn, columnType: 'text', maxLength: 600 };
      const result = service.initColumnConfig(longVarcharColumn, 1);

      expect(result.htmlType).toBe(GenConstants.HTML_TEXTAREA);
    });

    it('should set datetime for timestamp type', () => {
      const timestampColumn = { ...baseColumn, columnType: 'timestamp' };
      const result = service.initColumnConfig(timestampColumn, 1);

      expect(result.htmlType).toBe(GenConstants.HTML_DATETIME);
      expect(result.javaType).toBe(GenConstants.TYPE_DATE);
    });

    it('should set number type for integer', () => {
      const intColumn = { ...baseColumn, columnType: 'integer' };
      const result = service.initColumnConfig(intColumn, 1);

      expect(result.javaType).toBe(GenConstants.TYPE_NUMBER);
    });

    it('should set like query for name columns', () => {
      const nameColumn = { ...baseColumn, columnName: 'user_name' };
      const result = service.initColumnConfig(nameColumn, 1);

      expect(result.queryType).toBe(GenConstants.QUERY_LIKE);
    });

    it('should set radio for status columns', () => {
      const statusColumn = { ...baseColumn, columnName: 'status' };
      const result = service.initColumnConfig(statusColumn, 1);

      expect(result.htmlType).toBe(GenConstants.HTML_RADIO);
    });

    it('should set select for type columns', () => {
      const typeColumn = { ...baseColumn, columnName: 'user_type' };
      const result = service.initColumnConfig(typeColumn, 1);

      expect(result.htmlType).toBe(GenConstants.HTML_SELECT);
    });

    it('should set datetime and between query for time columns', () => {
      const timeColumn = { ...baseColumn, columnName: 'create_time' };
      const result = service.initColumnConfig(timeColumn, 1);

      expect(result.htmlType).toBe(GenConstants.HTML_DATETIME);
      expect(result.queryType).toBe(GenConstants.QUERY_BETWEEN);
    });

    it('should set image upload for image columns', () => {
      const imageColumn = { ...baseColumn, columnName: 'avatar' };
      const result = service.initColumnConfig(imageColumn, 1);

      expect(result.htmlType).toBe(GenConstants.HTML_IMAGE_UPLOAD);
    });

    it('should set file upload for file columns', () => {
      const fileColumn = { ...baseColumn, columnName: 'attachment' };
      const result = service.initColumnConfig(fileColumn, 1);

      expect(result.htmlType).toBe(GenConstants.HTML_FILE_UPLOAD);
    });

    it('should set editor for content columns', () => {
      const contentColumn = { ...baseColumn, columnName: 'content' };
      const result = service.initColumnConfig(contentColumn, 1);

      expect(result.htmlType).toBe(GenConstants.HTML_EDITOR);
    });

    it('should exclude system columns from insert', () => {
      const createByColumn = { ...baseColumn, columnName: 'create_by' };
      const result = service.initColumnConfig(createByColumn, 1);

      expect(result.isInsert).toBe(GenConstants.NOT_REQUIRE);
    });

    it('should exclude system columns from edit', () => {
      const createTimeColumn = { ...baseColumn, columnName: 'create_time' };
      const result = service.initColumnConfig(createTimeColumn, 1);

      expect(result.isEdit).toBe(GenConstants.NOT_REQUIRE);
    });
  });

  describe('syncTableStructure', () => {
    const existingColumns = [
      {
        columnId: 1,
        tableId: 1,
        columnName: 'user_id',
        columnComment: '用户ID',
        columnType: 'bigint',
        javaType: 'Long',
        javaField: 'userId',
        isPk: '1',
        isIncrement: '1',
        isRequired: '1',
        isInsert: '0',
        isEdit: '1',
        isList: '1',
        isQuery: '1',
        queryType: 'EQ',
        htmlType: 'input',
        dictType: '',
        sort: 1,
        status: 'NORMAL',
        delFlag: 'NORMAL',
        createBy: 'admin',
        createTime: new Date(),
        updateBy: 'admin',
        updateTime: new Date(),
        columnDefault: null,
      },
      {
        columnId: 2,
        tableId: 1,
        columnName: 'old_column',
        columnComment: '旧列',
        columnType: 'varchar',
        javaType: 'String',
        javaField: 'oldColumn',
        isPk: '0',
        isIncrement: '0',
        isRequired: '0',
        isInsert: '1',
        isEdit: '1',
        isList: '1',
        isQuery: '0',
        queryType: 'EQ',
        htmlType: 'input',
        dictType: '',
        sort: 2,
        status: 'NORMAL',
        delFlag: 'NORMAL',
        createBy: 'admin',
        createTime: new Date(),
        updateBy: 'admin',
        updateTime: new Date(),
        columnDefault: null,
      },
    ];

    it('should detect new columns', async () => {
      const dbColumns = [
        { columnName: 'user_id', columnComment: '用户ID', columnType: 'bigint', isRequired: '1', isPk: '1', isIncrement: '1', columnDefault: null, sort: 1, maxLength: null },
        { columnName: 'new_column', columnComment: '新列', columnType: 'varchar', isRequired: '0', isPk: '0', isIncrement: '0', columnDefault: null, sort: 3, maxLength: 50 },
      ];
      (prisma.$queryRaw as jest.Mock).mockResolvedValue(dbColumns);

      const result = await service.syncTableStructure('sys_user', existingColumns as any, 1, 'admin');

      expect(result.newColumns).toHaveLength(1);
      expect(result.newColumns[0].columnName).toBe('new_column');
      expect(result.deleteColumnIds).toContain(2); // old_column should be deleted
    });

    it('should detect deleted columns', async () => {
      const dbColumns = [
        { columnName: 'user_id', columnComment: '用户ID', columnType: 'bigint', isRequired: '1', isPk: '1', isIncrement: '1', columnDefault: null, sort: 1, maxLength: null },
      ];
      (prisma.$queryRaw as jest.Mock).mockResolvedValue(dbColumns);

      const result = await service.syncTableStructure('sys_user', existingColumns as any, 1, 'admin');

      expect(result.deleteColumnIds).toContain(2);
    });

    it('should detect type changes', async () => {
      const dbColumns = [
        { columnName: 'user_id', columnComment: '用户ID', columnType: 'integer', isRequired: '1', isPk: '1', isIncrement: '1', columnDefault: null, sort: 1, maxLength: null },
        { columnName: 'old_column', columnComment: '旧列', columnType: 'varchar', isRequired: '0', isPk: '0', isIncrement: '0', columnDefault: null, sort: 2, maxLength: 50 },
      ];
      (prisma.$queryRaw as jest.Mock).mockResolvedValue(dbColumns);

      const result = await service.syncTableStructure('sys_user', existingColumns as any, 1, 'admin');

      expect(result.updateColumns).toHaveLength(1);
      expect(result.updateColumns[0].columnId).toBe(1);
      expect(result.updateColumns[0].columnType).toBe('integer');
    });

    it('should throw error when table has no columns', async () => {
      (prisma.$queryRaw as jest.Mock).mockResolvedValue([]);

      await expect(service.syncTableStructure('empty_table', [], 1, 'admin'))
        .rejects.toThrow('表 empty_table 不存在或没有列');
    });

    it('should preserve custom configurations on update', async () => {
      const dbColumns = [
        { columnName: 'user_id', columnComment: '用户ID', columnType: 'integer', isRequired: '1', isPk: '1', isIncrement: '1', columnDefault: null, sort: 1, maxLength: null },
        { columnName: 'old_column', columnComment: '旧列', columnType: 'varchar', isRequired: '0', isPk: '0', isIncrement: '0', columnDefault: null, sort: 2, maxLength: 50 },
      ];
      (prisma.$queryRaw as jest.Mock).mockResolvedValue(dbColumns);

      const result = await service.syncTableStructure('sys_user', existingColumns as any, 1, 'admin');

      // Check that custom config is preserved
      const updatedColumn = result.updateColumns.find(c => c.columnId === 1);
      expect(updatedColumn?.columnComment).toBe('用户ID'); // preserved
      expect(updatedColumn?.javaField).toBe('userId'); // preserved
    });
  });

  describe('getJavaTypePublic', () => {
    it('should map bigint to number', () => {
      expect(service.getJavaTypePublic('bigint')).toBe('number');
    });

    it('should map integer to number', () => {
      expect(service.getJavaTypePublic('integer')).toBe('number');
    });

    it('should map varchar to string', () => {
      expect(service.getJavaTypePublic('varchar')).toBe('string');
    });

    it('should map timestamp to Date', () => {
      expect(service.getJavaTypePublic('timestamp')).toBe('Date');
    });

    it('should map boolean to boolean', () => {
      expect(service.getJavaTypePublic('boolean')).toBe('boolean');
    });

    it('should default to String for unknown types', () => {
      expect(service.getJavaTypePublic('unknown_type')).toBe('String');
    });
  });
});
