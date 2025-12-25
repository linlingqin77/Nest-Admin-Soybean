import { Injectable } from '@nestjs/common';
import { Response } from 'express';
import { Prisma } from '@prisma/client';
import { Result } from 'src/common/response';
import { CacheEnum, DelFlagEnum } from 'src/common/enum/index';
import { Cacheable } from 'src/common/decorators/redis.decorator';
import { ExportTable } from 'src/common/utils/export';
import { FormatDateFields } from 'src/common/utils/index';
import {
  CreateDictTypeDto,
  UpdateDictTypeDto,
  ListDictType,
  CreateDictDataDto,
  UpdateDictDataDto,
  ListDictData,
} from './dto/index';
import { RedisService } from 'src/module/common/redis/redis.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { DictTypeRepository, DictDataRepository } from './dict.repository';

@Injectable()
export class DictService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redisService: RedisService,
    private readonly dictTypeRepo: DictTypeRepository,
    private readonly dictDataRepo: DictDataRepository,
  ) {}
  async createType(CreateDictTypeDto: CreateDictTypeDto) {
    await this.dictTypeRepo.create(CreateDictTypeDto);
    return Result.ok();
  }

  async deleteType(dictIds: number[]) {
    await this.dictTypeRepo.softDeleteBatch(dictIds);
    return Result.ok();
  }

  async updateType(updateDictTypeDto: UpdateDictTypeDto) {
    await this.dictTypeRepo.update(updateDictTypeDto.dictId, updateDictTypeDto);
    return Result.ok();
  }

  async findAllType(query: ListDictType) {
    const where: Prisma.SysDictTypeWhereInput = {
      delFlag: DelFlagEnum.NORMAL,
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

    const { list, total } = await this.dictTypeRepo.findPageWithFilter(where, query.skip, query.take);

    return Result.ok({
      rows: FormatDateFields(list),
      total,
    });
  }

  async findOneType(dictId: number) {
    const data = await this.dictTypeRepo.findById(dictId);
    return Result.ok(data);
  }

  async findOptionselect() {
    const data = await this.dictTypeRepo.findAllForSelect();
    return Result.ok(data);
  }

  // 字典数据
  async createDictData(createDictDataDto: CreateDictDataDto) {
    await this.dictDataRepo.create({
      ...createDictDataDto,
      dictSort: createDictDataDto.dictSort ?? 0,
      status: createDictDataDto.status ?? '0',
      isDefault: 'N',
      delFlag: DelFlagEnum.NORMAL,
    });
    return Result.ok();
  }

  async deleteDictData(dictIds: number[]) {
    await this.dictDataRepo.softDeleteBatch(dictIds);
    return Result.ok();
  }

  async updateDictData(updateDictDataDto: UpdateDictDataDto) {
    await this.dictDataRepo.update(updateDictDataDto.dictCode, updateDictDataDto);
    return Result.ok();
  }

  async findAllData(query: ListDictData) {
    const where: Prisma.SysDictDataWhereInput = {
      delFlag: DelFlagEnum.NORMAL,
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

    const { list, total } = await this.dictDataRepo.findPageWithFilter(where, query.skip, query.take);

    return Result.ok({
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
      return Result.ok(data);
    }

    // 从数据库中查询字典数据
    data = await this.dictDataRepo.findByDictType(dictType);

    // 将查询到的数据存入Redis缓存，并返回数据
    await this.redisService.set(`${CacheEnum.SYS_DICT_KEY}${dictType}`, data);
    return Result.ok(data);
  }

  async findOneDictData(dictCode: number) {
    const data = await this.dictDataRepo.findById(dictCode);
    return Result.ok(data);
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
    return Result.ok();
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
  @Cacheable(CacheEnum.SYS_DICT_KEY, 'all')
  async loadingDictCache() {
    const dictData = await this.prisma.sysDictData.findMany({
      where: {
        delFlag: DelFlagEnum.NORMAL,
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

    await Promise.all(
      Object.entries(grouped).map(([dictType, items]) =>
        this.redisService.set(`${CacheEnum.SYS_DICT_KEY}${dictType}`, items),
      ),
    );
  }
}
