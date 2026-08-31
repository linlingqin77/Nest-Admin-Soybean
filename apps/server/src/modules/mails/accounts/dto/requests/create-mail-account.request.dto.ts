import { IsString, IsBoolean, IsNumber, IsEnum, Length, IsOptional, IsEmail, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { StatusEnum, StatusEnumSchema } from 'src/shared/enums';

export class CreateMailAccountRequestDto {
  @ApiProperty({ description: '邮箱地址', example: 'admin@example.com' })
  @IsEmail()
  @Length(1, 255)
  mail: string;

  @ApiProperty({ description: '用户名', example: 'admin@example.com' })
  @IsString()
  @Length(1, 255)
  username: string;

  @ApiProperty({ description: '密码', example: 'password123' })
  @IsString()
  @Length(1, 255)
  password: string;

  @ApiProperty({ description: 'SMTP主机', example: 'smtp.example.com' })
  @IsString()
  @Length(1, 255)
  host: string;

  @ApiProperty({ description: 'SMTP端口', example: 465 })
  @IsNumber()
  @Min(1)
  @Max(65535)
  port: number;

  @ApiPropertyOptional({ description: '是否启用SSL', default: false })
  @IsOptional()
  @IsBoolean()
  sslEnable?: boolean;

  @ApiPropertyOptional({
    enum: StatusEnum,
    enumName: 'StatusEnum',
    enumSchema: StatusEnumSchema,
    description: '状态（0-禁用 1-启用）',
    default: '0',
  })
  @IsOptional()
  @IsString()
  @IsEnum(StatusEnum)
  status?: string;

  @ApiPropertyOptional({ description: '备注' })
  @IsOptional()
  @IsString()
  @Length(0, 500)
  remark?: string;
}
