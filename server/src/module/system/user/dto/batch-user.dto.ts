import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsString,
  IsOptional,
  IsNumber,
  IsEnum,
  Length,
  ValidateNested,
  ArrayMinSize,
  ArrayMaxSize,
} from 'class-validator';
import { StatusEnum, StatusEnumSchema, SexEnum, SexEnumSchema } from 'src/common/enum';
import { IsStrongPassword } from 'src/common/validators/password.validator';

/**
 * 批量创建用户项 DTO
 */
export class BatchCreateUserItemDto {
  @ApiProperty({ required: false, description: '部门ID' })
  @IsOptional()
  @IsNumber()
  deptId?: number;

  @ApiProperty({ required: false, description: '邮箱地址' })
  @IsOptional()
  @Length(0, 50)
  email?: string;

  @ApiProperty({ required: true, description: '用户昵称' })
  @IsString()
  @Length(1, 30)
  nickName: string;

  @ApiProperty({ required: true, description: '用户账号' })
  @IsString()
  @Length(1, 30)
  userName: string;

  @ApiProperty({ required: true, description: '用户密码' })
  @IsString()
  @IsStrongPassword()
  @Length(1, 200)
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

  @ApiPropertyOptional({ enum: StatusEnum, enumName: 'StatusEnum', enumSchema: StatusEnumSchema })
  @IsOptional()
  @IsString()
  @IsEnum(StatusEnum)
  status?: string;

  @ApiPropertyOptional({ enum: SexEnum, enumName: 'SexEnum', enumSchema: SexEnumSchema })
  @IsOptional()
  @IsString()
  @IsEnum(SexEnum)
  sex?: string;

  @ApiProperty({ required: false, description: '备注' })
  @IsOptional()
  @IsString()
  @Length(0, 500)
  remark?: string;
}

/**
 * 批量创建用户 DTO
 */
export class BatchCreateUserDto {
  @ApiProperty({
    description: '用户列表',
    type: [BatchCreateUserItemDto],
    minItems: 1,
    maxItems: 100,
  })
  @IsArray()
  @ValidateNested({ each: true })
  @ArrayMinSize(1, { message: '至少需要一个用户' })
  @ArrayMaxSize(100, { message: '单次最多创建100个用户' })
  @Type(() => BatchCreateUserItemDto)
  users: BatchCreateUserItemDto[];
}

/**
 * 批量删除用户 DTO
 */
export class BatchDeleteUserDto {
  @ApiProperty({
    description: '用户ID列表',
    type: [Number],
    example: [1, 2, 3],
    minItems: 1,
    maxItems: 100,
  })
  @IsArray()
  @IsNumber({}, { each: true })
  @ArrayMinSize(1, { message: '至少需要一个用户ID' })
  @ArrayMaxSize(100, { message: '单次最多删除100个用户' })
  @Type(() => Number)
  userIds: number[];
}

/**
 * 批量操作结果项
 */
export class BatchResultItem {
  @ApiProperty({ description: '索引或ID' })
  index: number;

  @ApiProperty({ description: '是否成功' })
  success: boolean;

  @ApiPropertyOptional({ description: '错误消息' })
  error?: string;

  @ApiPropertyOptional({ description: '创建的用户ID' })
  userId?: number;
}

/**
 * 批量操作结果 DTO
 */
export class BatchResultDto {
  @ApiProperty({ description: '成功数量' })
  successCount: number;

  @ApiProperty({ description: '失败数量' })
  failedCount: number;

  @ApiProperty({ description: '总数量' })
  totalCount: number;

  @ApiProperty({ description: '详细结果', type: [BatchResultItem] })
  results: BatchResultItem[];
}
