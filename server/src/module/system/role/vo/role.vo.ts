import { ApiProperty } from '@nestjs/swagger';
import { StatusEnum, StatusEnumSchema, DataScopeEnum, DataScopeEnumSchema } from 'src/common/enum';
import { DeptTreeNodeVo } from 'src/common/dto/dept-tree-node.vo';

/**
 * 角色基础信息
 */
export class RoleVo {
  @ApiProperty({ description: '角色ID' })
  roleId: number;

  @ApiProperty({ description: '角色名称' })
  roleName: string;

  @ApiProperty({ description: '角色权限字符串' })
  roleKey: string;

  @ApiProperty({ description: '显示顺序' })
  roleSort: number;

  @ApiProperty({
    description: '数据范围',
    enum: DataScopeEnum,
    enumName: 'DataScopeEnum',
    enumSchema: DataScopeEnumSchema,
  })
  dataScope: string;

  @ApiProperty({ description: '菜单树选择项是否关联显示' })
  menuCheckStrictly: boolean;

  @ApiProperty({ description: '部门树选择项是否关联显示' })
  deptCheckStrictly: boolean;

  @ApiProperty({ description: '角色状态', enum: StatusEnum, enumName: 'StatusEnum', enumSchema: StatusEnumSchema })
  status: string;

  @ApiProperty({ description: '删除标志（0代表存在 2代表删除）' })
  delFlag: string;

  @ApiProperty({ description: '备注' })
  remark: string;

  @ApiProperty({ description: '创建时间' })
  createTime: Date;

  @ApiProperty({ description: '更新时间' })
  updateTime: Date;
}

/**
 * 角色列表响应
 */
export class RoleListVo {
  @ApiProperty({ description: '角色列表', type: [RoleVo] })
  rows: RoleVo[];

  @ApiProperty({ description: '总数量' })
  total: number;
}

/**
 * 角色部门树响应
 */
export class RoleDeptTreeVo {
  @ApiProperty({ description: '已选中的部门ID列表', type: [Number] })
  checkedKeys: number[];

  @ApiProperty({ description: '部门树数据', type: [DeptTreeNodeVo] })
  depts: DeptTreeNodeVo[];
}

/**
 * 角色菜单树节点
 */
export class MenuTreeNodeVo {
  @ApiProperty({ description: '节点ID' })
  id: number;

  @ApiProperty({ description: '节点标签' })
  label: string;

  @ApiProperty({ description: '子节点列表', type: [MenuTreeNodeVo], required: false })
  children?: MenuTreeNodeVo[];
}

/**
 * 角色菜单树响应
 */
export class RoleMenuTreeVo {
  @ApiProperty({ description: '已选中的菜单ID列表', type: [Number] })
  checkedKeys: number[];

  @ApiProperty({ description: '菜单树数据', type: [MenuTreeNodeVo] })
  menus: MenuTreeNodeVo[];
}

/**
 * 已分配角色的用户列表响应
 */
export class AllocatedUserListVo {
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
