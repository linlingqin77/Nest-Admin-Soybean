import { Controller, Get, Delete, Query, Post, Res, Body } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JobLogService } from './job-log.service';
import { RequirePermission } from 'src/core/http/decorators/require-permission.decorator';
import { ListJobLogRequestDto } from './dto/create-job.dto';
import { Response } from 'express';
import { Api } from 'src/core/http/decorators/api.decorator';
import { JobLogListResponseDto, ClearLogResultResponseDto } from 'src/modules/monitors/dto/responses';
import { Operlog } from 'src/core/audit/decorators/operlog.decorator';
import { BusinessType } from 'src/shared/constants/business.constant';

@ApiTags('定时任务日志管理')
@Controller('monitor/jobLog')
@ApiBearerAuth('Authorization')
export class JobLogController {
  constructor(private readonly jobLogService: JobLogService) {}

  @Api({
    summary: '获取定时任务日志列表',
    description: '分页查询定时任务执行日志',
    type: JobLogListResponseDto,
  })
  @Get('list')
  @RequirePermission('monitor:job:list')
  findAll(@Query() query: ListJobLogRequestDto) {
    return this.jobLogService.findAll(query);
  }

  @Api({
    summary: '清空定时任务日志',
    description: '清除所有定时任务执行日志',
    type: ClearLogResultResponseDto,
  })
  @Delete('clean')
  @RequirePermission('monitor:job:remove')
  @Operlog({ businessType: BusinessType.CLEAN })
  clean() {
    return this.jobLogService.clean();
  }

  @Api({
    summary: '导出调度日志Excel',
    description: '导出定时任务执行日志为xlsx文件',
    body: ListJobLogRequestDto,
    produces: ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
  })
  @RequirePermission('monitor:job:export')
  @Operlog({ businessType: BusinessType.EXPORT })
  @Post('/export')
  async export(@Res() res: Response, @Body() body: ListJobLogRequestDto): Promise<void> {
    return this.jobLogService.export(res, body);
  }
}
