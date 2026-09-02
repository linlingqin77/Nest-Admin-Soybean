import * as Lodash from 'lodash';
import { assertIdentifier, escapeMultilineText } from '../../utils/sanitize';

interface ColumnInfo {
  javaField?: string;
  javaType?: string;
  columnComment?: string;
  isRequired?: string;
  isPk?: string;
}

interface EntityOptions {
  BusinessName: string;
  tableComment?: string;
  functionName?: string;
  columns?: ColumnInfo[];
  tenantAware?: boolean;
}

/**
 * NestJS Entity 模板生成器
 *
 * 生成符合项目规范的 Entity 代码，包含：
 * - JSDoc 注释
 * - 类型定义
 * - 多租户支持 (tenantId 字段)
 *
 * C5 安全修复：所有外部输入字符串在拼入模板前都通过
 * escapeMultilineText / assertIdentifier 做严格转义或校验，
 * 防止列注释/函数名/表注释中含特殊字符（如 ` * / $ \n {} ）破坏生成的 TS 代码或注入新代码。
 *
 * Requirements: 13.2, 13.11, 14.8
 */
export const entityTem = (options: EntityOptions) => {
  const { BusinessName, tableComment, functionName, columns, tenantAware = false } = options;

  // 安全：BusinessName 必须为合法标识符
  assertIdentifier(BusinessName, 'BusinessName');

  // 安全：functionName / tableComment 转义后用于注释/描述
  const safeFunctionName = escapeMultilineText(functionName ?? '');
  const safeTableComment = escapeMultilineText(tableComment ?? '');
  const safeBusinessName = escapeMultilineText(BusinessName);

  const className = Lodash.upperFirst(BusinessName);
  const contentTem = generateContent(options);

  // 检查是否有租户字段
  const hasTenantId = tenantAware || columns?.some((col: ColumnInfo) => col.javaField === 'tenantId');

  return `/**
 * ${safeFunctionName || safeTableComment || safeBusinessName} 实体类
 *
 * @description ${safeTableComment || safeFunctionName || safeBusinessName}的数据模型定义
 */
export class ${className}Entity {
${contentTem}
}

/**
 * ${safeFunctionName || safeTableComment || safeBusinessName} 创建参数类型
 */
export type Create${className}Input = Omit<${className}Entity, 'createTime' | 'updateTime'${hasTenantId ? '' : " | 'tenantId'"}>;

/**
 * ${safeFunctionName || safeTableComment || safeBusinessName} 更新参数类型
 */
export type Update${className}Input = Partial<${className}Entity>;
`;
};

/**
 * 生成实体内容
 */
const generateContent = (options: EntityOptions) => {
  const { columns } = options;
  if (!columns) return '';

  // 按主键排序，主键在前
  const sortedColumns = [...columns].sort((a: ColumnInfo, b: ColumnInfo) => {
    if (a.isPk === '1' && b.isPk !== '1') return -1;
    if (a.isPk !== '1' && b.isPk === '1') return 1;
    return 0;
  });

  return sortedColumns
    .map((column: ColumnInfo) => {
      const { javaType, javaField, columnComment, isRequired } = column;

      // 安全：javaField 必须为合法标识符
      assertIdentifier(javaField ?? '', 'javaField');

      const type = mapJavaTypeToTs(javaType);
      const optionalFlag = isRequired === '1' ? '' : '?';
      // 安全：columnComment 转义后用于 JSDoc 注释
      const comment = escapeMultilineText(columnComment || javaField || '');

      return `  /**
   * ${comment}
   */
  ${javaField}${optionalFlag}: ${type};
`;
    })
    .join('\n');
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
    case 'Double':
    case 'BigDecimal':
      return 'number';
    case 'Boolean':
      return 'boolean';
    case 'Date':
      return 'Date | string';
    case 'String':
    default:
      return 'string';
  }
};
