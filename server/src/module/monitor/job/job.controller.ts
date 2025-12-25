import { Controller, Get, Post, Body, Delete, Param, Put, Query, Req, Res } from '@nestjs/common';
import { Response } from 'express';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JobService } from './job.service';
import { CreateJobDto, ListJobDto } from './dto/create-job.dto';
import { RequirePermission } from 'src/common/decorators/require-premission.decorator';
import { Api } from 'src/common/decorators/api.decorator';
import { Operlog } from 'src/common/decorators/operlog.decorator';
import { BusinessType } from 'src/common/constant/business.constant';
import { User } from 'src/module/system/user/user.decorator';

@ApiTags('定时任务管理')
@Controller('monitor/job')
@ApiBearerAuth('Authorization')
export class JobController {
  constructor(private readonly jobService: JobService) {}

  @Api({
    summary: '获取定时任务列表',
    description: '分页查询定时任务列表',
  })
  @Get('list')
  @RequirePermission('monitor:job:list')
  list(@Query() query: ListJobDto) {
    return this.jobService.list(query);
  }

  @Api({
    summary: '获取定时任务详情',
    description: '根据任务ID获取定时任务详细信息',
    params: [{ name: 'jobId', description: '任务ID', type: 'number' }],
  })
  @Get(':jobId')
  @RequirePermission('monitor:job:query')
  getInfo(@Param('jobId') jobId: number) {
    return this.jobService.getJob(jobId);
  }

  @Api({
    summary: '创建定时任务',
    description: '新增定时任务',
    body: CreateJobDto,
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
    body: ListJobDto,
    produces: ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
  })
  @RequirePermission('monitor:job:export')
  @Operlog({ businessType: BusinessType.EXPORT })
  @Post('/export')
  async export(@Res() res: Response, @Body() body: ListJobDto): Promise<void> {
    return this.jobService.export(res, body);
  }
}
