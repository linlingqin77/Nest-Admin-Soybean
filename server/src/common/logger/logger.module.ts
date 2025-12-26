import { Module } from '@nestjs/common';
import { LoggerModule as PinoLoggerModule } from 'nestjs-pino';
import { AppConfigService } from 'src/config/app-config.service';
import { createPinoConfig } from './pino-logger.config';
import { AppLogger } from './app-logger.service';

@Module({
  imports: [
    PinoLoggerModule.forRootAsync({
      inject: [AppConfigService],
      useFactory: (config: AppConfigService) => {
        const { dir, level, prettyPrint, toFile, excludePaths, sensitiveFields } = config.app.logger;
        return createPinoConfig(dir, level, prettyPrint, toFile, excludePaths, sensitiveFields);
      },
    }),
  ],
  providers: [AppLogger],
  exports: [AppLogger],
})
export class LoggerModule {}
