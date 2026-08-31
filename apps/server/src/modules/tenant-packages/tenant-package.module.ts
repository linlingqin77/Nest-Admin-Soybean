import { Module } from '@nestjs/common';
import { TenantPackageService } from './tenant-package.service';
import { TenantPackageController } from './tenant-package.controller';
import { TenantPackageRepository } from './tenant-package.repository';

@Module({
  controllers: [TenantPackageController],
  providers: [TenantPackageService, TenantPackageRepository],
  exports: [TenantPackageService],
})
export class TenantPackageModule {}
