import { Controller, Get, Post, Body, Param, Query, Put, Delete } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { NotifyMessageService } from './notify-message.service';
import { SendNotifyMessageDto, SendNotifyAllDto, ListNotifyMessageDto, ListMyNotifyMessageDto } from './dto/index';
import { RequirePermission } from 'src/core/http/decorators/require-permission.decorator';
import { Api } from 'src/core/http/decorators/api.decorator';
import { NotifyMessageResponseDto, UnreadCountResponseDto } from './dto';
import { Operlog } from 'src/core/audit/decorators/operlog.decorator';
import { BusinessType } from 'src/shared/constants/business.constant';
import { User, UserDto } from 'src/modules/users/user.decorator';

@ApiTags('站内信消息管理')
@Controller('system/notify/message')
@ApiBearerAuth('Authorization')
export class NotifyMessageController {
  constructor(private readonly notifyMessageService: NotifyMessageService) {}

  @Api({
    summary: '站内信-发送',
    description: '发送站内信给指定用户（单发/群发）',
    body: SendNotifyMessageDto,
  })
  @RequirePermission('system:notify:message:send')
  @Operlog({ businessType: BusinessType.INSERT })
  @Post('/send')
  send(@Body() sendDto: SendNotifyMessageDto) {
    return this.notifyMessageService.send(sendDto);
  }

  @Api({
    summary: '站内信-群发所有用户',
    description: '发送站内信给所有用户',
    body: SendNotifyAllDto,
  })
  @RequirePermission('system:notify:message:send')
  @Operlog({ businessType: BusinessType.INSERT })
  @Post('/send-all')
  sendAll(@Body() sendDto: SendNotifyAllDto) {
    return this.notifyMessageService.sendAll(sendDto);
  }

  @Api({
    summary: '站内信-列表（管理员）',
    description: '分页查询所有站内信消息列表',
    type: NotifyMessageResponseDto,
  })
  @RequirePermission('system:notify:message:list')
  @Get('/list')
  findAll(@Query() query: ListNotifyMessageDto) {
    return this.notifyMessageService.findAll(query);
  }

  @Api({
    summary: '站内信-我的消息列表',
    description: '分页查询当前用户的站内信列表',
    type: NotifyMessageResponseDto,
  })
  @Get('/my-list')
  findMyMessages(@Query() query: ListMyNotifyMessageDto, @User() user: UserDto) {
    return this.notifyMessageService.findMyMessages(user.userId, query);
  }

  @Api({
    summary: '站内信-未读数量',
    description: '获取当前用户的未读站内信数量',
    type: UnreadCountResponseDto,
  })
  @Get('/unread-count')
  getUnreadCount(@User() user: UserDto) {
    return this.notifyMessageService.getUnreadCount(user.userId);
  }

  @Api({
    summary: '站内信-最近消息',
    description: '获取当前用户最近的站内信列表（用于通知铃铛下拉）',
    type: NotifyMessageResponseDto,
  })
  @Get('/recent')
  getRecentMessages(@Query('limit') limit: string, @User() user: UserDto) {
    return this.notifyMessageService.getRecentMessages(user.userId, limit ? +limit : 10);
  }

  @Api({
    summary: '站内信-详情',
    description: '根据ID获取站内信详情',
    type: NotifyMessageResponseDto,
    params: [{ name: 'id', description: '消息ID', type: 'string' }],
  })
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.notifyMessageService.findOne(Number(id));
  }

  @Api({
    summary: '站内信-标记已读',
    description: '标记单条站内信为已读',
    params: [{ name: 'id', description: '消息ID', type: 'string' }],
  })
  @Put('/read/:id')
  @Operlog({ businessType: BusinessType.UPDATE })
  markAsRead(@Param('id') id: string, @User() user: UserDto) {
    return this.notifyMessageService.markAsRead(Number(id), user.userId);
  }

  @Api({
    summary: '站内信-批量标记已读',
    description: '批量标记站内信为已读，多个ID用逗号分隔',
    params: [{ name: 'ids', description: '消息ID，多个用逗号分隔', type: 'string' }],
  })
  @Put('/read-batch/:ids')
  @Operlog({ businessType: BusinessType.UPDATE })
  markAsReadBatch(@Param('ids') ids: string, @User() user: UserDto) {
    const messageIds = ids.split(',').map((id) => Number(id));
    return this.notifyMessageService.markAsReadBatch(messageIds, user.userId);
  }

  @Api({
    summary: '站内信-全部标记已读',
    description: '标记当前用户所有站内信为已读',
  })
  @Put('/read-all')
  @Operlog({ businessType: BusinessType.UPDATE })
  markAllAsRead(@User() user: UserDto) {
    return this.notifyMessageService.markAllAsRead(user.userId);
  }

  @Api({
    summary: '站内信-删除',
    description: '删除单条站内信（软删除）',
    params: [{ name: 'id', description: '消息ID', type: 'string' }],
  })
  @Operlog({ businessType: BusinessType.DELETE })
  @Delete(':id')
  remove(@Param('id') id: string, @User() user: UserDto) {
    return this.notifyMessageService.remove(Number(id), user.userId);
  }

  @Api({
    summary: '站内信-批量删除',
    description: '批量删除站内信（软删除），多个ID用逗号分隔',
    params: [{ name: 'ids', description: '消息ID，多个用逗号分隔', type: 'string' }],
  })
  @Operlog({ businessType: BusinessType.DELETE })
  @Delete('/batch/:ids')
  removeBatch(@Param('ids') ids: string, @User() user: UserDto) {
    const messageIds = ids.split(',').map((id) => Number(id));
    return this.notifyMessageService.removeBatch(messageIds, user.userId);
  }
}
