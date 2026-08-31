import { Module } from '@nestjs/common';
import { MainService } from './main.service';
import { MainController } from './main.controller';
import { AuthController } from './auth.controller';

@Module({
  controllers: [MainController, AuthController],
  providers: [MainService],
})
export class MainModule {}
