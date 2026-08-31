import { PartialType } from '@nestjs/swagger';
import { CreateTenantPackageRequestDto } from './create-tenant-package.request.dto';
import { IsNumber, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateTenantPackageRequestDto extends PartialType(CreateTenantPackageRequestDto) {
  @ApiProperty({ required: true, description: '套餐ID' })
  @IsNumber()
  @IsNotEmpty()
  packageId: number;
}
