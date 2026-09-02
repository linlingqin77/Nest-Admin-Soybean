import { Controller, Delete, Get, Param, Query, Res } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { LoginlogService } from './loginlog.service';
import { ListLoginlogRequestDto } from './dto/index';
import { RequirePermission } from 'src/core/http/decorators/require-permission.decorator';
import { Api } from 'src/core/http/decorators/api.decorator';
import {
  ClearLogResultResponseDto,
  DeleteLogResultResponseDto,
  LoginLogListResponseDto,
  UnlockUserResultResponseDto,
} from 'src/modules/monitors/dto/responses';
import { Operlog } from 'src/core/audit/decorators/operlog.decorator';
import { BusinessType } from 'src/shared/constants/business.constant';

@ApiTags('登录日志')
@Controller('monitor/logininfor')
@ApiBearerAuth('Authorization')
export class LoginlogController {
  constructor(private readonly loginlogService: LoginlogService) {}

  @Api({
    summary: '登录日志-列表',
    description: '分页查询登录日志列表',
    type: LoginLogListResponseDto,
  })
  @RequirePermission('monitor:logininfor:list')
  @Get('/list')
  findAll(@Query() query: ListLoginlogRequestDto) {
    return this.loginlogService.findAll(query);
  }

  @Api({
    summary: '登录日志-清除全部日志',
    description: '清空所有登录日志记录',
    type: ClearLogResultResponseDto,
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
    type: UnlockUserResultResponseDto,
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
    type: DeleteLogResultResponseDto,
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
    body: ListLoginlogRequestDto,
    produces: ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
  })
  @RequirePermission('system:config:export')
  @Operlog({ businessType: BusinessType.EXPORT })
  @Get('/export')
  async export(@Res() res: Response, @Query() query: ListLoginlogRequestDto): Promise<void> {
    return this.loginlogService.export(res, query);
  }
}
