import { PartialType } from '@nestjs/swagger';
import { CreateTenantPackageDto } from './create-tenant-package.dto';
import { IsNumber, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateTenantPackageDto extends PartialType(CreateTenantPackageDto) {
  @ApiProperty({ required: true, description: '套餐ID' })
  @IsNumber()
  @IsNotEmpty()
  packageId: number;
}
