import { Controller, Get, Put, Post, Query, Body, Param } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { TenantQuotaService } from './tenant-quota.service';
import { ListTenantQuotaDto, UpdateTenantQuotaDto, CheckQuotaDto } from './dto/index';
import { RequirePermission } from 'src/core/http/decorators/require-permission.decorator';
import { Api } from 'src/core/http/decorators/api.decorator';
import { User } from 'src/modules/users/user.decorator';
import { TenantQuotaResponseDto } from './dto';

/**
 * 租户配额管理控制器
 *
 * 提供租户配额查询、更新、检查等接口
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6
 */
@ApiTags('租户配额管理')
@Controller('system/tenant/quota')
@ApiBearerAuth('Authorization')
export class TenantQuotaController {
  constructor(private readonly quotaService: TenantQuotaService) {}

  @Api({
    summary: '租户配额列表',
    description: '分页查询所有租户的配额使用情况',
    type: TenantQuotaResponseDto,
  })
  @RequirePermission('system:tenant:quota:list')
  @Get('/list')
  findAll(@Query() query: ListTenantQuotaDto) {
    return this.quotaService.findAll(query);
  }

  @Api({
    summary: '租户配额详情',
    description: '获取单个租户的配额详情，包含变更历史',
    type: TenantQuotaResponseDto,
  })
  @RequirePermission('system:tenant:quota:query')
  @Get('/:tenantId')
  findOne(@Param('tenantId') tenantId: string) {
    return this.quotaService.findOne(tenantId);
  }

  @Api({
    summary: '更新租户配额',
    description: '修改租户的配额限制值',
  })
  @RequirePermission('system:tenant:quota:edit')
  @Put('/')
  update(@Body() dto: UpdateTenantQuotaDto, @User('user.userName') userName: string) {
    return this.quotaService.update(dto, userName || 'system');
  }

  @Api({
    summary: '检查配额',
    description: '检查指定租户的配额是否允许操作',
    type: TenantQuotaResponseDto,
  })
  @RequirePermission('system:tenant:quota:query')
  @Post('/check')
  checkQuota(@Body() dto: CheckQuotaDto) {
    return this.quotaService.checkQuota(dto);
  }
}
