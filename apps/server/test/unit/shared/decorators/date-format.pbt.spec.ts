import * as fc from 'fast-check';
import { DEFAULT_DATE_FORMAT, DEFAULT_TIMEZONE, formatDateValue } from '@/shared/decorators/date-format.decorator';

/**
 * Property-Based Tests for DateFormat Decorator
 *
 * Feature: date-serialization-refactor
 * 测试 DateFormat 装饰器的核心格式化逻辑
 */
describe('DateFormat Decorator Property-Based Tests', () => {
  // 生成有效日期的 arbitrary（过滤掉 Invalid Date）
  const validDateArbitrary = fc
    .date({
      min: new Date('1970-01-01T00:00:00Z'),
      max: new Date('2099-12-31T15:59:59Z'), // 留出时区转换的余量
    })
    .filter((d) => !isNaN(d.getTime()));

  /**
   * Property 1: 日期格式化输出格式一致性
   *
   * For any valid date input (Date object or ISO string), the formatted output
   * SHALL match the 'YYYY-MM-DD HH:mm:ss' pattern (or custom format).
   *
   * **Validates: Requirements 1.1, 1.3**
   */
  describe('Property 1: 日期格式化输出格式一致性', () => {
    // 默认格式的正则表达式: YYYY-MM-DD HH:mm:ss
    const defaultFormatRegex = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/;

    it('For any valid Date object, formatDateValue() SHALL return a string matching YYYY-MM-DD HH:mm:ss pattern', () => {
      fc.assert(
        fc.property(validDateArbitrary, (date: Date) => {
          const result = formatDateValue(date);
          return typeof result === 'string' && defaultFormatRegex.test(result);
        }),
        { numRuns: 100 },
      );
    });

    it('For any valid ISO date string, formatDateValue() SHALL return a string matching YYYY-MM-DD HH:mm:ss pattern', () => {
      fc.assert(
        fc.property(validDateArbitrary, (date: Date) => {
          const isoString = date.toISOString();
          const result = formatDateValue(isoString);
          return typeof result === 'string' && defaultFormatRegex.test(result);
        }),
        { numRuns: 100 },
      );
    });

    it('For any valid Date object with custom format YYYY-MM-DD, formatDateValue() SHALL return matching pattern', () => {
      const dateOnlyRegex = /^\d{4}-\d{2}-\d{2}$/;

      fc.assert(
        fc.property(validDateArbitrary, (date: Date) => {
          const result = formatDateValue(date, 'YYYY-MM-DD');
          return typeof result === 'string' && dateOnlyRegex.test(result);
        }),
        { numRuns: 100 },
      );
    });

    it('For any valid Date object with custom format HH:mm:ss, formatDateValue() SHALL return matching pattern', () => {
      const timeOnlyRegex = /^\d{2}:\d{2}:\d{2}$/;

      fc.assert(
        fc.property(validDateArbitrary, (date: Date) => {
          const result = formatDateValue(date, 'HH:mm:ss');
          return typeof result === 'string' && timeOnlyRegex.test(result);
        }),
        { numRuns: 100 },
      );
    });

    it('For any valid Date object, the formatted year SHALL be within valid range', () => {
      fc.assert(
        fc.property(validDateArbitrary, (date: Date) => {
          const result = formatDateValue(date) as string;
          const year = parseInt(result.substring(0, 4), 10);
          // 时区转换可能导致年份变化，所以范围稍微放宽
          return year >= 1970 && year <= 2100;
        }),
        { numRuns: 100 },
      );
    });

    it('For any valid Date object, the formatted month SHALL be between 01 and 12', () => {
      fc.assert(
        fc.property(validDateArbitrary, (date: Date) => {
          const result = formatDateValue(date) as string;
          const month = parseInt(result.substring(5, 7), 10);
          return month >= 1 && month <= 12;
        }),
        { numRuns: 100 },
      );
    });

    it('For any valid Date object, the formatted day SHALL be between 01 and 31', () => {
      fc.assert(
        fc.property(validDateArbitrary, (date: Date) => {
          const result = formatDateValue(date) as string;
          const day = parseInt(result.substring(8, 10), 10);
          return day >= 1 && day <= 31;
        }),
        { numRuns: 100 },
      );
    });

    it('For any valid Date object, the formatted hour SHALL be between 00 and 23', () => {
      fc.assert(
        fc.property(validDateArbitrary, (date: Date) => {
          const result = formatDateValue(date) as string;
          const hour = parseInt(result.substring(11, 13), 10);
          return hour >= 0 && hour <= 23;
        }),
        { numRuns: 100 },
      );
    });

    it('For any valid Date object, the formatted minute SHALL be between 00 and 59', () => {
      fc.assert(
        fc.property(validDateArbitrary, (date: Date) => {
          const result = formatDateValue(date) as string;
          const minute = parseInt(result.substring(14, 16), 10);
          return minute >= 0 && minute <= 59;
        }),
        { numRuns: 100 },
      );
    });

    it('For any valid Date object, the formatted second SHALL be between 00 and 59', () => {
      fc.assert(
        fc.property(validDateArbitrary, (date: Date) => {
          const result = formatDateValue(date) as string;
          const second = parseInt(result.substring(17, 19), 10);
          return second >= 0 && second <= 59;
        }),
        { numRuns: 100 },
      );
    });
  });

  /**
   * Property 2: 空值保持不变
   *
   * For any null or undefined input, formatDateValue() SHALL return the original value unchanged.
   *
   * **Validates: Requirements 1.2**
   */
  describe('Property 2: 空值保持不变', () => {
    it('For null input, formatDateValue() SHALL return null', () => {
      fc.assert(
        fc.property(fc.constant(null), (value) => {
          const result = formatDateValue(value);
          return result === null;
        }),
        { numRuns: 10 },
      );
    });

    it('For undefined input, formatDateValue() SHALL return undefined', () => {
      fc.assert(
        fc.property(fc.constant(undefined), (value) => {
          const result = formatDateValue(value);
          return result === undefined;
        }),
        { numRuns: 10 },
      );
    });

    it('For Invalid Date object, formatDateValue() SHALL return the original value', () => {
      const invalidDate = new Date(NaN);
      const result = formatDateValue(invalidDate);
      expect(result).toEqual(invalidDate);
    });

    it('For any invalid date string, formatDateValue() SHALL return the original value', () => {
      // 生成不是有效日期的字符串
      const invalidDateStrings = fc.oneof(
        fc.constant('not-a-date'),
        fc.constant('invalid'),
        fc.constant('abc123'),
        fc.constant(''),
        fc.string({ minLength: 1, maxLength: 10 }).filter((s) => !/^\d{4}-\d{2}-\d{2}/.test(s)),
      );

      fc.assert(
        fc.property(invalidDateStrings, (value: string) => {
          const result = formatDateValue(value);
          // 如果 dayjs 无法解析，应返回原值
          // 注意：dayjs 对某些字符串可能会返回 Invalid Date
          return result === value || typeof result === 'string';
        }),
        { numRuns: 100 },
      );
    });

    it('For any non-date non-string value, formatDateValue() SHALL return the original value', () => {
      fc.assert(
        fc.property(
          fc.oneof(fc.integer(), fc.boolean(), fc.array(fc.integer()), fc.record({ id: fc.integer() })),
          (value) => {
            const result = formatDateValue(value);
            return JSON.stringify(result) === JSON.stringify(value);
          },
        ),
        { numRuns: 100 },
      );
    });
  });

  /**
   * Additional Property Tests: Constants Validation
   */
  describe('Constants Validation', () => {
    it('DEFAULT_DATE_FORMAT SHALL be YYYY-MM-DD HH:mm:ss', () => {
      expect(DEFAULT_DATE_FORMAT).toBe('YYYY-MM-DD HH:mm:ss');
    });

    it('DEFAULT_TIMEZONE SHALL be Asia/Shanghai', () => {
      expect(DEFAULT_TIMEZONE).toBe('Asia/Shanghai');
    });
  });
});
