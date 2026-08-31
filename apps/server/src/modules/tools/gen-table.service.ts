import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'src/platform/prisma';
import { Result, ResponseCode } from 'src/shared/response';
import { BusinessException } from 'src/shared/exceptions/business.exception';
import { DelFlagEnum, StatusEnum } from 'src/shared/enums';
import { TenantContext } from 'src/tenant';
import { GenConstants } from 'src/shared/constants/gen.constant';
import { FieldInferenceService, IInferredColumn } from './inference/field-inference.service';
import { DataSourceService } from './datasource/datasource.service';
import { DbColumnDto } from './datasource/dto';
import { ImportTablesDto, ListGenTableRequestDto, UpdateGenTableDto, SyncTableDto } from './dto';
import { UserDto } from 'src/modules/users/user.decorator';
import { Prisma, GenTable, GenTableColumn } from '@prisma/client';
import toolConfig from './config';
import { StringUtils } from './utils';

/**
 * 数据库表行类型
 */
type DbTableRow = {
  tableName: string;
  tableComment: string | null;
  createTime: Date | null;
  updateTime: Date | null;
};

/**
 * 带列信息的表类型
 */
type GenTableWithColumns = GenTable & { columns: GenTableColumn[] };

/**
 * 代码生成表配置服务
 *
 * @description 提供表配置管理功能，包括导入、同步、租户隔离等
 * Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 12.2, 12.6
 */
@Injectable()
export class GenTableService {
  private readonly logger = new Logger(GenTableService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly fieldInferenceService: FieldInferenceService,
    private readonly dataSourceService: DataSourceService,
  ) {}

  /**
   * 获取当前租户ID
   *
   * @returns 租户ID
   */
  private getCurrentTenantId(): string {
    return TenantContext.getTenantId() || TenantContext.SUPER_TENANT_ID;
  }

  /**
   * 构建租户隔离的查询条件
   *
   * @param additionalWhere 额外的查询条件
   * @returns 包含租户隔离的查询条件
   * Requirements: 12.2, 12.6
   */
  private buildTenantWhere(additionalWhere: Prisma.GenTableWhereInput = {}): Prisma.GenTableWhereInput {
    const tenantId = this.getCurrentTenantId();
    const where: Prisma.GenTableWhereInput = {
      delFlag: DelFlagEnum.NORMAL,
      ...additionalWhere,
    };

    // 如果不是超级租户，添加租户过滤
    if (TenantContext.shouldApplyTenantFilter()) {
      where.tenantId = tenantId;
    }

    return where;
  }

  /**
   * 查询代码生成表列表
   *
   * @param query 查询参数
   * @returns 分页结果
   * Requirements: 12.2
   */
  async findAll(query: ListGenTableRequestDto) {
    const where = this.buildTenantWhere();

    if (query.tableName) {
      where.tableName = { contains: query.tableName };
    }
    if (query.tableComment) {
      where.tableComment = { contains: query.tableComment };
    }
    if (query.dataSourceId) {
      where.dataSourceId = query.dataSourceId;
    }

    const [list, total] = await Promise.all([
      this.prisma.genTable.findMany({
        where,
        skip: query.skip,
        take: query.take,
        orderBy: { tableId: 'desc' },
        include: {
          dataSource: {
            select: { id: true, name: true },
          },
          templateGroup: {
            select: { id: true, name: true },
          },
        },
      }),
      this.prisma.genTable.count({ where }),
    ]);

    return Result.page(list, total, query.pageNum, query.pageSize);
  }

  /**
   * 根据ID获取表详情
   *
   * @param tableId 表ID
   * @returns 表详情（包含列信息）
   * Requirements: 12.2
   */
  async findById(tableId: number): Promise<Result<GenTableWithColumns | null>> {
    const where = this.buildTenantWhere({ tableId });

    const table = await this.prisma.genTable.findFirst({ where });
    if (!table) {
      throw new BusinessException(ResponseCode.DATA_NOT_FOUND, '表配置不存在');
    }

    const columns = await this.prisma.genTableColumn.findMany({
      where: { tableId: table.tableId, delFlag: DelFlagEnum.NORMAL },
      orderBy: { sort: 'asc' },
    });

    return Result.ok({ ...table, columns });
  }

  /**
   * 根据表名获取表详情
   *
   * @param tableName 表名
   * @returns 表详情（包含列信息）
   * Requirements: 12.2
   */
  async findByTableName(tableName: string): Promise<GenTableWithColumns | null> {
    const where = this.buildTenantWhere({ tableName });

    const table = await this.prisma.genTable.findFirst({ where });
    if (!table) {
      return null;
    }

    const columns = await this.prisma.genTableColumn.findMany({
      where: { tableId: table.tableId, delFlag: DelFlagEnum.NORMAL },
      orderBy: { sort: 'asc' },
    });

    return { ...table, columns };
  }

  /**
   * 导入数据库表
   *
   * @param dto 导入参数
   * @param user 当前用户
   * @returns 导入结果
   * Requirements: 2.1, 2.2, 2.3, 3.1-3.9
   */
  async importTables(dto: ImportTablesDto, user: UserDto): Promise<Result<void>> {
    const tenantId = this.getCurrentTenantId();
    const tableNames = dto.tableNames.split(',').filter((name) => name.trim());

    if (tableNames.length === 0) {
      throw new BusinessException(ResponseCode.PARAM_INVALID, '请选择要导入的表');
    }

    // 获取数据库表元数据
    let tableList: DbTableRow[];
    if (dto.dataSourceId) {
      // 从指定数据源获取表信息
      const tablesResult = await this.dataSourceService.getTables(dto.dataSourceId);
      if (tablesResult.code !== 200) {
        throw new BusinessException(tablesResult.code, tablesResult.msg);
      }
      tableList = tablesResult.data
        .filter((t) => tableNames.includes(t.tableName))
        .map((t) => ({
          tableName: t.tableName,
          tableComment: t.tableComment,
          createTime: new Date(),
          updateTime: new Date(),
        }));
    } else {
      // 从默认数据源获取表信息
      tableList = await this.selectDbTableListByNames(tableNames);
    }

    if (tableList.length === 0) {
      throw new BusinessException(ResponseCode.DATA_NOT_FOUND, '未找到指定的表');
    }

    const now = new Date();

    for (const meta of tableList) {
      const tableName = meta.tableName;

      // 检查表是否已导入
      const existing = await this.prisma.genTable.findFirst({
        where: {
          tableName,
          tenantId,
          delFlag: DelFlagEnum.NORMAL,
        },
      });

      if (existing) {
        this.logger.warn(`表 ${tableName} 已存在，跳过导入`);
        continue;
      }

      // 创建表配置
      const tableData: Prisma.GenTableUncheckedCreateInput = {
        tenantId,
        tableName,
        tableComment: meta.tableComment?.trim() || tableName,
        className: toolConfig.autoRemovePre
          ? StringUtils.toPascalCase(tableName.replace(new RegExp(toolConfig.tablePrefix.join('|')), ''))
          : StringUtils.toPascalCase(tableName),
        packageName: toolConfig.packageName,
        moduleName: toolConfig.moduleName,
        businessName: this.extractBusinessName(tableName),
        functionName: meta.tableComment?.trim() || tableName,
        functionAuthor: toolConfig.author,
        createBy: user.userName,
        createTime: now,
        updateBy: user.userName,
        updateTime: now,
        genType: '0',
        genPath: '/',
        options: '',
        status: StatusEnum.NORMAL,
        delFlag: DelFlagEnum.NORMAL,
        tplCategory: 'crud',
        tplWebType: 'naive-ui',
        dataSourceId: dto.dataSourceId || null,
        templateGroupId: dto.templateGroupId || null,
      };

      const tableInfo = await this.prisma.genTable.create({ data: tableData });

      // 获取列信息并使用字段推断引擎
      let columns: DbColumnDto[];
      if (dto.dataSourceId) {
        const columnsResult = await this.dataSourceService.getColumns(dto.dataSourceId, tableName);
        if (columnsResult.code !== 200) {
          this.logger.error(`获取表 ${tableName} 的列信息失败: ${columnsResult.msg}`);
          continue;
        }
        columns = columnsResult.data;
      } else {
        columns = await this.getTableColumnInfo(tableName);
      }

      // 使用字段推断引擎推断列配置
      const inferredColumns = this.fieldInferenceService.inferColumns(columns);

      // 保存列配置
      for (let i = 0; i < inferredColumns.length; i++) {
        const inferred = inferredColumns[i];
        const columnData = this.mapInferredColumnToCreateInput(inferred, tableInfo.tableId, i, user.userName, now);
        await this.prisma.genTableColumn.create({ data: columnData });
      }

      this.logger.log(`成功导入表 ${tableName}，共 ${inferredColumns.length} 列`);
    }

    return Result.ok(undefined, '导入成功');
  }

  /**
   * 同步表结构
   *
   * @param dto 同步参数
   * @returns 同步结果
   * Requirements: 2.4, 2.5, 2.6
   */
  async syncTable(dto: SyncTableDto): Promise<Result<void>> {
    const table = await this.findByTableName(dto.tableName);
    if (!table) {
      throw new BusinessException(ResponseCode.DATA_NOT_FOUND, '表配置不存在');
    }

    const existingColumns = table.columns || [];

    // 获取当前数据库中的列信息
    let currentColumns: DbColumnDto[];
    if (table.dataSourceId) {
      const columnsResult = await this.dataSourceService.getColumns(table.dataSourceId, dto.tableName);
      if (columnsResult.code !== 200) {
        throw new BusinessException(columnsResult.code, columnsResult.msg);
      }
      currentColumns = columnsResult.data;
    } else {
      currentColumns = await this.getTableColumnInfo(dto.tableName);
    }

    if (currentColumns.length === 0) {
      throw new BusinessException(ResponseCode.DATA_NOT_FOUND, '数据库中未找到该表的列信息');
    }

    // 构建现有列的映射（用于保留用户自定义配置）
    const existingColumnMap = new Map<string, GenTableColumn>();
    for (const col of existingColumns) {
      existingColumnMap.set(col.columnName, col);
    }

    // 推断新列配置
    const inferredColumns = this.fieldInferenceService.inferColumns(currentColumns);

    // 更新或插入列
    const now = new Date();
    const processedColumnNames = new Set<string>();

    for (let i = 0; i < inferredColumns.length; i++) {
      const inferred = inferredColumns[i];
      const existingCol = existingColumnMap.get(inferred.columnName);
      processedColumnNames.add(inferred.columnName);

      if (existingCol) {
        // 更新现有列，保留用户自定义配置
        // Requirements: 2.5 - 保留 dictType, queryType, htmlType 等用户自定义配置
        const updateData: Prisma.GenTableColumnUpdateInput = {
          columnComment: inferred.columnComment,
          columnType: inferred.columnType,
          javaType: inferred.javaType,
          javaField: inferred.javaField,
          isPk: inferred.isPk,
          isIncrement: inferred.isIncrement,
          isRequired: inferred.isRequired,
          sort: i,
          updateTime: now,
        };

        // 只有当用户没有自定义时才更新这些字段
        if (!existingCol.dictType) {
          updateData.dictType = inferred.dictType;
        }
        if (existingCol.queryType === GenConstants.QUERY_EQ) {
          updateData.queryType = inferred.queryType;
        }
        if (existingCol.htmlType === GenConstants.HTML_INPUT) {
          updateData.htmlType = inferred.htmlType;
        }

        await this.prisma.genTableColumn.update({
          where: { columnId: existingCol.columnId },
          data: updateData,
        });
      } else {
        // 插入新列
        const columnData = this.mapInferredColumnToCreateInput(inferred, table.tableId, i, 'system', now);
        await this.prisma.genTableColumn.create({ data: columnData });
      }
    }

    // 删除数据库中已不存在的列
    const columnsToDelete = existingColumns
      .filter((col) => !processedColumnNames.has(col.columnName))
      .map((col) => col.columnId);

    if (columnsToDelete.length > 0) {
      await this.prisma.genTableColumn.deleteMany({
        where: { columnId: { in: columnsToDelete } },
      });
      this.logger.log(`删除了 ${columnsToDelete.length} 个已不存在的列`);
    }

    return Result.ok(undefined, '同步成功');
  }

  /**
   * 更新表配置
   *
   * @param dto 更新参数
   * @returns 更新结果
   * Requirements: 4.1-4.6
   */
  async update(dto: UpdateGenTableDto): Promise<Result<void>> {
    const where = this.buildTenantWhere({ tableId: dto.tableId });

    const existing = await this.prisma.genTable.findFirst({ where });
    if (!existing) {
      throw new BusinessException(ResponseCode.DATA_NOT_FOUND, '表配置不存在');
    }

    // 更新列配置
    if (dto.columns && dto.columns.length > 0) {
      for (const col of dto.columns) {
        if (col.columnId) {
          await this.prisma.genTableColumn.update({
            where: { columnId: col.columnId },
            data: {
              columnComment: col.columnComment,
              javaType: col.javaType,
              javaField: col.javaField,
              isInsert: col.isInsert,
              isEdit: col.isEdit,
              isList: col.isList,
              isQuery: col.isQuery,
              queryType: col.queryType,
              isRequired: col.isRequired,
              htmlType: col.htmlType,
              dictType: col.dictType,
              sort: col.sort,
              updateTime: new Date(),
            },
          });
        }
      }
    }

    // 更新表配置
    const { columns, tableId, ...tableData } = dto;
    await this.prisma.genTable.update({
      where: { tableId: dto.tableId },
      data: {
        ...tableData,
        updateTime: new Date(),
      },
    });

    return Result.ok(undefined, '更新成功');
  }

  /**
   * 删除表配置
   *
   * @param tableId 表ID
   * @returns 删除结果
   * Requirements: 12.2
   */
  async remove(tableId: number): Promise<Result<void>> {
    const where = this.buildTenantWhere({ tableId });

    const existing = await this.prisma.genTable.findFirst({ where });
    if (!existing) {
      throw new BusinessException(ResponseCode.DATA_NOT_FOUND, '表配置不存在');
    }

    // 删除列配置
    await this.prisma.genTableColumn.deleteMany({ where: { tableId } });

    // 删除表配置
    await this.prisma.genTable.delete({ where: { tableId } });

    return Result.ok(undefined, '删除成功');
  }

  /**
   * 从表名提取业务名称
   *
   * @param tableName 表名
   * @returns 业务名称
   */
  private extractBusinessName(tableName: string): string {
    // 移除前缀后取最后一个下划线后的部分
    const withoutPrefix = toolConfig.autoRemovePre
      ? tableName.replace(new RegExp(toolConfig.tablePrefix.join('|')), '')
      : tableName;
    const parts = withoutPrefix.split('_');
    return parts[parts.length - 1] || withoutPrefix;
  }

  /**
   * 将推断的列配置转换为 Prisma 创建输入
   *
   * @param inferred 推断的列配置
   * @param tableId 表ID
   * @param sort 排序
   * @param createBy 创建人
   * @param createTime 创建时间
   * @returns Prisma 创建输入
   */
  private mapInferredColumnToCreateInput(
    inferred: IInferredColumn,
    tableId: number,
    sort: number,
    createBy: string,
    createTime: Date,
  ): Prisma.GenTableColumnUncheckedCreateInput {
    return {
      tableId,
      columnName: inferred.columnName,
      columnComment: inferred.columnComment,
      columnType: inferred.columnType,
      javaType: inferred.javaType,
      javaField: inferred.javaField,
      isPk: inferred.isPk,
      isIncrement: inferred.isIncrement,
      isRequired: inferred.isRequired,
      isInsert: inferred.isInsert,
      isEdit: inferred.isEdit,
      isList: inferred.isList,
      isQuery: inferred.isQuery,
      queryType: inferred.queryType,
      htmlType: inferred.htmlType,
      dictType: inferred.dictType,
      sort,
      status: StatusEnum.NORMAL,
      delFlag: DelFlagEnum.NORMAL,
      createBy,
      createTime,
      updateBy: createBy,
      updateTime: createTime,
    };
  }

  /**
   * 根据表名批量获取表的基本信息
   *
   * @param tableNames 表名列表
   * @returns 表信息列表
   */
  private async selectDbTableListByNames(tableNames: string[]): Promise<DbTableRow[]> {
    if (!tableNames.length) return [];
    const tableSql = Prisma.join(tableNames.map((name) => Prisma.sql`${name}`));
    return this.prisma.$queryRaw<DbTableRow[]>(Prisma.sql`
      SELECT
        t.table_name AS "tableName",
        obj_description((quote_ident(t.table_schema) || '.' || quote_ident(t.table_name))::regclass) AS "tableComment",
        NOW() AS "createTime",
        NOW() AS "updateTime"
      FROM information_schema.tables t
      WHERE t.table_schema = current_schema()
        AND t.table_type = 'BASE TABLE'
        AND t.table_name NOT LIKE 'qrtz_%'
        AND t.table_name NOT LIKE 'gen_%'
        AND NOT EXISTS (SELECT 1 FROM gen_table gt WHERE gt.table_name = t.table_name AND gt.del_flag = '0')
        AND t.table_name IN (${tableSql})
    `);
  }

  /**
   * 获取表的列信息
   *
   * @param tableName 表名
   * @returns 列信息列表
   */
  private async getTableColumnInfo(tableName: string): Promise<DbColumnDto[]> {
    if (!tableName) return [];

    const rawColumns = await this.prisma.$queryRaw<
      Array<{
        columnName: string;
        columnComment: string | null;
        columnType: string;
        isPrimaryKey: boolean;
        isAutoIncrement: boolean;
        isNullable: boolean;
        defaultValue: string | null;
        maxLength: number | null;
      }>
    >(Prisma.sql`
      WITH pk_columns AS (
        SELECT k.column_name
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage k
          ON tc.constraint_name = k.constraint_name
          AND tc.table_schema = k.table_schema
          AND tc.table_name = k.table_name
        WHERE tc.table_schema = current_schema()
          AND tc.table_name = ${tableName}
          AND tc.constraint_type = 'PRIMARY KEY'
      )
      SELECT
        c.column_name AS "columnName",
        COALESCE(col_description((quote_ident(c.table_schema) || '.' || quote_ident(c.table_name))::regclass, c.ordinal_position)::text, c.column_name) AS "columnComment",
        c.data_type AS "columnType",
        CASE WHEN c.column_name IN (SELECT column_name FROM pk_columns) THEN true ELSE false END AS "isPrimaryKey",
        CASE WHEN c.is_identity = 'YES' OR c.column_default LIKE 'nextval%' THEN true ELSE false END AS "isAutoIncrement",
        CASE WHEN c.is_nullable = 'YES' THEN true ELSE false END AS "isNullable",
        c.column_default AS "defaultValue",
        c.character_maximum_length AS "maxLength"
      FROM information_schema.columns c
      WHERE c.table_schema = current_schema()
        AND c.table_name = ${tableName}
      ORDER BY c.ordinal_position
    `);

    return rawColumns.map((col) => ({
      columnName: col.columnName,
      columnComment: col.columnComment || col.columnName,
      columnType: col.columnType,
      isPrimaryKey: col.isPrimaryKey,
      isAutoIncrement: col.isAutoIncrement,
      isNullable: col.isNullable,
      defaultValue: col.defaultValue || undefined,
      maxLength: col.maxLength || undefined,
    }));
  }
}
