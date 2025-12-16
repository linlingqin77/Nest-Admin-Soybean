import { Module } from '@nestjs/common';
import { LoggerModule as PinoLoggerModule } from 'nestjs-pino';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { createPinoConfig } from './pino-logger.config';

@Module({
    imports: [
        PinoLoggerModule.forRootAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: (config: ConfigService) => {
                const logDir = config.get<string>('app.logger.dir', '../logs');
                const level = config.get<string>('app.logger.level', 'info');
                const prettyPrint = config.get<boolean>('app.logger.prettyPrint', false);
                const excludePaths = config.get<string[]>('app.logger.excludePaths', []);
                const sensitiveFields = config.get<string[]>('app.logger.sensitiveFields', []);

                return createPinoConfig(logDir, level, prettyPrint, excludePaths, sensitiveFields);
            },
        }),
    ],
})
export class LoggerModule { }
