import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * 社交登录 DTO
 */
export class SocialLoginRequestDto {
  @ApiProperty({ description: '租户ID', required: false })
  @IsOptional()
  @IsString()
  tenantId?: string;

  @ApiProperty({ description: '社交平台来源', required: true })
  @IsNotEmpty()
  @IsString()
  source: string;

  @ApiProperty({ description: '社交平台授权码', required: true })
  @IsNotEmpty()
  @IsString()
  socialCode: string;

  @ApiProperty({ description: '社交平台状态码', required: false })
  @IsOptional()
  @IsString()
  socialState?: string;

  @ApiProperty({ description: '客户端ID', required: false })
  @IsOptional()
  @IsString()
  clientId?: string;

  @ApiProperty({ description: '授权类型', required: false })
  @IsOptional()
  @IsString()
  grantType?: string;
}
