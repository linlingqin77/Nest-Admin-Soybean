import { Module } from '@nestjs/common';
import { SmsSendService } from './sms-send.service';
import { SmsSendController } from './sms-send.controller';
import { SmsClientFactory } from './sms-client.factory';
import { SmsTemplateModule } from '../templates/sms-template.module';
import { SmsLogRepository } from '../logs/sms-log.repository';

@Module({
  imports: [SmsTemplateModule],
  controllers: [SmsSendController],
  providers: [SmsSendService, SmsClientFactory, SmsLogRepository],
  exports: [SmsSendService, SmsLogRepository],
})
export class SmsSendModule {}
