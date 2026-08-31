import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

/**
 * 租户切换请求DTO
 */
export class TenantSwitchRequestDto {
  @ApiProperty({ description: '目标租户ID', example: '100001' })
  @IsNotEmpty({ message: '租户ID不能为空' })
  @IsString({ message: '租户ID必须是字符串' })
  tenantId: string;
}
