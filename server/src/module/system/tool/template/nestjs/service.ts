import * as Lodash from 'lodash';
import { GenConstants } from 'src/common/constant/gen.constant';

export const serviceTem = (options) => {
  const { BusinessName, primaryKey, businessName, className } = options;
  const modelName = className || Lodash.upperFirst(BusinessName);
  const delegateName = lowercaseFirst(modelName);
  const primaryKeyType = getPrimaryKeyType(options);
  const listSelectDefinition = getListSelectDefinition(options, modelName);
  const queryConditions = getListQueryStr(options);
  const selectLine = listSelectDefinition ? '      select: listSelect,\n' : '';
  return `
import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Result } from 'src/common/response';
import { PrismaService } from 'src/prisma/prisma.service';
import { Create${Lodash.upperFirst(BusinessName)}Dto, Update${Lodash.upperFirst(BusinessName)}Dto, Query${Lodash.upperFirst(BusinessName)}Dto } from './dto/${businessName}.dto';
import { isEmpty } from 'src/common/utils';

@Injectable()
export class ${Lodash.upperFirst(BusinessName)}Service {
  constructor(private readonly prisma: PrismaService) {}

  async create(create${Lodash.upperFirst(BusinessName)}Dto: Create${Lodash.upperFirst(BusinessName)}Dto) {
    const res = await this.prisma.${delegateName}.create({
      data: create${Lodash.upperFirst(BusinessName)}Dto,
    });
    return Result.ok(res);
  }

  async findAll(query: Query${Lodash.upperFirst(BusinessName)}Dto) {
${listSelectDefinition || ''}    const where: Prisma.${modelName}WhereInput = {
      delFlag: '0',
    };
${queryConditions || ''}    const pageSize = Number(query.pageSize ?? 10);
    const pageNum = Number(query.pageNum ?? 1);
    const queryArgs: Prisma.${modelName}FindManyArgs = {
      where,
      skip: pageSize * (pageNum - 1),
      take: pageSize,
${selectLine}    };
    if (query.orderByColumn && query.isAsc) {
      queryArgs.orderBy = {
        [query.orderByColumn]: query.isAsc === 'ascending' ? 'asc' : 'desc',
      } as Prisma.${modelName}OrderByWithRelationInput;
    }
    const [list, total] = await this.prisma.$transaction([
      this.prisma.${delegateName}.findMany(queryArgs),
      this.prisma.${delegateName}.count({ where }),
    ]);

    return Result.ok({
      rows: list,
      total,
    });
  }

  async findOne(${primaryKey}: ${primaryKeyType}) {
    const res = await this.prisma.${delegateName}.findFirst({
      where: {
        delFlag: '0',
        ${primaryKey}: ${primaryKey},
      },
    });
    return Result.ok(res);
  }

  async update(update${Lodash.upperFirst(BusinessName)}Dto: Update${Lodash.upperFirst(BusinessName)}Dto) {
    const res = await this.prisma.${delegateName}.update({
      where: {
        ${primaryKey}: update${Lodash.upperFirst(BusinessName)}Dto.${primaryKey},
      },
      data: update${Lodash.upperFirst(BusinessName)}Dto,
    });
    return Result.ok({ value: Boolean(res) });
  }

  async remove(${primaryKey}s: ${primaryKeyType}[]) {
    const res = await this.prisma.${delegateName}.updateMany({
      where: {
        ${primaryKey}: {
          in: ${primaryKey}s,
        },
      },
      data: {
        delFlag: '1',
      },
    });
    return Result.ok({ value: res.count >= 1 });
  }
}`;
};

const getListSelectDefinition = (options, modelName) => {
  const { columns } = options;
  const fields = columns.filter((column) => column.isList == '1').map((column) => column.javaField);
  if (!fields.length) {
    return '';
  }
  return `    const listSelect: Prisma.${modelName}Select = {\n${fields.map((field) => `      ${field}: true,`).join('\n')}\n    };\n`;
};

const getListQueryStr = (options) => {
  const { columns } = options;
  const statements = columns
    .filter((column) => column.isQuery == '1')
    .map((column) => {
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
  return statements.join('');
};

const getPrimaryKeyType = (options) => {
  const { primaryKey, columns } = options;

  if (!primaryKey) {
    return 'string';
  }
  const primaryKeyColumn = columns.find((item) => item.javaField === primaryKey);
  return mapJavaTypeToTs(primaryKeyColumn?.javaType);
};

const lowercaseFirst = (str) => {
  if (!str) {
    return '';
  }
  return str.charAt(0).toLowerCase() + str.slice(1);
};

const mapJavaTypeToTs = (javaType = 'String') => {
  switch (javaType) {
    case 'Number':
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
