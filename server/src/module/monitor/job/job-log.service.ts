import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { ListJobLogDto } from './dto/create-job.dto';
import { ResultData } from 'src/common/utils/result';
import { ExportTable } from 'src/common/utils/export';
import { FormatDateFields } from 'src/common/utils/index';
import { Response } from 'express';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class JobLogService {
  constructor(private readonly prisma: PrismaService) { }

  /**
   * 查询任务日志列表
   */
  async list(query: ListJobLogDto) {
    const where: Prisma.SysJobLogWhereInput = {};

    if (query.jobName) {
      where.jobName = { contains: query.jobName };
    }

    if (query.jobGroup) {
      where.jobGroup = query.jobGroup;
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

    const take = Number(query.pageSize ?? 10);
    const skip = take * (Number(query.pageNum ?? 1) - 1);

    const [list, total] = await this.prisma.$transaction([
      this.prisma.sysJobLog.findMany({
        where,
        skip,
        take,
        orderBy: { createTime: 'desc' },
      }),
      this.prisma.sysJobLog.count({ where }),
    ]);

    return ResultData.ok({
      rows: FormatDateFields(list),
      total,
    });
  }

  /**
   * 添加任务日志
   */
  async addJobLog(jobLog: Partial<Prisma.SysJobLogUncheckedCreateInput>) {
    await this.prisma.sysJobLog.create({ data: jobLog as Prisma.SysJobLogUncheckedCreateInput });
    return ResultData.ok();
  }

  /**
   * 清空日志
   */
  async clean() {
    await this.prisma.sysJobLog.deleteMany();
    return ResultData.ok();
  }

  /**
   * 导出调度日志为xlsx文件
   * @param res
   */
  async export(res: Response, body: ListJobLogDto) {
    delete body.pageNum;
    delete body.pageSize;
    const list = await this.list(body);
    const options = {
      sheetName: '调度日志',
      data: list.data.rows,
      header: [
        { title: '日志编号', dataIndex: 'jobLogId' },
        { title: '任务名称', dataIndex: 'jobName' },
        { title: '任务组名', dataIndex: 'jobGroup' },
        { title: '调用目标字符串', dataIndex: 'invokeTarget' },
        { title: '日志信息', dataIndex: 'jobMessage' },
        { title: '执行时间', dataIndex: 'createTime' },
      ],
      dictMap: {
        status: {
          '0': '成功',
          '1': '失败',
        },
        jobGroup: {
          SYSTEM: '系统',
          DEFAULT: '默认',
        },
      },
    };
    return await ExportTable(options, res);
  }
}
