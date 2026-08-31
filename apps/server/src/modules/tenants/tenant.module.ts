import { Module } from '@nestjs/common';
import { TenantService } from './tenant.service';
import { TenantController } from './tenant.controller';
import { TenantDashboardService } from './dashboard/tenant-dashboard.service';
import { TenantDashboardController } from './dashboard/tenant-dashboard.controller';
import { TenantQuotaService } from './quota/tenant-quota.service';
import { TenantQuotaController } from './quota/tenant-quota.controller';
import { TenantAuditService } from './audit/tenant-audit.service';
import { TenantAuditController } from './audit/tenant-audit.controller';

@Module({
  controllers: [TenantController, TenantDashboardController, TenantQuotaController, TenantAuditController],
  providers: [TenantService, TenantDashboardService, TenantQuotaService, TenantAuditService],
  exports: [TenantService, TenantDashboardService, TenantQuotaService, TenantAuditService],
})
export class TenantModule {}
