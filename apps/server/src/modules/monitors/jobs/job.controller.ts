import { Controller, Get, Post, Body, Delete, Param, Put, Query, Req, Res } from '@nestjs/common';
import { Response } from 'express';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JobService } from './job.service';
import { CreateJobDto, ListJobRequestDto } from './dto/create-job.dto';
import { RequirePermission } from 'src/core/http/decorators/require-permission.decorator';
import { Api } from 'src/core/http/decorators/api.decorator';
import {
  JobListResponseDto,
  JobResponseDto,
  CreateJobResultResponseDto,
  UpdateJobResultResponseDto,
  DeleteJobResultResponseDto,
  ChangeJobStatusResultResponseDto,
  RunJobResultResponseDto,
} from 'src/modules/monitors/dto/responses';
import { Operlog } from 'src/core/audit/decorators/operlog.decorator';
import { BusinessType } from 'src/shared/constants/business.constant';
import { User } from 'src/modules/users/user.decorator';

@ApiTags('定时任务管理')
@Controller('monitor/job')
@ApiBearerAuth('Authorization')
export class JobController {
  constructor(private readonly jobService: JobService) {}

  @Api({
    summary: '获取定时任务列表',
    description: '分页查询定时任务列表',
    type: JobListResponseDto,
  })
  @Get('list')
  @RequirePermission('monitor:job:list')
  findAll(@Query() query: ListJobRequestDto) {
    return this.jobService.findAll(query);
  }

  @Api({
    summary: '获取定时任务详情',
    description: '根据任务ID获取定时任务详细信息',
    params: [{ name: 'jobId', description: '任务ID', type: 'number' }],
    type: JobResponseDto,
  })
  @Get(':jobId')
  @RequirePermission('monitor:job:query')
  getInfo(@Param('jobId') jobId: number) {
    return this.jobService.findOne(jobId);
  }

  @Api({
    summary: '创建定时任务',
    description: '新增定时任务',
    body: CreateJobDto,
    type: CreateJobResultResponseDto,
  })
  @Post()
  @RequirePermission('monitor:job:add')
  @Operlog({ businessType: BusinessType.INSERT })
  add(@Body() createJobDto: CreateJobDto, @User('user.userName') userName: string) {
    return this.jobService.create(createJobDto, userName);
  }

  @Api({
    summary: '修改任务状态',
    description: '启用或停用定时任务',
    type: ChangeJobStatusResultResponseDto,
  })
  @Put('changeStatus')
  @RequirePermission('monitor:job:changeStatus')
  @Operlog({ businessType: BusinessType.UPDATE })
  changeStatus(@Body('jobId') jobId: number, @Body('status') status: string, @User('user.userName') userName: string) {
    return this.jobService.changeStatus(jobId, status, userName);
  }

  @Api({
    summary: '修改定时任务',
    description: '更新定时任务信息',
    type: UpdateJobResultResponseDto,
  })
  @Put('')
  @RequirePermission('monitor:job:edit')
  @Operlog({ businessType: BusinessType.UPDATE })
  update(
    @Body('jobId') jobId: number,
    @Body() updateJobDto: Partial<CreateJobDto>,
    @User('user.userName') userName: string,
  ) {
    return this.jobService.update(jobId, updateJobDto, userName);
  }

  @Api({
    summary: '删除定时任务',
    description: '批量删除定时任务，多个ID用逗号分隔',
    params: [{ name: 'jobIds', description: '任务ID，多个用逗号分隔' }],
    type: DeleteJobResultResponseDto,
  })
  @Delete(':jobIds')
  @RequirePermission('monitor:job:remove')
  @Operlog({ businessType: BusinessType.DELETE })
  remove(@Param('jobIds') jobIds: string) {
    return this.jobService.remove(jobIds.split(',').map((id) => +id));
  }

  @Api({
    summary: '立即执行一次',
    description: '手动触发定时任务执行',
    type: RunJobResultResponseDto,
  })
  @Put('/run')
  @RequirePermission('monitor:job:changeStatus')
  @Operlog({ businessType: BusinessType.UPDATE })
  run(@Body('jobId') jobId: number) {
    return this.jobService.run(jobId);
  }

  @Api({
    summary: '导出定时任务Excel',
    description: '导出定时任务数据为xlsx文件',
    body: ListJobRequestDto,
    produces: ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
  })
  @RequirePermission('monitor:job:export')
  @Operlog({ businessType: BusinessType.EXPORT })
  @Post('/export')
  async export(@Res() res: Response, @Body() body: ListJobRequestDto): Promise<void> {
    return this.jobService.export(res, body);
  }
}
