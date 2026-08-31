import { Controller, Get, Post, Body, Put, Param, Delete, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { OssConfigService } from './oss-config.service';
import {
  CreateOssConfigDto,
  UpdateOssConfigDto,
  ChangeOssConfigStatusDto,
  ListOssConfigDto,
  OssConfigResponseDto,
  OssConfigListResponseDto,
} from './dto/index';
import { RequirePermission } from 'src/core/http/decorators/require-permission.decorator';
import { Api } from 'src/core/http/decorators/api.decorator';
import { Operlog } from 'src/core/audit/decorators/operlog.decorator';
import { BusinessType } from 'src/shared/constants/business.constant';
import { UserTool, UserToolType } from 'src/modules/users/user.decorator';

@ApiTags('OSS配置管理')
@Controller('resource/oss/config')
@ApiBearerAuth('Authorization')
export class OssConfigController {
  constructor(private readonly ossConfigService: OssConfigService) {}

  @Api({
    summary: 'OSS配置管理-创建',
    description: '创建OSS配置',
    body: CreateOssConfigDto,
  })
  @RequirePermission('system:oss:add')
  @Operlog({ businessType: BusinessType.INSERT })
  @Post()
  create(@Body() createOssConfigDto: CreateOssConfigDto, @UserTool() { injectCreate }: UserToolType) {
    return this.ossConfigService.create(injectCreate(createOssConfigDto));
  }

  @Api({
    summary: 'OSS配置管理-列表',
    description: '分页查询OSS配置列表',
    type: OssConfigListResponseDto,
  })
  @RequirePermission('system:oss:list')
  @Get('/list')
  findAll(@Query() query: ListOssConfigDto) {
    return this.ossConfigService.findAll(query);
  }

  @Api({
    summary: 'OSS配置管理-详情',
    description: '根据ID获取OSS配置详情',
    type: OssConfigResponseDto,
    params: [{ name: 'id', description: 'OSS配置ID', type: 'number' }],
  })
  @RequirePermission('system:oss:query')
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.ossConfigService.findOne(+id);
  }

  @Api({
    summary: 'OSS配置管理-更新',
    description: '修改OSS配置',
    body: UpdateOssConfigDto,
  })
  @RequirePermission('system:oss:edit')
  @Operlog({ businessType: BusinessType.UPDATE })
  @Put()
  update(@Body() updateOssConfigDto: UpdateOssConfigDto) {
    return this.ossConfigService.update(updateOssConfigDto);
  }

  @Api({
    summary: 'OSS配置管理-修改状态',
    description: '修改OSS配置状态',
    body: ChangeOssConfigStatusDto,
  })
  @RequirePermission('system:oss:edit')
  @Operlog({ businessType: BusinessType.UPDATE })
  @Put('/changeStatus')
  changeStatus(@Body() dto: ChangeOssConfigStatusDto) {
    return this.ossConfigService.changeStatus(dto);
  }

  @Api({
    summary: 'OSS配置管理-删除',
    description: '批量删除OSS配置，多个ID用逗号分隔',
    params: [{ name: 'ids', description: 'OSS配置ID，多个用逗号分隔' }],
  })
  @RequirePermission('system:oss:remove')
  @Operlog({ businessType: BusinessType.DELETE })
  @Delete(':ids')
  remove(@Param('ids') ids: string) {
    const ossConfigIds = ids.split(',').map((id) => +id);
    return this.ossConfigService.remove(ossConfigIds);
  }
}
