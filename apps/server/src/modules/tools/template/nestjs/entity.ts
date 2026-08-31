import * as Lodash from 'lodash';

/**
 * NestJS Entity 模板生成器
 *
 * 生成符合项目规范的 Entity 代码，包含：
 * - JSDoc 注释
 * - 类型定义
 * - 多租户支持 (tenantId 字段)
 *
 * Requirements: 13.2, 13.11, 14.8
 */
export const entityTem = (options) => {
  const { BusinessName, tableComment, functionName, columns, tenantAware = false } = options;
  const className = Lodash.upperFirst(BusinessName);
  const contentTem = generateContent(options);

  // 检查是否有租户字段
  const hasTenantId = tenantAware || columns?.some((col) => col.javaField === 'tenantId');

  return `/**
 * ${functionName || tableComment || BusinessName} 实体类
 *
 * @description ${tableComment || functionName || BusinessName}的数据模型定义
 */
export class ${className}Entity {
${contentTem}
}

/**
 * ${functionName || tableComment || BusinessName} 创建参数类型
 */
export type Create${className}Input = Omit<${className}Entity, 'createTime' | 'updateTime'${hasTenantId ? '' : " | 'tenantId'"}>;

/**
 * ${functionName || tableComment || BusinessName} 更新参数类型
 */
export type Update${className}Input = Partial<${className}Entity>;
`;
};

/**
 * 生成实体内容
 */
const generateContent = (options) => {
  const { columns } = options;
  if (!columns) return '';

  // 按主键排序，主键在前
  const sortedColumns = [...columns].sort((a, b) => {
    if (a.isPk === '1' && b.isPk !== '1') return -1;
    if (a.isPk !== '1' && b.isPk === '1') return 1;
    return 0;
  });

  return sortedColumns
    .map((column) => {
      const { javaType, javaField, columnComment, isRequired } = column;
      const type = mapJavaTypeToTs(javaType);
      const optionalFlag = isRequired === '1' ? '' : '?';
      const comment = columnComment || javaField;

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
