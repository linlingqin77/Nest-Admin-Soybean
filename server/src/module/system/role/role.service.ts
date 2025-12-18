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

@Injectable()
export class RoleService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly roleRepo: RoleRepository,
    private readonly menuService: MenuService,
  ) { }
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


    const { list, total } = await this.roleRepo.findPageWithMenuCount(
      where,
      query.skip,
      query.take,
      { roleSort: 'asc' },
    );

    const formattedList = FormatDateFields(list);

    return Result.page(formattedList, total);
  }

  async findOne(roleId: number) {
    const res = await this.roleRepo.findById(roleId);
    return Result.ok(res);
  }

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
      data: rolePayload
    });

    return Result.ok(res);
  }

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
      data: rolePayload
    });

    return Result.ok(res);
  }

  async changeStatus(changeStatusDto: ChangeRoleStatusDto) {
    const res = await this.prisma.sysRole.update({
      where: { roleId: changeStatusDto.roleId },
      data: { status: changeStatusDto.status },
    });
    return Result.ok(res);
  }

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

  async findRoles(args: Prisma.SysRoleFindManyArgs) {
    return await this.prisma.sysRole.findMany(args);
  }
  /**
   * 根据角色获取用户权限列表
   */
  async getPermissionsByRoleIds(roleIds: number[]) {
    if (roleIds.includes(1)) return [{ perms: '*:*:*' }]; //当角色为超级管理员时，开放所有权限
    const list = await this.prisma.sysRoleMenu.findMany({
      where: {
        roleId: {
          in: roleIds,
        },
      },
      select: {
        menuId: true,
      },
    });
    const menuIds = list.map((item) => item.menuId);
    if (menuIds.length === 0) {
      return [];
    }
    const permission = await this.menuService.findMany({
      where: { delFlag: DelFlagEnum.NORMAL, status: StatusEnum.NORMAL, menuId: { in: menuIds } },
    });
    return permission;
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
