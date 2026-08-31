import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { TenantDashboardService } from './tenant-dashboard.service';
import {
  DashboardTimeRangeQueryDto,
  ExpiringTenantsQueryDto,
  DashboardDataResponseDto,
  TenantStatsVo,
  TenantTrendDataVo,
  PackageDistributionVo,
  ExpiringTenantVo,
  QuotaTopTenantVo,
  DashboardDataVo,
} from './dto/index';
import { RequirePermission } from 'src/core/http/decorators/require-permission.decorator';
import { Api } from 'src/core/http/decorators/api.decorator';

/**
 * 租户仪表盘控制器
 *
 * 提供租户统计数据、趋势图表、套餐分布等仪表盘接口
 * Requirements: 4.1, 4.2, 4.3, 4.4, 4.5
 */
@ApiTags('租户仪表盘')
@Controller('system/tenant/dashboard')
@ApiBearerAuth('Authorization')
export class TenantDashboardController {
  constructor(private readonly dashboardService: TenantDashboardService) {}

  @Api({
    summary: '租户仪表盘-统计数据',
    description: '获取租户总数、活跃数、用户数等统计卡片数据',
    type: TenantStatsVo,
  })
  @RequirePermission('system:tenant:dashboard')
  @Get('/stats')
  getStats() {
    return this.dashboardService.getStats();
  }

  @Api({
    summary: '租户仪表盘-增长趋势',
    description: '获取指定时间范围内的租户增长趋势数据',
    type: TenantTrendDataVo,
    isArray: true,
  })
  @RequirePermission('system:tenant:dashboard')
  @Get('/trend')
  getTrend(@Query() query: DashboardTimeRangeQueryDto) {
    return this.dashboardService.getTrend(query.beginTime, query.endTime);
  }

  @Api({
    summary: '租户仪表盘-套餐分布',
    description: '获取租户套餐分布饼图数据',
    type: PackageDistributionVo,
    isArray: true,
  })
  @RequirePermission('system:tenant:dashboard')
  @Get('/package-distribution')
  getPackageDistribution() {
    return this.dashboardService.getPackageDistribution();
  }

  @Api({
    summary: '租户仪表盘-即将到期租户',
    description: '获取指定天数内即将到期的租户列表',
    type: ExpiringTenantVo,
    isArray: true,
  })
  @RequirePermission('system:tenant:dashboard')
  @Get('/expiring-tenants')
  getExpiringTenants(@Query() query: ExpiringTenantsQueryDto) {
    return this.dashboardService.getExpiringTenants(query.days);
  }

  @Api({
    summary: '租户仪表盘-配额使用TOP10',
    description: '获取配额使用率最高的10个租户',
    type: QuotaTopTenantVo,
    isArray: true,
  })
  @RequirePermission('system:tenant:dashboard')
  @Get('/quota-top')
  getQuotaTopTenants() {
    return this.dashboardService.getQuotaTopTenants();
  }

  @Api({
    summary: '租户仪表盘-完整数据',
    description: '获取仪表盘所有数据（统计、趋势、分布、到期列表、TOP10）',
    type: DashboardDataVo,
  })
  @RequirePermission('system:tenant:dashboard')
  @Get('/')
  getDashboardData(@Query() query: DashboardTimeRangeQueryDto) {
    return this.dashboardService.getDashboardData(query.beginTime, query.endTime);
  }
}
