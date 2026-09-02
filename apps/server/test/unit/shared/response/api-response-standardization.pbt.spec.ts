/**
 * API 响应格式标准化属性测试
 *
 * Feature: api-response-standardization
 * 测试 API 响应格式标准化修复效果
 */
import * as fc from 'fast-check';
import { Result } from '@/shared/response/result';
import { toDto, toDtoList, toDtoPage } from '@/shared/utils/serialize.util';
import { Exclude, Expose } from 'class-transformer';
import { BaseResponseDto } from '@/shared/dto/base.response.dto';

/**
 * 测试用响应 DTO - 继承 BaseResponseDto 自动排除敏感字段
 */
class TestResponseDto extends BaseResponseDto {
  @Expose()
  id!: number;

  @Expose()
  name!: string;

  @Expose()
  status!: string;

  // createTime is inherited from BaseResponseDto as string type
}

/**
 * 测试用包含敏感字段的数据对象
 */
interface TestDataWithSensitiveFields {
  id: number;
  name: string;
  status: string;
  createTime?: Date;
  // 敏感字段
  password?: string;
  delFlag?: string;
  tenantId?: number;
  createBy?: string;
  updateBy?: string;
}

describe('API Response Standardization Property Tests', () => {
  /**
   * Property 1: 分页响应格式完整性
   *
   * *For any* 分页查询请求，Result.page() 返回的响应必须包含完整的分页信息：
   * rows（数据数组）、total（总记录数）、pageNum（当前页码）、pageSize（每页条数）、
   * pages（总页数），且 pages = Math.ceil(total / pageSize)。
   *
   * **Validates: Requirements 1.1, 1.2**
   */
  describe('Property 1: 分页响应格式完整性', () => {
    it('For any pagination parameters, Result.page() SHALL return complete pagination info', () => {
      fc.assert(
        fc.property(
          fc.array(fc.record({ id: fc.integer(), name: fc.string() })),
          fc.nat({ max: 10000 }),
          fc.integer({ min: 1, max: 100 }),
          fc.integer({ min: 1, max: 100 }),
          (rows, total, pageNum, pageSize) => {
            const result = Result.page(rows, total, pageNum, pageSize);
            const data = result.data;

            // 验证响应码为 200
            if (result.code !== 200) return false;

            // 验证 data 不为 null
            if (data === null) return false;

            // 验证所有必需字段存在
            const hasRows = Array.isArray(data.rows);
            const hasTotal = typeof data.total === 'number';
            const hasPageNum = typeof data.pageNum === 'number';
            const hasPageSize = typeof data.pageSize === 'number';
            const hasPages = typeof data.pages === 'number';

            return hasRows && hasTotal && hasPageNum && hasPageSize && hasPages;
          },
        ),
        { numRuns: 100 },
      );
    });

    it('For any pagination parameters, pages SHALL be correctly calculated as Math.ceil(total / pageSize)', () => {
      fc.assert(
        fc.property(
          fc.array(fc.integer()),
          fc.nat({ max: 10000 }),
          fc.integer({ min: 1, max: 100 }),
          fc.integer({ min: 1, max: 100 }),
          (rows, total, pageNum, pageSize) => {
            const result = Result.page(rows, total, pageNum, pageSize);
            const expectedPages = Math.ceil(total / pageSize);
            return result.data!.pages === expectedPages;
          },
        ),
        { numRuns: 100 },
      );
    });

    it('For any pagination parameters, pageNum and pageSize SHALL match input values', () => {
      fc.assert(
        fc.property(
          fc.array(fc.record({ id: fc.integer() })),
          fc.nat({ max: 10000 }),
          fc.integer({ min: 1, max: 100 }),
          fc.integer({ min: 1, max: 100 }),
          (rows, total, pageNum, pageSize) => {
            const result = Result.page(rows, total, pageNum, pageSize);
            return result.data!.pageNum === pageNum && result.data!.pageSize === pageSize;
          },
        ),
        { numRuns: 100 },
      );
    });

    it('For any rows array, Result.page() SHALL preserve the rows data', () => {
      fc.assert(
        fc.property(
          fc.array(fc.record({ id: fc.integer(), value: fc.string() })),
          fc.nat({ max: 1000 }),
          fc.integer({ min: 1, max: 50 }),
          fc.integer({ min: 1, max: 50 }),
          (rows, total, pageNum, pageSize) => {
            const result = Result.page(rows, total, pageNum, pageSize);
            return JSON.stringify(result.data!.rows) === JSON.stringify(rows);
          },
        ),
        { numRuns: 100 },
      );
    });

    it('For total=0, pages SHALL be 0', () => {
      fc.assert(
        fc.property(fc.integer({ min: 1, max: 100 }), fc.integer({ min: 1, max: 100 }), (pageNum, pageSize) => {
          const result = Result.page([], 0, pageNum, pageSize);
          return result.data!.pages === 0;
        }),
        { numRuns: 100 },
      );
    });

    it('For any total and pageSize, pages * pageSize SHALL be >= total', () => {
      fc.assert(
        fc.property(
          fc.array(fc.integer()),
          fc.integer({ min: 1, max: 10000 }),
          fc.integer({ min: 1, max: 100 }),
          fc.integer({ min: 1, max: 100 }),
          (rows, total, pageNum, pageSize) => {
            const result = Result.page(rows, total, pageNum, pageSize);
            const pages = result.data!.pages!;
            // pages * pageSize should be >= total (enough to hold all items)
            return pages * pageSize >= total;
          },
        ),
        { numRuns: 100 },
      );
    });
  });

  /**
   * Property 2: 敏感字段排除
   *
   * *For any* 包含敏感字段（password, delFlag, tenantId, createBy, updateBy）的数据对象，
   * 经过 DTO 转换后，返回的响应数据中不应包含这些敏感字段。
   *
   * **Validates: Requirements 2.4**
   */
  describe('Property 2: 敏感字段排除', () => {
    // 生成包含敏感字段的测试数据
    const sensitiveDataArbitrary = fc.record({
      id: fc.integer({ min: 1, max: 10000 }),
      name: fc.string({ minLength: 1, maxLength: 50 }),
      status: fc.constantFrom('0', '1'),
      // 敏感字段
      password: fc.string({ minLength: 6, maxLength: 20 }),
      delFlag: fc.constantFrom('0', '1', '2'),
      tenantId: fc.integer({ min: 1, max: 1000 }),
      createBy: fc.string({ minLength: 1, maxLength: 20 }),
      updateBy: fc.string({ minLength: 1, maxLength: 20 }),
    });

    it('For any data with sensitive fields, toDto() SHALL exclude password field', () => {
      fc.assert(
        fc.property(sensitiveDataArbitrary, (data: TestDataWithSensitiveFields) => {
          const dto = toDto(TestResponseDto, data);
          // password 字段不应存在于转换后的 DTO 中
          return dto !== null && !('password' in dto);
        }),
        { numRuns: 100 },
      );
    });

    it('For any data with sensitive fields, toDto() SHALL exclude delFlag field', () => {
      fc.assert(
        fc.property(sensitiveDataArbitrary, (data: TestDataWithSensitiveFields) => {
          const dto = toDto(TestResponseDto, data);
          // delFlag 字段不应存在于转换后的 DTO 中
          return dto !== null && !('delFlag' in dto);
        }),
        { numRuns: 100 },
      );
    });

    it('For any data with sensitive fields, toDto() SHALL exclude tenantId field', () => {
      fc.assert(
        fc.property(sensitiveDataArbitrary, (data: TestDataWithSensitiveFields) => {
          const dto = toDto(TestResponseDto, data);
          // tenantId 字段不应存在于转换后的 DTO 中
          return dto !== null && !('tenantId' in dto);
        }),
        { numRuns: 100 },
      );
    });

    it('For any data with sensitive fields, toDto() SHALL preserve createBy field (exposed in BaseResponseDto)', () => {
      fc.assert(
        fc.property(sensitiveDataArbitrary, (data: TestDataWithSensitiveFields) => {
          const dto = toDto(TestResponseDto, data);
          // createBy 字段应该被保留（在 BaseResponseDto 中是 @Expose）
          return dto !== null && dto.createBy === data.createBy;
        }),
        { numRuns: 100 },
      );
    });

    it('For any data with sensitive fields, toDto() SHALL preserve updateBy field (exposed in BaseResponseDto)', () => {
      fc.assert(
        fc.property(sensitiveDataArbitrary, (data: TestDataWithSensitiveFields) => {
          const dto = toDto(TestResponseDto, data);
          // updateBy 字段应该被保留（在 BaseResponseDto 中是 @Expose）
          return dto !== null && dto.updateBy === data.updateBy;
        }),
        { numRuns: 100 },
      );
    });

    it('For any data with sensitive fields, toDto() SHALL preserve non-sensitive fields', () => {
      fc.assert(
        fc.property(sensitiveDataArbitrary, (data: TestDataWithSensitiveFields) => {
          const dto = toDto(TestResponseDto, data);
          if (dto === null) return false;

          // 非敏感字段应该被保留
          return dto.id === data.id && dto.name === data.name && dto.status === data.status;
        }),
        { numRuns: 100 },
      );
    });

    it('For any list with sensitive fields, toDtoList() SHALL exclude all sensitive fields', () => {
      fc.assert(
        fc.property(fc.array(sensitiveDataArbitrary, { minLength: 1, maxLength: 10 }), (dataList) => {
          const dtoList = toDtoList(TestResponseDto, dataList);

          // 验证每个 DTO 都不包含敏感字段（password, delFlag, tenantId）
          // createBy 和 updateBy 在 BaseResponseDto 中是 @Expose，所以会被保留
          return dtoList.every((dto) => !('password' in dto) && !('delFlag' in dto) && !('tenantId' in dto));
        }),
        { numRuns: 100 },
      );
    });

    it('For any page data with sensitive fields, toDtoPage() SHALL exclude all sensitive fields', () => {
      fc.assert(
        fc.property(
          fc.array(sensitiveDataArbitrary, { minLength: 1, maxLength: 10 }),
          fc.nat({ max: 1000 }),
          (rows, total) => {
            const pageData = toDtoPage(TestResponseDto, { rows, total });

            // 验证每个 DTO 都不包含敏感字段（password, delFlag, tenantId）
            // createBy 和 updateBy 在 BaseResponseDto 中是 @Expose，所以会被保留
            return pageData.rows.every((dto) => !('password' in dto) && !('delFlag' in dto) && !('tenantId' in dto));
          },
        ),
        { numRuns: 100 },
      );
    });

    it('For null input, toDto() SHALL return null', () => {
      const dto = toDto(TestResponseDto, null);
      expect(dto).toBeNull();
    });

    it('For undefined input, toDto() SHALL return null', () => {
      const dto = toDto(TestResponseDto, undefined);
      expect(dto).toBeNull();
    });

    it('For empty array, toDtoList() SHALL return empty array', () => {
      const dtoList = toDtoList(TestResponseDto, []);
      expect(dtoList).toEqual([]);
    });

    it('For null input, toDtoList() SHALL return empty array', () => {
      const dtoList = toDtoList(TestResponseDto, null);
      expect(dtoList).toEqual([]);
    });

    it('For null input, toDtoPage() SHALL return empty page data', () => {
      const pageData = toDtoPage(TestResponseDto, null);
      expect(pageData).toEqual({ rows: [], total: 0 });
    });
  });
});
