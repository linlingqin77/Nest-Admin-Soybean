import { ApiProperty } from '@nestjs/swagger';
import { StatusEnum, StatusEnumSchema, MenuTypeEnum, MenuTypeEnumSchema } from 'src/common/enum';

/**
 * 菜单基础信息
 */
export class MenuVo {
  @ApiProperty({ description: '菜单ID' })
  menuId: number;

  @ApiProperty({ description: '菜单名称' })
  menuName: string;

  @ApiProperty({ description: '父菜单ID' })
  parentId: number;

  @ApiProperty({ description: '显示顺序' })
  orderNum: number;

  @ApiProperty({ description: '路由地址' })
  path: string;

  @ApiProperty({ description: '组件路径' })
  component: string;

  @ApiProperty({ description: '路由参数' })
  query: string;

  @ApiProperty({
    description: '是否为外链（0是 1否）',
    enum: StatusEnum,
    enumName: 'StatusEnum',
    enumSchema: StatusEnumSchema,
  })
  isFrame: string;

  @ApiProperty({
    description: '是否缓存（0缓存 1不缓存）',
    enum: StatusEnum,
    enumName: 'StatusEnum',
    enumSchema: StatusEnumSchema,
  })
  isCache: string;

  @ApiProperty({
    description: '菜单类型',
    enum: MenuTypeEnum,
    enumName: 'MenuTypeEnum',
    enumSchema: MenuTypeEnumSchema,
  })
  menuType: string;

  @ApiProperty({
    description: '显示状态（0显示 1隐藏）',
    enum: StatusEnum,
    enumName: 'StatusEnum',
    enumSchema: StatusEnumSchema,
  })
  visible: string;

  @ApiProperty({ description: '菜单状态', enum: StatusEnum, enumName: 'StatusEnum', enumSchema: StatusEnumSchema })
  status: string;

  @ApiProperty({ description: '权限标识' })
  perms: string;

  @ApiProperty({ description: '菜单图标' })
  icon: string;

  @ApiProperty({ description: '备注' })
  remark: string;

  @ApiProperty({ description: '创建时间' })
  createTime: Date;

  @ApiProperty({ description: '更新时间' })
  updateTime: Date;
}

/**
 * 菜单树节点
 */
export class MenuTreeVo {
  @ApiProperty({ description: '菜单ID' })
  id: number;

  @ApiProperty({ description: '菜单名称' })
  label: string;

  @ApiProperty({ description: '子菜单列表', type: [MenuTreeVo], required: false })
  children?: MenuTreeVo[];
}

/**
 * 菜单列表响应
 */
export class MenuListVo {
  @ApiProperty({ description: '菜单列表', type: [MenuVo] })
  list: MenuVo[];
}

/**
 * 路由元信息
 */
export class RouterMetaVo {
  @ApiProperty({ description: '设置该路由在侧边栏和面包屑中展示的名字' })
  title: string;

  @ApiProperty({ description: '设置该路由的图标' })
  icon: string;

  @ApiProperty({ description: '设置为true，则不会被 <keep-alive>缓存' })
  noCache: boolean;

  @ApiProperty({ description: '内链地址（http(s)://开头）', required: false })
  link?: string;
}

/**
 * 路由信息
 */
export class RouterVo {
  @ApiProperty({ description: '路由名字' })
  name: string;

  @ApiProperty({ description: '路由地址' })
  path: string;

  @ApiProperty({ description: '是否隐藏路由，当设置 true 的时候该路由不会再侧边栏出现' })
  hidden: boolean;

  @ApiProperty({ description: '重定向地址，当设置 noRedirect 的时候该路由在面包屑导航中不可被点击', required: false })
  redirect?: string;

  @ApiProperty({ description: '组件地址' })
  component: string;

  @ApiProperty({ description: '路由参数', required: false })
  query?: string;

  @ApiProperty({
    description: '当你一个路由下面的 children 声明的路由大于1个时，自动会变成嵌套的模式',
    required: false,
  })
  alwaysShow?: boolean;

  @ApiProperty({ description: '其他元素', type: RouterMetaVo })
  meta: RouterMetaVo;

  @ApiProperty({ description: '子路由', type: [RouterVo], required: false })
  children?: RouterVo[];
}

/**
 * 菜单树选择响应
 */
export class MenuTreeSelectVo {
  @ApiProperty({ description: '菜单树数据', type: [MenuTreeVo] })
  menus: MenuTreeVo[];
}

/**
 * 角色菜单树响应
 */
export class RoleMenuTreeSelectVo {
  @ApiProperty({ description: '已选中的菜单ID列表', type: [Number] })
  checkedKeys: number[];

  @ApiProperty({ description: '菜单树数据', type: [MenuTreeVo] })
  menus: MenuTreeVo[];
}
