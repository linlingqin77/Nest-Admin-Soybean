/**
 * 命名转换工具
 *
 * 实现各种命名规范之间的转换
 * - PascalCase (大驼峰)
 * - camelCase (小驼峰)
 * - kebab-case (短横线)
 * - snake_case (下划线)
 * - UPPER_SNAKE_CASE (大写下划线)
 *
 * @modules utils/naming-converter
 */

/**
 * 将字符串转换为 PascalCase (大驼峰)
 *
 * @example
 * toPascalCase('user_name') // 'UserName'
 * toPascalCase('user-name') // 'UserName'
 * toPascalCase('userName') // 'UserName'
 */
export function toPascalCase(str: string): string {
  if (!str) return '';

  // 先将字符串分割成单词
  const words = splitIntoWords(str);

  // 每个单词首字母大写
  return words.map((word) => capitalize(word)).join('');
}

/**
 * 将字符串转换为 camelCase (小驼峰)
 *
 * @example
 * toCamelCase('user_name') // 'userName'
 * toCamelCase('user-name') // 'userName'
 * toCamelCase('UserName') // 'userName'
 */
export function toCamelCase(str: string): string {
  if (!str) return '';

  const pascal = toPascalCase(str);
  return pascal.charAt(0).toLowerCase() + pascal.slice(1);
}

/**
 * 将字符串转换为 kebab-case (短横线)
 *
 * @example
 * toKebabCase('userName') // 'user-name'
 * toKebabCase('UserName') // 'user-name'
 * toKebabCase('user_name') // 'user-name'
 */
export function toKebabCase(str: string): string {
  if (!str) return '';

  const words = splitIntoWords(str);
  return words.map((word) => word.toLowerCase()).join('-');
}

/**
 * 将字符串转换为 snake_case (下划线)
 *
 * @example
 * toSnakeCase('userName') // 'user_name'
 * toSnakeCase('UserName') // 'user_name'
 * toSnakeCase('user-name') // 'user_name'
 */
export function toSnakeCase(str: string): string {
  if (!str) return '';

  const words = splitIntoWords(str);
  return words.map((word) => word.toLowerCase()).join('_');
}

/**
 * 将字符串转换为 UPPER_SNAKE_CASE (大写下划线)
 *
 * @example
 * toUpperSnakeCase('userName') // 'USER_NAME'
 * toUpperSnakeCase('UserName') // 'USER_NAME'
 * toUpperSnakeCase('user-name') // 'USER_NAME'
 */
export function toUpperSnakeCase(str: string): string {
  if (!str) return '';

  const words = splitIntoWords(str);
  return words.map((word) => word.toUpperCase()).join('_');
}

/**
 * 将字符串分割成单词数组
 */
function splitIntoWords(str: string): string[] {
  if (!str) return [];

  // 处理各种分隔符和大小写边界
  return (
    str
      // 在大写字母前插入空格（处理 camelCase 和 PascalCase）
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      // 在连续大写字母和小写字母之间插入空格（处理 XMLParser -> XML Parser）
      .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
      // 将分隔符替换为空格
      .replace(/[-_]/g, ' ')
      // 分割并过滤空字符串
      .split(/\s+/)
      .filter((word) => word.length > 0)
  );
}

/**
 * 首字母大写
 */
function capitalize(str: string): string {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

/**
 * 验证是否为 PascalCase
 */
export function isPascalCase(str: string): boolean {
  if (!str) return false;
  return /^[A-Z][a-zA-Z0-9]*$/.test(str);
}

/**
 * 验证是否为 camelCase
 */
export function isCamelCase(str: string): boolean {
  if (!str) return false;
  return /^[a-z][a-zA-Z0-9]*$/.test(str);
}

/**
 * 验证是否为 kebab-case
 */
export function isKebabCase(str: string): boolean {
  if (!str) return false;
  return /^[a-z][a-z0-9]*(-[a-z0-9]+)*$/.test(str);
}

/**
 * 验证是否为 snake_case
 */
export function isSnakeCase(str: string): boolean {
  if (!str) return false;
  return /^[a-z][a-z0-9]*(_[a-z0-9]+)*$/.test(str);
}

/**
 * 验证是否为 UPPER_SNAKE_CASE
 */
export function isUpperSnakeCase(str: string): boolean {
  if (!str) return false;
  return /^[A-Z][A-Z0-9]*(_[A-Z0-9]+)*$/.test(str);
}

/**
 * 生成文件名
 *
 * @param name 基础名称
 * @param type 文件类型 ('component' | 'service' | 'modules' | 'controller' | 'dto' | 'entity')
 * @param extension 文件扩展名
 */
export function generateFileName(
  name: string,
  type: 'component' | 'service' | 'modules' | 'controller' | 'dto' | 'entity' | 'api',
  extension: string = 'ts',
): string {
  const baseName = toKebabCase(name);

  switch (type) {
    case 'component':
      // Vue 组件使用 PascalCase
      return `${toPascalCase(name)}.vue`;
    case 'service':
      return `${baseName}.service.${extension}`;
    case 'modules':
      return `${baseName}.modules.${extension}`;
    case 'controller':
      return `${baseName}.controller.${extension}`;
    case 'dto':
      return `${baseName}.dto.${extension}`;
    case 'entity':
      return `${baseName}.entity.${extension}`;
    case 'api':
      return `${baseName}.${extension}`;
    default:
      return `${baseName}.${extension}`;
  }
}

/**
 * 生成类名
 *
 * @param name 基础名称
 * @param suffix 后缀 ('Service' | 'Controller' | 'Module' | 'Dto' | 'Entity')
 */
export function generateClassName(
  name: string,
  suffix: 'Service' | 'Controller' | 'Module' | 'Dto' | 'Entity' | '',
): string {
  const baseName = toPascalCase(name);
  return `${baseName}${suffix}`;
}

/**
 * 生成变量名
 *
 * @param name 基础名称
 * @param suffix 后缀
 */
export function generateVariableName(name: string, suffix: string = ''): string {
  const baseName = toCamelCase(name);
  return suffix ? `${baseName}${toPascalCase(suffix)}` : baseName;
}
