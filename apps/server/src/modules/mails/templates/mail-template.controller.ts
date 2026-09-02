import { Body, Controller, Delete, Get, Param, Post, Put, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { MailTemplateService } from './mail-template.service';
import { CreateMailTemplateDto, ListMailTemplateDto, UpdateMailTemplateDto } from './dto/index';
import { RequirePermission } from 'src/core/http/decorators/require-permission.decorator';
import { Api } from 'src/core/http/decorators/api.decorator';
import { MailTemplateResponseDto } from './dto';
import { Operlog } from 'src/core/audit/decorators/operlog.decorator';
import { BusinessType } from 'src/shared/constants/business.constant';
import { UserTool, UserToolType } from 'src/modules/users/user.decorator';

@ApiTags('邮件模板管理')
@Controller('system/mail/template')
@ApiBearerAuth('Authorization')
export class MailTemplateController {
  constructor(private readonly mailTemplateService: MailTemplateService) {}

  @Api({
    summary: '邮件模板-创建',
    description: '创建新的邮件模板',
    body: CreateMailTemplateDto,
  })
  @RequirePermission('system:mail:template:add')
  @Operlog({ businessType: BusinessType.INSERT })
  @Post()
  create(@Body() createDto: CreateMailTemplateDto, @UserTool() { injectCreate }: UserToolType) {
    return this.mailTemplateService.create(injectCreate(createDto));
  }

  @Api({
    summary: '邮件模板-列表',
    description: '分页查询邮件模板列表',
    type: MailTemplateResponseDto,
  })
  @RequirePermission('system:mail:template:list')
  @Get('/list')
  findAll(@Query() query: ListMailTemplateDto) {
    return this.mailTemplateService.findAll(query);
  }

  @Api({
    summary: '邮件模板-详情',
    description: '根据ID获取邮件模板详情',
    type: MailTemplateResponseDto,
    params: [{ name: 'id', description: '模板ID', type: 'number' }],
  })
  @RequirePermission('system:mail:template:query')
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.mailTemplateService.findOne(+id);
  }

  @Api({
    summary: '邮件模板-更新',
    description: '修改邮件模板信息',
    body: UpdateMailTemplateDto,
  })
  @RequirePermission('system:mail:template:edit')
  @Operlog({ businessType: BusinessType.UPDATE })
  @Put()
  update(@Body() updateDto: UpdateMailTemplateDto, @UserTool() { injectUpdate }: UserToolType) {
    return this.mailTemplateService.update(injectUpdate(updateDto));
  }

  @Api({
    summary: '邮件模板-删除',
    description: '批量删除邮件模板，多个ID用逗号分隔',
    params: [{ name: 'id', description: '模板ID，多个用逗号分隔' }],
  })
  @RequirePermission('system:mail:template:remove')
  @Operlog({ businessType: BusinessType.DELETE })
  @Delete(':id')
  remove(@Param('id') ids: string) {
    const templateIds = ids.split(',').map((id) => +id);
    return this.mailTemplateService.remove(templateIds);
  }
}
