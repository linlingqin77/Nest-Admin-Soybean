import { IsString, IsEnum, IsArray, Length, IsOptional, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { StatusEnum, StatusEnumSchema, SexEnum, SexEnumSchema } from 'src/shared/enums';
import { IsStrongPassword } from 'src/shared/validators/password.validator';

/**
 * 创建用户 DTO
 *
 * @description 用于创建新用户的请求参数
 * @example
 * ```json
 * {
 *   "userName": "zhangsan",
 *   "nickName": "张三",
 *   "password": "Admin@123456",
 *   "email": "zhangsan@example.com",
 *   "phonenumber": "13800138000",
 *   "sex": "0",
 *   "status": "0",
 *   "deptId": 100,
 *   "roleIds": [2],
 *   "postIds": [1]
 * }
 * ```
 */
export class CreateUserRequestDto {
  @ApiProperty({ required: false, description: '部门ID', example: 100 })
  @IsOptional()
  @IsNumber()
  deptId?: number;

  @ApiProperty({ required: false, description: '邮箱地址', example: 'user@example.com' })
  @IsOptional()
  @Length(0, 50)
  email: string;

  @ApiProperty({ required: true, description: '用户昵称', example: '张三' })
  @IsString()
  @Length(0, 30)
  nickName: string;

  @ApiProperty({ required: true, description: '用户账号', example: 'zhangsan' })
  @IsString()
  @Length(0, 30)
  userName: string;

  @ApiProperty({ required: true, description: '用户密码（需包含大小写字母、数字和特殊字符）', example: 'Admin@123456' })
  @IsString()
  @IsStrongPassword()
  @Length(0, 200)
  password: string;

  @ApiProperty({ required: false, description: '手机号码', example: '13800138000' })
  @IsOptional()
  @IsString()
  phonenumber?: string;

  @ApiProperty({ required: false, description: '岗位ID列表', type: [Number], example: [1, 2] })
  @IsOptional()
  @IsArray()
  postIds?: Array<number>;

  @ApiProperty({ required: false, description: '角色ID列表', type: [Number], example: [2] })
  @IsOptional()
  @IsArray()
  roleIds?: Array<number>;

  @ApiProperty({
    enum: StatusEnum,
    enumName: 'StatusEnum',
    enumSchema: StatusEnumSchema,
    required: false,
    description: '用户状态（0正常 1停用）',
    example: '0',
  })
  @IsOptional()
  @IsString()
  @IsEnum(StatusEnum)
  status?: string;

  @ApiProperty({
    enum: SexEnum,
    enumName: 'SexEnum',
    enumSchema: SexEnumSchema,
    required: false,
    description: '用户性别（0男 1女 2未知）',
    example: '0',
  })
  @IsOptional()
  @IsString()
  @IsEnum(SexEnum)
  sex?: string;

  @ApiProperty({ required: false, description: '备注', example: '新入职员工' })
  @IsOptional()
  @IsString()
  @Length(0, 500)
  remark?: string;

  @ApiProperty({ required: false, description: '显示排序', example: 1 })
  @IsOptional()
  @IsNumber()
  postSort?: number;
}
