import { Module } from '@nestjs/common';
import { NotifyTemplateService } from './notify-template.service';
import { NotifyTemplateController } from './notify-template.controller';
import { NotifyTemplateRepository } from './notify-template.repository';

@Module({
  controllers: [NotifyTemplateController],
  providers: [NotifyTemplateService, NotifyTemplateRepository],
  exports: [NotifyTemplateService, NotifyTemplateRepository],
})
export class NotifyTemplateModule {}
