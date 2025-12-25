import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AppConfigService } from 'src/config/app-config.service';
import { FileManagerController } from './file-manager.controller';
import { FileManagerService } from './file-manager.service';
import { FileAccessService } from './services/file-access.service';
import { VersionService } from '../../upload/services/version.service';

@Module({
  imports: [
    JwtModule.registerAsync({
      inject: [AppConfigService],
      useFactory: (config: AppConfigService) => ({
        secret: config.jwt.secretkey,
        signOptions: { expiresIn: config.jwt.expiresin },
      }),
    }),
  ],
  controllers: [FileManagerController],
  providers: [FileManagerService, FileAccessService, VersionService],
  exports: [FileManagerService, FileAccessService],
})
export class FileManagerModule {}
