import { IsString, IsEnum, IsArray, Length, IsOptional, IsBoolean, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { StatusEnum, StatusEnumSchema } from 'src/common/enum';

/**
 * 创建角色 DTO
 */
export class CreateRoleDto {
  @ApiProperty({ required: true, description: '角色名称' })
  @IsString()
  @Length(0, 30)
  roleName: string;

  @ApiProperty({ required: true, description: '角色权限字符串' })
  @IsString()
  @Length(0, 100)
  roleKey: string;

  @ApiProperty({ required: false, description: '菜单ID列表', type: [Number] })
  @IsOptional()
  @IsArray()
  menuIds?: Array<number>;

  @ApiProperty({ required: false, description: '部门ID列表', type: [Number] })
  @IsOptional()
  @IsArray()
  deptIds?: Array<number>;

  @ApiProperty({ required: true, description: '角色排序' })
  @IsOptional()
  @IsNumber()
  roleSort?: number;

  @ApiProperty({
    required: false,
    description: '角色状态（0正常 1停用）',
    enum: StatusEnum,
    enumName: 'StatusEnum',
    enumSchema: StatusEnumSchema,
  })
  @IsOptional()
  @IsString()
  @IsEnum(StatusEnum)
  status?: string;

  @ApiProperty({ required: false, description: '数据范围' })
  @IsOptional()
  @IsString()
  dataScope: string;

  @ApiProperty({ required: false, description: '备注' })
  @IsOptional()
  @IsString()
  @Length(0, 500)
  remark?: string;

  @ApiProperty({ required: false, description: '菜单树选择项是否关联显示' })
  @IsOptional()
  @IsBoolean()
  menuCheckStrictly?: boolean;

  @ApiProperty({ required: false, description: '部门树选择项是否关联显示' })
  @IsOptional()
  @IsBoolean()
  deptCheckStrictly?: boolean;
}
