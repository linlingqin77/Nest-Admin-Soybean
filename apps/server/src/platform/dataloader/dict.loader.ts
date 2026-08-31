import { Injectable, Scope } from '@nestjs/common';
import { SysDictType, SysDictData } from '@prisma/client';
import { PrismaService } from 'src/platform/prisma';
import { BaseLoader } from './base.loader';
import { DelFlagEnum } from 'src/shared/enums';

/**
 * 字典类型数据加载器
 *
 * @description 批量加载字典类型数据，解决 N+1 查询问题
 * 在同一请求周期内，多次调用 load() 会被合并为一次批量查询
 *
 * @example
 * ```typescript
 * // 在 Service 中注入使用
 * constructor(private readonly dictTypeLoader: DictTypeLoader) {}
 *
 * async getDictTypesByIds(dictIds: number[]) {
 *   // 这些调用会被合并为一次数据库查询
 *   const dictTypes = await Promise.all(
 *     dictIds.map(id => this.dictTypeLoader.load(id))
 *   );
 *   return dictTypes;
 * }
 * ```
 */
@Injectable({ scope: Scope.REQUEST })
export class DictTypeLoader extends BaseLoader<number, SysDictType> {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  /**
   * 批量加载字典类型数据
   *
   * @param dictIds - 字典类型 ID 数组
   * @returns 与 dictIds 顺序对应的字典类型数组
   */
  protected async batchLoad(dictIds: readonly number[]): Promise<(SysDictType | null)[]> {
    const dictTypes = await this.prisma.sysDictType.findMany({
      where: {
        dictId: { in: [...dictIds] },
        delFlag: DelFlagEnum.NORMAL,
      },
    });

    // 创建 ID 到字典类型的映射
    const dictMap = new Map<number, SysDictType>(dictTypes.map((dict) => [dict.dictId, dict]));

    // 按照输入顺序返回结果
    return dictIds.map((id) => dictMap.get(id) ?? null);
  }

  /**
   * 按字典类型编码批量加载字典类型
   *
   * @param dictTypes - 字典类型编码数组
   * @returns 字典类型编码到字典类型的映射
   */
  async loadByDictTypes(dictTypes: string[]): Promise<Map<string, SysDictType>> {
    const types = await this.prisma.sysDictType.findMany({
      where: {
        dictType: { in: dictTypes },
        delFlag: DelFlagEnum.NORMAL,
      },
    });

    const result = new Map<string, SysDictType>();
    for (const type of types) {
      result.set(type.dictType, type);
    }

    return result;
  }

  /**
   * 批量加载字典类型的字典数据
   *
   * @param dictTypes - 字典类型编码数组
   * @returns 字典类型编码到字典数据数组的映射
   */
  async loadDictDataByTypes(dictTypes: string[]): Promise<Map<string, SysDictData[]>> {
    const dictData = await this.prisma.sysDictData.findMany({
      where: {
        dictType: { in: dictTypes },
        delFlag: DelFlagEnum.NORMAL,
      },
      orderBy: { dictSort: 'asc' },
    });

    // 按字典类型分组
    const result = new Map<string, SysDictData[]>();
    for (const type of dictTypes) {
      result.set(type, []);
    }
    for (const data of dictData) {
      const list = result.get(data.dictType);
      if (list) {
        list.push(data);
      }
    }

    return result;
  }
}

/**
 * 字典数据加载器
 *
 * @description 批量加载字典数据，解决 N+1 查询问题
 * 在同一请求周期内，多次调用 load() 会被合并为一次批量查询
 *
 * @example
 * ```typescript
 * // 在 Service 中注入使用
 * constructor(private readonly dictDataLoader: DictDataLoader) {}
 *
 * async getDictDataByIds(dictCodes: number[]) {
 *   // 这些调用会被合并为一次数据库查询
 *   const dictData = await Promise.all(
 *     dictCodes.map(code => this.dictDataLoader.load(code))
 *   );
 *   return dictData;
 * }
 * ```
 */
@Injectable({ scope: Scope.REQUEST })
export class DictDataLoader extends BaseLoader<number, SysDictData> {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  /**
   * 批量加载字典数据
   *
   * @param dictCodes - 字典数据编码数组
   * @returns 与 dictCodes 顺序对应的字典数据数组
   */
  protected async batchLoad(dictCodes: readonly number[]): Promise<(SysDictData | null)[]> {
    const dictData = await this.prisma.sysDictData.findMany({
      where: {
        dictCode: { in: [...dictCodes] },
        delFlag: DelFlagEnum.NORMAL,
      },
    });

    // 创建编码到字典数据的映射
    const dictMap = new Map<number, SysDictData>(dictData.map((data) => [data.dictCode, data]));

    // 按照输入顺序返回结果
    return dictCodes.map((code) => dictMap.get(code) ?? null);
  }

  /**
   * 按字典类型和值批量加载字典数据
   *
   * @param typeValuePairs - 字典类型和值的组合数组 [{type, value}]
   * @returns 组合键到字典数据的映射
   */
  async loadByTypeAndValue(typeValuePairs: Array<{ type: string; value: string }>): Promise<Map<string, SysDictData>> {
    // 按类型分组
    const typeGroups = new Map<string, string[]>();
    for (const pair of typeValuePairs) {
      const values = typeGroups.get(pair.type) || [];
      values.push(pair.value);
      typeGroups.set(pair.type, values);
    }

    // 构建查询条件
    const orConditions = Array.from(typeGroups.entries()).map(([type, values]) => ({
      dictType: type,
      dictValue: { in: values },
    }));

    const dictData = await this.prisma.sysDictData.findMany({
      where: {
        OR: orConditions,
        delFlag: DelFlagEnum.NORMAL,
      },
    });

    // 构建结果映射
    const result = new Map<string, SysDictData>();
    for (const data of dictData) {
      const key = `${data.dictType}:${data.dictValue}`;
      result.set(key, data);
    }

    return result;
  }

  /**
   * 批量加载字典数据的标签
   *
   * @param typeValuePairs - 字典类型和值的组合数组
   * @returns 组合键到标签的映射
   */
  async loadLabels(typeValuePairs: Array<{ type: string; value: string }>): Promise<Map<string, string>> {
    const dataMap = await this.loadByTypeAndValue(typeValuePairs);

    const result = new Map<string, string>();
    for (const [key, data] of dataMap) {
      result.set(key, data.dictLabel);
    }

    return result;
  }

  /**
   * 按字典类型批量加载所有字典数据
   *
   * @param dictTypes - 字典类型编码数组
   * @returns 字典类型到字典数据数组的映射
   */
  async loadByDictTypes(dictTypes: string[]): Promise<Map<string, SysDictData[]>> {
    const dictData = await this.prisma.sysDictData.findMany({
      where: {
        dictType: { in: dictTypes },
        delFlag: DelFlagEnum.NORMAL,
      },
      orderBy: { dictSort: 'asc' },
    });

    // 按字典类型分组
    const result = new Map<string, SysDictData[]>();
    for (const type of dictTypes) {
      result.set(type, []);
    }
    for (const data of dictData) {
      const list = result.get(data.dictType);
      if (list) {
        list.push(data);
      }
    }

    return result;
  }

  /**
   * 批量加载默认字典数据
   *
   * @param dictTypes - 字典类型编码数组
   * @returns 字典类型到默认字典数据的映射
   */
  async loadDefaultByTypes(dictTypes: string[]): Promise<Map<string, SysDictData | null>> {
    const dictData = await this.prisma.sysDictData.findMany({
      where: {
        dictType: { in: dictTypes },
        isDefault: 'Y',
        delFlag: DelFlagEnum.NORMAL,
      },
    });

    const result = new Map<string, SysDictData | null>();
    for (const type of dictTypes) {
      result.set(type, null);
    }
    for (const data of dictData) {
      result.set(data.dictType, data);
    }

    return result;
  }
}
