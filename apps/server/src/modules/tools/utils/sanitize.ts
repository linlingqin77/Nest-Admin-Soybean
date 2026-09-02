/**
 * 代码生成模板安全工具
 *
 * 用于把所有"不可信"的数据库/用户输入字符串在拼入生成代码前做严格校验或转义，
 * 防止：
 * - 模板注入 RCE（数据库列注释 / 表注释 / 函数名 中含特殊字符破坏生成的 TS/Vue 代码）
 * - 标识符注入（Prisma.sql / Prisma.identifier 校验）
 *
 * 所有模板文件必须使用这里的 sanitize 函数处理任何外部来源的字符串。
 */

/** 严格合法标识符（字母、数字、下划线、首字符不能为数字） */
const IDENTIFIER_REGEX = /^[a-zA-Z_][a-zA-Z0-9_]*$/;

/** 安全字符串字符白名单 —— 允许常见中文/英文/数字 + 基本标点（不包含 ` ' " \ 换行 { } */
const SAFE_TEXT_REGEX = /^[^\n\r"'`\\{}<>*?&|;$()[\]\\]*$/;

/**
 * 校验字符串是否为合法标识符（变量名、表名、列名、权限码等）
 */
export function isValidIdentifier(value: string): boolean {
  return typeof value === 'string' && value.length > 0 && value.length <= 64 && IDENTIFIER_REGEX.test(value);
}

/**
 * 断言 value 是合法标识符，否则抛错。
 * 用于模板生成时强校验 —— 直接拒绝生成，而不是生成坏代码。
 */
export function assertIdentifier(value: string, fieldName: string): string {
  if (!isValidIdentifier(value)) {
    throw new Error(
      `代码生成失败：${fieldName} "${value}" 不是合法的标识符（仅允许字母/数字/下划线，且首字符不能是数字）`,
    );
  }
  return value;
}

/**
 * 把任意字符串转义成安全的 TypeScript/Vue 字符串字面量内容
 *
 * 用于 `@ApiTags('${...}')`、注释、`description` 等插值位置。
 * 转义：反斜线、单引号、双引号、反引号、控制字符、TS 模板占位 ${}。
 */
export function escapeStringLiteral(value: string): string {
  if (value === undefined || value === null) return '';
  return String(value)
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "\\'")
    .replace(/"/g, '\\"')
    .replace(/`/g, '\\`')
    .replace(/\$/g, '\\$')
    .replace(/\r/g, '\\r')
    .replace(/\n/g, '\\n')
    .replace(/\t/g, '\\t');
}

/**
 * 多行注释/字符串块的转义 —— 保留换行（用于 description、JSDoc、SQL 模板等）
 */
export function escapeMultilineText(value: string): string {
  if (value === undefined || value === null) return '';
  return String(value).replace(/\\/g, '\\\\').replace(/\*\//g, '* /').replace(/\$/g, '\\$');
}

/**
 * 校验并截断安全文本（用于权限码/功能名/模块名等需要标识符或纯字母数字下划线连字符的场景）
 * 不符合规则直接抛错，让代码生成器尽早失败而非生成可注入的代码。
 */
export function assertSafeText(value: string, fieldName: string, maxLength = 100): string {
  if (value === undefined || value === null) return '';
  const trimmed = String(value).trim();
  if (trimmed.length === 0) return '';
  if (trimmed.length > maxLength) {
    throw new Error(`代码生成失败：${fieldName} 长度超过 ${maxLength}`);
  }
  if (!SAFE_TEXT_REGEX.test(trimmed)) {
    throw new Error(`代码生成失败：${fieldName} 含有不允许的特殊字符（反引号、引号、反斜线、花括号、换行等）`);
  }
  return trimmed;
}
