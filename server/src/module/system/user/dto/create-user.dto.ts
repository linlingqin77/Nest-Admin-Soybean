import { IsString, IsEnum, IsArray, Length, IsOptional, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { StatusEnum, StatusEnumSchema, SexEnum, SexEnumSchema } from 'src/common/enum';
import { IsStrongPassword } from 'src/common/validators/password.validator';

/**
 * 创建用户 DTO
 */
export class CreateUserDto {
  @ApiProperty({ required: false, description: '部门ID' })
  @IsOptional()
  @IsNumber()
  deptId?: number;

  @ApiProperty({ required: false, description: '邮箱地址' })
  @IsOptional()
  @IsString()
  @Length(0, 50)
  email: string;

  @ApiProperty({ required: true, description: '用户昵称' })
  @IsString()
  @Length(0, 30)
  nickName: string;

  @ApiProperty({ required: true, description: '用户账号' })
  @IsString()
  @Length(0, 30)
  userName: string;

  @ApiProperty({ required: true, description: '用户密码' })
  @IsString()
  @IsStrongPassword()
  @Length(0, 200)
  password: string;

  @ApiProperty({ required: false, description: '手机号码' })
  @IsOptional()
  @IsString()
  phonenumber?: string;

  @ApiProperty({ required: false, description: '岗位ID列表', type: [Number] })
  @IsOptional()
  @IsArray()
  postIds?: Array<number>;

  @ApiProperty({ required: false, description: '角色ID列表', type: [Number] })
  @IsOptional()
  @IsArray()
  roleIds?: Array<number>;

  @ApiProperty({ enum: StatusEnum, enumName: 'StatusEnum', enumSchema: StatusEnumSchema, required: false })
  @IsOptional()
  @IsString()
  @IsEnum(StatusEnum)
  status?: string;

  @ApiProperty({ enum: SexEnum, enumName: 'SexEnum', enumSchema: SexEnumSchema, required: false })
  @IsOptional()
  @IsString()
  @IsEnum(SexEnum)
  sex?: string;

  @ApiProperty({ required: false, description: '备注' })
  @IsOptional()
  @IsString()
  @Length(0, 500)
  remark?: string;

  @ApiProperty({ required: false, description: '显示排序' })
  @IsOptional()
  @IsNumber()
  postSort?: number;
}
