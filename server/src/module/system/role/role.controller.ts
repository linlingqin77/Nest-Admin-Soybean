import { Controller, Get, Post, Body, Put, Param, Query, Delete, Res } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { RoleService } from './role.service';
import { Response } from 'express';
import {
  CreateRoleDto,
  UpdateRoleDto,
  ListRoleDto,
  ChangeRoleStatusDto,
  AuthUserCancelDto,
  AuthUserCancelAllDto,
  AuthUserSelectAllDto,
} from './dto/index';
import { AllocatedListDto } from '../user/dto/index';
import { RequirePermission } from 'src/common/decorators/require-premission.decorator';
import { Api } from 'src/common/decorators/api.decorator';
import { RoleVo, RoleListVo, RoleDeptTreeVo, AllocatedUserListVo } from './vo/role.vo';
import { Operlog } from 'src/common/decorators/operlog.decorator';
import { BusinessType } from 'src/common/constant/business.constant';

import { UserService } from '../user/user.service';
import { User, UserDto, UserTool, UserToolType } from 'src/module/system/user/user.decorator';

@ApiTags('角色管理')
@Controller('system/role')
@ApiBearerAuth('Authorization')
export class RoleController {
  constructor(
    private readonly roleService: RoleService,
    private readonly userService: UserService,
  ) {}

  @Api({
    summary: '角色管理-创建',
    description: '创建新角色并分配权限',
    body: CreateRoleDto,
  })
  @RequirePermission('system:role:add')
  @Operlog({ businessType: BusinessType.INSERT })
  @Post()
  create(@Body() createRoleDto: CreateRoleDto, @UserTool() { injectCreate }: UserToolType) {
    return this.roleService.create(injectCreate(createRoleDto));
  }

  @Api({
    summary: '角色管理-列表',
    description: '分页查询角色列表',
    type: RoleListVo,
  })
  @RequirePermission('system:role:list')
  @Get('list')
  findAll(@Query() query: ListRoleDto, @User() user: UserDto) {
    return this.roleService.findAll(query);
  }

  @Api({
    summary: '角色管理-选择框列表',
    description: '获取角色选择框列表',
    type: RoleVo,
    isArray: true,
  })
  @Get('optionselect')
  optionselect(@Query('roleIds') roleIds?: string) {
    const ids = roleIds ? roleIds.split(',').map((id) => +id) : undefined;
    return this.roleService.optionselect(ids);
  }

  @Api({
    summary: '角色管理-部门树',
    description: '获取角色数据权限的部门树',
    type: RoleDeptTreeVo,
    params: [{ name: 'id', description: '角色ID', type: 'number' }],
  })
  @RequirePermission('system:role:edit')
  @Get('deptTree/:id')
  deptTree(@Param('id') id: string) {
    return this.roleService.deptTree(+id);
  }

  @Api({
    summary: '角色管理-详情',
    description: '根据角色ID获取角色详情',
    type: RoleVo,
    params: [{ name: 'id', description: '角色ID', type: 'number' }],
  })
  @RequirePermission('system:role:query')
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.roleService.findOne(+id);
  }

  @Api({
    summary: '角色管理-修改',
    description: '修改角色信息及权限',
    body: UpdateRoleDto,
  })
  @RequirePermission('system:role:edit')
  @Operlog({ businessType: BusinessType.UPDATE })
  @Put()
  update(@Body() updateRoleDto: UpdateRoleDto) {
    return this.roleService.update(updateRoleDto);
  }

  @Api({
    summary: '角色管理-数据权限修改',
    description: '修改角色的数据权限范围',
    body: UpdateRoleDto,
  })
  @RequirePermission('system:role:edit')
  @Operlog({ businessType: BusinessType.UPDATE })
  @Put('dataScope')
  dataScope(@Body() updateRoleDto: UpdateRoleDto) {
    return this.roleService.dataScope(updateRoleDto);
  }

  @Api({
    summary: '角色管理-修改状态',
    description: '启用或停用角色',
    body: ChangeRoleStatusDto,
  })
  @RequirePermission('system:role:edit')
  @Operlog({ businessType: BusinessType.UPDATE })
  @Put('changeStatus')
  changeStatus(@Body() changeStatusDto: ChangeRoleStatusDto) {
    return this.roleService.changeStatus(changeStatusDto);
  }

  @Api({
    summary: '角色管理-删除',
    description: '批量删除角色，多个ID用逗号分隔',
    params: [{ name: 'id', description: '角色ID，多个用逗号分隔' }],
  })
  @RequirePermission('system:role:remove')
  @Operlog({ businessType: BusinessType.DELETE })
  @Delete(':id')
  remove(@Param('id') ids: string) {
    const menuIds = ids.split(',').map((id) => +id);
    return this.roleService.remove(menuIds);
  }

  @Api({
    summary: '角色管理-已分配用户列表',
    description: '获取角色已分配的用户列表',
    type: AllocatedUserListVo,
  })
  @RequirePermission('system:role:query')
  @Get('authUser/allocatedList')
  authUserAllocatedList(@Query() query: AllocatedListDto) {
    return this.userService.allocatedList(query);
  }

  @Api({
    summary: '角色管理-未分配用户列表',
    description: '获取角色未分配的用户列表',
    type: AllocatedUserListVo,
  })
  @RequirePermission('system:role:query')
  @Get('authUser/unallocatedList')
  authUserUnAllocatedList(@Query() query: AllocatedListDto) {
    return this.userService.unallocatedList(query);
  }

  @Api({
    summary: '角色管理-解绑用户',
    description: '取消用户与角色的绑定关系',
    body: AuthUserCancelDto,
  })
  @RequirePermission('system:role:edit')
  @Operlog({ businessType: BusinessType.GRANT })
  @Put('authUser/cancel')
  authUserCancel(@Body() body: AuthUserCancelDto) {
    return this.userService.authUserCancel(body);
  }

  @Api({
    summary: '角色管理-批量解绑用户',
    description: '批量取消用户与角色的绑定关系',
    body: AuthUserCancelAllDto,
  })
  @RequirePermission('system:role:edit')
  @Operlog({ businessType: BusinessType.GRANT })
  @Put('authUser/cancelAll')
  authUserCancelAll(@Body() body: AuthUserCancelAllDto) {
    return this.userService.authUserCancelAll(body);
  }

  @Api({
    summary: '角色管理-批量绑定用户',
    description: '批量将用户绑定到角色',
    body: AuthUserSelectAllDto,
  })
  @RequirePermission('system:role:edit')
  @Operlog({ businessType: BusinessType.GRANT })
  @Put('authUser/selectAll')
  authUserSelectAll(@Body() body: AuthUserSelectAllDto) {
    return this.userService.authUserSelectAll(body);
  }

  @Api({
    summary: '角色管理-导出Excel',
    description: '导出角色管理数据为xlsx文件',
    body: ListRoleDto,
    produces: ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
  })
  @RequirePermission('system:role:export')
  @Operlog({ businessType: BusinessType.EXPORT })
  @Post('/export')
  async export(@Res() res: Response, @Body() body: ListRoleDto): Promise<void> {
    return this.roleService.export(res, body);
  }
}
