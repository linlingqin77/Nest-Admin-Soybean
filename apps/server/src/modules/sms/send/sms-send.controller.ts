import { Body, Controller, Param, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { SmsSendService } from './sms-send.service';
import { BatchSendSmsDto, SendSmsDto } from './dto/index';
import { RequirePermission } from 'src/core/http/decorators/require-permission.decorator';
import { Api } from 'src/core/http/decorators/api.decorator';
import { Operlog } from 'src/core/audit/decorators/operlog.decorator';
import { BusinessType } from 'src/shared/constants/business.constant';

@ApiTags('短信发送')
@Controller('system/sms/send')
@ApiBearerAuth('Authorization')
export class SmsSendController {
  constructor(private readonly smsSendService: SmsSendService) {}

  @Api({
    summary: '短信发送-单发',
    description: '发送单条短信',
    body: SendSmsDto,
  })
  @RequirePermission('system:sms:send')
  @Operlog({ businessType: BusinessType.OTHER })
  @Post()
  send(@Body() dto: SendSmsDto) {
    return this.smsSendService.send(dto);
  }

  @Api({
    summary: '短信发送-批量',
    description: '批量发送短信',
    body: BatchSendSmsDto,
  })
  @RequirePermission('system:sms:send')
  @Operlog({ businessType: BusinessType.OTHER })
  @Post('/batch')
  batchSend(@Body() dto: BatchSendSmsDto) {
    return this.smsSendService.batchSend(dto);
  }

  @Api({
    summary: '短信发送-重发',
    description: '重发失败的短信',
    params: [{ name: 'logId', description: '日志ID' }],
  })
  @RequirePermission('system:sms:send')
  @Operlog({ businessType: BusinessType.OTHER })
  @Post('/resend/:logId')
  resend(@Param('logId') logId: number) {
    return this.smsSendService.resend(Number(logId));
  }
}
