import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { StatusEnum, StatusEnumSchema, SexEnum, SexEnumSchema } from 'src/shared/enums';
import { DateFormat } from 'src/shared/decorators';

/**
 * 角色简要信息 DTO
 *
 * @description 用户关联的角色信息
 */
export class RoleInfoResponseDto {
  @Expose()
  @ApiProperty({ description: '角色ID', example: 1 })
  roleId: number;

  @Expose()
  @ApiProperty({ description: '角色名称', example: '超级管理员' })
  roleName: string;

  @Expose()
  @ApiProperty({ description: '角色权限字符串', example: 'admin' })
  roleKey: string;
}

/**
 * 部门简要信息 DTO
 *
 * @description 用户所属部门信息
 */
export class DeptInfoResponseDto {
  @Expose()
  @ApiProperty({ description: '部门ID', example: 100 })
  deptId: number;

  @Expose()
  @ApiProperty({ description: '部门名称', example: '研发部门' })
  deptName: string;
}

/**
 * 用户概要信息 DTO
 *
 * @description 用户详细信息
 */
export class UserProfileResponseDto {
  @Expose()
  @ApiProperty({ description: '用户ID', example: 1 })
  userId: number;

  @Expose()
  @ApiProperty({ description: '部门ID', example: 100 })
  deptId: number;

  @Expose()
  @ApiProperty({ description: '用户账号', example: 'admin' })
  userName: string;

  @Expose()
  @ApiProperty({ description: '用户昵称', example: '管理员' })
  nickName: string;

  @Expose()
  @ApiProperty({ description: '用户类型', example: '00' })
  userType: string;

  @Expose()
  @ApiProperty({ description: '用户邮箱', example: 'admin@example.com' })
  email: string;

  @Expose()
  @ApiProperty({ description: '手机号码', example: '13800138000' })
  phonenumber: string;

  @Expose()
  @ApiProperty({
    description: '用户性别（0男 1女 2未知）',
    enum: SexEnum,
    enumName: 'SexEnum',
    enumSchema: SexEnumSchema,
    example: '0',
  })
  sex: string;

  @Expose()
  @ApiProperty({ description: '头像地址', example: '/profile/avatar/2024/01/01/avatar.png' })
  avatar: string;

  @Expose()
  @ApiProperty({
    description: '帐号状态（0正常 1停用）',
    enum: StatusEnum,
    enumName: 'StatusEnum',
    enumSchema: StatusEnumSchema,
    example: '0',
  })
  status: string;

  @Expose()
  @ApiProperty({ description: '最后登录IP', example: '127.0.0.1' })
  loginIp: string;

  @Expose()
  @ApiProperty({ description: '最后登录时间', example: '2025-01-01 12:00:00' })
  @DateFormat()
  loginDate: string;

  @Expose()
  @ApiProperty({ description: '创建时间', example: '2025-01-01 00:00:00' })
  @DateFormat()
  createTime: string;

  @Expose()
  @ApiProperty({ description: '更新时间', example: '2025-01-01 12:00:00' })
  @DateFormat()
  updateTime: string;

  @Expose()
  @ApiProperty({ description: '部门信息', required: false, type: DeptInfoResponseDto })
  @Type(() => DeptInfoResponseDto)
  dept?: DeptInfoResponseDto;

  @Expose()
  @ApiProperty({ description: '角色列表', type: [RoleInfoResponseDto], required: false })
  @Type(() => RoleInfoResponseDto)
  roles?: RoleInfoResponseDto[];
}

/**
 * 用户信息响应（getInfo）DTO
 *
 * @description 获取当前登录用户信息接口返回的数据
 * @example
 * ```json
 * {
 *   "user": {
 *     "userId": 1,
 *     "userName": "admin",
 *     "nickName": "管理员",
 *     "email": "admin@example.com",
 *     "dept": { "deptId": 100, "deptName": "研发部门" },
 *     "roles": [{ "roleId": 1, "roleName": "超级管理员", "roleKey": "admin" }]
 *   },
 *   "roles": ["admin"],
 *   "permissions": ["*:*:*"]
 * }
 * ```
 */
export class GetInfoResponseDto {
  @Expose()
  @ApiProperty({ description: '用户信息', type: UserProfileResponseDto })
  @Type(() => UserProfileResponseDto)
  user: UserProfileResponseDto;

  @Expose()
  @ApiProperty({ description: '角色权限字符串集合', type: [String], example: ['admin', 'common'] })
  roles: string[];

  @Expose()
  @ApiProperty({ description: '菜单权限集合', type: [String], example: ['*:*:*', 'system:user:list'] })
  permissions: string[];
}
