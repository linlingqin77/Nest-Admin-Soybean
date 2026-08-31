/**
 * 代码风格属性测试
 *
 * Property 11: 生成代码遵循代码风格
 * **Validates: Requirements 14.1-14.4**
 */
import * as fc from 'fast-check';
import {
  CodeFormatter,
  formatCode,
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
} from '@/modules/tools/template/utils';

describe('Code Style - Property Tests', () => {
  /**
   * 生成有效的标识符
   */
  const validIdentifierArbitrary = fc
    .string({ minLength: 1, maxLength: 30 })
    .filter((s) => /^[a-zA-Z][a-zA-Z0-9]*$/.test(s));

  /**
   * 生成有效的多单词标识符
   */
  const multiWordIdentifierArbitrary = fc
    .array(
      fc.string({ minLength: 1, maxLength: 10 }).filter((s) => /^[a-zA-Z]+$/.test(s)),
      { minLength: 1, maxLength: 5 },
    )
    .map((words) => words.join('_'));

  describe('Property 11: 生成代码遵循代码风格', () => {
    describe('11.1: 命名转换一致性', () => {
      /**
       * **Validates: Requirements 14.5**
       *
       * *For any* valid identifier, toPascalCase should produce a valid PascalCase string.
       */
      it('toPascalCase should produce valid PascalCase', () => {
        fc.assert(
          fc.property(multiWordIdentifierArbitrary, (input) => {
            const result = toPascalCase(input);

            // 结果应该是有效的 PascalCase
            expect(isPascalCase(result)).toBe(true);

            // 结果首字母应该大写
            expect(result.charAt(0)).toBe(result.charAt(0).toUpperCase());

            return true;
          }),
          { numRuns: 100 },
        );
      });

      /**
       * **Validates: Requirements 14.5**
       *
       * *For any* valid identifier, toCamelCase should produce a valid camelCase string.
       */
      it('toCamelCase should produce valid camelCase', () => {
        fc.assert(
          fc.property(multiWordIdentifierArbitrary, (input) => {
            const result = toCamelCase(input);

            // 结果应该是有效的 camelCase
            expect(isCamelCase(result)).toBe(true);

            // 结果首字母应该小写
            expect(result.charAt(0)).toBe(result.charAt(0).toLowerCase());

            return true;
          }),
          { numRuns: 100 },
        );
      });

      /**
       * **Validates: Requirements 14.6**
       *
       * *For any* valid identifier, toKebabCase should produce a valid kebab-case string.
       */
      it('toKebabCase should produce valid kebab-case', () => {
        fc.assert(
          fc.property(multiWordIdentifierArbitrary, (input) => {
            const result = toKebabCase(input);

            // 结果应该是有效的 kebab-case
            expect(isKebabCase(result)).toBe(true);

            // 结果应该全小写
            expect(result).toBe(result.toLowerCase());

            // 结果不应该包含下划线
            expect(result).not.toContain('_');

            return true;
          }),
          { numRuns: 100 },
        );
      });

      /**
       * **Validates: Requirements 14.5**
       *
       * *For any* valid identifier, toSnakeCase should produce a valid snake_case string.
       */
      it('toSnakeCase should produce valid snake_case', () => {
        fc.assert(
          fc.property(multiWordIdentifierArbitrary, (input) => {
            const result = toSnakeCase(input);

            // 结果应该是有效的 snake_case
            expect(isSnakeCase(result)).toBe(true);

            // 结果应该全小写
            expect(result).toBe(result.toLowerCase());

            // 结果不应该包含短横线
            expect(result).not.toContain('-');

            return true;
          }),
          { numRuns: 100 },
        );
      });

      /**
       * **Validates: Requirements 14.5**
       *
       * *For any* valid identifier, toUpperSnakeCase should produce a valid UPPER_SNAKE_CASE string.
       */
      it('toUpperSnakeCase should produce valid UPPER_SNAKE_CASE', () => {
        fc.assert(
          fc.property(multiWordIdentifierArbitrary, (input) => {
            const result = toUpperSnakeCase(input);

            // 结果应该是有效的 UPPER_SNAKE_CASE
            expect(isUpperSnakeCase(result)).toBe(true);

            // 结果应该全大写
            expect(result).toBe(result.toUpperCase());

            return true;
          }),
          { numRuns: 100 },
        );
      });
    });

    describe('11.2: 命名转换往返', () => {
      /**
       * **Validates: Requirements 14.5, 14.6**
       *
       * *For any* PascalCase string, converting to kebab-case and back should preserve the original.
       * Note: Single-letter words lose case information, so we use multi-letter words.
       */
      it('PascalCase -> kebab-case -> PascalCase should be idempotent', () => {
        fc.assert(
          fc.property(
            fc.array(
              // 使用至少2个字符的单词，避免单字母大小写信息丢失
              fc.string({ minLength: 2, maxLength: 10 }).filter((s) => /^[a-zA-Z]+$/.test(s)),
              { minLength: 1, maxLength: 5 },
            ),
            (words) => {
              const original = words.map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join('');
              const kebab = toKebabCase(original);
              const restored = toPascalCase(kebab);

              expect(restored).toBe(original);

              return true;
            },
          ),
          { numRuns: 100 },
        );
      });

      /**
       * **Validates: Requirements 14.5**
       *
       * *For any* camelCase string, converting to snake_case and back should preserve the original.
       * Note: Single-letter words lose case information, so we use multi-letter words.
       */
      it('camelCase -> snake_case -> camelCase should be idempotent', () => {
        fc.assert(
          fc.property(
            fc.array(
              // 使用至少2个字符的单词，避免单字母大小写信息丢失
              fc.string({ minLength: 2, maxLength: 10 }).filter((s) => /^[a-zA-Z]+$/.test(s)),
              { minLength: 1, maxLength: 5 },
            ),
            (words) => {
              const original =
                words[0].toLowerCase() +
                words
                  .slice(1)
                  .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
                  .join('');
              const snake = toSnakeCase(original);
              const restored = toCamelCase(snake);

              expect(restored).toBe(original);

              return true;
            },
          ),
          { numRuns: 100 },
        );
      });
    });

    describe('11.3: 文件名生成', () => {
      /**
       * **Validates: Requirements 14.6**
       *
       * *For any* valid name, generated service file name should be kebab-case.
       */
      it('service file names should be kebab-case', () => {
        fc.assert(
          fc.property(validIdentifierArbitrary, (name) => {
            const fileName = generateFileName(name, 'service');

            // 文件名应该以 .service.ts 结尾
            expect(fileName).toMatch(/\.service\.ts$/);

            // 基础名称应该是 kebab-case
            const baseName = fileName.replace('.service.ts', '');
            expect(isKebabCase(baseName)).toBe(true);

            return true;
          }),
          { numRuns: 100 },
        );
      });

      /**
       * **Validates: Requirements 14.7**
       *
       * *For any* valid name, generated component file name should be PascalCase.
       */
      it('component file names should be PascalCase', () => {
        fc.assert(
          fc.property(validIdentifierArbitrary, (name) => {
            const fileName = generateFileName(name, 'component');

            // 文件名应该以 .vue 结尾
            expect(fileName).toMatch(/\.vue$/);

            // 基础名称应该是 PascalCase
            const baseName = fileName.replace('.vue', '');
            expect(isPascalCase(baseName)).toBe(true);

            return true;
          }),
          { numRuns: 100 },
        );
      });

      /**
       * **Validates: Requirements 14.6**
       *
       * *For any* valid name, generated controller file name should be kebab-case.
       */
      it('controller file names should be kebab-case', () => {
        fc.assert(
          fc.property(validIdentifierArbitrary, (name) => {
            const fileName = generateFileName(name, 'controller');

            // 文件名应该以 .controller.ts 结尾
            expect(fileName).toMatch(/\.controller\.ts$/);

            // 基础名称应该是 kebab-case
            const baseName = fileName.replace('.controller.ts', '');
            expect(isKebabCase(baseName)).toBe(true);

            return true;
          }),
          { numRuns: 100 },
        );
      });
    });

    describe('11.4: 类名生成', () => {
      /**
       * **Validates: Requirements 14.5**
       *
       * *For any* valid name, generated class name should be PascalCase.
       */
      it('class names should be PascalCase', () => {
        fc.assert(
          fc.property(
            validIdentifierArbitrary,
            fc.constantFrom('Service', 'Controller', 'Module', 'Dto', 'Entity', '' as const),
            (name, suffix) => {
              const className = generateClassName(name, suffix);

              // 类名应该是 PascalCase
              expect(isPascalCase(className)).toBe(true);

              // 类名应该以后缀结尾
              if (suffix) {
                expect(className).toMatch(new RegExp(`${suffix}$`));
              }

              return true;
            },
          ),
          { numRuns: 100 },
        );
      });
    });
  });

  describe('Code Formatter Properties', () => {
    /**
     * 生成简单的代码片段
     */
    const simpleCodeArbitrary = fc.oneof(
      // 变量声明
      fc
        .record({
          varName: validIdentifierArbitrary,
          value: fc.oneof(fc.string(), fc.integer(), fc.boolean()),
        })
        .map(({ varName, value }) => {
          const valueStr = typeof value === 'string' ? `"${value}"` : String(value);
          return `const ${varName} = ${valueStr}`;
        }),
      // 函数声明
      fc
        .record({
          funcName: validIdentifierArbitrary,
          body: fc.string({ minLength: 0, maxLength: 20 }),
        })
        .map(({ funcName, body }) => `function ${funcName}() {\n  return "${body}";\n}`),
    );

    describe('Formatter Idempotence', () => {
      /**
       * **Validates: Requirements 14.1-14.4**
       *
       * *For any* code, formatting twice should produce the same result as formatting once.
       */
      it('formatting should be idempotent', () => {
        fc.assert(
          fc.property(simpleCodeArbitrary, (code) => {
            const formatter = new CodeFormatter();
            const once = formatter.format(code);
            const twice = formatter.format(once);

            expect(twice).toBe(once);

            return true;
          }),
          { numRuns: 100 },
        );
      });
    });

    describe('Quote Conversion', () => {
      /**
       * **Validates: Requirements 14.1**
       *
       * *For any* code with double quotes, formatting should convert to single quotes.
       * Note: Excludes special characters that may interfere with quote conversion.
       */
      it('should convert double quotes to single quotes', () => {
        fc.assert(
          fc.property(
            // 只使用字母数字和空格，避免特殊字符干扰
            fc.string({ minLength: 1, maxLength: 20 }).filter((s) => /^[a-zA-Z0-9 ]+$/.test(s)),
            (content) => {
              const code = `const x = "${content}"`;
              const formatted = formatCode(code);

              // 应该使用单引号
              expect(formatted).toContain(`'${content}'`);
              // 不应该包含双引号
              expect(formatted).not.toContain(`"${content}"`);

              return true;
            },
          ),
          { numRuns: 100 },
        );
      });
    });

    describe('Indentation', () => {
      /**
       * **Validates: Requirements 14.2**
       *
       * *For any* indented code, formatting should use 2-space indentation.
       */
      it('should use 2-space indentation', () => {
        fc.assert(
          fc.property(
            fc.integer({ min: 1, max: 5 }),
            fc.string({ minLength: 1, maxLength: 20 }).filter((s) => /^[a-zA-Z0-9]+$/.test(s)),
            (indentLevel, content) => {
              // 使用 tab 缩进的代码
              const tabIndent = '\t'.repeat(indentLevel);
              const code = `${tabIndent}const x = '${content}'`;

              const formatted = formatCode(code);

              // 应该使用 2 空格缩进
              const expectedIndent = '  '.repeat(indentLevel);
              expect(formatted).toContain(expectedIndent);
              // 不应该包含 tab
              expect(formatted).not.toContain('\t');

              return true;
            },
          ),
          { numRuns: 100 },
        );
      });
    });
  });

  describe('Naming Validation Properties', () => {
    /**
     * **Validates: Requirements 14.5**
     *
     * *For any* string, isPascalCase should correctly identify PascalCase strings.
     */
    it('isPascalCase should correctly validate PascalCase', () => {
      fc.assert(
        fc.property(
          fc.oneof(
            // 有效的 PascalCase
            fc
              .array(
                fc.string({ minLength: 1, maxLength: 10 }).filter((s) => /^[a-zA-Z]+$/.test(s)),
                { minLength: 1, maxLength: 3 },
              )
              .map((words) => words.map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join('')),
            // 无效的 PascalCase (小写开头)
            fc.string({ minLength: 2, maxLength: 20 }).filter((s) => /^[a-z][a-zA-Z0-9]*$/.test(s)),
          ),
          (str) => {
            const isValid = isPascalCase(str);

            // 如果首字母大写且只包含字母数字，应该是有效的
            if (/^[A-Z][a-zA-Z0-9]*$/.test(str)) {
              expect(isValid).toBe(true);
            } else {
              expect(isValid).toBe(false);
            }

            return true;
          },
        ),
        { numRuns: 100 },
      );
    });

    /**
     * **Validates: Requirements 14.6**
     *
     * *For any* string, isKebabCase should correctly identify kebab-case strings.
     */
    it('isKebabCase should correctly validate kebab-case', () => {
      fc.assert(
        fc.property(
          fc.oneof(
            // 有效的 kebab-case
            fc
              .array(
                fc.string({ minLength: 1, maxLength: 10 }).filter((s) => /^[a-z]+$/.test(s)),
                { minLength: 1, maxLength: 3 },
              )
              .map((words) => words.join('-')),
            // 无效的 kebab-case (包含大写)
            fc.string({ minLength: 2, maxLength: 20 }).filter((s) => /[A-Z]/.test(s)),
          ),
          (str) => {
            const isValid = isKebabCase(str);

            // 如果全小写且用短横线分隔，应该是有效的
            if (/^[a-z][a-z0-9]*(-[a-z0-9]+)*$/.test(str)) {
              expect(isValid).toBe(true);
            } else {
              expect(isValid).toBe(false);
            }

            return true;
          },
        ),
        { numRuns: 100 },
      );
    });
  });
});
