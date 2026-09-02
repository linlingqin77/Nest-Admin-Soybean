import { Injectable } from '@nestjs/common';
import { StructuredLoggerService } from 'src/platform/logger/structured-logger.service';
import { Prisma } from '@prisma/client';
import { ResponseCode, Result } from 'src/shared/response';
import { BusinessException, BusinessExceptionData } from 'src/shared/exceptions';
import { CreateDeptDto, ListDeptDto, UpdateDeptDto } from './dto/index';
import { DeptResponseDto } from './dto/responses/dept.response.dto';
import { ListToTree } from 'src/shared/utils/index';
import { toDto, toDtoList } from 'src/shared/utils/serialize.util';
import { CacheEnum, DataScopeEnum, DelFlagEnum, StatusEnum } from 'src/shared/enums/index';
import { Cacheable, CacheEvict } from 'src/core/auth/decorators/redis.decorator';
import { DeptRepository } from './dept.repository';
import {
  InjectTransactionHost,
  PrismaTransactionHost,
  Transactional,
} from 'src/core/http/decorators/transactional.decorator';

@Injectable()
export class DeptService {
  constructor(
    @InjectTransactionHost() private readonly txHost: PrismaTransactionHost,
    private readonly deptRepo: DeptRepository,
    private readonly logger: StructuredLoggerService,
  ) {
    this.logger.setContext(DeptService.name);
  }
  private get prisma() {
    return this.txHost.tx;
  }

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
      BusinessException.throwIfNull(parent, '父级部门不存在', ResponseCode.DATA_NOT_FOUND);
      ancestors = parent.ancestors ? `${parent.ancestors},${createDeptDto.parentId}` : `${createDeptDto.parentId}`;
    }
    const payload: Prisma.SysDeptUncheckedCreateInput = {
      ...createDeptDto,
      ancestors,
      leader: createDeptDto.leader ?? '',
      phone: createDeptDto.phone ?? '',
      email: createDeptDto.email ?? '',
      status: createDeptDto.status ?? '0',
      delFlag: '0',
      remark: null,
    };
    await this.deptRepo.create(payload);
    return Result.ok();
  }

  async findAll(query: ListDeptDto) {
    const where: Prisma.SysDeptWhereInput = {
      delFlag: '0',
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
    return Result.ok(toDtoList(DeptResponseDto, res));
  }

  @Cacheable(CacheEnum.SYS_DEPT_KEY, 'findOne:{0}')
  async findOne(deptId: number) {
    const data = await this.deptRepo.findById(deptId);
    BusinessException.throwIfNull(data, '部门不存在', ResponseCode.DATA_NOT_FOUND);
    return Result.ok(toDto(DeptResponseDto, data));
  }

  /**
   * 根据数据权限范围和部门ID查询部门ID列表。
   * @param deptId 部门ID，表示需要查询的部门。
   * @param dataScope 数据权限范围，决定查询的部门范围。
   * @returns 返回一个部门ID数组，根据数据权限范围决定返回的部门ID集合。
   */
  @Cacheable(CacheEnum.SYS_DEPT_KEY, 'findDeptIdsByDataScope:{0}-{1}')
  async findDeptIdsByDataScope(deptId: number, dataScope: DataScopeEnum) {
    try {
      if (dataScope === DataScopeEnum.DATA_SCOPE_SELF) {
        return [];
      }

      const where: Prisma.SysDeptWhereInput = {
        delFlag: '0',
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
      this.logger.error('Failed to query department IDs', { action: 'dept.findDeptIdsByDataScope' });
      BusinessException.throw(ResponseCode.INTERNAL_SERVER_ERROR, '查询部门ID失败', error as BusinessExceptionData);
    }
  }

  @Cacheable(CacheEnum.SYS_DEPT_KEY, 'findListExclude')
  async findListExclude(id: number) {
    // 排除 ancestors 中包含指定 id 的部门（排除子部门）
    const data = await this.prisma.sysDept.findMany({
      where: {
        delFlag: '0',
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
    return Result.ok(toDtoList(DeptResponseDto, data));
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
      BusinessException.throwIfNull(parent, '父级部门不存在', ResponseCode.DATA_NOT_FOUND);
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
        delFlag: '0',
        status: StatusEnum.NORMAL,
      },
      orderBy: { orderNum: 'asc' },
    });
    return Result.ok(toDtoList(DeptResponseDto, list));
  }

  /**
   * 部门树
   * @returns
   */
  @Cacheable(CacheEnum.SYS_DEPT_KEY, 'deptTree')
  async deptTree() {
    const res = await this.prisma.sysDept.findMany({
      where: {
        delFlag: '0',
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
        delFlag: '0',
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
