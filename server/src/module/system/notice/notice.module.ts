import { Module } from '@nestjs/common';
import { NoticeService } from './notice.service';
import { NoticeController } from './notice.controller';
import { NoticeRepository } from './notice.repository';

@Module({
  controllers: [NoticeController],
  providers: [NoticeService, NoticeRepository],
})
export class NoticeModule { }
