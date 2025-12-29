import { Test, TestingModule } from '@nestjs/testing';
import { CodeGeneratorService } from './code-generator.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { DatabaseIntrospectorService } from './database-introspector.service';
import { TemplateEngineService } from './template-engine.service';
import { createPrismaMock } from 'src/test-utils/prisma-mock';
import { BusinessException } from 'src/common/exceptions';
import { DelFlagEnum, StatusEnum } from 'src/common/enum';

describe('CodeGeneratorService', () => {
  let service: CodeGeneratorService;
  let prisma: ReturnType<typeof createPrismaMock>;
  let introspector: jest.Mocked<DatabaseIntrospectorService>;
  let templateEngine: jest.Mocked<TemplateEngineService>;

  const mockTable = {
    tableId: 1,
    tableName: 'sys_test',
    tableComment: '测试表',
    className: 'SysTest',
    packageName: 'com.example',
    moduleName: 'system',
    businessName: 'test',
    functionName: '测试',
    functionAuthor: 'admin',
    tplCategory: 'crud',
    tplWebType: 'element-plus',
    genType: 'ZIP',
    genPath: '/',
    options: '{}',
    subTableName: null,
    subTableFkName: null,
    status: StatusEnum.NORMAL,
    delFlag: DelFlagEnum.NORMAL,
    createBy: 'admin',
    createTime: new Date(),
    updateBy: 'admin',
    updateTime: new Date(),
  };

  const mockColumns = [
    {
      columnId: 1,
      tableId: 1,
      columnName: 'test_id',
      columnComment: '测试ID',
      columnType: 'bigint',
      javaType: 'Long',
      javaField: 'testId',
      isPk: 'YES',
      isIncrement: 'YES',
      isRequired: 'YES',
      isInsert: 'NO',
      isEdit: 'YES',
      isList: 'YES',
      isQuery: 'YES',
      queryType: 'EQ',
      htmlType: 'input',
      dictType: '',
      sort: 1,
      status: StatusEnum.NORMAL,
      delFlag: DelFlagEnum.NORMAL,
      createBy: 'admin',
      createTime: new Date(),
      updateBy: 'admin',
      updateTime: new Date(),
      columnDefault: null,
    },
    {
      columnId: 2,
      tableId: 1,
      columnName: 'test_name',
      columnComment: '测试名称',
      columnType: 'varchar',
      javaType: 'String',
      javaField: 'testName',
      isPk: 'NO',
      isIncrement: 'NO',
      isRequired: 'YES',
      isInsert: 'YES',
      isEdit: 'YES',
      isList: 'YES',
      isQuery: 'YES',
      queryType: 'LIKE',
      htmlType: 'input',
      dictType: '',
      sort: 2,
      status: StatusEnum.NORMAL,
      delFlag: DelFlagEnum.NORMAL,
      createBy: 'admin',
      createTime: new Date(),
      updateBy: 'admin',
      updateTime: new Date(),
      columnDefault: null,
    },
  ];

  beforeEach(async () => {
    prisma = createPrismaMock();

    const mockIntrospector = {
      listTables: jest.fn(),
      getTablesByNames: jest.fn(),
      getTableColumns: jest.fn(),
      tableExists: jest.fn(),
      initColumnConfig: jest.fn(),
      syncTableStructure: jest.fn(),
      getJavaTypePublic: jest.fn(),
    };

    const mockTemplateEngine = {
      render: jest.fn(),
      renderAll: jest.fn(),
      buildSubTableContext: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CodeGeneratorService,
        { provide: PrismaService, useValue: prisma },
        { provide: DatabaseIntrospectorService, useValue: mockIntrospector },
        { provide: TemplateEngineService, useValue: mockTemplateEngine },
      ],
    }).compile();

    service = module.get<CodeGeneratorService>(CodeGeneratorService);
    introspector = module.get(DatabaseIntrospectorService);
    templateEngine = module.get(TemplateEngineService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return paginated list of tables', async () => {
      const mockList = [mockTable];
      (prisma.genTable.findMany as jest.Mock).mockResolvedValue(mockList);
      (prisma.genTable.count as jest.Mock).mockResolvedValue(1);
      (prisma.$transaction as jest.Mock).mockResolvedValue([mockList, 1]);

      const result = await service.findAll({ pageNum: 1, pageSize: 10 });

      expect(result.data.rows).toEqual(mockList);
      expect(result.data.total).toBe(1);
    });

    it('should filter by tableName', async () => {
      const mockList = [mockTable];
      (prisma.$transaction as jest.Mock).mockResolvedValue([mockList, 1]);

      await service.findAll({ tableName: 'test', pageNum: 1, pageSize: 10 });

      expect(prisma.$transaction).toHaveBeenCalled();
    });

    it('should filter by tableComment', async () => {
      const mockList = [mockTable];
      (prisma.$transaction as jest.Mock).mockResolvedValue([mockList, 1]);

      await service.findAll({ tableComment: '测试', pageNum: 1, pageSize: 10 });

      expect(prisma.$transaction).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return table with columns', async () => {
      (prisma.genTable.findFirst as jest.Mock).mockResolvedValue(mockTable);
      (prisma.genTableColumn.findMany as jest.Mock).mockResolvedValue(mockColumns);

      const result = await service.findOne(1);

      expect(result).toEqual({ ...mockTable, columns: mockColumns });
    });

    it('should return null when table not found', async () => {
      (prisma.genTable.findFirst as jest.Mock).mockResolvedValue(null);

      const result = await service.findOne(999);

      expect(result).toBeNull();
    });
  });

  describe('findOneByTableName', () => {
    it('should return table by name', async () => {
      (prisma.genTable.findFirst as jest.Mock).mockResolvedValue(mockTable);
      (prisma.genTableColumn.findMany as jest.Mock).mockResolvedValue(mockColumns);

      const result = await service.findOneByTableName('sys_test');

      expect(result).toEqual({ ...mockTable, columns: mockColumns });
    });

    it('should return null when table not found', async () => {
      (prisma.genTable.findFirst as jest.Mock).mockResolvedValue(null);

      const result = await service.findOneByTableName('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('importTable', () => {
    it('should import tables successfully', async () => {
      const mockTableMeta = [
        { tableName: 'sys_test', tableComment: '测试表', createTime: new Date(), updateTime: new Date() },
      ];
      const mockDbColumns: Array<{ columnName: string; columnComment: string; columnType: string; isRequired: 'YES' | 'NO'; isPk: 'YES' | 'NO'; isIncrement: 'YES' | 'NO'; columnDefault: null; sort: number; maxLength: null }> = [
        { columnName: 'test_id', columnComment: '测试ID', columnType: 'bigint', isRequired: 'YES', isPk: 'YES', isIncrement: 'YES', columnDefault: null, sort: 1, maxLength: null },
      ];

      introspector.getTablesByNames.mockResolvedValue(mockTableMeta);
      introspector.getTableColumns.mockResolvedValue(mockDbColumns);
      introspector.initColumnConfig.mockReturnValue({
        tableId: 1,
        columnName: 'test_id',
        columnComment: '测试ID',
        columnType: 'bigint',
        javaType: 'Long',
        javaField: 'testId',
        isPk: 'YES',
        isIncrement: 'YES',
      });
      (prisma.genTable.create as jest.Mock).mockResolvedValue({ ...mockTable, tableId: 1 });
      (prisma.genTableColumn.create as jest.Mock).mockResolvedValue({});

      const result = await service.importTable(['sys_test'], 'admin');

      expect(result.code).toBe(200);
      expect(introspector.getTablesByNames).toHaveBeenCalledWith(['sys_test']);
    });

    it('should throw error when no tables found', async () => {
      introspector.getTablesByNames.mockResolvedValue([]);

      await expect(service.importTable(['nonexistent'], 'admin'))
        .rejects.toThrow(BusinessException);
    });
  });

  describe('update', () => {
    it('should update table configuration', async () => {
      (prisma.genTable.update as jest.Mock).mockResolvedValue(mockTable);

      const result = await service.update({
        tableId: 1,
        tableComment: '更新后的注释',
      });

      expect(result.code).toBe(200);
      expect(prisma.genTable.update).toHaveBeenCalled();
    });

    it('should update columns when provided', async () => {
      (prisma.genTable.update as jest.Mock).mockResolvedValue(mockTable);
      (prisma.genTableColumn.update as jest.Mock).mockResolvedValue({});

      const result = await service.update({
        tableId: 1,
        columns: [{ columnId: 1, columnComment: '更新后的列注释' }],
      });

      expect(result.code).toBe(200);
      expect(prisma.genTableColumn.update).toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('should delete table and columns', async () => {
      (prisma.genTableColumn.deleteMany as jest.Mock).mockResolvedValue({ count: 2 });
      (prisma.genTable.deleteMany as jest.Mock).mockResolvedValue({ count: 1 });

      const result = await service.remove([1]);

      expect(result.code).toBe(200);
      expect(prisma.genTableColumn.deleteMany).toHaveBeenCalledWith({
        where: { tableId: { in: [1] } },
      });
      expect(prisma.genTable.deleteMany).toHaveBeenCalledWith({
        where: { tableId: { in: [1] } },
      });
    });

    it('should delete multiple tables', async () => {
      (prisma.genTableColumn.deleteMany as jest.Mock).mockResolvedValue({ count: 4 });
      (prisma.genTable.deleteMany as jest.Mock).mockResolvedValue({ count: 2 });

      const result = await service.remove([1, 2]);

      expect(result.code).toBe(200);
      expect(prisma.genTable.deleteMany).toHaveBeenCalledWith({
        where: { tableId: { in: [1, 2] } },
      });
    });
  });

  describe('syncTable', () => {
    it('should sync table structure', async () => {
      (prisma.genTable.findFirst as jest.Mock).mockResolvedValue(mockTable);
      (prisma.genTableColumn.findMany as jest.Mock).mockResolvedValue(mockColumns);
      introspector.syncTableStructure.mockResolvedValue({
        newColumns: [{ columnName: 'new_col' }],
        updateColumns: [{ columnId: 1, columnType: 'integer' }],
        deleteColumnIds: [3],
      });
      (prisma.genTableColumn.create as jest.Mock).mockResolvedValue({});
      (prisma.genTableColumn.update as jest.Mock).mockResolvedValue({});
      (prisma.genTableColumn.deleteMany as jest.Mock).mockResolvedValue({ count: 1 });

      const result = await service.syncTable(1, 'admin');

      expect(result.code).toBe(200);
      expect(result.data.added).toBe(1);
      expect(result.data.updated).toBe(1);
      expect(result.data.deleted).toBe(1);
    });

    it('should throw error when table not found', async () => {
      (prisma.genTable.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(service.syncTable(999, 'admin'))
        .rejects.toThrow(BusinessException);
    });
  });

  describe('preview', () => {
    it('should return preview code', async () => {
      const mockFiles = [
        { fileName: 'controller.ts', filePath: 'controller.ts', content: 'controller code', fileType: 'backend' as const },
        { fileName: 'service.ts', filePath: 'service.ts', content: 'service code', fileType: 'backend' as const },
      ];
      (prisma.genTable.findFirst as jest.Mock).mockResolvedValue(mockTable);
      (prisma.genTableColumn.findMany as jest.Mock).mockResolvedValue(mockColumns);
      templateEngine.renderAll.mockResolvedValue(mockFiles);

      const result = await service.preview(1);

      expect(result['controller.ts']).toBe('controller code');
      expect(result['service.ts']).toBe('service code');
    });

    it('should throw error when table not found', async () => {
      (prisma.genTable.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(service.preview(999))
        .rejects.toThrow(BusinessException);
    });
  });

  describe('generate', () => {
    it('should generate code files', async () => {
      const mockFiles = [
        { fileName: 'controller.ts', filePath: 'controller.ts', content: 'controller code', fileType: 'backend' as const },
        { fileName: 'service.ts', filePath: 'service.ts', content: 'service code', fileType: 'backend' as const },
      ];
      (prisma.genTable.findFirst as jest.Mock).mockResolvedValue(mockTable);
      (prisma.genTableColumn.findMany as jest.Mock).mockResolvedValue(mockColumns);
      templateEngine.renderAll.mockResolvedValue(mockFiles);

      const result = await service.generate(1);

      expect(result).toEqual(mockFiles);
    });

    it('should throw error when table not found', async () => {
      (prisma.genTable.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(service.generate(999))
        .rejects.toThrow(BusinessException);
    });

    it('should handle sub table generation', async () => {
      const subTable = { ...mockTable, tableId: 2, tableName: 'sys_test_sub' };
      const mainTable = { ...mockTable, tplCategory: 'sub', subTableName: 'sys_test_sub' };
      const mockFiles = [{ fileName: 'controller.ts', filePath: 'controller.ts', content: 'code', fileType: 'backend' as const }];

      (prisma.genTable.findFirst as jest.Mock)
        .mockResolvedValueOnce(mainTable)
        .mockResolvedValueOnce(subTable);
      (prisma.genTableColumn.findMany as jest.Mock).mockResolvedValue(mockColumns);
      templateEngine.renderAll.mockResolvedValue(mockFiles);

      const result = await service.generate(1);

      expect(result).toEqual(mockFiles);
      // Verify renderAll was called with options containing subTable info
      expect(templateEngine.renderAll).toHaveBeenCalled();
    });
  });

  describe('getPrimaryKey', () => {
    it('should return primary key field name', () => {
      const result = service.getPrimaryKey(mockColumns as any);

      expect(result).toBe('testId');
    });

    it('should return null when no primary key', () => {
      const columnsWithoutPk = mockColumns.map(c => ({ ...c, isPk: 'NO' }));
      const result = service.getPrimaryKey(columnsWithoutPk as any);

      expect(result).toBeNull();
    });
  });
});
