import { Controller, Get } from '@nestjs/common';
import { ServerService } from './server.service';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { Api } from 'src/core/http/decorators/api.decorator';
import { ServerInfoResponseDto } from 'src/modules/monitors/dto/responses';

@ApiTags('系统监控-服务监控')
@ApiBearerAuth('Authorization')
@Controller('monitor/server')
export class ServerController {
  constructor(private readonly serverService: ServerService) {}

  @Api({
    summary: '服务器信息',
    description: '获取服务器CPU、内存、系统等监控信息',
    type: ServerInfoResponseDto,
  })
  @Get()
  getInfo() {
    return this.serverService.getInfo();
  }
}
