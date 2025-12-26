import { IsString, IsEnum, Length, IsOptional, IsEmail } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { SexEnum, SexEnumSchema } from 'src/common/enum';
import { IsStrongPassword } from 'src/common/validators/password.validator';

/**
 * 更新个人资料 DTO
 */
export class UpdateProfileDto {
  @ApiProperty({ required: true, description: '用户昵称' })
  @IsOptional()
  @IsString()
  @Length(0, 30)
  nickName: string;

  @ApiProperty({ required: true, description: '邮箱地址' })
  @IsOptional()
  @IsString()
  @IsEmail()
  @Length(0, 50)
  email: string;

  @ApiProperty({ required: true, description: '手机号码' })
  @IsOptional()
  @IsString()
  phonenumber: string;

  @ApiProperty({ enum: SexEnum, enumName: 'SexEnum', enumSchema: SexEnumSchema, required: true })
  @IsOptional()
  @IsString()
  @IsEnum(SexEnum)
  sex: string;

  @ApiProperty({ required: false, description: '头像地址' })
  @IsOptional()
  @IsString()
  avatar?: string;
}

/**
 * 修改密码 DTO
 */
export class UpdatePwdDto {
  @ApiProperty({ required: true, description: '旧密码' })
  @IsString()
  @Length(0, 200)
  oldPassword: string;

  @ApiProperty({ required: true, description: '新密码' })
  @IsString()
  @IsStrongPassword()
  @Length(0, 200)
  newPassword: string;
}
