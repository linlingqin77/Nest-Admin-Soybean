import { Module } from '@nestjs/common';
import { ToolService } from './tool.service';
import { ToolController } from './tool.controller';
import { ToolRepository } from './tool.repository';
import { GenModule } from './gen/gen.module';

@Module({
  imports: [GenModule],
  controllers: [ToolController],
  providers: [ToolService, ToolRepository],
  exports: [GenModule],
})
export class ToolModule {}
