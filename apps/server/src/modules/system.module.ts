import { Global, Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { ClientModule } from './clients/client.module';
import { DeptModule } from './depts/dept.module';
import { SysConfigModule } from './configs/config.module';
import { DictModule } from './dicts/dict.module';
import { DocsModule } from './docs/docs.module';
import { MenuModule } from './menus/menu.module';
import { NoticeModule } from './notices/notice.module';
import { PostModule } from './posts/post.module';
import { RoleModule } from './roles/role.module';
import { ToolModule } from './tools/tool.module';
import { UserModule } from './users/user.module';
import { TenantModule } from './tenants/tenant.module';
import { TenantPackageModule } from './tenant-packages/tenant-package.module';
import { FileManagerModule } from './files/file-manager.module';
import { NotifyTemplateModule } from './notifies/templates/notify-template.module';
import { NotifyMessageModule } from './notifies/messages/notify-message.module';
import { SmsChannelModule } from './sms/channels/sms-channel.module';
import { SmsTemplateModule } from './sms/templates/sms-template.module';
import { SmsSendModule } from './sms/send/sms-send.module';
import { SmsLogModule } from './sms/logs/sms-log.module';
import { MailAccountModule } from './mails/accounts/mail-account.module';
import { MailTemplateModule } from './mails/templates/mail-template.module';
import { MailSendModule } from './mails/send/mail-send.module';
import { MailLogModule } from './mails/logs/mail-log.module';

// Sms 短信管理模块
@Global()
@Module({
  imports: [SmsChannelModule, SmsTemplateModule, SmsSendModule, SmsLogModule],
  exports: [SmsChannelModule, SmsTemplateModule, SmsSendModule, SmsLogModule],
})
export class SmsFeatureModule {}

// Mail 邮件管理模块
@Global()
@Module({
  imports: [MailAccountModule, MailTemplateModule, MailSendModule, MailLogModule],
  exports: [MailAccountModule, MailTemplateModule, MailSendModule, MailLogModule],
})
export class MailFeatureModule {}

// Notify 站内信管理模块
@Global()
@Module({
  imports: [NotifyTemplateModule, NotifyMessageModule],
  exports: [NotifyTemplateModule, NotifyMessageModule],
})
export class NotifyFeatureModule {}

@Global()
@Module({
  imports: [
    AuthModule,
    ClientModule,
    SysConfigModule,
    DeptModule,
    DictModule,
    DocsModule,
    MenuModule,
    NoticeModule,
    PostModule,
    RoleModule,
    TenantModule,
    TenantPackageModule,
    ToolModule,
    UserModule,
    FileManagerModule,
    SmsFeatureModule,
    MailFeatureModule,
    NotifyFeatureModule,
  ],
})
export class SystemModule {}
