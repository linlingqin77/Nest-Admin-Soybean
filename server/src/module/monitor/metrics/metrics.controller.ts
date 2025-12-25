import { Controller, Get, Res } from '@nestjs/common';
import { ApiTags, ApiExcludeEndpoint } from '@nestjs/swagger';
import { PrometheusController } from '@willsoto/nestjs-prometheus';
import { NotRequireAuth } from 'src/module/system/user/user.decorator';
import { Response } from 'express';

@ApiTags('系统指标监控')
@Controller()
export class MetricsController extends PrometheusController {
  @Get('/metrics')
  @NotRequireAuth()
  @ApiExcludeEndpoint() // 从 Swagger 文档中排除
  async index(@Res() response: Response) {
    return super.index(response);
  }
}
