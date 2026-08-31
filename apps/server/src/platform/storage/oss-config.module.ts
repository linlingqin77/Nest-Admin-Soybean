import { Module } from '@nestjs/common';
import { OssConfigController } from './oss-config.controller';
import { OssConfigService } from './oss-config.service';
import { OssConfigRepository } from './oss-config.repository';

@Module({
  controllers: [OssConfigController],
  providers: [OssConfigService, OssConfigRepository],
  exports: [OssConfigService],
})
export class OssConfigModule {}
