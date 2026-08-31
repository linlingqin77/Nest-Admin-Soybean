import { Global, Module } from '@nestjs/common';
import { OperlogService } from './operlog.service';
import { OperlogController } from './operlog.controller';
import { OperlogRepository } from './operlog.repository';
@Global()
@Module({
  controllers: [OperlogController],
  providers: [OperlogService, OperlogRepository],
  exports: [OperlogService],
})
export class OperlogModule {}
