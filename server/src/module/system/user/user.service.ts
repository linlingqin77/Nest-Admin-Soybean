import { Injectable, forwardRef, Inject } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { BusinessException } from 'src/common/exceptions';
import { RedisService } from 'src/module/common/redis/redis.service';
import * as bcrypt from 'bcryptjs';
import { Response } from 'express';
import { Prisma, SysDept, SysPost, SysRole, SysUser } from '@prisma/client';
import { GetNowDate, GenerateUUID, Uniq, FormatDate, FormatDateFields } from 'src/common/utils/index';
import { ExportTable } from 'src/common/utils/export';
import { PaginationHelper } from 'src/common/utils/pagination.helper';

import { CacheEnum, DelFlagEnum, StatusEnum, DataScopeEnum } from 'src/common/enum/index';
import { Transactional } from 'src/common/decorators/transactional.decorator';
import { LOGIN_TOKEN_EXPIRESIN, SYS_USER_TYPE } from 'src/common/constant/index';
import { Result, ResponseCode } from 'src/common/response';
import {
  CreateUserDto,
  UpdateUserDto,
  ListUserDto,
  ChangeUserStatusDto,
  ResetPwdDto,
  AllocatedListDto,
  UpdateProfileDto,
  UpdatePwdDto,
} from './dto/index';
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
import { UserRepository } from './user.repository';

// 导入子服务
import { UserAuthService } from './services/user-auth.service';
import { UserProfileService } from './services/user-profile.service';
import { UserRoleService } from './services/user-role.service';
import { UserExportService } from './services/user-export.service';

type UserWithDept = SysUser & { dept?: SysDept | null };
type UserWithRelations = UserWithDept & { roles?: SysRole[]; posts?: SysPost[] };

@Injectable()
export class UserService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly userRepo: UserRepository,
    private readonly roleService: RoleService,
    private readonly deptService: DeptService,
    private readonly jwtService: JwtService,
    private readonly redisService: RedisService,
    private readonly configService: ConfigService,
    // 注入子服务
    @Inject(forwardRef(() => UserAuthService))
    private readonly userAuthService: UserAuthService,
    @Inject(forwardRef(() => UserProfileService))
    private readonly userProfileService: UserProfileService,
    @Inject(forwardRef(() => UserRoleService))
    private readonly userRoleService: UserRoleService,
    private readonly userExportService: UserExportService,
  ) {}

  // ==================== 私有辅助方法 ====================

  private async attachDeptInfo(users: SysUser[]): Promise<UserWithDept[]> {
    if (!users.length) {
      return users;
    }
    const deptIds = Array.from(
      new Set(
        users
          .map((item) => item.deptId)
          .filter((deptId): deptId is number => typeof deptId === 'number' && !Number.isNaN(deptId)),
      ),
    );
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

    const customRoleIds: number[] = [];
    const deptScopes = new Set<DataScopeEnum>();

    // 分类收集，避免在循环内触发多次查询
    for (const role of roles) {
      switch (role.dataScope) {
        case DataScopeEnum.DATA_SCOPE_ALL:
          dataScopeAll = true;
          break;
        case DataScopeEnum.DATA_SCOPE_CUSTOM:
          customRoleIds.push(role.roleId);
          break;
        case DataScopeEnum.DATA_SCOPE_DEPT:
        case DataScopeEnum.DATA_SCOPE_DEPT_AND_CHILD:
          deptScopes.add(role.dataScope);
          break;
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

    // 批量查询自定义数据范围的部门
    if (customRoleIds.length > 0) {
      const roleDeptRows = await this.prisma.sysRoleDept.findMany({
        where: { roleId: { in: customRoleIds } },
        select: { deptId: true },
      });
      roleDeptRows.forEach((row) => deptIdSet.add(row.deptId));
    }

    // 针对部门/部门含子部门的数据范围，只调用一次/两次部门查询
    for (const scope of deptScopes) {
      const deptIds = await this.deptService.findDeptIdsByDataScope(currentUser.deptId, scope);
      deptIds.forEach((id) => deptIdSet.add(+id));
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

  // ==================== 用户CRUD操作 (保留在UserService) ====================

  @Transactional()
  async create(createUserDto: CreateUserDto) {
    const salt = bcrypt.genSaltSync(10);
    if (createUserDto.password) {
      createUserDto.password = bcrypt.hashSync(createUserDto.password, salt);
    }
    const {
      postIds = [],
      roleIds = [],
      ...userPayload
    } = createUserDto as CreateUserDto & { postIds?: number[]; roleIds?: number[] };

    const user = await this.userRepo.create({
      ...userPayload,
      userType: SYS_USER_TYPE.CUSTOM,
      phonenumber: userPayload.phonenumber ?? '',
      sex: userPayload.sex ?? '0',
      status: userPayload.status ?? '0',
      avatar: '',
      delFlag: DelFlagEnum.NORMAL,
      loginIp: '',
    });

    // 关联岗位
    if (postIds.length > 0) {
      await this.prisma.sysUserPost.createMany({
        data: postIds.map((postId) => ({ userId: user.userId, postId })),
        skipDuplicates: true,
      });
    }

    // 关联角色
    if (roleIds.length > 0) {
      await this.prisma.sysUserRole.createMany({
        data: roleIds.map((roleId) => ({ userId: user.userId, roleId })),
        skipDuplicates: true,
      });
    }

    return Result.ok();
  }

  async findAll(query: ListUserDto, user: UserType['user']) {
    const where: Prisma.SysUserWhereInput = {
      delFlag: DelFlagEnum.NORMAL,
    };

    const andConditions: Prisma.SysUserWhereInput[] = await this.buildDataScopeConditions(user);

    if (query.deptId) {
      const deptIds = await this.deptService.findDeptIdsByDataScope(
        +query.deptId,
        DataScopeEnum.DATA_SCOPE_DEPT_AND_CHILD,
      );
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
      where.userName = PaginationHelper.buildStringFilter(query.userName);
    }

    if (query.phonenumber) {
      where.phonenumber = PaginationHelper.buildStringFilter(query.phonenumber);
    }

    if (query.status) {
      where.status = query.status;
    }

    const createTime = PaginationHelper.buildDateRange(query.params);
    if (createTime) {
      where.createTime = createTime;
    }

    const { skip, take } = PaginationHelper.getPagination(query);

    // 使用 PaginationHelper 优化分页查询
    const { rows: list, total } = await PaginationHelper.paginateWithTransaction<SysUser>(
      this.prisma,
      'sysUser',
      {
        where,
        skip,
        take,
        orderBy: { createTime: 'desc' },
      },
      { where },
    );

    const listWithDept = await this.attachDeptInfo(list);

    // 格式化返回数据,添加 deptName 和格式化时间
    const rows = listWithDept.map((user) => ({
      ...user,
      deptName: user.dept?.deptName || '',
      createTime: FormatDate(user.createTime),
      updateTime: FormatDate(user.updateTime),
      loginDate: user.loginDate ? FormatDate(user.loginDate) : null,
    }));

    return Result.ok({
      rows,
      total,
    });
  }

  async findPostAndRoleAll() {
    const [posts, roles] = await Promise.all([
      this.prisma.sysPost.findMany({ where: { delFlag: DelFlagEnum.NORMAL } }),
      this.roleService.findRoles({ where: { delFlag: DelFlagEnum.NORMAL } }),
    ]);

    return Result.ok({
      posts,
      roles,
    });
  }

  @Cacheable(CacheEnum.SYS_USER_KEY, '{userId}')
  async findOne(userId: number) {
    const data = await this.userRepo.findById(userId);

    if (!data) {
      return Result.ok(null);
    }

    const [dept, postList, allPosts, roleIds, allRoles] = await Promise.all([
      data?.deptId
        ? this.prisma.sysDept.findFirst({ where: { deptId: data.deptId, delFlag: DelFlagEnum.NORMAL } })
        : Promise.resolve(null),
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

    return Result.ok({
      data: enrichedData,
      postIds,
      posts: allPosts,
      roles: allRoles,
      roleIds,
    });
  }

  @CacheEvict(CacheEnum.SYS_USER_KEY, '{updateUserDto.userId}')
  @Transactional()
  async update(updateUserDto: UpdateUserDto, userId: number) {
    if (updateUserDto.userId === 1) throw new BusinessException(ResponseCode.BUSINESS_ERROR, '非法操作！');

    updateUserDto.roleIds = updateUserDto.roleIds.filter((v) => v != 1);

    if (updateUserDto.userId === userId) {
      delete updateUserDto.status;
    }

    const {
      postIds = [],
      roleIds = [],
      ...rest
    } = updateUserDto as UpdateUserDto & { postIds?: number[]; roleIds?: number[] };

    // 更新岗位关联
    if (postIds.length > 0) {
      await this.prisma.sysUserPost.deleteMany({ where: { userId: updateUserDto.userId } });
      await this.prisma.sysUserPost.createMany({
        data: postIds.map((postId) => ({ userId: updateUserDto.userId, postId })),
        skipDuplicates: true,
      });
    }

    // 更新角色关联
    if (roleIds.length > 0) {
      await this.prisma.sysUserRole.deleteMany({ where: { userId: updateUserDto.userId } });
      await this.prisma.sysUserRole.createMany({
        data: roleIds.map((roleId) => ({ userId: updateUserDto.userId, roleId })),
        skipDuplicates: true,
      });
    }

    const updateData = { ...rest } as Prisma.SysUserUpdateInput;
    delete (updateData as any).password;
    delete (updateData as any).dept;
    delete (updateData as any).roles;
    delete (updateData as any).roleIds;
    delete (updateData as any).postIds;

    const data = await this.prisma.sysUser.update({
      where: { userId: updateUserDto.userId },
      data: updateData,
    });

    return Result.ok(data);
  }

  async remove(ids: number[]) {
    const count = await this.userRepo.softDeleteBatch(ids);
    return Result.ok({ count });
  }

  async changeStatus(changeStatusDto: ChangeUserStatusDto) {
    const userData = await this.userRepo.findById(changeStatusDto.userId);
    if (userData?.userType === SYS_USER_TYPE.SYS) {
      return Result.fail(ResponseCode.BUSINESS_ERROR, '系统角色不可停用');
    }

    await this.userRepo.update(changeStatusDto.userId, {
      status: changeStatusDto.status,
    });
    return Result.ok();
  }

  async deptTree() {
    const tree = await this.deptService.deptTree();
    return Result.ok(tree);
  }

  async optionselect() {
    const list = await this.prisma.sysUser.findMany({
      where: {
        delFlag: DelFlagEnum.NORMAL,
        status: StatusEnum.NORMAL,
      },
      select: {
        userId: true,
        userName: true,
        nickName: true,
      },
    });
    return Result.ok(list);
  }

  async findByDeptId(deptId: number) {
    const list = await this.prisma.sysUser.findMany({
      where: {
        deptId,
        delFlag: DelFlagEnum.NORMAL,
      },
    });
    return Result.ok(list);
  }

  // ==================== 认证相关 - 委托给 UserAuthService ====================

  @CacheEvict(CacheEnum.SYS_USER_KEY, '{userId}')
  clearCacheByUserId(userId: number) {
    return userId;
  }

  @Captcha('user')
  async login(user: LoginDto, clientInfo: ClientInfoDto) {
    return this.userAuthService.login(user, clientInfo);
  }

  async register(user: RegisterDto) {
    return this.userAuthService.register(user);
  }

  createToken(payload: { uuid: string; userId: number }): string {
    return this.userAuthService.createToken(payload);
  }

  parseToken(token: string) {
    return this.userAuthService.parseToken(token);
  }

  async updateRedisToken(token: string, metaData: Partial<UserType>) {
    return this.userAuthService.updateRedisToken(token, metaData);
  }

  async updateRedisUserRolesAndPermissions(uuid: string, userId: number) {
    return this.userAuthService.updateRedisUserRolesAndPermissions(uuid, userId);
  }

  async getRoleIds(userIds: Array<number>) {
    return this.userAuthService.getRoleIds(userIds);
  }

  async getUserPermissions(userId: number) {
    return this.userAuthService.getUserPermissions(userId);
  }

  async getUserinfo(userId: number): Promise<UserWithRelations> {
    return this.userAuthService.getUserinfo(userId);
  }

  // ==================== 个人资料相关 - 委托给 UserProfileService ====================

  async profile(user) {
    return this.userProfileService.profile(user);
  }

  async updateProfile(user: UserType, updateProfileDto: UpdateProfileDto) {
    return this.userProfileService.updateProfile(user, updateProfileDto);
  }

  async updatePwd(user: UserType, updatePwdDto: UpdatePwdDto) {
    return this.userProfileService.updatePwd(user, updatePwdDto);
  }

  async resetPwd(body: ResetPwdDto) {
    return this.userProfileService.resetPwd(body);
  }

  // ==================== 角色分配相关 - 委托给 UserRoleService ====================

  async authRole(userId: number) {
    return this.userRoleService.authRole(userId);
  }

  @Transactional()
  async updateAuthRole(query) {
    return this.userRoleService.updateAuthRole(query);
  }

  async allocatedList(query: AllocatedListDto) {
    return this.userRoleService.allocatedList(query);
  }

  async unallocatedList(query: AllocatedListDto) {
    return this.userRoleService.unallocatedList(query);
  }

  async authUserCancel(data: AuthUserCancelDto) {
    return this.userRoleService.authUserCancel(data);
  }

  @Transactional()
  async authUserCancelAll(data: AuthUserCancelAllDto) {
    return this.userRoleService.authUserCancelAll(data);
  }

  @Transactional()
  async authUserSelectAll(data: AuthUserSelectAllDto) {
    return this.userRoleService.authUserSelectAll(data);
  }

  // ==================== 导出相关 - 委托给 UserExportService ====================

  async export(res: Response, body: ListUserDto, user: UserType['user']) {
    delete body.pageNum;
    delete body.pageSize;
    const list = await this.findAll(body, user);
    return this.userExportService.export(res, list.data);
  }
}
