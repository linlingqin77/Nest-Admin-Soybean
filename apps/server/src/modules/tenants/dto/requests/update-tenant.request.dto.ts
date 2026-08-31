import { PartialType, OmitType } from '@nestjs/swagger';
import { CreateTenantRequestDto } from './create-tenant.request.dto';
import { IsNumber, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateTenantRequestDto extends PartialType(
  OmitType(CreateTenantRequestDto, ['username', 'password', 'tenantId'] as const),
) {
  @ApiProperty({ required: true, description: '租户ID' })
  @IsNumber()
  @IsNotEmpty()
  id: number;

  @ApiProperty({ required: true, description: '租户编号' })
  @IsNotEmpty()
  @IsNotEmpty()
  tenantId: string;
}
