import { Injectable } from '@nestjs/common';
import { BusinessException } from 'src/shared/exceptions';
import { Prisma, SysDept, SysPost, SysRole, SysUser } from '@prisma/client';
import { attachDeptInfo, toDto, toDtoList } from 'src/shared/utils/index';
import { PaginationHelper } from 'src/shared/utils/pagination.helper';
import { UserResponseDto } from '../dto/responses';

import { CacheEnum, DataScopeEnum, DelFlagEnum } from 'src/shared/enums/index';
import {
  InjectTransactionHost,
  PrismaTransactionHost,
  Transactional,
} from 'src/core/http/decorators/transactional.decorator';
import { Idempotent } from 'src/core/http/decorators/idempotent.decorator';
import { Lock } from 'src/core/http/decorators/lock.decorator';
import { SUPER_ADMIN_ROLE_ID, SUPER_ADMIN_USER_ID, SYS_USER_TYPE } from 'src/shared/constants/index';
import { ResponseCode, Result } from 'src/shared/response';
import {
  ChangeUserStatusRequestDto,
  CreateUserRequestDto,
  ListUserRequestDto,
  UpdateUserRequestDto,
} from '../dto/index';

import { DeptService } from 'src/modules/depts/dept.service';
import { UserType } from '../dto/user';
import { Cacheable, CacheEvict } from 'src/core/auth/decorators/redis.decorator';
import { UserRepository } from '../user.repository';
import { RoleService } from 'src/modules/roles/role.service';
import { PasswordService } from 'src/shared/services/password.service';

/** 用户实体与部门信息的联合类型 */
type UserWithDept = SysUser & { dept?: SysDept | null };
/** 用户实体与关联信息（部门、角色、岗位）的联合类型 */
type UserWithRelations = UserWithDept & { roles?: SysRole[]; posts?: SysPost[] };

/**
 * 用户 CRUD 服务
 *
 * 提供用户相关的 CRUD 操作，包括：
 * - 用户创建、查询、更新、删除
 * - 用户状态变更
 *
 * @class UserCrudService
 */
@Injectable()
export class UserCrudService {
  constructor(
    @InjectTransactionHost() private readonly txHost: PrismaTransactionHost,
    private readonly userRepo: UserRepository,
    private readonly roleService: RoleService,
    private readonly deptService: DeptService,
    private readonly passwordService: PasswordService,
  ) {}
  private get prisma() {
    return this.txHost.tx;
  }

  // ==================== 私有辅助方法 ====================

  // attachDeptInfo 使用 shared/utils/user-dept.util.ts 的 attachDeptInfo 工具函数

  /**
   * 构建数据权限过滤条件
   */
  async buildDataScopeConditions(currentUser?: UserType['user']): Promise<Prisma.SysUserWhereInput[]> {
    if (!currentUser) {
      return [];
    }
    const deptIdSet = new Set<number>();
    let dataScopeAll = false;
    let dataScopeSelf = false;
    const roles = currentUser.roles ?? [];

    const customRoleIds: number[] = [];
    const deptScopes = new Set<DataScopeEnum>();

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

    if (customRoleIds.length > 0) {
      const roleDeptRows = await this.prisma.sysRoleDept.findMany({
        where: { roleId: { in: customRoleIds } },
        select: { deptId: true },
      });
      roleDeptRows.forEach((row) => deptIdSet.add(row.deptId));
    }

    for (const scope of deptScopes) {
      const deptIds = await this.deptService.findDeptIdsByDataScope(currentUser.deptId ?? 0, scope);
      deptIds.forEach((id) => deptIdSet.add(+id));
    }

    if (deptIdSet.size > 0) {
      return [{ deptId: { in: Array.from(deptIdSet) } }];
    }

    if (dataScopeSelf) {
      return [{ userId: currentUser.userId }];
    }

    return [];
  }

  // ==================== 用户 CRUD 操作 ====================

  /**
   * 创建新用户
   */
  @Idempotent({
    timeout: 5,
    keyResolver: '{body.userName}',
    message: '用户正在创建中，请勿重复提交',
  })
  @Transactional()
  async create(createUserDto: CreateUserRequestDto) {
    if (createUserDto.password) {
      createUserDto.password = await this.passwordService.hash(createUserDto.password);
    }
    const {
      postIds = [],
      roleIds = [],
      ...userPayload
    } = createUserDto as CreateUserRequestDto & { postIds?: number[]; roleIds?: number[] };

    const user = await this.userRepo.create({
      ...userPayload,
      userType: SYS_USER_TYPE.CUSTOM,
      phonenumber: userPayload.phonenumber ?? '',
      sex: userPayload.sex ?? '0',
      status: userPayload.status ?? '0',
      avatar: '',
      delFlag: '0',
      loginIp: '',
    });

    if (postIds.length > 0) {
      await this.prisma.sysUserPost.createMany({
        data: postIds.map((postId) => ({ userId: user.userId, postId })),
        skipDuplicates: true,
      });
    }

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
   */
  async findAll(query: ListUserRequestDto, user: UserType['user']) {
    const where: Prisma.SysUserWhereInput = {
      delFlag: '0',
    };

    const andConditions: Prisma.SysUserWhereInput[] = await this.buildDataScopeConditions(user);

    if (query.deptId) {
      const deptIds = await this.deptService.findDeptIdsByDataScope(
        +query.deptId,
        DataScopeEnum.DATA_SCOPE_DEPT_AND_CHILD,
      );
      andConditions.push({
        deptId: { in: deptIds.map((item) => +item) },
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

    const { rows: list, total } = await PaginationHelper.paginateWithTransaction<SysUser>(
      this.prisma,
      'sysUser',
      { where, skip, take, orderBy: { createTime: 'desc' } },
      { where },
    );

    const listWithDept = await attachDeptInfo(this.prisma, list);

    const rows = listWithDept.map((user) => ({
      ...user,
      deptName: user.dept?.deptName || '',
    }));

    return Result.page(toDtoList(UserResponseDto, rows), total, query.pageNum, query.pageSize);
  }

  /**
   * 根据用户ID查询用户详情
   *
   * @param userId 用户ID
   * @param withReferenceData 是否同时返回全量的 posts/roles 列表（用于下拉选择器）。
   * 多数场景下，前端只需要查看或编辑用户，不需要刷新参考数据 — 默认 false
   * 以避免每次都做 `findMany` 全表扫描。需要时显式传 `?withReferenceData=true`。
   */
  @Cacheable(CacheEnum.SYS_USER_KEY, '{0}')
  async findOne(userId: number, withReferenceData = false) {
    const data = await this.userRepo.findById(userId);

    BusinessException.throwIfNull(data, '用户不存在', ResponseCode.DATA_NOT_FOUND);

    const [dept, postList, roleIds] = await Promise.all([
      data?.deptId
        ? this.prisma.sysDept.findFirst({
            where: { deptId: data.deptId, delFlag: '0' },
          })
        : Promise.resolve(null),
      this.prisma.sysUserPost.findMany({ where: { userId }, select: { postId: true } }),
      this.getRoleIds([userId]),
    ]);

    const postIds = postList.map((item) => item.postId);

    // 按需获取用户关联的角色和岗位。
    // 全量 posts / roles 仅在调用方明确要求时（withReferenceData=true）才拉，
    // 否则把无意义全表扫描省掉。
    let userRoles: SysRole[] = [];
    let userPosts: SysPost[] = [];
    let allPostsMaybe: SysPost[] | undefined;
    let allRolesMaybe: SysRole[] | undefined;

    if (withReferenceData) {
      [userRoles, userPosts, allPostsMaybe, allRolesMaybe] = await Promise.all([
        roleIds.length > 0
          ? this.roleService.findRoles({ where: { roleId: { in: roleIds }, delFlag: '0' } })
          : Promise.resolve([]),
        postIds.length > 0
          ? this.prisma.sysPost.findMany({ where: { postId: { in: postIds }, delFlag: '0' } })
          : Promise.resolve([]),
        this.prisma.sysPost.findMany({ where: { delFlag: '0' } }),
        this.roleService.findRoles({ where: { delFlag: '0' } }),
      ]);
    } else {
      [userRoles, userPosts] = await Promise.all([
        roleIds.length > 0
          ? this.roleService.findRoles({ where: { roleId: { in: roleIds }, delFlag: '0' } })
          : Promise.resolve([]),
        postIds.length > 0
          ? this.prisma.sysPost.findMany({ where: { postId: { in: postIds }, delFlag: '0' } })
          : Promise.resolve([]),
      ]);
    }

    const enrichedData: UserWithRelations = {
      ...data,
      dept,
      roles: userRoles,
    };

    const response: Record<string, unknown> = {
      data: toDto(UserResponseDto, enrichedData),
      postIds,
      posts: userPosts,
      roleIds,
    };

    if (withReferenceData) {
      response.allPosts = allPostsMaybe;
      response.allRoles = allRolesMaybe;
    }

    return Result.ok(response);
  }

  /**
   * 获取用户的角色ID列表（委托给 UserRepository）
   */
  async getRoleIds(userIds: Array<number>): Promise<number[]> {
    return this.userRepo.findRoleIdsByUserIds(userIds);
  }

  /**
   * 更新用户信息
   */
  @CacheEvict(CacheEnum.SYS_USER_KEY, '{0.userId}')
  @Transactional()
  async update(updateUserDto: UpdateUserRequestDto, userId: number) {
    if (updateUserDto.userId === SUPER_ADMIN_USER_ID) {
      throw new BusinessException(ResponseCode.BUSINESS_ERROR, '不允许修改超级管理员');
    }

    updateUserDto.roleIds = (updateUserDto.roleIds ?? []).filter((v) => v !== SUPER_ADMIN_ROLE_ID);

    if (updateUserDto.userId === userId) {
      delete updateUserDto.status;
    }

    const {
      postIds = [],
      roleIds = [],
      ...rest
    } = updateUserDto as UpdateUserRequestDto & { postIds?: number[]; roleIds?: number[] };

    if (postIds.length > 0 || roleIds.length > 0) {
      // 角色与岗位变更必须在同一事务中完成，避免 deleteMany 成功而 createMany 失败导致权限被清空。
      // 这里继续使用 prisma 事务客户端（来自 @Transactional），保证原子性。
      if (postIds.length > 0) {
        await this.prisma.sysUserPost.deleteMany({ where: { userId: updateUserDto.userId } });
        await this.prisma.sysUserPost.createMany({
          data: postIds.map((postId) => ({ userId: updateUserDto.userId, postId })),
          skipDuplicates: true,
        });
      }

      if (roleIds.length > 0) {
        await this.prisma.sysUserRole.deleteMany({ where: { userId: updateUserDto.userId } });
        await this.prisma.sysUserRole.createMany({
          data: roleIds.map((roleId) => ({ userId: updateUserDto.userId, roleId })),
          skipDuplicates: true,
        });
      }
    }

    // 构造更新数据，排除不应直接更新的字段
    const {
      password,
      dept,
      roles,
      roleIds: _roleIds,
      postIds: _postIds,
      ...cleanUpdateData
    } = rest as Record<string, unknown>;
    const updateData = cleanUpdateData as Prisma.SysUserUpdateInput;

    const data = await this.prisma.sysUser.update({
      where: { userId: updateUserDto.userId },
      data: updateData,
    });

    return Result.ok(data);
  }

  /**
   * 批量删除用户（软删除）
   */
  async remove(ids: number[]) {
    const count = await this.userRepo.softDeleteBatch(ids);
    return Result.ok({ count });
  }

  /**
   * 修改用户状态
   */
  @Lock({
    key: 'user:status:{body.userId}',
    leaseTime: 10,
    message: '用户状态正在变更中，请稍后重试',
  })
  async changeStatus(changeStatusDto: ChangeUserStatusRequestDto) {
    const userData = await this.userRepo.findById(changeStatusDto.userId);
    BusinessException.throwIf(
      userData?.userType === SYS_USER_TYPE.SYS,
      '系统角色不可停用',
      ResponseCode.BUSINESS_ERROR,
    );

    await this.userRepo.update(changeStatusDto.userId, { status: changeStatusDto.status });
    return Result.ok();
  }

  /**
   * 清除指定用户的缓存
   */
  @CacheEvict(CacheEnum.SYS_USER_KEY, '{0}')
  clearCacheByUserId(userId: number) {
    return userId;
  }
}
