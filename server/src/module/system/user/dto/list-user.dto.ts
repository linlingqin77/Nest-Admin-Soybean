import { IsString, IsEnum, Length, IsOptional, IsNumberString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { PageQueryDto } from 'src/common/dto';
import { StatusEnum, StatusEnumSchema } from 'src/common/enum';

/**
 * 用户列表查询 DTO
 */
export class ListUserDto extends PageQueryDto {
  @ApiProperty({ required: false, description: '部门ID' })
  @IsOptional()
  @IsNumberString()
  deptId?: string;

  @ApiProperty({ required: false, description: '用户昵称' })
  @IsOptional()
  @IsString()
  @Length(0, 30)
  nickName?: string;

  @ApiProperty({ required: false, description: '邮箱地址' })
  @IsOptional()
  @IsString()
  @Length(0, 30)
  email?: string;

  @ApiProperty({ required: false, description: '用户账号' })
  @IsOptional()
  @IsString()
  @Length(0, 30)
  userName?: string;

  @ApiProperty({ required: false, description: '手机号码' })
  @IsOptional()
  @IsString()
  phonenumber?: string;

  @ApiProperty({ enum: StatusEnum, enumName: 'StatusEnum', enumSchema: StatusEnumSchema, required: false })
  @IsOptional()
  @IsString()
  @IsEnum(StatusEnum)
  status?: string;
}

/**
 * 已分配用户列表查询 DTO
 */
export class AllocatedListDto extends PageQueryDto {
  @ApiProperty({ required: false, description: '用户账号' })
  @IsOptional()
  @IsString()
  @Length(0, 30)
  userName?: string;

  @ApiProperty({ required: false, description: '手机号码' })
  @IsOptional()
  @IsString()
  phonenumber?: string;

  @ApiProperty({ required: false, description: '角色ID' })
  @IsOptional()
  @IsNumberString()
  roleId?: string;
}
