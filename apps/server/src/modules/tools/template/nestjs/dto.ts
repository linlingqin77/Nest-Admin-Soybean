import * as Lodash from 'lodash';
import { GenConstants } from 'src/shared/constants/gen.constant';
import { assertIdentifier, escapeMultilineText, escapeStringLiteral } from '../utils/sanitize';

interface ColumnInfo {
  javaField?: string;
  javaType?: string;
  columnComment?: string;
  columnType?: string;
  isRequired?: string;
  isPk?: string;
  isInsert?: string;
  isEdit?: string;
  isQuery?: string;
  isList?: string;
  queryType?: string;
  dictType?: string;
}

interface DtoOptions {
  BusinessName: string;
  functionName?: string;
  tableComment?: string;
  columns?: ColumnInfo[];
  primaryKey?: string;
}

/**
 * NestJS DTO 模板生成器
 *
 * 生成符合项目规范的 DTO 代码，包含：
 * - 完整的 @ApiProperty/@ApiPropertyOptional 装饰器
 * - class-validator 验证装饰器
 * - 继承 PageQueryDto 实现分页
 * - 响应 DTO 用于 Swagger 文档
 *
 * C5 安全修复：所有外部输入字符串在拼入模板前都通过
 * escapeStringLiteral / escapeMultilineText 做严格转义，
 * 防止列注释/函数名/表注释中含特殊字符破坏生成的 TS 代码。
 *
 * Requirements: 13.5, 13.6, 15.4, 15.5, 15.6
 */
export const dtoTem = (options: DtoOptions) => {
  const { BusinessName, functionName, tableComment, columns, primaryKey } = options;

  // 安全：BusinessName 必须为合法标识符
  assertIdentifier(BusinessName, 'BusinessName');

  // 安全：functionName / tableComment 转义后用于注释
  const safeFunctionName = escapeMultilineText(functionName ?? '');
  const safeTableComment = escapeMultilineText(tableComment ?? '');
  const safeBusinessName = escapeMultilineText(BusinessName);

  const className = Lodash.upperFirst(BusinessName);

  const baseFields = generateBaseFields(options);
  const createFields = generateCreateFields(options);
  const updateFields = generateUpdateFields(options);
  const queryFields = generateQueryFields(options);
  const responseFields = generateResponseFields(options);

  return `import {
  IsString,
  IsNumber,
  IsBoolean,
  IsOptional,
  IsNotEmpty,
  IsEnum,
  IsArray,
  IsInt,
  Min,
  Max,
  MinLength,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PageQueryDto } from 'src/shared/dto';
import { Type } from 'class-transformer';

/**
 * ${safeFunctionName || safeTableComment || safeBusinessName} 基础 DTO
 */
export class Base${className}Dto {
${baseFields}
}

/**
 * 创建${safeFunctionName || safeTableComment || safeBusinessName} DTO
 */
export class Create${className}Dto {
${createFields}
}

/**
 * 更新${safeFunctionName || safeTableComment || safeBusinessName} DTO
 */
export class Update${className}Dto {
${updateFields}
}

/**
 * 查询${safeFunctionName || safeTableComment || safeBusinessName} DTO
 */
export class Query${className}Dto extends PageQueryDto {
${queryFields}
}

/**
 * ${safeFunctionName || safeTableComment || safeBusinessName} 响应 DTO
 */
export class ${className}ResponseDto {
${responseFields}
}

/**
 * ${safeFunctionName || safeTableComment || safeBusinessName} 列表响应 DTO
 */
export class ${className}ListResponseDto {
  @ApiProperty({ description: '数据列表', type: [${className}ResponseDto] })
  rows: ${className}ResponseDto[];

  @ApiProperty({ description: '总记录数', example: 100 })
  total: number;

  @ApiProperty({ description: '当前页码', example: 1 })
  pageNum: number;

  @ApiProperty({ description: '每页条数', example: 10 })
  pageSize: number;

  @ApiProperty({ description: '总页数', example: 10 })
  pages: number;
}
`;
};

const generateBaseFields = (options: DtoOptions) => {
  const { columns } = options;
  if (!columns) return '';
  return columns
    .map((column: ColumnInfo) => {
      const { javaType, javaField, isRequired, columnComment, columnType, queryType, dictType } = column;
      // 安全：javaField 必须为合法标识符
      assertIdentifier(javaField ?? '', 'javaField');
      const tsType = getTsType(javaType, queryType);
      // 安全：comment 用于单引号字符串，必须转义单引号
      const comment = escapeStringLiteral(getCleanComment(columnComment));
      const decorators: string[] = [];
      const apiPropertyOptions: string[] = [];
      apiPropertyOptions.push(`description: '${comment}'`);
      if (columnType === 'char' && dictType) {
        apiPropertyOptions.push(`enum: ['0', '1']`);
      }
      if (isRequired === '1') {
        decorators.push(`  @ApiProperty({ ${apiPropertyOptions.join(', ')} })`);
      } else {
        decorators.push(`  @ApiPropertyOptional({ ${apiPropertyOptions.join(', ')} })`);
        decorators.push(`  @IsOptional()`);
      }
      decorators.push(`  ${getValidatorDecorator(javaType, queryType)}`);
      const optionalFlag = isRequired === '1' ? '' : '?';
      return `${decorators.join('\n')}\n  ${javaField}${optionalFlag}: ${tsType};\n`;
    })
    .join('\n');
};

const generateCreateFields = (options: DtoOptions) => {
  const { columns } = options;
  if (!columns) return '';
  return columns
    .filter((column: ColumnInfo) => column.isInsert === '1' && column.isPk !== '1')
    .map((column: ColumnInfo) => {
      const { javaType, javaField, isRequired, columnComment, columnType, queryType, dictType } = column;
      // 安全：javaField 必须为合法标识符
      assertIdentifier(javaField ?? '', 'javaField');
      const tsType = getTsType(javaType, queryType);
      // 安全：comment 用于单引号字符串，必须转义单引号
      const comment = escapeStringLiteral(getCleanComment(columnComment));
      const decorators: string[] = [];
      const apiPropertyOptions: string[] = [];
      apiPropertyOptions.push(`description: '${comment}'`);
      apiPropertyOptions.push(`example: ${getExampleValue(javaType, javaField)}`);
      if (columnType === 'char' && dictType) {
        apiPropertyOptions.push(`enum: ['0', '1']`);
      }
      if (isRequired === '1') {
        decorators.push(`  @ApiProperty({ ${apiPropertyOptions.join(', ')} })`);
        decorators.push(`  @IsNotEmpty({ message: '${comment}不能为空' })`);
      } else {
        decorators.push(`  @ApiPropertyOptional({ ${apiPropertyOptions.join(', ')} })`);
        decorators.push(`  @IsOptional()`);
      }
      decorators.push(`  ${getValidatorDecorator(javaType, queryType)}`);
      const optionalFlag = isRequired === '1' ? '' : '?';
      return `${decorators.join('\n')}\n  ${javaField}${optionalFlag}: ${tsType};\n`;
    })
    .join('\n');
};

const generateUpdateFields = (options: DtoOptions) => {
  const { columns, primaryKey } = options;
  if (!columns) return '';
  const pkColumn = columns.find((col: ColumnInfo) => col.isPk === '1');
  let result = '';
  if (pkColumn) {
    const pkType = getTsType(pkColumn.javaType, pkColumn.queryType);
    // 安全：pkComment 用于单引号字符串
    const pkComment = escapeStringLiteral(getCleanComment(pkColumn.columnComment));
    // 安全：primaryKey 必须为合法标识符
    assertIdentifier(primaryKey ?? '', 'primaryKey');
    result += `  @ApiProperty({ description: '${pkComment}', example: 1 })\n`;
    result += `  @IsNotEmpty({ message: '${pkComment}不能为空' })\n`;
    result += `  ${getValidatorDecorator(pkColumn.javaType, pkColumn.queryType)}\n`;
    result += `  ${primaryKey}: ${pkType};\n\n`;
  }
  result += columns
    .filter((column: ColumnInfo) => column.isEdit === '1' && column.isPk !== '1')
    .map((column: ColumnInfo) => {
      const { javaType, javaField, columnComment, columnType, queryType, dictType } = column;
      // 安全：javaField 必须为合法标识符
      assertIdentifier(javaField ?? '', 'javaField');
      const tsType = getTsType(javaType, queryType);
      // 安全：comment 用于单引号字符串
      const comment = escapeStringLiteral(getCleanComment(columnComment));
      const decorators: string[] = [];
      const apiPropertyOptions: string[] = [];
      apiPropertyOptions.push(`description: '${comment}'`);
      apiPropertyOptions.push(`example: ${getExampleValue(javaType, javaField)}`);
      if (columnType === 'char' && dictType) {
        apiPropertyOptions.push(`enum: ['0', '1']`);
      }
      decorators.push(`  @ApiPropertyOptional({ ${apiPropertyOptions.join(', ')} })`);
      decorators.push(`  @IsOptional()`);
      decorators.push(`  ${getValidatorDecorator(javaType, queryType)}`);
      return `${decorators.join('\n')}\n  ${javaField}?: ${tsType};\n`;
    })
    .join('\n');
  return result;
};

const generateQueryFields = (options: DtoOptions) => {
  const { columns } = options;
  if (!columns) return '';
  return columns
    .filter((column: ColumnInfo) => column.isQuery === '1')
    .map((column: ColumnInfo) => {
      const { javaType, javaField, columnComment, queryType, dictType } = column;
      // 安全：javaField 必须为合法标识符
      assertIdentifier(javaField ?? '', 'javaField');
      const tsType = getTsType(javaType, queryType);
      // 安全：comment 用于单引号字符串
      const comment = escapeStringLiteral(getCleanComment(columnComment));
      const decorators: string[] = [];
      const apiPropertyOptions: string[] = [];
      apiPropertyOptions.push(`description: '${comment}'`);
      if (dictType) {
        apiPropertyOptions.push(`enum: ['0', '1']`);
      }
      decorators.push(`  @ApiPropertyOptional({ ${apiPropertyOptions.join(', ')} })`);
      decorators.push(`  @IsOptional()`);
      decorators.push(`  ${getValidatorDecorator(javaType, queryType)}`);
      return `${decorators.join('\n')}\n  ${javaField}?: ${tsType};\n`;
    })
    .join('\n');
};

const generateResponseFields = (options: DtoOptions) => {
  const { columns } = options;
  if (!columns) return '';
  return columns
    .filter((column: ColumnInfo) => column.isList === '1' || column.isPk === '1')
    .map((column: ColumnInfo) => {
      const { javaType, javaField, columnComment, queryType, dictType } = column;
      // 安全：javaField 必须为合法标识符
      assertIdentifier(javaField ?? '', 'javaField');
      const tsType = getTsType(javaType, queryType);
      // 安全：comment 用于单引号字符串
      const comment = escapeStringLiteral(getCleanComment(columnComment));
      const apiPropertyOptions: string[] = [];
      apiPropertyOptions.push(`description: '${comment}'`);
      apiPropertyOptions.push(`example: ${getExampleValue(javaType, javaField)}`);
      if (dictType) {
        apiPropertyOptions.push(`enum: ['0', '1']`);
      }
      return `  @ApiProperty({ ${apiPropertyOptions.join(', ')} })\n  ${javaField}: ${tsType};\n`;
    })
    .join('\n');
};

const getCleanComment = (comment?: string) => {
  if (!comment) return '';
  const idx1 = comment.indexOf('（');
  if (idx1 !== -1) return comment.substring(0, idx1);
  const idx2 = comment.indexOf('(');
  if (idx2 !== -1) return comment.substring(0, idx2);
  return comment;
};

const getTsType = (javaType?: string, queryType?: string) => {
  if (javaType === 'Date') {
    return queryType === GenConstants.QUERY_BETWEEN ? 'string[]' : 'string';
  }
  switch (javaType) {
    case 'Number':
    case 'Integer':
    case 'Long':
    case 'Double':
    case 'BigDecimal':
      return 'number';
    case 'Boolean':
      return 'boolean';
    case 'String':
    default:
      return 'string';
  }
};

const getValidatorDecorator = (javaType?: string, queryType?: string) => {
  switch (javaType) {
    case 'String':
      return '@IsString()';
    case 'Number':
    case 'Integer':
    case 'Long':
      return '@IsNumber()\n  @Type(() => Number)';
    case 'Double':
    case 'BigDecimal':
      return '@IsNumber()\n  @Type(() => Number)';
    case 'Boolean':
      return '@IsBoolean()';
    case 'Date':
      return queryType === GenConstants.QUERY_BETWEEN ? '@IsArray()\n  @IsString({ each: true })' : '@IsString()';
    default:
      return '@IsString()';
  }
};

const getExampleValue = (javaType?: string, fieldName?: string) => {
  switch (javaType) {
    case 'Number':
    case 'Integer':
    case 'Long':
      return '1';
    case 'Double':
    case 'BigDecimal':
      return '0.00';
    case 'Boolean':
      return 'true';
    case 'Date':
      return "'2025-01-01 00:00:00'";
    case 'String':
    default:
      if (fieldName?.toLowerCase().includes('name')) return "'示例名称'";
      if (fieldName?.toLowerCase().includes('status')) return "'0'";
      if (fieldName?.toLowerCase().includes('remark')) return "'备注信息'";
      return "'示例值'";
  }
};
