import { Injectable, Inject, Scope } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { Prisma } from '@prisma/client';
import { Request, Response } from 'express';
import { Result } from 'src/common/response';
import { FormatDateFields } from 'src/common/utils/index';
import { AxiosService } from 'src/module/common/axios/axios.service';
import { QueryOperLogDto } from './dto/operLog.dto';
import { ExportTable } from 'src/common/utils/export';
import { DictService } from 'src/module/system/dict/dict.service';
import { isEmpty } from 'src/common/utils';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable({ scope: Scope.REQUEST })
export class OperlogService {
  constructor(
    @Inject(REQUEST)
    private readonly request: Request & { user: any },
    private readonly prisma: PrismaService,
    private readonly axiosService: AxiosService,
    @Inject(DictService)
    private readonly dictService: DictService,
  ) {}

  async findAll(query: QueryOperLogDto) {
    const where: Prisma.SysOperLogWhereInput = {};

    if (!isEmpty(query.operId)) {
      where.operId = Number(query.operId);
    }
    if (!isEmpty(query.title)) {
      where.title = query.title;
    }
    if (!isEmpty(query.businessType)) {
      where.businessType = Number(query.businessType);
    }
    if (!isEmpty(query.requestMethod)) {
      where.requestMethod = query.requestMethod;
    }
    if (!isEmpty(query.operatorType)) {
      where.operatorType = Number(query.operatorType);
    }
    if (!isEmpty(query.operName)) {
      where.operName = { contains: query.operName };
    }
    if (!isEmpty(query.deptName)) {
      where.deptName = { contains: query.deptName };
    }
    if (!isEmpty(query.operUrl)) {
      where.operUrl = query.operUrl;
    }
    if (!isEmpty(query.operLocation)) {
      where.operLocation = query.operLocation;
    }
    if (!isEmpty(query.operParam)) {
      where.operParam = query.operParam;
    }
    if (!isEmpty(query.jsonResult)) {
      where.jsonResult = query.jsonResult;
    }
    if (!isEmpty(query.errorMsg)) {
      where.errorMsg = query.errorMsg;
    }
    if (!isEmpty(query.method)) {
      where.method = query.method;
    }
    if (!isEmpty(query.operIp)) {
      where.operIp = query.operIp;
    }
    if (!isEmpty(query.params?.beginTime) && !isEmpty(query.params?.endTime)) {
      where.operTime = {
        gte: new Date(query.params.beginTime),
        lte: new Date(query.params.endTime),
      };
    }
    if (!isEmpty(query.status)) {
      where.status = query.status;
    }

    const orderBy =
      query.orderByColumn && query.isAsc
        ? ({
            [query.orderByColumn]: query.isAsc === 'asc' ? 'asc' : 'desc',
          } as Prisma.SysOperLogOrderByWithRelationInput)
        : undefined;

    const findManyArgs: Prisma.SysOperLogFindManyArgs = {
      where,
    };

    if (orderBy) {
      findManyArgs.orderBy = orderBy;
    }

    if (!isEmpty(query.pageNum) && !isEmpty(query.pageSize)) {
      findManyArgs.skip = query.skip;
      findManyArgs.take = query.take;
    }

    const [list, total] = await this.prisma.$transaction([
      this.prisma.sysOperLog.findMany(findManyArgs),
      this.prisma.sysOperLog.count({ where }),
    ]);

    return Result.page(FormatDateFields(list), total);
  }

  async findOne(id: number) {
    const res = await this.prisma.sysOperLog.findUnique({
      where: {
        operId: Number(id),
      },
    });
    return Result.ok(res);
  }

  async removeAll() {
    await this.prisma.sysOperLog.deleteMany();
    return Result.ok();
  }

  async remove(operId: number) {
    await this.prisma.sysOperLog.deleteMany({
      where: {
        operId: Number(operId),
      },
    });
    return Result.ok();
  }

  /**
   * @description: 录入日志
   */
  async logAction({
    resultData,
    costTime,
    title,
    handlerName,
    errorMsg,
    businessType,
  }: {
    resultData?: any;
    costTime: number;
    title: string;
    handlerName: string;
    errorMsg?: string;
    businessType?: number;
  }) {
    const { originalUrl, method, ip, body, query } = this.request;
    const loginUser = this.request.user?.user ?? {};
    const operLocation = await this.axiosService.getIpAddress(ip);

    const safeStringify = (payload: any) => {
      try {
        const result = JSON.stringify(payload);
        return result ?? '';
      } catch (_error) {
        return '';
      }
    };

    const params = {
      title,
      method: handlerName,
      operName: loginUser.nickName || loginUser.userName || '',
      deptName: loginUser.deptName || '',
      operUrl: originalUrl,
      requestMethod: typeof method === 'string' ? method.toUpperCase() : '',
      operIp: ip,
      costTime: costTime,
      operLocation: operLocation,
      operParam: safeStringify({ ...body, ...query }),
      jsonResult: safeStringify(resultData),
      errorMsg: errorMsg || '',
      businessType: businessType ?? 0,
      operatorType: 1,
      operTime: new Date(),
      status: errorMsg ? '1' : '0',
    };

    // 确保errorMsg是字符串类型
    if (typeof params.errorMsg === 'object') {
      params.errorMsg = JSON.stringify(params.errorMsg);
    }

    await this.prisma.sysOperLog.create({
      data: params,
    });
  }

  /**
   * 导出操作日志数据为xlsx
   * @param res
   */
  async export(res: Response, body: QueryOperLogDto) {
    delete body.pageNum;
    delete body.pageSize;
    const list = await this.findAll(body);
    const { data: operatorTypeDict } = await this.dictService.findOneDataType('sys_oper_type');
    const operatorTypeDictMap = {};
    operatorTypeDict.forEach((item) => {
      operatorTypeDictMap[item.dictValue] = item.dictLabel;
    });
    const options = {
      sheetName: '操作日志数据',
      data: list.data.rows,
      header: [
        { title: '日志编号', dataIndex: 'operId' },
        { title: '系统模块', dataIndex: 'title', width: 15 },
        { title: '操作类型', dataIndex: 'businessType' },
        { title: '操作人员', dataIndex: 'operName' },
        { title: '主机', dataIndex: 'operIp' },
        { title: '操作状态', dataIndex: 'status' },
        { title: '操作时间', dataIndex: 'operTime', width: 15 },
        {
          title: '消耗时间',
          dataIndex: 'costTime',
          formateStr(value) {
            return value + 'ms';
          },
        },
      ],
      dictMap: {
        status: {
          '0': '成功',
          '1': '失败',
        },
        businessType: operatorTypeDictMap,
      },
    };
    return await ExportTable(options, res);
  }
}
