import { Module, Global } from '@nestjs/common';
import { AuditService } from './audit.service';
import { PrismaModule } from '../../prisma/prisma.module';

/**
 * 审计日志模块
 *
 * @description 提供审计日志记录功能，支持异步批量写入
 */
@Global()
@Module({
  imports: [PrismaModule],
  providers: [AuditService],
  exports: [AuditService],
})
export class AuditModule {}
