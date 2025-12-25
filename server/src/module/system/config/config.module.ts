import { Global, Module } from '@nestjs/common';
import { ConfigService } from './config.service';
import { ConfigController } from './config.controller';
import { ConfigRepository } from './config.repository';
import { SystemConfigService } from '../system-config/system-config.service';
import { SystemPrismaService } from 'src/common/prisma/system-prisma.service';

@Global()
@Module({
  controllers: [ConfigController],
  providers: [ConfigService, ConfigRepository, SystemConfigService, SystemPrismaService],
  exports: [ConfigService, SystemConfigService],
})
export class SysConfigModule {}
