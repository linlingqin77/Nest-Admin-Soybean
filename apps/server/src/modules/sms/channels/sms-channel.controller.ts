import { Body, Controller, Delete, Get, Param, Post, Put, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { SmsChannelService } from './sms-channel.service';
import { CreateSmsChannelDto, ListSmsChannelDto, UpdateSmsChannelDto } from './dto/index';
import { RequirePermission } from 'src/core/http/decorators/require-permission.decorator';
import { Api } from 'src/core/http/decorators/api.decorator';
import { SmsChannelResponseDto } from './dto';
import { Operlog } from 'src/core/audit/decorators/operlog.decorator';
import { BusinessType } from 'src/shared/constants/business.constant';
import { UserTool, UserToolType } from 'src/modules/users/user.decorator';

@ApiTags('短信渠道管理')
@Controller('system/sms/channel')
@ApiBearerAuth('Authorization')
export class SmsChannelController {
  constructor(private readonly smsChannelService: SmsChannelService) {}

  @Api({
    summary: '短信渠道-创建',
    description: '创建新的短信渠道',
    body: CreateSmsChannelDto,
  })
  @RequirePermission('system:sms:channel:add')
  @Operlog({ businessType: BusinessType.INSERT })
  @Post()
  create(@Body() createDto: CreateSmsChannelDto, @UserTool() { injectCreate }: UserToolType) {
    return this.smsChannelService.create(injectCreate(createDto));
  }

  @Api({
    summary: '短信渠道-列表',
    description: '分页查询短信渠道列表',
    type: SmsChannelResponseDto,
  })
  @RequirePermission('system:sms:channel:list')
  @Get('/list')
  findAll(@Query() query: ListSmsChannelDto) {
    return this.smsChannelService.findAll(query);
  }

  @Api({
    summary: '短信渠道-启用列表',
    description: '获取所有启用的短信渠道（用于下拉选择）',
  })
  @RequirePermission('system:sms:channel:list')
  @Get('/enabled')
  getEnabledChannels() {
    return this.smsChannelService.getEnabledChannels();
  }

  @Api({
    summary: '短信渠道-详情',
    description: '根据ID获取短信渠道详情',
    type: SmsChannelResponseDto,
    params: [{ name: 'id', description: '渠道ID', type: 'number' }],
  })
  @RequirePermission('system:sms:channel:query')
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.smsChannelService.findOne(+id);
  }

  @Api({
    summary: '短信渠道-更新',
    description: '修改短信渠道信息',
    body: UpdateSmsChannelDto,
  })
  @RequirePermission('system:sms:channel:edit')
  @Operlog({ businessType: BusinessType.UPDATE })
  @Put()
  update(@Body() updateDto: UpdateSmsChannelDto, @UserTool() { injectUpdate }: UserToolType) {
    return this.smsChannelService.update(injectUpdate(updateDto));
  }

  @Api({
    summary: '短信渠道-删除',
    description: '批量删除短信渠道，多个ID用逗号分隔',
    params: [{ name: 'id', description: '渠道ID，多个用逗号分隔' }],
  })
  @RequirePermission('system:sms:channel:remove')
  @Operlog({ businessType: BusinessType.DELETE })
  @Delete(':id')
  remove(@Param('id') ids: string) {
    const channelIds = ids.split(',').map((id) => +id);
    return this.smsChannelService.remove(channelIds);
  }
}
