import { BadRequestException, Body, Controller, Delete, Get, Param, Post, Put, Query, Res } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { RoleService } from './role.service';
import { Response } from 'express';
import {
  AllocatedUserListResponseDto,
  AuthUserCancelAllRequestDto,
  AuthUserCancelRequestDto,
  AuthUserResultResponseDto,
  AuthUserSelectAllRequestDto,
  ChangeRoleStatusRequestDto,
  ChangeRoleStatusResultResponseDto,
  CreateRoleRequestDto,
  CreateRoleResultResponseDto,
  DataScopeResultResponseDto,
  DeleteRoleResultResponseDto,
  ListRoleRequestDto,
  RoleDeptTreeResponseDto,
  RoleListResponseDto,
  RoleResponseDto,
  UpdateRoleRequestDto,
  UpdateRoleResultResponseDto,
} from './dto/index';
import { AllocatedListRequestDto } from '../users/dto/index';
import { RequirePermission } from 'src/core/http/decorators/require-permission.decorator';
import { Api } from 'src/core/http/decorators/api.decorator';
import { Operlog } from 'src/core/audit/decorators/operlog.decorator';
import { BusinessType } from 'src/shared/constants/business.constant';

import { UserService } from '../users/user.service';
import { User, UserDto, UserTool, UserToolType } from 'src/modules/users/user.decorator';

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
    body: CreateRoleRequestDto,
    type: CreateRoleResultResponseDto,
  })
  @RequirePermission('system:role:add')
  @Operlog({ businessType: BusinessType.INSERT })
  @Post()
  create(@Body() createRoleDto: CreateRoleRequestDto, @UserTool() { injectCreate }: UserToolType) {
    return this.roleService.create(injectCreate(createRoleDto));
  }

  @Api({
    summary: '角色管理-列表',
    description: '分页查询角色列表',
    type: RoleListResponseDto,
  })
  @RequirePermission('system:role:list')
  @Get('list')
  findAll(@Query() query: ListRoleRequestDto, @User() user: UserDto) {
    return this.roleService.findAll(query);
  }

  @Api({
    summary: '角色管理-选择框列表',
    description: '获取角色选择框列表',
    type: RoleResponseDto,
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
    type: RoleDeptTreeResponseDto,
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
    type: RoleResponseDto,
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
    body: UpdateRoleRequestDto,
    type: UpdateRoleResultResponseDto,
  })
  @RequirePermission('system:role:edit')
  @Operlog({ businessType: BusinessType.UPDATE })
  @Put()
  update(@Body() updateRoleDto: UpdateRoleRequestDto) {
    return this.roleService.update(updateRoleDto);
  }

  @Api({
    summary: '角色管理-数据权限修改',
    description: '修改角色的数据权限范围',
    body: UpdateRoleRequestDto,
    type: DataScopeResultResponseDto,
  })
  @RequirePermission('system:role:edit')
  @Operlog({ businessType: BusinessType.UPDATE })
  @Put('dataScope')
  dataScope(@Body() updateRoleDto: UpdateRoleRequestDto) {
    return this.roleService.dataScope(updateRoleDto);
  }

  @Api({
    summary: '角色管理-修改状态',
    description: '启用或停用角色',
    body: ChangeRoleStatusRequestDto,
    type: ChangeRoleStatusResultResponseDto,
  })
  @RequirePermission('system:role:edit')
  @Operlog({ businessType: BusinessType.UPDATE })
  @Put('changeStatus')
  changeStatus(@Body() changeStatusDto: ChangeRoleStatusRequestDto) {
    return this.roleService.changeStatus(changeStatusDto);
  }

  @Api({
    summary: '角色管理-删除',
    description: '批量删除角色，多个ID用逗号分隔',
    params: [{ name: 'id', description: '角色ID，多个用逗号分隔' }],
    type: DeleteRoleResultResponseDto,
  })
  @RequirePermission('system:role:remove')
  @Operlog({ businessType: BusinessType.DELETE })
  @Delete(':id')
  remove(@Param('id') ids: string) {
    const menuIds = ids.split(',').map((s) => Number(s.trim()));
    if (menuIds.some((n) => !Number.isFinite(n))) {
      throw new BadRequestException('Invalid ID format');
    }
    return this.roleService.remove(menuIds);
  }

  @Api({
    summary: '角色管理-已分配用户列表',
    description: '获取角色已分配的用户列表',
    type: AllocatedUserListResponseDto,
  })
  @RequirePermission('system:role:query')
  @Get('authUser/allocatedList')
  authUserAllocatedList(@Query() query: AllocatedListRequestDto) {
    return this.userService.allocatedList(query);
  }

  @Api({
    summary: '角色管理-未分配用户列表',
    description: '获取角色未分配的用户列表',
    type: AllocatedUserListResponseDto,
  })
  @RequirePermission('system:role:query')
  @Get('authUser/unallocatedList')
  authUserUnAllocatedList(@Query() query: AllocatedListRequestDto) {
    return this.userService.unallocatedList(query);
  }

  @Api({
    summary: '角色管理-解绑用户',
    description: '取消用户与角色的绑定关系',
    body: AuthUserCancelRequestDto,
    type: AuthUserResultResponseDto,
  })
  @RequirePermission('system:role:edit')
  @Operlog({ businessType: BusinessType.GRANT })
  @Put('authUser/cancel')
  authUserCancel(@Body() body: AuthUserCancelRequestDto) {
    return this.userService.authUserCancel(body);
  }

  @Api({
    summary: '角色管理-批量解绑用户',
    description: '批量取消用户与角色的绑定关系',
    body: AuthUserCancelAllRequestDto,
    type: AuthUserResultResponseDto,
  })
  @RequirePermission('system:role:edit')
  @Operlog({ businessType: BusinessType.GRANT })
  @Put('authUser/cancelAll')
  authUserCancelAll(@Body() body: AuthUserCancelAllRequestDto) {
    return this.userService.authUserCancelAll(body);
  }

  @Api({
    summary: '角色管理-批量绑定用户',
    description: '批量将用户绑定到角色',
    body: AuthUserSelectAllRequestDto,
    type: AuthUserResultResponseDto,
  })
  @RequirePermission('system:role:edit')
  @Operlog({ businessType: BusinessType.GRANT })
  @Put('authUser/selectAll')
  authUserSelectAll(@Body() body: AuthUserSelectAllRequestDto) {
    return this.userService.authUserSelectAll(body);
  }

  @Api({
    summary: '角色管理-导出Excel',
    description: '导出角色管理数据为xlsx文件',
    body: ListRoleRequestDto,
    produces: ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
  })
  @RequirePermission('system:role:export')
  @Operlog({ businessType: BusinessType.EXPORT })
  @Get('/export')
  async export(@Res() res: Response, @Query() query: ListRoleRequestDto): Promise<void> {
    return this.roleService.export(res, query);
  }
}
