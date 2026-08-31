import { Module } from '@nestjs/common';
import { MailTemplateService } from './mail-template.service';
import { MailTemplateController } from './mail-template.controller';
import { MailTemplateRepository } from './mail-template.repository';
import { MailAccountModule } from '../accounts/mail-account.module';

@Module({
  imports: [MailAccountModule],
  controllers: [MailTemplateController],
  providers: [MailTemplateService, MailTemplateRepository],
  exports: [MailTemplateService, MailTemplateRepository],
})
export class MailTemplateModule {}
