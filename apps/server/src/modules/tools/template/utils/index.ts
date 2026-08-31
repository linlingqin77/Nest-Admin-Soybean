/**
 * 模板工具导出
 *
 * 导出所有代码生成工具函数
 */

export { CodeFormatter, defaultFormatter, formatCode } from './code-formatter';
export type { CodeFormatterOptions } from './code-formatter';

export {
  toPascalCase,
  toCamelCase,
  toKebabCase,
  toSnakeCase,
  toUpperSnakeCase,
  isPascalCase,
  isCamelCase,
  isKebabCase,
  isSnakeCase,
  isUpperSnakeCase,
  generateFileName,
  generateClassName,
  generateVariableName,
} from './naming-converter';
