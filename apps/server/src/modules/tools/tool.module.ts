import { Module } from '@nestjs/common';
import { ToolService } from './tool.service';
import { ToolController } from './tool.controller';
import { ToolRepository } from './tool.repository';
import { DataSourceController, DataSourceService } from './datasource';
import { FieldInferenceService } from './inference';
import { GenTableService } from './gen-table.service';
import { TemplateController, TemplateService } from './template';
import { PreviewService } from './preview';
import { HistoryController, HistoryService } from './history';

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
