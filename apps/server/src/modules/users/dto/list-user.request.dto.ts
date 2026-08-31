import { IsString, IsEnum, Length, IsOptional, IsNumberString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { PageQueryDto } from 'src/shared/dto';
import { StatusEnum, StatusEnumSchema } from 'src/shared/enums';

/**
 * 用户列表查询 DTO
 *
 * @description 用于查询用户列表的请求参数，支持分页和条件筛选
 * @example
 * ```json
 * {
 *   "pageNum": 1,
 *   "pageSize": 10,
 *   "userName": "admin",
 *   "status": "0",
 *   "deptId": "100"
 * }
 * ```
 */
export class ListUserRequestDto extends PageQueryDto {
  @ApiProperty({ required: false, description: '部门ID', example: '100' })
  @IsOptional()
  @IsNumberString()
  deptId?: string;

  @ApiProperty({ required: false, description: '用户昵称', example: '管理员' })
  @IsOptional()
  @IsString()
  @Length(0, 30)
  nickName?: string;

  @ApiProperty({ required: false, description: '邮箱地址', example: 'admin@example.com' })
  @IsOptional()
  @IsString()
  @Length(0, 30)
  email?: string;

  @ApiProperty({ required: false, description: '用户账号', example: 'admin' })
  @IsOptional()
  @IsString()
  @Length(0, 30)
  userName?: string;

  @ApiProperty({ required: false, description: '手机号码', example: '13800138000' })
  @IsOptional()
  @IsString()
  phonenumber?: string;

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
}

/**
 * 已分配用户列表查询 DTO
 *
 * @description 用于查询已分配角色的用户列表
 * @example
 * ```json
 * {
 *   "pageNum": 1,
 *   "pageSize": 10,
 *   "roleId": "2",
 *   "userName": "test"
 * }
 * ```
 */
export class AllocatedListRequestDto extends PageQueryDto {
  @ApiProperty({ required: false, description: '用户账号', example: 'test' })
  @IsOptional()
  @IsString()
  @Length(0, 30)
  userName?: string;

  @ApiProperty({ required: false, description: '手机号码', example: '13800138000' })
  @IsOptional()
  @IsString()
  phonenumber?: string;

  @ApiProperty({ required: false, description: '角色ID', example: '2' })
  @IsOptional()
  @IsNumberString()
  roleId?: string;
}
