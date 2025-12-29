import { Test, TestingModule } from '@nestjs/testing';
import { ToolService } from './tool.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { createPrismaMock } from 'src/test-utils/prisma-mock';
import { plainToInstance } from 'class-transformer';
import { GenTableList, GenDbTableList, TableName } from './dto/create-genTable-dto';
import { ResponseCode } from 'src/common/response';
import { StatusEnum, DelFlagEnum } from 'src/common/enum/index';

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
  });

  describe('preview', () => {
    it('should preview generated code', async () => {
      (prisma.genTable.findFirst as jest.Mock).mockResolvedValue(mockGenTable);
      (prisma.genTableColumn.findMany as jest.Mock).mockResolvedValue([mockGenTableColumn]);

      const result = await service.preview(1);

      expect(result.code).toBe(ResponseCode.SUCCESS);
      expect(result.data).toBeDefined();
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
});
