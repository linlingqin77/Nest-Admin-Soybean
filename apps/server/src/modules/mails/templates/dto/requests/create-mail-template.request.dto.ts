import { IsString, IsNumber, IsEnum, Length, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { StatusEnum, StatusEnumSchema } from 'src/shared/enums';

export class CreateMailTemplateRequestDto {
  @ApiProperty({ description: '模板名称', example: '用户注册验证码' })
  @IsString()
  @Length(1, 100)
  name: string;

  @ApiProperty({ description: '模板编码', example: 'user_register_code' })
  @IsString()
  @Length(1, 100)
  code: string;

  @ApiProperty({ description: '发送账号ID', example: 1 })
  @IsNumber()
  accountId: number;

  @ApiProperty({ description: '发送人昵称', example: '系统管理员' })
  @IsString()
  @Length(1, 100)
  nickname: string;

  @ApiProperty({ description: '邮件标题', example: '【系统】验证码通知' })
  @IsString()
  @Length(1, 255)
  title: string;

  @ApiProperty({ description: '邮件内容（HTML）', example: '<p>您的验证码是：${code}</p>' })
  @IsString()
  content: string;

  @ApiPropertyOptional({ description: '参数列表（JSON数组）', example: '["code", "time"]' })
  @IsOptional()
  @IsString()
  params?: string;

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
