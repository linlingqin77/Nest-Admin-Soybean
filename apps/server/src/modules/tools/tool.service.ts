import { Injectable } from '@nestjs/common';
import { BusinessException } from 'src/shared/exceptions';
import { ResponseCode } from 'src/shared/response';
import { DelFlagEnum, StatusEnum } from 'src/shared/enums/index';
import { isNotEmpty } from 'class-validator';
import { ImportTablesDto as TableName, ListDbTableRequestDto as GenDbTableList, ListGenTableRequestDto as GenTableList, UpdateGenTableDto as GenTableUpdate } from './dto';
import { Result } from 'src/shared/response';
import { GetNowDate } from 'src/shared/utils/index';
import { toDtoList, toDtoPage } from 'src/shared/utils/serialize.util';
import { GenTableResponseDto, DbTableResponseDto } from './dto/responses';
import toolConfig from './config';
import { GenConstants } from 'src/shared/constants/gen.constant';
import { camelCase, toLower } from 'lodash';
import { arraysContains, getColumnLength, StringUtils, capitalize } from './utils/index';
import { index as templateIndex, TemplateOptions } from './template/index';
import archiver from 'archiver';
import * as fs from 'fs-extra';
import * as path from 'path';
import { UserDto } from 'src/modules/users/user.decorator';
import { InjectTransactionHost, Transactional, PrismaTransactionHost } from 'src/core/http/decorators/transactional.decorator';
import { Prisma, GenTable, GenTableColumn } from '@prisma/client';
import { Response } from 'express';
import { PreviewService } from './preview/preview.service';

type DbTableRow = {
  tableName: string;
  tableComment: string | null;
  createTime: Date | null;
  updateTime: Date | null;
};

type DbColumnRow = Partial<GenTableColumn> & {
  columnName: string;
  isRequired: string;
  isPk: string;
  sort: number;
  columnComment: string | null;
  columnDefault: string | null;
  isIncrement: string;
  columnType: string;
};

type GenTableWithColumns = GenTable & { columns: GenTableColumn[] };

@Injectable()
export class ToolService {
  constructor(
    @InjectTransactionHost() private readonly txHost: PrismaTransactionHost,
    private readonly previewService: PreviewService,
  ) {}

  private get prisma() {
    return this.txHost.tx;
  }

  private async fetchTableDetail(where: Prisma.GenTableWhereInput): Promise<GenTableWithColumns | null> {
    const criteria: Prisma.GenTableWhereInput = { delFlag: '0', ...where };
    const table = await this.prisma.genTable.findFirst({ where: criteria });
    if (!table) {
      return null;
    }
    const columns = await this.prisma.genTableColumn.findMany({
      where: { tableId: table.tableId, delFlag: '0' },
      orderBy: { sort: 'asc' },
    });
    return { ...table, columns };
  }

  private mapColumnPayload(column: DbColumnRow): Prisma.GenTableColumnUncheckedCreateInput {
    return {
      tableId: column.tableId!,
      columnName: column.columnName,
      columnComment: column.columnComment || column.columnName,
      columnType: column.columnType,
      javaType: column.javaType!,
      javaField: column.javaField!,
      isPk: column.isPk,
      isIncrement: column.isIncrement,
      isRequired: column.isRequired,
      isInsert: column.isInsert ?? GenConstants.NOT_REQUIRE,
      isEdit: column.isEdit ?? GenConstants.NOT_REQUIRE,
      isList: column.isList ?? GenConstants.NOT_REQUIRE,
      isQuery: column.isQuery ?? GenConstants.NOT_REQUIRE,
      queryType: column.queryType ?? GenConstants.QUERY_EQ,
      htmlType: column.htmlType ?? GenConstants.HTML_INPUT,
      dictType: column.dictType ?? '',
      columnDefault: column.columnDefault,
      sort: Number(column.sort),
      status: column.status ?? '0',
      delFlag: column.delFlag ?? '0',
      createBy: column.createBy ?? 'admin',
      createTime: column.createTime ?? new Date(),
      updateBy: column.updateBy ?? 'admin',
      updateTime: column.updateTime ?? new Date(),
      remark: column.remark ?? null,
    };
  }
  /**
   * 查询生成表数据
   * @param query
   * @returns
   */
  async findAll(query: GenTableList) {
    const where: Prisma.GenTableWhereInput = {
      delFlag: '0',
    };
    if (query.tableName) {
      where.tableName = { contains: query.tableName };
    }
    if (query.tableComment) {
      where.tableComment = { contains: query.tableComment };
    }
    const [list, total] = await this.prisma.$transaction([
      this.prisma.genTable.findMany({
        where,
        skip: query.skip,
        take: query.take,
        orderBy: { tableId: 'desc' },
      }),
      this.prisma.genTable.count({ where }),
    ]);
    return Result.page(toDtoList(GenTableResponseDto, list), total, query.pageNum, query.pageSize);
  }

  /**
   * 导入表
   * @param table
   * @param req
   * @returns
   */
  async importTable(table: TableName, user: UserDto) {
    const tableNames = table.tableNames.split(',').filter((item) => item);
    const tableList = await this.selectDbTableListByNames(tableNames);

    for (const meta of tableList) {
      const tableName = meta.tableName;
      const now = new Date();
      const tableData: Prisma.GenTableCreateInput = {
        tableName,
        tableComment: meta.tableComment?.trim() || tableName,
        className: toolConfig.autoRemovePre
          ? StringUtils.toPascalCase(tableName.replace(new RegExp(toolConfig.tablePrefix.join('|')), ''))
          : StringUtils.toPascalCase(tableName),
        packageName: toolConfig.packageName,
        moduleName: toolConfig.moduleName,
        businessName: tableName.slice(tableName.lastIndexOf('_') + 1),
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
        delFlag: '0',
        tplCategory: 'crud',
        tplWebType: 'element-plus',
      };
      const tableInfo = await this.prisma.genTable.create({ data: tableData });

      const tableColumn: DbColumnRow[] = await this.getTableColumnInfo(tableName);
      for (const column of tableColumn) {
        this.initTableColumn(column, tableInfo);
        column.sort = Number(column.sort);
        await this.prisma.genTableColumn.create({ data: this.mapColumnPayload(column) });
      }
    }
    return Result.ok('添加成功');
  }

  /**
   * 同步数据库,  我们导入了需要生成代码的数据表，但是我们更改了数据库的结构（比如删除了一些字段，和添加了一些字段），同步更新表数据
   * @param table
   */
  async synchDb(tableName: string) {
    const table = await this.findOneByTableName(tableName);
    if (!table) throw new BusinessException(ResponseCode.BUSINESS_ERROR, '同步数据失败，原表结构不存在！');
    const tableColumns = table.columns ?? [];
    //更改后的数据库表的列信息
    const columns: DbColumnRow[] = await this.getTableColumnInfo(tableName);

    if (!columns || !columns?.length)
      throw new BusinessException(ResponseCode.BUSINESS_ERROR, '同步数据失败，原表结构不存在！');
    //存储之前就存在已生成的列信息
    const tableColumnMap: Record<string, GenTableColumn> = {};
    for (const v of tableColumns) {
      tableColumnMap[v.columnName] = v;
    }

    //更新或插入列
    for (const column of columns) {
      //初始化column的值
      this.initTableColumn(column, table);
      //如果之前存储过，更新
      if (tableColumnMap[column.columnName]) {
        //之前存储的列
        const prevColumn = tableColumnMap[column.columnName];
        column.columnId = prevColumn.columnId;
        column.sort = Number(column.sort);
        if (column.isList === '1') {
          // 如果是列表，继续保留查询方式/字典类型选项
          column.dictType = prevColumn.dictType;
          column.queryType = prevColumn.queryType;
        }
        await this.prisma.genTableColumn.update({
          where: { columnId: column.columnId },
          data: this.mapColumnPayload(column),
        });
      }
      //插入
      else {
        column.sort = Number(column.sort);
        await this.prisma.genTableColumn.create({ data: this.mapColumnPayload(column) });
      }
    }
    //删除已经不存在表中数据
    if (tableColumns.length > 0) {
      const delColumns = tableColumns
        .filter((v) => !columns.some((z) => z.columnName === v.columnName))
        .map((v) => v.columnId);
      if (delColumns.length > 0) {
        await this.prisma.genTableColumn.deleteMany({ where: { columnId: { in: delColumns } } });
      }
    }
    return Result.ok();
  }

  /**
   * 根据表名批量获取表的基本信息（包含注释）
   * @param tableNames
   * @returns
   */
  private async selectDbTableListByNames(tableNames: string[]) {
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
   * 根据表名获取表的字段信息以及注释
   * @param tableName
   * @returns
   */
  private async getTableColumnInfo(tableName: string) {
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
        CASE WHEN c.is_nullable = 'NO' AND c.column_default IS NULL THEN '1' ELSE '0' END AS "isRequired",
        CASE WHEN c.column_name IN (SELECT column_name FROM pk_columns) THEN '1' ELSE '0' END AS "isPk",
        c.ordinal_position AS "sort",
        COALESCE(col_description((quote_ident(c.table_schema) || '.' || quote_ident(c.table_name))::regclass, c.ordinal_position)::text, c.column_name) AS "columnComment",
        c.column_default AS "columnDefault",
        CASE WHEN c.is_identity = 'YES' OR c.column_default LIKE 'nextval%' THEN '1' ELSE '0' END AS "isIncrement",
        c.data_type AS "columnType"
      FROM information_schema.columns c
      WHERE c.table_schema = current_schema()
        AND c.table_name = ${tableName}
      ORDER BY c.ordinal_position
    `);
  }

  /**
   * 根据id查询表详细信息
   * @param id
   * @returns
   */
  async findOne(id: number) {
    const info = await this.fetchTableDetail({ tableId: id });
    return Result.ok({ info });
  }

  /**
   * 根据表名查询表详细信息
   * @param tableName
   * @returns
   */
  async findOneByTableName(tableName: string): Promise<GenTableWithColumns> {
    const data = await this.fetchTableDetail({ tableName });
    if (!data) {
      throw new BusinessException(ResponseCode.BUSINESS_ERROR, '表不存在');
    }
    return data;
  }

  /**
   * 修改代码生成信息
   * @param genTableUpdate
   * @returns
   */
  async genUpdate(genTableUpdate: GenTableUpdate) {
    for (const item of genTableUpdate.columns ?? []) {
      if (item.columnId) {
        await this.prisma.genTableColumn.update({ where: { columnId: item.columnId }, data: item });
      }
    }
    const { columns, ...tableData } = genTableUpdate;
    // delFlag 过滤作为防御层，避免误更新已软删除的记录
    await this.prisma.genTable.updateMany({
      where: { tableId: +genTableUpdate.tableId, delFlag: '0' },
      data: tableData,
    });
    return Result.ok({ genTableUpdate });
  }

  /**
   * 删除表
   * @param id
   * @returns
   */
  @Transactional()
  async remove(id: number) {
    await this.prisma.genTableColumn.deleteMany({ where: { tableId: id } });
    await this.prisma.genTable.delete({ where: { tableId: id } });
    return Result.ok();
  }

  /**
   * 生成代码压缩包
   * @param table 表名参数
   * @param res HTTP 响应对象
   * @param projectName 项目名称（可选，默认为 'code'）
   */
  async batchGenCode(table: TableName, res: Response, projectName: string = 'code') {
    // 生成带时间戳的文件名: {projectName}_{timestamp}.zip
    const timestamp = new Date()
      .toISOString()
      .replace(/[-:T.Z]/g, '')
      .slice(0, 14);
    const zipFileName = `${projectName}_${timestamp}.zip`;
    const zipFilePath = path.posix.join(__dirname, zipFileName);

    const output = fs.createWriteStream(zipFilePath);
    const archive = archiver('zip', {
      zlib: { level: 9 },
    });

    output.on('close', async () => {
      res.download(zipFilePath, zipFileName, async (err) => {
        if (!err) {
          await fs.remove(zipFilePath);
        } else {
          res.status(500).send('Error downloading file');
        }
      });
    });

    archive.on('error', (err) => {
      throw new BusinessException(ResponseCode.BUSINESS_ERROR, `ZIP 文件创建失败: ${err.message}`);
    });

    const tableNamesList = table.tableNames.split(',').filter((name) => name.trim());

    if (tableNamesList.length === 0) {
      throw new BusinessException(ResponseCode.PARAM_INVALID, '请选择至少一个表进行代码生成');
    }

    // 批量获取表信息
    const tableList = await Promise.all(
      tableNamesList.map(async (tableName) => {
        const data = await this.fetchTableDetail({ tableName: tableName.trim() });
        if (!data) {
          throw new BusinessException(ResponseCode.BUSINESS_ERROR, `表 ${tableName} 不存在`);
        }
        const primaryKey = await this.getPrimaryKey(data.columns);
        return {
          primaryKey,
          BusinessName: capitalize(data.businessName),
          ...data,
          columns: data.columns,
        };
      }),
    );

    archive.pipe(output);

    // 为每个表生成代码
    for (const item of tableList) {
      const templateOutput = templateIndex(item as unknown as TemplateOptions);

      // 使用 PreviewService 获取文件列表
      const previewResponse = this.previewService.createPreviewResponse(templateOutput, item.BusinessName);

      // 将所有文件添加到 ZIP 归档
      for (const file of previewResponse.files) {
        if (!file.content) {
          throw new BusinessException(ResponseCode.DATA_NOT_FOUND, `模板 ${file.name} 生成失败，内容为空`);
        }
        // 使用 UTF-8 编码
        archive.append(Buffer.from(file.content, 'utf-8'), { name: file.path });
      }
    }

    await archive.finalize();
  }

  /**
   * 批量生成代码（通过表ID列表）
   * @param tableIds 表ID列表
   * @param res HTTP 响应对象
   * @param projectName 项目名称（可选）
   */
  async batchGenCodeByIds(tableIds: number[], res: Response, projectName: string = 'code') {
    if (!tableIds || tableIds.length === 0) {
      throw new BusinessException(ResponseCode.PARAM_INVALID, '请选择至少一个表进行代码生成');
    }

    // 生成带时间戳的文件名
    const timestamp = new Date()
      .toISOString()
      .replace(/[-:T.Z]/g, '')
      .slice(0, 14);
    const zipFileName = `${projectName}_${timestamp}.zip`;
    const zipFilePath = path.posix.join(__dirname, zipFileName);

    const output = fs.createWriteStream(zipFilePath);
    const archive = archiver('zip', {
      zlib: { level: 9 },
    });

    output.on('close', async () => {
      res.download(zipFilePath, zipFileName, async (err) => {
        if (!err) {
          await fs.remove(zipFilePath);
        } else {
          res.status(500).send('Error downloading file');
        }
      });
    });

    archive.on('error', (err) => {
      throw new BusinessException(ResponseCode.BUSINESS_ERROR, `ZIP 文件创建失败: ${err.message}`);
    });

    // 批量获取表信息
    const tableList = await Promise.all(
      tableIds.map(async (tableId) => {
        const data = await this.fetchTableDetail({ tableId });
        if (!data) {
          throw new BusinessException(ResponseCode.BUSINESS_ERROR, `表ID ${tableId} 不存在`);
        }
        const primaryKey = await this.getPrimaryKey(data.columns);
        return {
          primaryKey,
          BusinessName: capitalize(data.businessName),
          ...data,
          columns: data.columns,
        };
      }),
    );

    archive.pipe(output);

    // 为每个表生成代码
    for (const item of tableList) {
      const templateOutput = templateIndex(item as unknown as TemplateOptions);

      // 使用 PreviewService 获取文件列表
      const previewResponse = this.previewService.createPreviewResponse(templateOutput, item.BusinessName);

      // 将所有文件添加到 ZIP 归档
      for (const file of previewResponse.files) {
        if (!file.content) {
          throw new BusinessException(ResponseCode.DATA_NOT_FOUND, `模板 ${file.name} 生成失败，内容为空`);
        }
        // 使用 UTF-8 编码
        archive.append(Buffer.from(file.content, 'utf-8'), { name: file.path });
      }
    }

    await archive.finalize();
  }
  /**
   *
   * 查询主键id
   */
  async getPrimaryKey(columns: GenTableColumn[]) {
    for (const column of columns) {
      if (column.isPk === '1') {
        return column.javaField;
      }
    }
    return null;
  }

  /**
   * 预览生成代码
   * @param id
   * @returns 包含文件列表、文件树、统计信息的预览响应
   */
  async preview(id: number) {
    const data = await this.fetchTableDetail({ tableId: id });
    if (!data) {
      throw new BusinessException(ResponseCode.BUSINESS_ERROR, '表不存在');
    }
    const primaryKey = await this.getPrimaryKey(data.columns);
    const info = { primaryKey, BusinessName: capitalize(data.businessName), ...data, columns: data.columns };
    const templateOutput = templateIndex(info as unknown as TemplateOptions);

    // 使用 PreviewService 创建完整的预览响应
    const previewResponse = this.previewService.createPreviewResponse(templateOutput, capitalize(data.businessName));

    return Result.ok(previewResponse);
  }
  /**
   * 查询db数据库列表
   * @returns
   */
  async genDbList(q: GenDbTableList) {
    let filterClause = Prisma.sql``;
    if (isNotEmpty(q.tableName)) {
      filterClause = Prisma.sql`${filterClause} AND t.table_name ILIKE ${`%${q.tableName}%`}`;
    }
    if (isNotEmpty(q.tableComment)) {
      filterClause = Prisma.sql`${filterClause} AND obj_description((quote_ident(t.table_schema) || '.' || quote_ident(t.table_name))::regclass) ILIKE ${`%${q.tableComment}%`}`;
    }
    const baseSql = Prisma.sql`
      FROM information_schema.tables t
      WHERE t.table_schema = current_schema()
        AND t.table_type = 'BASE TABLE'
        AND t.table_name NOT LIKE 'qrtz_%'
        AND t.table_name NOT LIKE 'gen_%'
        AND NOT EXISTS (SELECT 1 FROM gen_table gt WHERE gt.table_name = t.table_name AND gt.del_flag = '0')
        ${filterClause}
    `;
    const listSql = Prisma.sql`
      SELECT
        t.table_name AS "tableName",
        obj_description((quote_ident(t.table_schema) || '.' || quote_ident(t.table_name))::regclass) AS "tableComment",
        NOW() AS "createTime",
        NOW() AS "updateTime"
      ${baseSql}
      ORDER BY t.table_name DESC
      OFFSET ${q.skip}
      LIMIT ${q.take}
    `;
    const countSql = Prisma.sql`
      SELECT COUNT(*)::bigint AS total
      ${baseSql}
    `;
    const [list, totalRes] = await Promise.all([
      this.prisma.$queryRaw<DbTableRow[]>(listSql),
      this.prisma.$queryRaw<Array<{ total: bigint }>>(countSql),
    ]);
    return Result.ok({
      list: toDtoList(DbTableResponseDto, list),
      total: Number(totalRes[0]?.total ?? 0),
    });
  }

  /**
   * 获取数据源名称列表
   * @returns
   */
  async getDataNames() {
    // 目前只支持单数据源，返回默认数据源名称
    return Result.ok(['master']);
  }

  /**
   * 初始化表列的字段信息
   * @param column
   * @param table
   */
  initTableColumn(column: DbColumnRow, table: Pick<GenTable, 'tableId'>) {
    const columnName = column.columnName;
    const dataType = column.columnType;
    column.tableId = table.tableId;
    column.javaField = camelCase(columnName);
    column.javaType = GenConstants.TYPE_STRING;
    column.queryType = GenConstants.QUERY_EQ;
    column.createBy = column.createBy || 'admin';
    column.columnComment = column.columnComment || column.columnName;
    column.createTime = column.createTime || new Date();
    column.updateBy = 'admin';
    column.updateTime = new Date();
    column.status = column.status || StatusEnum.NORMAL;
    column.delFlag = column.delFlag || DelFlagEnum.NORMAL;
    column.dictType = column.dictType || '';
    column.isInsert = column.isInsert ?? GenConstants.NOT_REQUIRE;
    column.isEdit = column.isEdit ?? GenConstants.NOT_REQUIRE;
    column.isList = column.isList ?? GenConstants.NOT_REQUIRE;
    column.isQuery = column.isQuery ?? GenConstants.NOT_REQUIRE;
    column.htmlType = column.htmlType || GenConstants.HTML_INPUT;
    if (arraysContains(GenConstants.COLUMNTYPE_TEXT, dataType)) {
      column.htmlType = GenConstants.HTML_TEXTAREA;
    } else if (arraysContains(GenConstants.COLUMNTYPE_STR, dataType)) {
      const len = getColumnLength(dataType);
      column.htmlType = len >= 500 ? GenConstants.HTML_TEXTAREA : GenConstants.HTML_INPUT;
    } else if (arraysContains(GenConstants.COLUMNTYPE_TIME, dataType)) {
      column.javaType = GenConstants.TYPE_DATE;
      column.htmlType = GenConstants.HTML_DATETIME;
    } else if (arraysContains(GenConstants.COLUMNTYPE_NUMBER, dataType)) {
      column.htmlType = GenConstants.HTML_INPUT;
      column.javaType = GenConstants.TYPE_NUMBER;
    }

    column.isRequired = GenConstants.NOT_REQUIRE;

    // 插入字段
    if (!arraysContains(GenConstants.COLUMNNAME_NOT_INSERT, columnName)) {
      column.isInsert = GenConstants.REQUIRE;
    }

    // 编辑字段
    if (!arraysContains(GenConstants.COLUMNNAME_NOT_EDIT, columnName)) {
      column.isEdit = GenConstants.REQUIRE;
    }
    // 列表字段
    if (!arraysContains(GenConstants.COLUMNNAME_NOT_LIST, columnName)) {
      column.isList = GenConstants.REQUIRE;
    }
    // 查询字段
    if (
      !arraysContains(GenConstants.COLUMNNAME_NOT_QUERY, columnName) &&
      column.htmlType != GenConstants.HTML_TEXTAREA
    ) {
      column.isQuery = GenConstants.REQUIRE;
    }

    // 主键字段
    if (column.isPk == '1') {
      column.isInsert = GenConstants.NOT_REQUIRE;
      column.isEdit = GenConstants.REQUIRE;
      column.isQuery = GenConstants.REQUIRE;
      column.isList = GenConstants.REQUIRE;
    }

    const lowerColumnName = toLower(columnName);
    // 查询字段类型
    if (lowerColumnName.includes('name')) {
      column.queryType = GenConstants.QUERY_LIKE;
    }
    // 状态字段设置单选框
    if (lowerColumnName.includes('status')) {
      column.htmlType = GenConstants.HTML_RADIO;
    }
    // 类型&性别字段设置下拉框
    else if (lowerColumnName.includes('type') || lowerColumnName.includes('sex')) {
      column.htmlType = GenConstants.HTML_SELECT;
    }
    //日期字段设置日期控件
    else if (
      lowerColumnName.includes('time') ||
      lowerColumnName.includes('_date') ||
      lowerColumnName.includes('Date')
    ) {
      column.htmlType = GenConstants.HTML_DATETIME;
      column.queryType = GenConstants.QUERY_BETWEEN;
    }
    // 图片字段设置图片上传控件
    else if (lowerColumnName.includes('image')) {
      column.htmlType = GenConstants.HTML_IMAGE_UPLOAD;
    }
    // 文件字段设置文件上传控件
    else if (lowerColumnName.includes('file')) {
      column.htmlType = GenConstants.HTML_FILE_UPLOAD;
    }
    // 内容字段设置富文本控件
    else if (lowerColumnName.includes('content')) {
      column.htmlType = GenConstants.HTML_EDITOR;
    }
  }
}
