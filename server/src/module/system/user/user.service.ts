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
  BatchCreateUserDto,
  BatchDeleteUserDto,
  BatchResultDto,
  BatchResultItem,
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

/** 用户实体与部门信息的联合类型 */
type UserWithDept = SysUser & { dept?: SysDept | null };
/** 用户实体与关联信息（部门、角色、岗位）的联合类型 */
type UserWithRelations = UserWithDept & { roles?: SysRole[]; posts?: SysPost[] };

/**
 * 用户管理服务
 *
 * 提供用户相关的核心业务功能，包括：
 * - 用户CRUD操作（创建、查询、更新、删除）
 * - 批量用户操作（批量创建、批量删除）
 * - 用户认证（登录、注册、Token管理）
 * - 用户个人资料管理
 * - 用户角色分配
 * - 用户数据导出
 *
 * @class UserService
 * @description 用户管理的核心服务类，采用子服务模式将功能模块化
 */
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

  /**
   * 为用户列表附加部门信息
   *
   * @private
   * @param users - 用户列表
   * @returns 附加了部门信息的用户列表
   */
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

  /**
   * 构建数据权限过滤条件
   *
   * 根据当前用户的角色数据权限范围，构建Prisma查询条件。
   * 支持以下数据权限类型：
   * - DATA_SCOPE_ALL: 全部数据权限
   * - DATA_SCOPE_CUSTOM: 自定义数据权限
   * - DATA_SCOPE_DEPT: 本部门数据权限
   * - DATA_SCOPE_DEPT_AND_CHILD: 本部门及以下数据权限
   * - DATA_SCOPE_SELF: 仅本人数据权限
   *
   * @private
   * @param currentUser - 当前登录用户信息
   * @returns 数据权限过滤条件数组
   */
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

  /**
   * 构建日期范围查询条件
   *
   * @private
   * @param params - 包含开始时间和结束时间的参数对象
   * @returns Prisma日期范围查询条件，如果参数不完整则返回undefined
   */
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

  /**
   * 创建新用户
   *
   * 创建用户并关联岗位和角色。密码会使用bcrypt进行加密存储。
   *
   * @param createUserDto - 创建用户的数据传输对象
   * @returns 操作结果
   * @throws {BusinessException} 当用户名已存在时抛出异常
   *
   * @example
   * ```typescript
   * await userService.create({
   *   userName: 'zhangsan',
   *   nickName: '张三',
   *   password: '123456',
   *   deptId: 100,
   *   roleIds: [2, 3],
   *   postIds: [1]
   * });
   * ```
   */
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

  /**
   * 分页查询用户列表
   *
   * 支持多条件筛选和数据权限过滤。返回的用户列表包含部门名称和格式化的时间字段。
   *
   * @param query - 查询参数，包含分页信息和筛选条件
   * @param user - 当前登录用户，用于数据权限过滤
   * @returns 分页用户列表，包含rows和total
   *
   * @example
   * ```typescript
   * const result = await userService.findAll({
   *   pageNum: 1,
   *   pageSize: 10,
   *   userName: 'admin',
   *   status: '0'
   * }, currentUser);
   * ```
   */
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

  /**
   * 获取所有岗位和角色列表
   *
   * 用于用户创建/编辑表单的下拉选项数据
   *
   * @returns 包含posts（岗位列表）和roles（角色列表）的对象
   */
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

  /**
   * 根据用户ID查询用户详情
   *
   * 返回用户完整信息，包括关联的部门、角色、岗位等。
   * 结果会被缓存以提高查询性能。
   *
   * @param userId - 用户ID
   * @returns 用户详情，包含data（用户信息）、postIds、posts、roles、roleIds
   *
   * @example
   * ```typescript
   * const result = await userService.findOne(1);
   * console.log(result.data.data.userName); // 用户名
   * console.log(result.data.roleIds); // 用户角色ID列表
   * ```
   */
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

  /**
   * 更新用户信息
   *
   * 更新用户基本信息及其关联的岗位和角色。
   * 系统管理员（userId=1）不可被修改。
   * 用户不能修改自己的状态。
   *
   * @param updateUserDto - 更新用户的数据传输对象
   * @param userId - 当前操作用户的ID
   * @returns 更新后的用户信息
   * @throws {BusinessException} 当尝试修改系统管理员时抛出异常
   *
   * @example
   * ```typescript
   * await userService.update({
   *   userId: 2,
   *   nickName: '新昵称',
   *   roleIds: [2, 3]
   * }, currentUserId);
   * ```
   */
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

  /**
   * 批量删除用户（软删除）
   *
   * @param ids - 要删除的用户ID数组
   * @returns 删除的用户数量
   */
  async remove(ids: number[]) {
    const count = await this.userRepo.softDeleteBatch(ids);
    return Result.ok({ count });
  }

  /**
   * 批量创建用户
   * @param batchCreateDto 批量创建用户DTO
   * @returns 批量操作结果
   */
  @Transactional()
  async batchCreate(batchCreateDto: BatchCreateUserDto): Promise<Result<BatchResultDto>> {
    const results: BatchResultItem[] = [];
    let successCount = 0;
    let failedCount = 0;

    for (let i = 0; i < batchCreateDto.users.length; i++) {
      const userDto = batchCreateDto.users[i];
      try {
        // 检查用户名是否已存在
        const existingUser = await this.userRepo.existsByUserName(userDto.userName);
        if (existingUser) {
          results.push({
            index: i,
            success: false,
            error: `用户名 "${userDto.userName}" 已存在`,
          });
          failedCount++;
          continue;
        }

        // 检查手机号是否已存在（如果提供了手机号）
        if (userDto.phonenumber) {
          const existingPhone = await this.userRepo.existsByPhoneNumber(userDto.phonenumber);
          if (existingPhone) {
            results.push({
              index: i,
              success: false,
              error: `手机号 "${userDto.phonenumber}" 已存在`,
            });
            failedCount++;
            continue;
          }
        }

        // 检查邮箱是否已存在（如果提供了邮箱）
        if (userDto.email) {
          const existingEmail = await this.userRepo.existsByEmail(userDto.email);
          if (existingEmail) {
            results.push({
              index: i,
              success: false,
              error: `邮箱 "${userDto.email}" 已存在`,
            });
            failedCount++;
            continue;
          }
        }

        // 加密密码
        const salt = bcrypt.genSaltSync(10);
        const hashedPassword = bcrypt.hashSync(userDto.password, salt);

        // 创建用户
        const user = await this.userRepo.create({
          userName: userDto.userName,
          nickName: userDto.nickName,
          password: hashedPassword,
          email: userDto.email ?? '',
          phonenumber: userDto.phonenumber ?? '',
          sex: userDto.sex ?? '0',
          status: userDto.status ?? '0',
          deptId: userDto.deptId,
          remark: userDto.remark ?? '',
          userType: SYS_USER_TYPE.CUSTOM,
          avatar: '',
          delFlag: DelFlagEnum.NORMAL,
          loginIp: '',
        });

        // 关联岗位
        if (userDto.postIds && userDto.postIds.length > 0) {
          await this.prisma.sysUserPost.createMany({
            data: userDto.postIds.map((postId) => ({ userId: user.userId, postId })),
            skipDuplicates: true,
          });
        }

        // 关联角色
        if (userDto.roleIds && userDto.roleIds.length > 0) {
          await this.prisma.sysUserRole.createMany({
            data: userDto.roleIds.map((roleId) => ({ userId: user.userId, roleId })),
            skipDuplicates: true,
          });
        }

        results.push({
          index: i,
          success: true,
          userId: user.userId,
        });
        successCount++;
      } catch (error) {
        results.push({
          index: i,
          success: false,
          error: error instanceof Error ? error.message : '创建失败',
        });
        failedCount++;
      }
    }

    return Result.ok({
      successCount,
      failedCount,
      totalCount: batchCreateDto.users.length,
      results,
    });
  }

  /**
   * 批量删除用户
   * @param batchDeleteDto 批量删除用户DTO
   * @returns 批量操作结果
   */
  @Transactional()
  async batchDelete(batchDeleteDto: BatchDeleteUserDto): Promise<Result<BatchResultDto>> {
    const results: BatchResultItem[] = [];
    let successCount = 0;
    let failedCount = 0;

    // 过滤掉系统管理员用户ID (userId = 1)
    const filteredUserIds = batchDeleteDto.userIds.filter((id) => id !== 1);
    const blockedIds = batchDeleteDto.userIds.filter((id) => id === 1);

    // 记录被阻止的系统管理员删除
    for (const id of blockedIds) {
      results.push({
        index: batchDeleteDto.userIds.indexOf(id),
        success: false,
        error: '系统管理员不可删除',
      });
      failedCount++;
    }

    // 检查用户是否存在并获取用户类型
    for (const userId of filteredUserIds) {
      try {
        const user = await this.userRepo.findById(userId);
        if (!user) {
          results.push({
            index: batchDeleteDto.userIds.indexOf(userId),
            success: false,
            error: `用户ID ${userId} 不存在`,
          });
          failedCount++;
          continue;
        }

        // 检查是否为系统用户
        if (user.userType === SYS_USER_TYPE.SYS) {
          results.push({
            index: batchDeleteDto.userIds.indexOf(userId),
            success: false,
            error: '系统用户不可删除',
          });
          failedCount++;
          continue;
        }

        // 执行软删除
        await this.userRepo.softDeleteBatch([userId]);
        results.push({
          index: batchDeleteDto.userIds.indexOf(userId),
          success: true,
          userId,
        });
        successCount++;
      } catch (error) {
        results.push({
          index: batchDeleteDto.userIds.indexOf(userId),
          success: false,
          error: error instanceof Error ? error.message : '删除失败',
        });
        failedCount++;
      }
    }

    return Result.ok({
      successCount,
      failedCount,
      totalCount: batchDeleteDto.userIds.length,
      results,
    });
  }

  /**
   * 修改用户状态
   *
   * 启用或禁用用户账号。系统用户不可被停用。
   *
   * @param changeStatusDto - 包含userId和status的数据传输对象
   * @returns 操作结果
   * @throws {BusinessException} 当尝试停用系统用户时返回失败
   */
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

  /**
   * 获取部门树结构
   *
   * 用于用户管理页面左侧的部门树展示
   *
   * @returns 部门树结构数据
   */
  async deptTree() {
    const tree = await this.deptService.deptTree();
    return Result.ok(tree);
  }

  /**
   * 获取用户选择列表
   *
   * 返回简化的用户列表，仅包含userId、userName、nickName，
   * 用于下拉选择框等场景
   *
   * @returns 用户选择列表
   */
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

  /**
   * 根据部门ID查询用户列表
   *
   * @param deptId - 部门ID
   * @returns 该部门下的用户列表
   */
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

  /**
   * 清除指定用户的缓存
   *
   * @param userId - 用户ID
   * @returns 用户ID
   */
  @CacheEvict(CacheEnum.SYS_USER_KEY, '{userId}')
  clearCacheByUserId(userId: number) {
    return userId;
  }

  /**
   * 用户登录
   *
   * 验证用户凭据并生成JWT Token。支持验证码校验。
   *
   * @param user - 登录信息，包含用户名、密码、验证码等
   * @param clientInfo - 客户端信息，包含IP、User-Agent等
   * @returns 登录结果，成功时返回Token
   * @throws {BusinessException} 当用户名或密码错误时抛出异常
   */
  @Captcha('user')
  async login(user: LoginDto, clientInfo: ClientInfoDto) {
    return this.userAuthService.login(user, clientInfo);
  }

  /**
   * 用户注册
   *
   * 创建新用户账号，密码会被加密存储
   *
   * @param user - 注册信息
   * @returns 注册结果
   * @throws {BusinessException} 当用户名已存在时抛出异常
   */
  async register(user: RegisterDto) {
    return this.userAuthService.register(user);
  }

  /**
   * 创建JWT Token
   *
   * @param payload - Token载荷，包含uuid和userId
   * @returns JWT Token字符串
   */
  createToken(payload: { uuid: string; userId: number }): string {
    return this.userAuthService.createToken(payload);
  }

  /**
   * 解析JWT Token
   *
   * @param token - JWT Token字符串
   * @returns 解析后的Token载荷
   * @throws {Error} 当Token无效或过期时抛出异常
   */
  parseToken(token: string) {
    return this.userAuthService.parseToken(token);
  }

  /**
   * 更新Redis中的Token元数据
   *
   * @param token - JWT Token字符串
   * @param metaData - 要更新的元数据
   * @returns 更新结果
   */
  async updateRedisToken(token: string, metaData: Partial<UserType>) {
    return this.userAuthService.updateRedisToken(token, metaData);
  }

  /**
   * 更新Redis中用户的角色和权限信息
   *
   * @param uuid - 用户会话UUID
   * @param userId - 用户ID
   * @returns 更新结果
   */
  async updateRedisUserRolesAndPermissions(uuid: string, userId: number) {
    return this.userAuthService.updateRedisUserRolesAndPermissions(uuid, userId);
  }

  /**
   * 获取用户的角色ID列表
   *
   * @param userIds - 用户ID数组
   * @returns 角色ID数组
   */
  async getRoleIds(userIds: Array<number>) {
    return this.userAuthService.getRoleIds(userIds);
  }

  /**
   * 获取用户的权限列表
   *
   * @param userId - 用户ID
   * @returns 权限标识数组
   */
  async getUserPermissions(userId: number) {
    return this.userAuthService.getUserPermissions(userId);
  }

  /**
   * 获取用户完整信息
   *
   * 包含用户基本信息、部门、角色等关联数据
   *
   * @param userId - 用户ID
   * @returns 用户完整信息
   */
  async getUserinfo(userId: number): Promise<UserWithRelations> {
    return this.userAuthService.getUserinfo(userId);
  }

  // ==================== 个人资料相关 - 委托给 UserProfileService ====================

  /**
   * 获取当前用户个人资料
   *
   * @param user - 当前登录用户
   * @returns 用户个人资料信息
   */
  async profile(user) {
    return this.userProfileService.profile(user);
  }

  /**
   * 更新当前用户个人资料
   *
   * @param user - 当前登录用户
   * @param updateProfileDto - 更新的资料信息
   * @returns 更新结果
   */
  async updateProfile(user: UserType, updateProfileDto: UpdateProfileDto) {
    return this.userProfileService.updateProfile(user, updateProfileDto);
  }

  /**
   * 修改当前用户密码
   *
   * @param user - 当前登录用户
   * @param updatePwdDto - 包含旧密码和新密码
   * @returns 修改结果
   * @throws {BusinessException} 当旧密码错误时抛出异常
   */
  async updatePwd(user: UserType, updatePwdDto: UpdatePwdDto) {
    return this.userProfileService.updatePwd(user, updatePwdDto);
  }

  /**
   * 重置用户密码（管理员操作）
   *
   * @param body - 包含userId和新密码
   * @returns 重置结果
   */
  async resetPwd(body: ResetPwdDto) {
    return this.userProfileService.resetPwd(body);
  }

  // ==================== 角色分配相关 - 委托给 UserRoleService ====================

  /**
   * 获取用户的角色授权信息
   *
   * @param userId - 用户ID
   * @returns 用户信息及其角色列表
   */
  async authRole(userId: number) {
    return this.userRoleService.authRole(userId);
  }

  /**
   * 更新用户的角色授权
   *
   * @param query - 包含userId和roleIds
   * @returns 更新结果
   */
  @Transactional()
  async updateAuthRole(query) {
    return this.userRoleService.updateAuthRole(query);
  }

  /**
   * 查询已分配指定角色的用户列表
   *
   * @param query - 查询参数，包含roleId和分页信息
   * @returns 已分配该角色的用户分页列表
   */
  async allocatedList(query: AllocatedListDto) {
    return this.userRoleService.allocatedList(query);
  }

  /**
   * 查询未分配指定角色的用户列表
   *
   * @param query - 查询参数，包含roleId和分页信息
   * @returns 未分配该角色的用户分页列表
   */
  async unallocatedList(query: AllocatedListDto) {
    return this.userRoleService.unallocatedList(query);
  }

  /**
   * 取消用户的角色授权
   *
   * @param data - 包含userId和roleId
   * @returns 取消结果
   */
  async authUserCancel(data: AuthUserCancelDto) {
    return this.userRoleService.authUserCancel(data);
  }

  /**
   * 批量取消用户的角色授权
   *
   * @param data - 包含roleId和userIds数组
   * @returns 取消结果
   */
  @Transactional()
  async authUserCancelAll(data: AuthUserCancelAllDto) {
    return this.userRoleService.authUserCancelAll(data);
  }

  /**
   * 批量为用户分配角色
   *
   * @param data - 包含roleId和userIds数组
   * @returns 分配结果
   */
  @Transactional()
  async authUserSelectAll(data: AuthUserSelectAllDto) {
    return this.userRoleService.authUserSelectAll(data);
  }

  // ==================== 导出相关 - 委托给 UserExportService ====================

  /**
   * 导出用户数据为Excel文件
   *
   * @param res - Express Response对象
   * @param body - 查询条件
   * @param user - 当前登录用户，用于数据权限过滤
   * @returns Excel文件流
   */
  async export(res: Response, body: ListUserDto, user: UserType['user']) {
    delete body.pageNum;
    delete body.pageSize;
    const list = await this.findAll(body, user);
    return this.userExportService.export(res, list.data);
  }
}
