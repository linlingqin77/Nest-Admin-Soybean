import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';

/**
 * 租户信息 DTO
 */
export class TenantInfoResponseDto {
  @Expose()
  @ApiProperty({ description: '租户ID' })
  tenantId: string;

  @Expose()
  @ApiProperty({ description: '企业名称' })
  companyName: string;

  @Expose()
  @ApiProperty({ description: '域名' })
  domain?: string;
}

/**
 * 租户列表响应 DTO
 */
export class LoginTenantResponseDto {
  @Expose()
  @ApiProperty({ description: '是否开启租户' })
  tenantEnabled: boolean;

  @Expose()
  @ApiProperty({ description: '租户列表', type: [TenantInfoResponseDto] })
  @Type(() => TenantInfoResponseDto)
  voList: TenantInfoResponseDto[];
}
