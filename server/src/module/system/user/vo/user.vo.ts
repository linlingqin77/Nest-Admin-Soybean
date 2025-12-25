import { ApiProperty } from '@nestjs/swagger';
import {
  StatusEnum,
  StatusEnumSchema,
  SexEnum,
  SexEnumSchema,
  DataScopeEnum,
  DataScopeEnumSchema,
} from 'src/common/enum';

/**
 * 岗位信息
 */
export class PostVo {
  @ApiProperty({ description: '岗位ID' })
  postId: number;

  @ApiProperty({ description: '岗位编码' })
  postCode: string;

  @ApiProperty({ description: '岗位名称' })
  postName: string;
}

/**
 * 角色信息
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

  @ApiProperty({ description: '角色状态', enum: StatusEnum, enumName: 'StatusEnum', enumSchema: StatusEnumSchema })
  status: string;
}

/**
 * 用户基础信息
 */
export class UserVo {
  @ApiProperty({ description: '用户ID' })
  userId: number;

  @ApiProperty({ description: '部门ID' })
  deptId: number;

  @ApiProperty({ description: '用户账号' })
  userName: string;

  @ApiProperty({ description: '用户昵称' })
  nickName: string;

  @ApiProperty({ description: '用户类型（00系统用户）' })
  userType: string;

  @ApiProperty({ description: '用户邮箱' })
  email: string;

  @ApiProperty({ description: '手机号码' })
  phonenumber: string;

  @ApiProperty({ description: '用户性别', enum: SexEnum, enumName: 'SexEnum', enumSchema: SexEnumSchema })
  sex: string;

  @ApiProperty({ description: '头像地址' })
  avatar: string;

  @ApiProperty({ description: '帐号状态', enum: StatusEnum, enumName: 'StatusEnum', enumSchema: StatusEnumSchema })
  status: string;

  @ApiProperty({ description: '删除标志（0代表存在 2代表删除）' })
  delFlag: string;

  @ApiProperty({ description: '最后登录IP' })
  loginIp: string;

  @ApiProperty({ description: '最后登录时间' })
  loginDate: string | null;

  @ApiProperty({ description: '备注' })
  remark: string;

  @ApiProperty({ description: '创建时间' })
  createTime: string;

  @ApiProperty({ description: '更新时间' })
  updateTime: string;

  @ApiProperty({ description: '部门名称', required: false })
  deptName?: string;

  @ApiProperty({ description: '部门信息', required: false })
  dept?: {
    deptId: number;
    parentId: number;
    deptName: string;
    orderNum: number;
    leader: string;
    phone: string;
    email: string;
    status: string;
  };

  @ApiProperty({ description: '角色列表', type: [RoleVo], required: false })
  roles?: RoleVo[];
}

/**
 * 用户列表响应
 */
export class UserListVo {
  @ApiProperty({ description: '用户列表', type: [UserVo] })
  rows: UserVo[];

  @ApiProperty({ description: '总数量' })
  total: number;
}

/**
 * 用户详情响应（包含岗位和角色选项）
 */
export class UserDetailVo {
  @ApiProperty({ description: '用户信息', type: UserVo, required: false })
  data?: UserVo;

  @ApiProperty({ description: '岗位选项列表', type: [PostVo] })
  posts: PostVo[];

  @ApiProperty({ description: '角色选项列表', type: [RoleVo] })
  roles: RoleVo[];

  @ApiProperty({ description: '用户已分配的岗位ID列表', type: [Number], required: false })
  postIds?: number[];

  @ApiProperty({ description: '用户已分配的角色ID列表', type: [Number], required: false })
  roleIds?: number[];
}

/**
 * 用户个人信息响应
 */
export class UserProfileVo {
  @ApiProperty({ description: '用户信息', type: UserVo })
  user: UserVo;

  @ApiProperty({ description: '角色组名称' })
  roleGroup: string;

  @ApiProperty({ description: '岗位组名称' })
  postGroup: string;
}

/**
 * 用户头像响应
 */
export class UserAvatarVo {
  @ApiProperty({ description: '头像URL' })
  imgUrl: string;
}

/**
 * 授权角色数据响应
 */
export class AuthRoleVo {
  @ApiProperty({ description: '用户信息', type: UserVo })
  user: UserVo;

  @ApiProperty({ description: '角色列表', type: [RoleVo] })
  roles: RoleVo[];
}
