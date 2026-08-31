import { Prisma } from '@prisma/client';
import { Logger } from '@nestjs/common';
import { TenantContext } from '../context/tenant.context';
import { TENANT_MODELS, hasTenantField, SUPER_TENANT_ID } from '../constants/tenant-models';
import { PrismaQueryArgs } from '../types';

// 重新导出常量，保持向后兼容
export { TENANT_MODELS, hasTenantField, SUPER_TENANT_ID };

const logger = new Logger('TenantMiddleware');

/**
 * 添加租户过滤条件
 */
export function addTenantFilter<T extends PrismaQueryArgs>(model: string, args: T): T {
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

  const result = { ...args } as T;
  result.where = result.where || {};

  // 处理复杂的 where 条件
  if (result.where.AND) {
    (result.where.AND as unknown[]).push({ tenantId });
  } else if (result.where.OR) {
    result.where = {
      AND: [{ tenantId }, { OR: result.where.OR }],
    } as typeof result.where;
  } else {
    result.where.tenantId = tenantId;
  }

  return result;
}

/**
 * 创建时设置租户ID
 */
export function setTenantId<T extends PrismaQueryArgs>(model: string, args: T): T {
  if (!hasTenantField(model)) {
    return args;
  }

  const tenantId = TenantContext.getTenantId() || SUPER_TENANT_ID;

  const result = { ...args } as T;
  result.data = result.data || {};

  if (!Array.isArray(result.data) && !result.data.tenantId) {
    result.data.tenantId = tenantId;
  }

  return result;
}

/**
 * 批量创建时设置租户ID
 */
export function setTenantIdForMany<T extends PrismaQueryArgs>(model: string, args: T): T {
  if (!hasTenantField(model)) {
    return args;
  }

  const tenantId = TenantContext.getTenantId() || SUPER_TENANT_ID;

  const result = { ...args } as T;
  if (Array.isArray(result.data)) {
    result.data = result.data.map((item) => ({
      ...item,
      tenantId: item.tenantId || tenantId,
    }));
  }

  return result;
}

/**
 * upsert 时设置租户ID
 */
export function setTenantIdForUpsert<T extends PrismaQueryArgs>(model: string, args: T): T {
  if (!hasTenantField(model)) {
    return args;
  }

  const tenantId = TenantContext.getTenantId() || SUPER_TENANT_ID;

  const result = { ...args } as T;

  // 设置 create 数据的租户ID
  if (result.create && !result.create.tenantId) {
    result.create.tenantId = tenantId;
  }

  // 添加 where 条件的租户过滤
  return addTenantFilter(model, result);
}

/**
 * 验证查询结果是否属于当前租户 (用于 findUnique)
 *
 * 对于 findUnique 操作，由于无法在 where 条件中添加租户过滤，
 * 需要在查询结果返回后验证数据是否属于当前租户
 */
export function validateTenantOwnership<T extends Record<string, unknown> | null>(model: string, result: T): T | null {
  if (!result || !hasTenantField(model)) {
    return result;
  }

  if (TenantContext.isIgnoreTenant() || TenantContext.isSuperTenant()) {
    return result;
  }

  const currentTenantId = TenantContext.getTenantId();
  if (!currentTenantId) {
    return result;
  }

  if (result.tenantId && result.tenantId !== currentTenantId) {
    const requestId = TenantContext.getRequestId();
    logger.warn(
      `[${requestId}] Cross-tenant access attempt blocked: ` +
        `model=${model}, expected tenantId=${currentTenantId}, actual tenantId=${result.tenantId}`,
    );
    return null;
  }

  return result;
}

/**
 * 需要添加租户过滤的查询操作
 */
const FILTER_ACTIONS = [
  'findMany',
  'findFirst',
  'findFirstOrThrow',
  'count',
  'aggregate',
  'groupBy',
  'updateMany',
  'deleteMany',
] as const;

/**
 * 需要添加租户过滤的更新/删除操作
 */
const MODIFY_ACTIONS = ['update', 'delete'] as const;

/**
 * 需要设置租户ID的创建操作
 */
const CREATE_ACTIONS = ['create'] as const;

/**
 * 创建 Prisma 租户中间件
 *
 * 该中间件会自动为需要租户隔离的模型添加租户过滤条件，
 * 并在创建数据时自动设置租户ID。
 *
 * @returns Prisma 中间件
 */
export function createTenantMiddleware(): Prisma.Middleware {
  return async (params: Prisma.MiddlewareParams, next: (params: Prisma.MiddlewareParams) => Promise<unknown>) => {
    const { model, action, args } = params;

    if (!model) {
      return next(params);
    }

    // 查询操作：添加租户过滤
    if ((FILTER_ACTIONS as readonly string[]).includes(action)) {
      params.args = addTenantFilter(model, args);
    }
    // 更新/删除操作：添加租户过滤
    else if ((MODIFY_ACTIONS as readonly string[]).includes(action)) {
      params.args = addTenantFilter(model, args);
    }
    // 创建操作：设置租户ID
    else if ((CREATE_ACTIONS as readonly string[]).includes(action)) {
      params.args = setTenantId(model, args);
    }
    // 批量创建：设置租户ID
    else if (action === 'createMany') {
      params.args = setTenantIdForMany(model, args);
    }
    // upsert：设置租户ID并添加过滤
    else if (action === 'upsert') {
      params.args = setTenantIdForUpsert(model, args);
    }
    // findUnique：执行后验证租户归属
    else if (action === 'findUnique') {
      const result = await next(params);
      return validateTenantOwnership(model, result as Record<string, unknown> | null);
    }

    return next(params);
  };
}
