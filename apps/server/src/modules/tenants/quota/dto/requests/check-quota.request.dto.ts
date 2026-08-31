import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * 配额检查RequestDTO
 */
export class CheckQuotaRequestDto {
  @ApiProperty({ description: '租户ID' })
  @IsString()
  tenantId: string;

  @ApiProperty({ description: '配额类型', enum: ['user', 'storage', 'api'] })
  @IsString()
  quotaType: 'user' | 'storage' | 'api';

  @ApiPropertyOptional({ description: '请求增量（默认1）' })
  @IsNumber()
  @Type(() => Number)
  @Min(1)
  increment?: number;
}
