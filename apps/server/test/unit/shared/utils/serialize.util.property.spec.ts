/**
 * Property-Based Tests for serialize.util
 *
 * Feature: response-dto-refactor
 * These tests validate the correctness properties defined in the design document.
 */
import * as fc from 'fast-check';
import { Expose, Exclude } from 'class-transformer';
import { toDto, toDtoList, toDtoPage } from '@/shared/utils/serialize.util';
import { BaseResponseDto } from '@/shared/dto/base.response.dto';

/**
 * Test DTO that extends BaseResponseDto
 * Used to verify that @Exclude fields from base class are properly filtered
 */
class TestUserResponseDto extends BaseResponseDto {
  @Expose()
  id!: number;

  @Expose()
  username!: string;

  @Expose()
  email!: string;

  @Expose()
  status!: string;

  @Exclude()
  password!: string;

  @Exclude()
  secretKey!: string;
}

/**
 * Arbitrary generator for plain objects with both exposed and excluded fields
 */
const plainObjectArbitrary = fc.record({
  // Exposed fields
  id: fc.integer({ min: 1, max: 1000000 }),
  username: fc.string({ minLength: 1, maxLength: 50 }),
  email: fc.emailAddress(),
  status: fc.constantFrom('active', 'inactive', 'pending'),
  // Excluded fields (from TestUserResponseDto)
  password: fc.string({ minLength: 8, maxLength: 100 }),
  secretKey: fc.string({ minLength: 16, maxLength: 64 }),
  // Excluded fields (from BaseResponseDto)
  delFlag: fc.constantFrom('0', '1'),
  tenantId: fc.integer({ min: 1, max: 1000 }),
  createBy: fc.string({ minLength: 1, maxLength: 50 }),
  updateBy: fc.string({ minLength: 1, maxLength: 50 }),
  // Extra fields that should also be excluded
  extraField: fc.string(),
  internalData: fc.object(),
});

describe('serialize.util Property-Based Tests', () => {
  /**
   * Property 1: 序列化过滤属性
   *
   * For any plain object containing @Exclude decorated fields,
   * when converted using toDto with excludeExtraneousValues: true,
   * the result should NOT contain any @Exclude marked fields.
   *
   * Feature: response-dto-refactor, Property 1: 序列化过滤属性
   * Validates: Requirements 1.2, 1.3, 5.2
   */
  describe('Property 1: 序列化过滤属性 - @Exclude fields are properly filtered', () => {
    it('should filter out all @Exclude fields from single object conversion', () => {
      fc.assert(
        fc.property(plainObjectArbitrary, (plainObject) => {
          const result = toDto(TestUserResponseDto, plainObject);

          // Verify @Exclude fields from TestUserResponseDto are filtered
          expect(result!.password).toBeUndefined();
          expect(result!.secretKey).toBeUndefined();

          // Verify @Exclude fields from BaseResponseDto are filtered
          expect(result!.delFlag).toBeUndefined();
          expect(result!.tenantId).toBeUndefined();

          // Note: createBy and updateBy are @Expose fields in BaseResponseDto, so they should be preserved
          expect(result!.createBy).toBe(plainObject.createBy);
          expect(result!.updateBy).toBe(plainObject.updateBy);

          // Verify extra fields not in DTO are filtered
          expect((result as any).extraField).toBeUndefined();
          expect((result as any).internalData).toBeUndefined();
        }),
        { numRuns: 100 },
      );
    });

    it('should filter out all @Exclude fields from list conversion', () => {
      fc.assert(
        fc.property(fc.array(plainObjectArbitrary, { minLength: 1, maxLength: 20 }), (plainList) => {
          const result = toDtoList(TestUserResponseDto, plainList);

          expect(result!.length).toBe(plainList.length);

          result!.forEach((dto, index) => {
            const original = plainList[index];
            // Verify @Exclude fields are filtered for each item
            expect(dto.password).toBeUndefined();
            expect(dto.secretKey).toBeUndefined();
            expect(dto.delFlag).toBeUndefined();
            expect(dto.tenantId).toBeUndefined();

            // Note: createBy and updateBy are @Expose fields in BaseResponseDto, so they should be preserved
            expect(dto.createBy).toBe(original.createBy);
            expect(dto.updateBy).toBe(original.updateBy);

            expect((dto as any).extraField).toBeUndefined();
          });
        }),
        { numRuns: 100 },
      );
    });

    it('should filter out all @Exclude fields from paginated data conversion', () => {
      fc.assert(
        fc.property(
          fc.record({
            rows: fc.array(plainObjectArbitrary, { minLength: 0, maxLength: 20 }),
            total: fc.integer({ min: 0, max: 10000 }),
          }),
          (pageData) => {
            const result = toDtoPage(TestUserResponseDto, pageData);

            expect(result!.total).toBe(pageData.total);
            expect(result!.rows.length).toBe(pageData.rows.length);

            result!.rows.forEach((dto, index) => {
              const original = pageData.rows[index];
              // Verify @Exclude fields are filtered for each item
              expect(dto.password).toBeUndefined();
              expect(dto.secretKey).toBeUndefined();
              expect(dto.delFlag).toBeUndefined();
              expect(dto.tenantId).toBeUndefined();

              // Note: createBy and updateBy are @Expose fields in BaseResponseDto, so they should be preserved
              expect(dto.createBy).toBe(original.createBy);
              expect(dto.updateBy).toBe(original.updateBy);
            });
          },
        ),
        { numRuns: 100 },
      );
    });
  });

  /**
   * Property 2: 数据转换完整性属性
   *
   * For any plain object and corresponding Response DTO class,
   * when converted using toDto() or toDtoList(),
   * all @Expose marked fields should have values equal to the original data.
   *
   * Feature: response-dto-refactor, Property 2: 数据转换完整性属性
   * Validates: Requirements 4.1, 4.2
   */
  describe('Property 2: 数据转换完整性属性 - @Expose fields preserve values', () => {
    it('should preserve all @Expose field values in single object conversion', () => {
      fc.assert(
        fc.property(plainObjectArbitrary, (plainObject) => {
          const result = toDto(TestUserResponseDto, plainObject);

          // Verify @Expose fields have the same values as original
          expect(result!.id).toBe(plainObject.id);
          expect(result!.username).toBe(plainObject.username);
          expect(result!.email).toBe(plainObject.email);
          expect(result!.status).toBe(plainObject.status);
        }),
        { numRuns: 100 },
      );
    });

    it('should preserve all @Expose field values in list conversion', () => {
      fc.assert(
        fc.property(fc.array(plainObjectArbitrary, { minLength: 1, maxLength: 20 }), (plainList) => {
          const result = toDtoList(TestUserResponseDto, plainList);

          expect(result!.length).toBe(plainList.length);

          result!.forEach((dto, index) => {
            const original = plainList[index];
            // Verify @Expose fields have the same values as original
            expect(dto.id).toBe(original.id);
            expect(dto.username).toBe(original.username);
            expect(dto.email).toBe(original.email);
            expect(dto.status).toBe(original.status);
          });
        }),
        { numRuns: 100 },
      );
    });

    it('should preserve all @Expose field values in paginated data conversion', () => {
      fc.assert(
        fc.property(
          fc.record({
            rows: fc.array(plainObjectArbitrary, { minLength: 1, maxLength: 20 }),
            total: fc.integer({ min: 0, max: 10000 }),
          }),
          (pageData) => {
            const result = toDtoPage(TestUserResponseDto, pageData);

            expect(result!.total).toBe(pageData.total);
            expect(result!.rows.length).toBe(pageData.rows.length);

            result!.rows.forEach((dto, index) => {
              const original = pageData.rows[index];
              // Verify @Expose fields have the same values as original
              expect(dto.id).toBe(original.id);
              expect(dto.username).toBe(original.username);
              expect(dto.email).toBe(original.email);
              expect(dto.status).toBe(original.status);
            });
          },
        ),
        { numRuns: 100 },
      );
    });

    it('should handle missing @Expose fields gracefully', () => {
      fc.assert(
        fc.property(
          fc.record({
            id: fc.integer({ min: 1, max: 1000000 }),
            // Intentionally missing some @Expose fields
          }),
          (partialObject) => {
            const result = toDto(TestUserResponseDto, partialObject);

            // Present field should be preserved
            expect(result!.id).toBe(partialObject.id);

            // Missing @Expose fields should be undefined (not throw error)
            expect(result!.username).toBeUndefined();
            expect(result!.email).toBeUndefined();
            expect(result!.status).toBeUndefined();
          },
        ),
        { numRuns: 100 },
      );
    });
  });
});
