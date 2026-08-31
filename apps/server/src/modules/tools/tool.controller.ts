import { Controller, Get, Post, Body, Param, Delete, Request, Query, Put, Res, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { ToolService } from './tool.service';
import {
  ImportTablesDto as TableName,
  ListDbTableRequestDto as GenDbTableList,
  ListGenTableRequestDto as GenTableList,
  UpdateGenTableDto as GenTableUpdate,
  GenerateCodeDto,
  BatchGenCodeDto,
} from './dto';
import { Response } from 'express';
import { User, UserDto } from 'src/modules/users/user.decorator';
import { Api } from 'src/core/http/decorators/api.decorator';
import { Operlog } from 'src/core/audit/decorators/operlog.decorator';
import { BusinessType } from 'src/shared/constants/business.constant';
import { MultiThrottleGuard } from 'src/core/http/guards/multi-throttle.guard';
import { MultiThrottle } from 'src/core/decorators/throttle.decorator';

@ApiTags('系统工具')
@Controller('tool')
@ApiBearerAuth('Authorization')
export class ToolController {
  constructor(private readonly toolService: ToolService) {}

  @Api({
    summary: '数据表列表',
    description: '分页查询已导入的数据表列表',
  })
  @Get('/gen/list')
  findAll(@Query() query: GenTableList) {
    return this.toolService.findAll(query);
  }

  @Api({
    summary: '查询数据库表列表',
    description: '查询数据库中未导入的表',
  })
  @Get('/gen/db/list')
  genDbList(@Query() query: GenDbTableList) {
    return this.toolService.genDbList(query);
  }

  @Api({
    summary: '查询数据源名称列表',
    description: '获取可用的数据源名称',
  })
  @Get('/gen/getDataNames')
  getDataNames() {
    return this.toolService.getDataNames();
  }

  @Api({
    summary: '导入表',
    description: '将数据库表导入到代码生成列表',
    body: TableName,
  })
  @Operlog({ businessType: BusinessType.IMPORT })
  @Post('/gen/importTable')
  genImportTable(@Body() table: TableName, @User() user: UserDto) {
    return this.toolService.importTable(table, user);
  }

  @Api({
    summary: '同步表结构',
    description: '从数据库同步表字段结构',
    params: [{ name: 'tableName', description: '表名称' }],
  })
  @Operlog({ businessType: BusinessType.UPDATE })
  @Get('/gen/synchDb/:tableName')
  synchDb(@Param('tableName') tableName: string) {
    return this.toolService.synchDb(tableName);
  }

  @Api({
    summary: '查询表详细信息',
    description: '获取代码生成表详情，包含字段信息',
    params: [{ name: 'id', description: '表ID', type: 'number' }],
  })
  @Get('/gen/:id')
  gen(@Param('id') id: string) {
    return this.toolService.findOne(+id);
  }

  @Api({
    summary: '修改代码生成信息',
    description: '修改表的代码生成配置',
    body: GenTableUpdate,
  })
  @Operlog({ businessType: BusinessType.UPDATE })
  @Put('/gen')
  genUpdate(@Body() genTableUpdate: GenTableUpdate) {
    return this.toolService.genUpdate(genTableUpdate);
  }

  @Api({
    summary: '删除表数据',
    description: '从代码生成列表中删除表',
    params: [{ name: 'id', description: '表ID', type: 'number' }],
  })
  @Operlog({ businessType: BusinessType.DELETE })
  @Delete('/gen/:id')
  remove(@Param('id') id: string) {
    return this.toolService.remove(+id);
  }

  @Api({
    summary: '批量生成代码（通过表名）',
    description: '根据表名生成代码并下载为zip压缩包，文件名格式：{projectName}_{timestamp}.zip',
    produces: ['application/zip'],
  })
  @Operlog({ businessType: BusinessType.GENCODE })
  @UseGuards(MultiThrottleGuard)
  @MultiThrottle({
    ip: { ttl: 60000, limit: 10 }, // 每分钟每IP最多10次代码生成
    user: { ttl: 60000, limit: 20 }, // 每分钟每用户最多20次代码生成
    tenant: { ttl: 60000, limit: 100 }, // 每分钟每租户最多100次代码生成
  })
  @Get('/gen/batchGenCode/zip')
  batchGenCode(@Query() query: BatchGenCodeDto, @Res() res: Response) {
    // 兼容旧的 TableName 格式
    const tables = { tableNames: query.tableNames } as TableName;
    return this.toolService.batchGenCode(tables, res, query.projectName);
  }

  @Api({
    summary: '批量生成代码（通过表ID）',
    description: '根据表ID列表生成代码并下载为zip压缩包，文件名格式：{projectName}_{timestamp}.zip',
    produces: ['application/zip'],
  })
  @Operlog({ businessType: BusinessType.GENCODE })
  @UseGuards(MultiThrottleGuard)
  @MultiThrottle({
    ip: { ttl: 60000, limit: 10 }, // 每分钟每IP最多10次代码生成
    user: { ttl: 60000, limit: 20 }, // 每分钟每用户最多20次代码生成
    tenant: { ttl: 60000, limit: 100 }, // 每分钟每租户最多100次代码生成
  })
  @Post('/gen/batchGenCode')
  batchGenCodeByIds(@Body() dto: GenerateCodeDto, @Res() res: Response) {
    return this.toolService.batchGenCodeByIds(dto.tableIds, res, dto.projectName);
  }

  @Api({
    summary: '预览生成代码',
    description: '在线预览生成的代码内容',
    params: [{ name: 'id', description: '表ID', type: 'number' }],
  })
  @Operlog({ businessType: BusinessType.OTHER })
  @UseGuards(MultiThrottleGuard)
  @MultiThrottle({
    ip: { ttl: 60000, limit: 30 }, // 每分钟每IP最多30次预览
    user: { ttl: 60000, limit: 60 }, // 每分钟每用户最多60次预览
    tenant: { ttl: 60000, limit: 300 }, // 每分钟每租户最多300次预览
  })
  @Get('/gen/preview/:id')
  preview(@Param('id') id: string) {
    return this.toolService.preview(+id);
  }
}
