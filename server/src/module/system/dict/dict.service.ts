import { Injectable } from '@nestjs/common';
import { Response } from 'express';
import { Prisma } from '@prisma/client';
import { ResultData } from 'src/common/utils/result';
import { CacheEnum } from 'src/common/enum/index';
import { ExportTable } from 'src/common/utils/export';
import { FormatDateFields } from 'src/common/utils/index';
import { CreateDictTypeDto, UpdateDictTypeDto, ListDictType, CreateDictDataDto, UpdateDictDataDto, ListDictData } from './dto/index';
import { RedisService } from 'src/module/common/redis/redis.service';
import { PrismaService } from 'src/prisma/prisma.service';
@Injectable()
export class DictService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redisService: RedisService,
  ) { }
  async createType(CreateDictTypeDto: CreateDictTypeDto) {
    await this.prisma.sysDictType.create({ data: CreateDictTypeDto });
    return ResultData.ok();
  }

  async deleteType(dictIds: number[]) {
    await this.prisma.sysDictType.updateMany({
      where: {
        dictId: {
          in: dictIds,
        },
      },
      data: { delFlag: '1' },
    });
    return ResultData.ok();
  }

  async updateType(updateDictTypeDto: UpdateDictTypeDto) {
    await this.prisma.sysDictType.update({
      where: { dictId: updateDictTypeDto.dictId },
      data: updateDictTypeDto,
    });
    return ResultData.ok();
  }

  async findAllType(query: ListDictType) {
    const where: Prisma.SysDictTypeWhereInput = {
      delFlag: '0',
    };

    if (query.dictName) {
      where.dictName = {
        contains: query.dictName,
      };
    }

    if (query.dictType) {
      where.dictType = {
        contains: query.dictType,
      };
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
      this.prisma.sysDictType.findMany({
        where,
        skip: pageSize * (pageNum - 1),
        take: pageSize,
        orderBy: { createTime: 'desc' },
      }),
      this.prisma.sysDictType.count({ where }),
    ]);

    return ResultData.ok({
      rows: FormatDateFields(list),
      total,
    });
  }

  async findOneType(dictId: number) {
    const data = await this.prisma.sysDictType.findUnique({
      where: {
        dictId,
      },
      select: {
        dictId: true,
        dictName: true,
        dictType: true,
        status: true,
        remark: true,
        createTime: true,
      },
    });
    return ResultData.ok(data);
  }

  async findOptionselect() {
    const data = await this.prisma.sysDictType.findMany({
      where: {
        delFlag: '0',
      },
      orderBy: { dictId: 'asc' },
    });
    return ResultData.ok(data);
  }

  // 字典数据
  async createDictData(createDictDataDto: CreateDictDataDto) {
    await this.prisma.sysDictData.create({
      data: {
        ...createDictDataDto,
        dictSort: createDictDataDto.dictSort ?? 0,
        status: createDictDataDto.status ?? '0',
        isDefault: 'N',
        createBy: '',
        updateBy: '',
        delFlag: '0',
      },
    });
    return ResultData.ok();
  }

  async deleteDictData(dictIds: number[]) {
    await this.prisma.sysDictData.updateMany({
      where: {
        dictCode: {
          in: dictIds,
        },
      },
      data: { delFlag: '1' },
    });
    return ResultData.ok();
  }

  async updateDictData(updateDictDataDto: UpdateDictDataDto) {
    await this.prisma.sysDictData.update({
      where: { dictCode: updateDictDataDto.dictCode },
      data: updateDictDataDto,
    });
    return ResultData.ok();
  }

  async findAllData(query: ListDictData) {
    const where: Prisma.SysDictDataWhereInput = {
      delFlag: '0',
    };

    if (query.dictLabel) {
      where.dictLabel = {
        contains: query.dictLabel,
      };
    }

    if (query.dictType) {
      where.dictType = query.dictType;
    }

    if (query.status) {
      where.status = query.status;
    }

    const pageSize = Number(query.pageSize ?? 10);
    const pageNum = Number(query.pageNum ?? 1);

    const [list, total] = await this.prisma.$transaction([
      this.prisma.sysDictData.findMany({
        where,
        skip: pageSize * (pageNum - 1),
        take: pageSize,
        orderBy: { dictSort: 'asc' },
      }),
      this.prisma.sysDictData.count({ where }),
    ]);

    return ResultData.ok({
      rows: FormatDateFields(list),
      total,
    });
  }

  /**
   * 根据字典类型查询一个数据类型的信息。
   *
   * @param dictType 字典类型字符串。
   * @returns 返回查询到的数据类型信息，如果未查询到则返回空。
   */
  async findOneDataType(dictType: string) {
    // 尝试从Redis缓存中获取字典数据
    let data = await this.redisService.get(`${CacheEnum.SYS_DICT_KEY}${dictType}`);

    if (data) {
      // 如果缓存中存在，则直接返回缓存数据
      return ResultData.ok(data);
    }

    // 从数据库中查询字典数据
    data = await this.prisma.sysDictData.findMany({
      where: {
        dictType,
        delFlag: '0',
      },
      orderBy: { dictSort: 'asc' },
    });

    // 将查询到的数据存入Redis缓存，并返回数据
    await this.redisService.set(`${CacheEnum.SYS_DICT_KEY}${dictType}`, data);
    return ResultData.ok(data);
  }

  async findOneDictData(dictCode: number) {
    const data = await this.prisma.sysDictData.findUnique({
      where: {
        dictCode,
      },
    });
    return ResultData.ok(data);
  }

  /**
   * 导出字典数据为xlsx文件
   * @param res
   */
  async export(res: Response, body: ListDictType) {
    delete body.pageNum;
    delete body.pageSize;
    const list = await this.findAllType(body);
    const options = {
      sheetName: '字典数据',
      data: list.data.rows,
      header: [
        { title: '字典主键', dataIndex: 'dictId' },
        { title: '字典名称', dataIndex: 'dictName' },
        { title: '字典类型', dataIndex: 'dictType' },
        { title: '状态', dataIndex: 'status' },
      ],
    };
    return await ExportTable(options, res);
  }

  /**
   * 导出字典数据为xlsx文件
   * @param res
   */
  async exportData(res: Response, body: ListDictType) {
    delete body.pageNum;
    delete body.pageSize;
    const list = await this.findAllData(body);
    const options = {
      sheetName: '字典数据',
      data: list.data.rows,
      header: [
        { title: '字典主键', dataIndex: 'dictCode' },
        { title: '字典名称', dataIndex: 'dictLabel' },
        { title: '字典类型', dataIndex: 'dictValue' },
        { title: '备注', dataIndex: 'remark' },
      ],
    };
    return await ExportTable(options, res);
  }

  /**
   * 刷新字典缓存
   * @returns
   */
  async resetDictCache() {
    await this.clearDictCache();
    await this.loadingDictCache();
    return ResultData.ok();
  }

  /**
   * 删除字典缓存
   * @returns
   */
  async clearDictCache() {
    const keys = await this.redisService.keys(`${CacheEnum.SYS_DICT_KEY}*`);
    if (keys && keys.length > 0) {
      await this.redisService.del(keys);
    }
  }

  /**
   * 加载字典缓存
   * @returns
   */
  async loadingDictCache() {
    const dictData = await this.prisma.sysDictData.findMany({
      where: {
        delFlag: '0',
      },
      orderBy: [{ dictType: 'asc' }, { dictSort: 'asc' }],
    });

    const grouped = dictData.reduce<Record<string, typeof dictData>>(
      (acc, item) => {
        if (!acc[item.dictType]) {
          acc[item.dictType] = [];
        }
        acc[item.dictType].push(item);
        return acc;
      },
      {} as Record<string, typeof dictData>,
    );

    await Promise.all(Object.entries(grouped).map(([dictType, items]) => this.redisService.set(`${CacheEnum.SYS_DICT_KEY}${dictType}`, items)));
  }
}
