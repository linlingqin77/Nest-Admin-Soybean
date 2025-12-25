import { Controller, Get, Post, Body, Put, Param, Delete, Request, Query, Res } from '@nestjs/common';
import { Response } from 'express';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { ConfigService } from './config.service';
import { CreateConfigDto, UpdateConfigDto, ListConfigDto } from './dto/index';
import { RequirePermission } from 'src/common/decorators/require-premission.decorator';
import { Api } from 'src/common/decorators/api.decorator';
import { ConfigVo, ConfigListVo } from './vo/config.vo';
import { Operlog } from 'src/common/decorators/operlog.decorator';
import { BusinessType } from 'src/common/constant/business.constant';
import { UserTool, UserToolType } from '../user/user.decorator';

@ApiTags('参数设置')
@Controller('system/config')
@ApiBearerAuth('Authorization')
export class ConfigController {
  constructor(private readonly configService: ConfigService) {}

  @Api({
    summary: '参数设置-创建',
    description: '创建系统参数配置',
    body: CreateConfigDto,
  })
  @RequirePermission('system:config:add')
  @Operlog({ businessType: BusinessType.INSERT })
  @Post()
  create(@Body() createConfigDto: CreateConfigDto, @UserTool() { injectCreate }: UserToolType) {
    return this.configService.create(injectCreate(createConfigDto));
  }

  @Api({
    summary: '参数设置-列表',
    description: '分页查询系统参数列表',
    type: ConfigListVo,
  })
  @RequirePermission('system:config:list')
  @Get('/list')
  findAll(@Query() query: ListConfigDto) {
    return this.configService.findAll(query);
  }

  @Api({
    summary: '参数设置-详情',
    description: '根据ID获取参数详情',
    type: ConfigVo,
    params: [{ name: 'id', description: '参数ID', type: 'number' }],
  })
  @RequirePermission('system:config:query')
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.configService.findOne(+id);
  }

  @Api({
    summary: '参数设置-按Key查询（缓存）',
    description: '根据参数键获取参数值，优先使用缓存',
    params: [{ name: 'id', description: '参数键名' }],
  })
  @RequirePermission('system:config:query')
  @Get('/configKey/:id')
  findOneByconfigKey(@Param('id') configKey: string) {
    return this.configService.findOneByConfigKey(configKey);
  }

  @Api({
    summary: '参数设置-更新',
    description: '修改系统参数配置',
    body: UpdateConfigDto,
  })
  @RequirePermission('system:config:edit')
  @Operlog({ businessType: BusinessType.UPDATE })
  @Put()
  update(@Body() updateConfigDto: UpdateConfigDto) {
    return this.configService.update(updateConfigDto);
  }

  @Api({
    summary: '参数设置-按Key更新',
    description: '根据参数键名修改参数值',
    body: UpdateConfigDto,
  })
  @RequirePermission('system:config:edit')
  @Operlog({ businessType: BusinessType.UPDATE })
  @Put('/updateByKey')
  updateByKey(@Body() updateConfigDto: UpdateConfigDto) {
    return this.configService.updateByKey(updateConfigDto);
  }

  @Api({
    summary: '参数设置-刷新缓存',
    description: '清除并重新加载参数配置缓存',
  })
  @RequirePermission('system:config:remove')
  @Operlog({ businessType: BusinessType.CLEAN })
  @Delete('/refreshCache')
  refreshCache() {
    return this.configService.resetConfigCache();
  }

  @Api({
    summary: '参数设置-删除',
    description: '批量删除参数配置，多个ID用逗号分隔',
    params: [{ name: 'id', description: '参数ID，多个用逗号分隔' }],
  })
  @RequirePermission('system:config:remove')
  @Operlog({ businessType: BusinessType.DELETE })
  @Delete(':id')
  remove(@Param('id') ids: string) {
    const configIds = ids.split(',').map((id) => +id);
    return this.configService.remove(configIds);
  }

  @Api({
    summary: '参数设置-导出Excel',
    description: '导出参数管理数据为xlsx文件',
    body: ListConfigDto,
    produces: ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
  })
  @RequirePermission('system:config:export')
  @Operlog({ businessType: BusinessType.EXPORT })
  @Post('/export')
  async export(@Res() res: Response, @Body() body: ListConfigDto): Promise<void> {
    return this.configService.export(res, body);
  }
}
