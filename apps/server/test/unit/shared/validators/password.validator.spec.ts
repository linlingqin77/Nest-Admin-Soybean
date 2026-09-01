import { PasswordValidator, PasswordValidationConfig } from '@/shared/validators/password.validator';

describe('PasswordValidator', () => {
  describe('validate', () => {
    describe('基本验证', () => {
      it('应该拒绝空密码', () => {
        const result = PasswordValidator.validate('');
        expect(result.valid).toBe(false);
        expect(result.errors).toContain('密码不能为空');
      });

      it('应该拒绝 null 密码', () => {
        const result = PasswordValidator.validate(null as any);
        expect(result.valid).toBe(false);
        expect(result.errors).toContain('密码不能为空');
      });

      it('应该拒绝 undefined 密码', () => {
        const result = PasswordValidator.validate(undefined as any);
        expect(result.valid).toBe(false);
        expect(result.errors).toContain('密码不能为空');
      });
    });

    describe('长度验证', () => {
      it('应该拒绝过短的密码', () => {
        const result = PasswordValidator.validate('Abc123');
        expect(result.valid).toBe(false);
        expect(result.errors).toContain('密码长度至少8位');
      });

      it('应该拒绝过长的密码', () => {
        const longPassword = 'Abc123' + 'a'.repeat(130);
        const result = PasswordValidator.validate(longPassword);
        expect(result.valid).toBe(false);
        expect(result.errors).toContain('密码长度最多128位');
      });

      it('应该接受自定义最小长度', () => {
        const mockConfig: PasswordValidationConfig = {
          minLength: 4,
          requireUppercase: false,
          requireLowercase: false,
          requireNumber: false,
        };
        const result = PasswordValidator.validate('abcd', mockConfig);
        expect(result.valid).toBe(true);
      });

      it('应该接受自定义最大长度', () => {
        const mockConfig: PasswordValidationConfig = {
          maxLength: 10,
          requireUppercase: false,
          requireLowercase: false,
          requireNumber: false,
        };
        const result = PasswordValidator.validate('abcdefghijk', mockConfig);
        expect(result.valid).toBe(false);
        expect(result.errors).toContain('密码长度最多10位');
      });
    });

    describe('字符要求验证', () => {
      it('应该要求大写字母', () => {
        const result = PasswordValidator.validate('abcdefgh1');
        expect(result.valid).toBe(false);
        expect(result.errors).toContain('密码必须包含大写字母');
      });

      it('应该要求小写字母', () => {
        const result = PasswordValidator.validate('ABCDEFGH1');
        expect(result.valid).toBe(false);
        expect(result.errors).toContain('密码必须包含小写字母');
      });

      it('应该要求数字', () => {
        const result = PasswordValidator.validate('Abcdefgh');
        expect(result.valid).toBe(false);
        expect(result.errors).toContain('密码必须包含数字');
      });

      it('应该可选要求特殊字符', () => {
        const mockConfig: PasswordValidationConfig = { requireSpecial: true };
        const result = PasswordValidator.validate('Abcdefgh1', mockConfig);
        expect(result.valid).toBe(false);
        expect(result.errors).toContain('密码必须包含特殊字符');
      });

      it('应该接受包含特殊字符的密码', () => {
        const mockConfig: PasswordValidationConfig = { requireSpecial: true };
        const result = PasswordValidator.validate('Abcdefgh1!', mockConfig);
        expect(result.valid).toBe(true);
      });

      it('应该可以禁用大写字母要求', () => {
        const mockConfig: PasswordValidationConfig = {
          requireUppercase: false,
          requireLowercase: true,
          requireNumber: true,
        };
        const result = PasswordValidator.validate('abcdefgh1', mockConfig);
        expect(result.valid).toBe(true);
      });

      it('应该可以禁用小写字母要求', () => {
        const mockConfig: PasswordValidationConfig = {
          requireLowercase: false,
          requireUppercase: true,
          requireNumber: true,
        };
        const result = PasswordValidator.validate('ABCDEFGH1', mockConfig);
        expect(result.valid).toBe(true);
      });

      it('应该可以禁用数字要求', () => {
        const mockConfig: PasswordValidationConfig = {
          requireNumber: false,
          requireUppercase: true,
          requireLowercase: true,
        };
        const result = PasswordValidator.validate('Abcdefgh', mockConfig);
        expect(result.valid).toBe(true);
      });
    });

    describe('禁止模式验证', () => {
      it('应该拒绝包含禁止模式的密码', () => {
        const mockConfig: PasswordValidationConfig = {
          forbiddenPatterns: [/password/i, /123456/],
          requireUppercase: false,
          requireLowercase: false,
          requireNumber: false,
        };
        const result = PasswordValidator.validate('myPassword123', mockConfig);
        expect(result.valid).toBe(false);
        expect(result.errors).toContain('密码包含不允许的模式');
      });

      it('应该拒绝包含连续数字的密码', () => {
        const mockConfig: PasswordValidationConfig = {
          forbiddenPatterns: [/123456/],
          requireUppercase: false,
          requireLowercase: false,
          requireNumber: false,
        };
        const result = PasswordValidator.validate('abc123456def', mockConfig);
        expect(result.valid).toBe(false);
      });

      it('应该接受不包含禁止模式的密码', () => {
        const mockConfig: PasswordValidationConfig = {
          forbiddenPatterns: [/password/i],
        };
        const result = PasswordValidator.validate('Abcdefgh1');
        expect(result.valid).toBe(true);
      });
    });

    describe('有效密码', () => {
      it('应该接受符合所有默认要求的密码', () => {
        const result = PasswordValidator.validate('Abcdefgh1');
        expect(result.valid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });

      it('应该接受包含特殊字符的强密码', () => {
        const result = PasswordValidator.validate('Abcdefgh1!@#');
        expect(result.valid).toBe(true);
      });

      it('应该接受边界长度的密码', () => {
        const result = PasswordValidator.validate('Abcdefg1'); // 正好8位
        expect(result.valid).toBe(true);
      });
    });

    describe('多个错误', () => {
      it('应该返回所有验证错误', () => {
        const result = PasswordValidator.validate('abc');
        expect(result.valid).toBe(false);
        expect(result.errors.length).toBeGreaterThan(1);
        expect(result.errors).toContain('密码长度至少8位');
        expect(result.errors).toContain('密码必须包含大写字母');
        expect(result.errors).toContain('密码必须包含数字');
      });
    });
  });

  describe('calculateStrength', () => {
    it('应该返回0对于空密码', () => {
      expect(PasswordValidator.calculateStrength('')).toBe(0);
    });

    it('应该返回0对于null密码', () => {
      expect(PasswordValidator.calculateStrength(null as any)).toBe(0);
    });

    it('应该返回0对于undefined密码', () => {
      expect(PasswordValidator.calculateStrength(undefined as any)).toBe(0);
    });

    it('应该为短密码返回低分', () => {
      expect(PasswordValidator.calculateStrength('abc')).toBe(0);
    });

    it('应该为8位以上密码增加分数', () => {
      expect(PasswordValidator.calculateStrength('abcdefgh')).toBeGreaterThanOrEqual(1);
    });

    it('应该为12位以上密码增加更多分数', () => {
      const score8 = PasswordValidator.calculateStrength('abcdefgh');
      const score12 = PasswordValidator.calculateStrength('abcdefghijkl');
      expect(score12).toBeGreaterThan(score8);
    });

    it('应该为混合大小写增加分数', () => {
      const scoreLower = PasswordValidator.calculateStrength('abcdefgh');
      const scoreMixed = PasswordValidator.calculateStrength('Abcdefgh');
      expect(scoreMixed).toBeGreaterThan(scoreLower);
    });

    it('应该为包含数字增加分数', () => {
      const scoreNoNum = PasswordValidator.calculateStrength('Abcdefgh');
      const scoreWithNum = PasswordValidator.calculateStrength('Abcdefg1');
      expect(scoreWithNum).toBeGreaterThan(scoreNoNum);
    });

    it('应该为包含特殊字符增加分数', () => {
      const scoreNoSpecial = PasswordValidator.calculateStrength('Abcdefg1');
      const scoreWithSpecial = PasswordValidator.calculateStrength('Abcdefg1!');
      expect(scoreWithSpecial).toBeGreaterThan(scoreNoSpecial);
    });

    it('应该最高返回4分', () => {
      const strongPassword = 'Abcdefghijkl1!@#$%';
      expect(PasswordValidator.calculateStrength(strongPassword)).toBe(4);
    });

    it('应该为非常强的密码返回4分', () => {
      expect(PasswordValidator.calculateStrength('MyStr0ngP@ssw0rd!')).toBe(4);
    });
  });
});
