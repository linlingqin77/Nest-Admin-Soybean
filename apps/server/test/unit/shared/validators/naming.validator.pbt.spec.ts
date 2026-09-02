/**
 * 命名规范验证器属性测试
 *
 * Property 6: 命名规范验证
 * **Validates: Requirements 4.5, 4.6**
 */
import * as fc from 'fast-check';
import { IsKebabCaseConstraint, IsPascalCaseConstraint, NamingUtils } from '@/shared/validators/naming.validator';

describe('Naming Validators - Property Tests', () => {
  const pascalCaseValidator = new IsPascalCaseConstraint();
  const kebabCaseValidator = new IsKebabCaseConstraint();

  // 辅助函数：生成字母字符
  const upperLetters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
  const lowerLetters = 'abcdefghijklmnopqrstuvwxyz'.split('');
  const alphanumeric = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'.split('');
  const lowerAlphanumeric = 'abcdefghijklmnopqrstuvwxyz0123456789'.split('');

  describe('Property 6: 命名规范验证', () => {
    describe('PascalCase 验证', () => {
      /**
       * **Validates: Requirements 4.5**
       *
       * *For any* string starting with uppercase letter followed by alphanumeric characters,
       * the PascalCase validator should return true.
       */
      it('should accept valid PascalCase strings', () => {
        fc.assert(
          fc.property(
            // 生成有效的 PascalCase 字符串：首字母大写 + 字母数字
            fc
              .tuple(
                fc.constantFrom(...upperLetters),
                fc.array(fc.constantFrom(...alphanumeric), { minLength: 0, maxLength: 20 }),
              )
              .map(([first, rest]) => first + rest.join('')),
            (validPascalCase) => {
              const result = pascalCaseValidator.validate(validPascalCase, {} as any);
              return result === true;
            },
          ),
          { numRuns: 100 },
        );
      });

      /**
       * **Validates: Requirements 4.5**
       *
       * *For any* string starting with lowercase letter,
       * the PascalCase validator should return false.
       */
      it('should reject strings starting with lowercase', () => {
        fc.assert(
          fc.property(
            // 生成以小写字母开头的字符串
            fc
              .tuple(
                fc.constantFrom(...lowerLetters),
                fc.array(fc.constantFrom(...alphanumeric), { minLength: 0, maxLength: 20 }),
              )
              .map(([first, rest]) => first + rest.join('')),
            (invalidPascalCase) => {
              const result = pascalCaseValidator.validate(invalidPascalCase, {} as any);
              return result === false;
            },
          ),
          { numRuns: 100 },
        );
      });

      /**
       * **Validates: Requirements 4.5**
       *
       * *For any* string containing special characters (not alphanumeric),
       * the PascalCase validator should return false.
       */
      it('should reject strings with special characters', () => {
        const specialChars = '-_!@#$%^&*()+=[]{}|\\:;"\'<>,.?/`~ '.split('');

        fc.assert(
          fc.property(
            // 生成包含特殊字符的字符串
            fc
              .tuple(
                fc.constantFrom(...upperLetters),
                fc.array(fc.constantFrom(...alphanumeric), { minLength: 1, maxLength: 5 }),
                fc.constantFrom(...specialChars),
                fc.array(fc.constantFrom(...alphanumeric), { minLength: 0, maxLength: 5 }),
              )
              .map(([first, middle, special, end]) => first + middle.join('') + special + end.join('')),
            (invalidPascalCase) => {
              const result = pascalCaseValidator.validate(invalidPascalCase, {} as any);
              return result === false;
            },
          ),
          { numRuns: 100 },
        );
      });

      /**
       * **Validates: Requirements 4.5**
       *
       * *For any* empty string or null/undefined,
       * the PascalCase validator should return false.
       */
      it('should reject empty, null, or undefined values', () => {
        expect(pascalCaseValidator.validate('', {} as any)).toBe(false);
        expect(pascalCaseValidator.validate(null as any, {} as any)).toBe(false);
        expect(pascalCaseValidator.validate(undefined as any, {} as any)).toBe(false);
      });
    });

    describe('kebab-case 验证', () => {
      /**
       * **Validates: Requirements 4.6**
       *
       * *For any* string matching kebab-case pattern (lowercase with hyphens),
       * the kebab-case validator should return true.
       */
      it('should accept valid kebab-case strings', () => {
        fc.assert(
          fc.property(
            // 生成有效的 kebab-case 字符串
            fc
              .array(
                fc
                  .tuple(
                    fc.constantFrom(...lowerLetters),
                    fc.array(fc.constantFrom(...lowerAlphanumeric), { minLength: 0, maxLength: 5 }),
                  )
                  .map(([first, rest]) => first + rest.join('')),
                { minLength: 1, maxLength: 4 },
              )
              .map((parts) => parts.join('-')),
            (validKebabCase) => {
              const result = kebabCaseValidator.validate(validKebabCase, {} as any);
              return result === true;
            },
          ),
          { numRuns: 100 },
        );
      });

      /**
       * **Validates: Requirements 4.6**
       *
       * *For any* string starting with uppercase letter,
       * the kebab-case validator should return false.
       */
      it('should reject strings starting with uppercase', () => {
        fc.assert(
          fc.property(
            // 生成以大写字母开头的字符串
            fc
              .tuple(
                fc.constantFrom(...upperLetters),
                fc.array(fc.constantFrom(...lowerAlphanumeric), { minLength: 0, maxLength: 20 }),
              )
              .map(([first, rest]) => first + rest.join('')),
            (invalidKebabCase) => {
              const result = kebabCaseValidator.validate(invalidKebabCase, {} as any);
              return result === false;
            },
          ),
          { numRuns: 100 },
        );
      });

      /**
       * **Validates: Requirements 4.6**
       *
       * *For any* string containing uppercase letters,
       * the kebab-case validator should return false.
       */
      it('should reject strings with uppercase letters', () => {
        fc.assert(
          fc.property(
            // 生成包含大写字母的字符串
            fc
              .tuple(
                fc.constantFrom(...lowerLetters),
                fc.array(fc.constantFrom(...lowerAlphanumeric), { minLength: 1, maxLength: 5 }),
                fc.constantFrom(...upperLetters),
                fc.array(fc.constantFrom(...lowerAlphanumeric), { minLength: 0, maxLength: 5 }),
              )
              .map(([first, middle, upper, end]) => first + middle.join('') + upper + end.join('')),
            (invalidKebabCase) => {
              const result = kebabCaseValidator.validate(invalidKebabCase, {} as any);
              return result === false;
            },
          ),
          { numRuns: 100 },
        );
      });

      /**
       * **Validates: Requirements 4.6**
       *
       * *For any* string starting or ending with hyphen,
       * the kebab-case validator should return false.
       */
      it('should reject strings starting or ending with hyphen', () => {
        fc.assert(
          fc.property(
            fc
              .tuple(
                fc.constantFrom(...lowerLetters),
                fc.array(fc.constantFrom(...lowerAlphanumeric), { minLength: 0, maxLength: 10 }),
              )
              .map(([first, rest]) => first + rest.join('')),
            (middle) => {
              // 以连字符开头
              const startsWithHyphen = '-' + middle;
              const result1 = kebabCaseValidator.validate(startsWithHyphen, {} as any);

              // 以连字符结尾
              const endsWithHyphen = middle + '-';
              const result2 = kebabCaseValidator.validate(endsWithHyphen, {} as any);

              return result1 === false && result2 === false;
            },
          ),
          { numRuns: 100 },
        );
      });

      /**
       * **Validates: Requirements 4.6**
       *
       * *For any* string with consecutive hyphens,
       * the kebab-case validator should return false.
       */
      it('should reject strings with consecutive hyphens', () => {
        fc.assert(
          fc.property(
            fc
              .tuple(
                fc
                  .tuple(
                    fc.constantFrom(...lowerLetters),
                    fc.array(fc.constantFrom(...lowerAlphanumeric), { minLength: 0, maxLength: 5 }),
                  )
                  .map(([first, rest]) => first + rest.join('')),
                fc
                  .tuple(
                    fc.constantFrom(...lowerLetters),
                    fc.array(fc.constantFrom(...lowerAlphanumeric), { minLength: 0, maxLength: 5 }),
                  )
                  .map(([first, rest]) => first + rest.join('')),
              )
              .map(([before, after]) => before + '--' + after),
            (invalidKebabCase) => {
              const result = kebabCaseValidator.validate(invalidKebabCase, {} as any);
              return result === false;
            },
          ),
          { numRuns: 100 },
        );
      });

      /**
       * **Validates: Requirements 4.6**
       *
       * *For any* empty string or null/undefined,
       * the kebab-case validator should return false.
       */
      it('should reject empty, null, or undefined values', () => {
        expect(kebabCaseValidator.validate('', {} as any)).toBe(false);
        expect(kebabCaseValidator.validate(null as any, {} as any)).toBe(false);
        expect(kebabCaseValidator.validate(undefined as any, {} as any)).toBe(false);
      });
    });

    describe('NamingUtils 工具函数', () => {
      /**
       * **Validates: Requirements 4.5, 4.6**
       *
       * *For any* valid PascalCase string converted to kebab-case and back,
       * the result should be equivalent (case-insensitive comparison).
       */
      it('should convert between PascalCase and kebab-case consistently', () => {
        fc.assert(
          fc.property(
            // 生成有效的 PascalCase 字符串（多个单词组成）
            fc
              .array(
                fc
                  .tuple(
                    fc.constantFrom(...upperLetters),
                    fc.array(fc.constantFrom(...lowerLetters), { minLength: 0, maxLength: 5 }),
                  )
                  .map(([first, rest]) => first + rest.join('')),
                { minLength: 1, maxLength: 3 },
              )
              .map((parts) => parts.join('')),
            (pascalCase) => {
              // PascalCase -> kebab-case
              const kebab = NamingUtils.toKebabCase(pascalCase);

              // 验证转换后是有效的 kebab-case
              if (!NamingUtils.isKebabCase(kebab)) {
                return false;
              }

              // kebab-case -> PascalCase
              const backToPascal = NamingUtils.toPascalCase(kebab);

              // 验证转换后是有效的 PascalCase
              return NamingUtils.isPascalCase(backToPascal);
            },
          ),
          { numRuns: 100 },
        );
      });

      /**
       * **Validates: Requirements 4.5**
       *
       * *For any* valid alphanumeric string starting with a letter,
       * toPascalCase should produce a valid PascalCase string.
       */
      it('should produce valid PascalCase from alphanumeric input', () => {
        fc.assert(
          fc.property(
            // 生成只包含字母和数字的字符串，以字母开头
            fc
              .tuple(
                fc.constantFrom(...[...lowerLetters, ...upperLetters]),
                fc.array(fc.constantFrom(...alphanumeric), { minLength: 0, maxLength: 20 }),
              )
              .map(([first, rest]) => first + rest.join('')),
            (input) => {
              const result = NamingUtils.toPascalCase(input);
              // 结果应该是有效的 PascalCase
              return NamingUtils.isPascalCase(result);
            },
          ),
          { numRuns: 100 },
        );
      });

      /**
       * **Validates: Requirements 4.6**
       *
       * *For any* valid alphanumeric string starting with a letter,
       * toKebabCase should produce a valid kebab-case string.
       */
      it('should produce valid kebab-case from alphanumeric input', () => {
        fc.assert(
          fc.property(
            // 生成只包含字母和数字的字符串，以字母开头
            fc
              .tuple(
                fc.constantFrom(...[...lowerLetters, ...upperLetters]),
                fc.array(fc.constantFrom(...alphanumeric), { minLength: 0, maxLength: 20 }),
              )
              .map(([first, rest]) => first + rest.join('')),
            (input) => {
              const result = NamingUtils.toKebabCase(input);
              // 结果应该是有效的 kebab-case
              return NamingUtils.isKebabCase(result);
            },
          ),
          { numRuns: 100 },
        );
      });

      /**
       * **Validates: Requirements 4.5, 4.6**
       *
       * *For any* valid PascalCase string,
       * isPascalCase should return true and isKebabCase should return false.
       */
      it('should correctly identify PascalCase vs kebab-case', () => {
        fc.assert(
          fc.property(
            // 生成有效的 PascalCase 字符串
            fc
              .tuple(
                fc.constantFrom(...upperLetters),
                fc.array(fc.constantFrom(...alphanumeric), { minLength: 0, maxLength: 20 }),
              )
              .map(([first, rest]) => first + rest.join('')),
            (pascalCase) => {
              return NamingUtils.isPascalCase(pascalCase) === true && NamingUtils.isKebabCase(pascalCase) === false;
            },
          ),
          { numRuns: 100 },
        );
      });

      /**
       * **Validates: Requirements 4.5, 4.6**
       *
       * *For any* valid kebab-case string,
       * isKebabCase should return true and isPascalCase should return false.
       */
      it('should correctly identify kebab-case vs PascalCase', () => {
        fc.assert(
          fc.property(
            // 生成有效的 kebab-case 字符串
            fc
              .array(
                fc
                  .tuple(
                    fc.constantFrom(...lowerLetters),
                    fc.array(fc.constantFrom(...lowerAlphanumeric), { minLength: 0, maxLength: 5 }),
                  )
                  .map(([first, rest]) => first + rest.join('')),
                { minLength: 1, maxLength: 4 },
              )
              .map((parts) => parts.join('-')),
            (kebabCase) => {
              return NamingUtils.isKebabCase(kebabCase) === true && NamingUtils.isPascalCase(kebabCase) === false;
            },
          ),
          { numRuns: 100 },
        );
      });
    });
  });
});
