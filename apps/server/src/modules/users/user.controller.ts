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
import { RequirePermission } from 'src/core/http/decorators/require-permission.decorator';
import { RequireRole } from 'src/core/http/decorators/require-role.decorator';
import { UploadService } from 'src/modules/files/upload.service';
import {
  CreateUserRequestDto,
  UpdateUserRequestDto,
  ListUserRequestDto,
  ChangeUserStatusRequestDto,
  ResetPwdRequestDto,
  UpdateProfileRequestDto,
  UpdatePwdRequestDto,
  BatchCreateUserRequestDto,
  BatchDeleteUserRequestDto,
  BatchResultResponseDto,
  UserResponseDto,
  UserListResponseDto,
  UserDetailResponseDto,
  UserProfileResponseDto,
  UserAvatarResponseDto,
  AuthRoleResponseDto,
  CurrentUserInfoResponseDto,
  UserOptionSelectResponseDto,
} from './dto/index';
import { FileInterceptor } from '@nestjs/platform-express';
import { Result } from 'src/shared/response';
import { User, UserDto, UserTool, UserToolType } from 'src/modules/users/user.decorator';
import { BusinessType } from 'src/shared/constants/business.constant';
import { Operlog } from 'src/core/audit/decorators/operlog.decorator';
import { Api } from 'src/core/http/decorators/api.decorator';
import { DeptTreeNodeResponseDto } from 'src/shared/dto/dept-tree-node.response.dto';

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
    type: CurrentUserInfoResponseDto,
  })
  @Get('getInfo')
  getInfo(@User() user: UserDto) {
    // 移除敏感字段
    const safeUser: any = { ...user.user };
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
    type: UserResponseDto,
  })
  @RequirePermission('system:user:query')
  @Get('/profile')
  profile(@User() user: UserDto) {
    return Result.ok(user.user);
  }

  @Api({
    summary: '个人中心-修改用户信息',
    description: '修改当前用户的个人基本信息',
    body: UpdateProfileRequestDto,
  })
  @RequirePermission('system:user:edit')
  @Put('/profile')
  @Operlog({ businessType: BusinessType.UPDATE })
  updateProfile(@User() user: UserDto, @Body() updateProfileDto: UpdateProfileRequestDto) {
    return this.userService.updateProfile(user, updateProfileDto);
  }

  @Api({
    summary: '个人中心-上传用户头像',
    description: '上传并更新当前用户头像',
    type: UserAvatarResponseDto,
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
    body: UpdatePwdRequestDto,
  })
  @RequirePermission('system:user:edit')
  @Operlog({ businessType: BusinessType.UPDATE })
  @Put('/profile/updatePwd')
  updatePwd(@User() user: UserDto, @Body() updatePwdDto: UpdatePwdRequestDto) {
    return this.userService.updatePwd(user, updatePwdDto);
  }

  @Api({
    summary: '用户-创建',
    description: '创建新用户，可分配角色和岗位',
    body: CreateUserRequestDto,
  })
  @RequirePermission('system:user:add')
  @Operlog({ businessType: BusinessType.INSERT })
  @Post()
  create(@Body() createUserDto: CreateUserRequestDto, @UserTool() { injectCreate }: UserToolType) {
    return this.userService.create(injectCreate(createUserDto));
  }

  @Api({
    summary: '用户-批量创建',
    description: '批量创建用户，单次最多100个，返回每个用户的创建结果',
    body: BatchCreateUserRequestDto,
    type: BatchResultResponseDto,
  })
  @RequirePermission('system:user:add')
  @Operlog({ businessType: BusinessType.INSERT })
  @Post('batch')
  batchCreate(@Body() batchCreateDto: BatchCreateUserRequestDto) {
    return this.userService.batchCreate(batchCreateDto);
  }

  @Api({
    summary: '用户-批量删除',
    description: '批量删除用户，单次最多100个，返回每个用户的删除结果',
    body: BatchDeleteUserRequestDto,
    type: BatchResultResponseDto,
  })
  @RequireRole('admin')
  @Operlog({ businessType: BusinessType.DELETE })
  @Delete('batch')
  batchDelete(@Body() batchDeleteDto: BatchDeleteUserRequestDto) {
    return this.userService.batchDelete(batchDeleteDto);
  }

  @Api({
    summary: '用户-列表',
    description: '分页查询用户列表，支持多条件筛选',
    type: UserListResponseDto,
  })
  @RequirePermission('system:user:list')
  @Get('list')
  findAll(@Query() query: ListUserRequestDto, @User() user: UserDto) {
    return this.userService.findAll(query, user.user);
  }

  @Api({
    summary: '用户-部门树',
    description: '获取部门树形结构，用于用户筛选',
    type: DeptTreeNodeResponseDto,
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
    type: UserDetailResponseDto,
  })
  @RequirePermission('system:user:add')
  @Get()
  findPostAndRoleAll() {
    return this.userService.findPostAndRoleAll();
  }

  @Api({
    summary: '用户-分配角色详情',
    description: '获取用户已分配的角色信息',
    type: AuthRoleResponseDto,
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
  updateAuthRole(@Query() query: { userId: number; roleIds: number | string }) {
    return this.userService.updateAuthRole(query);
  }

  @Api({
    summary: '用户-选择框列表',
    description: '获取用户选择框列表',
    type: UserOptionSelectResponseDto,
  })
  @Get('optionselect')
  optionselect() {
    return this.userService.optionselect();
  }

  @Api({
    summary: '用户-部门用户列表',
    description: '获取指定部门的用户列表',
    params: [{ name: 'deptId', description: '部门ID', type: 'number' }],
    type: UserListResponseDto,
  })
  @Get('list/dept/:deptId')
  findByDeptId(@Param('deptId') deptId: string) {
    return this.userService.findByDeptId(+deptId);
  }

  @Api({
    summary: '用户-详情',
    description: '根据用户ID获取用户详细信息',
    type: UserDetailResponseDto,
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
    body: ChangeUserStatusRequestDto,
  })
  @RequireRole('admin')
  @Operlog({ businessType: BusinessType.UPDATE })
  @Put('changeStatus')
  changeStatus(@Body() changeStatusDto: ChangeUserStatusRequestDto) {
    return this.userService.changeStatus(changeStatusDto);
  }

  @Api({
    summary: '用户-更新',
    description: '更新用户基本信息',
    body: UpdateUserRequestDto,
  })
  @RequirePermission('system:user:edit')
  @Operlog({ businessType: BusinessType.UPDATE })
  @Put()
  async update(@Body() updateUserDto: UpdateUserRequestDto, @User() user: UserDto) {
    const activeUserId = user.userId;
    return this.userService.update(updateUserDto, activeUserId);
  }

  @Api({
    summary: '用户-重置密码',
    description: '管理员重置用户密码',
    body: ResetPwdRequestDto,
  })
  @RequireRole('admin')
  @Operlog({ businessType: BusinessType.UPDATE })
  @Put('resetPwd')
  resetPwd(@Body() body: ResetPwdRequestDto) {
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
    body: ListUserRequestDto,
    produces: ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
  })
  @RequirePermission('system:user:export')
  @Operlog({ businessType: BusinessType.EXPORT })
  @Post('/export')
  async export(@Res() res: Response, @Body() body: ListUserRequestDto, @User() user: UserDto): Promise<void> {
    return this.userService.export(res, body, user.user);
  }
}
