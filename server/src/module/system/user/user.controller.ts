import {
  Controller,
  Get,
  Post,
  Body,
  Put,
  Param,
  Query,
  Res,
  Delete,
  Request,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { UserService } from './user.service';
import { Response } from 'express';
import { RequirePermission } from 'src/common/decorators/require-premission.decorator';
import { RequireRole } from 'src/common/decorators/require-role.decorator';
import { UploadService } from 'src/module/upload/upload.service';
import {
  CreateUserDto,
  UpdateUserDto,
  ListUserDto,
  ChangeUserStatusDto,
  ResetPwdDto,
  UpdateProfileDto,
  UpdatePwdDto,
} from './dto/index';
import { FileInterceptor } from '@nestjs/platform-express';
import { Result } from 'src/common/response';
import { User, UserDto, UserTool, UserToolType } from 'src/module/system/user/user.decorator';
import { BusinessType } from 'src/common/constant/business.constant';
import { Operlog } from 'src/common/decorators/operlog.decorator';
import { Api } from 'src/common/decorators/api.decorator';
import { UserVo, UserListVo, UserDetailVo, UserProfileVo, UserAvatarVo, AuthRoleVo } from './vo/user.vo';
import { DeptTreeNodeVo } from 'src/common/dto/dept-tree-node.vo';

@ApiTags('用户管理')
@Controller('system/user')
@ApiBearerAuth('Authorization')
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly uploadService: UploadService,
  ) {}

  /**
   * 获取当前登录用户信息 - 供 Soybean 前端调用
   * GET /system/user/getInfo
   */
  @Api({
    summary: '获取当前用户信息',
    description: '获取当前登录用户的详细信息、角色和权限',
  })
  @Get('getInfo')
  getInfo(@User() user: UserDto) {
    // 移除敏感字段
    const safeUser = { ...user.user };
    delete safeUser.password;

    // 返回 Soybean 前端期望的格式
    return Result.ok({
      user: safeUser,
      roles: user.roles || [],
      permissions: user.permissions || [],
    });
  }

  @Api({
    summary: '个人中心-用户信息',
    description: '获取当前登录用户的个人信息',
    type: UserVo,
  })
  @RequirePermission('system:user:query')
  @Get('/profile')
  profile(@User() user: UserDto) {
    return Result.ok(user.user);
  }

  @Api({
    summary: '个人中心-修改用户信息',
    description: '修改当前用户的个人基本信息',
    body: UpdateProfileDto,
  })
  @RequirePermission('system:user:edit')
  @Put('/profile')
  @Operlog({ businessType: BusinessType.UPDATE })
  updateProfile(@User() user: UserDto, @Body() updateProfileDto: UpdateProfileDto) {
    return this.userService.updateProfile(user, updateProfileDto);
  }

  @Api({
    summary: '个人中心-上传用户头像',
    description: '上传并更新当前用户头像',
    type: UserAvatarVo,
    fileUpload: {
      fieldName: 'avatarfile',
      description: '用户头像图片',
      allowedTypes: ['image/jpeg', 'image/png', 'image/gif'],
      maxSize: '2MB',
    },
  })
  @RequirePermission('system:user:edit')
  @Post('/profile/avatar')
  @UseInterceptors(FileInterceptor('avatarfile'))
  async avatar(@UploadedFile() avatarfile: Express.Multer.File, @User() user: UserDto) {
    const res = await this.uploadService.singleFileUpload(avatarfile);
    return Result.ok({ imgUrl: res.fileName });
  }

  @Api({
    summary: '个人中心-修改密码',
    description: '修改当前用户的登录密码',
    body: UpdatePwdDto,
  })
  @RequirePermission('system:user:edit')
  @Operlog({ businessType: BusinessType.UPDATE })
  @Put('/profile/updatePwd')
  updatePwd(@User() user: UserDto, @Body() updatePwdDto: UpdatePwdDto) {
    return this.userService.updatePwd(user, updatePwdDto);
  }

  @Api({
    summary: '用户-创建',
    description: '创建新用户，可分配角色和岗位',
    body: CreateUserDto,
  })
  @RequirePermission('system:user:add')
  @Operlog({ businessType: BusinessType.INSERT })
  @Post()
  create(@Body() createUserDto: CreateUserDto, @UserTool() { injectCreate }: UserToolType) {
    return this.userService.create(injectCreate(createUserDto));
  }

  @Api({
    summary: '用户-列表',
    description: '分页查询用户列表，支持多条件筛选',
    type: UserListVo,
  })
  @RequirePermission('system:user:list')
  @Get('list')
  findAll(@Query() query: ListUserDto, @User() user: UserDto) {
    return this.userService.findAll(query, user.user);
  }

  @Api({
    summary: '用户-部门树',
    description: '获取部门树形结构，用于用户筛选',
    type: DeptTreeNodeVo,
    isArray: true,
  })
  @RequirePermission('system:dept:query')
  @Get('deptTree')
  deptTree() {
    return this.userService.deptTree();
  }

  @Api({
    summary: '用户-角色和岗位列表',
    description: '获取所有角色和岗位列表，用于新建/编辑用户时选择',
    type: UserDetailVo,
  })
  @RequirePermission('system:user:add')
  @Get()
  findPostAndRoleAll() {
    return this.userService.findPostAndRoleAll();
  }

  @Api({
    summary: '用户-分配角色详情',
    description: '获取用户已分配的角色信息',
    type: AuthRoleVo,
    params: [{ name: 'id', description: '用户ID', type: 'number' }],
  })
  @RequireRole('admin')
  @Get('authRole/:id')
  authRole(@Param('id') id: string) {
    return this.userService.authRole(+id);
  }

  @Api({
    summary: '用户-更新角色分配',
    description: '更新用户的角色分配',
    queries: [
      { name: 'userId', description: '用户ID', required: true, type: 'number' },
      { name: 'roleIds', description: '角色ID列表，逗号分隔', required: true },
    ],
  })
  @RequireRole('admin')
  @Put('authRole')
  updateAuthRole(@Query() query) {
    return this.userService.updateAuthRole(query);
  }

  @Api({
    summary: '用户-选择框列表',
    description: '获取用户选择框列表',
  })
  @Get('optionselect')
  optionselect() {
    return this.userService.optionselect();
  }

  @Api({
    summary: '用户-部门用户列表',
    description: '获取指定部门的用户列表',
    params: [{ name: 'deptId', description: '部门ID', type: 'number' }],
  })
  @Get('list/dept/:deptId')
  findByDeptId(@Param('deptId') deptId: string) {
    return this.userService.findByDeptId(+deptId);
  }

  @Api({
    summary: '用户-详情',
    description: '根据用户ID获取用户详细信息',
    type: UserDetailVo,
    params: [{ name: 'userId', description: '用户ID', type: 'number' }],
  })
  @RequirePermission('system:user:query')
  @Get(':userId')
  findOne(@Param('userId') userId: string) {
    return this.userService.findOne(+userId);
  }

  @Api({
    summary: '用户-修改状态',
    description: '启用或停用用户账号',
    body: ChangeUserStatusDto,
  })
  @RequireRole('admin')
  @Operlog({ businessType: BusinessType.UPDATE })
  @Put('changeStatus')
  changeStatus(@Body() changeStatusDto: ChangeUserStatusDto) {
    return this.userService.changeStatus(changeStatusDto);
  }

  @Api({
    summary: '用户-更新',
    description: '更新用户基本信息',
    body: UpdateUserDto,
  })
  @RequirePermission('system:user:edit')
  @Operlog({ businessType: BusinessType.UPDATE })
  @Put()
  async update(@Body() updateUserDto: UpdateUserDto, @User() user: UserDto) {
    const activeUserId = user.userId;
    // const uuid = user.token;
    const result = await this.userService.update(updateUserDto, activeUserId);
    // await this.userService.updateRedisUserRolesAndPermissions(uuid, updateUserDto.userId);
    return result;
  }

  @Api({
    summary: '用户-重置密码',
    description: '管理员重置用户密码',
    body: ResetPwdDto,
  })
  @RequireRole('admin')
  @Operlog({ businessType: BusinessType.UPDATE })
  @Put('resetPwd')
  resetPwd(@Body() body: ResetPwdDto) {
    return this.userService.resetPwd(body);
  }

  @Api({
    summary: '用户-删除',
    description: '批量删除用户，多个ID用逗号分隔',
    params: [{ name: 'id', description: '用户ID，多个用逗号分隔' }],
  })
  @RequireRole('admin')
  @Operlog({ businessType: BusinessType.DELETE })
  @Delete(':id')
  remove(@Param('id') ids: string) {
    const menuIds = ids.split(',').map((id) => +id);
    return this.userService.remove(menuIds);
  }

  @Api({
    summary: '用户-导出Excel',
    description: '导出用户信息数据为xlsx文件',
    body: ListUserDto,
    produces: ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
  })
  @RequirePermission('system:user:export')
  @Operlog({ businessType: BusinessType.EXPORT })
  @Post('/export')
  async export(@Res() res: Response, @Body() body: ListUserDto, @User() user: UserDto): Promise<void> {
    return this.userService.export(res, body, user.user);
  }
}
