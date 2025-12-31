import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Response } from 'express';
import { Result } from 'src/common/response';
import { ListToTree, FormatDateFields } from 'src/common/utils/index';
import { ExportTable } from 'src/common/utils/export';

import { DataScopeEnum, DelFlagEnum, StatusEnum } from 'src/common/enum/index';
import { Transactional } from 'src/common/decorators/transactional.decorator';
import { MenuService } from '../menu/menu.service';
import { CreateRoleDto, UpdateRoleDto, ListRoleDto, ChangeRoleStatusDto } from './dto/index';
import { PrismaService } from 'src/prisma/prisma.service';
import { RoleRepository } from './role.repository';
import { Uniq } from 'src/common/utils/index';

/**
 * 角色管理服务
 *
 * 提供角色相关的核心业务功能，包括：
 * - 角色CRUD操作（创建、查询、更新、删除）
 * - 角色菜单权限管理
 * - 角色数据权限管理
 * - 角色状态管理
 * - 角色数据导出
 *
 * @class RoleService
 * @description 角色管理的核心服务类，实现RBAC权限模型中的角色管理功能
 */
@Injectable()
export class RoleService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly roleRepo: RoleRepository,
    private readonly menuService: MenuService,
  ) {}

  /**
   * 创建新角色
   *
   * 创建角色并关联菜单权限。
   *
   * @param createRoleDto - 创建角色的数据传输对象
   * @returns 创建的角色信息
   *
   * @example
   * ```typescript
   * await roleService.create({
   *   roleName: '普通用户',
   *   roleKey: 'common',
   *   roleSort: 2,
   *   menuIds: [1, 2, 3]
   * });
   * ```
   */
  @Transactional()
  async create(createRoleDto: CreateRoleDto) {
    const { menuIds = [], ...rolePayload } = createRoleDto as CreateRoleDto & { menuIds?: number[] };

    const createdRole = await this.prisma.sysRole.create({
      data: {
        ...rolePayload,
        roleSort: rolePayload.roleSort ?? 0,
        status: rolePayload.status ?? '0',
        delFlag: DelFlagEnum.NORMAL,
      },
    });

    if (menuIds.length > 0) {
      await this.prisma.sysRoleMenu.createMany({
        data: menuIds.map((menuId) => ({ roleId: createdRole.roleId, menuId })),
        skipDuplicates: true,
      });
    }

    return Result.ok(createdRole);
  }

  /**
   * 分页查询角色列表
   *
   * 支持按角色名称、角色标识、状态等条件筛选。
   *
   * @param query - 查询参数，包含分页信息和筛选条件
   * @returns 分页角色列表，包含rows和total
   *
   * @example
   * ```typescript
   * const result = await roleService.findAll({
   *   pageNum: 1,
   *   pageSize: 10,
   *   roleName: 'admin',
   *   status: '0'
   * });
   * ```
   */
  async findAll(query: ListRoleDto) {
    const where: Prisma.SysRoleWhereInput = {
      delFlag: DelFlagEnum.NORMAL,
    };

    if (query.roleName) {
      where.roleName = {
        contains: query.roleName,
      };
    }

    if (query.roleKey) {
      where.roleKey = {
        contains: query.roleKey,
      };
    }

    if (query.roleId) {
      where.roleId = Number(query.roleId);
    }

    if (query.status) {
      where.status = query.status;
    }

    if (query.params?.beginTime && query.params?.endTime) {
      where.createTime = {
        gte: new Date(query.params.beginTime),
        lte: new Date(query.params.endTime),
      };
    }

    const { list, total } = await this.roleRepo.findPageWithMenuCount(where, query.skip, query.take, {
      roleSort: 'asc',
    });

    const formattedList = FormatDateFields(list);

    return Result.page(formattedList, total);
  }

  /**
   * 根据角色ID查询角色详情
   *
   * @param roleId - 角色ID
   * @returns 角色详情信息
   */
  async findOne(roleId: number) {
    const res = await this.roleRepo.findById(roleId);
    return Result.ok(res);
  }

  /**
   * 更新角色信息
   *
   * 更新角色基本信息及其关联的菜单权限。
   * 会先删除原有的菜单关联，再创建新的关联。
   *
   * @param updateRoleDto - 更新角色的数据传输对象
   * @returns 更新后的角色信息
   *
   * @example
   * ```typescript
   * await roleService.update({
   *   roleId: 2,
   *   roleName: '新角色名',
   *   menuIds: [1, 2, 3, 4]
   * });
   * ```
   */
  @Transactional()
  async update(updateRoleDto: UpdateRoleDto) {
    const { menuIds = [], ...rolePayload } = updateRoleDto as UpdateRoleDto & { menuIds?: number[] };

    await this.prisma.sysRoleMenu.deleteMany({ where: { roleId: updateRoleDto.roleId } });

    if (menuIds.length > 0) {
      await this.prisma.sysRoleMenu.createMany({
        data: menuIds.map((menuId) => ({ roleId: updateRoleDto.roleId, menuId })),
      });
    }

    const res = await this.prisma.sysRole.update({
      where: { roleId: updateRoleDto.roleId },
      data: rolePayload,
    });

    return Result.ok(res);
  }

  /**
   * 更新角色数据权限范围
   *
   * 设置角色的数据权限范围，支持以下类型：
   * - 全部数据权限
   * - 自定义数据权限（指定部门）
   * - 本部门数据权限
   * - 本部门及以下数据权限
   * - 仅本人数据权限
   *
   * @param updateRoleDto - 包含roleId、dataScope和deptIds
   * @returns 更新后的角色信息
   */
  @Transactional()
  async dataScope(updateRoleDto: UpdateRoleDto) {
    const { deptIds = [], ...rolePayload } = updateRoleDto as UpdateRoleDto & { deptIds?: number[] };

    await this.prisma.sysRoleDept.deleteMany({ where: { roleId: updateRoleDto.roleId } });

    if (deptIds.length > 0) {
      await this.prisma.sysRoleDept.createMany({
        data: deptIds.map((deptId) => ({ roleId: updateRoleDto.roleId, deptId })),
      });
    }

    const res = await this.prisma.sysRole.update({
      where: { roleId: updateRoleDto.roleId },
      data: rolePayload,
    });

    return Result.ok(res);
  }

  /**
   * 修改角色状态
   *
   * 启用或禁用角色
   *
   * @param changeStatusDto - 包含roleId和status
   * @returns 更新后的角色信息
   */
  async changeStatus(changeStatusDto: ChangeRoleStatusDto) {
    const res = await this.prisma.sysRole.update({
      where: { roleId: changeStatusDto.roleId },
      data: { status: changeStatusDto.status },
    });
    return Result.ok(res);
  }

  /**
   * 批量删除角色（软删除）
   *
   * @param roleIds - 要删除的角色ID数组
   * @returns 删除的角色数量
   */
  async remove(roleIds: number[]) {
    const data = await this.prisma.sysRole.updateMany({
      where: {
        roleId: {
          in: roleIds,
        },
      },
      data: {
        delFlag: '1',
      },
    });
    return Result.ok(data.count);
  }

  /**
   * 获取角色的部门树及已选中的部门
   *
   * 用于角色数据权限设置页面，返回完整的部门树和该角色已关联的部门ID
   *
   * @param roleId - 角色ID
   * @returns 包含depts（部门树）和checkedKeys（已选中的部门ID）
   */
  async deptTree(roleId: number) {
    const res = await this.prisma.sysDept.findMany({
      where: {
        delFlag: DelFlagEnum.NORMAL,
      },
    });
    const tree = ListToTree(
      res,
      (m) => +m.deptId,
      (m) => m.deptName,
    );
    const deptIds = await this.prisma.sysRoleDept.findMany({
      where: { roleId },
      select: { deptId: true },
    });
    const checkedKeys = deptIds.map((item) => {
      return item.deptId;
    });
    return Result.ok({
      depts: tree,
      checkedKeys: checkedKeys,
    });
  }

  /**
   * 根据Prisma查询参数查找角色列表
   *
   * 底层查询方法，供其他服务调用
   *
   * @param args - Prisma查询参数
   * @returns 角色列表
   */
  async findRoles(args: Prisma.SysRoleFindManyArgs) {
    return await this.prisma.sysRole.findMany(args);
  }
  /**
   * 根据角色获取用户权限列表
   */
  async getPermissionsByRoleIds(roleIds: number[]) {
    if (roleIds.includes(1)) return [{ perms: '*:*:*' }]; //当角色为超级管理员时，开放所有权限
    if (!roleIds.length) return [];

    // 单次查询拉取菜单权限，避免 role→roleMenu→menu 的多次往返
    // 先取 role-menu 关联，再一次性查菜单
    const roleMenuRows = await this.prisma.sysRoleMenu.findMany({
      where: { roleId: { in: roleIds } },
      select: { menuId: true },
    });
    if (!roleMenuRows?.length) return [];
    const menuIds = Uniq(roleMenuRows.map((row) => row.menuId));
    if (!menuIds.length) return [];

    const permissions = await this.prisma.sysMenu.findMany({
      where: {
        delFlag: DelFlagEnum.NORMAL,
        status: StatusEnum.NORMAL,
        menuId: { in: menuIds },
      },
      select: { perms: true },
    });

    const uniqPerms = Uniq(permissions.map((item) => item.perms).filter(Boolean));
    return uniqPerms.map((perms) => ({ perms }));
  }

  /**
   * 获取角色选择框列表
   */
  async optionselect(roleIds?: number[]) {
    const where: Prisma.SysRoleWhereInput = {
      delFlag: DelFlagEnum.NORMAL,
      status: StatusEnum.NORMAL,
    };
    if (roleIds && roleIds.length > 0) {
      where.roleId = { in: roleIds };
    }
    const list = await this.prisma.sysRole.findMany({
      where,
      orderBy: { roleSort: 'asc' },
    });
    return Result.ok(list);
  }

  /**
   * 根据角色ID异步查找与之关联的部门ID列表。
   *
   * @param roleId - 角色的ID，用于查询与该角色关联的部门。
   * @returns 返回一个Promise，该Promise解析为一个部门ID的数组。
   */
  async findRoleWithDeptIds(roleId: number) {
    const res = await this.prisma.sysRoleDept.findMany({
      select: {
        deptId: true,
      },
      where: {
        roleId,
      },
    });
    return res.map((item) => item.deptId);
  }

  /**
   * 导出角色管理数据为xlsx
   * @param res
   */
  async export(res: Response, body: ListRoleDto) {
    delete body.pageNum;
    delete body.pageSize;
    const list = await this.findAll(body);
    const options = {
      sheetName: '角色数据',
      data: list.data.rows,
      header: [
        { title: '角色编号', dataIndex: 'roleId' },
        { title: '角色名称', dataIndex: 'roleName', width: 15 },
        { title: '权限字符', dataIndex: 'roleKey' },
        { title: '显示顺序', dataIndex: 'roleSort' },
        { title: '状态', dataIndex: 'status' },
        { title: '创建时间', dataIndex: 'createTime', width: 15 },
      ],
    };
    return await ExportTable(options, res);
  }
}
