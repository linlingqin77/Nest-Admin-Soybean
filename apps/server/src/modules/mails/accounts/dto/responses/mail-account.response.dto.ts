import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, Exclude } from 'class-transformer';
import { BaseResponseDto } from 'src/shared/dto/base.response.dto';

/**
 * 邮箱账号响应 DTO
 */
export class MailAccountResponseDto extends BaseResponseDto {
  @ApiProperty({ description: '账号ID' })
  @Expose()
  id: number;

  @ApiProperty({ description: '邮箱地址' })
  @Expose()
  mail: string;

  @ApiProperty({ description: '用户名' })
  @Expose()
  username: string;

  @ApiProperty({ description: 'SMTP主机' })
  @Expose()
  host: string;

  @ApiProperty({ description: 'SMTP端口' })
  @Expose()
  port: number;

  @ApiProperty({ description: '是否启用SSL' })
  @Expose()
  sslEnable: boolean;

  @ApiProperty({ description: '状态' })
  @Expose()
  status: string;

  @ApiPropertyOptional({ description: '备注' })
  @Expose()
  remark?: string;

  @Exclude()
  password?: string;
}
