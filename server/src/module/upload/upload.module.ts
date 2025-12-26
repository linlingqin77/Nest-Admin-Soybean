import { Global, Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { UploadService } from './upload.service';
import { UploadController } from './upload.controller';
import { ThumbnailProcessor } from './processors/thumbnail.processor';
import { VersionService } from './services/version.service';

@Global()
@Module({
  imports: [
    BullModule.registerQueue({
      name: 'thumbnail',
    }),
  ],
  controllers: [UploadController],
  providers: [UploadService, ThumbnailProcessor, VersionService],
  exports: [UploadService, VersionService],
})
export class UploadModule {}
