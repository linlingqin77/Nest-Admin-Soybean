import { Global, Module } from '@nestjs/common';
import { LoggerModule as PinoLoggerModule } from 'nestjs-pino';
import { AppConfigService } from 'src/platform/config/app-config.service';
import { createPinoConfig } from './pino-logger.config';
import { StructuredLoggerService } from './structured-logger.service';

@Global()
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
  providers: [StructuredLoggerService],
  exports: [PinoLoggerModule, StructuredLoggerService],
})
export class LoggerModule {}
