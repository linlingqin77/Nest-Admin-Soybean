import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsNumber, Min } from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { PageQueryDto } from 'src/shared/dto/base.dto';

/**
 * 租户配额查询RequestDTO
 */
export class ListTenantQuotaRequestDto extends PageQueryDto {
  @ApiPropertyOptional({ description: '租户ID' })
  @IsOptional()
  @IsString()
  tenantId?: string;

  @ApiPropertyOptional({ description: '企业名称' })
  @IsOptional()
  @IsString()
  companyName?: string;

  @ApiPropertyOptional({ description: '配额状态', enum: ['normal', 'warning', 'danger'] })
  @IsOptional()
  @IsString()
  status?: string;
}
