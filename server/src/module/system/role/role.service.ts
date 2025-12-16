import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Response } from 'express';
import { ResultData } from 'src/common/utils/result';
import { ListToTree, FormatDateFields } from 'src/common/utils/index';
import { ExportTable } from 'src/common/utils/export';

import { DataScopeEnum } from 'src/common/enum/index';
import { MenuService } from '../menu/menu.service';
import { CreateRoleDto, UpdateRoleDto, ListRoleDto, ChangeRoleStatusDto } from './dto/index';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class RoleService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly menuService: MenuService,
  ) { }
  async create(createRoleDto: CreateRoleDto) {
    const { menuIds = [], ...rolePayload } = createRoleDto as CreateRoleDto & { menuIds?: number[] };

    const role = await this.prisma.$transaction(async (tx) => {
      const createdRole = await tx.sysRole.create({
        data: {
          ...rolePayload,
          roleSort: rolePayload.roleSort ?? 0,
          status: rolePayload.status ?? '0',
          delFlag: '0',
          createBy: '',
          updateBy: '',
        },
      });
      if (menuIds.length > 0) {
        await tx.sysRoleMenu.createMany({
          data: menuIds.map((menuId) => ({ roleId: createdRole.roleId, menuId })),
          skipDuplicates: true,
        });
      }
      return createdRole;
    });

    return ResultData.ok(role);
  }

  async findAll(query: ListRoleDto) {
    const where: Prisma.SysRoleWhereInput = {
      delFlag: '0',
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

    const pageSize = Number(query.pageSize ?? 10);
    const pageNum = Number(query.pageNum ?? 1);

    const [list, total] = await this.prisma.$transaction([
      this.prisma.sysRole.findMany({
        where,
        skip: pageSize * (pageNum - 1),
        take: pageSize,
        orderBy: { roleSort: 'asc' },
      }),
      this.prisma.sysRole.count({ where }),
    ]);

    const formattedList = FormatDateFields(list);

    return ResultData.ok({
      rows: formattedList,
      total,
    });
  }

  async findOne(roleId: number) {
    const res = await this.prisma.sysRole.findUnique({
      where: {
        roleId,
      },
    });
    return ResultData.ok(res);
  }

  async update(updateRoleDto: UpdateRoleDto) {
    const { menuIds = [], ...rolePayload } = updateRoleDto as UpdateRoleDto & { menuIds?: number[] };

    const res = await this.prisma.$transaction(async (tx) => {
      await tx.sysRoleMenu.deleteMany({ where: { roleId: updateRoleDto.roleId } });

      if (menuIds.length > 0) {
        await tx.sysRoleMenu.createMany({
          data: menuIds.map((menuId) => ({ roleId: updateRoleDto.roleId, menuId })),
        });
      }

      return tx.sysRole.update({ where: { roleId: updateRoleDto.roleId }, data: rolePayload });
    });

    return ResultData.ok(res);
  }

  async dataScope(updateRoleDto: UpdateRoleDto) {
    const { deptIds = [], ...rolePayload } = updateRoleDto as UpdateRoleDto & { deptIds?: number[] };

    const res = await this.prisma.$transaction(async (tx) => {
      await tx.sysRoleDept.deleteMany({ where: { roleId: updateRoleDto.roleId } });

      if (deptIds.length > 0) {
        await tx.sysRoleDept.createMany({
          data: deptIds.map((deptId) => ({ roleId: updateRoleDto.roleId, deptId })),
        });
      }

      return tx.sysRole.update({ where: { roleId: updateRoleDto.roleId }, data: rolePayload });
    });

    return ResultData.ok(res);
  }

  async changeStatus(changeStatusDto: ChangeRoleStatusDto) {
    const res = await this.prisma.sysRole.update({
      where: { roleId: changeStatusDto.roleId },
      data: { status: changeStatusDto.status },
    });
    return ResultData.ok(res);
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
    return ResultData.ok(data.count);
  }

  async deptTree(roleId: number) {
    const res = await this.prisma.sysDept.findMany({
      where: {
        delFlag: '0',
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
    return ResultData.ok({
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
      where: { delFlag: '0', status: '0', menuId: { in: menuIds } },
    });
    return permission;
  }

  /**
   * 获取角色选择框列表
   */
  async optionselect(roleIds?: number[]) {
    const where: Prisma.SysRoleWhereInput = {
      delFlag: '0',
      status: '0',
    };
    if (roleIds && roleIds.length > 0) {
      where.roleId = { in: roleIds };
    }
    const list = await this.prisma.sysRole.findMany({
      where,
      orderBy: { roleSort: 'asc' },
    });
    return ResultData.ok(list);
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
