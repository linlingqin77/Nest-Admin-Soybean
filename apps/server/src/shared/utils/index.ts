import * as Lodash from 'lodash';
import { v4 as uuidv4 } from 'uuid';
import dayjs from 'dayjs';
import isLeapYear from 'dayjs/plugin/isLeapYear'; // 导入插件
import timezone from 'dayjs/plugin/timezone'; // 导入插件
import utc from 'dayjs/plugin/utc'; // 导入插件
import 'dayjs/locale/zh-cn'; // 导入本地化语言
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(isLeapYear); // 使用插件
dayjs.locale('zh-cn'); // 使用本地化语言
dayjs.tz.setDefault('Asia/Beijing');

import { DataScopeEnum } from '../enums/index';
import { StaticLogger } from './static-logger.util';

/**
 * 树节点接口
 */
export interface TreeNode {
  id: number;
  label: string;
  parentId: number;
  children: TreeNode[];
}

/**
 * 带有 parentId 属性的基础接口
 */
interface HasParentId {
  parentId: number;
}

/**
 * 数组转树结构
 * @param arr 数据数组
 * @param getId 获取ID的函数
 * @param getLabel 获取标签的函数
 * @returns 树结构数组
 */
export function ListToTree<T extends HasParentId>(
  arr: T[],
  getId: (item: T) => number,
  getLabel: (item: T) => string,
): TreeNode[] {
  const kData: Record<number, TreeNode> = {}; // 以id做key的对象 暂时储存数据
  const lData: TreeNode[] = []; // 最终的数据 arr

  // 第一次遍历，构建 kData
  arr.forEach((m: T) => {
    const id = getId(m);
    const label = getLabel(m);
    const parentId = m.parentId;

    kData[id] = {
      id,
      label,
      parentId,
      children: [], // 初始化 children 数组
    };

    // 如果是根节点，直接推入 lData
    if (parentId === 0) {
      lData.push(kData[id]);
    }
  });
  // 第二次遍历，处理子节点
  arr.forEach((m: T) => {
    const id = getId(m);
    const parentId = m.parentId;

    if (parentId !== 0) {
      // 确保父节点存在后再添加子节点
      if (kData[parentId]) {
        kData[parentId].children.push(kData[id]);
      } else {
        StaticLogger.warn(`Parent menuId: ${parentId} not found for child menuId: ${id}`, 'ListToTree');
      }
    }
  });
  return lData;
}

/**
 * 获取当前时间
 * YYYY-MM-DD HH:mm:ss
 * @returns
 */
export function GetNowDate() {
  return dayjs().format('YYYY-MM-DD HH:mm:ss');
}

/**
 * 时间格式化
 * @param date
 * @param format
 * @returns
 */
export function FormatDate(date: Date, format = 'YYYY-MM-DD HH:mm:ss') {
  return date && dayjs(date).format(format);
}

/**
 * 深拷贝
 * @param obj
 * @returns
 */
export function DeepClone<T>(obj: T) {
  return Lodash.cloneDeep(obj);
}

/**
 * 生成唯一id
 * UUID
 * @returns
 */
export function GenerateUUID(): string {
  const uuid = uuidv4();
  return uuid.replaceAll('-', '');
}

/**
 * 数组去重
 * @param list
 * @returns
 */
export function Uniq<T extends number | string>(list: Array<T>): Array<T> {
  return Lodash.uniq(list);
}

/**
 * 分页数据接口
 */
interface PaginateData<T> {
  list: Array<T>;
  pageSize: number;
  pageNum: number;
}

/**
 * 分页过滤参数接口
 */
interface PaginateFilterParam {
  ipaddr?: string;
  userName?: string;
}

/**
 * 分页
 * @param data
 * @param pageSize
 * @param pageNum
 * @returns
 */
export function Paginate<T extends { ipaddr?: string; userName?: string }>(
  data: PaginateData<T>,
  filterParam: PaginateFilterParam,
): T[] {
  // 检查 pageSize 和 pageNumber 的合法性
  if (data.pageSize <= 0 || data.pageNum < 0) {
    return [];
  }

  // 将数据转换为数组
  let arrayData = Lodash.toArray(data.list);

  if (Object.keys(filterParam).length > 0) {
    arrayData = Lodash.filter(arrayData, (item) => {
      const arr = [];
      if (filterParam.ipaddr) {
        arr.push(Boolean(item.ipaddr?.includes(filterParam.ipaddr)));
      }

      if (filterParam.userName && item.userName) {
        arr.push(Boolean(item.userName.includes(filterParam.userName)));
      }
      return !Boolean(arr.includes(false));
    });
  }

  // 获取指定页的数据
  const pageData = arrayData.slice((data.pageNum - 1) * data.pageSize, data.pageNum * data.pageSize);

  return pageData;
}

/**
 * 数据范围过滤
 *
 * @param joinPoint 切点
 * @param user 用户
 * @param deptAlias 部门别名
 * @param userAlias 用户别名
 * @param permission 权限字符
 */
export async function DataScopeFilter<T>(entity: T, dataScope: DataScopeEnum): Promise<T> {
  switch (dataScope) {
    case DataScopeEnum.DATA_SCOPE_CUSTOM:
      // entity.andWhere((qb) => {
      //   const subQuery = qb.subQuery().select('user.deptId').from(User, 'user').where('user.userId = :userId').getQuery();
      //   return 'post.title IN ' + subQuery;
      // });
      break;
    default:
      break;
  }
  return entity;
}

/**
 * Simple object check.
 * @param item
 * @returns {boolean}
 */
export function isObject(item: unknown): item is Record<string, unknown> {
  return item !== null && typeof item === 'object' && !Array.isArray(item);
}

/**
 * Deep merge two objects.
 * @param target
 * @param ...sources
 */
export function mergeDeep<T extends Record<string, unknown>>(target: T, ...sources: Partial<T>[]): T {
  if (!sources.length) return target;
  const source = sources.shift();

  if (isObject(target) && isObject(source)) {
    for (const key in source) {
      if (isObject(source[key])) {
        if (!target[key]) Object.assign(target, { [key]: {} });
        mergeDeep(target[key] as Record<string, unknown>, source[key] as Record<string, unknown>);
      } else {
        Object.assign(target, { [key]: source[key] });
      }
    }
  }

  return mergeDeep(target, ...sources);
}

/**
 * 判断值是否为null undefined 空字符串 NaN
 */
export function isEmpty(value: unknown): boolean {
  return value === null || value === undefined || value === '' || value === 'NaN';
}

// 导出辅助工具类
export { QueryBuilder, createWhereWithDelFlag, buildListQuery } from './query-builder.helper';
export {
  BatchOperationHelper,
  type BatchResult,
  type BatchResultItem,
  type BatchValidator,
  type BatchProcessor,
} from './batch-operation.helper';
export { CacheRefreshHelper, GroupedCacheRefreshHelper } from './cache-refresh.helper';
export { ExportHelper, ExportConfigFactory, type ExportConfig, type ExportColumn } from './export.helper';
export { PaginationHelper } from './pagination.helper';
export { toDto, toDtoList, toDtoPage } from './serialize.util';
export { Assert } from './assert.util';
export { StaticLogger } from './static-logger.util';
export { attachDeptInfo, type UserWithDept, type DeptLookupClient } from './user-dept.util';
