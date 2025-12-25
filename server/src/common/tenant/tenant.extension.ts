import { Prisma } from '@prisma/client';
import { TenantContext } from './tenant.context';

/**
 * Prisma 租户扩展 - 自动添加租户过滤和设置租户ID
 *
 * 使用方式:
 * const prisma = new PrismaClient().$extends(tenantExtension);
 */
export const tenantExtension = Prisma.defineExtension((client) => {
  return client.$extends({
    query: {
      $allModels: {
        async findMany({ model, operation, args, query }) {
          args = addTenantFilter(model, args);
          return query(args);
        },
        async findFirst({ model, operation, args, query }) {
          args = addTenantFilter(model, args);
          return query(args);
        },
        async findUnique({ model, operation, args, query }) {
          // findUnique 需要验证结果是否属于当前租户
          const result = await query(args);
          return validateTenantOwnership(model, result);
        },
        async findFirstOrThrow({ model, operation, args, query }) {
          args = addTenantFilter(model, args);
          return query(args);
        },
        async count({ model, operation, args, query }) {
          args = addTenantFilter(model, args);
          return query(args);
        },
        async aggregate({ model, operation, args, query }) {
          args = addTenantFilter(model, args);
          return query(args);
        },
        async groupBy({ model, operation, args, query }) {
          args = addTenantFilter(model, args);
          return query(args);
        },
        async create({ model, operation, args, query }) {
          args = setTenantId(model, args);
          return query(args);
        },
        async createMany({ model, operation, args, query }) {
          args = setTenantIdForMany(model, args);
          return query(args);
        },
        async update({ model, operation, args, query }) {
          args = addTenantFilterForUpdate(model, args);
          return query(args);
        },
        async updateMany({ model, operation, args, query }) {
          args = addTenantFilter(model, args);
          return query(args);
        },
        async delete({ model, operation, args, query }) {
          // delete 操作需要添加租户过滤，防止误删其他租户数据
          args = addTenantFilterForDelete(model, args);
          return query(args);
        },
        async deleteMany({ model, operation, args, query }) {
          args = addTenantFilter(model, args);
          return query(args);
        },
        async upsert({ model, operation, args, query }) {
          args = setTenantIdForUpsert(model, args);
          return query(args);
        },
      },
    },
  });
});

/**
 * 需要租户隔离的模型列表
 */
const TENANT_MODELS = [
  'SysConfig',
  'SysDept',
  'SysDictData',
  'SysDictType',
  'SysJob',
  'SysLogininfor',
  'SysMenu',
  'SysNotice',
  'SysOperLog',
  'SysPost',
  'SysRole',
  'SysUpload',
  'SysUser',
];

/**
 * 检查模型是否需要租户过滤
 */
function hasTenantField(model: string): boolean {
  return TENANT_MODELS.includes(model);
}

/**
 * 验证查询结果是否属于当前租户
 */
function validateTenantOwnership(model: string, result: any): any {
  if (!result || !hasTenantField(model)) {
    return result;
  }

  // 忽略租户过滤或超级租户不需要验证
  if (TenantContext.isIgnoreTenant() || TenantContext.isSuperTenant()) {
    return result;
  }

  const currentTenantId = TenantContext.getTenantId();
  if (!currentTenantId) {
    return result;
  }

  // 验证结果的租户ID是否匹配
  if (result.tenantId && result.tenantId !== currentTenantId) {
    // 返回 null 而不是抛出异常，保持与 Prisma findUnique 的行为一致
    return null;
  }

  return result;
}

/**
 * 为删除操作添加租户过滤
 */
function addTenantFilterForDelete(model: string, args: any): any {
  if (!hasTenantField(model)) {
    return args;
  }

  if (TenantContext.isIgnoreTenant() || TenantContext.isSuperTenant()) {
    return args;
  }

  const tenantId = TenantContext.getTenantId();
  if (!tenantId) {
    return args;
  }

  args = args || {};
  args.where = args.where || {};

  // 添加租户过滤条件
  if (args.where.AND) {
    args.where.AND.push({ tenantId });
  } else if (args.where.OR) {
    args.where = {
      AND: [{ tenantId }, { OR: args.where.OR }],
    };
  } else {
    args.where.tenantId = tenantId;
  }

  return args;
}

/**
 * 添加租户过滤条件
 */
function addTenantFilter(model: string, args: any): any {
  if (!hasTenantField(model)) {
    return args;
  }

  // 检查是否忽略租户过滤
  if (TenantContext.isIgnoreTenant()) {
    return args;
  }

  // 超级管理员可以查看所有租户数据
  if (TenantContext.isSuperTenant()) {
    return args;
  }

  const tenantId = TenantContext.getTenantId();
  if (!tenantId) {
    return args;
  }

  args = args || {};
  args.where = args.where || {};
  args.where.tenantId = tenantId;

  return args;
}

/**
 * 为更新操作添加租户过滤
 */
function addTenantFilterForUpdate(model: string, args: any): any {
  if (!hasTenantField(model)) {
    return args;
  }

  if (TenantContext.isIgnoreTenant() || TenantContext.isSuperTenant()) {
    return args;
  }

  const tenantId = TenantContext.getTenantId();
  if (!tenantId) {
    return args;
  }

  // 对于 update，需要在 where 条件中添加租户ID
  args = args || {};
  args.where = args.where || {};

  // 如果使用复合唯一键，需要确保租户ID在条件中
  if (args.where.AND) {
    args.where.AND.push({ tenantId });
  } else if (args.where.OR) {
    // 如果有 OR 条件，将整体包装
    args.where = {
      AND: [{ tenantId }, { OR: args.where.OR }],
    };
  } else {
    args.where.tenantId = tenantId;
  }

  return args;
}

/**
 * 创建时设置租户ID
 */
function setTenantId(model: string, args: any): any {
  if (!hasTenantField(model)) {
    return args;
  }

  const tenantId = TenantContext.getTenantId();
  if (!tenantId) {
    return args;
  }

  args = args || {};
  args.data = args.data || {};

  // 如果没有指定租户ID，使用当前上下文的租户ID
  if (!args.data.tenantId) {
    args.data.tenantId = tenantId;
  }

  return args;
}

/**
 * 批量创建时设置租户ID
 */
function setTenantIdForMany(model: string, args: any): any {
  if (!hasTenantField(model)) {
    return args;
  }

  const tenantId = TenantContext.getTenantId();
  if (!tenantId) {
    return args;
  }

  args = args || {};
  if (Array.isArray(args.data)) {
    args.data = args.data.map((item: any) => ({
      ...item,
      tenantId: item.tenantId || tenantId,
    }));
  }

  return args;
}

/**
 * upsert 时设置租户ID
 */
function setTenantIdForUpsert(model: string, args: any): any {
  if (!hasTenantField(model)) {
    return args;
  }

  const tenantId = TenantContext.getTenantId();
  if (!tenantId) {
    return args;
  }

  args = args || {};

  // 设置 create 数据的租户ID
  if (args.create && !args.create.tenantId) {
    args.create.tenantId = tenantId;
  }

  return args;
}
