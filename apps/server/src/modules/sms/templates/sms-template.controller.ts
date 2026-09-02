import { Body, Controller, Delete, Get, Param, Post, Put, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { SmsTemplateService } from './sms-template.service';
import { CreateSmsTemplateDto, ListSmsTemplateDto, UpdateSmsTemplateDto } from './dto/index';
import { RequirePermission } from 'src/core/http/decorators/require-permission.decorator';
import { Api } from 'src/core/http/decorators/api.decorator';
import { SmsTemplateResponseDto } from './dto';
import { Operlog } from 'src/core/audit/decorators/operlog.decorator';
import { BusinessType } from 'src/shared/constants/business.constant';
import { UserTool, UserToolType } from 'src/modules/users/user.decorator';

@ApiTags('短信模板管理')
@Controller('system/sms/template')
@ApiBearerAuth('Authorization')
export class SmsTemplateController {
  constructor(private readonly smsTemplateService: SmsTemplateService) {}

  @Api({
    summary: '短信模板-创建',
    description: '创建新的短信模板',
    body: CreateSmsTemplateDto,
  })
  @RequirePermission('system:sms:template:add')
  @Operlog({ businessType: BusinessType.INSERT })
  @Post()
  create(@Body() createDto: CreateSmsTemplateDto, @UserTool() { injectCreate }: UserToolType) {
    return this.smsTemplateService.create(injectCreate(createDto));
  }

  @Api({
    summary: '短信模板-列表',
    description: '分页查询短信模板列表',
    type: SmsTemplateResponseDto,
  })
  @RequirePermission('system:sms:template:list')
  @Get('/list')
  findAll(@Query() query: ListSmsTemplateDto) {
    return this.smsTemplateService.findAll(query);
  }

  @Api({
    summary: '短信模板-详情',
    description: '根据ID获取短信模板详情',
    type: SmsTemplateResponseDto,
    params: [{ name: 'id', description: '模板ID', type: 'number' }],
  })
  @RequirePermission('system:sms:template:query')
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.smsTemplateService.findOne(+id);
  }

  @Api({
    summary: '短信模板-更新',
    description: '修改短信模板信息',
    body: UpdateSmsTemplateDto,
  })
  @RequirePermission('system:sms:template:edit')
  @Operlog({ businessType: BusinessType.UPDATE })
  @Put()
  update(@Body() updateDto: UpdateSmsTemplateDto, @UserTool() { injectUpdate }: UserToolType) {
    return this.smsTemplateService.update(injectUpdate(updateDto));
  }

  @Api({
    summary: '短信模板-删除',
    description: '批量删除短信模板，多个ID用逗号分隔',
    params: [{ name: 'id', description: '模板ID，多个用逗号分隔' }],
  })
  @RequirePermission('system:sms:template:remove')
  @Operlog({ businessType: BusinessType.DELETE })
  @Delete(':id')
  remove(@Param('id') ids: string) {
    const templateIds = ids.split(',').map((id) => +id);
    return this.smsTemplateService.remove(templateIds);
  }
}
