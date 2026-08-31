import { Module } from '@nestjs/common';
import { MailSendService } from './mail-send.service';
import { MailSendController } from './mail-send.controller';
import { MailTemplateModule } from '../templates/mail-template.module';
import { MailAccountModule } from '../accounts/mail-account.module';
import { MailLogRepository } from '../logs/mail-log.repository';

@Module({
  imports: [MailTemplateModule, MailAccountModule],
  controllers: [MailSendController],
  providers: [MailSendService, MailLogRepository],
  exports: [MailSendService, MailLogRepository],
})
export class MailSendModule {}
