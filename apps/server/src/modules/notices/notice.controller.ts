import { Controller, Get, Post, Body, Param, Query, Put, Delete } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { NoticeService } from './notice.service';
import { CreateNoticeDto, UpdateNoticeDto, ListNoticeDto } from './dto/index';
import {
  NoticeResponseDto,
  NoticeListResponseDto,
  CreateNoticeResultResponseDto,
  UpdateNoticeResultResponseDto,
  DeleteNoticeResultResponseDto,
} from './dto/responses';
import { RequirePermission } from 'src/core/http/decorators/require-permission.decorator';
import { Api } from 'src/core/http/decorators/api.decorator';
import { Operlog } from 'src/core/audit/decorators/operlog.decorator';
import { BusinessType } from 'src/shared/constants/business.constant';
import { UserTool, UserToolType } from '../users/user.decorator';

@ApiTags('通知公告')
@Controller('system/notice')
@ApiBearerAuth('Authorization')
export class NoticeController {
  constructor(private readonly noticeService: NoticeService) {}

  @Api({
    summary: '通知公告-创建',
    description: '发布新的通知公告',
    body: CreateNoticeDto,
    type: CreateNoticeResultResponseDto,
  })
  @RequirePermission('system:notice:add')
  @Operlog({ businessType: BusinessType.INSERT })
  @Post()
  create(@Body() createConfigDto: CreateNoticeDto, @UserTool() { injectCreate }: UserToolType) {
    return this.noticeService.create(injectCreate(createConfigDto));
  }

  @Api({
    summary: '通知公告-列表',
    description: '分页查询通知公告列表',
    type: NoticeListResponseDto,
  })
  @RequirePermission('system:notice:list')
  @Get('/list')
  findAll(@Query() query: ListNoticeDto) {
    return this.noticeService.findAll(query);
  }

  @Api({
    summary: '通知公告-详情',
    description: '根据ID获取通知公告详情',
    type: NoticeResponseDto,
    params: [{ name: 'id', description: '公告ID', type: 'number' }],
  })
  @RequirePermission('system:notice:query')
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.noticeService.findOne(+id);
  }

  @Api({
    summary: '通知公告-更新',
    description: '修改通知公告内容',
    body: UpdateNoticeDto,
    type: UpdateNoticeResultResponseDto,
  })
  @RequirePermission('system:notice:edit')
  @Operlog({ businessType: BusinessType.UPDATE })
  @Put()
  update(@Body() updateNoticeDto: UpdateNoticeDto) {
    return this.noticeService.update(updateNoticeDto);
  }

  @Api({
    summary: '通知公告-删除',
    description: '批量删除通知公告，多个ID用逗号分隔',
    params: [{ name: 'id', description: '公告ID，多个用逗号分隔' }],
    type: DeleteNoticeResultResponseDto,
  })
  @RequirePermission('system:notice:remove')
  @Operlog({ businessType: BusinessType.DELETE })
  @Delete(':id')
  remove(@Param('id') ids: string) {
    const noticeIds = ids.split(',').map((id) => +id);
    return this.noticeService.remove(noticeIds);
  }
}
