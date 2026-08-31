import { Module } from '@nestjs/common';
import { OssController } from './oss.controller';
import { OssService } from './oss.service';
import { OssRepository } from './oss.repository';
import { UploadModule } from 'src/modules/files/upload.module';

@Module({
  imports: [UploadModule],
  controllers: [OssController],
  providers: [OssService, OssRepository],
  exports: [OssService],
})
export class OssModule {}
