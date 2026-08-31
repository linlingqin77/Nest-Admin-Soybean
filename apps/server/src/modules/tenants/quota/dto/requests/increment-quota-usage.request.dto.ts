import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNumber, IsString, Min } from 'class-validator';

/**
 * 增量配额使用DTO（内部调用）
 */
export class IncrementQuotaUsageDto {
  @ApiProperty({ description: '租户ID' })
  @IsString()
  tenantId: string;

  @ApiProperty({ description: '配额类型', enum: ['user', 'storage', 'api'] })
  @IsEnum(['user', 'storage', 'api'])
  quotaType: 'user' | 'storage' | 'api';

  @ApiProperty({ description: '增量值（整数）' })
  @IsNumber()
  @Min(0)
  increment: number;
}
