/**
 * 代码生成核心服务
 * 负责代码生成、预览、下载等核心功能
 */
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { GenTableColumn, Prisma } from '@prisma/client';
import { DatabaseIntrospectorService } from './database-introspector.service';
import { TemplateEngineService } from './template-engine.service';
import {
  GeneratedFile,
  GenOptions,
  GenTableWithColumns,
} from '../interfaces';
import { BusinessException } from 'src/common/exceptions';
import { ResponseCode, Result } from 'src/common/response';
import { StatusEnum, DelFlagEnum } from 'src/common/enum';
import { StringUtils } from '../../utils';
import toolConfig from '../../config';
import archiver from 'archiver';
import * as fs from 'fs-extra';
import * as path from 'path';
import { Response } from 'express';
import { Transactional } from 'src/common/decorators/transactional.decorator';

@Injectable()
export class CodeGeneratorService {
  private readonly logger = new Logger(CodeGeneratorService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly introspector: DatabaseIntrospectorService,
    private readonly templateEngine: TemplateEngineService,
  ) {}

  /**
   * 查询已导入的表列表
   */
  async findAll(query: {
    tableName?: string;
    tableComment?: string;
    pageNum?: number;
    pageSize?: number;
  }) {
    const where: Prisma.GenTableWhereInput = {
      delFlag: DelFlagEnum.NORMAL,
    };

    if (query.tableName) {
      where.tableName = { contains: query.tableName };
    }
    if (query.tableComment) {
      where.tableComment = { contains: query.tableComment };
    }

    const pageSize = Number(query.pageSize ?? 10);
    const pageNum = Number(query.pageNum ?? 1);

    const [list, total] = await this.prisma.$transaction([
      this.prisma.genTable.findMany({
        where,
        skip: pageSize * (pageNum - 1),
        take: pageSize,
        orderBy: { tableId: 'desc' },
      }),
      this.prisma.genTable.count({ where }),
    ]);

    return Result.ok({ rows: list, total });
  }

  /**
   * 查询表详情（含字段信息）
   */
  async findOne(tableId: number): Promise<GenTableWithColumns | null> {
    const table = await this.prisma.genTable.findFirst({
      where: { tableId, delFlag: DelFlagEnum.NORMAL },
    });

    if (!table) {
      return null;
    }

    const columns = await this.prisma.genTableColumn.findMany({
      where: { tableId, delFlag: DelFlagEnum.NORMAL },
      orderBy: { sort: 'asc' },
    });

    return { ...table, columns };
  }

  /**
   * 根据表名查询表详情
   */
  async findOneByTableName(tableName: string): Promise<GenTableWithColumns | null> {
    const table = await this.prisma.genTable.findFirst({
      where: { tableName, delFlag: DelFlagEnum.NORMAL },
    });

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
   * 导入表
   */
  @Transactional()
  async importTable(tableNames: string[], userName: string = 'admin') {
    const tableList = await this.introspector.getTablesByNames(tableNames);

    if (!tableList.length) {
      throw new BusinessException(ResponseCode.BUSINESS_ERROR, '未找到要导入的表');
    }

    for (const meta of tableList) {
      const tableName = meta.tableName;
      const now = new Date();

      // 创建表配置
      const tableData: Prisma.GenTableCreateInput = {
        tableName,
        tableComment: meta.tableComment?.trim() || tableName,
        className: toolConfig.autoRemovePre
          ? StringUtils.toPascalCase(
              tableName.replace(new RegExp(toolConfig.tablePrefix.join('|')), ''),
            )
          : StringUtils.toPascalCase(tableName),
        packageName: toolConfig.packageName,
        moduleName: toolConfig.moduleName,
        businessName: tableName.slice(tableName.lastIndexOf('_') + 1),
        functionName: meta.tableComment?.trim() || tableName,
        functionAuthor: toolConfig.author,
        createBy: userName,
        createTime: now,
        updateBy: userName,
        updateTime: now,
        genType: 'ZIP',
        genPath: '/',
        options: '{}',
        status: StatusEnum.NORMAL,
        delFlag: DelFlagEnum.NORMAL,
        tplCategory: 'crud',
        tplWebType: 'element-plus',
      };

      const tableInfo = await this.prisma.genTable.create({ data: tableData });

      // 获取并初始化列配置
      const dbColumns = await this.introspector.getTableColumns(tableName);
      for (const column of dbColumns) {
        const columnConfig = this.introspector.initColumnConfig(column, tableInfo.tableId, userName);
        await this.prisma.genTableColumn.create({
          data: columnConfig as Prisma.GenTableColumnUncheckedCreateInput,
        });
      }
    }

    return Result.ok('导入成功');
  }

  /**
   * 更新表配置
   */
  @Transactional()
  async update(data: {
    tableId: number;
    tableName?: string;
    tableComment?: string;
    className?: string;
    packageName?: string;
    moduleName?: string;
    businessName?: string;
    functionName?: string;
    functionAuthor?: string;
    tplCategory?: string;
    tplWebType?: string;
    genType?: string;
    genPath?: string;
    options?: string;
    subTableName?: string;
    subTableFkName?: string;
    columns?: Partial<GenTableColumn>[];
  }) {
    const { columns, tableId, ...tableData } = data;

    // 更新表配置
    await this.prisma.genTable.update({
      where: { tableId },
      data: tableData as Prisma.GenTableUpdateInput,
    });

    // 更新列配置
    if (columns && columns.length > 0) {
      for (const column of columns) {
        if (column.columnId) {
          await this.prisma.genTableColumn.update({
            where: { columnId: column.columnId },
            data: column as Prisma.GenTableColumnUpdateInput,
          });
        }
      }
    }

    return Result.ok('更新成功');
  }

  /**
   * 删除表配置
   */
  @Transactional()
  async remove(tableIds: number[]) {
    // 删除列配置
    await this.prisma.genTableColumn.deleteMany({
      where: { tableId: { in: tableIds } },
    });

    // 删除表配置
    await this.prisma.genTable.deleteMany({
      where: { tableId: { in: tableIds } },
    });

    return Result.ok('删除成功');
  }

  /**
   * 同步表结构
   */
  @Transactional()
  async syncTable(tableId: number, userName: string = 'admin') {
    const table = await this.findOne(tableId);
    if (!table) {
      throw new BusinessException(ResponseCode.BUSINESS_ERROR, '表不存在');
    }

    const { newColumns, updateColumns, deleteColumnIds } =
      await this.introspector.syncTableStructure(
        table.tableName,
        table.columns,
        tableId,
        userName,
      );

    // 新增列
    for (const col of newColumns) {
      await this.prisma.genTableColumn.create({
        data: col as Prisma.GenTableColumnUncheckedCreateInput,
      });
    }

    // 更新列
    for (const col of updateColumns) {
      if (col.columnId) {
        await this.prisma.genTableColumn.update({
          where: { columnId: col.columnId },
          data: col as Prisma.GenTableColumnUpdateInput,
        });
      }
    }

    // 删除列
    if (deleteColumnIds.length > 0) {
      await this.prisma.genTableColumn.deleteMany({
        where: { columnId: { in: deleteColumnIds } },
      });
    }

    return Result.ok({
      added: newColumns.length,
      updated: updateColumns.length,
      deleted: deleteColumnIds.length,
    });
  }

  /**
   * 预览代码
   */
  async preview(tableId: number): Promise<Record<string, string>> {
    const table = await this.findOne(tableId);
    if (!table) {
      throw new BusinessException(ResponseCode.BUSINESS_ERROR, '表不存在');
    }

    const options = this.parseOptions(table.options);
    const files = await this.templateEngine.renderAll(table, table.columns, options);

    const result: Record<string, string> = {};
    for (const file of files) {
      result[file.filePath] = file.content;
    }

    return result;
  }

  /**
   * 生成代码
   */
  async generate(tableId: number): Promise<GeneratedFile[]> {
    const table = await this.findOne(tableId);
    if (!table) {
      throw new BusinessException(ResponseCode.BUSINESS_ERROR, '表不存在');
    }

    const options = this.parseOptions(table.options);

    // 如果是主子表，获取子表信息并合并到 options
    if (table.tplCategory === 'sub' && table.subTableName) {
      const subTable = await this.findOneByTableName(table.subTableName);
      if (subTable) {
        // 将子表信息传递给模板引擎
        (options as any).subTable = subTable;
        (options as any).subTableFkName = table.subTableFkName;
      }
    }

    return this.templateEngine.renderAll(table, table.columns, options);
  }

  /**
   * 批量生成代码并打包下载
   */
  async batchGenCode(tableNames: string[], res: Response) {
    const zipFilePath = path.join(__dirname, `temp_${Date.now()}.zip`);
    const output = fs.createWriteStream(zipFilePath);
    const archive = archiver('zip', { zlib: { level: 9 } });

    output.on('close', async () => {
      res.download(zipFilePath, 'code.zip', async (err) => {
        if (!err) {
          await fs.remove(zipFilePath);
        } else {
          this.logger.error('下载文件失败', err);
          res.status(500).send('下载文件失败');
        }
      });
    });

    archive.on('error', (err) => {
      this.logger.error('打包失败', err);
      throw err;
    });

    archive.pipe(output);

    for (const tableName of tableNames) {
      const table = await this.findOneByTableName(tableName);
      if (!table) {
        this.logger.warn(`表 ${tableName} 不存在，跳过`);
        continue;
      }

      const files = await this.generate(table.tableId);

      for (const file of files) {
        archive.append(Buffer.from(file.content), {
          name: `${tableName}/${file.filePath}`,
        });
      }
    }

    await archive.finalize();
  }

  /**
   * 生成代码到指定路径
   */
  async genCodeToPath(tableName: string, genPath?: string) {
    const table = await this.findOneByTableName(tableName);
    if (!table) {
      throw new BusinessException(ResponseCode.BUSINESS_ERROR, '表不存在');
    }

    const files = await this.generate(table.tableId);
    const basePath = genPath || table.genPath || process.cwd();

    const results: { path: string; success: boolean; error?: string }[] = [];

    for (const file of files) {
      const fullPath = path.join(basePath, file.filePath);

      try {
        // 确保目录存在
        await fs.ensureDir(path.dirname(fullPath));

        // 检查文件是否存在
        const exists = await fs.pathExists(fullPath);
        if (exists) {
          results.push({
            path: fullPath,
            success: false,
            error: '文件已存在',
          });
          continue;
        }

        // 写入文件
        await fs.writeFile(fullPath, file.content, 'utf-8');
        results.push({ path: fullPath, success: true });
      } catch (error) {
        results.push({
          path: fullPath,
          success: false,
          error: error instanceof Error ? error.message : '写入失败',
        });
      }
    }

    return Result.ok(results);
  }

  /**
   * 获取主键字段
   */
  getPrimaryKey(columns: GenTableColumn[]): string | null {
    const pkColumn = columns.find((col) => col.isPk === 'YES');
    return pkColumn?.javaField || null;
  }

  /**
   * 解析配置选项
   */
  private parseOptions(optionsStr: string | null): GenOptions {
    if (!optionsStr) {
      return {};
    }

    try {
      return JSON.parse(optionsStr);
    } catch {
      return {};
    }
  }
}
