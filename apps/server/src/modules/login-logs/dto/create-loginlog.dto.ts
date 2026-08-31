import { IsString, IsEnum, Length, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { StatusEnum, StatusEnumSchema } from 'src/shared/enums';

export class CreateLoginlogDto {
  @ApiProperty({ required: false, description: '登录IP地址' })
  @IsOptional()
  @IsString()
  @Length(0, 128)
  ipaddr?: string;

  @ApiProperty({ required: false, description: '用户名' })
  @IsOptional()
  @IsString()
  @Length(0, 50)
  userName?: string;

  @ApiProperty({ required: false, description: '登录地点' })
  @IsOptional()
  @IsString()
  @Length(0, 255)
  loginLocation?: string;

  @ApiProperty({ required: false, description: '浏览器类型' })
  @IsOptional()
  @IsString()
  @Length(0, 50)
  browser?: string;

  @ApiProperty({ required: false, description: '操作系统' })
  @IsOptional()
  @IsString()
  @Length(0, 50)
  os?: string;

  @ApiProperty({ required: false, description: '提示消息' })
  @IsOptional()
  @IsString()
  @Length(0, 255)
  msg?: string;

  @ApiProperty({ enum: StatusEnum, enumName: 'StatusEnum', enumSchema: StatusEnumSchema, required: false })
  @IsOptional()
  @IsString()
  @IsEnum(StatusEnum)
  status?: string;
}
