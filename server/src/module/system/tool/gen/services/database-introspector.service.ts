import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { Prisma, GenTableColumn } from '@prisma/client';
import { TableMetadata, ColumnMetadata, TYPE_MAPPING, HTML_TYPE_MAPPING } from '../interfaces';
import { GenConstants } from 'src/common/constant/gen.constant';
import { camelCase, toLower } from 'lodash';
import { StatusEnum, DelFlagEnum } from 'src/common/enum/index';

/**
 * 数据库列信息（从数据库查询返回的原始数据）
 */
interface DbColumnRow {
  columnName: string;
  columnComment: string | null;
  columnType: string;
  isRequired: string;
  isPk: string;
  isIncrement: string;
  columnDefault: string | null;
  sort: number;
  maxLength: number | null;
}

/**
 * 数据库内省服务
 * 负责从 PostgreSQL 数据库读取表结构元数据
 */
@Injectable()
export class DatabaseIntrospectorService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * 获取所有业务表（排除系统表）
   * @param tableName 表名过滤
   * @param tableComment 表注释过滤
   */
  async listTables(tableName?: string, tableComment?: string): Promise<TableMetadata[]> {
    let filterClause = Prisma.sql``;

    if (tableName) {
      filterClause = Prisma.sql`${filterClause} AND t.table_name ILIKE ${`%${tableName}%`}`;
    }
    if (tableComment) {
      filterClause = Prisma.sql`${filterClause} AND obj_description((quote_ident(t.table_schema) || '.' || quote_ident(t.table_name))::regclass) ILIKE ${`%${tableComment}%`}`;
    }

    return this.prisma.$queryRaw<TableMetadata[]>(Prisma.sql`
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
        AND t.table_name NOT LIKE '_prisma_%'
        AND NOT EXISTS (SELECT 1 FROM gen_table gt WHERE gt.table_name = t.table_name AND gt.del_flag = '0')
        ${filterClause}
      ORDER BY t.table_name
    `);
  }

  /**
   * 根据表名批量获取表的基本信息
   */
  async getTablesByNames(tableNames: string[]): Promise<TableMetadata[]> {
    if (!tableNames.length) return [];

    const tableSql = Prisma.join(tableNames.map((name) => Prisma.sql`${name}`));

    return this.prisma.$queryRaw<TableMetadata[]>(Prisma.sql`
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
   * 获取指定表的列信息
   */
  async getTableColumns(tableName: string): Promise<DbColumnRow[]> {
    if (!tableName) return [];

    return this.prisma.$queryRaw<DbColumnRow[]>(Prisma.sql`
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
        CASE WHEN c.is_nullable = 'NO' AND c.column_default IS NULL THEN '1' ELSE '0' END AS "isRequired",
        CASE WHEN c.column_name IN (SELECT column_name FROM pk_columns) THEN '1' ELSE '0' END AS "isPk",
        CASE WHEN c.is_identity = 'YES' OR c.column_default LIKE 'nextval%' THEN '1' ELSE '0' END AS "isIncrement",
        c.column_default AS "columnDefault",
        c.ordinal_position AS "sort",
        c.character_maximum_length AS "maxLength"
      FROM information_schema.columns c
      WHERE c.table_schema = current_schema()
        AND c.table_name = ${tableName}
      ORDER BY c.ordinal_position
    `);
  }

  /**
   * 检查表是否存在
   */
  async tableExists(tableName: string): Promise<boolean> {
    const result = await this.prisma.$queryRaw<Array<{ exists: boolean }>>(Prisma.sql`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = current_schema()
          AND table_name = ${tableName}
      ) AS "exists"
    `);
    return result[0]?.exists ?? false;
  }

  /**
   * 初始化列配置
   * 根据列的类型和名称自动设置默认配置
   */
  initColumnConfig(column: DbColumnRow, tableId: number, createBy: string = 'admin'): Partial<GenTableColumn> {
    const columnName = column.columnName;
    const dataType = column.columnType;
    const now = new Date();

    // 基础配置
    const config: Partial<GenTableColumn> = {
      tableId,
      columnName,
      columnComment: column.columnComment || columnName,
      columnType: dataType,
      javaType: this.getJavaType(dataType),
      javaField: camelCase(columnName),
      isPk: column.isPk,
      isIncrement: column.isIncrement,
      isRequired: GenConstants.NOT_REQUIRE,
      isInsert: GenConstants.NOT_REQUIRE,
      isEdit: GenConstants.NOT_REQUIRE,
      isList: GenConstants.NOT_REQUIRE,
      isQuery: GenConstants.NOT_REQUIRE,
      queryType: GenConstants.QUERY_EQ,
      htmlType: this.getHtmlType(dataType),
      dictType: '',
      columnDefault: column.columnDefault,
      sort: Number(column.sort),
      status: StatusEnum.NORMAL as any,
      delFlag: DelFlagEnum.NORMAL as any,
      createBy,
      createTime: now,
      updateBy: createBy,
      updateTime: now,
    };

    // 根据列类型设置 HTML 类型
    if (this.isTextType(dataType)) {
      config.htmlType = GenConstants.HTML_TEXTAREA;
    } else if (this.isStringType(dataType)) {
      const len = column.maxLength || 0;
      config.htmlType = len >= 500 ? GenConstants.HTML_TEXTAREA : GenConstants.HTML_INPUT;
    } else if (this.isDateTimeType(dataType)) {
      config.javaType = GenConstants.TYPE_DATE;
      config.htmlType = GenConstants.HTML_DATETIME;
    } else if (this.isNumberType(dataType)) {
      config.htmlType = GenConstants.HTML_INPUT;
      config.javaType = GenConstants.TYPE_NUMBER;
    }

    // 插入字段
    if (!this.isNotInsertColumn(columnName)) {
      config.isInsert = GenConstants.REQUIRE;
    }

    // 编辑字段
    if (!this.isNotEditColumn(columnName)) {
      config.isEdit = GenConstants.REQUIRE;
    }

    // 列表字段
    if (!this.isNotListColumn(columnName)) {
      config.isList = GenConstants.REQUIRE;
    }

    // 查询字段
    if (!this.isNotQueryColumn(columnName) && config.htmlType !== GenConstants.HTML_TEXTAREA) {
      config.isQuery = GenConstants.REQUIRE;
    }

    // 主键字段特殊处理
    if (column.isPk === '1') {
      config.isInsert = GenConstants.NOT_REQUIRE;
      config.isEdit = GenConstants.REQUIRE;
      config.isQuery = GenConstants.REQUIRE;
      config.isList = GenConstants.REQUIRE;
    }

    // 根据列名设置特殊配置
    const lowerColumnName = toLower(columnName);

    // 名称字段使用模糊查询
    if (lowerColumnName.includes('name')) {
      config.queryType = GenConstants.QUERY_LIKE;
    }

    // 状态字段设置单选框
    if (lowerColumnName.includes('status')) {
      config.htmlType = GenConstants.HTML_RADIO;
    }
    // 类型&性别字段设置下拉框
    else if (lowerColumnName.includes('type') || lowerColumnName.includes('sex')) {
      config.htmlType = GenConstants.HTML_SELECT;
    }
    // 日期字段设置日期控件
    else if (lowerColumnName.includes('time') || lowerColumnName.includes('_date') || lowerColumnName.includes('Date')) {
      config.htmlType = GenConstants.HTML_DATETIME;
      config.queryType = GenConstants.QUERY_BETWEEN;
    }
    // 图片字段设置图片上传控件
    else if (lowerColumnName.includes('image') || lowerColumnName.includes('avatar') || lowerColumnName.includes('logo')) {
      config.htmlType = GenConstants.HTML_IMAGE_UPLOAD;
    }
    // 文件字段设置文件上传控件
    else if (lowerColumnName.includes('file') || lowerColumnName.includes('attachment')) {
      config.htmlType = GenConstants.HTML_FILE_UPLOAD;
    }
    // 内容字段设置富文本控件
    else if (lowerColumnName.includes('content') || lowerColumnName.includes('description')) {
      config.htmlType = GenConstants.HTML_EDITOR;
    }

    return config;
  }

  /**
   * 获取 Java/TypeScript 类型
   */
  private getJavaType(columnType: string): string {
    return TYPE_MAPPING[columnType.toLowerCase()] || GenConstants.TYPE_STRING;
  }

  /**
   * 获取 HTML 控件类型
   */
  private getHtmlType(columnType: string): string {
    return HTML_TYPE_MAPPING[columnType.toLowerCase()] || GenConstants.HTML_INPUT;
  }

  /**
   * 是否为文本类型
   */
  private isTextType(dataType: string): boolean {
    return GenConstants.COLUMNTYPE_TEXT.includes(dataType.toLowerCase());
  }

  /**
   * 是否为字符串类型
   */
  private isStringType(dataType: string): boolean {
    return GenConstants.COLUMNTYPE_STR.includes(dataType.toLowerCase());
  }

  /**
   * 是否为日期时间类型
   */
  private isDateTimeType(dataType: string): boolean {
    return GenConstants.COLUMNTYPE_TIME.includes(dataType.toLowerCase());
  }

  /**
   * 是否为数字类型
   */
  private isNumberType(dataType: string): boolean {
    return GenConstants.COLUMNTYPE_NUMBER.includes(dataType.toLowerCase());
  }

  /**
   * 是否为不需要插入的列
   */
  private isNotInsertColumn(columnName: string): boolean {
    return GenConstants.COLUMNNAME_NOT_INSERT.includes(columnName.toLowerCase());
  }

  /**
   * 是否为不需要编辑的列
   */
  private isNotEditColumn(columnName: string): boolean {
    return GenConstants.COLUMNNAME_NOT_EDIT.includes(columnName.toLowerCase());
  }

  /**
   * 是否为不需要列表显示的列
   */
  private isNotListColumn(columnName: string): boolean {
    return GenConstants.COLUMNNAME_NOT_LIST.includes(columnName.toLowerCase());
  }

  /**
   * 是否为不需要查询的列
   */
  private isNotQueryColumn(columnName: string): boolean {
    return GenConstants.COLUMNNAME_NOT_QUERY.includes(columnName.toLowerCase());
  }

  /**
   * 同步表结构
   * 比较数据库 schema 与存储的 GenTableColumn 记录
   * @param tableName 表名
   * @param existingColumns 已存储的列配置
   * @param tableId 表ID
   * @param createBy 操作人
   * @returns 同步结果：新增列、更新列、删除列ID
   */
  async syncTableStructure(
    tableName: string,
    existingColumns: GenTableColumn[],
    tableId: number,
    createBy: string = 'admin',
  ): Promise<{
    newColumns: Partial<GenTableColumn>[];
    updateColumns: Partial<GenTableColumn>[];
    deleteColumnIds: number[];
  }> {
    // 获取当前数据库中的列信息
    const dbColumns = await this.getTableColumns(tableName);

    if (!dbColumns || dbColumns.length === 0) {
      throw new Error(`表 ${tableName} 不存在或没有列`);
    }

    // 构建已存储列的映射
    const existingColumnMap = new Map<string, GenTableColumn>();
    for (const col of existingColumns) {
      existingColumnMap.set(col.columnName, col);
    }

    // 构建数据库列的映射
    const dbColumnMap = new Map<string, DbColumnRow>();
    for (const col of dbColumns) {
      dbColumnMap.set(col.columnName, col);
    }

    const newColumns: Partial<GenTableColumn>[] = [];
    const updateColumns: Partial<GenTableColumn>[] = [];
    const deleteColumnIds: number[] = [];

    // 检查新增和更新的列
    for (const dbCol of dbColumns) {
      const existingCol = existingColumnMap.get(dbCol.columnName);

      if (existingCol) {
        // 列已存在，检查是否需要更新
        const needsUpdate =
          existingCol.columnType !== dbCol.columnType ||
          existingCol.isPk !== dbCol.isPk ||
          existingCol.isIncrement !== dbCol.isIncrement;

        if (needsUpdate) {
          // 保留自定义配置，只更新数据库相关字段
          updateColumns.push({
            columnId: existingCol.columnId,
            columnType: dbCol.columnType,
            isPk: dbCol.isPk,
            isIncrement: dbCol.isIncrement,
            javaType: this.getJavaTypePublic(dbCol.columnType),
            sort: Number(dbCol.sort),
            updateBy: createBy,
            updateTime: new Date(),
            // 保留以下自定义配置
            columnComment: existingCol.columnComment,
            javaField: existingCol.javaField,
            isInsert: existingCol.isInsert,
            isEdit: existingCol.isEdit,
            isList: existingCol.isList,
            isQuery: existingCol.isQuery,
            queryType: existingCol.queryType,
            htmlType: existingCol.htmlType,
            dictType: existingCol.dictType,
          });
        }
      } else {
        // 新列，初始化配置
        const newCol = this.initColumnConfig(dbCol, tableId, createBy);
        newColumns.push(newCol);
      }
    }

    // 检查删除的列
    for (const existingCol of existingColumns) {
      if (!dbColumnMap.has(existingCol.columnName)) {
        deleteColumnIds.push(existingCol.columnId);
      }
    }

    return {
      newColumns,
      updateColumns,
      deleteColumnIds,
    };
  }

  /**
   * 获取 Java/TypeScript 类型（公开方法）
   */
  getJavaTypePublic(columnType: string): string {
    return TYPE_MAPPING[columnType.toLowerCase()] || GenConstants.TYPE_STRING;
  }
}
