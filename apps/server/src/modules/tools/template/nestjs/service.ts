import * as Lodash from 'lodash';
import { GenConstants } from 'src/shared/constants/gen.constant';
import { assertIdentifier, escapeMultilineText } from '../utils/sanitize';

interface ColumnInfo {
  javaField?: string;
  javaType?: string;
  isList?: string;
  isQuery?: string;
  queryType?: string;
}

interface ServiceOptions {
  BusinessName: string;
  primaryKey?: string;
  businessName?: string;
  className?: string;
  functionName?: string;
  tableComment?: string;
  columns?: ColumnInfo[];
  tenantAware?: boolean;
}

/**
 * NestJS Service 模板生成器
 *
 * 生成符合项目规范的 Service 代码，包含：
 * - 使用 PrismaService 进行数据库操作
 * - 使用 Result 类统一响应格式 (Result.ok, Result.fail, Result.page)
 * - 多租户支持 (tenantId 字段处理)
 * - 完整的 CRUD 操作
 *
 * Requirements: 13.2, 13.3, 13.5, 13.6, 13.11
 */
export const serviceTem = (options: ServiceOptions) => {
  const {
    BusinessName,
    primaryKey,
    businessName,
    className,
    functionName,
    tableComment,
    columns,
    tenantAware = false,
  } = options;

  // 安全：校验标识符
  assertIdentifier(BusinessName, 'BusinessName');
  if (businessName) assertIdentifier(businessName, 'businessName');
  if (primaryKey) assertIdentifier(primaryKey, 'primaryKey');

  // 安全：functionName / tableComment 用于日志模板字符串
  const safeFunctionName = escapeMultilineText(functionName ?? '');
  const safeTableComment = escapeMultilineText(tableComment ?? '');

  const modelName = className || Lodash.upperFirst(BusinessName);
  const delegateName = lowercaseFirst(modelName);
  const primaryKeyType = getPrimaryKeyType(options);
  const listSelectDefinition = getListSelectDefinition(options, modelName);
  const queryConditions = getListQueryStr(options);
  const selectLine = listSelectDefinition ? '      select: listSelect,\n' : '';

  // 检查是否有租户字段
  const hasTenantId = tenantAware || columns?.some((col: ColumnInfo) => col.javaField === 'tenantId');
  const tenantImport = hasTenantId ? "import { TenantContext } from 'src/core/tenancy/context/tenant.context';\n" : '';
  const tenantWhereClause = hasTenantId ? '      tenantId: TenantContext.getTenantId(),\n' : '';
  const tenantCreateData = hasTenantId ? '        tenantId: TenantContext.getTenantId(),\n' : '';

  return `import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Result, ResponseCode } from 'src/shared/response';
import { PrismaService } from 'src/platform/prisma';
import { isEmpty } from 'src/shared/utils';
${tenantImport}import {
  Create${Lodash.upperFirst(BusinessName)}Dto,
  Update${Lodash.upperFirst(BusinessName)}Dto,
  Query${Lodash.upperFirst(BusinessName)}Dto,
} from './dto/${businessName}.dto';

/**
 * ${safeFunctionName || safeTableComment || businessName}服务
 *
 * @description 提供${safeFunctionName || safeTableComment || businessName}的业务逻辑处理
 */
@Injectable()
export class ${Lodash.upperFirst(BusinessName)}Service {
  private readonly logger = new Logger(${Lodash.upperFirst(BusinessName)}Service.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * 创建${safeFunctionName || safeTableComment || businessName}
   *
   * @param createDto 创建参数
   * @returns 创建结果
   */
  async create(createDto: Create${Lodash.upperFirst(BusinessName)}Dto) {
    try {
      const data = await this.prisma.${delegateName}.create({
        data: {
          ...createDto,
${tenantCreateData}        },
      });
      this.logger.log(\`${safeFunctionName || businessName}创建成功: \${data.${primaryKey}}\`);
      return Result.ok(data, '创建成功');
    } catch (error) {
      this.logger.error(\`${safeFunctionName || businessName}创建失败: \${error instanceof Error ? error.message : String(error)}\`, error instanceof Error ? error.stack : undefined);
      return Result.fail(ResponseCode.OPERATION_FAILED, '创建失败');
    }
  }

  /**
   * 分页查询${safeFunctionName || safeTableComment || businessName}列表
   *
   * @param query 查询参数
   * @returns 分页数据
   */
  async findAll(query: Query${Lodash.upperFirst(BusinessName)}Dto) {
${listSelectDefinition || ''}    const where: Prisma.${modelName}WhereInput = {
      delFlag: '0',
${tenantWhereClause}    };

${queryConditions || ''}    const pageSize = Number(query.pageSize ?? 10);
    const pageNum = Number(query.pageNum ?? 1);

    const queryArgs: Prisma.${modelName}FindManyArgs = {
      where,
      skip: pageSize * (pageNum - 1),
      take: pageSize,
${selectLine}    };

    // 排序处理
    if (query.orderByColumn && query.isAsc) {
      queryArgs.orderBy = {
        [query.orderByColumn]: query.isAsc === 'ascending' ? 'asc' : 'desc',
      } as Prisma.${modelName}OrderByWithRelationInput;
    } else {
      queryArgs.orderBy = { ${primaryKey}: 'desc' };
    }

    const [rows, total] = await this.prisma.$transaction([
      this.prisma.${delegateName}.findMany(queryArgs),
      this.prisma.${delegateName}.count({ where }),
    ]);

    return Result.page(rows, total, pageNum, pageSize);
  }

  /**
   * 根据ID查询${safeFunctionName || safeTableComment || businessName}详情
   *
   * @param ${primaryKey} 主键ID
   * @returns 详情数据
   */
  async findOne(${primaryKey}: ${primaryKeyType}) {
    const data = await this.prisma.${delegateName}.findFirst({
      where: {
        delFlag: '0',
        ${primaryKey}: ${primaryKey},
${tenantWhereClause}      },
    });

    if (!data) {
      return Result.fail(ResponseCode.DATA_NOT_FOUND, '数据不存在');
    }

    return Result.ok(data);
  }

  /**
   * 更新${safeFunctionName || safeTableComment || businessName}
   *
   * @param updateDto 更新参数
   * @returns 更新结果
   */
  async update(updateDto: Update${Lodash.upperFirst(BusinessName)}Dto) {
    // 检查数据是否存在
    const existing = await this.prisma.${delegateName}.findFirst({
      where: {
        ${primaryKey}: updateDto.${primaryKey},
        delFlag: '0',
${tenantWhereClause}      },
    });

    if (!existing) {
      return Result.fail(ResponseCode.DATA_NOT_FOUND, '数据不存在');
    }

    try {
      const data = await this.prisma.${delegateName}.update({
        where: { ${primaryKey}: updateDto.${primaryKey} },
        data: updateDto,
      });
      this.logger.log(\`${safeFunctionName || businessName}更新成功: \${data.${primaryKey}}\`);
      return Result.ok(data, '更新成功');
    } catch (error) {
      this.logger.error(\`${safeFunctionName || businessName}更新失败: \${error instanceof Error ? error.message : String(error)}\`, error instanceof Error ? error.stack : undefined);
      return Result.fail(ResponseCode.OPERATION_FAILED, '更新失败');
    }
  }

  /**
   * 删除${safeFunctionName || safeTableComment || businessName}（软删除）
   *
   * @param ${primaryKey}s 主键ID数组
   * @returns 删除结果
   */
  async remove(${primaryKey}s: ${primaryKeyType}[]) {
    try {
      const result = await this.prisma.${delegateName}.updateMany({
        where: {
          ${primaryKey}: { in: ${primaryKey}s },
${tenantWhereClause}        },
        data: { delFlag: '1' },
      });

      if (result.count === 0) {
        return Result.fail(ResponseCode.DATA_NOT_FOUND, '数据不存在');
      }

      this.logger.log(\`${safeFunctionName || businessName}删除成功: \${${primaryKey}s.join(',')}\`);
      return Result.ok({ count: result.count }, '删除成功');
    } catch (error) {
      this.logger.error(\`${safeFunctionName || businessName}删除失败: \${error instanceof Error ? error.message : String(error)}\`, error instanceof Error ? error.stack : undefined);
      return Result.fail(ResponseCode.OPERATION_FAILED, '删除失败');
    }
  }
}
`;
};

/**
 * 生成列表查询的 select 定义
 */
const getListSelectDefinition = (options: ServiceOptions, modelName: string) => {
  const { columns } = options;
  if (!columns) return '';

  const fields = columns.filter((column: ColumnInfo) => column.isList === '1').map((column: ColumnInfo) => column.javaField);
  if (!fields.length) {
    return '';
  }
  return `    const listSelect: Prisma.${modelName}Select = {\n${fields.map((field: string | undefined) => `      ${field}: true,`).join('\n')}\n    };\n\n`;
};

/**
 * 生成查询条件语句
 */
const getListQueryStr = (options: ServiceOptions) => {
  const { columns } = options;
  if (!columns) return '';

  const statements = columns
    .filter((column: ColumnInfo) => column.isQuery === '1')
    .map((column: ColumnInfo) => {
      const field = column.javaField;
      switch (column.queryType) {
        case GenConstants.QUERY_EQ:
          return `    if (!isEmpty(query.${field})) {\n      where.${field} = query.${field};\n    }\n`;
        case GenConstants.QUERY_NE:
          return `    if (!isEmpty(query.${field})) {\n      where.${field} = { not: query.${field} };\n    }\n`;
        case GenConstants.QUERY_GT:
          return `    if (!isEmpty(query.${field})) {\n      where.${field} = { gt: query.${field} };\n    }\n`;
        case GenConstants.QUERY_GTE:
          return `    if (!isEmpty(query.${field})) {\n      where.${field} = { gte: query.${field} };\n    }\n`;
        case GenConstants.QUERY_LT:
          return `    if (!isEmpty(query.${field})) {\n      where.${field} = { lt: query.${field} };\n    }\n`;
        case GenConstants.QUERY_LTE:
          return `    if (!isEmpty(query.${field})) {\n      where.${field} = { lte: query.${field} };\n    }\n`;
        case GenConstants.QUERY_LIKE:
          return `    if (!isEmpty(query.${field})) {\n      where.${field} = { contains: query.${field} };\n    }\n`;
        case GenConstants.QUERY_BETWEEN:
          return `    if (Array.isArray(query.${field}) && query.${field}.length === 2 && !isEmpty(query.${field}[0]) && !isEmpty(query.${field}[1])) {\n      where.${field} = { gte: query.${field}[0], lte: query.${field}[1] };\n    }\n`;
        default:
          return '';
      }
    })
    .filter(Boolean);

  return statements.length > 0 ? statements.join('\n') + '\n' : '';
};

/**
 * 获取主键类型
 */
const getPrimaryKeyType = (options: ServiceOptions) => {
  const { primaryKey, columns } = options;

  if (!primaryKey || !columns) {
    return 'string';
  }

  const primaryKeyColumn = columns.find((item: ColumnInfo) => item.javaField === primaryKey);
  return mapJavaTypeToTs(primaryKeyColumn?.javaType);
};

/**
 * 首字母小写
 */
const lowercaseFirst = (str: string) => {
  if (!str) return '';
  return str.charAt(0).toLowerCase() + str.slice(1);
};

/**
 * Java 类型映射到 TypeScript 类型
 */
const mapJavaTypeToTs = (javaType = 'String') => {
  switch (javaType) {
    case 'Number':
    case 'Integer':
    case 'Long':
      return 'number';
    case 'Boolean':
      return 'boolean';
    case 'Date':
      return 'string';
    case 'String':
    default:
      return 'string';
  }
};
