import { Global, Module } from '@nestjs/common';
import { DeptService } from './dept.service';
import { DeptController } from './dept.controller';
import { DeptRepository } from './dept.repository';

@Global()
@Module({
  controllers: [DeptController],
  providers: [DeptService, DeptRepository],
  exports: [DeptService],
})
export class DeptModule {}
