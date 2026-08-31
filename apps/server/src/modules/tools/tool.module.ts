import { Module } from '@nestjs/common';
import { ToolService } from './tool.service';
import { ToolController } from './tool.controller';
import { ToolRepository } from './tool.repository';
import { DataSourceService, DataSourceController } from './datasource';
import { FieldInferenceService } from './inference';
import { GenTableService } from './gen-table.service';
import { TemplateService, TemplateController } from './template';
import { PreviewService } from './preview';
import { HistoryService, HistoryController } from './history';

@Module({
  imports: [],
  controllers: [ToolController, DataSourceController, TemplateController, HistoryController],
  providers: [
    ToolService,
    ToolRepository,
    DataSourceService,
    FieldInferenceService,
    GenTableService,
    TemplateService,
    PreviewService,
    HistoryService,
  ],
  exports: [FieldInferenceService, GenTableService, TemplateService, PreviewService, HistoryService],
})
export class ToolModule {}
