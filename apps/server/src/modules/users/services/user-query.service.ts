import { Injectable } from '@nestjs/common';
import { Prisma, SysDept, SysUser } from '@prisma/client';
import { toDtoList } from 'src/shared/utils/index';
import { PaginationHelper } from 'src/shared/utils/pagination.helper';
import { UserResponseDto } from '../dto/responses';

import { DelFlagEnum, DataScopeEnum } from 'src/shared/enums/index';
import { Result } from 'src/shared/response';
import { ListUserRequestDto } from '../dto/index';

import { DeptService } from 'src/modules/depts/dept.service';
import { UserType } from '../dto/user';
import { PrismaService } from 'src/platform/prisma';

/** 用户实体与部门信息的联合类型 */
type UserWithDept = SysUser & { dept?: SysDept | null };

/**
 * 用户查询服务
 *
 * 提供用户查询相关功能：
 * - 分页查询用户列表
 * - 数据权限过滤
 * - 部门信息附加
 *
 * @class UserQueryService
 */
@Injectable()
export class UserQueryService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly deptService: DeptService,
  ) {}

  /**
   * 为用户列表附加部门信息
   */
  async attachDeptInfo(users: SysUser[]): Promise<UserWithDept[]> {
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
      const deptIds = await this.deptService.findDeptIdsByDataScope(currentUser.deptId, scope);
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

  /**
   * 分页查询用户列表
   */
  async findAll(query: ListUserRequestDto, user: UserType['user']) {
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

    const listWithDept = await this.attachDeptInfo(list);

    const rows = listWithDept.map((user) => ({
      ...user,
      deptName: user.dept?.deptName || '',
    }));

    return Result.page(toDtoList(UserResponseDto, rows), total, query.pageNum, query.pageSize);
  }
}
