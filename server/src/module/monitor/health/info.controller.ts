import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { NotRequireAuth } from 'src/module/system/user/user.decorator';
import { InfoService, AppInfo } from './info.service';

/**
 * 应用信息控制器
 * 提供 /info 端点返回应用版本、启动时间、Node.js 版本等信息
 */
@ApiTags('应用信息')
@Controller('info')
export class InfoController {
  constructor(private readonly infoService: InfoService) {}

  @Get()
  @NotRequireAuth()
  @ApiOperation({ summary: '获取应用信息' })
  @ApiResponse({
    status: 200,
    description: '返回应用信息，包含版本、启动时间、Node.js 版本等',
  })
  getInfo(): AppInfo {
    return this.infoService.getInfo();
  }
}
