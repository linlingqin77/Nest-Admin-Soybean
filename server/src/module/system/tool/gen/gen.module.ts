/**
 * 代码生成模块
 */
import { Module } from '@nestjs/common';
import { GenController } from './gen.controller';
import { CodeGeneratorService } from './services/code-generator.service';
import { DatabaseIntrospectorService } from './services/database-introspector.service';
import { TemplateEngineService } from './services/template-engine.service';

@Module({
  controllers: [GenController],
  providers: [
    CodeGeneratorService,
    DatabaseIntrospectorService,
    TemplateEngineService,
  ],
  exports: [
    CodeGeneratorService,
    DatabaseIntrospectorService,
    TemplateEngineService,
  ],
})
export class GenModule {}
