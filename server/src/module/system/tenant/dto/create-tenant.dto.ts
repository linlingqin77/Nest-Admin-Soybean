import { IsString, IsEnum, Length, IsOptional, IsNumber, IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { StatusEnum, StatusEnumSchema } from 'src/common/enum';
import { IsStrongPassword } from 'src/common/validators/password.validator';

export class CreateTenantDto {
  @ApiProperty({ required: false, description: '租户ID（不传则自动生成）' })
  @IsOptional()
  @IsString()
  @Length(1, 20)
  tenantId?: string;

  @ApiProperty({ required: false, description: '联系人' })
  @IsOptional()
  @IsString()
  @Length(0, 50)
  contactUserName?: string;

  @ApiProperty({ required: false, description: '联系电话' })
  @IsOptional()
  @IsString()
  @Length(0, 20)
  contactPhone?: string;

  @ApiProperty({ required: true, description: '企业名称' })
  @IsString()
  @Length(1, 100)
  companyName: string;

  @ApiProperty({ required: false, description: '统一社会信用代码' })
  @IsOptional()
  @IsString()
  @Length(0, 50)
  licenseNumber?: string;

  @ApiProperty({ required: false, description: '地址' })
  @IsOptional()
  @IsString()
  @Length(0, 200)
  address?: string;

  @ApiProperty({ required: false, description: '企业简介' })
  @IsOptional()
  @IsString()
  intro?: string;

  @ApiProperty({ required: false, description: '域名' })
  @IsOptional()
  @IsString()
  @Length(0, 100)
  domain?: string;

  @ApiProperty({ required: false, description: '租户套餐ID' })
  @IsOptional()
  @IsNumber()
  packageId?: number;

  @ApiProperty({ required: false, description: '过期时间' })
  @IsOptional()
  @IsDateString()
  expireTime?: Date;

  @ApiProperty({ required: false, description: '账号数量(-1不限制)' })
  @IsOptional()
  @IsNumber()
  accountCount?: number;

  @ApiProperty({ enum: StatusEnum, enumName: 'StatusEnum', enumSchema: StatusEnumSchema, required: false })
  @IsOptional()
  @IsString()
  @IsEnum(StatusEnum)
  status?: string;

  @ApiProperty({ required: false, description: '备注' })
  @IsOptional()
  @IsString()
  @Length(0, 500)
  remark?: string;

  @ApiProperty({ required: true, description: '管理员账号' })
  @IsString()
  @Length(1, 30)
  username: string;

  @ApiProperty({ required: true, description: '管理员密码' })
  @IsString()
  @IsStrongPassword()
  @Length(6, 20)
  password: string;
}
