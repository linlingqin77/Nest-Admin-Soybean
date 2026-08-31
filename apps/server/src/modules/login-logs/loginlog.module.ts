import { Module, Global } from '@nestjs/common';
import { LoginlogService } from './loginlog.service';
import { LoginlogController } from './loginlog.controller';
import { LoginlogRepository } from './loginlog.repository';
@Global()
@Module({
  controllers: [LoginlogController],
  providers: [LoginlogService, LoginlogRepository],
  exports: [LoginlogService],
})
export class LoginlogModule {}
