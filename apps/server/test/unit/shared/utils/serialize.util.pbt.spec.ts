/**
 * Property-Based Tests for serialize.util
 *
 * Feature: date-serialization-refactor
 * 测试序列化工具函数触发装饰器转换和向后兼容性
 */
import * as fc from 'fast-check';
import { Expose, Exclude } from 'class-transformer';
import { toDto, toDtoList, toDtoPage } from '@/shared/utils/serialize.util';
import { DateFormat } from '@/shared/decorators/date-format.decorator';

/**
 * 测试用 DTO - 包含 @DateFormat 装饰器
 */
class TestDateResponseDto {
  @Expose()
  id!: number;

  @Expose()
  name!: string;

  @Expose()
  @DateFormat()
  createTime?: string;

  @Expose()
  @DateFormat()
  updateTime?: string;

  @Expose()
  @DateFormat('YYYY-MM-DD')
  birthDate?: string;

  @Exclude()
  password?: string;
}

/**
 * 测试用 DTO - 不包含 @DateFormat 装饰器（用于向后兼容测试）
 */
class TestSimpleResponseDto {
  @Expose()
  id!: number;

  @Expose()
  name!: string;

  @Expose()
  status!: string;

  @Exclude()
  password?: string;
}

// 默认格式的正则表达式: YYYY-MM-DD HH:mm:ss
const defaultFormatRegex = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/;
// 日期格式的正则表达式: YYYY-MM-DD
const dateOnlyFormatRegex = /^\d{4}-\d{2}-\d{2}$/;

// 生成有效日期的 arbitrary（过滤掉 Invalid Date）
const validDateArbitrary = fc
  .date({
    min: new Date('1970-01-01T00:00:00Z'),
    max: new Date('2099-12-31T15:59:59Z'),
  })
  .filter((d) => !isNaN(d.getTime()));

// 生成包含日期字段的普通对象
const plainObjectWithDatesArbitrary = fc.record({
  id: fc.integer({ min: 1, max: 1000000 }),
  name: fc.string({ minLength: 1, maxLength: 50 }),
  createTime: validDateArbitrary,
  updateTime: validDateArbitrary,
  birthDate: validDateArbitrary,
  password: fc.string({ minLength: 8, maxLength: 100 }),
});

// 生成不包含日期字段的普通对象
const plainObjectWithoutDatesArbitrary = fc.record({
  id: fc.integer({ min: 1, max: 1000000 }),
  name: fc.string({ minLength: 1, maxLength: 50 }),
  status: fc.constantFrom('active', 'inactive', 'pending'),
  password: fc.string({ minLength: 8, maxLength: 100 }),
});

describe('serialize.util Property-Based Tests - Date Serialization', () => {
  /**
   * Property 3: 序列化函数触发装饰器转换
   *
   * For any object containing date fields, when converted using toDto/toDtoList/toDtoPage,
   * all fields decorated with @DateFormat() SHALL be properly formatted.
   *
   * **Validates: Requirements 3.1, 3.2, 3.3**
   */
  describe('Property 3: 序列化函数触发装饰器转换', () => {
    it('toDto() SHALL trigger @DateFormat() decorator and format date fields', () => {
      fc.assert(
        fc.property(plainObjectWithDatesArbitrary, (plainObject) => {
          const result = toDto(TestDateResponseDto, plainObject);

          // 验证 createTime 被格式化为 YYYY-MM-DD HH:mm:ss
          expect(result!.createTime).toBeDefined();
          expect(typeof result!.createTime).toBe('string');
          // @ts-expect-error
          expect(defaultFormatRegex.test(result!.createTime)).toBe(true);

          // 验证 updateTime 被格式化为 YYYY-MM-DD HH:mm:ss
          expect(result!.updateTime).toBeDefined();
          expect(typeof result!.updateTime).toBe('string');
          // @ts-expect-error
          expect(defaultFormatRegex.test(result!.updateTime)).toBe(true);

          // 验证 birthDate 被格式化为 YYYY-MM-DD（自定义格式）
          expect(result!.birthDate).toBeDefined();
          expect(typeof result!.birthDate).toBe('string');
          // @ts-expect-error
          expect(dateOnlyFormatRegex.test(result!.birthDate)).toBe(true);

          // 验证 @Exclude 字段被排除
          expect(result!.password).toBeUndefined();
        }),
        { numRuns: 100 },
      );
    });

    it('toDtoList() SHALL trigger @DateFormat() decorator for each item in the list', () => {
      fc.assert(
        fc.property(fc.array(plainObjectWithDatesArbitrary, { minLength: 1, maxLength: 20 }), (plainList) => {
          const result = toDtoList(TestDateResponseDto, plainList);

          expect(result!.length).toBe(plainList.length);

          result!.forEach((dto, index) => {
            // 验证 createTime 被格式化
            expect(dto.createTime).toBeDefined();
            expect(typeof dto.createTime).toBe('string');
            // @ts-expect-error
            expect(defaultFormatRegex.test(dto.createTime)).toBe(true);

            // 验证 updateTime 被格式化
            expect(dto.updateTime).toBeDefined();
            expect(typeof dto.updateTime).toBe('string');
            // @ts-expect-error
            expect(defaultFormatRegex.test(dto.updateTime)).toBe(true);

            // 验证 birthDate 被格式化为自定义格式
            expect(dto.birthDate).toBeDefined();
            expect(typeof dto.birthDate).toBe('string');
            // @ts-expect-error
            expect(dateOnlyFormatRegex.test(dto.birthDate)).toBe(true);

            // 验证 @Exclude 字段被排除
            expect(dto.password).toBeUndefined();
          });
        }),
        { numRuns: 100 },
      );
    });

    it('toDtoPage() SHALL trigger @DateFormat() decorator for paginated data', () => {
      fc.assert(
        fc.property(
          fc.record({
            rows: fc.array(plainObjectWithDatesArbitrary, { minLength: 0, maxLength: 20 }),
            total: fc.integer({ min: 0, max: 10000 }),
          }),
          (pageData) => {
            const result = toDtoPage(TestDateResponseDto, pageData);

            expect(result!.total).toBe(pageData.total);
            expect(result!.rows.length).toBe(pageData.rows.length);

            result!.rows.forEach((dto) => {
              // 验证 createTime 被格式化
              expect(dto.createTime).toBeDefined();
              expect(typeof dto.createTime).toBe('string');
              // @ts-expect-error
              expect(defaultFormatRegex.test(dto.createTime)).toBe(true);

              // 验证 updateTime 被格式化
              expect(dto.updateTime).toBeDefined();
              expect(typeof dto.updateTime).toBe('string');
              // @ts-expect-error
              expect(defaultFormatRegex.test(dto.updateTime)).toBe(true);

              // 验证 birthDate 被格式化为自定义格式
              expect(dto.birthDate).toBeDefined();
              expect(typeof dto.birthDate).toBe('string');
              // @ts-expect-error
              expect(dateOnlyFormatRegex.test(dto.birthDate)).toBe(true);

              // 验证 @Exclude 字段被排除
              expect(dto.password).toBeUndefined();
            });
          },
        ),
        { numRuns: 100 },
      );
    });

    it('toDto() SHALL handle ISO string dates and format them correctly', () => {
      fc.assert(
        fc.property(
          fc.record({
            id: fc.integer({ min: 1, max: 1000000 }),
            name: fc.string({ minLength: 1, maxLength: 50 }),
            createTime: validDateArbitrary.map((d) => d.toISOString()),
            updateTime: validDateArbitrary.map((d) => d.toISOString()),
            birthDate: validDateArbitrary.map((d) => d.toISOString()),
            password: fc.string({ minLength: 8, maxLength: 100 }),
          }),
          (plainObject) => {
            const result = toDto(TestDateResponseDto, plainObject);

            // 验证 ISO 字符串日期也被正确格式化
            expect(result!.createTime).toBeDefined();
            expect(typeof result!.createTime).toBe('string');
            // @ts-expect-error
            expect(defaultFormatRegex.test(result!.createTime)).toBe(true);

            expect(result!.updateTime).toBeDefined();
            expect(typeof result!.updateTime).toBe('string');
            // @ts-expect-error
            expect(defaultFormatRegex.test(result!.updateTime)).toBe(true);

            expect(result!.birthDate).toBeDefined();
            expect(typeof result!.birthDate).toBe('string');
            // @ts-expect-error
            expect(dateOnlyFormatRegex.test(result!.birthDate)).toBe(true);
          },
        ),
        { numRuns: 100 },
      );
    });
  });

  /**
   * Property 4: 序列化函数向后兼容
   *
   * For any DTO without @DateFormat() decorator, the serialization functions
   * SHALL work normally without changing original field values.
   *
   * **Validates: Requirements 3.4**
   */
  describe('Property 4: 序列化函数向后兼容', () => {
    it('toDto() SHALL preserve field values for DTOs without @DateFormat()', () => {
      fc.assert(
        fc.property(plainObjectWithoutDatesArbitrary, (plainObject) => {
          const result = toDto(TestSimpleResponseDto, plainObject);

          // 验证 @Expose 字段值保持不变
          expect(result!.id).toBe(plainObject.id);
          expect(result!.name).toBe(plainObject.name);
          expect(result!.status).toBe(plainObject.status);

          // 验证 @Exclude 字段被排除
          expect(result!.password).toBeUndefined();
        }),
        { numRuns: 100 },
      );
    });

    it('toDtoList() SHALL preserve field values for DTOs without @DateFormat()', () => {
      fc.assert(
        fc.property(fc.array(plainObjectWithoutDatesArbitrary, { minLength: 1, maxLength: 20 }), (plainList) => {
          const result = toDtoList(TestSimpleResponseDto, plainList);

          expect(result!.length).toBe(plainList.length);

          result!.forEach((dto, index) => {
            const original = plainList[index];
            // 验证 @Expose 字段值保持不变
            expect(dto.id).toBe(original.id);
            expect(dto.name).toBe(original.name);
            expect(dto.status).toBe(original.status);

            // 验证 @Exclude 字段被排除
            expect(dto.password).toBeUndefined();
          });
        }),
        { numRuns: 100 },
      );
    });

    it('toDtoPage() SHALL preserve field values for DTOs without @DateFormat()', () => {
      fc.assert(
        fc.property(
          fc.record({
            rows: fc.array(plainObjectWithoutDatesArbitrary, { minLength: 1, maxLength: 20 }),
            total: fc.integer({ min: 0, max: 10000 }),
          }),
          (pageData) => {
            const result = toDtoPage(TestSimpleResponseDto, pageData);

            expect(result!.total).toBe(pageData.total);
            expect(result!.rows.length).toBe(pageData.rows.length);

            result!.rows.forEach((dto, index) => {
              const original = pageData.rows[index];
              // 验证 @Expose 字段值保持不变
              expect(dto.id).toBe(original.id);
              expect(dto.name).toBe(original.name);
              expect(dto.status).toBe(original.status);

              // 验证 @Exclude 字段被排除
              expect(dto.password).toBeUndefined();
            });
          },
        ),
        { numRuns: 100 },
      );
    });

    it('toDto() SHALL handle null/undefined date fields gracefully', () => {
      fc.assert(
        fc.property(
          fc.record({
            id: fc.integer({ min: 1, max: 1000000 }),
            name: fc.string({ minLength: 1, maxLength: 50 }),
            createTime: fc.constantFrom(null, undefined),
            updateTime: fc.constantFrom(null, undefined),
            birthDate: fc.constantFrom(null, undefined),
            password: fc.string({ minLength: 8, maxLength: 100 }),
          }),
          (plainObject) => {
            const result = toDto(TestDateResponseDto, plainObject);

            // 验证 null/undefined 日期字段保持原值
            expect(result!.createTime).toBe(plainObject.createTime);
            expect(result!.updateTime).toBe(plainObject.updateTime);
            expect(result!.birthDate).toBe(plainObject.birthDate);

            // 验证其他字段正常工作
            expect(result!.id).toBe(plainObject.id);
            expect(result!.name).toBe(plainObject.name);
          },
        ),
        { numRuns: 100 },
      );
    });
  });
});
