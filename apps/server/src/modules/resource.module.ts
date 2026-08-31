import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AppConfigService } from '../platform/config/app-config.service';
import { SseController } from './sse.controller';
import { SseService } from './sse.service';
import { OssConfigModule } from '../platform/storage/oss-config.module';
import { OssModule } from '../platform/storage/oss.module';

@Module({
  imports: [
    OssConfigModule,
    OssModule,
    JwtModule.registerAsync({
      inject: [AppConfigService],
      useFactory: (config: AppConfigService) => ({
        secret: config.jwt.secretkey,
      }),
    }),
  ],
  controllers: [SseController],
  providers: [SseService],
  exports: [SseService],
})
export class ResourceModule {}
