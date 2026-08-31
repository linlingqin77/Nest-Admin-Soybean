import { Module } from '@nestjs/common';
import { MailAccountService } from './mail-account.service';
import { MailAccountController } from './mail-account.controller';
import { MailAccountRepository } from './mail-account.repository';

@Module({
  controllers: [MailAccountController],
  providers: [MailAccountService, MailAccountRepository],
  exports: [MailAccountService, MailAccountRepository],
})
export class MailAccountModule {}
