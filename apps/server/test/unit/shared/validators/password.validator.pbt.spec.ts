import * as fc from 'fast-check';
import { PasswordValidationConfig, PasswordValidator } from '@/shared/validators/password.validator';

/**
 * 密码验证器属性测试
 *
 * 使用 fast-check 进行属性测试，验证密码验证器在各种输入下的行为
 */
describe('PasswordValidator - Property Tests', () => {
  // 生成只包含小写字母和数字的字符串
  const lowercaseAndDigits = fc
    .string({ minLength: 8, maxLength: 20 })
    .filter((s) => /^[a-z0-9]+$/.test(s) && s.length >= 8);
  // 生成只包含大写字母和数字的字符串
  const uppercaseAndDigits = fc
    .string({ minLength: 8, maxLength: 20 })
    .filter((s) => /^[A-Z0-9]+$/.test(s) && s.length >= 8);
  // 生成只包含字母的字符串
  const lettersOnly = fc.string({ minLength: 8, maxLength: 20 }).filter((s) => /^[a-zA-Z]+$/.test(s) && s.length >= 8);

  describe('Property 1: 空密码始终无效', () => {
    /**
     * **Validates: Requirements 1.1**
     * 对于任意配置，空字符串、null、undefined 都应该被拒绝
     */
    it('空字符串始终返回无效', () => {
      fc.assert(
        fc.property(
          fc.record({
            minLength: fc.nat({ max: 20 }),
            maxLength: fc.integer({ min: 21, max: 200 }),
            requireUppercase: fc.boolean(),
            requireLowercase: fc.boolean(),
            requireNumber: fc.boolean(),
            requireSpecial: fc.boolean(),
          }),
          (mockConfig) => {
            const result = PasswordValidator.validate('', mockConfig);
            return result.valid === false && result.errors.includes('密码不能为空');
          },
        ),
        { numRuns: 100 },
      );
    });
  });

  describe('Property 2: 长度验证一致性', () => {
    /**
     * **Validates: Requirements 1.2**
     * 对于任意密码，如果长度小于 minLength，则应该被拒绝
     */
    it('短于最小长度的密码始终被拒绝', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 8, max: 20 }),
          fc.string({ minLength: 1, maxLength: 7 }),
          (minLength, password) => {
            const mockConfig: PasswordValidationConfig = {
              minLength,
              requireUppercase: false,
              requireLowercase: false,
              requireNumber: false,
            };
            const result = PasswordValidator.validate(password, mockConfig);
            return result.valid === false;
          },
        ),
        { numRuns: 100 },
      );
    });

    /**
     * **Validates: Requirements 1.2**
     * 对于任意密码，如果长度大于 maxLength，则应该被拒绝
     */
    it('超过最大长度的密码始终被拒绝', () => {
      fc.assert(
        fc.property(fc.integer({ min: 10, max: 50 }), (maxLength) => {
          const password = 'A'.repeat(maxLength + 10);
          const mockConfig: PasswordValidationConfig = {
            maxLength,
            minLength: 1,
            requireUppercase: false,
            requireLowercase: false,
            requireNumber: false,
          };
          const result = PasswordValidator.validate(password, mockConfig);
          return result.valid === false && result.errors.some((e) => e.includes('最多'));
        }),
        { numRuns: 100 },
      );
    });
  });

  describe('Property 3: 字符要求验证', () => {
    /**
     * **Validates: Requirements 1.3**
     * 当要求大写字母时，不包含大写字母的密码应该被拒绝
     */
    it('要求大写字母时，纯小写密码被拒绝', () => {
      fc.assert(
        fc.property(lowercaseAndDigits, (password) => {
          const mockConfig: PasswordValidationConfig = {
            requireUppercase: true,
            requireLowercase: false,
            requireNumber: false,
          };
          const result = PasswordValidator.validate(password, mockConfig);
          return result.valid === false && result.errors.includes('密码必须包含大写字母');
        }),
        { numRuns: 50 },
      );
    });

    /**
     * **Validates: Requirements 1.3**
     * 当要求小写字母时，不包含小写字母的密码应该被拒绝
     */
    it('要求小写字母时，纯大写密码被拒绝', () => {
      fc.assert(
        fc.property(uppercaseAndDigits, (password) => {
          const mockConfig: PasswordValidationConfig = {
            requireUppercase: false,
            requireLowercase: true,
            requireNumber: false,
          };
          const result = PasswordValidator.validate(password, mockConfig);
          return result.valid === false && result.errors.includes('密码必须包含小写字母');
        }),
        { numRuns: 50 },
      );
    });

    /**
     * **Validates: Requirements 1.3**
     * 当要求数字时，不包含数字的密码应该被拒绝
     */
    it('要求数字时，纯字母密码被拒绝', () => {
      fc.assert(
        fc.property(lettersOnly, (password) => {
          const mockConfig: PasswordValidationConfig = {
            requireUppercase: false,
            requireLowercase: false,
            requireNumber: true,
          };
          const result = PasswordValidator.validate(password, mockConfig);
          return result.valid === false && result.errors.includes('密码必须包含数字');
        }),
        { numRuns: 50 },
      );
    });
  });

  describe('Property 4: 有效密码验证', () => {
    /**
     * **Validates: Requirements 1.4**
     * 满足所有要求的密码应该被接受
     */
    it('满足所有默认要求的密码被接受', () => {
      fc.assert(
        fc.property(
          fc.tuple(
            fc.constantFrom('A', 'B', 'C', 'D', 'E'),
            fc.constantFrom('a', 'b', 'c', 'd', 'e'),
            fc.constantFrom('1', '2', '3', '4', '5'),
          ),
          ([upper, lower, digit]) => {
            const password = upper + lower + digit + 'aAbBcC12'; // 确保至少8位
            const result = PasswordValidator.validate(password);
            return result.valid === true;
          },
        ),
        { numRuns: 100 },
      );
    });
  });

  describe('Property 5: 密码强度计算', () => {
    /**
     * **Validates: Requirements 1.5**
     * 密码强度分数应该在 0-4 之间
     */
    it('密码强度分数始终在 0-4 之间', () => {
      fc.assert(
        fc.property(fc.string({ minLength: 0, maxLength: 50 }), (password) => {
          const strength = PasswordValidator.calculateStrength(password);
          return strength >= 0 && strength <= 4;
        }),
        { numRuns: 100 },
      );
    });

    /**
     * **Validates: Requirements 1.5**
     * 更长的密码应该有更高或相等的强度分数
     */
    it('添加复杂性不会降低强度分数', () => {
      fc.assert(
        fc.property(fc.string({ minLength: 8, maxLength: 20 }), (basePassword) => {
          const baseStrength = PasswordValidator.calculateStrength(basePassword);
          const enhancedPassword = basePassword + 'Aa1!';
          const enhancedStrength = PasswordValidator.calculateStrength(enhancedPassword);
          return enhancedStrength >= baseStrength;
        }),
        { numRuns: 100 },
      );
    });
  });

  describe('Property 6: 禁止模式验证', () => {
    /**
     * **Validates: Requirements 1.6**
     * 包含禁止模式的密码应该被拒绝
     */
    it('包含禁止模式的密码被拒绝', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 10 }),
          fc.string({ minLength: 1, maxLength: 10 }),
          (prefix, suffix) => {
            const forbiddenWord = 'password';
            const password = prefix + forbiddenWord + suffix;
            const mockConfig: PasswordValidationConfig = {
              forbiddenPatterns: [/password/i],
              minLength: 1,
              requireUppercase: false,
              requireLowercase: false,
              requireNumber: false,
            };
            const result = PasswordValidator.validate(password, mockConfig);
            return result.valid === false && result.errors.includes('密码包含不允许的模式');
          },
        ),
        { numRuns: 100 },
      );
    });
  });

  describe('Property 7: 验证结果一致性', () => {
    /**
     * **Validates: Requirements 1.7**
     * 相同的密码和配置应该产生相同的验证结果
     */
    it('验证结果是确定性的', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 0, maxLength: 30 }),
          fc.record({
            minLength: fc.nat({ max: 20 }),
            maxLength: fc.integer({ min: 21, max: 200 }),
            requireUppercase: fc.boolean(),
            requireLowercase: fc.boolean(),
            requireNumber: fc.boolean(),
            requireSpecial: fc.boolean(),
          }),
          (password, mockConfig) => {
            const result1 = PasswordValidator.validate(password, mockConfig);
            const result2 = PasswordValidator.validate(password, mockConfig);
            return result1.valid === result2.valid && result1.errors.length === result2.errors.length;
          },
        ),
        { numRuns: 100 },
      );
    });
  });
});
