import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { BaseResponseDto } from 'src/shared/dto/base.response.dto';
import { DateFormat } from 'src/shared/decorators/date-format.decorator';
import {
  StatusEnum,
  StatusEnumSchema,
  SexEnum,
  SexEnumSchema,
  DataScopeEnum,
  DataScopeEnumSchema,
} from 'src/shared/enums';

/**
 * 岗位响应 DTO
 */
export class PostResponseDto {
  @Expose()
  @ApiProperty({ description: '岗位ID' })
  postId: number;

  @Expose()
  @ApiProperty({ description: '岗位编码' })
  postCode: string;

  @Expose()
  @ApiProperty({ description: '岗位名称' })
  postName: string;
}

/**
 * 角色响应 DTO
 */
export class RoleResponseDto {
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
  @ApiProperty({ description: '角色状态', enum: StatusEnum, enumName: 'StatusEnum', enumSchema: StatusEnumSchema })
  status: string;
}

/**
 * 用户响应 DTO
 *
 * @description 继承 BaseResponseDto，自动处理：
 * - createTime/updateTime 日期格式化（通过 @DateFormat() 装饰器）
 * - 敏感字段排除（delFlag, tenantId, password 等）
 */
export class UserResponseDto extends BaseResponseDto {
  @Expose()
  @ApiProperty({ description: '用户ID' })
  userId: number;

  @Expose()
  @ApiPropertyOptional({ description: '部门ID' })
  deptId?: number;

  @Expose()
  @ApiProperty({ description: '用户账号' })
  userName: string;

  @Expose()
  @ApiProperty({ description: '用户昵称' })
  nickName: string;

  @Expose()
  @ApiPropertyOptional({ description: '用户类型（00系统用户）' })
  userType?: string;

  @Expose()
  @ApiPropertyOptional({ description: '用户邮箱' })
  email?: string;

  @Expose()
  @ApiPropertyOptional({ description: '手机号码' })
  phonenumber?: string;

  @Expose()
  @ApiPropertyOptional({ description: '用户性别', enum: SexEnum, enumName: 'SexEnum', enumSchema: SexEnumSchema })
  sex?: string;

  @Expose()
  @ApiPropertyOptional({ description: '头像地址' })
  avatar?: string;

  @Expose()
  @ApiPropertyOptional({
    description: '帐号状态',
    enum: StatusEnum,
    enumName: 'StatusEnum',
    enumSchema: StatusEnumSchema,
  })
  status?: string;

  @Expose()
  @ApiPropertyOptional({ description: '最后登录IP' })
  loginIp?: string;

  @Expose()
  @ApiPropertyOptional({ description: '最后登录时间', example: '2025-01-01 00:00:00' })
  @DateFormat()
  loginDate?: string;

  @Expose()
  @ApiPropertyOptional({ description: '部门名称' })
  deptName?: string;

  @Expose()
  @ApiPropertyOptional({ description: '部门信息' })
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

  @Expose()
  @ApiPropertyOptional({ description: '角色列表', type: [RoleResponseDto] })
  roles?: RoleResponseDto[];

  // createTime, updateTime, remark 继承自 BaseResponseDto，已自动应用 @DateFormat() 装饰器
}

/**
 * 用户列表响应 DTO
 */
export class UserListResponseDto {
  @ApiProperty({ description: '用户列表', type: [UserResponseDto] })
  rows: UserResponseDto[];

  @ApiProperty({ description: '总数量' })
  total: number;
}

/**
 * 用户详情响应 DTO（包含岗位和角色选项）
 */
export class UserDetailResponseDto {
  @ApiProperty({ description: '用户信息', type: UserResponseDto, required: false })
  data?: UserResponseDto;

  @ApiProperty({ description: '岗位选项列表', type: [PostResponseDto] })
  posts: PostResponseDto[];

  @ApiProperty({ description: '角色选项列表', type: [RoleResponseDto] })
  roles: RoleResponseDto[];

  @ApiProperty({ description: '用户已分配的岗位ID列表', type: [Number], required: false })
  postIds?: number[];

  @ApiProperty({ description: '用户已分配的角色ID列表', type: [Number], required: false })
  roleIds?: number[];
}

/**
 * 用户个人信息响应 DTO
 */
export class UserProfileResponseDto {
  @ApiProperty({ description: '用户信息', type: UserResponseDto })
  user: UserResponseDto;

  @ApiProperty({ description: '角色组名称' })
  roleGroup: string;

  @ApiProperty({ description: '岗位组名称' })
  postGroup: string;
}

/**
 * 用户头像响应 DTO
 */
export class UserAvatarResponseDto {
  @Expose()
  @ApiProperty({ description: '头像URL' })
  imgUrl: string;
}

/**
 * 授权角色数据响应 DTO
 */
export class AuthRoleResponseDto {
  @ApiProperty({ description: '用户信息', type: UserResponseDto })
  user: UserResponseDto;

  @ApiProperty({ description: '角色列表', type: [RoleResponseDto] })
  roles: RoleResponseDto[];
}

/**
 * 当前用户信息响应 DTO
 */
export class CurrentUserInfoResponseDto {
  @ApiProperty({ description: '用户信息', type: UserResponseDto })
  user: UserResponseDto;

  @ApiProperty({ description: '角色列表', type: [String], example: ['admin'] })
  roles: string[];

  @ApiProperty({ description: '权限列表', type: [String], example: ['system:user:list'] })
  permissions: string[];
}

/**
 * 用户选择框选项 DTO
 */
export class UserOptionResponseDto {
  @Expose()
  @ApiProperty({ description: '用户ID', example: 1 })
  userId: number;

  @Expose()
  @ApiProperty({ description: '用户名', example: 'admin' })
  userName: string;

  @Expose()
  @ApiProperty({ description: '昵称', example: '管理员' })
  nickName: string;
}

/**
 * 用户选择框列表响应 DTO
 */
export class UserOptionSelectResponseDto {
  @ApiProperty({ description: '用户选项列表', type: [UserOptionResponseDto] })
  list: UserOptionResponseDto[];
}
