import { Injectable, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { RedisService } from 'src/module/common/redis/redis.service';
import * as bcrypt from 'bcryptjs';
import { Response } from 'express';
import { Prisma, SysDept, SysPost, SysRole, SysUser } from '@prisma/client';
import { GetNowDate, GenerateUUID, Uniq, FormatDate, FormatDateFields } from 'src/common/utils/index';
import { ExportTable } from 'src/common/utils/export';

import { CacheEnum, DelFlagEnum, StatusEnum, DataScopeEnum } from 'src/common/enum/index';
import { LOGIN_TOKEN_EXPIRESIN, SYS_USER_TYPE } from 'src/common/constant/index';
import { ResultData } from 'src/common/utils/result';
import { CreateUserDto, UpdateUserDto, ListUserDto, ChangeUserStatusDto, ResetPwdDto, AllocatedListDto, UpdateProfileDto, UpdatePwdDto } from './dto/index';
import { RegisterDto, LoginDto } from '../../main/dto/index';
import { AuthUserCancelDto, AuthUserCancelAllDto, AuthUserSelectAllDto } from '../role/dto/index';

import { RoleService } from '../role/role.service';
import { DeptService } from '../dept/dept.service';

import { ConfigService } from '../config/config.service';
import { UserType } from './dto/user';
import { ClientInfoDto } from 'src/common/decorators/common.decorator';
import { Cacheable, CacheEvict } from 'src/common/decorators/redis.decorator';
import { Captcha } from 'src/common/decorators/captcha.decorator';
import { PrismaService } from 'src/prisma/prisma.service';

type UserWithDept = SysUser & { dept?: SysDept | null };
type UserWithRelations = UserWithDept & { roles?: SysRole[]; posts?: SysPost[] };

@Injectable()
export class UserService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly roleService: RoleService,
    private readonly deptService: DeptService,
    private readonly jwtService: JwtService,
    private readonly redisService: RedisService,
    private readonly configService: ConfigService,
  ) { }

  private getPagination(payload: { pageSize?: number | string; pageNum?: number | string }) {
    const pageSize = Number(payload.pageSize ?? 10);
    const pageNum = Number(payload.pageNum ?? 1);
    const take = pageSize;
    const skip = take * (pageNum - 1);
    return { pageSize, pageNum, skip, take };
  }

  private async attachDeptInfo(users: SysUser[]): Promise<UserWithDept[]> {
    if (!users.length) {
      return users;
    }
    const deptIds = Array.from(new Set(users.map((item) => item.deptId).filter((deptId): deptId is number => typeof deptId === 'number' && !Number.isNaN(deptId))));
    if (!deptIds.length) {
      return users;
    }
    const depts = await this.prisma.sysDept.findMany({
      where: {
        deptId: { in: deptIds },
        delFlag: DelFlagEnum.NORMAL,
      },
    });
    const deptMap = new Map<number, SysDept>(depts.map((dept) => [dept.deptId, dept]));
    return users.map((item) => ({
      ...item,
      dept: deptMap.get(item.deptId) ?? null,
    }));
  }

  private async buildDataScopeConditions(currentUser?: UserType['user']): Promise<Prisma.SysUserWhereInput[]> {
    if (!currentUser) {
      return [];
    }
    const deptIdSet = new Set<number>();
    let dataScopeAll = false;
    let dataScopeSelf = false;
    const roles = currentUser.roles ?? [];

    for (const role of roles) {
      switch (role.dataScope) {
        case DataScopeEnum.DATA_SCOPE_ALL:
          dataScopeAll = true;
          break;
        case DataScopeEnum.DATA_SCOPE_CUSTOM: {
          const roleDeptIds = await this.roleService.findRoleWithDeptIds(role.roleId);
          roleDeptIds.forEach((id) => deptIdSet.add(id));
          break;
        }
        case DataScopeEnum.DATA_SCOPE_DEPT:
        case DataScopeEnum.DATA_SCOPE_DEPT_AND_CHILD: {
          const deptIds = await this.deptService.findDeptIdsByDataScope(currentUser.deptId, role.dataScope);
          deptIds.forEach((id) => deptIdSet.add(+id));
          break;
        }
        case DataScopeEnum.DATA_SCOPE_SELF:
          dataScopeSelf = true;
          break;
        default:
          break;
      }
      if (dataScopeAll) {
        break;
      }
    }

    if (dataScopeAll) {
      return [];
    }

    if (deptIdSet.size > 0) {
      return [
        {
          deptId: {
            in: Array.from(deptIdSet),
          },
        },
      ];
    }

    if (dataScopeSelf) {
      return [
        {
          userId: currentUser.userId,
        },
      ];
    }

    return [];
  }

  private buildDateRange(params?: { beginTime?: string; endTime?: string }): Prisma.SysUserWhereInput['createTime'] {
    if (params?.beginTime && params?.endTime) {
      return {
        gte: new Date(params.beginTime),
        lte: new Date(params.endTime),
      };
    }
    return undefined;
  }

  async create(createUserDto: CreateUserDto) {
    const salt = bcrypt.genSaltSync(10);
    if (createUserDto.password) {
      createUserDto.password = bcrypt.hashSync(createUserDto.password, salt);
    }
    const { postIds = [], roleIds = [], ...userPayload } = createUserDto as CreateUserDto & { postIds?: number[]; roleIds?: number[] };

    const user = await this.prisma.sysUser.create({
      data: {
        ...userPayload,
        userType: SYS_USER_TYPE.CUSTOM,
        phonenumber: userPayload.phonenumber ?? '',
        sex: userPayload.sex ?? '0',
        status: userPayload.status ?? '0',
        avatar: '',
        delFlag: '0',
        loginIp: '',
        createBy: '',
        updateBy: '',
      },
    });

    const tasks: Prisma.PrismaPromise<unknown>[] = [];

    if (postIds.length > 0) {
      tasks.push(
        this.prisma.sysUserPost.createMany({
          data: postIds.map((postId) => ({ userId: user.userId, postId })),
          skipDuplicates: true,
        }),
      );
    }

    if (roleIds.length > 0) {
      tasks.push(
        this.prisma.sysUserRole.createMany({
          data: roleIds.map((roleId) => ({ userId: user.userId, roleId })),
          skipDuplicates: true,
        }),
      );
    }

    if (tasks.length) {
      await this.prisma.$transaction(tasks);
    }

    return ResultData.ok();
  }

  async findAll(query: ListUserDto, user: UserType['user']) {
    const where: Prisma.SysUserWhereInput = {
      delFlag: DelFlagEnum.NORMAL,
    };

    const andConditions: Prisma.SysUserWhereInput[] = await this.buildDataScopeConditions(user);

    if (query.deptId) {
      const deptIds = await this.deptService.findDeptIdsByDataScope(+query.deptId, DataScopeEnum.DATA_SCOPE_DEPT_AND_CHILD);
      andConditions.push({
        deptId: {
          in: deptIds.map((item) => +item),
        },
      });
    }

    if (andConditions.length) {
      where.AND = andConditions;
    }

    if (query.userName) {
      where.userName = { contains: query.userName };
    }

    if (query.phonenumber) {
      where.phonenumber = { contains: query.phonenumber };
    }

    if (query.status) {
      where.status = query.status;
    }

    const createTime = this.buildDateRange(query.params);
    if (createTime) {
      where.createTime = createTime;
    }

    const { skip, take } = this.getPagination(query);

    const [list, total] = await this.prisma.$transaction([
      this.prisma.sysUser.findMany({
        where,
        skip,
        take,
        orderBy: { createTime: 'desc' },
      }),
      this.prisma.sysUser.count({ where }),
    ]);

    const listWithDept = await this.attachDeptInfo(list);

    // 格式化返回数据,添加 deptName 和格式化时间
    const rows = listWithDept.map((user) => ({
      ...user,
      deptName: user.dept?.deptName || '',
      createTime: FormatDate(user.createTime),
      updateTime: FormatDate(user.updateTime),
      loginDate: user.loginDate ? FormatDate(user.loginDate) : null,
    }));

    return ResultData.ok({
      rows,
      total,
    });
  }

  async findPostAndRoleAll() {
    const [posts, roles] = await Promise.all([this.prisma.sysPost.findMany({ where: { delFlag: DelFlagEnum.NORMAL } }), this.roleService.findRoles({ where: { delFlag: DelFlagEnum.NORMAL } })]);

    return ResultData.ok({
      posts,
      roles,
    });
  }

  @Cacheable(CacheEnum.SYS_USER_KEY, '{userId}')
  async findOne(userId: number) {
    const data = await this.prisma.sysUser.findFirst({
      where: {
        delFlag: DelFlagEnum.NORMAL,
        userId,
      },
    });

    if (!data) {
      return ResultData.ok(null);
    }

    const [dept, postList, allPosts, roleIds, allRoles] = await Promise.all([
      data?.deptId ? this.prisma.sysDept.findFirst({ where: { deptId: data.deptId, delFlag: DelFlagEnum.NORMAL } }) : Promise.resolve(null),
      this.prisma.sysUserPost.findMany({ where: { userId }, select: { postId: true } }),
      this.prisma.sysPost.findMany({ where: { delFlag: DelFlagEnum.NORMAL } }),
      this.getRoleIds([userId]),
      this.roleService.findRoles({ where: { delFlag: DelFlagEnum.NORMAL } }),
    ]);

    const postIds = postList.map((item) => item.postId);
    const enrichedData: UserWithRelations = {
      ...data,
      dept,
      roles: allRoles.filter((role) => roleIds.includes(role.roleId)),
    };

    return ResultData.ok({
      data: enrichedData,
      postIds,
      posts: allPosts,
      roles: allRoles,
      roleIds,
    });
  }

  @CacheEvict(CacheEnum.SYS_USER_KEY, '{updateUserDto.userId}')
  async update(updateUserDto: UpdateUserDto, userId: number) {
    if (updateUserDto.userId === 1) throw new BadRequestException('非法操作！');

    updateUserDto.roleIds = updateUserDto.roleIds.filter((v) => v != 1);

    if (updateUserDto.userId === userId) {
      delete updateUserDto.status;
    }

    const { postIds = [], roleIds = [], ...rest } = updateUserDto as UpdateUserDto & { postIds?: number[]; roleIds?: number[] };

    const tasks: Prisma.PrismaPromise<unknown>[] = [];

    if (postIds.length > 0) {
      tasks.push(this.prisma.sysUserPost.deleteMany({ where: { userId: updateUserDto.userId } }));
      tasks.push(
        this.prisma.sysUserPost.createMany({
          data: postIds.map((postId) => ({ userId: updateUserDto.userId, postId })),
          skipDuplicates: true,
        }),
      );
    }

    if (roleIds.length > 0) {
      tasks.push(this.prisma.sysUserRole.deleteMany({ where: { userId: updateUserDto.userId } }));
      tasks.push(
        this.prisma.sysUserRole.createMany({
          data: roleIds.map((roleId) => ({ userId: updateUserDto.userId, roleId })),
          skipDuplicates: true,
        }),
      );
    }

    const updateData = { ...rest } as Prisma.SysUserUpdateInput;
    delete (updateData as any).password;
    delete (updateData as any).dept;
    delete (updateData as any).roles;
    delete (updateData as any).roleIds;
    delete (updateData as any).postIds;

    tasks.push(
      this.prisma.sysUser.update({
        where: { userId: updateUserDto.userId },
        data: updateData,
      }),
    );

    const data = await this.prisma.$transaction(tasks);

    return ResultData.ok(data[data.length - 1]);
  }

  @CacheEvict(CacheEnum.SYS_USER_KEY, '{userId}')
  clearCacheByUserId(userId: number) {
    return userId;
  }

  @Captcha('user')
  async login(user: LoginDto, clientInfo: ClientInfoDto) {
    const data = await this.prisma.sysUser.findFirst({
      where: {
        userName: user.userName,
      },
      select: {
        userId: true,
        password: true,
      },
    });

    if (!(data && bcrypt.compareSync(user.password, data.password))) {
      return ResultData.fail(500, `帐号或密码错误`);
    }

    this.clearCacheByUserId(data.userId);

    const userData = await this.getUserinfo(data.userId);

    if (userData.delFlag === DelFlagEnum.DELETE) {
      return ResultData.fail(500, `您已被禁用，如需正常使用请联系管理员`);
    }
    if (userData.status === StatusEnum.STOP) {
      return ResultData.fail(500, `您已被停用，如需正常使用请联系管理员`);
    }

    const loginDate = new Date();
    await this.prisma.sysUser.update({
      where: { userId: data.userId },
      data: {
        loginDate,
        loginIp: clientInfo.ipaddr,
      },
    });

    const uuid = GenerateUUID();
    const token = this.createToken({ uuid: uuid, userId: userData.userId });
    const permissions = await this.getUserPermissions(userData.userId);
    const deptData = userData.deptId ? await this.prisma.sysDept.findFirst({ where: { deptId: userData.deptId }, select: { deptName: true } }) : null;

    userData['deptName'] = deptData?.deptName || '';
    const roles = (userData.roles ?? []).map((item) => item.roleKey);

    const safeDept = (userData.dept as any) ?? ({} as any);
    const safeRoles = (userData.roles as any) ?? [];
    const safePosts = (userData.posts as any) ?? [];
    const userInfo: Partial<UserType> = {
      browser: clientInfo.browser,
      ipaddr: clientInfo.ipaddr,
      loginLocation: clientInfo.loginLocation,
      loginTime: loginDate,
      os: clientInfo.os,
      deviceType: clientInfo.deviceType,
      permissions: permissions,
      roles: roles,
      token: uuid,
      user: {
        ...(userData as unknown as UserType['user']),
        dept: safeDept,
        roles: safeRoles,
        posts: safePosts,
      },
      userId: userData.userId,
      userName: userData.userName,
      deptId: userData.deptId,
    };

    await this.updateRedisToken(uuid, userInfo);

    return ResultData.ok(
      {
        token,
      },
      '登录成功',
    );
  }

  async updateRedisUserRolesAndPermissions(uuid: string, userId: number) {
    const userData = await this.getUserinfo(userId);

    const permissions = await this.getUserPermissions(userId);
    const roles = (userData.roles ?? []).map((item) => item.roleKey);

    await this.updateRedisToken(uuid, {
      permissions: permissions,
      roles: roles,
    });
  }

  async updateRedisToken(token: string, metaData: Partial<UserType>) {
    const oldMetaData = await this.redisService.get(`${CacheEnum.LOGIN_TOKEN_KEY}${token}`);

    let newMetaData = metaData;
    if (oldMetaData) {
      newMetaData = Object.assign(oldMetaData, metaData);
    }

    await this.redisService.set(`${CacheEnum.LOGIN_TOKEN_KEY}${token}`, newMetaData, LOGIN_TOKEN_EXPIRESIN);
  }

  async getRoleIds(userIds: Array<number>) {
    if (!userIds.length) {
      return [];
    }
    const roleList = await this.prisma.sysUserRole.findMany({
      where: {
        userId: { in: userIds },
      },
      select: { roleId: true },
    });
    const roleIds = roleList.map((item) => item.roleId);
    return Uniq(roleIds);
  }

  async getUserPermissions(userId: number) {
    const roleIds = await this.getRoleIds([userId]);
    const list = await this.roleService.getPermissionsByRoleIds(roleIds);
    const permissions = Uniq(list.map((item) => item.perms)).filter((item) => item);
    return permissions;
  }

  async getUserinfo(userId: number): Promise<UserWithRelations> {
    const user = await this.prisma.sysUser.findFirst({
      where: {
        userId,
        delFlag: DelFlagEnum.NORMAL,
      },
    });

    if (!user) {
      throw new BadRequestException('用户不存在');
    }

    const [dept, roleIds, postRelations] = await Promise.all([
      user.deptId ? this.prisma.sysDept.findFirst({ where: { deptId: user.deptId, delFlag: DelFlagEnum.NORMAL } }) : Promise.resolve(null),
      this.getRoleIds([userId]),
      this.prisma.sysUserPost.findMany({ where: { userId }, select: { postId: true } }),
    ]);

    const posts = postRelations.length
      ? await this.prisma.sysPost.findMany({
        where: {
          delFlag: DelFlagEnum.NORMAL,
          postId: {
            in: postRelations.map((item) => item.postId),
          },
        },
      })
      : [];

    const roles = roleIds.length ? await this.roleService.findRoles({ where: { delFlag: DelFlagEnum.NORMAL, roleId: { in: roleIds } } }) : [];

    return {
      ...user,
      dept,
      posts,
      roles,
    };
  }

  async register(user: RegisterDto) {
    const loginDate = new Date();
    const salt = bcrypt.genSaltSync(10);
    if (user.password) {
      user.password = bcrypt.hashSync(user.password, salt);
    }
    const checkUserNameUnique = await this.prisma.sysUser.findFirst({
      where: {
        userName: user.userName,
      },
      select: { userName: true },
    });
    if (checkUserNameUnique) {
      return ResultData.fail(500, `保存用户'${user.userName}'失败，注册账号已存在`);
    }
    await this.prisma.sysUser.create({
      data: {
        userName: user.userName,
        nickName: user.userName,
        password: user.password,
        loginDate,
        userType: SYS_USER_TYPE.CUSTOM,
      },
    });
    return ResultData.ok();
  }

  createToken(payload: { uuid: string; userId: number }): string {
    const accessToken = this.jwtService.sign(payload);
    return accessToken;
  }

  parseToken(token: string) {
    try {
      if (!token) return null;
      const payload = this.jwtService.verify(token.replace('Bearer ', ''));
      return payload;
    } catch (error) {
      return null;
    }
  }

  async resetPwd(body: ResetPwdDto) {
    if (body.userId === 1) {
      return ResultData.fail(500, '系统用户不能重置密码');
    }
    if (body.password) {
      body.password = bcrypt.hashSync(body.password, bcrypt.genSaltSync(10));
    }
    await this.prisma.sysUser.update({
      where: { userId: body.userId },
      data: { password: body.password },
    });
    return ResultData.ok();
  }

  async remove(ids: number[]) {
    const data = await this.prisma.sysUser.updateMany({
      where: {
        userId: { in: ids },
        userType: { not: SYS_USER_TYPE.SYS },
      },
      data: {
        delFlag: DelFlagEnum.DELETE,
      },
    });
    return ResultData.ok(data);
  }

  async authRole(userId: number) {
    const [allRoles, user] = await Promise.all([
      this.roleService.findRoles({ where: { delFlag: DelFlagEnum.NORMAL } }),
      this.prisma.sysUser.findFirst({ where: { delFlag: DelFlagEnum.NORMAL, userId } }),
    ]);

    if (!user) {
      throw new BadRequestException('用户不存在');
    }

    const dept = user.deptId ? await this.prisma.sysDept.findFirst({ where: { delFlag: DelFlagEnum.NORMAL, deptId: user.deptId } }) : null;
    const roleIds = await this.getRoleIds([userId]);

    const enrichedUser: UserWithRelations = {
      ...user,
      dept,
      roles: allRoles.filter((item) => {
        if (roleIds.includes(item.roleId)) {
          (item as any).flag = true;
          return true;
        }
        return true;
      }),
    };

    return ResultData.ok({
      roles: allRoles,
      user: enrichedUser,
    });
  }

  async updateAuthRole(query) {
    let roleIds = query.roleIds.split(',');
    roleIds = roleIds.filter((v) => v != '1');

    if (roleIds.length > 0) {
      await this.prisma.sysUserRole.deleteMany({ where: { userId: query.userId } });
      await this.prisma.sysUserRole.createMany({
        data: roleIds.map((id) => ({ userId: query.userId, roleId: +id })),
        skipDuplicates: true,
      });
    }
    return ResultData.ok();
  }

  async changeStatus(changeStatusDto: ChangeUserStatusDto) {
    const userData = await this.prisma.sysUser.findUnique({
      where: { userId: changeStatusDto.userId },
      select: { userType: true },
    });
    if (userData?.userType === SYS_USER_TYPE.SYS) {
      return ResultData.fail(500, '系统角色不可停用');
    }

    const res = await this.prisma.sysUser.update({
      where: { userId: changeStatusDto.userId },
      data: { status: changeStatusDto.status },
    });
    return ResultData.ok(res);
  }

  async deptTree() {
    const tree = await this.deptService.deptTree();
    return ResultData.ok(tree);
  }

  async allocatedList(query: AllocatedListDto) {
    const relations = await this.prisma.sysUserRole.findMany({
      where: { roleId: +query.roleId },
      select: { userId: true },
    });
    if (!relations.length) {
      return ResultData.ok({ rows: [], total: 0 });
    }
    const userIds = relations.map((item) => item.userId);
    const where: Prisma.SysUserWhereInput = {
      delFlag: DelFlagEnum.NORMAL,
      status: '0',
      userId: { in: userIds },
    };

    if (query.userName) {
      where.userName = { contains: query.userName };
    }
    if (query.phonenumber) {
      where.phonenumber = { contains: query.phonenumber };
    }

    const { skip, take } = this.getPagination(query);
    const [list, total] = await this.prisma.$transaction([this.prisma.sysUser.findMany({ where, skip, take, orderBy: { createTime: 'desc' } }), this.prisma.sysUser.count({ where })]);

    const listWithDept = await this.attachDeptInfo(list);
    const formattedList = FormatDateFields(listWithDept);

    return ResultData.ok({ rows: formattedList, total });
  }

  async unallocatedList(query: AllocatedListDto) {
    const relations = await this.prisma.sysUserRole.findMany({
      where: { roleId: +query.roleId },
      select: { userId: true },
    });
    const userIds = relations.map((item) => item.userId);

    const where: Prisma.SysUserWhereInput = {
      delFlag: DelFlagEnum.NORMAL,
      status: '0',
    };

    if (userIds.length > 0) {
      where.userId = {
        notIn: userIds,
      };
    }

    if (query.userName) {
      where.userName = { contains: query.userName };
    }

    if (query.phonenumber) {
      where.phonenumber = { contains: query.phonenumber };
    }

    const { skip, take } = this.getPagination(query);
    const [list, total] = await this.prisma.$transaction([this.prisma.sysUser.findMany({ where, skip, take, orderBy: { createTime: 'desc' } }), this.prisma.sysUser.count({ where })]);

    const listWithDept = await this.attachDeptInfo(list);
    const formattedList = FormatDateFields(listWithDept);

    return ResultData.ok({ rows: formattedList, total });
  }

  async authUserCancel(data: AuthUserCancelDto) {
    await this.prisma.sysUserRole.deleteMany({
      where: {
        userId: data.userId,
        roleId: data.roleId,
      },
    });
    return ResultData.ok();
  }

  async authUserCancelAll(data: AuthUserCancelAllDto) {
    const userIds = data.userIds.split(',').map((id) => +id);
    await this.prisma.sysUserRole.deleteMany({
      where: {
        userId: { in: userIds },
        roleId: +data.roleId,
      },
    });
    return ResultData.ok();
  }

  async authUserSelectAll(data: AuthUserSelectAllDto) {
    const userIds = data.userIds.split(',').map((id) => +id);
    const entities = userIds.map((userId) => ({
      userId,
      roleId: +data.roleId,
    }));
    await this.prisma.sysUserRole.createMany({ data: entities, skipDuplicates: true });
    return ResultData.ok();
  }

  async profile(user) {
    return ResultData.ok(user);
  }

  async updateProfile(user: UserType, updateProfileDto: UpdateProfileDto) {
    await this.prisma.sysUser.update({ where: { userId: user.user.userId }, data: updateProfileDto });
    const userData = await this.redisService.get(`${CacheEnum.LOGIN_TOKEN_KEY}${user.token}`);
    userData.user = Object.assign(userData.user, updateProfileDto);
    await this.redisService.set(`${CacheEnum.LOGIN_TOKEN_KEY}${user.token}`, userData);
    return ResultData.ok();
  }

  async updatePwd(user: UserType, updatePwdDto: UpdatePwdDto) {
    if (updatePwdDto.oldPassword === updatePwdDto.newPassword) {
      return ResultData.fail(500, '新密码不能与旧密码相同');
    }
    if (bcrypt.compareSync(user.user.password, updatePwdDto.oldPassword)) {
      return ResultData.fail(500, '修改密码失败，旧密码错误');
    }

    const password = bcrypt.hashSync(updatePwdDto.newPassword, bcrypt.genSaltSync(10));
    await this.prisma.sysUser.update({ where: { userId: user.user.userId }, data: { password: password } });
    return ResultData.ok();
  }

  /**
   * 获取用户选择框列表
   */
  async optionselect() {
    const list = await this.prisma.sysUser.findMany({
      where: {
        delFlag: '0',
        status: '0',
      },
      select: {
        userId: true,
        userName: true,
        nickName: true,
      },
    });
    return ResultData.ok(list);
  }

  /**
   * 根据部门ID获取用户列表
   */
  async findByDeptId(deptId: number) {
    const list = await this.prisma.sysUser.findMany({
      where: {
        deptId,
        delFlag: '0',
      },
    });
    return ResultData.ok(list);
  }

  async export(res: Response, body: ListUserDto, user: UserType['user']) {
    delete body.pageNum;
    delete body.pageSize;
    const list = await this.findAll(body, user);
    const options = {
      sheetName: '用户数据',
      data: list.data.rows,
      header: [
        { title: '用户序号', dataIndex: 'userId' },
        { title: '登录名称', dataIndex: 'userName' },
        { title: '用户昵称', dataIndex: 'nickName' },
        { title: '用户邮箱', dataIndex: 'email' },
        { title: '手机号码', dataIndex: 'phonenumber' },
        { title: '用户性别', dataIndex: 'sex' },
        { title: '账号状态', dataIndex: 'status' },
        { title: '最后登录IP', dataIndex: 'loginIp' },
        { title: '最后登录时间', dataIndex: 'loginDate', width: 20 },
        { title: '部门', dataIndex: 'deptName' },
        { title: '部门负责人', dataIndex: 'dept.leader' },
        { title: '创建时间', dataIndex: 'createTime', width: 20 },
      ],
    };
    return await ExportTable(options, res);
  }
}
