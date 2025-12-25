import { Controller, Get, Param, Delete, Query } from '@nestjs/common';
import { OnlineService } from './online.service';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { OnlineListDto } from './dto/index';
import { RequirePermission } from 'src/common/decorators/require-premission.decorator';
import { Api } from 'src/common/decorators/api.decorator';
import { OnlineUserListVo } from 'src/module/monitor/vo/monitor.vo';
import { Operlog } from 'src/common/decorators/operlog.decorator';
import { BusinessType } from 'src/common/constant/business.constant';

@ApiTags('系统监控-在线用户')
@Controller('monitor/online')
@ApiBearerAuth('Authorization')
export class OnlineController {
  constructor(private readonly onlineService: OnlineService) {}

  @Api({
    summary: '在线用户-列表',
    description: '查询当前在线用户列表',
    type: OnlineUserListVo,
  })
  @RequirePermission('monitor:online:list')
  @Get('/list')
  findAll(@Query() query: OnlineListDto) {
    return this.onlineService.findAll(query);
  }

  @Api({
    summary: '在线用户-强退',
    description: '强制用户下线',
    params: [{ name: 'token', description: '用户会话Token' }],
  })
  @RequirePermission('monitor:online:forceLogout')
  @Operlog({ businessType: BusinessType.FORCE })
  @Delete('/:token')
  delete(@Param('token') token: string) {
    return this.onlineService.delete(token);
  }
}
