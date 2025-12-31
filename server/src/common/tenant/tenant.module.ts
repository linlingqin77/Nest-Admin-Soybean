import { Module, Global } from '@nestjs/common';
import { TenantHelper } from './tenant.helper';
import { TenantGuard } from './tenant.guard';
import { FeatureToggleService } from './feature-toggle.service';
import { RequireFeatureGuard } from './require-feature.guard';
import { TenantExportService } from './tenant-export.service';

@Global()
@Module({
  providers: [TenantHelper, TenantGuard, FeatureToggleService, RequireFeatureGuard, TenantExportService],
  exports: [TenantHelper, TenantGuard, FeatureToggleService, RequireFeatureGuard, TenantExportService],
})
export class TenantModule {}
