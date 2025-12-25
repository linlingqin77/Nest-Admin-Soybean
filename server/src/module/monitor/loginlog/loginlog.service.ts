import { Injectable } from '@nestjs/common';
import { Response } from 'express';
import { Prisma } from '@prisma/client';
import { Result } from 'src/common/response';
import { DelFlagEnum } from 'src/common/enum/index';
import { ExportTable } from 'src/common/utils/export';
import { FormatDateFields } from 'src/common/utils/index';
import { CreateLoginlogDto, ListLoginlogDto } from './dto/index';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class LoginlogService {
  constructor(private readonly prisma: PrismaService) {}

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
        delFlag: DelFlagEnum.NORMAL,
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
      delFlag: DelFlagEnum.NORMAL,
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

    // 使用 getDateRange 便捷方法
    const dateRange = query.getDateRange?.('loginTime');
    if (dateRange) {
      Object.assign(where, dateRange);
    }

    // 使用 getOrderBy 便捷方法
    const orderBy = query.getOrderBy?.('loginTime') || { loginTime: 'desc' };

    const [list, total] = await this.prisma.$transaction([
      this.prisma.sysLogininfor.findMany({
        where,
        skip: query.skip,
        take: query.take,
        orderBy,
      }),
      this.prisma.sysLogininfor.count({ where }),
    ]);

    // 使用 Result.page 便捷方法
    return Result.page(FormatDateFields(list), total, query.pageNum, query.pageSize);
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
    return Result.ok(data.count);
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
    return Result.ok();
  }

  /**
   * 解锁用户
   * @param username 用户名
   */
  async unlock(username: string) {
    // 这里可以根据实际需求清除用户的锁定状态，比如从 Redis 中删除锁定信息
    // 目前简单返回成功
    return Result.ok();
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
