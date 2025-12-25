import { Controller, Get, Post, Body, Query, Request, Put, Res, HttpCode, Param, Delete } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { DictService } from './dict.service';
import {
  CreateDictTypeDto,
  UpdateDictTypeDto,
  ListDictType,
  CreateDictDataDto,
  UpdateDictDataDto,
  ListDictData,
} from './dto/index';
import { RequirePermission } from 'src/common/decorators/require-premission.decorator';
import { Response } from 'express';
import { Api } from 'src/common/decorators/api.decorator';
import { DictTypeVo, DictTypeListVo, DictDataVo, DictDataListVo } from './vo/dict.vo';
import { Operlog } from 'src/common/decorators/operlog.decorator';
import { BusinessType } from 'src/common/constant/business.constant';
import { UserTool, UserToolType } from '../user/user.decorator';

@ApiTags('字典管理')
@Controller('system/dict')
@ApiBearerAuth('Authorization')
export class DictController {
  constructor(private readonly dictService: DictService) {}

  //字典类型
  @Api({
    summary: '字典类型-创建',
    description: '创建字典类型',
    body: CreateDictTypeDto,
  })
  @RequirePermission('system:dict:add')
  @Operlog({ businessType: BusinessType.INSERT })
  @HttpCode(200)
  @Post('/type')
  createType(@Body() createDictTypeDto: CreateDictTypeDto, @UserTool() { injectCreate }: UserToolType) {
    return this.dictService.createType(injectCreate(createDictTypeDto));
  }

  @Api({
    summary: '字典数据-刷新缓存',
    description: '清除并重新加载字典数据缓存',
  })
  @RequirePermission('system:dict:remove')
  @Operlog({ businessType: BusinessType.CLEAN })
  @Delete('/type/refreshCache')
  refreshCache() {
    return this.dictService.resetDictCache();
  }

  @Api({
    summary: '字典类型-删除',
    description: '批量删除字典类型，多个ID用逗号分隔',
    params: [{ name: 'id', description: '字典类型ID，多个用逗号分隔' }],
  })
  @RequirePermission('system:dict:remove')
  @Operlog({ businessType: BusinessType.DELETE })
  @Delete('/type/:id')
  deleteType(@Param('id') ids: string) {
    const dictIds = ids.split(',').map((id) => +id);
    return this.dictService.deleteType(dictIds);
  }

  @Api({
    summary: '字典类型-修改',
    description: '修改字典类型信息',
    body: UpdateDictTypeDto,
  })
  @RequirePermission('system:dict:edit')
  @Operlog({ businessType: BusinessType.UPDATE })
  @Put('/type')
  updateType(@Body() updateDictTypeDto: UpdateDictTypeDto) {
    return this.dictService.updateType(updateDictTypeDto);
  }

  @Api({
    summary: '字典类型-列表',
    description: '分页查询字典类型列表',
    type: DictTypeListVo,
  })
  @RequirePermission('system:dict:list')
  @Get('/type/list')
  findAllType(@Query() query: ListDictType) {
    return this.dictService.findAllType(query);
  }

  @Api({
    summary: '字典类型-下拉选项',
    description: '获取全部字典类型用于下拉选择',
    type: DictTypeVo,
    isArray: true,
  })
  @RequirePermission('system:dict:query')
  @Get('/type/optionselect')
  findOptionselect() {
    return this.dictService.findOptionselect();
  }

  @Api({
    summary: '字典类型-详情',
    description: '根据ID获取字典类型详情',
    type: DictTypeVo,
    params: [{ name: 'id', description: '字典类型ID', type: 'number' }],
  })
  @RequirePermission('system:dict:query')
  @Get('/type/:id')
  findOneType(@Param('id') id: string) {
    return this.dictService.findOneType(+id);
  }

  // 字典数据
  @Api({
    summary: '字典数据-创建',
    description: '在指定字典类型下创建字典数据',
    body: CreateDictDataDto,
  })
  @RequirePermission('system:dict:add')
  @Operlog({ businessType: BusinessType.INSERT })
  @HttpCode(200)
  @Post('/data')
  createDictData(@Body() createDictDataDto: CreateDictDataDto, @UserTool() { injectCreate }: UserToolType) {
    return this.dictService.createDictData(injectCreate(createDictDataDto));
  }

  @Api({
    summary: '字典数据-删除',
    description: '批量删除字典数据，多个ID用逗号分隔',
    params: [{ name: 'id', description: '字典数据ID，多个用逗号分隔' }],
  })
  @RequirePermission('system:dict:remove')
  @Operlog({ businessType: BusinessType.DELETE })
  @Delete('/data/:id')
  deleteDictData(@Param('id') ids: string) {
    const dictIds = ids.split(',').map((id) => +id);
    return this.dictService.deleteDictData(dictIds);
  }

  @Api({
    summary: '字典数据-修改',
    description: '修改字典数据',
    body: UpdateDictDataDto,
  })
  @RequirePermission('system:dict:edit')
  @Operlog({ businessType: BusinessType.UPDATE })
  @Put('/data')
  updateDictData(@Body() updateDictDataDto: UpdateDictDataDto) {
    return this.dictService.updateDictData(updateDictDataDto);
  }

  @Api({
    summary: '字典数据-列表',
    description: '查询指定字典类型下的数据列表',
    type: DictDataListVo,
  })
  @RequirePermission('system:dict:list')
  @Get('/data/list')
  findAllData(@Query() query: ListDictData) {
    return this.dictService.findAllData(query);
  }

  @Api({
    summary: '字典数据-详情',
    description: '根据字典编码获取字典数据详情',
    type: DictDataVo,
    params: [{ name: 'id', description: '字典数据编码', type: 'number' }],
  })
  @Get('/data/:id')
  findOneDictData(@Param('id') dictCode: string) {
    return this.dictService.findOneDictData(+dictCode);
  }

  @Api({
    summary: '字典数据-按类型查询（缓存）',
    description: '根据字典类型获取字典数据列表，优先使用缓存',
    type: DictDataVo,
    isArray: true,
    params: [{ name: 'id', description: '字典类型标识' }],
  })
  @Get('/data/type/:id')
  findOneDataType(@Param('id') dictType: string) {
    return this.dictService.findOneDataType(dictType);
  }

  @Api({
    summary: '字典类型-导出Excel',
    description: '导出字典类型为xlsx文件',
    body: ListDictType,
    produces: ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
  })
  @RequirePermission('system:dict:export')
  @Operlog({ businessType: BusinessType.EXPORT })
  @Post('/type/export')
  async export(@Res() res: Response, @Body() body: ListDictType): Promise<void> {
    return this.dictService.export(res, body);
  }

  @Api({
    summary: '字典数据-导出Excel',
    description: '导出字典数据为xlsx文件',
    body: ListDictType,
    produces: ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
  })
  @RequirePermission('system:dict:export')
  @Operlog({ businessType: BusinessType.EXPORT })
  @Post('/data/export')
  async exportData(@Res() res: Response, @Body() body: ListDictType): Promise<void> {
    return this.dictService.exportData(res, body);
  }
}
