import { Controller, Get, Post, Body, Res, Param, Delete, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { Response } from 'express';
import { LoginlogService } from './loginlog.service';
import { ListLoginlogDto } from './dto/index';
import { RequirePermission } from 'src/common/decorators/require-permission.decorator';
import { Api } from 'src/common/decorators/api.decorator';
import { LoginLogListVo } from 'src/module/monitor/vo/monitor.vo';
import { Operlog } from 'src/common/decorators/operlog.decorator';
import { BusinessType } from 'src/common/constant/business.constant';

@ApiTags('登录日志')
@Controller('monitor/logininfor')
@ApiBearerAuth('Authorization')
export class LoginlogController {
  constructor(private readonly loginlogService: LoginlogService) {}

  @Api({
    summary: '登录日志-列表',
    description: '分页查询登录日志列表',
    type: LoginLogListVo,
  })
  @RequirePermission('monitor:logininfor:list')
  @Get('/list')
  findAll(@Query() query: ListLoginlogDto) {
    return this.loginlogService.findAll(query);
  }

  @Api({
    summary: '登录日志-清除全部日志',
    description: '清空所有登录日志记录',
  })
  @RequirePermission('monitor:logininfor:remove')
  @Operlog({ businessType: BusinessType.CLEAN })
  @Delete('/clean')
  removeAll() {
    return this.loginlogService.removeAll();
  }

  @Api({
    summary: '登录日志-解锁用户',
    description: '解锁被锁定的用户账号',
    params: [{ name: 'username', description: '用户名' }],
  })
  @RequirePermission('monitor:logininfor:unlock')
  @Operlog({ businessType: BusinessType.UPDATE })
  @Get('/unlock/:username')
  unlock(@Param('username') username: string) {
    return this.loginlogService.unlock(username);
  }

  @Api({
    summary: '登录日志-删除日志',
    description: '批量删除登录日志，多个ID用逗号分隔',
    params: [{ name: 'id', description: '登录日志ID，多个用逗号分隔' }],
  })
  @RequirePermission('monitor:logininfor:remove')
  @Operlog({ businessType: BusinessType.DELETE })
  @Delete(':id')
  remove(@Param('id') ids: string) {
    const infoIds = ids.split(',').map((id) => id);
    return this.loginlogService.remove(infoIds);
  }

  @Api({
    summary: '登录日志-导出Excel',
    description: '导出登录日志数据为xlsx文件',
    body: ListLoginlogDto,
    produces: ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
  })
  @RequirePermission('system:config:export')
  @Operlog({ businessType: BusinessType.EXPORT })
  @Post('/export')
  async export(@Res() res: Response, @Body() body: ListLoginlogDto): Promise<void> {
    return this.loginlogService.export(res, body);
  }
}
