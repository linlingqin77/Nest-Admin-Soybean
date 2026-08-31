import { Controller, Post, Body, Param } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { MailSendService } from './mail-send.service';
import { SendMailDto, BatchSendMailDto, TestMailDto } from './dto/index';
import { RequirePermission } from 'src/core/http/decorators/require-permission.decorator';
import { Api } from 'src/core/http/decorators/api.decorator';
import { Operlog } from 'src/core/audit/decorators/operlog.decorator';
import { BusinessType } from 'src/shared/constants/business.constant';

@ApiTags('邮件发送')
@Controller('system/mail/send')
@ApiBearerAuth('Authorization')
export class MailSendController {
  constructor(private readonly mailSendService: MailSendService) {}

  @Api({
    summary: '邮件发送-单发',
    description: '使用模板发送单封邮件',
    body: SendMailDto,
  })
  @RequirePermission('system:mail:send')
  @Operlog({ businessType: BusinessType.OTHER })
  @Post()
  send(@Body() dto: SendMailDto) {
    return this.mailSendService.send(dto);
  }

  @Api({
    summary: '邮件发送-批量',
    description: '使用模板批量发送邮件',
    body: BatchSendMailDto,
  })
  @RequirePermission('system:mail:send')
  @Operlog({ businessType: BusinessType.OTHER })
  @Post('/batch')
  batchSend(@Body() dto: BatchSendMailDto) {
    return this.mailSendService.batchSend(dto);
  }

  @Api({
    summary: '邮件发送-重发',
    description: '重新发送失败的邮件',
    params: [{ name: 'logId', description: '日志ID' }],
  })
  @RequirePermission('system:mail:send')
  @Operlog({ businessType: BusinessType.OTHER })
  @Post('/resend/:logId')
  resend(@Param('logId') logId: string) {
    return this.mailSendService.resend(logId);
  }

  @Api({
    summary: '邮件发送-测试',
    description: '测试邮箱账号是否可用',
    body: TestMailDto,
  })
  @RequirePermission('system:mail:account:query')
  @Post('/test')
  testSend(@Body() dto: TestMailDto) {
    return this.mailSendService.testSend(dto);
  }
}
