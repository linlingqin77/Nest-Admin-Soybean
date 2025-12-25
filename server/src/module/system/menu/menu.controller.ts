import { Controller, Get, Post, Body, Query, Put, Param, Delete } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { MenuService } from './menu.service';
import { CreateMenuDto, UpdateMenuDto, ListMenuDto } from './dto/index';
import { RequirePermission } from 'src/common/decorators/require-premission.decorator';
import { Api } from 'src/common/decorators/api.decorator';
import { MenuVo, MenuTreeVo, RoleMenuTreeSelectVo } from './vo/menu.vo';
import { User, UserDto } from 'src/module/system/user/user.decorator';
import { Operlog } from 'src/common/decorators/operlog.decorator';
import { BusinessType } from 'src/common/constant/business.constant';
import { UserTool, UserToolType } from '../user/user.decorator';

@ApiTags('菜单管理')
@Controller('system/menu')
@ApiBearerAuth('Authorization')
export class MenuController {
  constructor(private readonly menuService: MenuService) {}

  @Api({
    summary: '菜单管理-获取路由',
    description: '获取当前用户的路由菜单',
    type: MenuVo,
    isArray: true,
  })
  @Get('/getRouters')
  getRouters(@User() user: UserDto) {
    const userId = user.userId;
    return this.menuService.getMenuListByUserId(+userId);
  }

  @Api({
    summary: '菜单管理-创建',
    description: '创建新菜单，支持目录、菜单、按钮三种类型',
    body: CreateMenuDto,
  })
  @RequirePermission('system:menu:add')
  @Operlog({ businessType: BusinessType.INSERT })
  @Post()
  create(@Body() createMenuDto: CreateMenuDto) {
    return this.menuService.create(createMenuDto);
  }

  @Api({
    summary: '菜单管理-列表',
    description: '获取菜单列表，支持按名称和状态筛选',
    type: MenuVo,
    isArray: true,
  })
  @RequirePermission('system:menu:list')
  @Get('/list')
  findAll(@Query() query: ListMenuDto) {
    return this.menuService.findAll(query);
  }

  @Api({
    summary: '菜单管理-树形选择',
    description: '获取菜单树形结构，用于下拉选择',
    type: MenuTreeVo,
    isArray: true,
  })
  @RequirePermission('system:menu:query')
  @Get('/treeselect')
  treeSelect() {
    return this.menuService.treeSelect();
  }

  @Api({
    summary: '菜单管理-角色菜单树',
    description: '获取角色已分配的菜单树结构',
    type: RoleMenuTreeSelectVo,
    params: [{ name: 'roleId', description: '角色ID', type: 'number' }],
  })
  @RequirePermission('system:menu:query')
  @Get('/roleMenuTreeselect/:roleId')
  roleMenuTreeselect(@Param('roleId') roleId: string) {
    return this.menuService.roleMenuTreeselect(+roleId);
  }

  @Api({
    summary: '菜单管理-租户套餐菜单树',
    description: '获取租户套餐已分配的菜单树结构',
    type: RoleMenuTreeSelectVo,
    params: [{ name: 'packageId', description: '套餐ID', type: 'number' }],
  })
  @Get('/tenantPackageMenuTreeselect/:packageId')
  tenantPackageMenuTreeselect(@Param('packageId') packageId: string) {
    return this.menuService.tenantPackageMenuTreeselect(+packageId);
  }

  @Api({
    summary: '菜单管理-详情',
    description: '根据菜单ID获取菜单详细信息',
    type: MenuVo,
    params: [{ name: 'menuId', description: '菜单ID', type: 'number' }],
  })
  @RequirePermission('system:menu:query')
  @Get(':menuId')
  findOne(@Param('menuId') menuId: string) {
    return this.menuService.findOne(+menuId);
  }

  @Api({
    summary: '菜单管理-修改',
    description: '修改菜单信息',
    body: UpdateMenuDto,
  })
  @RequirePermission('system:menu:edit')
  @Operlog({ businessType: BusinessType.UPDATE })
  @Put()
  update(@Body() updateMenuDto: UpdateMenuDto) {
    return this.menuService.update(updateMenuDto);
  }

  @Api({
    summary: '菜单管理-级联删除',
    description: '级联删除菜单，多个ID用逗号分隔',
    params: [{ name: 'menuIds', description: '菜单ID，多个用逗号分隔' }],
  })
  @RequirePermission('system:menu:remove')
  @Operlog({ businessType: BusinessType.DELETE })
  @Delete('/cascade/:menuIds')
  cascadeRemove(@Param('menuIds') menuIds: string) {
    const ids = menuIds.split(',').map((id) => +id);
    return this.menuService.cascadeRemove(ids);
  }

  @Api({
    summary: '菜单管理-删除',
    description: '删除菜单，会同时删除子菜单',
    params: [{ name: 'menuId', description: '菜单ID', type: 'number' }],
  })
  @RequirePermission('system:menu:remove')
  @Operlog({ businessType: BusinessType.DELETE })
  @Delete(':menuId')
  remove(@Param('menuId') menuId: string) {
    return this.menuService.remove(+menuId);
  }
}
