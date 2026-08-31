import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { BaseResponseDto } from 'src/shared/dto/base.response.dto';
import { StatusEnum, StatusEnumSchema, MenuTypeEnum, MenuTypeEnumSchema } from 'src/shared/enums';

/**
 * 菜单基础响应 DTO
 */
export class MenuResponseDto extends BaseResponseDto {
  @Expose()
  @ApiProperty({ description: '菜单ID' })
  menuId: number;

  @Expose()
  @ApiProperty({ description: '菜单名称' })
  menuName: string;

  @Expose()
  @ApiProperty({ description: '父菜单ID' })
  parentId: number;

  @Expose()
  @ApiProperty({ description: '显示顺序' })
  orderNum: number;

  @Expose()
  @ApiProperty({ description: '路由地址' })
  path: string;

  @Expose()
  @ApiProperty({ description: '组件路径' })
  component: string;

  @Expose()
  @ApiProperty({ description: '路由参数' })
  query: string;

  @Expose()
  @ApiProperty({
    description: '是否为外链（0是 1否）',
    enum: StatusEnum,
    enumName: 'StatusEnum',
    enumSchema: StatusEnumSchema,
  })
  isFrame: string;

  @Expose()
  @ApiProperty({
    description: '是否缓存（0缓存 1不缓存）',
    enum: StatusEnum,
    enumName: 'StatusEnum',
    enumSchema: StatusEnumSchema,
  })
  isCache: string;

  @Expose()
  @ApiProperty({
    description: '菜单类型',
    enum: MenuTypeEnum,
    enumName: 'MenuTypeEnum',
    enumSchema: MenuTypeEnumSchema,
  })
  menuType: string;

  @Expose()
  @ApiProperty({
    description: '显示状态（0显示 1隐藏）',
    enum: StatusEnum,
    enumName: 'StatusEnum',
    enumSchema: StatusEnumSchema,
  })
  visible: string;

  @Expose()
  @ApiProperty({ description: '菜单状态', enum: StatusEnum, enumName: 'StatusEnum', enumSchema: StatusEnumSchema })
  status: string;

  @Expose()
  @ApiProperty({ description: '权限标识' })
  perms: string;

  @Expose()
  @ApiProperty({ description: '菜单图标' })
  icon: string;
}

/**
 * 菜单树节点响应 DTO
 */
export class MenuTreeResponseDto {
  @Expose()
  @ApiProperty({ description: '菜单ID' })
  id: number;

  @Expose()
  @ApiProperty({ description: '菜单名称' })
  label: string;

  @Expose()
  @Type(() => MenuTreeResponseDto)
  @ApiProperty({ description: '子菜单列表', type: [MenuTreeResponseDto], required: false })
  children?: MenuTreeResponseDto[];
}

/**
 * 菜单列表响应 DTO
 */
export class MenuListResponseDto {
  @Expose()
  @Type(() => MenuResponseDto)
  @ApiProperty({ description: '菜单列表', type: [MenuResponseDto] })
  list: MenuResponseDto[];
}

/**
 * 路由元信息响应 DTO
 */
export class RouterMetaResponseDto {
  @Expose()
  @ApiProperty({ description: '设置该路由在侧边栏和面包屑中展示的名字' })
  title: string;

  @Expose()
  @ApiProperty({ description: '设置该路由的图标' })
  icon: string;

  @Expose()
  @ApiProperty({ description: '设置为true，则不会被 <keep-alive>缓存' })
  noCache: boolean;

  @Expose()
  @ApiProperty({ description: '内链地址（http(s)://开头）', required: false })
  link?: string;
}

/**
 * 路由信息响应 DTO
 */
export class RouterResponseDto {
  @Expose()
  @ApiProperty({ description: '路由名字' })
  name: string;

  @Expose()
  @ApiProperty({ description: '路由地址' })
  path: string;

  @Expose()
  @ApiProperty({ description: '是否隐藏路由，当设置 true 的时候该路由不会再侧边栏出现' })
  hidden: boolean;

  @Expose()
  @ApiProperty({ description: '重定向地址，当设置 noRedirect 的时候该路由在面包屑导航中不可被点击', required: false })
  redirect?: string;

  @Expose()
  @ApiProperty({ description: '组件地址' })
  component: string;

  @Expose()
  @ApiProperty({ description: '路由参数', required: false })
  query?: string;

  @Expose()
  @ApiProperty({
    description: '当你一个路由下面的 children 声明的路由大于1个时，自动会变成嵌套的模式',
    required: false,
  })
  alwaysShow?: boolean;

  @Expose()
  @Type(() => RouterMetaResponseDto)
  @ApiProperty({ description: '其他元素', type: RouterMetaResponseDto })
  meta: RouterMetaResponseDto;

  @Expose()
  @Type(() => RouterResponseDto)
  @ApiProperty({ description: '子路由', type: [RouterResponseDto], required: false })
  children?: RouterResponseDto[];
}

/**
 * 菜单树选择响应 DTO
 */
export class MenuTreeSelectResponseDto {
  @Expose()
  @Type(() => MenuTreeResponseDto)
  @ApiProperty({ description: '菜单树数据', type: [MenuTreeResponseDto] })
  menus: MenuTreeResponseDto[];
}

/**
 * 角色菜单树响应 DTO
 */
export class RoleMenuTreeSelectResponseDto {
  @Expose()
  @ApiProperty({ description: '已选中的菜单ID列表', type: [Number] })
  checkedKeys: number[];

  @Expose()
  @Type(() => MenuTreeResponseDto)
  @ApiProperty({ description: '菜单树数据', type: [MenuTreeResponseDto] })
  menus: MenuTreeResponseDto[];
}

/**
 * 创建菜单结果响应 DTO
 */
export class CreateMenuResultResponseDto {
  @Expose()
  @ApiProperty({ description: '创建的菜单ID', example: 1 })
  menuId: number;
}

/**
 * 更新菜单结果响应 DTO
 */
export class UpdateMenuResultResponseDto {
  @Expose()
  @ApiProperty({ description: '更新是否成功', example: true })
  success: boolean;
}

/**
 * 删除菜单结果响应 DTO
 */
export class DeleteMenuResultResponseDto {
  @Expose()
  @ApiProperty({ description: '删除的记录数', example: 1 })
  affected: number;
}

// 保持向后兼容的别名
export { MenuResponseDto as MenuVo };
export { MenuTreeResponseDto as MenuTreeVo };
export { MenuListResponseDto as MenuListVo };
export { RouterMetaResponseDto as RouterMetaVo };
export { RouterResponseDto as RouterVo };
export { MenuTreeSelectResponseDto as MenuTreeSelectVo };
export { RoleMenuTreeSelectResponseDto as RoleMenuTreeSelectVo };
export { CreateMenuResultResponseDto as CreateMenuResultVo };
export { UpdateMenuResultResponseDto as UpdateMenuResultVo };
export { DeleteMenuResultResponseDto as DeleteMenuResultVo };
