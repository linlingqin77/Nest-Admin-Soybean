import { applyDecorators, createParamDecorator, ExecutionContext, SetMetadata, UseInterceptors } from '@nestjs/common';
import { DataPermissionInterceptor } from 'src/core/http/interceptors/data-permission.interceptor';
import { Request } from 'express';

export const DATA_PERMISSION_KEY = 'DATA_PERMISSION';
export const DATA_PERMISSION_CONTEXT_KEY = 'DATA_PERMISSION_CONTEXT';

/**
 * 数据权限范围枚举
 */
export enum DataScope {
  /** 全部数据 */
  ALL = 1,
  /** 指定部门数据 */
  DEPT_CUSTOM = 2,
  /** 本部门数据 */
  DEPT_ONLY = 3,
  /** 本部门及以下数据 */
  DEPT_AND_CHILD = 4,
  /** 仅本人数据 */
  SELF = 5,
}

/**
 * 数据权限规则
 */
export interface DataPermissionRule {
  /** 规则名称 */
  name: string;
  /** 表别名 */
  tableAlias?: string;
  /** 部门ID字段名 */
  deptIdColumn?: string;
  /** 用户ID字段名 */
  userIdColumn?: string;
}

/**
 * 数据权限配置选项
 */
export interface DataPermissionOptions {
  /** 是否启用数据权限，默认true */
  enable?: boolean;
  /** 部门表别名 */
  deptAlias?: string;
  /** 用户表别名 */
  userAlias?: string;
  /** 部门ID字段名，默认 'deptId' */
  deptIdColumn?: string;
  /** 用户ID字段名，默认 'userId' */
  userIdColumn?: string;
  /** 包含的规则 */
  includeRules?: DataPermissionRule[];
  /** 排除的规则 */
  excludeRules?: string[];
}

/**
 * 数据权限上下文
 */
export interface DataPermissionContext {
  /** 是否启用 */
  enabled: boolean;
  /** 数据范围 */
  dataScope: DataScope;
  /** 当前用户ID */
  userId: number;
  /** 当前用户部门ID */
  deptId: number;
  /** 可访问的部门ID列表 */
  deptIds: number[];
  /** 配置选项 */
  options: DataPermissionOptions;
}

/**
 * 默认配置
 */
const DEFAULT_OPTIONS: Required<Omit<DataPermissionOptions, 'includeRules' | 'excludeRules'>> &
  Pick<DataPermissionOptions, 'includeRules' | 'excludeRules'> = {
  enable: true,
  deptAlias: '',
  userAlias: '',
  deptIdColumn: 'deptId',
  userIdColumn: 'userId',
  includeRules: undefined,
  excludeRules: undefined,
};

/**
 * 数据权限装饰器
 *
 * @description
 * 用于实现基于部门的数据隔离
 * 根据用户角色的数据权限范围自动过滤数据
 *
 * @example
 * ```typescript
 * // 基本用法
 * @Get('list')
 * @DataPermission()
 * async getUserList(@Query() query: UserQueryDto) {}
 *
 * // 自定义配置
 * @Get('list')
 * @DataPermission({ deptAlias: 'u', deptIdColumn: 'dept_id' })
 * async getUserList(@Query() query: UserQueryDto) {}
 *
 * // 禁用数据权限
 * @Get('all')
 * @DataPermission({ enable: false })
 * async getAllUsers() {}
 * ```
 *
 * @param options 数据权限配置
 */
export function DataPermission(options: DataPermissionOptions = {}) {
  const mergedOptions = { ...DEFAULT_OPTIONS, ...options };
  return applyDecorators(SetMetadata(DATA_PERMISSION_KEY, mergedOptions), UseInterceptors(DataPermissionInterceptor));
}

/**
 * 获取数据权限上下文的参数装饰器
 */
export const GetDataPermissionContext = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): DataPermissionContext | null => {
    const request = ctx.switchToHttp().getRequest<Request>();
    return (request as any)[DATA_PERMISSION_CONTEXT_KEY] || null;
  },
);

export { DataPermissionInterceptor };

/**
 * 数据权限SQL构建器
 * 用于在Service层构建数据权限SQL条件
 */
export class DataPermissionSqlBuilder {
  /**
   * 构建Prisma where条件
   */
  static buildPrismaWhere(context: DataPermissionContext | null): Record<string, any> {
    if (!context || !context.enabled) {
      return {};
    }

    const { dataScope, userId, deptIds, options } = context;
    const deptIdColumn = options.deptIdColumn || 'deptId';
    const userIdColumn = options.userIdColumn || 'userId';

    switch (dataScope) {
      case DataScope.ALL:
        return {};

      case DataScope.DEPT_CUSTOM:
      case DataScope.DEPT_ONLY:
      case DataScope.DEPT_AND_CHILD:
        if (deptIds.length === 0) {
          return {};
        }
        return {
          [deptIdColumn]: {
            in: deptIds,
          },
        };

      case DataScope.SELF:
        return {
          [userIdColumn]: userId,
        };

      default:
        return {};
    }
  }

  /**
   * 构建原生SQL条件
   */
  static buildRawSqlCondition(
    context: DataPermissionContext | null,
    tableAlias?: string,
  ): { sql: string; params: any[] } {
    if (!context || !context.enabled) {
      return { sql: '1=1', params: [] };
    }

    const { dataScope, userId, deptIds, options } = context;
    const alias = tableAlias || options.deptAlias || '';
    const prefix = alias ? `${alias}.` : '';
    const deptIdColumn = options.deptIdColumn || 'dept_id';
    const userIdColumn = options.userIdColumn || 'user_id';

    switch (dataScope) {
      case DataScope.ALL:
        return { sql: '1=1', params: [] };

      case DataScope.DEPT_CUSTOM:
      case DataScope.DEPT_ONLY:
      case DataScope.DEPT_AND_CHILD:
        if (deptIds.length === 0) {
          return { sql: '1=1', params: [] };
        }
        const placeholders = deptIds.map(() => '?').join(',');
        return {
          sql: `${prefix}${deptIdColumn} IN (${placeholders})`,
          params: deptIds,
        };

      case DataScope.SELF:
        return {
          sql: `${prefix}${userIdColumn} = ?`,
          params: [userId],
        };

      default:
        return { sql: '1=1', params: [] };
    }
  }
}
