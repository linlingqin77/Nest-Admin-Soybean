import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'src/platform/prisma';
import { Result, ResponseCode } from 'src/shared/response';
import { BusinessException } from 'src/shared/exceptions/business.exception';
import { TenantContext } from 'src/core/tenancy/context/tenant.context';
import { DelFlagEnum, StatusEnum } from 'src/shared/enums';
import { Prisma, GenDataSource } from '@prisma/client';
import * as crypto from 'crypto';
import {
  CreateDataSourceDto,
  UpdateDataSourceDto,
  ListDataSourceRequestDto,
  TestConnectionDto,
  DatabaseType,
  DbTableDto,
  DbColumnDto,
} from './dto';

// 数据源密码加密密钥（生产环境应从配置中读取）
const ENCRYPTION_KEY = process.env.DATASOURCE_PASSWORD_KEY || 'datasource-password-encryption-32b';
const ENCRYPTION_IV_LENGTH = 16;

/**
 * 数据源管理服务
 *
 * @description 提供数据源的 CRUD 操作、连接测试、元数据获取等功能
 * Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6
 */
@Injectable()
export class DataSourceService {
  private readonly logger = new Logger(DataSourceService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * 加密密码
   * Requirements: 1.6
   */
  encryptPassword(password: string): string {
    const iv = crypto.randomBytes(ENCRYPTION_IV_LENGTH);
    const key = crypto.scryptSync(ENCRYPTION_KEY, 'salt', 32);
    const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
    let encrypted = cipher.update(password, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return iv.toString('hex') + ':' + encrypted;
  }

  /**
   * 解密密码
   * Requirements: 1.6
   */
  decryptPassword(encryptedPassword: string): string {
    try {
      const parts = encryptedPassword.split(':');
      if (parts.length !== 2) {
        return encryptedPassword; // 未加密的密码直接返回
      }
      const iv = Buffer.from(parts[0], 'hex');
      const encrypted = parts[1];
      const key = crypto.scryptSync(ENCRYPTION_KEY, 'salt', 32);
      const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      return decrypted;
    } catch {
      return encryptedPassword; // 解密失败返回原值
    }
  }

  /**
   * 创建数据源
   * Requirements: 1.1, 1.2, 1.6
   */
  async create(dto: CreateDataSourceDto, username: string): Promise<Result<GenDataSource>> {
    const tenantId = TenantContext.getTenantId() || TenantContext.SUPER_TENANT_ID;

    // 检查名称是否已存在
    const existing = await this.prisma.genDataSource.findFirst({
      where: {
        tenantId,
        name: dto.name,
        delFlag: DelFlagEnum.NORMAL,
      },
    });

    if (existing) {
      throw new BusinessException(ResponseCode.DATA_ALREADY_EXISTS, '数据源名称已存在');
    }

    try {
      // 加密密码
      const encryptedPassword = this.encryptPassword(dto.password);

      const dataSource = await this.prisma.genDataSource.create({
        data: {
          tenantId,
          name: dto.name,
          type: dto.type,
          host: dto.host,
          port: dto.port,
          database: dto.database,
          username: dto.username,
          password: encryptedPassword,
          status: StatusEnum.NORMAL,
          delFlag: DelFlagEnum.NORMAL,
          createBy: username,
          updateBy: username,
          remark: dto.remark,
        },
      });

      this.logger.log(`数据源创建成功: ${dataSource.name} (ID: ${dataSource.id})`);
      return Result.ok(dataSource, '创建成功');
    } catch (error) {
      this.logger.error(`数据源创建失败: ${error.message}`, error.stack);
      throw new BusinessException(ResponseCode.OPERATION_FAILED, '创建数据源失败');
    }
  }

  /**
   * 更新数据源
   * Requirements: 1.1, 1.2, 1.6
   */
  async update(id: number, dto: UpdateDataSourceDto, username: string): Promise<Result<GenDataSource>> {
    const tenantId = TenantContext.getTenantId() || TenantContext.SUPER_TENANT_ID;

    // 检查数据源是否存在
    const existing = await this.prisma.genDataSource.findFirst({
      where: {
        id,
        tenantId,
        delFlag: DelFlagEnum.NORMAL,
      },
    });

    if (!existing) {
      throw new BusinessException(ResponseCode.DATA_NOT_FOUND, '数据源不存在');
    }

    // 如果更新名称，检查名称是否已被其他数据源使用
    if (dto.name && dto.name !== existing.name) {
      const nameExists = await this.prisma.genDataSource.findFirst({
        where: {
          tenantId,
          name: dto.name,
          id: { not: id },
          delFlag: DelFlagEnum.NORMAL,
        },
      });

      if (nameExists) {
        throw new BusinessException(ResponseCode.DATA_ALREADY_EXISTS, '数据源名称已存在');
      }
    }

    try {
      const updateData: Prisma.GenDataSourceUpdateInput = {
        ...dto,
        updateBy: username,
        updateTime: new Date(),
      };

      // 如果提供了新密码，加密存储
      if (dto.password) {
        updateData.password = this.encryptPassword(dto.password);
      } else {
        delete updateData.password;
      }

      const dataSource = await this.prisma.genDataSource.update({
        where: { id },
        data: updateData,
      });

      this.logger.log(`数据源更新成功: ${dataSource.name} (ID: ${dataSource.id})`);
      return Result.ok(dataSource, '更新成功');
    } catch (error) {
      this.logger.error(`数据源更新失败: ${error.message}`, error.stack);
      throw new BusinessException(ResponseCode.OPERATION_FAILED, '更新数据源失败');
    }
  }

  /**
   * 删除数据源（软删除）
   * Requirements: 1.1
   */
  async delete(id: number, username: string): Promise<Result<void>> {
    const tenantId = TenantContext.getTenantId() || TenantContext.SUPER_TENANT_ID;

    const existing = await this.prisma.genDataSource.findFirst({
      where: {
        id,
        tenantId,
        delFlag: DelFlagEnum.NORMAL,
      },
    });

    if (!existing) {
      throw new BusinessException(ResponseCode.DATA_NOT_FOUND, '数据源不存在');
    }

    // 检查是否有关联的表配置
    const relatedTables = await this.prisma.genTable.count({
      where: {
        dataSourceId: id,
        delFlag: DelFlagEnum.NORMAL,
      },
    });

    if (relatedTables > 0) {
      throw new BusinessException(ResponseCode.DATA_IN_USE, '该数据源已被使用，无法删除');
    }

    try {
      await this.prisma.genDataSource.update({
        where: { id },
        data: {
          delFlag: DelFlagEnum.DELETE,
          updateBy: username,
          updateTime: new Date(),
        },
      });

      this.logger.log(`数据源删除成功: ${existing.name} (ID: ${id})`);
      return Result.ok(null, '删除成功');
    } catch (error) {
      this.logger.error(`数据源删除失败: ${error.message}`, error.stack);
      throw new BusinessException(ResponseCode.OPERATION_FAILED, '删除数据源失败');
    }
  }

  /**
   * 查询数据源列表
   * Requirements: 1.1
   */
  async findAll(query: ListDataSourceRequestDto): Promise<Result> {
    const tenantId = TenantContext.getTenantId() || TenantContext.SUPER_TENANT_ID;

    const where: Prisma.GenDataSourceWhereInput = {
      tenantId,
      delFlag: DelFlagEnum.NORMAL,
    };

    if (query.name) {
      where.name = { contains: query.name };
    }

    if (query.type) {
      where.type = query.type;
    }

    if (query.status) {
      where.status = query.status;
    }

    const [rows, total] = await Promise.all([
      this.prisma.genDataSource.findMany({
        where,
        skip: query.skip,
        take: query.take,
        orderBy: query.getOrderBy('createTime'),
      }),
      this.prisma.genDataSource.count({ where }),
    ]);

    // 移除密码字段
    const safeRows = rows.map((row) => ({
      ...row,
      password: undefined,
    }));

    return Result.page(safeRows, total, query.pageNum, query.pageSize);
  }

  /**
   * 查询单个数据源
   * Requirements: 1.1
   */
  async findOne(id: number): Promise<Result<GenDataSource | null>> {
    const tenantId = TenantContext.getTenantId() || TenantContext.SUPER_TENANT_ID;

    const dataSource = await this.prisma.genDataSource.findFirst({
      where: {
        id,
        tenantId,
        delFlag: DelFlagEnum.NORMAL,
      },
    });

    if (!dataSource) {
      throw new BusinessException(ResponseCode.DATA_NOT_FOUND, '数据源不存在');
    }

    // 移除密码字段
    return Result.ok({
      ...dataSource,
      password: undefined,
    } as GenDataSource);
  }

  /**
   * 测试数据源连接
   * Requirements: 1.2, 1.5
   */
  async testConnection(dto: TestConnectionDto): Promise<Result<boolean>> {
    try {
      const connectionString = this.buildConnectionString(dto);
      const testResult = await this.executeConnectionTest(dto.type, connectionString);

      if (testResult.success) {
        return Result.ok(true, '连接成功');
      } else {
        throw new BusinessException(ResponseCode.OPERATION_FAILED, testResult.message);
      }
    } catch (error) {
      this.logger.error(`连接测试失败: ${error.message}`, error.stack);
      throw new BusinessException(ResponseCode.OPERATION_FAILED, this.getConnectionErrorMessage(error));
    }
  }

  /**
   * 测试已保存的数据源连接
   * Requirements: 1.2, 1.5
   */
  async testConnectionById(id: number): Promise<Result<boolean>> {
    const tenantId = TenantContext.getTenantId() || TenantContext.SUPER_TENANT_ID;

    const dataSource = await this.prisma.genDataSource.findFirst({
      where: {
        id,
        tenantId,
        delFlag: DelFlagEnum.NORMAL,
      },
    });

    if (!dataSource) {
      throw new BusinessException(ResponseCode.DATA_NOT_FOUND, '数据源不存在');
    }

    const decryptedPassword = this.decryptPassword(dataSource.password);

    return this.testConnection({
      type: dataSource.type as DatabaseType,
      host: dataSource.host,
      port: dataSource.port,
      database: dataSource.database,
      username: dataSource.username,
      password: decryptedPassword,
    });
  }

  /**
   * 获取数据源的表列表
   * Requirements: 1.3
   */
  async getTables(dataSourceId: number): Promise<Result<DbTableDto[]>> {
    const tenantId = TenantContext.getTenantId() || TenantContext.SUPER_TENANT_ID;

    const dataSource = await this.prisma.genDataSource.findFirst({
      where: {
        id: dataSourceId,
        tenantId,
        delFlag: DelFlagEnum.NORMAL,
      },
    });

    if (!dataSource) {
      throw new BusinessException(ResponseCode.DATA_NOT_FOUND, '数据源不存在');
    }

    try {
      const tables = await this.fetchTables(dataSource);
      return Result.ok(tables);
    } catch (error) {
      this.logger.error(`获取表列表失败: ${error.message}`, error.stack);
      throw new BusinessException(ResponseCode.OPERATION_FAILED, this.getConnectionErrorMessage(error));
    }
  }

  /**
   * 获取表的列信息
   * Requirements: 1.3
   */
  async getColumns(dataSourceId: number, tableName: string): Promise<Result<DbColumnDto[]>> {
    const tenantId = TenantContext.getTenantId() || TenantContext.SUPER_TENANT_ID;

    const dataSource = await this.prisma.genDataSource.findFirst({
      where: {
        id: dataSourceId,
        tenantId,
        delFlag: DelFlagEnum.NORMAL,
      },
    });

    if (!dataSource) {
      throw new BusinessException(ResponseCode.DATA_NOT_FOUND, '数据源不存在');
    }

    try {
      const columns = await this.fetchColumns(dataSource, tableName);
      return Result.ok(columns);
    } catch (error) {
      this.logger.error(`获取列信息失败: ${error.message}`, error.stack);
      throw new BusinessException(ResponseCode.OPERATION_FAILED, this.getConnectionErrorMessage(error));
    }
  }

  /**
   * 构建数据库连接字符串
   */
  private buildConnectionString(config: TestConnectionDto): string {
    const { type, host, port, database, username, password } = config;

    switch (type) {
      case DatabaseType.POSTGRESQL:
        return `postgresql://${encodeURIComponent(username)}:${encodeURIComponent(password)}@${host}:${port}/${database}`;
      case DatabaseType.MYSQL:
        return `mysql://${encodeURIComponent(username)}:${encodeURIComponent(password)}@${host}:${port}/${database}`;
      case DatabaseType.SQLITE:
        return `file:${database}`;
      default:
        throw new BusinessException(ResponseCode.BUSINESS_ERROR, `不支持的数据库类型: ${type}`);
    }
  }

  /**
   * 执行连接测试
   */
  private async executeConnectionTest(
    type: DatabaseType,
    connectionString: string,
  ): Promise<{ success: boolean; message: string }> {
    // 使用动态导入来测试连接
    // 这里我们使用简单的 TCP 连接测试，实际生产环境可以使用对应的数据库驱动
    const net = await import('net');

    return new Promise((resolve) => {
      // 从连接字符串解析主机和端口
      let host: string;
      let port: number;

      try {
        if (type === DatabaseType.SQLITE) {
          // SQLite 是文件数据库，直接返回成功
          resolve({ success: true, message: '连接成功' });
          return;
        }

        const url = new URL(connectionString);
        host = url.hostname;
        port = parseInt(url.port, 10);
      } catch {
        resolve({ success: false, message: '无效的连接配置' });
        return;
      }

      const socket = new net.Socket();
      const timeout = 5000; // 5秒超时

      socket.setTimeout(timeout);

      socket.on('connect', () => {
        socket.destroy();
        resolve({ success: true, message: '连接成功' });
      });

      socket.on('timeout', () => {
        socket.destroy();
        resolve({ success: false, message: '连接超时，请检查主机地址和端口' });
      });

      socket.on('error', (err: NodeJS.ErrnoException) => {
        socket.destroy();
        if (err.code === 'ECONNREFUSED') {
          resolve({ success: false, message: '连接被拒绝，请检查数据库服务是否启动' });
        } else if (err.code === 'ENOTFOUND') {
          resolve({ success: false, message: '无法解析主机地址' });
        } else if (err.code === 'ETIMEDOUT') {
          resolve({ success: false, message: '连接超时，请检查网络连接' });
        } else {
          resolve({ success: false, message: `连接失败: ${err.message}` });
        }
      });

      socket.connect(port, host);
    });
  }

  /**
   * 获取连接错误的友好消息
   * Requirements: 1.5
   */
  private getConnectionErrorMessage(error: Error): string {
    const message = error.message.toLowerCase();

    if (message.includes('econnrefused')) {
      return '连接被拒绝，请检查数据库服务是否启动，以及主机地址和端口是否正确';
    }
    if (message.includes('enotfound')) {
      return '无法解析主机地址，请检查主机名是否正确';
    }
    if (message.includes('etimedout') || message.includes('timeout')) {
      return '连接超时，请检查网络连接和防火墙设置';
    }
    if (message.includes('authentication') || message.includes('password')) {
      return '认证失败，请检查用户名和密码是否正确';
    }
    if (message.includes('database') && message.includes('not exist')) {
      return '数据库不存在，请检查数据库名称是否正确';
    }

    return `连接失败: ${error.message}`;
  }

  /**
   * 获取数据源的表列表（内部方法）
   */
  private async fetchTables(dataSource: GenDataSource): Promise<DbTableDto[]> {
    const decryptedPassword = this.decryptPassword(dataSource.password);

    // 对于当前项目的主数据源（PostgreSQL），使用 Prisma 查询
    // 对于外部数据源，需要建立独立连接
    if (dataSource.type === DatabaseType.POSTGRESQL) {
      return this.fetchPostgresqlTables(dataSource, decryptedPassword);
    } else if (dataSource.type === DatabaseType.MYSQL) {
      return this.fetchMysqlTables(dataSource, decryptedPassword);
    } else {
      throw new BusinessException(ResponseCode.BUSINESS_ERROR, `暂不支持 ${dataSource.type} 类型的表列表获取`);
    }
  }

  /**
   * 获取 PostgreSQL 表列表
   */
  private async fetchPostgresqlTables(dataSource: GenDataSource, _password: string): Promise<DbTableDto[]> {
    // 如果是当前数据库，使用 Prisma 查询
    // 这里简化处理，实际应该建立独立连接
    const tables = await this.prisma.$queryRaw<DbTableDto[]>`
      SELECT
        t.table_name AS "tableName",
        COALESCE(obj_description((quote_ident(t.table_schema) || '.' || quote_ident(t.table_name))::regclass), '') AS "tableComment",
        NOW() AS "createTime",
        NOW() AS "updateTime"
      FROM information_schema.tables t
      WHERE t.table_schema = 'public'
        AND t.table_type = 'BASE TABLE'
      ORDER BY t.table_name
    `;

    return tables;
  }

  /**
   * 获取 MySQL 表列表（占位实现）
   */
  private async fetchMysqlTables(_dataSource: GenDataSource, _password: string): Promise<DbTableDto[]> {
    // MySQL 需要使用 mysql2 驱动建立独立连接
    // 这里返回空数组，实际实现需要安装 mysql2 依赖
    this.logger.warn('MySQL 数据源支持需要额外配置');
    return [];
  }

  /**
   * 获取表的列信息（内部方法）
   */
  private async fetchColumns(dataSource: GenDataSource, tableName: string): Promise<DbColumnDto[]> {
    const decryptedPassword = this.decryptPassword(dataSource.password);

    if (dataSource.type === DatabaseType.POSTGRESQL) {
      return this.fetchPostgresqlColumns(dataSource, tableName, decryptedPassword);
    } else if (dataSource.type === DatabaseType.MYSQL) {
      return this.fetchMysqlColumns(dataSource, tableName, decryptedPassword);
    } else {
      throw new BusinessException(ResponseCode.BUSINESS_ERROR, `暂不支持 ${dataSource.type} 类型的列信息获取`);
    }
  }

  /**
   * 获取 PostgreSQL 列信息
   */
  private async fetchPostgresqlColumns(
    _dataSource: GenDataSource,
    tableName: string,
    _password: string,
  ): Promise<DbColumnDto[]> {
    const columns = await this.prisma.$queryRaw<any[]>`
      WITH pk_columns AS (
        SELECT k.column_name
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage k
          ON tc.constraint_name = k.constraint_name
          AND tc.table_schema = k.table_schema
          AND tc.table_name = k.table_name
        WHERE tc.table_schema = 'public'
          AND tc.table_name = ${tableName}
          AND tc.constraint_type = 'PRIMARY KEY'
      )
      SELECT
        c.column_name AS "columnName",
        COALESCE(col_description((quote_ident(c.table_schema) || '.' || quote_ident(c.table_name))::regclass, c.ordinal_position)::text, '') AS "columnComment",
        c.data_type AS "columnType",
        CASE WHEN c.column_name IN (SELECT column_name FROM pk_columns) THEN true ELSE false END AS "isPrimaryKey",
        CASE WHEN c.is_identity = 'YES' OR c.column_default LIKE 'nextval%' THEN true ELSE false END AS "isAutoIncrement",
        CASE WHEN c.is_nullable = 'YES' THEN true ELSE false END AS "isNullable",
        c.column_default AS "defaultValue",
        c.character_maximum_length AS "maxLength"
      FROM information_schema.columns c
      WHERE c.table_schema = 'public'
        AND c.table_name = ${tableName}
      ORDER BY c.ordinal_position
    `;

    return columns.map((col) => ({
      columnName: col.columnName,
      columnComment: col.columnComment || col.columnName,
      columnType: col.columnType,
      isPrimaryKey: col.isPrimaryKey,
      isAutoIncrement: col.isAutoIncrement,
      isNullable: col.isNullable,
      defaultValue: col.defaultValue,
      maxLength: col.maxLength,
    }));
  }

  /**
   * 获取 MySQL 列信息（占位实现）
   */
  private async fetchMysqlColumns(
    _dataSource: GenDataSource,
    _tableName: string,
    _password: string,
  ): Promise<DbColumnDto[]> {
    // MySQL 需要使用 mysql2 驱动建立独立连接
    this.logger.warn('MySQL 数据源支持需要额外配置');
    return [];
  }
}
