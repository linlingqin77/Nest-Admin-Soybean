import { Controller, Get, Param, Delete, Query, Post, Res, Body } from '@nestjs/common';
import { OperlogService } from './operlog.service';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { RequirePermission } from 'src/common/decorators/require-permission.decorator';
import { Operlog } from 'src/common/decorators/operlog.decorator';
import { BusinessType } from 'src/common/constant/business.constant';
import { BaseOperLogDto, QueryOperLogDto } from './dto/operLog.dto';
import { Api } from 'src/common/decorators/api.decorator';
import { Response } from 'express';
import { OperLogListVo, OperLogVo } from 'src/module/monitor/vo/monitor.vo';

@ApiTags('操作日志')
@Controller('monitor/operlog')
@ApiBearerAuth('Authorization')
export class OperlogController {
  constructor(private readonly operlogService: OperlogService) {}

  @Api({
    summary: '操作日志-清除全部日志',
    description: '清空所有操作日志记录',
  })
  @RequirePermission('monitor:operlog:remove')
  @Delete('/clean')
  @Operlog({ businessType: BusinessType.CLEAN })
  removeAll() {
    return this.operlogService.removeAll();
  }

  @Api({
    summary: '操作日志-列表',
    description: '分页查询操作日志列表',
    type: OperLogListVo,
  })
  @RequirePermission('monitor:operlog:list')
  @Get('/list')
  findAll(@Query() query: QueryOperLogDto) {
    return this.operlogService.findAll(query);
  }

  @Api({
    summary: '操作日志-详情',
    description: '根据日志ID获取操作日志详情',
    params: [{ name: 'operId', description: '操作日志ID', type: 'number' }],
    type: OperLogVo,
  })
  @RequirePermission('monitor:operlog:query')
  @Get(':operId')
  findOne(@Param('operId') operId: string) {
    return this.operlogService.findOne(+operId);
  }

  @Api({
    summary: '操作日志-删除',
    description: '删除指定操作日志记录',
    params: [{ name: 'operId', description: '操作日志ID', type: 'number' }],
  })
  @RequirePermission('monitor:operlog:remove')
  @Operlog({ businessType: BusinessType.DELETE })
  @Delete(':operId')
  remove(@Param('operId') operId: string) {
    return this.operlogService.remove(+operId);
  }

  @Api({
    summary: '操作日志-导出Excel',
    description: '导出操作日志数据为xlsx文件',
    body: QueryOperLogDto,
    produces: ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
  })
  @RequirePermission('monitor:operlog:export')
  @Operlog({ businessType: BusinessType.EXPORT })
  @Post('/export')
  async exportData(@Res() res: Response, @Body() body: QueryOperLogDto): Promise<void> {
    return this.operlogService.export(res, body);
  }
}
