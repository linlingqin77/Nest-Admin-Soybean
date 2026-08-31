import { Controller, Get, Post, Query, Param, Body, Res } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { Response } from 'express';
import { TenantAuditService } from './tenant-audit.service';
import {
  ListTenantAuditLogDto,
  ExportTenantAuditLogDto,
  TenantAuditLogResponseDto,
  TenantAuditLogStatsResponseDto,
  TenantAuditLogListVo,
  TenantAuditLogDetailVo,
  TenantAuditLogStatsVo,
} from './dto/index';
import { RequirePermission } from 'src/core/http/decorators/require-permission.decorator';
import { Api } from 'src/core/http/decorators/api.decorator';

/**
 * 租户审计日志控制器
 *
 * 提供租户审计日志查询、筛选、导出等接口
 * Requirements: 6.1, 6.2, 6.3, 6.4, 6.5
 */
@ApiTags('租户审计日志')
@Controller('system/tenant/audit')
@ApiBearerAuth('Authorization')
export class TenantAuditController {
  constructor(private readonly auditService: TenantAuditService) {}

  @Api({
    summary: '审计日志列表',
    description: '分页查询所有租户的审计日志',
    type: TenantAuditLogListVo,
  })
  @RequirePermission('system:tenant:audit:list')
  @Get('/list')
  findAll(@Query() query: ListTenantAuditLogDto) {
    return this.auditService.findAll(query);
  }

  @Api({
    summary: '审计日志详情',
    description: '获取单条审计日志的详细信息，包含操作前后数据变化',
    type: TenantAuditLogDetailVo,
  })
  @RequirePermission('system:tenant:audit:query')
  @Get('/:id')
  findOne(@Param('id') id: string) {
    return this.auditService.findOne(parseInt(id, 10));
  }

  @Api({
    summary: '审计日志统计',
    description: '获取审计日志统计数据',
    type: TenantAuditLogStatsVo,
  })
  @RequirePermission('system:tenant:audit:list')
  @Get('/stats/summary')
  getStats(@Query('tenantId') tenantId?: string) {
    return this.auditService.getStats(tenantId);
  }

  @Api({
    summary: '导出审计日志',
    description: '导出审计日志为Excel格式',
  })
  @RequirePermission('system:tenant:audit:export')
  @Post('/export')
  async export(@Body() query: ExportTenantAuditLogDto, @Res() res: Response) {
    const data = await this.auditService.export(query);

    // 设置响应头
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=audit_log_${Date.now()}.xlsx`);

    // 简单的CSV格式导出（实际项目中可使用exceljs等库生成Excel）
    const headers = ['ID', '租户ID', '企业名称', '操作人', '操作类型', '操作描述', '模块', 'IP地址', '操作时间'];

    const csvContent = [
      headers.join(','),
      ...data.map((row) =>
        [
          row.id,
          row.tenantId,
          row.companyName ?? '',
          row.operatorName,
          row.actionType,
          `"${row.actionDesc.replace(/"/g, '""')}"`,
          row.modules,
          row.ipAddress,
          row.operateTime instanceof Date ? row.operateTime.toISOString() : row.operateTime,
        ].join(','),
      ),
    ].join('\n');

    // 添加BOM以支持中文
    const bom = '\uFEFF';
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename=audit_log_${Date.now()}.csv`);
    res.send(bom + csvContent);
  }
}
