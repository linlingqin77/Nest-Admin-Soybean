import { Module } from '@nestjs/common';
import { SmsTemplateService } from './sms-template.service';
import { SmsTemplateController } from './sms-template.controller';
import { SmsTemplateRepository } from './sms-template.repository';
import { SmsChannelModule } from '../channels/sms-channel.module';

@Module({
  imports: [SmsChannelModule],
  controllers: [SmsTemplateController],
  providers: [SmsTemplateService, SmsTemplateRepository],
  exports: [SmsTemplateService, SmsTemplateRepository],
})
export class SmsTemplateModule {}
