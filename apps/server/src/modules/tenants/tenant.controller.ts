import { Controller, Get, Post, Body, Put, Param, Delete, Res, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { TenantService } from './tenant.service';
import {
  CreateTenantRequestDto,
  UpdateTenantRequestDto,
  ListTenantRequestDto,
  SyncTenantPackageRequestDto,
  TenantResponseDto,
  TenantListResponseDto,
  TenantSwitchResponseDto,
  TenantRestoreResponseDto,
  TenantSelectListResponseDto,
  CreateTenantResultResponseDto,
  UpdateTenantResultResponseDto,
  DeleteTenantResultResponseDto,
  SyncTenantDictResultResponseDto,
  SyncTenantPackageResultResponseDto,
  SyncTenantConfigResultResponseDto,
  TenantSwitchStatusResponseDto,
} from './dto/index';
import { RequirePermission } from 'src/core/http/decorators/require-permission.decorator';
import { Response } from 'express';
import { Api } from 'src/core/http/decorators/api.decorator';
import { Operlog } from 'src/core/audit/decorators/operlog.decorator';
import { BusinessType } from 'src/shared/constants/business.constant';
import { User, UserDto } from 'src/modules/users/user.decorator';

@ApiTags('租户管理')
@Controller('system/tenant')
@ApiBearerAuth('Authorization')
export class TenantController {
  constructor(private readonly tenantService: TenantService) {}

  @Api({
    summary: '租户管理-创建',
    description: '创建新租户并创建租户管理员账号',
    body: CreateTenantRequestDto,
    type: CreateTenantResultResponseDto,
  })
  @RequirePermission('system:tenant:add')
  @Operlog({ businessType: BusinessType.INSERT })
  @Post('/')
  create(@Body() createTenantDto: CreateTenantRequestDto) {
    return this.tenantService.create(createTenantDto);
  }

  @Api({
    summary: '租户管理-列表',
    description: '分页查询租户列表',
    type: TenantListResponseDto,
  })
  @RequirePermission('system:tenant:list')
  @Get('/list')
  findAll(@Query() query: ListTenantRequestDto) {
    return this.tenantService.findAll(query);
  }

  @Api({
    summary: '租户管理-同步租户字典',
    description: '将超级管理员的字典数据同步到所有租户',
    type: SyncTenantDictResultResponseDto,
  })
  @RequirePermission('system:tenant:edit')
  @Get('/syncTenantDict')
  syncTenantDict() {
    return this.tenantService.syncTenantDict();
  }

  @Api({
    summary: '租户管理-同步租户套餐',
    description: '同步租户套餐菜单权限',
    type: SyncTenantPackageResultResponseDto,
  })
  @RequirePermission('system:tenant:edit')
  @Get('/syncTenantPackage')
  syncTenantPackage(@Query() params: SyncTenantPackageRequestDto) {
    return this.tenantService.syncTenantPackage(params);
  }

  @Api({
    summary: '租户管理-同步租户配置',
    description: '将超级管理员的配置同步到所有租户',
    type: SyncTenantConfigResultResponseDto,
  })
  @RequirePermission('system:tenant:edit')
  @Get('/syncTenantConfig')
  syncTenantConfig() {
    return this.tenantService.syncTenantConfig();
  }

  @Api({
    summary: '租户管理-可切换租户列表',
    description: '获取可切换的租户列表（仅超级管理员可用）',
    type: TenantSelectListResponseDto,
  })
  @RequirePermission('system:tenant:switch')
  @Get('/select-list')
  getSelectList(@User() user: UserDto) {
    return this.tenantService.getSelectList(user);
  }

  @Api({
    summary: '租户管理-获取切换状态',
    description: '获取当前租户切换状态',
    type: TenantSwitchStatusResponseDto,
  })
  @Get('/switch-status')
  getSwitchStatus(@User() user: UserDto) {
    return this.tenantService.getSwitchStatus(user);
  }

  @Api({
    summary: '租户管理-切换租户',
    description: '切换到指定租户（仅超级管理员可用）',
    type: TenantSwitchResponseDto,
    params: [{ name: 'tenantId', description: '目标租户ID', type: 'string' }],
  })
  @RequirePermission('system:tenant:switch')
  @Operlog({ businessType: BusinessType.UPDATE })
  @Get('/dynamic/:tenantId')
  switchTenant(@Param('tenantId') tenantId: string, @User() user: UserDto) {
    return this.tenantService.switchTenant(tenantId, user);
  }

  @Api({
    summary: '租户管理-恢复原租户',
    description: '清除租户切换状态，恢复到原租户',
    type: TenantRestoreResponseDto,
  })
  @RequirePermission('system:tenant:switch')
  @Operlog({ businessType: BusinessType.UPDATE })
  @Get('/dynamic/clear')
  restoreTenant(@User() user: UserDto) {
    return this.tenantService.restoreTenant(user);
  }

  @Api({
    summary: '租户管理-详情',
    description: '根据ID获取租户详情',
    type: TenantResponseDto,
    params: [{ name: 'id', description: '租户ID', type: 'number' }],
  })
  @RequirePermission('system:tenant:query')
  @Get('/:id')
  findOne(@Param('id') id: string) {
    return this.tenantService.findOne(+id);
  }

  @Api({
    summary: '租户管理-更新',
    description: '修改租户信息',
    body: UpdateTenantRequestDto,
    type: UpdateTenantResultResponseDto,
  })
  @RequirePermission('system:tenant:edit')
  @Operlog({ businessType: BusinessType.UPDATE })
  @Put('/')
  update(@Body() updateTenantDto: UpdateTenantRequestDto) {
    return this.tenantService.update(updateTenantDto);
  }

  @Api({
    summary: '租户管理-删除',
    description: '批量删除租户',
    params: [{ name: 'ids', description: '租户ID列表，逗号分隔', type: 'string' }],
    type: DeleteTenantResultResponseDto,
  })
  @RequirePermission('system:tenant:remove')
  @Operlog({ businessType: BusinessType.DELETE })
  @Delete('/:ids')
  remove(@Param('ids') ids: string) {
    const idArray = ids.split(',').map((id) => +id);
    return this.tenantService.remove(idArray);
  }

  @Api({
    summary: '租户管理-导出',
    description: '导出租户数据为Excel文件',
  })
  @RequirePermission('system:tenant:export')
  @Operlog({ businessType: BusinessType.EXPORT })
  @Post('/export')
  export(@Res() res: Response, @Body() body: ListTenantRequestDto) {
    return this.tenantService.export(res, body);
  }
}
