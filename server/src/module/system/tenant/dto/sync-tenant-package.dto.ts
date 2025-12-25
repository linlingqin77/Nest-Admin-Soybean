import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SyncTenantPackageDto {
  @ApiProperty({ required: true, description: '租户ID' })
  @IsString()
  @IsNotEmpty()
  tenantId: string;

  @ApiProperty({ required: true, description: '套餐ID' })
  @IsNotEmpty()
  packageId: number;
}
