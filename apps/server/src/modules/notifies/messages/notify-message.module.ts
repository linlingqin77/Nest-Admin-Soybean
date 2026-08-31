import { Module } from '@nestjs/common';
import { NotifyMessageService } from './notify-message.service';
import { NotifyMessageController } from './notify-message.controller';
import { NotifyMessageRepository } from './notify-message.repository';
import { NotifyTemplateModule } from '../templates/notify-template.module';

@Module({
  imports: [NotifyTemplateModule],
  controllers: [NotifyMessageController],
  providers: [NotifyMessageService, NotifyMessageRepository],
  exports: [NotifyMessageService, NotifyMessageRepository],
})
export class NotifyMessageModule {}
