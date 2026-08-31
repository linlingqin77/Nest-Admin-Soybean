import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * 更新租户配额RequestDTO
 */
export class UpdateTenantQuotaRequestDto {
  @ApiProperty({ description: '租户ID' })
  @IsString()
  tenantId: string;

  @ApiPropertyOptional({ description: '用户数量配额，-1表示不限' })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(-1)
  userQuota?: number;

  @ApiPropertyOptional({ description: '存储配额（MB），-1表示不限' })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(-1)
  storageQuota?: number;

  @ApiPropertyOptional({ description: 'API调用配额（月），-1表示不限' })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(-1)
  apiQuota?: number;
}
