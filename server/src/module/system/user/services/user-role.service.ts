import { Injectable } from '@nestjs/common';
import { BusinessException } from 'src/common/exceptions';
import { DelFlagEnum, StatusEnum } from 'src/common/enum/index';
import { ResponseCode, Result } from 'src/common/response';
import { FormatDateFields } from 'src/common/utils/index';
import { PaginationHelper } from 'src/common/utils/pagination.helper';
import { Transactional } from 'src/common/decorators/transactional.decorator';
import { AllocatedListDto } from '../dto/index';
import { AuthUserCancelDto, AuthUserCancelAllDto, AuthUserSelectAllDto } from '../../role/dto/index';
import { PrismaService } from 'src/prisma/prisma.service';
import { UserRepository } from '../user.repository';
import { RoleService } from '../../role/role.service';
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
    private readonly prisma: PrismaService,
    private readonly userRepo: UserRepository,
    private readonly roleService: RoleService,
  ) {}

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
      this.roleService.findRoles({ where: { delFlag: DelFlagEnum.NORMAL } }),
      this.userRepo.findById(userId),
    ]);

    if (!user) {
      throw new BusinessException(ResponseCode.BUSINESS_ERROR, '用户不存在');
    }

    const dept = user.deptId
      ? await this.prisma.sysDept.findFirst({ where: { delFlag: DelFlagEnum.NORMAL, deptId: user.deptId } })
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
  async updateAuthRole(query: { userId: number; roleIds: string }) {
    let roleIds = query.roleIds.split(',');
    roleIds = roleIds.filter((v) => v !== '1'); // 排除超级管理员角色

    if (roleIds.length > 0) {
      await this.prisma.sysUserRole.deleteMany({ where: { userId: query.userId } });
      await this.prisma.sysUserRole.createMany({
        data: roleIds.map((id) => ({ userId: query.userId, roleId: +id })),
        skipDuplicates: true,
      });
    }
    return Result.ok();
  }

  /**
   * 查询已分配用户角色列表
   */
  async allocatedList(query: AllocatedListDto) {
    const relations = await this.prisma.sysUserRole.findMany({
      where: { roleId: +query.roleId },
      select: { userId: true },
    });
    if (!relations.length) {
      return Result.page([], 0);
    }
    const userIds = relations.map((item) => item.userId);
    const where: Prisma.SysUserWhereInput = {
      delFlag: DelFlagEnum.NORMAL,
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
    const formattedList = FormatDateFields(listWithDept);

    return Result.page(formattedList, total);
  }

  /**
   * 查询未分配用户角色列表
   */
  async unallocatedList(query: AllocatedListDto) {
    const relations = await this.prisma.sysUserRole.findMany({
      where: { roleId: +query.roleId },
      select: { userId: true },
    });
    const userIds = relations.map((item) => item.userId);

    const where: Prisma.SysUserWhereInput = {
      delFlag: DelFlagEnum.NORMAL,
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
    const formattedList = FormatDateFields(listWithDept);

    return Result.page(formattedList, total);
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
