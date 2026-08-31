import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AppConfigService } from 'src/platform/config/app-config.service';
import { FileManagerController } from './file-manager.controller';
import { FileManagerService } from './file-manager.service';
import { FileAccessService } from './services/file-access.service';
import { FileFolderRepository } from './file-folder.repository';

/**
 * 文件管理模块
 *
 * 注意: VersionService 已从 UploadModule（@Global）中导出，无需重复 providers
 */
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
  providers: [FileManagerService, FileAccessService, FileFolderRepository],
  exports: [FileManagerService, FileAccessService],
})
export class FileManagerModule {}
