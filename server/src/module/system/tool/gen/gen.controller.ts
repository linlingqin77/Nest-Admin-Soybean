/**
 * 代码生成控制器
 * 提供代码生成相关的 API 接口
 */
import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  Res,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { Response } from 'express';
import { CodeGeneratorService } from './services/code-generator.service';
import { DatabaseIntrospectorService } from './services/database-introspector.service';
import { User, UserDto } from 'src/module/system/user/user.decorator';
import { Api } from 'src/common/decorators/api.decorator';
import { Operlog } from 'src/common/decorators/operlog.decorator';
import { BusinessType } from 'src/common/constant/business.constant';
import { RequirePermission } from 'src/common/decorators/require-permission.decorator';
import { Result } from 'src/common/response';

/**
 * 查询数据库表列表 DTO
 */
class ListDbTableDto {
  tableName?: string;
  tableComment?: string;
  pageNum?: number;
  pageSize?: number;
}

/**
 * 查询已导入表列表 DTO
 */
class ListGenTableDto {
  tableName?: string;
  tableComment?: string;
  pageNum?: number;
  pageSize?: number;
}

/**
 * 导入表 DTO
 */
class ImportTableDto {
  tableNames: string;
}

/**
 * 更新表配置 DTO
 */
class UpdateGenTableDto {
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
  columns?: any[];
}

@ApiTags('代码生成')
@Controller('tool/gen')
@ApiBearerAuth('Authorization')
export class GenController {
  constructor(
    private readonly codeGenerator: CodeGeneratorService,
    private readonly introspector: DatabaseIntrospectorService,
  ) {}

  // ==================== 数据库表管理接口 ====================

  @ApiOperation({ summary: '查询数据库表列表' })
  @Api({ summary: '查询数据库表列表', description: '查询数据库中未导入的表' })
  @RequirePermission('tool:gen:list')
  @Get('db/list')
  async listDbTables(@Query() query: ListDbTableDto) {
    const list = await this.introspector.listTables(query.tableName, query.tableComment);
    return Result.ok({
      rows: list,
      total: list.length,
    });
  }

  @ApiOperation({ summary: '导入表' })
  @Api({ summary: '导入表', description: '将数据库表导入到代码生成列表' })
  @RequirePermission('tool:gen:import')
  @Operlog({ title: '代码生成', businessType: BusinessType.IMPORT })
  @Post('importTable')
  async importTable(@Body() dto: ImportTableDto, @User() user: UserDto) {
    const tableNames = dto.tableNames.split(',').filter((name) => name.trim());
    return this.codeGenerator.importTable(tableNames, user.userName);
  }

  // ==================== 配置管理接口 ====================

  @ApiOperation({ summary: '查询已导入表列表' })
  @Api({ summary: '查询已导入表列表', description: '分页查询已导入的数据表列表' })
  @RequirePermission('tool:gen:list')
  @Get('list')
  async listGenTables(@Query() query: ListGenTableDto) {
    return this.codeGenerator.findAll(query);
  }

  @ApiOperation({ summary: '查询表详情' })
  @Api({ summary: '查询表详情', description: '获取代码生成表详情，包含字段信息' })
  @RequirePermission('tool:gen:query')
  @Get(':tableId')
  async getGenTable(@Param('tableId') tableId: string) {
    const info = await this.codeGenerator.findOne(+tableId);
    return Result.ok({ info });
  }

  @ApiOperation({ summary: '修改代码生成配置' })
  @Api({ summary: '修改代码生成配置', description: '修改表的代码生成配置' })
  @RequirePermission('tool:gen:edit')
  @Operlog({ title: '代码生成', businessType: BusinessType.UPDATE })
  @Put()
  async updateGenTable(@Body() dto: UpdateGenTableDto) {
    return this.codeGenerator.update(dto);
  }

  @ApiOperation({ summary: '删除表配置' })
  @Api({ summary: '删除表配置', description: '从代码生成列表中删除表' })
  @RequirePermission('tool:gen:remove')
  @Operlog({ title: '代码生成', businessType: BusinessType.DELETE })
  @Delete(':tableIds')
  async removeGenTable(@Param('tableIds') tableIds: string) {
    const ids = tableIds.split(',').map((id) => +id);
    return this.codeGenerator.remove(ids);
  }

  // ==================== 代码生成接口 ====================

  @ApiOperation({ summary: '预览代码' })
  @Api({ summary: '预览代码', description: '在线预览生成的代码内容' })
  @RequirePermission('tool:gen:preview')
  @Get('preview/:tableId')
  async previewCode(@Param('tableId') tableId: string) {
    const code = await this.codeGenerator.preview(+tableId);
    return Result.ok(code);
  }

  @ApiOperation({ summary: '下载代码' })
  @Api({ summary: '下载代码', description: '生成代码并下载为zip压缩包' })
  @RequirePermission('tool:gen:code')
  @Operlog({ title: '代码生成', businessType: BusinessType.GENCODE })
  @Get('download/:tableName')
  async downloadCode(@Param('tableName') tableName: string, @Res() res: Response) {
    return this.codeGenerator.batchGenCode([tableName], res);
  }

  @ApiOperation({ summary: '批量生成代码' })
  @Api({ summary: '批量生成代码', description: '批量生成代码并下载为zip压缩包' })
  @RequirePermission('tool:gen:code')
  @Operlog({ title: '代码生成', businessType: BusinessType.GENCODE })
  @Get('batchGenCode')
  async batchGenCode(@Query('tables') tables: string, @Res() res: Response) {
    const tableNames = tables.split(',').filter((name) => name.trim());
    return this.codeGenerator.batchGenCode(tableNames, res);
  }

  @ApiOperation({ summary: '生成代码到路径' })
  @Api({ summary: '生成代码到路径', description: '生成代码到指定目录' })
  @RequirePermission('tool:gen:code')
  @Operlog({ title: '代码生成', businessType: BusinessType.GENCODE })
  @Get('genCode/:tableName')
  async genCodeToPath(
    @Param('tableName') tableName: string,
    @Query('genPath') genPath?: string,
  ) {
    return this.codeGenerator.genCodeToPath(tableName, genPath);
  }

  // ==================== 同步接口 ====================

  @ApiOperation({ summary: '同步表结构' })
  @Api({ summary: '同步表结构', description: '从数据库同步表字段结构' })
  @RequirePermission('tool:gen:edit')
  @Operlog({ title: '代码生成', businessType: BusinessType.UPDATE })
  @Get('synchDb/:tableId')
  async syncTable(@Param('tableId') tableId: string, @User() user: UserDto) {
    return this.codeGenerator.syncTable(+tableId, user.userName);
  }
}
