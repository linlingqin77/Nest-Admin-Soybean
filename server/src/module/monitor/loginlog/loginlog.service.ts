import { Injectable } from '@nestjs/common';
import { Response } from 'express';
import { Prisma } from '@prisma/client';
import { ResultData } from 'src/common/utils/result';
import { ExportTable } from 'src/common/utils/export';
import { FormatDateFields } from 'src/common/utils/index';
import { CreateLoginlogDto, ListLoginlogDto } from './dto/index';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class LoginlogService {
  constructor(private readonly prisma: PrismaService) { }

  /**
   * 创建用户登录日志
   * @param createLoginlogDto
   * @returns
   */
  async create(createLoginlogDto: CreateLoginlogDto) {
    return await this.prisma.sysLogininfor.create({
      data: {
        ...createLoginlogDto,
        userName: createLoginlogDto.userName ?? '',
        ipaddr: createLoginlogDto.ipaddr ?? '',
        loginLocation: createLoginlogDto.loginLocation ?? '',
        browser: createLoginlogDto.browser ?? '',
        os: createLoginlogDto.os ?? '',
        msg: createLoginlogDto.msg ?? '',
        status: createLoginlogDto.status ?? '0',
        delFlag: '0',
      },
    });
  }

  /**
   * 日志列表-分页
   * @param query
   * @returns
   */
  async findAll(query: ListLoginlogDto) {
    const where: Prisma.SysLogininforWhereInput = {
      delFlag: '0',
    };

    if (query.ipaddr) {
      where.ipaddr = {
        contains: query.ipaddr,
      };
    }

    if (query.userName) {
      where.userName = {
        contains: query.userName,
      };
    }

    if (query.status) {
      where.status = query.status;
    }

    if (query.params?.beginTime && query.params?.endTime) {
      where.loginTime = {
        gte: new Date(query.params.beginTime),
        lte: new Date(query.params.endTime),
      };
    }

    const sortOrder: Prisma.SortOrder = query.isAsc === 'ascending' ? 'asc' : 'desc';
    const orderBy: Prisma.SysLogininforOrderByWithRelationInput = query.orderByColumn
      ? ({
        [query.orderByColumn]: sortOrder,
      } as Prisma.SysLogininforOrderByWithRelationInput)
      : { loginTime: 'desc' };

    const pageSize = Number(query.pageSize ?? 10);
    const pageNum = Number(query.pageNum ?? 1);

    const [list, total] = await this.prisma.$transaction([
      this.prisma.sysLogininfor.findMany({
        where,
        skip: pageSize * (pageNum - 1),
        take: pageSize,
        orderBy,
      }),
      this.prisma.sysLogininfor.count({ where }),
    ]);

    return ResultData.ok({
      rows: FormatDateFields(list),
      total,
    });
  }

  /**
   * 删除日志
   * @returns
   */
  async remove(ids: string[]) {
    const data = await this.prisma.sysLogininfor.updateMany({
      where: {
        infoId: {
          in: ids.map((id) => Number(id)),
        },
      },
      data: {
        delFlag: '1',
      },
    });
    return ResultData.ok(data.count);
  }

  /**
   * 删除全部日志
   * @returns
   */
  async removeAll() {
    await this.prisma.sysLogininfor.updateMany({
      data: {
        delFlag: '1',
      },
    });
    return ResultData.ok();
  }

  /**
   * 解锁用户
   * @param username 用户名
   */
  async unlock(username: string) {
    // 这里可以根据实际需求清除用户的锁定状态，比如从 Redis 中删除锁定信息
    // 目前简单返回成功
    return ResultData.ok();
  }

  /**
   * 导出登录日志数据为xlsx
   * @param res
   */
  async export(res: Response, body: ListLoginlogDto) {
    delete body.pageNum;
    delete body.pageSize;
    const list = await this.findAll(body);
    const options = {
      sheetName: '登录日志',
      data: list.data.rows,
      header: [
        { title: '序号', dataIndex: 'infoId' },
        { title: '用户账号', dataIndex: 'userName' },
        { title: '登录状态', dataIndex: 'status' },
        { title: '登录地址', dataIndex: 'ipaddr' },
        { title: '登录地点', dataIndex: 'loginLocation' },
        { title: '浏览器', dataIndex: 'browser' },
        { title: '操作系统', dataIndex: 'os' },
        { title: '提示消息', dataIndex: 'msg' },
        { title: '访问时间', dataIndex: 'loginTime' },
      ],
      dictMap: {
        status: {
          '0': '成功',
          '1': '失败',
        },
      },
    };
    return await ExportTable(options, res);
  }
}
