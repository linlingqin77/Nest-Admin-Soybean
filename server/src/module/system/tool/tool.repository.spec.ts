import { Test, TestingModule } from '@nestjs/testing';
import { ToolRepository } from './tool.repository';
import { PrismaService } from 'src/prisma/prisma.service';
import { DelFlagEnum } from 'src/common/enum';

describe('ToolRepository', () => {
  let repository: ToolRepository;
  let prisma: jest.Mocked<PrismaService>;

  const mockGenTable = {
    tableId: 1,
    tableName: 'sys_user',
    tableComment: '用户表',
    subTableName: null,
    subTableFkName: null,
    className: 'SysUser',
    tplCategory: 'crud',
    tplWebType: 'element-plus',
    packageName: 'com.example.system',
    moduleName: 'system',
    businessName: 'user',
    functionName: '用户管理',
    functionAuthor: 'admin',
    genType: '0',
    genPath: '/',
    options: null,
    delFlag: DelFlagEnum.NORMAL,
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
    isPk: 'YES',
    isIncrement: 'YES',
    isRequired: 'NO',
    isInsert: 'NO',
    isEdit: 'NO',
    isList: 'YES',
    isQuery: 'NO',
    queryType: 'EQ',
    htmlType: 'input',
    dictType: '',
    sort: 1,
    createBy: 'admin',
    createTime: new Date(),
    updateBy: 'admin',
    updateTime: new Date(),
  };

  const mockPrisma = {
    genTable: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ToolRepository,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
      ],
    }).compile();

    repository = module.get<ToolRepository>(ToolRepository);
    prisma = module.get(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findPageWithColumns', () => {
    it('should return paginated gen tables', async () => {
      const mockTables = [mockGenTable];
      mockPrisma.$transaction.mockResolvedValue([mockTables, 1]);

      const result = await repository.findPageWithColumns({}, 0, 10);

      expect(result).toEqual({ list: mockTables, total: 1 });
      expect(mockPrisma.$transaction).toHaveBeenCalled();
    });

    it('should apply where conditions', async () => {
      mockPrisma.$transaction.mockResolvedValue([[], 0]);

      const where = { tableName: { contains: 'user' } };
      await repository.findPageWithColumns(where, 0, 10);

      expect(mockPrisma.$transaction).toHaveBeenCalled();
    });

    it('should apply custom orderBy', async () => {
      mockPrisma.$transaction.mockResolvedValue([[], 0]);

      await repository.findPageWithColumns({}, 0, 10, { createTime: 'desc' });

      expect(mockPrisma.$transaction).toHaveBeenCalled();
    });

    it('should use default orderBy when not provided', async () => {
      mockPrisma.$transaction.mockResolvedValue([[], 0]);

      await repository.findPageWithColumns({}, 0, 10);

      expect(mockPrisma.$transaction).toHaveBeenCalled();
    });
  });

  describe('findByIdWithColumns', () => {
    it('should find gen table by id with columns', async () => {
      const mockTableWithColumns = {
        ...mockGenTable,
        columns: [mockGenTableColumn],
      };
      mockPrisma.genTable.findUnique.mockResolvedValue(mockTableWithColumns);

      const result = await repository.findByIdWithColumns(1);

      expect(result).toEqual(mockTableWithColumns);
      expect(mockPrisma.genTable.findUnique).toHaveBeenCalledWith({
        where: { tableId: 1 },
        include: {
          columns: {
            orderBy: { sort: 'asc' },
          },
        },
      });
    });

    it('should return null if table not found', async () => {
      mockPrisma.genTable.findUnique.mockResolvedValue(null);

      const result = await repository.findByIdWithColumns(999);

      expect(result).toBeNull();
    });
  });

  describe('findByTableNameWithColumns', () => {
    it('should find gen table by name with columns', async () => {
      const mockTableWithColumns = {
        ...mockGenTable,
        columns: [mockGenTableColumn],
      };
      mockPrisma.genTable.findFirst.mockResolvedValue(mockTableWithColumns);

      const result = await repository.findByTableNameWithColumns('sys_user');

      expect(result).toEqual(mockTableWithColumns);
      expect(mockPrisma.genTable.findFirst).toHaveBeenCalledWith({
        where: { tableName: 'sys_user' },
        include: {
          columns: {
            orderBy: { sort: 'asc' },
          },
        },
      });
    });

    it('should return null if table not found', async () => {
      mockPrisma.genTable.findFirst.mockResolvedValue(null);

      const result = await repository.findByTableNameWithColumns('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('findManyWithColumns', () => {
    it('should find multiple gen tables with columns', async () => {
      const mockTablesWithColumns = [
        { ...mockGenTable, columns: [mockGenTableColumn] },
        { ...mockGenTable, tableId: 2, tableName: 'sys_role', columns: [] },
      ];
      mockPrisma.genTable.findMany.mockResolvedValue(mockTablesWithColumns);

      const result = await repository.findManyWithColumns([1, 2]);

      expect(result).toEqual(mockTablesWithColumns);
      expect(mockPrisma.genTable.findMany).toHaveBeenCalledWith({
        where: {
          tableId: { in: [1, 2] },
        },
        include: {
          columns: {
            orderBy: { sort: 'asc' },
          },
        },
      });
    });

    it('should return empty array if no tables found', async () => {
      mockPrisma.genTable.findMany.mockResolvedValue([]);

      const result = await repository.findManyWithColumns([999]);

      expect(result).toEqual([]);
    });
  });

  describe('existsByTableName', () => {
    it('should return true if table name exists', async () => {
      mockPrisma.genTable.count.mockResolvedValue(1);

      const result = await repository.existsByTableName('sys_user');

      expect(result).toBe(true);
      expect(mockPrisma.genTable.count).toHaveBeenCalledWith({
        where: {
          tableName: 'sys_user',
          delFlag: DelFlagEnum.NORMAL,
        },
      });
    });

    it('should return false if table name does not exist', async () => {
      mockPrisma.genTable.count.mockResolvedValue(0);

      const result = await repository.existsByTableName('nonexistent');

      expect(result).toBe(false);
    });

    it('should exclude specific id when checking', async () => {
      mockPrisma.genTable.count.mockResolvedValue(0);

      const result = await repository.existsByTableName('sys_user', 1);

      expect(result).toBe(false);
      expect(mockPrisma.genTable.count).toHaveBeenCalledWith({
        where: {
          tableName: 'sys_user',
          delFlag: DelFlagEnum.NORMAL,
          tableId: { not: 1 },
        },
      });
    });
  });

  describe('inherited methods from SoftDeleteRepository', () => {
    it('should have access to findById', async () => {
      // base.repository.ts SoftDeleteRepository.findById uses findUnique from BaseRepository
      mockPrisma.genTable.findUnique.mockResolvedValue(mockGenTable);

      const result = await repository.findById(1);

      expect(result).toEqual(mockGenTable);
    });

    it('should return null for soft deleted record', async () => {
      const deletedTable = { ...mockGenTable, delFlag: DelFlagEnum.DELETED };
      mockPrisma.genTable.findUnique.mockResolvedValue(deletedTable);

      const result = await repository.findById(1);

      expect(result).toBeNull();
    });

    it('should have access to findAll', async () => {
      mockPrisma.genTable.findMany.mockResolvedValue([mockGenTable]);

      const result = await repository.findAll();

      expect(result).toEqual([mockGenTable]);
    });

    it('should have access to create', async () => {
      mockPrisma.genTable.create.mockResolvedValue(mockGenTable);

      const result = await repository.create({
        tableName: 'sys_user',
        tableComment: '用户表',
      } as any);

      expect(result).toEqual(mockGenTable);
    });

    it('should have access to update', async () => {
      const updatedTable = { ...mockGenTable, tableComment: 'Updated' };
      mockPrisma.genTable.update.mockResolvedValue(updatedTable);

      const result = await repository.update(1, { tableComment: 'Updated' });

      expect(result.tableComment).toBe('Updated');
    });

    it('should have access to softDelete', async () => {
      const deletedTable = { ...mockGenTable, delFlag: DelFlagEnum.DELETED };
      mockPrisma.genTable.update.mockResolvedValue(deletedTable);

      const result = await repository.softDelete(1);

      expect(result.delFlag).toBe(DelFlagEnum.DELETED);
    });
  });
});
