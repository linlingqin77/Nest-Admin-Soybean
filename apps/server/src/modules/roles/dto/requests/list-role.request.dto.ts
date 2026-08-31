import { IsString, IsEnum, Length, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { PageQueryDto } from 'src/shared/dto';
import { StatusEnum, StatusEnumSchema } from 'src/shared/enums';

/**
 * 角色列表查询请求 DTO
 *
 * @description 用于查询角色列表的请求参数，支持分页和条件筛选
 * @example
 * ```json
 * {
 *   "pageNum": 1,
 *   "pageSize": 10,
 *   "roleName": "管理员",
 *   "roleKey": "admin",
 *   "status": "0"
 * }
 * ```
 */
export class ListRoleRequestDto extends PageQueryDto {
  @ApiProperty({ required: false, description: '角色名称', example: '管理员' })
  @IsOptional()
  @IsString()
  @Length(0, 30)
  roleName?: string;

  @ApiProperty({ required: false, description: '角色权限字符串', example: 'admin' })
  @IsOptional()
  @IsString()
  @Length(0, 100)
  roleKey?: string;

  @ApiProperty({
    required: false,
    description: '角色状态（0正常 1停用）',
    enum: StatusEnum,
    enumName: 'StatusEnum',
    enumSchema: StatusEnumSchema,
    example: '0',
  })
  @IsOptional()
  @IsString()
  @IsEnum(StatusEnum)
  status?: string;

  @ApiProperty({ required: false, description: '角色ID', example: '1' })
  @IsOptional()
  @IsString()
  @Length(0, 100)
  roleId?: string;
}
