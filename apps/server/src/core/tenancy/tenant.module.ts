import { Module, Global } from '@nestjs/common';
import { TenantHelper } from './services/tenant.helper';
import { TenantGuard } from './guards/tenant.guard';
import { FeatureToggleService } from './services/feature-toggle.service';
import { RequireFeatureGuard } from './guards/require-feature.guard';
import { TenantExportService } from './services/tenant-export.service';
import { RelationValidationService } from './services/relation-validation.service';
import { TenantQuotaService } from './services/quota.service';
import { RequireQuotaGuard } from './guards/require-quota.guard';
import { TenantLifecycleService } from './services/tenant-lifecycle.service';

@Global()
@Module({
  providers: [
    TenantHelper,
    TenantGuard,
    FeatureToggleService,
    RequireFeatureGuard,
    TenantExportService,
    RelationValidationService,
    TenantQuotaService,
    RequireQuotaGuard,
    TenantLifecycleService,
  ],
  exports: [
    TenantHelper,
    TenantGuard,
    FeatureToggleService,
    RequireFeatureGuard,
    TenantExportService,
    RelationValidationService,
    TenantQuotaService,
    RequireQuotaGuard,
    TenantLifecycleService,
  ],
})
export class TenantModule {}
