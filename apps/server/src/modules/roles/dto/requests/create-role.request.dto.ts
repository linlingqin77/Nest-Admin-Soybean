import { IsString, IsEnum, IsArray, Length, IsOptional, IsBoolean, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { StatusEnum, StatusEnumSchema } from 'src/shared/enums';

/**
 * 创建角色请求 DTO
 *
 * @description 用于创建新角色的请求参数
 * @example
 * ```json
 * {
 *   "roleName": "普通角色",
 *   "roleKey": "common",
 *   "roleSort": 2,
 *   "status": "0",
 *   "menuIds": [1, 2, 3, 100, 101],
 *   "remark": "普通角色"
 * }
 * ```
 */
export class CreateRoleRequestDto {
  @ApiProperty({ required: true, description: '角色名称', example: '普通角色' })
  @IsString()
  @Length(0, 30)
  roleName: string;

  @ApiProperty({ required: true, description: '角色权限字符串', example: 'common' })
  @IsString()
  @Length(0, 100)
  roleKey: string;

  @ApiProperty({ required: false, description: '菜单ID列表', type: [Number], example: [1, 2, 3, 100, 101] })
  @IsOptional()
  @IsArray()
  menuIds?: Array<number>;

  @ApiProperty({ required: false, description: '部门ID列表', type: [Number], example: [100, 101] })
  @IsOptional()
  @IsArray()
  deptIds?: Array<number>;

  @ApiProperty({ required: true, description: '角色排序', example: 2 })
  @IsOptional()
  @IsNumber()
  roleSort?: number;

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

  @ApiProperty({
    required: false,
    description: '数据范围（1全部 2自定义 3本部门 4本部门及以下 5仅本人）',
    example: '1',
  })
  @IsOptional()
  @IsString()
  dataScope: string;

  @ApiProperty({ required: false, description: '备注', example: '普通角色' })
  @IsOptional()
  @IsString()
  @Length(0, 500)
  remark?: string;

  @ApiProperty({ required: false, description: '菜单树选择项是否关联显示', example: true })
  @IsOptional()
  @IsBoolean()
  menuCheckStrictly?: boolean;

  @ApiProperty({ required: false, description: '部门树选择项是否关联显示', example: true })
  @IsOptional()
  @IsBoolean()
  deptCheckStrictly?: boolean;
}
