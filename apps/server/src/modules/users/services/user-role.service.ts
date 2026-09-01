import { Injectable } from '@nestjs/common';
import { BusinessException } from 'src/shared/exceptions';
import { DelFlagEnum, StatusEnum } from 'src/shared/enums/index';
import { ResponseCode, Result } from 'src/shared/response';
import { toDtoList } from 'src/shared/utils/serialize.util';
import { PaginationHelper } from 'src/shared/utils/pagination.helper';
import { InjectTransactionHost, Transactional, PrismaTransactionHost } from 'src/core/http/decorators/transactional.decorator';
import { AllocatedListRequestDto } from '../dto/index';
import { UserResponseDto } from '../dto/responses';
import { AuthUserCancelDto, AuthUserCancelAllDto, AuthUserSelectAllDto } from 'src/modules/roles/dto/index';
import { UserRepository } from '../user.repository';
import { RoleService } from 'src/modules/roles/role.service';
import { SysDept, SysRole, SysUser, Prisma } from '@prisma/client';

type UserWithDept = SysUser & { dept?: SysDept | null };
type UserWithRelations = UserWithDept & { roles?: SysRole[] };

/**
 * 用户角色分配服务
 *
 * @description 处理用户与角色的关联关系管理
 */
@Injectable()
export class UserRoleService {
  constructor(
    @InjectTransactionHost() private readonly txHost: PrismaTransactionHost,
    private readonly userRepo: UserRepository,
    private readonly roleService: RoleService,
  ) {}
  private get prisma() { return this.txHost.tx; }

  /**
   * 附加部门信息到用户列表
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
        delFlag: '0',
      },
    });
    const deptMap = new Map<number, SysDept>(depts.map((dept) => [dept.deptId, dept]));
    return users.map((item) => ({
      ...item,
      dept: deptMap.get(item.deptId ?? -1) ?? null,
    }));
  }

  /**
   * 获取用户角色ID列表
   */
  private async getRoleIds(userIds: Array<number>) {
    if (!userIds.length) {
      return [];
    }
    const roleList = await this.prisma.sysUserRole.findMany({
      where: {
        userId: { in: userIds },
      },
      select: { roleId: true },
    });
    return [...new Set(roleList.map((item) => item.roleId))];
  }

  /**
   * 查询用户角色授权信息
   */
  async authRole(userId: number) {
    const [allRoles, user] = await Promise.all([
      this.roleService.findRoles({ where: { delFlag: '0' } }),
      this.userRepo.findById(userId),
    ]);

    if (!user) {
      throw new BusinessException(ResponseCode.BUSINESS_ERROR, '用户不存在');
    }

    const dept = user.deptId
      ? await this.prisma.sysDept.findFirst({ where: { delFlag: '0', deptId: user.deptId } })
      : null;
    const roleIds = await this.getRoleIds([userId]);

    const enrichedUser: UserWithRelations = {
      ...user,
      dept,
      roles: allRoles.filter((item) => {
        if (roleIds.includes(item.roleId)) {
          (item as any).flag = true;
        }
        return true;
      }),
    };

    return Result.ok({
      roles: allRoles,
      user: enrichedUser,
    });
  }

  /**
   * 更新用户角色授权
   */
  @Transactional()
  async updateAuthRole(query: { userId: number | string; roleIds: string }) {
    const userId = typeof query.userId === 'string' ? parseInt(query.userId, 10) : query.userId;
    let roleIds = query.roleIds.split(',');
    roleIds = roleIds.filter((v) => v !== '1'); // 排除超级管理员角色

    if (roleIds.length > 0) {
      await this.prisma.sysUserRole.deleteMany({ where: { userId } });
      await this.prisma.sysUserRole.createMany({
        data: roleIds.map((id) => ({ userId, roleId: +id })),
        skipDuplicates: true,
      });
    }
    return Result.ok();
  }

  /**
   * 查询已分配用户角色列表
   */
  async allocatedList(query: AllocatedListRequestDto) {
    const relations = await this.prisma.sysUserRole.findMany({
      where: { roleId: +(query.roleId ?? 0) },
      select: { userId: true },
    });
    if (!relations.length) {
      return Result.page([], 0, query.pageNum, query.pageSize);
    }
    const userIds = relations.map((item) => item.userId);
    const where: Prisma.SysUserWhereInput = {
      delFlag: '0',
      status: StatusEnum.NORMAL,
      userId: { in: userIds },
    };

    if (query.userName) {
      where.userName = { contains: query.userName };
    }
    if (query.phonenumber) {
      where.phonenumber = { contains: query.phonenumber };
    }

    const { skip, take } = PaginationHelper.getPagination(query);
    const [list, total] = await this.prisma.$transaction([
      this.prisma.sysUser.findMany({ where, skip, take, orderBy: { createTime: 'desc' } }),
      this.prisma.sysUser.count({ where }),
    ]);

    const listWithDept = await this.attachDeptInfo(list);

    return Result.page(toDtoList(UserResponseDto, listWithDept), total, query.pageNum, query.pageSize);
  }

  /**
   * 查询未分配用户角色列表
   */
  async unallocatedList(query: AllocatedListRequestDto) {
    const relations = await this.prisma.sysUserRole.findMany({
      where: { roleId: +(query.roleId ?? 0) },
      select: { userId: true },
    });
    const userIds = relations.map((item) => item.userId);

    const where: Prisma.SysUserWhereInput = {
      delFlag: '0',
      status: StatusEnum.NORMAL,
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

    const { skip, take } = PaginationHelper.getPagination(query);
    const [list, total] = await this.prisma.$transaction([
      this.prisma.sysUser.findMany({ where, skip, take, orderBy: { createTime: 'desc' } }),
      this.prisma.sysUser.count({ where }),
    ]);

    const listWithDept = await this.attachDeptInfo(list);

    return Result.page(toDtoList(UserResponseDto, listWithDept), total, query.pageNum, query.pageSize);
  }

  /**
   * 取消用户角色授权
   */
  async authUserCancel(data: AuthUserCancelDto) {
    await this.prisma.sysUserRole.deleteMany({
      where: {
        userId: data.userId,
        roleId: data.roleId,
      },
    });
    return Result.ok();
  }

  /**
   * 批量取消用户角色授权
   */
  @Transactional()
  async authUserCancelAll(data: AuthUserCancelAllDto) {
    const userIds = data.userIds.split(',').map((id) => +id);
    await this.prisma.sysUserRole.deleteMany({
      where: {
        userId: { in: userIds },
        roleId: +data.roleId,
      },
    });
    return Result.ok();
  }

  /**
   * 批量选择用户角色授权
   */
  @Transactional()
  async authUserSelectAll(data: AuthUserSelectAllDto) {
    const userIds = data.userIds.split(',').map((id) => +id);
    const entities = userIds.map((userId) => ({
      userId,
      roleId: +data.roleId,
    }));
    await this.prisma.sysUserRole.createMany({ data: entities, skipDuplicates: true });
    return Result.ok();
  }
}
