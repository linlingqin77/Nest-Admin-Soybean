import { Controller, Get, Post, Body, Put, Param, Delete, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { ClientService } from './client.service';
import {
  CreateClientDto,
  UpdateClientDto,
  ChangeClientStatusDto,
  ListClientDto,
  ClientResponseDto,
  ClientListResponseDto,
} from './dto/index';
import { RequirePermission } from 'src/core/http/decorators/require-permission.decorator';
import { Api } from 'src/core/http/decorators/api.decorator';
import { Operlog } from 'src/core/audit/decorators/operlog.decorator';
import { BusinessType } from 'src/shared/constants/business.constant';
import { UserTool, UserToolType } from '../users/user.decorator';

@ApiTags('客户端管理')
@Controller('system/client')
@ApiBearerAuth('Authorization')
export class ClientController {
  constructor(private readonly clientService: ClientService) {}

  @Api({
    summary: '客户端管理-创建',
    description: '创建客户端',
    body: CreateClientDto,
  })
  @RequirePermission('system:client:add')
  @Operlog({ businessType: BusinessType.INSERT })
  @Post()
  create(@Body() createClientDto: CreateClientDto, @UserTool() { injectCreate }: UserToolType) {
    return this.clientService.create(injectCreate(createClientDto));
  }

  @Api({
    summary: '客户端管理-列表',
    description: '分页查询客户端列表',
    type: ClientListResponseDto,
  })
  @RequirePermission('system:client:list')
  @Get('/list')
  findAll(@Query() query: ListClientDto) {
    return this.clientService.findAll(query);
  }

  @Api({
    summary: '客户端管理-详情',
    description: '根据ID获取客户端详情',
    type: ClientResponseDto,
    params: [{ name: 'id', description: '客户端ID', type: 'number' }],
  })
  @RequirePermission('system:client:query')
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.clientService.findOne(+id);
  }

  @Api({
    summary: '客户端管理-更新',
    description: '修改客户端',
    body: UpdateClientDto,
  })
  @RequirePermission('system:client:edit')
  @Operlog({ businessType: BusinessType.UPDATE })
  @Put()
  update(@Body() updateClientDto: UpdateClientDto) {
    return this.clientService.update(updateClientDto);
  }

  @Api({
    summary: '客户端管理-修改状态',
    description: '修改客户端状态',
    body: ChangeClientStatusDto,
  })
  @RequirePermission('system:client:edit')
  @Operlog({ businessType: BusinessType.UPDATE })
  @Put('/changeStatus')
  changeStatus(@Body() dto: ChangeClientStatusDto) {
    return this.clientService.changeStatus(dto);
  }

  @Api({
    summary: '客户端管理-删除',
    description: '批量删除客户端，多个ID用逗号分隔',
    params: [{ name: 'ids', description: '客户端ID，多个用逗号分隔' }],
  })
  @RequirePermission('system:client:remove')
  @Operlog({ businessType: BusinessType.DELETE })
  @Delete(':ids')
  remove(@Param('ids') ids: string) {
    const clientIds = ids.split(',').map((id) => +id);
    return this.clientService.remove(clientIds);
  }
}
