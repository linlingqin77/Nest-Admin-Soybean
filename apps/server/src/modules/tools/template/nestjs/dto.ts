import * as Lodash from 'lodash';
import { GenConstants } from 'src/shared/constants/gen.constant';

/**
 * NestJS DTO 模板生成器
 *
 * 生成符合项目规范的 DTO 代码，包含：
 * - 完整的 @ApiProperty/@ApiPropertyOptional 装饰器
 * - class-validator 验证装饰器
 * - 继承 PageQueryDto 实现分页
 * - 响应 DTO 用于 Swagger 文档
 *
 * Requirements: 13.5, 13.6, 15.4, 15.5, 15.6
 */
export const dtoTem = (options) => {
  const { BusinessName, functionName, tableComment, columns, primaryKey } = options;
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
 * ${functionName || tableComment || BusinessName} 基础 DTO
 */
export class Base${className}Dto {
${baseFields}
}

/**
 * 创建${functionName || tableComment || BusinessName} DTO
 */
export class Create${className}Dto {
${createFields}
}

/**
 * 更新${functionName || tableComment || BusinessName} DTO
 */
export class Update${className}Dto {
${updateFields}
}

/**
 * 查询${functionName || tableComment || BusinessName} DTO
 */
export class Query${className}Dto extends PageQueryDto {
${queryFields}
}

/**
 * ${functionName || tableComment || BusinessName} 响应 DTO
 */
export class ${className}ResponseDto {
${responseFields}
}

/**
 * ${functionName || tableComment || BusinessName} 列表响应 DTO
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

const generateBaseFields = (options) => {
  const { columns } = options;
  if (!columns) return '';
  return columns
    .map((column) => {
      const { javaType, javaField, isRequired, columnComment, columnType, queryType, dictType } = column;
      const tsType = getTsType(javaType, queryType);
      const comment = getCleanComment(columnComment);
      const decorators = [];
      const apiPropertyOptions = [];
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

const generateCreateFields = (options) => {
  const { columns } = options;
  if (!columns) return '';
  return columns
    .filter((column) => column.isInsert === '1' && column.isPk !== '1')
    .map((column) => {
      const { javaType, javaField, isRequired, columnComment, columnType, queryType, dictType } = column;
      const tsType = getTsType(javaType, queryType);
      const comment = getCleanComment(columnComment);
      const decorators = [];
      const apiPropertyOptions = [];
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

const generateUpdateFields = (options) => {
  const { columns, primaryKey } = options;
  if (!columns) return '';
  const pkColumn = columns.find((col) => col.isPk === '1');
  let result = '';
  if (pkColumn) {
    const pkType = getTsType(pkColumn.javaType, pkColumn.queryType);
    const pkComment = getCleanComment(pkColumn.columnComment);
    result += `  @ApiProperty({ description: '${pkComment}', example: 1 })\n`;
    result += `  @IsNotEmpty({ message: '${pkComment}不能为空' })\n`;
    result += `  ${getValidatorDecorator(pkColumn.javaType, pkColumn.queryType)}\n`;
    result += `  ${primaryKey}: ${pkType};\n\n`;
  }
  result += columns
    .filter((column) => column.isEdit === '1' && column.isPk !== '1')
    .map((column) => {
      const { javaType, javaField, columnComment, columnType, queryType, dictType } = column;
      const tsType = getTsType(javaType, queryType);
      const comment = getCleanComment(columnComment);
      const decorators = [];
      const apiPropertyOptions = [];
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

const generateQueryFields = (options) => {
  const { columns } = options;
  if (!columns) return '';
  return columns
    .filter((column) => column.isQuery === '1')
    .map((column) => {
      const { javaType, javaField, columnComment, queryType, dictType } = column;
      const tsType = getTsType(javaType, queryType);
      const comment = getCleanComment(columnComment);
      const decorators = [];
      const apiPropertyOptions = [];
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

const generateResponseFields = (options) => {
  const { columns } = options;
  if (!columns) return '';
  return columns
    .filter((column) => column.isList === '1' || column.isPk === '1')
    .map((column) => {
      const { javaType, javaField, columnComment, queryType, dictType } = column;
      const tsType = getTsType(javaType, queryType);
      const comment = getCleanComment(columnComment);
      const apiPropertyOptions = [];
      apiPropertyOptions.push(`description: '${comment}'`);
      apiPropertyOptions.push(`example: ${getExampleValue(javaType, javaField)}`);
      if (dictType) {
        apiPropertyOptions.push(`enum: ['0', '1']`);
      }
      return `  @ApiProperty({ ${apiPropertyOptions.join(', ')} })\n  ${javaField}: ${tsType};\n`;
    })
    .join('\n');
};

const getCleanComment = (comment) => {
  if (!comment) return '';
  const idx1 = comment.indexOf('（');
  if (idx1 !== -1) return comment.substring(0, idx1);
  const idx2 = comment.indexOf('(');
  if (idx2 !== -1) return comment.substring(0, idx2);
  return comment;
};

const getTsType = (javaType, queryType) => {
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

const getValidatorDecorator = (javaType, queryType) => {
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

const getExampleValue = (javaType, fieldName) => {
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
      if (fieldName.toLowerCase().includes('name')) return "'示例名称'";
      if (fieldName.toLowerCase().includes('status')) return "'0'";
      if (fieldName.toLowerCase().includes('remark')) return "'备注信息'";
      return "'示例值'";
  }
};
