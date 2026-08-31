/**
 * 数据源服务单元测试
 *
 * @description 测试 DataSourceService 的所有方法
 * Requirements: 1.1, 1.2, 1.3, 1.5, 1.6, 11.1
 */
import { Test, TestingModule } from '@nestjs/testing';
import { DataSourceService } from '@/modules/tools/datasource/datasource.service';
import { PrismaService } from '@/platform/prisma';
import { TenantContext } from '@/core/tenancy/context/tenant.context';
import { ResponseCode } from '@/shared/response';

describe('DataSourceService', () => {
  let service: DataSourceService;
  let mockPrismaService: any;

  beforeEach(async () => {
    mockPrismaService = {
      genDataSource: {
        findFirst: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        count: jest.fn(),
      },
      genTable: {
        count: jest.fn(),
      },
      $queryRaw: jest.fn(),
    };

    const modules: TestingModule = await Test.createTestingModule({
      providers: [
        DataSourceService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = modules.get<DataSourceService>(DataSourceService);

    // 设置租户上下文
    jest.spyOn(TenantContext, 'getTenantId').mockReturnValue('000000');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create - 创建数据源', () => {
    it('应该成功创建数据源', async () => {
      const dto = {
        name: 'test-db',
        type: 'postgresql',
        host: 'localhost',
        port: 5432,
        database: 'testdb',
        username: 'admin',
        password: 'password123',
      };

      mockPrismaService.genDataSource.findFirst.mockResolvedValue(null);
      mockPrismaService.genDataSource.create.mockResolvedValue({
        id: 1,
        ...dto,
        password: 'encrypted',
      });

      const result = await service.create(dto as any, 'admin');

      expect(result.code).toBe(200);
      expect(result.msg).toBe('创建成功');
      expect(mockPrismaService.genDataSource.create).toHaveBeenCalled();
    });

    it('应该在名称重复时返回错误', async () => {
      const dto = { name: 'existing-db' };

      mockPrismaService.genDataSource.findFirst.mockResolvedValue({ id: 1, name: 'existing-db' });

      const result = await service.create(dto as any, 'admin');

      expect(result.code).toBe(ResponseCode.DATA_ALREADY_EXISTS);
      expect(result.msg).toBe('数据源名称已存在');
    });

    it('应该加密密码后存储', async () => {
      const dto = {
        name: 'test-db',
        type: 'postgresql',
        host: 'localhost',
        port: 5432,
        database: 'testdb',
        username: 'admin',
        password: 'plainPassword',
      };

      mockPrismaService.genDataSource.findFirst.mockResolvedValue(null);
      mockPrismaService.genDataSource.create.mockImplementation(({ data }) => {
        // 验证密码已被加密（包含冒号分隔符）
        expect(data.password).toContain(':');
        expect(data.password).not.toBe('plainPassword');
        return Promise.resolve({ id: 1, ...data });
      });

      await service.create(dto as any, 'admin');

      expect(mockPrismaService.genDataSource.create).toHaveBeenCalled();
    });
  });

  describe('update - 更新数据源', () => {
    it('应该成功更新数据源', async () => {
      const id = 1;
      const dto = { name: 'updated-db', host: 'new-host' };

      mockPrismaService.genDataSource.findFirst
        .mockResolvedValueOnce({ id: 1, name: 'old-db' })
        .mockResolvedValueOnce(null);
      mockPrismaService.genDataSource.update.mockResolvedValue({ id, ...dto });

      const result = await service.update(id, dto as any, 'admin');

      expect(result.code).toBe(200);
      expect(result.msg).toBe('更新成功');
    });

    it('应该在数据源不存在时返回错误', async () => {
      const id = 999;
      const dto = { name: 'updated-db' };

      mockPrismaService.genDataSource.findFirst.mockResolvedValue(null);

      const result = await service.update(id, dto as any, 'admin');

      expect(result.code).toBe(ResponseCode.DATA_NOT_FOUND);
    });

    it('应该在名称被其他数据源使用时返回错误', async () => {
      const id = 1;
      const dto = { name: 'existing-name' };

      mockPrismaService.genDataSource.findFirst
        .mockResolvedValueOnce({ id: 1, name: 'old-name' })
        .mockResolvedValueOnce({ id: 2, name: 'existing-name' });

      const result = await service.update(id, dto as any, 'admin');

      expect(result.code).toBe(ResponseCode.DATA_ALREADY_EXISTS);
    });

    it('应该在更新密码时加密新密码', async () => {
      const id = 1;
      const dto = { password: 'newPassword' };

      mockPrismaService.genDataSource.findFirst.mockResolvedValue({ id: 1, name: 'test-db' });
      mockPrismaService.genDataSource.update.mockImplementation(({ data }) => {
        expect(data.password).toContain(':');
        expect(data.password).not.toBe('newPassword');
        return Promise.resolve({ id, ...data });
      });

      await service.update(id, dto as any, 'admin');

      expect(mockPrismaService.genDataSource.update).toHaveBeenCalled();
    });
  });

  describe('delete - 删除数据源', () => {
    it('应该成功软删除数据源', async () => {
      const id = 1;

      mockPrismaService.genDataSource.findFirst.mockResolvedValue({ id: 1, name: 'test-db' });
      mockPrismaService.genTable.count.mockResolvedValue(0);
      mockPrismaService.genDataSource.update.mockResolvedValue({ id, delFlag: '1' });

      const result = await service.delete(id, 'admin');

      expect(result.code).toBe(200);
      expect(result.msg).toBe('删除成功');
      expect(mockPrismaService.genDataSource.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id },
          data: expect.objectContaining({ delFlag: '1' }),
        }),
      );
    });

    it('应该在数据源不存在时返回错误', async () => {
      const id = 999;

      mockPrismaService.genDataSource.findFirst.mockResolvedValue(null);

      const result = await service.delete(id, 'admin');

      expect(result.code).toBe(ResponseCode.DATA_NOT_FOUND);
    });

    it('应该在数据源被使用时返回错误', async () => {
      const id = 1;

      mockPrismaService.genDataSource.findFirst.mockResolvedValue({ id: 1, name: 'test-db' });
      mockPrismaService.genTable.count.mockResolvedValue(5);

      const result = await service.delete(id, 'admin');

      expect(result.code).toBe(ResponseCode.DATA_IN_USE);
    });
  });

  describe('findAll - 查询数据源列表', () => {
    it('应该返回分页的数据源列表', async () => {
      const query = { pageNum: 1, pageSize: 10, skip: 0, take: 10, getOrderBy: () => ({ createTime: 'desc' }) };
      const mockDataSources = [
        { id: 1, name: 'db1', type: 'postgresql', password: 'encrypted' },
        { id: 2, name: 'db2', type: 'mysql', password: 'encrypted' },
      ];

      mockPrismaService.genDataSource.findMany.mockResolvedValue(mockDataSources);
      mockPrismaService.genDataSource.count.mockResolvedValue(2);

      const result = await service.findAll(query as any);

      expect(result.code).toBe(200);
      expect(result.data.rows).toHaveLength(2);
      expect(result.data.total).toBe(2);
      // 验证密码已被移除
      result.data.rows.forEach((row: any) => {
        expect(row.password).toBeUndefined();
      });
    });

    it('应该支持按名称筛选', async () => {
      const query = { pageNum: 1, pageSize: 10, skip: 0, take: 10, name: 'test', getOrderBy: () => ({}) };

      mockPrismaService.genDataSource.findMany.mockResolvedValue([]);
      mockPrismaService.genDataSource.count.mockResolvedValue(0);

      await service.findAll(query as any);

      expect(mockPrismaService.genDataSource.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            name: { contains: 'test' },
          }),
        }),
      );
    });
  });

  describe('findOne - 查询单个数据源', () => {
    it('应该返回数据源详情（不含密码）', async () => {
      const id = 1;
      const mockDataSource = {
        id: 1,
        name: 'test-db',
        type: 'postgresql',
        host: 'localhost',
        port: 5432,
        password: 'encrypted',
      };

      mockPrismaService.genDataSource.findFirst.mockResolvedValue(mockDataSource);

      const result = await service.findOne(id);

      expect(result.code).toBe(200);
      expect(result.data?.password).toBeUndefined();
    });

    it('应该在数据源不存在时返回错误', async () => {
      const id = 999;

      mockPrismaService.genDataSource.findFirst.mockResolvedValue(null);

      const result = await service.findOne(id);

      expect(result.code).toBe(ResponseCode.DATA_NOT_FOUND);
    });
  });

  describe('encryptPassword / decryptPassword - 密码加解密', () => {
    it('应该正确加密和解密密码', () => {
      const originalPassword = 'testPassword123';

      const encrypted = service.encryptPassword(originalPassword);
      const decrypted = service.decryptPassword(encrypted);

      expect(encrypted).not.toBe(originalPassword);
      expect(encrypted).toContain(':');
      expect(decrypted).toBe(originalPassword);
    });

    it('应该为相同密码生成不同的密文', () => {
      const password = 'samePassword';

      const encrypted1 = service.encryptPassword(password);
      const encrypted2 = service.encryptPassword(password);

      expect(encrypted1).not.toBe(encrypted2);
    });

    it('应该对未加密的密码返回原值', () => {
      const plainPassword = 'plainPassword';

      const result = service.decryptPassword(plainPassword);

      expect(result).toBe(plainPassword);
    });

    it('应该处理特殊字符', () => {
      const specialPassword = '!@#$%^&*()_+-=[]{}|;:,.<>?';

      const encrypted = service.encryptPassword(specialPassword);
      const decrypted = service.decryptPassword(encrypted);

      expect(decrypted).toBe(specialPassword);
    });

    it('应该处理中文密码', () => {
      const chinesePassword = '中文密码测试123';

      const encrypted = service.encryptPassword(chinesePassword);
      const decrypted = service.decryptPassword(encrypted);

      expect(decrypted).toBe(chinesePassword);
    });
  });

  describe('testConnection - 测试数据源连接', () => {
    it('应该对 SQLite 类型直接返回成功', async () => {
      const dto = {
        type: 'sqlite',
        host: '',
        port: 0,
        database: '/path/to/db.sqlite',
        username: '',
        password: '',
      };

      const result = await service.testConnection(dto as any);

      expect(result.code).toBe(200);
      expect(result.msg).toBe('连接成功');
    });
  });

  describe('getTables - 获取数据源的表列表', () => {
    it('应该返回 PostgreSQL 数据源的表列表', async () => {
      const id = 1;
      const mockDataSource = {
        id: 1,
        type: 'postgresql',
        password: service.encryptPassword('password'),
      };
      const mockTables = [
        { tableName: 'sys_user', tableComment: '用户表' },
        { tableName: 'sys_role', tableComment: '角色表' },
      ];

      mockPrismaService.genDataSource.findFirst.mockResolvedValue(mockDataSource);
      mockPrismaService.$queryRaw.mockResolvedValue(mockTables);

      const result = await service.getTables(id);

      expect(result.code).toBe(200);
      expect(result.data).toHaveLength(2);
    });

    it('应该在数据源不存在时返回错误', async () => {
      const id = 999;

      mockPrismaService.genDataSource.findFirst.mockResolvedValue(null);

      const result = await service.getTables(id);

      expect(result.code).toBe(ResponseCode.DATA_NOT_FOUND);
    });
  });

  describe('getColumns - 获取表的列信息', () => {
    it('应该返回 PostgreSQL 表的列信息', async () => {
      const id = 1;
      const tableName = 'sys_user';
      const mockDataSource = {
        id: 1,
        type: 'postgresql',
        password: service.encryptPassword('password'),
      };
      const mockColumns = [
        { columnName: 'user_id', columnComment: '用户ID', columnType: 'bigint', isPrimaryKey: true },
        { columnName: 'user_name', columnComment: '用户名', columnType: 'varchar', isPrimaryKey: false },
      ];

      mockPrismaService.genDataSource.findFirst.mockResolvedValue(mockDataSource);
      mockPrismaService.$queryRaw.mockResolvedValue(mockColumns);

      const result = await service.getColumns(id, tableName);

      expect(result.code).toBe(200);
      expect(result.data).toHaveLength(2);
    });

    it('应该在数据源不存在时返回错误', async () => {
      const id = 999;
      const tableName = 'sys_user';

      mockPrismaService.genDataSource.findFirst.mockResolvedValue(null);

      const result = await service.getColumns(id, tableName);

      expect(result.code).toBe(ResponseCode.DATA_NOT_FOUND);
    });
  });
});
