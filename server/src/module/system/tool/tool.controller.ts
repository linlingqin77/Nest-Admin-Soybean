import { Controller, Get, Post, Body, Param, Delete, Request, Query, Put, Res } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { ToolService } from './tool.service';
import { TableName, GenDbTableList, GenTableList, GenTableUpdate } from './dto/create-genTable-dto';
import { Response } from 'express';
import { User, UserDto } from 'src/module/system/user/user.decorator';
import { Api } from 'src/common/decorators/api.decorator';
import { Operlog } from 'src/common/decorators/operlog.decorator';
import { BusinessType } from 'src/common/constant/business.constant';

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
    summary: '批量生成代码',
    description: '生成代码并下载为zip压缩包',
    produces: ['application/zip'],
  })
  @Operlog({ businessType: BusinessType.GENCODE })
  @Get('/gen/batchGenCode/zip')
  batchGenCode(@Query() tables: TableName, @Res() res: Response) {
    return this.toolService.batchGenCode(tables, res);
  }

  @Api({
    summary: '预览生成代码',
    description: '在线预览生成的代码内容',
    params: [{ name: 'id', description: '表ID', type: 'number' }],
  })
  @Get('/gen/preview/:id')
  preview(@Param('id') id: string) {
    return this.toolService.preview(+id);
  }
}
