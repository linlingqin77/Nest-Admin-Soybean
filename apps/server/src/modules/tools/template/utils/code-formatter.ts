/**
 * 代码格式化工具
 *
 * 实现代码风格格式化功能
 * - 单引号
 * - 2空格缩进
 * - 尾随逗号
 * - 分号
 *
 * @modules utils/code-formatter
 */

export interface CodeFormatterOptions {
  /** 使用单引号 (默认: true) */
  singleQuote?: boolean;
  /** 缩进空格数 (默认: 2) */
  tabWidth?: number;
  /** 使用尾随逗号 (默认: true) */
  trailingComma?: boolean;
  /** 使用分号 (默认: true) */
  semi?: boolean;
  /** 行宽限制 (默认: 120) */
  printWidth?: number;
}

const DEFAULT_OPTIONS: Required<CodeFormatterOptions> = {
  singleQuote: true,
  tabWidth: 2,
  trailingComma: true,
  semi: true,
  printWidth: 120,
};

/**
 * 代码格式化器
 */
export class CodeFormatter {
  private options: Required<CodeFormatterOptions>;

  constructor(options: CodeFormatterOptions = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
  }

  /**
   * 格式化代码
   */
  format(code: string): string {
    let result = code;

    // 1. 处理引号
    if (this.options.singleQuote) {
      result = this.convertToSingleQuotes(result);
    }

    // 2. 处理缩进
    result = this.normalizeIndentation(result);

    // 3. 处理尾随逗号
    if (this.options.trailingComma) {
      result = this.addTrailingCommas(result);
    }

    // 4. 处理分号
    if (this.options.semi) {
      result = this.ensureSemicolons(result);
    }

    // 5. 清理多余空行
    result = this.cleanupEmptyLines(result);

    return result;
  }

  /**
   * 转换为单引号
   */
  private convertToSingleQuotes(code: string): string {
    // 保护模板字符串和正则表达式
    const protectedParts: string[] = [];
    let protectedCode = code;

    // 保护模板字符串
    protectedCode = protectedCode.replace(/`[^`]*`/g, (match) => {
      protectedParts.push(match);
      return `__PROTECTED_${protectedParts.length - 1}__`;
    });

    // 保护正则表达式
    protectedCode = protectedCode.replace(/\/[^/\n]+\/[gimsuvy]*/g, (match) => {
      protectedParts.push(match);
      return `__PROTECTED_${protectedParts.length - 1}__`;
    });

    // 转换双引号为单引号（排除已转义的引号）
    protectedCode = protectedCode.replace(/"([^"\\]*(\\.[^"\\]*)*)"/g, (match, content) => {
      // 如果内容包含单引号，保持双引号
      if (content.includes("'")) {
        return match;
      }
      return `'${content}'`;
    });

    // 恢复保护的部分
    protectedParts.forEach((part, index) => {
      protectedCode = protectedCode.replace(`__PROTECTED_${index}__`, part);
    });

    return protectedCode;
  }

  /**
   * 规范化缩进
   */
  private normalizeIndentation(code: string): string {
    const lines = code.split('\n');
    const tabWidth = this.options.tabWidth;

    return lines
      .map((line) => {
        // 计算当前缩进
        const match = line.match(/^(\s*)/);
        if (!match) return line;

        const indent = match[1];
        const content = line.slice(indent.length);

        // 将 tab 转换为空格
        const tabCount = (indent.match(/\t/g) || []).length;
        const spaceCount = indent.length - tabCount;

        // 计算总缩进级别
        const totalSpaces = tabCount * tabWidth + spaceCount;
        const indentLevel = Math.round(totalSpaces / tabWidth);

        // 生成新缩进
        const newIndent = ' '.repeat(indentLevel * tabWidth);

        return newIndent + content;
      })
      .join('\n');
  }

  /**
   * 添加尾随逗号
   */
  private addTrailingCommas(code: string): string {
    // 在数组和对象的最后一个元素后添加逗号
    // 匹配多行数组/对象的最后一个元素
    return code.replace(/([^\s,{[\n])(\s*\n\s*[}\]])/g, (match, lastChar, closing) => {
      // 排除注释和某些特殊情况
      if (lastChar === '/' || lastChar === '*') {
        return match;
      }
      return `${lastChar},${closing}`;
    });
  }

  /**
   * 确保语句末尾有分号
   */
  private ensureSemicolons(code: string): string {
    const lines = code.split('\n');

    return lines
      .map((line) => {
        const trimmed = line.trim();

        // 跳过空行、注释、特殊语句
        if (
          !trimmed ||
          trimmed.startsWith('//') ||
          trimmed.startsWith('/*') ||
          trimmed.startsWith('*') ||
          trimmed.endsWith('{') ||
          trimmed.endsWith('}') ||
          trimmed.endsWith(',') ||
          trimmed.endsWith(';') ||
          trimmed.endsWith(':') ||
          trimmed.startsWith('import ') ||
          trimmed.startsWith('export ') ||
          trimmed.startsWith('if ') ||
          trimmed.startsWith('else') ||
          trimmed.startsWith('for ') ||
          trimmed.startsWith('while ') ||
          trimmed.startsWith('switch ') ||
          trimmed.startsWith('case ') ||
          trimmed.startsWith('default:') ||
          trimmed.startsWith('try') ||
          trimmed.startsWith('catch') ||
          trimmed.startsWith('finally') ||
          trimmed.startsWith('@') ||
          trimmed.startsWith('<') ||
          trimmed.endsWith('>') ||
          trimmed.endsWith('(') ||
          trimmed.endsWith(')')
        ) {
          return line;
        }

        // 检查是否是需要分号的语句
        if (
          trimmed.startsWith('const ') ||
          trimmed.startsWith('let ') ||
          trimmed.startsWith('var ') ||
          trimmed.startsWith('return ') ||
          trimmed.startsWith('throw ') ||
          trimmed.startsWith('break') ||
          trimmed.startsWith('continue')
        ) {
          // 如果行末没有分号，添加分号
          if (!line.trimEnd().endsWith(';')) {
            return line.trimEnd() + ';';
          }
        }

        return line;
      })
      .join('\n');
  }

  /**
   * 清理多余空行
   */
  private cleanupEmptyLines(code: string): string {
    // 将连续的空行减少为最多两个
    return code.replace(/\n{3,}/g, '\n\n');
  }
}

/**
 * 创建默认格式化器实例
 */
export const defaultFormatter = new CodeFormatter();

/**
 * 格式化代码（使用默认选项）
 */
export function formatCode(code: string, options?: CodeFormatterOptions): string {
  const formatter = options ? new CodeFormatter(options) : defaultFormatter;
  return formatter.format(code);
}
