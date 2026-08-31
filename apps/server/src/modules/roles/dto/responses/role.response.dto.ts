import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { BaseResponseDto } from 'src/shared/dto/base.response.dto';
import { StatusEnum, StatusEnumSchema, DataScopeEnum, DataScopeEnumSchema } from 'src/shared/enums';
import { DeptTreeNodeResponseDto } from 'src/shared/dto/dept-tree-node.response.dto';

/**
 * 角色基础信息响应 DTO
 */
export class RoleResponseDto extends BaseResponseDto {
  @Expose()
  @ApiProperty({ description: '角色ID' })
  roleId: number;

  @Expose()
  @ApiProperty({ description: '角色名称' })
  roleName: string;

  @Expose()
  @ApiProperty({ description: '角色权限字符串' })
  roleKey: string;

  @Expose()
  @ApiProperty({ description: '显示顺序' })
  roleSort: number;

  @Expose()
  @ApiProperty({
    description: '数据范围',
    enum: DataScopeEnum,
    enumName: 'DataScopeEnum',
    enumSchema: DataScopeEnumSchema,
  })
  dataScope: string;

  @Expose()
  @ApiProperty({ description: '菜单树选择项是否关联显示' })
  menuCheckStrictly: boolean;

  @Expose()
  @ApiProperty({ description: '部门树选择项是否关联显示' })
  deptCheckStrictly: boolean;

  @Expose()
  @ApiProperty({ description: '角色状态', enum: StatusEnum, enumName: 'StatusEnum', enumSchema: StatusEnumSchema })
  status: string;
}

/**
 * 角色列表响应 DTO
 */
export class RoleListResponseDto {
  @ApiProperty({ description: '角色列表', type: [RoleResponseDto] })
  rows: RoleResponseDto[];

  @ApiProperty({ description: '总数量' })
  total: number;
}

/**
 * 角色部门树响应 DTO
 */
export class RoleDeptTreeResponseDto {
  @ApiProperty({ description: '已选中的部门ID列表', type: [Number] })
  checkedKeys: number[];

  @ApiProperty({ description: '部门树数据', type: [DeptTreeNodeResponseDto] })
  depts: DeptTreeNodeResponseDto[];
}

/**
 * 角色菜单树节点响应 DTO
 */
export class MenuTreeNodeResponseDto {
  @ApiProperty({ description: '节点ID' })
  id: number;

  @ApiProperty({ description: '节点标签' })
  label: string;

  @ApiProperty({ description: '子节点列表', type: [MenuTreeNodeResponseDto], required: false })
  children?: MenuTreeNodeResponseDto[];
}

/**
 * 角色菜单树响应 DTO
 */
export class RoleMenuTreeResponseDto {
  @ApiProperty({ description: '已选中的菜单ID列表', type: [Number] })
  checkedKeys: number[];

  @ApiProperty({ description: '菜单树数据', type: [MenuTreeNodeResponseDto] })
  menus: MenuTreeNodeResponseDto[];
}

/**
 * 已分配角色的用户列表响应 DTO
 */
export class AllocatedUserListResponseDto {
  @ApiProperty({ description: '用户列表' })
  rows: Array<{
    userId: number;
    deptId: number;
    userName: string;
    nickName: string;
    email: string;
    phonenumber: string;
    status: string;
    createTime: Date;
    dept?: {
      deptName: string;
    };
  }>;

  @ApiProperty({ description: '总数量' })
  total: number;
}

/**
 * 创建角色结果响应 DTO
 */
export class CreateRoleResultResponseDto {
  @ApiProperty({ description: '创建的角色ID', example: 1 })
  roleId: number;
}

/**
 * 更新角色结果响应 DTO
 */
export class UpdateRoleResultResponseDto {
  @ApiProperty({ description: '更新是否成功', example: true })
  success: boolean;
}

/**
 * 修改角色状态结果响应 DTO
 */
export class ChangeRoleStatusResultResponseDto {
  @ApiProperty({ description: '修改是否成功', example: true })
  success: boolean;
}

/**
 * 删除角色结果响应 DTO
 */
export class DeleteRoleResultResponseDto {
  @ApiProperty({ description: '删除的记录数', example: 1 })
  affected: number;
}

/**
 * 数据权限修改结果响应 DTO
 */
export class DataScopeResultResponseDto {
  @ApiProperty({ description: '修改是否成功', example: true })
  success: boolean;
}

/**
 * 用户授权操作结果响应 DTO
 */
export class AuthUserResultResponseDto {
  @ApiProperty({ description: '操作是否成功', example: true })
  success: boolean;
}
