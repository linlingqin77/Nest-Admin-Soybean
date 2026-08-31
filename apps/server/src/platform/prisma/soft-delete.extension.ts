import { Prisma } from '@prisma/client';
import { Logger } from '@nestjs/common';

const logger = new Logger('SoftDeleteExtension');

// 使用 any 来避免 Prisma 复杂类型兼容性问题
type AnyRecord = any;

/**
 * 需要软删除自动过滤的模型列表
 *
 * 所有拥有 delFlag 字段的模型都应该在此注册。
 * 查询时会自动添加 delFlag = '0' 条件（未删除）。
 * 删除操作不自动过滤，允许查询已删除数据并物理删除。
 */
export const SOFT_DELETE_MODELS = new Set<string>([
  'SysTenant',
  'SysTenantPackage',
  'SysClient',
  'GenDataSource',
  'GenTemplateGroup',
  'GenTemplate',
  'GenTable',
  'GenTableColumn',
  'SysSystemConfig',
  'SysConfig',
  'SysDept',
  'SysDictData',
  'SysDictType',
  'SysLogininfor',
  'SysMenu',
  'SysNotice',
  'SysPost',
  'SysRole',
  'SysFileFolder',
  'SysUpload',
  'SysUser',
  'SysMailAccount',
  'SysMailTemplate',
  'SysSmsChannel',
  'SysSmsTemplate',
  'SysNotifyTemplate',
  'SysNotifyMessage',
  'SysOssConfig',
  'SysOss',
]);

/**
 * 检查模型是否需要软删除过滤
 */
export function hasSoftDeleteField(model: string): boolean {
  return SOFT_DELETE_MODELS.has(model);
}

/**
 * 软删除正常值（未删除）
 */
export const DEL_FLAG_NORMAL = '0';

/**
 * 软删除已删除值
 */
export const DEL_FLAG_DELETED = '2';

/**
 * 标记键：用于跳过软删除过滤
 * 在查询的 where 条件中设置 __includeSoftDeleted: true 可跳过自动过滤
 *
 * @example
 * // 查询包含已删除的数据
 * prisma.sysUser.findMany({
 *   where: { __includeSoftDeleted: true }
 * })
 */
export const INCLUDE_SOFT_DELETED_KEY = '__includeSoftDeleted';

/**
 * 判断是否应该跳过软删除过滤
 */
function shouldSkipFilter(where: AnyRecord | undefined): boolean {
  if (!where) return false;
  return where[INCLUDE_SOFT_DELETED_KEY] === true;
}

/**
 * 清理 where 条件中的内部标记
 */
function cleanInternalKeys(where: AnyRecord | undefined): AnyRecord | undefined {
  if (!where || !where[INCLUDE_SOFT_DELETED_KEY]) return where;

  const { [INCLUDE_SOFT_DELETED_KEY]: _, ...rest } = where;
  return Object.keys(rest).length > 0 ? rest : undefined;
}

/**
 * 添加软删除过滤条件到 where 子句
 */
function addSoftDeleteFilter(where: AnyRecord | undefined): AnyRecord {
  if (!where) {
    return { delFlag: DEL_FLAG_NORMAL };
  }

  // 如果已经有 delFlag 条件，不覆盖（允许用户显式查询已删除数据）
  if (where.delFlag !== undefined) {
    return where;
  }

  // 处理复杂 where 条件
  if (where.AND) {
    return {
      ...where,
      AND: [...(where.AND as unknown[]), { delFlag: DEL_FLAG_NORMAL }],
    };
  }

  if (where.OR) {
    return {
      AND: [{ delFlag: DEL_FLAG_NORMAL }, { OR: where.OR }],
    };
  }

  return {
    ...where,
    delFlag: DEL_FLAG_NORMAL,
  };
}

/**
 * 创建软删除扩展
 *
 * 使用 Prisma $extends API 自动为包含 delFlag 字段的模型添加软删除过滤。
 * - 查询操作（findMany, findFirst, count 等）自动添加 delFlag = '0'
 * - 创建操作不受影响
 * - 更新操作自动添加 delFlag = '0' 过滤（只更新未删除的记录）
 * - 删除操作不添加过滤（允许物理删除已软删除的记录）
 *
 * 可通过以下方式跳过自动过滤：
 * 1. 显式设置 where.delFlag 条件
 * 2. 设置 where.__includeSoftDeleted = true
 *
 * @returns Prisma 扩展配置
 */
export function createSoftDeleteExtension() {
  return Prisma.defineExtension({
    name: 'soft-delete-extension',
    query: {
      $allModels: {
        // === 查询操作：自动过滤已删除数据 ===
        async findMany({ model, args, query }) {
          if (hasSoftDeleteField(model)) {
            if (shouldSkipFilter(args.where)) {
              args.where = cleanInternalKeys(args.where);
            } else {
              args.where = addSoftDeleteFilter(args.where);
            }
          }
          return query(args);
        },

        async findFirst({ model, args, query }) {
          if (hasSoftDeleteField(model)) {
            if (shouldSkipFilter(args.where)) {
              args.where = cleanInternalKeys(args.where);
            } else {
              args.where = addSoftDeleteFilter(args.where);
            }
          }
          return query(args);
        },

        async findFirstOrThrow({ model, args, query }) {
          if (hasSoftDeleteField(model)) {
            if (shouldSkipFilter(args.where)) {
              args.where = cleanInternalKeys(args.where);
            } else {
              args.where = addSoftDeleteFilter(args.where);
            }
          }
          return query(args);
        },

        async findUnique({ model, args, query }) {
          // findUnique 使用唯一键查询，无法直接添加 where 条件
          // 查询后验证 delFlag
          const result = await query(args);
          if (!result || !hasSoftDeleteField(model)) {
            return result;
          }
          if (shouldSkipFilter(args.where)) {
            return result;
          }
          const record = result as AnyRecord;
          if (record.delFlag && record.delFlag !== DEL_FLAG_NORMAL) {
            logger.debug(`Soft-deleted record filtered out: model=${model}`);
            return null;
          }
          return result;
        },

        async findUniqueOrThrow({ model, args, query }) {
          const result = await query(args);
          if (!hasSoftDeleteField(model)) {
            return result;
          }
          if (shouldSkipFilter(args.where)) {
            return result;
          }
          const record = result as AnyRecord;
          if (record.delFlag && record.delFlag !== DEL_FLAG_NORMAL) {
            throw new Error(`Record not found (soft-deleted) for model ${model}`);
          }
          return result;
        },

        async count({ model, args, query }) {
          if (hasSoftDeleteField(model)) {
            if (shouldSkipFilter(args.where)) {
              args.where = cleanInternalKeys(args.where);
            } else {
              args.where = addSoftDeleteFilter(args.where);
            }
          }
          return query(args);
        },

        async aggregate({ model, args, query }) {
          if (hasSoftDeleteField(model)) {
            if (shouldSkipFilter(args.where)) {
              args.where = cleanInternalKeys(args.where);
            } else {
              args.where = addSoftDeleteFilter(args.where);
            }
          }
          return query(args);
        },

        async groupBy({ model, args, query }) {
          if (hasSoftDeleteField(model)) {
            if (shouldSkipFilter(args.where)) {
              args.where = cleanInternalKeys(args.where);
            } else {
              args.where = addSoftDeleteFilter(args.where);
            }
          }
          return query(args);
        },

        // === 更新操作：仅更新未删除的记录 ===
        async update({ model, args, query }) {
          if (hasSoftDeleteField(model)) {
            if (!shouldSkipFilter(args.where)) {
              args.where = addSoftDeleteFilter(args.where);
            } else {
              args.where = cleanInternalKeys(args.where);
            }
          }
          return query(args);
        },

        async updateMany({ model, args, query }) {
          if (hasSoftDeleteField(model)) {
            if (!shouldSkipFilter(args.where)) {
              args.where = addSoftDeleteFilter(args.where);
            } else {
              args.where = cleanInternalKeys(args.where);
            }
          }
          return query(args);
        },

        // 注意：delete 和 deleteMany 不添加软删除过滤
        // 这允许物理删除操作（如定时清理过期软删除记录）正常工作
        // 业务代码应使用 updateMany({ data: { delFlag: '2' } }) 进行软删除

        // === upsert 操作 ===
        async upsert({ model, args, query }) {
          if (hasSoftDeleteField(model)) {
            if (!shouldSkipFilter(args.where)) {
              args.where = addSoftDeleteFilter(args.where);
            } else {
              args.where = cleanInternalKeys(args.where);
            }
          }
          return query(args);
        },
      },
    },
  });
}

// 导出辅助函数供测试使用
export const softDeleteExtensionHelpers = {
  hasSoftDeleteField,
  addSoftDeleteFilter,
  shouldSkipFilter,
  cleanInternalKeys,
};
