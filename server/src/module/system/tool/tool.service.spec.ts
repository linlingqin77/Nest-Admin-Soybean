import { Test, TestingModule } from '@nestjs/testing';
import { ToolService } from './tool.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { createPrismaMock } from 'src/test-utils/prisma-mock';
import { plainToInstance } from 'class-transformer';
import { GenTableList, GenDbTableList, TableName, GenTableUpdate } from './dto/create-genTable-dto';
import { ResponseCode } from 'src/common/response';
import { StatusEnum, DelFlagEnum } from 'src/common/enum/index';
import { BusinessException } from 'src/common/exceptions';

describe('ToolService', () => {
  let service: ToolService;
  let prisma: ReturnType<typeof createPrismaMock>;

  const mockGenTable = {
    tableId: 1,
    tableName: 'sys_user',
    tableComment: '用户表',
    className: 'SysUser',
    packageName: 'com.example',
    moduleName: 'system',
    businessName: 'user',
    functionName: '用户',
    functionAuthor: 'admin',
    genType: 'ZIP',
    genPath: '/',
    options: '',
    status: StatusEnum.NORMAL,
    delFlag: DelFlagEnum.NORMAL,
    tplCategory: 'crud',
    tplWebType: 'element-plus',
    createBy: 'admin',
    createTime: new Date(),
    updateBy: 'admin',
    updateTime: new Date(),
    remark: null,
  };

  const mockGenTableColumn = {
    columnId: 1,
    tableId: 1,
    columnName: 'user_id',
    columnComment: '用户ID',
    columnType: 'bigint',
    javaType: 'Long',
    javaField: 'userId',
    isPk: '1',
    isIncrement: '1',
    isRequired: '0',
    isInsert: '0',
    isEdit: '1',
    isList: '1',
    isQuery: '1',
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
    remark: null,
    columnDefault: null,
  };

  beforeEach(async () => {
    prisma = createPrismaMock();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ToolService,
        {
          provide: PrismaService,
          useValue: prisma,
        },
      ],
    }).compile();

    service = module.get<ToolService>(ToolService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return paginated gen table list', async () => {
      const query = plainToInstance(GenTableList, { pageNum: 1, pageSize: 10 });
      (prisma.$transaction as jest.Mock).mockResolvedValue([[mockGenTable], 1]);

      const result = await service.findAll(query);

      expect(result.code).toBe(ResponseCode.SUCCESS);
      expect(result.data.rows).toHaveLength(1);
    });

    it('should filter by tableNames', async () => {
      const query = plainToInstance(GenTableList, { pageNum: 1, pageSize: 10, tableNames: 'sys_user' });
      (prisma.$transaction as jest.Mock).mockResolvedValue([[mockGenTable], 1]);

      const result = await service.findAll(query);

      expect(result.code).toBe(ResponseCode.SUCCESS);
    });

    it('should filter by tableComment', async () => {
      const query = plainToInstance(GenTableList, { pageNum: 1, pageSize: 10, tableComment: '用户' });
      (prisma.$transaction as jest.Mock).mockResolvedValue([[mockGenTable], 1]);

      const result = await service.findAll(query);

      expect(result.code).toBe(ResponseCode.SUCCESS);
    });

    it('should return empty list when no tables found', async () => {
      const query = plainToInstance(GenTableList, { pageNum: 1, pageSize: 10 });
      (prisma.$transaction as jest.Mock).mockResolvedValue([[], 0]);

      const result = await service.findAll(query);

      expect(result.code).toBe(ResponseCode.SUCCESS);
      expect(result.data.rows).toHaveLength(0);
      expect(result.data.total).toBe(0);
    });
  });

  describe('findOne', () => {
    it('should return table detail by id', async () => {
      (prisma.genTable.findFirst as jest.Mock).mockResolvedValue(mockGenTable);
      (prisma.genTableColumn.findMany as jest.Mock).mockResolvedValue([mockGenTableColumn]);

      const result = await service.findOne(1);

      expect(result.code).toBe(ResponseCode.SUCCESS);
      expect(result.data.info.tableName).toBe('sys_user');
      expect(result.data.info.columns).toHaveLength(1);
    });

    it('should return null info when table not found', async () => {
      (prisma.genTable.findFirst as jest.Mock).mockResolvedValue(null);

      const result = await service.findOne(999);

      expect(result.code).toBe(ResponseCode.SUCCESS);
      expect(result.data.info).toBeNull();
    });
  });

  describe('findOneByTableName', () => {
    it('should return table detail by name', async () => {
      (prisma.genTable.findFirst as jest.Mock).mockResolvedValue(mockGenTable);
      (prisma.genTableColumn.findMany as jest.Mock).mockResolvedValue([mockGenTableColumn]);

      const result = await service.findOneByTableName('sys_user');

      expect(result.tableName).toBe('sys_user');
      expect(result.columns).toHaveLength(1);
    });

    it('should throw error when table not found', async () => {
      (prisma.genTable.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(service.findOneByTableName('non_existent')).rejects.toThrow(BusinessException);
    });
  });

  describe('importTable', () => {
    it('should import tables from database', async () => {
      const tableNameDto: TableName = { tableNames: 'sys_user,sys_role' };
      const user = { userName: 'admin', userId: 1 } as any;

      (prisma.$queryRaw as jest.Mock)
        .mockResolvedValueOnce([
          { tableName: 'sys_user', tableComment: '用户表', createTime: new Date(), updateTime: new Date() },
          { tableName: 'sys_role', tableComment: '角色表', createTime: new Date(), updateTime: new Date() },
        ])
        .mockResolvedValueOnce([mockGenTableColumn])
        .mockResolvedValueOnce([mockGenTableColumn]);

      (prisma.genTable.create as jest.Mock).mockResolvedValue(mockGenTable);
      (prisma.genTableColumn.create as jest.Mock).mockResolvedValue(mockGenTableColumn);

      const result = await service.importTable(tableNameDto, user);

      expect(result.code).toBe(ResponseCode.SUCCESS);
      expect(prisma.genTable.create).toHaveBeenCalled();
    });

    it('should handle empty table names', async () => {
      const tableNameDto: TableName = { tableNames: '' };
      const user = { userName: 'admin', userId: 1 } as any;

      (prisma.$queryRaw as jest.Mock).mockResolvedValue([]);

      const result = await service.importTable(tableNameDto, user);

      expect(result.code).toBe(ResponseCode.SUCCESS);
    });

    it('should handle table with null comment', async () => {
      const tableNameDto: TableName = { tableNames: 'sys_test' };
      const user = { userName: 'admin', userId: 1 } as any;

      (prisma.$queryRaw as jest.Mock)
        .mockResolvedValueOnce([
          { tableName: 'sys_test', tableComment: null, createTime: new Date(), updateTime: new Date() },
        ])
        .mockResolvedValueOnce([mockGenTableColumn]);

      (prisma.genTable.create as jest.Mock).mockResolvedValue(mockGenTable);
      (prisma.genTableColumn.create as jest.Mock).mockResolvedValue(mockGenTableColumn);

      const result = await service.importTable(tableNameDto, user);

      expect(result.code).toBe(ResponseCode.SUCCESS);
    });
  });

  describe('synchDb', () => {
    it('should sync database columns', async () => {
      (prisma.genTable.findFirst as jest.Mock).mockResolvedValue(mockGenTable);
      (prisma.genTableColumn.findMany as jest.Mock).mockResolvedValue([mockGenTableColumn]);
      (prisma.$queryRaw as jest.Mock).mockResolvedValue([
        { ...mockGenTableColumn, columnName: 'user_id', sort: 1 },
        { columnName: 'new_column', columnType: 'varchar', sort: 2, isPk: '0', isRequired: '0', isIncrement: '0', columnComment: 'New Column' },
      ]);
      (prisma.genTableColumn.update as jest.Mock).mockResolvedValue({});
      (prisma.genTableColumn.create as jest.Mock).mockResolvedValue({});

      const result = await service.synchDb('sys_user');

      expect(result.code).toBe(ResponseCode.SUCCESS);
    });

    it('should throw error when table not found', async () => {
      (prisma.genTable.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(service.synchDb('non_existent')).rejects.toThrow(BusinessException);
    });

    it('should throw error when no columns found', async () => {
      (prisma.genTable.findFirst as jest.Mock).mockResolvedValue(mockGenTable);
      (prisma.genTableColumn.findMany as jest.Mock).mockResolvedValue([mockGenTableColumn]);
      (prisma.$queryRaw as jest.Mock).mockResolvedValue([]);

      await expect(service.synchDb('sys_user')).rejects.toThrow(BusinessException);
    });

    it('should delete removed columns', async () => {
      (prisma.genTable.findFirst as jest.Mock).mockResolvedValue(mockGenTable);
      (prisma.genTableColumn.findMany as jest.Mock).mockResolvedValue([
        mockGenTableColumn,
        { ...mockGenTableColumn, columnId: 2, columnName: 'deleted_column' },
      ]);
      (prisma.$queryRaw as jest.Mock).mockResolvedValue([
        { ...mockGenTableColumn, columnName: 'user_id', sort: 1 },
      ]);
      (prisma.genTableColumn.update as jest.Mock).mockResolvedValue({});
      (prisma.genTableColumn.deleteMany as jest.Mock).mockResolvedValue({ count: 1 });

      const result = await service.synchDb('sys_user');

      expect(result.code).toBe(ResponseCode.SUCCESS);
      expect(prisma.genTableColumn.deleteMany).toHaveBeenCalled();
    });
  });

  describe('genUpdate', () => {
    it('should update gen table and columns', async () => {
      const updateDto: GenTableUpdate = {
        tableId: 1,
        tableName: 'sys_user',
        tableComment: '更新后的用户表',
        columns: [{ columnId: 1, columnComment: '更新后的列注释' }],
      } as any;

      (prisma.genTableColumn.update as jest.Mock).mockResolvedValue({});
      (prisma.genTable.update as jest.Mock).mockResolvedValue({});

      const result = await service.genUpdate(updateDto);

      expect(result.code).toBe(ResponseCode.SUCCESS);
      expect(prisma.genTableColumn.update).toHaveBeenCalled();
      expect(prisma.genTable.update).toHaveBeenCalled();
    });

    it('should handle update without columns', async () => {
      const updateDto: GenTableUpdate = {
        tableId: 1,
        tableName: 'sys_user',
        tableComment: '更新后的用户表',
      } as any;

      (prisma.genTable.update as jest.Mock).mockResolvedValue({});

      const result = await service.genUpdate(updateDto);

      expect(result.code).toBe(ResponseCode.SUCCESS);
    });

    it('should skip columns without columnId', async () => {
      const updateDto: GenTableUpdate = {
        tableId: 1,
        tableName: 'sys_user',
        columns: [{ columnComment: '新列' }], // no columnId
      } as any;

      (prisma.genTable.update as jest.Mock).mockResolvedValue({});

      const result = await service.genUpdate(updateDto);

      expect(result.code).toBe(ResponseCode.SUCCESS);
      expect(prisma.genTableColumn.update).not.toHaveBeenCalled();
    });
  });

  describe('preview', () => {
    it('should preview generated code', async () => {
      (prisma.genTable.findFirst as jest.Mock).mockResolvedValue(mockGenTable);
      (prisma.genTableColumn.findMany as jest.Mock).mockResolvedValue([mockGenTableColumn]);

      const result = await service.preview(1);

      expect(result.code).toBe(ResponseCode.SUCCESS);
      expect(result.data).toBeDefined();
    });

    it('should throw error when table not found', async () => {
      (prisma.genTable.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(service.preview(999)).rejects.toThrow(BusinessException);
    });
  });

  describe('genDbList', () => {
    it('should return database table list', async () => {
      const query = plainToInstance(GenDbTableList, { pageNum: 1, pageSize: 10 });
      const mockDbTables = [
        { tableName: 'sys_user', tableComment: '用户表', createTime: new Date(), updateTime: new Date() },
      ];

      (prisma.$queryRaw as jest.Mock)
        .mockResolvedValueOnce(mockDbTables)
        .mockResolvedValueOnce([{ total: BigInt(1) }]);

      const result = await service.genDbList(query);

      expect(result.code).toBe(ResponseCode.SUCCESS);
      expect(result.data.list).toHaveLength(1);
      expect(result.data.total).toBe(1);
    });

    it('should filter by tableName', async () => {
      const query = plainToInstance(GenDbTableList, { pageNum: 1, pageSize: 10, tableName: 'sys' });

      (prisma.$queryRaw as jest.Mock)
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([{ total: BigInt(0) }]);

      const result = await service.genDbList(query);

      expect(result.code).toBe(ResponseCode.SUCCESS);
    });

    it('should filter by tableComment', async () => {
      const query = plainToInstance(GenDbTableList, { pageNum: 1, pageSize: 10, tableComment: '用户' });

      (prisma.$queryRaw as jest.Mock)
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([{ total: BigInt(0) }]);

      const result = await service.genDbList(query);

      expect(result.code).toBe(ResponseCode.SUCCESS);
    });

    it('should handle empty total result', async () => {
      const query = plainToInstance(GenDbTableList, { pageNum: 1, pageSize: 10 });

      (prisma.$queryRaw as jest.Mock)
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);

      const result = await service.genDbList(query);

      expect(result.code).toBe(ResponseCode.SUCCESS);
      expect(result.data.total).toBe(0);
    });
  });

  describe('remove', () => {
    it('should delete gen table and its columns', async () => {
      (prisma.genTableColumn.deleteMany as jest.Mock).mockResolvedValue({ count: 5 });
      (prisma.genTable.delete as jest.Mock).mockResolvedValue(mockGenTable);

      const result = await service.remove(1);

      expect(result.code).toBe(ResponseCode.SUCCESS);
      expect(prisma.genTableColumn.deleteMany).toHaveBeenCalledWith({ where: { tableId: 1 } });
      expect(prisma.genTable.delete).toHaveBeenCalledWith({ where: { tableId: 1 } });
    });
  });

  describe('getDataNames', () => {
    it('should return data source names', async () => {
      const result = await service.getDataNames();

      expect(result.code).toBe(ResponseCode.SUCCESS);
      expect(result.data).toContain('master');
    });
  });

  describe('getPrimaryKey', () => {
    it('should return primary key field', async () => {
      const columns = [
        { ...mockGenTableColumn, isPk: '0', javaField: 'userName' },
        { ...mockGenTableColumn, isPk: '1', javaField: 'userId' },
      ] as any;

      const result = await service.getPrimaryKey(columns);

      expect(result).toBe('userId');
    });

    it('should return null when no primary key', async () => {
      const columns = [
        { ...mockGenTableColumn, isPk: '0', javaField: 'userName' },
      ] as any;

      const result = await service.getPrimaryKey(columns);

      expect(result).toBeNull();
    });
  });

  describe('initTableColumn', () => {
    it('should initialize column with text type', () => {
      const column = {
        columnName: 'description',
        columnType: 'text',
        sort: 1,
        isPk: '0',
        isRequired: '0',
        isIncrement: '0',
      } as any;
      const table = { tableId: 1 };

      service.initTableColumn(column, table);

      expect(column.htmlType).toBe('textarea');
    });

    it('should initialize column with datetime type', () => {
      const column = {
        columnName: 'create_time',
        columnType: 'timestamp',
        sort: 1,
        isPk: '0',
        isRequired: '0',
        isIncrement: '0',
      } as any;
      const table = { tableId: 1 };

      service.initTableColumn(column, table);

      expect(column.javaType).toBe('Date');
      expect(column.htmlType).toBe('datetime');
    });

    it('should initialize column with number type', () => {
      const column = {
        columnName: 'age',
        columnType: 'integer',
        sort: 1,
        isPk: '0',
        isRequired: '0',
        isIncrement: '0',
      } as any;
      const table = { tableId: 1 };

      service.initTableColumn(column, table);

      expect(column.javaType).toBe('Number');
    });

    it('should set radio for status column', () => {
      const column = {
        columnName: 'status',
        columnType: 'varchar',
        sort: 1,
        isPk: '0',
        isRequired: '0',
        isIncrement: '0',
      } as any;
      const table = { tableId: 1 };

      service.initTableColumn(column, table);

      expect(column.htmlType).toBe('radio');
    });

    it('should set select for type column', () => {
      const column = {
        columnName: 'user_type',
        columnType: 'varchar',
        sort: 1,
        isPk: '0',
        isRequired: '0',
        isIncrement: '0',
      } as any;
      const table = { tableId: 1 };

      service.initTableColumn(column, table);

      expect(column.htmlType).toBe('select');
    });

    it('should set image upload for image column', () => {
      const column = {
        columnName: 'avatar_image',
        columnType: 'varchar',
        sort: 1,
        isPk: '0',
        isRequired: '0',
        isIncrement: '0',
      } as any;
      const table = { tableId: 1 };

      service.initTableColumn(column, table);

      expect(column.htmlType).toBe('imageUpload');
    });

    it('should set file upload for file column', () => {
      const column = {
        columnName: 'attachment_file',
        columnType: 'varchar',
        sort: 1,
        isPk: '0',
        isRequired: '0',
        isIncrement: '0',
      } as any;
      const table = { tableId: 1 };

      service.initTableColumn(column, table);

      expect(column.htmlType).toBe('fileUpload');
    });

    it('should set editor for content column', () => {
      const column = {
        columnName: 'article_content',
        columnType: 'varchar',
        sort: 1,
        isPk: '0',
        isRequired: '0',
        isIncrement: '0',
      } as any;
      const table = { tableId: 1 };

      service.initTableColumn(column, table);

      expect(column.htmlType).toBe('editor');
    });

    it('should set like query for name column', () => {
      const column = {
        columnName: 'user_name',
        columnType: 'varchar',
        sort: 1,
        isPk: '0',
        isRequired: '0',
        isIncrement: '0',
      } as any;
      const table = { tableId: 1 };

      service.initTableColumn(column, table);

      expect(column.queryType).toBe('LIKE');
    });

    it('should handle primary key column', () => {
      const column = {
        columnName: 'user_id',
        columnType: 'bigint',
        sort: 1,
        isPk: '1',
        isRequired: '0',
        isIncrement: '1',
      } as any;
      const table = { tableId: 1 };

      service.initTableColumn(column, table);

      expect(column.isInsert).toBe('0');
      expect(column.isEdit).toBe('1');
      expect(column.isQuery).toBe('1');
      expect(column.isList).toBe('1');
    });
  });
});
