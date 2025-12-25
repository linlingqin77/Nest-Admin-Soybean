import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Result, ResponseCode } from 'src/common/response';
import { BusinessException } from 'src/common/exceptions';
import { CreateDeptDto, UpdateDeptDto, ListDeptDto } from './dto/index';
import { FormatDateFields, ListToTree } from 'src/common/utils/index';
import { CacheEnum, DataScopeEnum, DelFlagEnum, StatusEnum } from 'src/common/enum/index';
import { Cacheable, CacheEvict } from 'src/common/decorators/redis.decorator';
import { PrismaService } from 'src/prisma/prisma.service';
import { DeptRepository } from './dept.repository';
import { Transactional } from 'src/common/decorators/transactional.decorator';

@Injectable()
export class DeptService {
  private readonly logger = new Logger(DeptService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly deptRepo: DeptRepository,
  ) {}

  @CacheEvict(CacheEnum.SYS_DEPT_KEY, '*')
  @Transactional()
  async create(createDeptDto: CreateDeptDto) {
    let ancestors = '0';
    if (createDeptDto.parentId) {
      const parent = await this.prisma.sysDept.findUnique({
        where: {
          deptId: createDeptDto.parentId,
        },
        select: {
          ancestors: true,
        },
      });
      if (!parent) {
        return Result.fail(ResponseCode.INTERNAL_SERVER_ERROR, '父级部门不存在');
      }
      ancestors = parent.ancestors ? `${parent.ancestors},${createDeptDto.parentId}` : `${createDeptDto.parentId}`;
    }
    const payload: Prisma.SysDeptUncheckedCreateInput = {
      parentId: createDeptDto.parentId,
      ancestors,
      deptName: createDeptDto.deptName,
      orderNum: createDeptDto.orderNum,
      leader: createDeptDto.leader ?? '',
      phone: createDeptDto.phone ?? '',
      email: createDeptDto.email ?? '',
      status: createDeptDto.status ?? '0',
      delFlag: DelFlagEnum.NORMAL,
      ...createDeptDto,
      remark: null,
    };
    await this.deptRepo.create(payload);
    return Result.ok();
  }

  async findAll(query: ListDeptDto) {
    const where: Prisma.SysDeptWhereInput = {
      delFlag: DelFlagEnum.NORMAL,
    };

    if (query.deptName) {
      where.deptName = {
        contains: query.deptName,
      };
    }

    if (query.status) {
      where.status = query.status;
    }

    const res = await this.prisma.sysDept.findMany({
      where,
      orderBy: { orderNum: 'asc' },
    });
    const formattedRes = FormatDateFields(res);
    return Result.ok(formattedRes);
  }

  @Cacheable(CacheEnum.SYS_DEPT_KEY, 'findOne:{deptId}')
  async findOne(deptId: number) {
    const data = await this.deptRepo.findById(deptId);
    const formattedData = FormatDateFields(data);
    return Result.ok(formattedData);
  }

  /**
   * 根据数据权限范围和部门ID查询部门ID列表。
   * @param deptId 部门ID，表示需要查询的部门。
   * @param dataScope 数据权限范围，决定查询的部门范围。
   * @returns 返回一个部门ID数组，根据数据权限范围决定返回的部门ID集合。
   */
  @Cacheable(CacheEnum.SYS_DEPT_KEY, 'findDeptIdsByDataScope:{deptId}-{dataScope}')
  async findDeptIdsByDataScope(deptId: number, dataScope: DataScopeEnum) {
    try {
      if (dataScope === DataScopeEnum.DATA_SCOPE_SELF) {
        return [];
      }

      const where: Prisma.SysDeptWhereInput = {
        delFlag: DelFlagEnum.NORMAL,
      };

      if (dataScope === DataScopeEnum.DATA_SCOPE_DEPT) {
        where.deptId = deptId;
      }

      if (dataScope === DataScopeEnum.DATA_SCOPE_DEPT_AND_CHILD) {
        where.OR = [
          { deptId },
          {
            ancestors: {
              contains: `${deptId}`,
            },
          },
        ];
      }

      const list = await this.prisma.sysDept.findMany({ where });
      return list.map((item) => item.deptId);
    } catch (error) {
      this.logger.error('Failed to query department IDs:', error);
      BusinessException.throw(ResponseCode.INTERNAL_SERVER_ERROR, '查询部门ID失败', error);
    }
  }

  @Cacheable(CacheEnum.SYS_DEPT_KEY, 'findListExclude')
  async findListExclude(id: number) {
    // 排除 ancestors 中包含指定 id 的部门（排除子部门）
    const data = await this.prisma.sysDept.findMany({
      where: {
        delFlag: DelFlagEnum.NORMAL,
        NOT: {
          OR: [
            { deptId: id },
            { ancestors: { contains: `,${id},` } },
            { ancestors: { startsWith: `${id},` } },
            { ancestors: { endsWith: `,${id}` } },
          ],
        },
      },
    });
    return Result.ok(data);
  }

  @CacheEvict(CacheEnum.SYS_DEPT_KEY, '*')
  @Transactional()
  async update(updateDeptDto: UpdateDeptDto) {
    if (updateDeptDto.parentId && updateDeptDto.parentId !== 0) {
      const parent = await this.prisma.sysDept.findUnique({
        where: {
          deptId: updateDeptDto.parentId,
        },
        select: { ancestors: true },
      });
      if (!parent) {
        return Result.fail(ResponseCode.INTERNAL_SERVER_ERROR, '父级部门不存在');
      }
      const ancestors = parent.ancestors
        ? `${parent.ancestors},${updateDeptDto.parentId}`
        : `${updateDeptDto.parentId}`;
      Object.assign(updateDeptDto, { ancestors: ancestors });
    }
    await this.deptRepo.update(updateDeptDto.deptId, updateDeptDto);
    return Result.ok();
  }

  @CacheEvict(CacheEnum.SYS_DEPT_KEY, '*')
  async remove(deptId: number) {
    const data = await this.deptRepo.softDelete(deptId);
    return Result.ok(data);
  }

  /**
   * 获取部门选择框列表
   */
  async optionselect() {
    const list = await this.prisma.sysDept.findMany({
      where: {
        delFlag: DelFlagEnum.NORMAL,
        status: StatusEnum.NORMAL,
      },
      orderBy: { orderNum: 'asc' },
    });
    return Result.ok(list);
  }

  /**
   * 部门树
   * @returns
   */
  @Cacheable(CacheEnum.SYS_DEPT_KEY, 'deptTree')
  async deptTree() {
    const res = await this.prisma.sysDept.findMany({
      where: {
        delFlag: DelFlagEnum.NORMAL,
      },
      orderBy: { orderNum: 'asc' },
    });
    const tree = ListToTree(
      res,
      (m) => m.deptId,
      (m) => m.deptName,
    );
    return tree;
  }

  /**
   * 获取指定部门及其所有子部门的ID列表
   * @param deptId 部门ID
   * @returns 部门ID数组
   */
  async getChildDeptIds(deptId: number): Promise<number[]> {
    const depts = await this.prisma.sysDept.findMany({
      where: {
        delFlag: DelFlagEnum.NORMAL,
        OR: [
          { deptId },
          { ancestors: { contains: `,${deptId}` } },
          { ancestors: { startsWith: `${deptId},` } },
          { ancestors: { contains: `,${deptId},` } },
        ],
      },
      select: { deptId: true },
    });
    return depts.map((d) => d.deptId);
  }
}
