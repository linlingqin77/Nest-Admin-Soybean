import { Injectable } from '@nestjs/common';
import { Response } from 'express';
import { Prisma } from '@prisma/client';
import { ResponseCode, Result } from 'src/shared/response';
import { BusinessException } from 'src/shared/exceptions';
import { CacheEnum, DelFlagEnum } from 'src/shared/enums/index';
import { Cacheable } from 'src/core/auth/decorators/redis.decorator';
import { ExportTable } from 'src/shared/utils/export';
import { toDto, toDtoList } from 'src/shared/utils/serialize.util';
import {
  CreateDictDataRequestDto,
  CreateDictTypeRequestDto,
  DictDataResponseDto,
  DictTypeResponseDto,
  ListDictDataRequestDto,
  ListDictTypeRequestDto,
  UpdateDictDataRequestDto,
  UpdateDictTypeRequestDto,
} from './dto/index';
import { RedisService } from 'src/platform/redis/redis.service';
import { DictDataRepository, DictTypeRepository } from './dict.repository';
import { InjectTransactionHost, PrismaTransactionHost } from 'src/core/http/decorators/transactional.decorator';

@Injectable()
export class DictService {
  constructor(
    @InjectTransactionHost() private readonly txHost: PrismaTransactionHost,
    private readonly redisService: RedisService,
    private readonly dictTypeRepo: DictTypeRepository,
    private readonly dictDataRepo: DictDataRepository,
  ) {}
  private get prisma() {
    return this.txHost.tx;
  }
  async createType(createDictTypeDto: CreateDictTypeRequestDto) {
    await this.dictTypeRepo.create(createDictTypeDto);
    return Result.ok();
  }

  async deleteType(dictIds: number[]) {
    await this.dictTypeRepo.softDeleteBatch(dictIds);
    return Result.ok();
  }

  async updateType(updateDictTypeDto: UpdateDictTypeRequestDto) {
    await this.dictTypeRepo.update(updateDictTypeDto.dictId, updateDictTypeDto);
    return Result.ok();
  }

  async findAllType(query: ListDictTypeRequestDto) {
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

    const { list, total } = await this.dictTypeRepo.findPageWithFilter(where, query.skip, query.take);

    return Result.page(toDtoList(DictTypeResponseDto, list), total, query.pageNum, query.pageSize);
  }

  async findOneType(dictId: number) {
    const data = await this.dictTypeRepo.findById(dictId);
    BusinessException.throwIfNull(data, '字典类型不存在', ResponseCode.DATA_NOT_FOUND);
    return Result.ok(toDto(DictTypeResponseDto, data));
  }

  async findOptionselect() {
    const data = await this.dictTypeRepo.findAllForSelect();
    return Result.ok(toDtoList(DictTypeResponseDto, data));
  }

  // 字典数据
  async createDictData(createDictDataDto: CreateDictDataRequestDto) {
    await this.dictDataRepo.create({
      ...createDictDataDto,
      dictSort: createDictDataDto.dictSort ?? 0,
      status: createDictDataDto.status ?? '0',
      isDefault: 'N',
      delFlag: '0',
    });
    return Result.ok();
  }

  async deleteDictData(dictIds: number[]) {
    await this.dictDataRepo.softDeleteBatch(dictIds);
    return Result.ok();
  }

  async updateDictData(updateDictDataDto: UpdateDictDataRequestDto) {
    await this.dictDataRepo.update(updateDictDataDto.dictCode, updateDictDataDto);
    return Result.ok();
  }

  async findAllData(query: ListDictDataRequestDto) {
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

    const { list, total } = await this.dictDataRepo.findPageWithFilter(where, query.skip, query.take);

    return Result.page(toDtoList(DictDataResponseDto, list), total, query.pageNum, query.pageSize);
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
      // 如果缓存中存在，则直接返回缓存数据（已序列化）
      return Result.ok(toDtoList(DictDataResponseDto, data as object[]));
    }

    // 从数据库中查询字典数据
    data = await this.dictDataRepo.findByDictType(dictType);

    // 将查询到的数据存入Redis缓存，并返回数据
    await this.redisService.set(`${CacheEnum.SYS_DICT_KEY}${dictType}`, data);
    return Result.ok(toDtoList(DictDataResponseDto, data));
  }

  async findOneDictData(dictCode: number) {
    const data = await this.dictDataRepo.findById(dictCode);
    BusinessException.throwIfNull(data, '字典数据不存在', ResponseCode.DATA_NOT_FOUND);
    return Result.ok(toDto(DictDataResponseDto, data));
  }

  /**
   * 导出字典数据为xlsx文件
   * @param res
   */
  async export(res: Response, body: ListDictTypeRequestDto) {
    delete body.pageNum;
    delete body.pageSize;
    const list = await this.findAllType(body);
    const options = {
      sheetName: '字典数据',
      data: ((list.data as { rows?: unknown[] })?.rows ?? []) as unknown as Record<string, unknown>[],
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
  async exportData(res: Response, body: ListDictTypeRequestDto) {
    delete body.pageNum;
    delete body.pageSize;
    const list = await this.findAllData(body);
    const options = {
      sheetName: '字典数据',
      data: ((list.data as { rows?: unknown[] })?.rows ?? []) as unknown as Record<string, unknown>[],
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

    await Promise.all(
      Object.entries(grouped).map(([dictType, items]) =>
        this.redisService.set(`${CacheEnum.SYS_DICT_KEY}${dictType}`, items),
      ),
    );
  }
}
