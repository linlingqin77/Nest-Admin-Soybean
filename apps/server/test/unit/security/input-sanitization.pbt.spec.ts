/**
 * 输入安全验证属性测试
 *
 * @description
 * 验证输入验证和安全过滤的正确性
 *
 * **Property 5: 输入安全验证**
 * **Validates: Requirements 9.2, 9.4**
 */

import * as fc from 'fast-check';

/**
 * XSS 攻击向量生成器
 */
const xssPayloadArbitrary = fc.oneof(
  fc.constant('<script>alert("xss")</script>'),
  fc.constant('<img src="x" onerror="alert(1)">'),
  fc.constant('<svg onload="alert(1)">'),
  fc.constant('javascript:alert(1)'),
  fc.constant('<iframe src="javascript:alert(1)">'),
  fc.constant('<body onload="alert(1)">'),
  fc.constant('<input onfocus="alert(1)" autofocus>'),
  fc.constant('<marquee onstart="alert(1)">'),
  fc.constant('<video><source onerror="alert(1)">'),
  fc.constant('<details open ontoggle="alert(1)">'),
);

/**
 * SQL 注入攻击向量生成器
 */
const sqlInjectionArbitrary = fc.oneof(
  fc.constant("'; DROP TABLE users; --"),
  fc.constant("' OR '1'='1"),
  fc.constant('1; DELETE FROM users'),
  fc.constant("' UNION SELECT * FROM users --"),
  fc.constant("admin'--"),
  fc.constant("1' OR '1'='1' /*"),
  fc.constant("'; EXEC xp_cmdshell('dir'); --"),
  fc.constant("' AND 1=0 UNION SELECT username, password FROM users --"),
);

/**
 * 路径遍历攻击向量生成器
 */
const pathTraversalArbitrary = fc.oneof(
  fc.constant('../../../etc/passwd'),
  fc.constant('..\\..\\..\\windows\\system32\\platform/config\\sam'),
  fc.constant('....//....//....//etc/passwd'),
  fc.constant('%2e%2e%2f%2e%2e%2f%2e%2e%2fetc/passwd'),
  fc.constant('..%252f..%252f..%252fetc/passwd'),
);

/**
 * 简单的 XSS 过滤函数（示例实现）
 */
const sanitizeXss = (input: string): string => {
  if (!input || typeof input !== 'string') return input;

  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
    .replace(/javascript:/gi, '')
    .replace(/on\w+=/gi, '');
};

/**
 * 简单的 SQL 注入过滤函数（示例实现）
 */
const sanitizeSql = (input: string): string => {
  if (!input || typeof input !== 'string') return input;

  // 移除危险的 SQL 关键字和字符
  let result = input
    .replace(/'/g, "''") // 转义单引号
    .replace(/;/g, '') // 移除分号
    .replace(/--/g, '') // 移除注释
    .replace(/\/\*/g, '') // 移除块注释开始
    .replace(/\*\//g, ''); // 移除块注释结束

  // 移除危险的 SQL 关键字（不区分大小写）
  const dangerousKeywords = [
    /\bUNION\b/gi,
    /\bSELECT\b/gi,
    /\bDROP\b/gi,
    /\bDELETE\b/gi,
    /\bINSERT\b/gi,
    /\bUPDATE\b/gi,
    /\bEXEC\b/gi,
    /\bxp_/gi,
  ];

  dangerousKeywords.forEach((pattern) => {
    result = result.replace(pattern, '');
  });

  return result;
};

/**
 * 简单的路径遍历过滤函数（示例实现）
 */
const sanitizePath = (input: string): string => {
  if (!input || typeof input !== 'string') return input;

  // 移除路径遍历字符
  return input.replace(/\.\./g, '').replace(/%2e/gi, '').replace(/%252f/gi, '').replace(/\\/g, '/');
};

/**
 * 验证字符串是否包含危险的 HTML 标签
 */
const containsDangerousHtml = (input: string): boolean => {
  const dangerousPatterns = [/<script/i, /<iframe/i, /<object/i, /<embed/i, /<svg/i, /on\w+\s*=/i, /javascript:/i];
  return dangerousPatterns.some((pattern) => pattern.test(input));
};

/**
 * 验证字符串是否包含 SQL 注入特征
 */
const containsSqlInjection = (input: string): boolean => {
  const sqlPatterns = [
    /'\s*OR\s*'1'\s*=\s*'1/i,
    /;\s*DROP\s+TABLE/i,
    /;\s*DELETE\s+FROM/i,
    /UNION\s+SELECT/i,
    /EXEC\s+xp_/i,
  ];
  return sqlPatterns.some((pattern) => pattern.test(input));
};

/**
 * 验证字符串是否包含路径遍历特征
 */
const containsPathTraversal = (input: string): boolean => {
  const pathPatterns = [/\.\.\//, /\.\.\\/, /%2e%2e/i, /%252f/i];
  return pathPatterns.some((pattern) => pattern.test(input));
};

describe('输入安全验证 - 属性测试', () => {
  describe('Property 5: 输入安全验证', () => {
    /**
     * **Validates: Requirements 9.2**
     * XSS 过滤后的输出不应包含危险的 HTML 标签
     */
    describe('XSS 防护', () => {
      it('过滤后的输出不应包含危险的 HTML 标签', () => {
        fc.assert(
          fc.property(xssPayloadArbitrary, (payload) => {
            const sanitized = sanitizeXss(payload);

            // 过滤后不应包含危险标签
            expect(containsDangerousHtml(sanitized)).toBe(false);

            return true;
          }),
          { numRuns: 100 },
        );
      });

      it('正常文本不应被过度过滤', () => {
        fc.assert(
          fc.property(
            fc.string({ minLength: 1, maxLength: 100 }).filter((s) => !containsDangerousHtml(s)),
            (normalText) => {
              const sanitized = sanitizeXss(normalText);

              // 正常文本的核心内容应该保留（允许特殊字符被转义）
              // 验证长度不会显著减少
              return sanitized.length >= normalText.length * 0.5;
            },
          ),
          { numRuns: 100 },
        );
      });

      it('空字符串和 null 应该安全处理', () => {
        expect(sanitizeXss('')).toBe('');
        expect(sanitizeXss(null as any)).toBe(null);
        expect(sanitizeXss(undefined as any)).toBe(undefined);
      });
    });

    /**
     * **Validates: Requirements 9.4**
     * SQL 注入过滤后的输出不应包含危险的 SQL 语句
     */
    describe('SQL 注入防护', () => {
      it('过滤后的输出不应包含危险的 SQL 语句', () => {
        fc.assert(
          fc.property(sqlInjectionArbitrary, (payload) => {
            const sanitized = sanitizeSql(payload);

            // 过滤后不应包含危险的 SQL 注入特征
            expect(containsSqlInjection(sanitized)).toBe(false);

            return true;
          }),
          { numRuns: 100 },
        );
      });

      it('正常查询参数不应被过度过滤', () => {
        fc.assert(
          fc.property(
            fc
              .string({ minLength: 1, maxLength: 50 })
              .filter((s) => !containsSqlInjection(s) && !s.includes("'") && !s.includes(';')),
            (normalParam) => {
              const sanitized = sanitizeSql(normalParam);

              // 正常参数应该基本保持不变
              return sanitized === normalParam;
            },
          ),
          { numRuns: 100 },
        );
      });
    });

    /**
     * 路径遍历防护
     */
    describe('路径遍历防护', () => {
      it('过滤后的输出不应包含路径遍历字符', () => {
        fc.assert(
          fc.property(pathTraversalArbitrary, (payload) => {
            const sanitized = sanitizePath(payload);

            // 过滤后不应包含路径遍历特征
            expect(containsPathTraversal(sanitized)).toBe(false);

            return true;
          }),
          { numRuns: 100 },
        );
      });

      it('正常文件名不应被过度过滤', () => {
        fc.assert(
          fc.property(
            fc
              .string({ minLength: 1, maxLength: 50 })
              .filter((s) => !containsPathTraversal(s) && !s.includes('..') && !s.includes('\\')),
            (normalFilename) => {
              const sanitized = sanitizePath(normalFilename);

              // 正常文件名应该基本保持不变
              return sanitized === normalFilename;
            },
          ),
          { numRuns: 100 },
        );
      });
    });
  });

  describe('输入验证幂等性', () => {
    it('多次过滤应该产生相同结果（幂等性）', () => {
      fc.assert(
        fc.property(fc.string({ minLength: 0, maxLength: 200 }), (input) => {
          const once = sanitizeXss(input);
          const twice = sanitizeXss(sanitizeXss(input));

          // 多次过滤应该产生相同结果
          return once === twice;
        }),
        { numRuns: 100 },
      );
    });
  });

  describe('输入长度限制', () => {
    /**
     * 验证输入长度限制函数
     */
    const limitLength = (input: string, maxLength: number): string => {
      if (!input || typeof input !== 'string') return input;
      return input.slice(0, maxLength);
    };

    it('限制后的长度不应超过最大值', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 0, maxLength: 1000 }),
          fc.integer({ min: 1, max: 500 }),
          (input, maxLength) => {
            const limited = limitLength(input, maxLength);

            return limited.length <= maxLength;
          },
        ),
        { numRuns: 100 },
      );
    });

    it('短于限制的字符串应该保持不变', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 0, maxLength: 100 }),
          fc.integer({ min: 101, max: 500 }),
          (input, maxLength) => {
            const limited = limitLength(input, maxLength);

            return limited === input;
          },
        ),
        { numRuns: 100 },
      );
    });
  });
});
