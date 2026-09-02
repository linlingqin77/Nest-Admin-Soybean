import { Body, Controller, Delete, Get, Param, Post, Put, Query, Res } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { TenantPackageService } from './tenant-package.service';
import {
  CreateTenantPackageRequestDto,
  ListTenantPackageRequestDto,
  TenantPackageListResponseDto,
  TenantPackageResponseDto,
  TenantPackageSelectResponseDto,
  UpdateTenantPackageRequestDto,
} from './dto/index';
import { RequirePermission } from 'src/core/http/decorators/require-permission.decorator';
import { Response } from 'express';
import { Api } from 'src/core/http/decorators/api.decorator';
import { Operlog } from 'src/core/audit/decorators/operlog.decorator';
import { BusinessType } from 'src/shared/constants/business.constant';

@ApiTags('租户套餐管理')
@Controller('system/tenant/package')
@ApiBearerAuth('Authorization')
export class TenantPackageController {
  constructor(private readonly tenantPackageService: TenantPackageService) {}

  @Api({
    summary: '租户套餐管理-创建',
    description: '创建新租户套餐',
    body: CreateTenantPackageRequestDto,
  })
  @RequirePermission('system:tenantPackage:add')
  @Operlog({ businessType: BusinessType.INSERT })
  @Post('/')
  create(@Body() createTenantPackageDto: CreateTenantPackageRequestDto) {
    return this.tenantPackageService.create(createTenantPackageDto);
  }

  @Api({
    summary: '租户套餐管理-列表',
    description: '分页查询租户套餐列表',
    type: TenantPackageListResponseDto,
  })
  @RequirePermission('system:tenantPackage:list')
  @Get('/list')
  findAll(@Query() query: ListTenantPackageRequestDto) {
    return this.tenantPackageService.findAll(query);
  }

  @Api({
    summary: '租户套餐管理-选择框列表',
    description: '获取租户套餐选择框列表',
    type: TenantPackageSelectResponseDto,
    isArray: true,
  })
  @Get('/selectList')
  selectList() {
    return this.tenantPackageService.selectList();
  }

  @Api({
    summary: '租户套餐管理-详情',
    description: '根据ID获取租户套餐详情',
    type: TenantPackageResponseDto,
    params: [{ name: 'id', description: '套餐ID', type: 'number' }],
  })
  @RequirePermission('system:tenantPackage:query')
  @Get('/:id')
  findOne(@Param('id') id: string) {
    return this.tenantPackageService.findOne(+id);
  }

  @Api({
    summary: '租户套餐管理-更新',
    description: '修改租户套餐信息',
    body: UpdateTenantPackageRequestDto,
  })
  @RequirePermission('system:tenantPackage:edit')
  @Operlog({ businessType: BusinessType.UPDATE })
  @Put('/')
  update(@Body() updateTenantPackageDto: UpdateTenantPackageRequestDto) {
    return this.tenantPackageService.update(updateTenantPackageDto);
  }

  @Api({
    summary: '租户套餐管理-删除',
    description: '批量删除租户套餐',
    params: [{ name: 'ids', description: '套餐ID列表，逗号分隔', type: 'string' }],
  })
  @RequirePermission('system:tenantPackage:remove')
  @Operlog({ businessType: BusinessType.DELETE })
  @Delete('/:ids')
  remove(@Param('ids') ids: string) {
    const idArray = ids.split(',').map((id) => +id);
    return this.tenantPackageService.remove(idArray);
  }

  @Api({
    summary: '租户套餐管理-导出',
    description: '导出租户套餐数据为Excel文件',
  })
  @RequirePermission('system:tenantPackage:export')
  @Operlog({ businessType: BusinessType.EXPORT })
  @Get('/export')
  export(@Res() res: Response, @Query() query: ListTenantPackageRequestDto) {
    return this.tenantPackageService.export(res, query);
  }
}
