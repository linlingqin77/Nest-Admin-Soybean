import * as fc from 'fast-check';
import {
  PageQueryDto,
  CursorPaginationDto,
  PageResponseDto,
  CursorPageResponseDto,
  CursorPaginationMeta,
  SortOrder,
} from './base.dto';
import { PaginationHelper } from '../utils/pagination.helper';

/**
 * 属性测试：分页一致性
 *
 * Feature: enterprise-app-optimization
 * Property 11: 分页一致性
 * Validates: Requirements 6.4
 *
 * 对于任意分页查询，返回的数据应该符合统一格式：
 * { rows: [], total: number, pageNum: number, pageSize: number, pages: number }
 */
describe('Pagination Property-Based Tests', () => {
  /**
   * Property 11: 分页一致性
   * 对于任意分页查询，返回的数据应该符合统一格式
   */
  describe('Property 11: Pagination Consistency', () => {
    describe('PageQueryDto', () => {
      it('should always produce valid pagination parameters for any pageNum and pageSize', () => {
        fc.assert(
          fc.property(
            fc.integer({ min: 1, max: 1000 }),
            fc.integer({ min: 1, max: 100 }),
            (pageNum, pageSize) => {
              const query = new PageQueryDto();
              query.pageNum = pageNum;
              query.pageSize = pageSize;

              // 验证 skip 计算正确
              const expectedSkip = (pageNum - 1) * pageSize;
              expect(query.skip).toBe(expectedSkip);

              // 验证 take 等于 pageSize
              expect(query.take).toBe(pageSize);

              // 验证 toPaginationParams 返回正确格式
              const params = query.toPaginationParams();
              expect(params.skip).toBe(expectedSkip);
              expect(params.take).toBe(pageSize);
              expect(params.pageNum).toBe(pageNum);
              expect(params.pageSize).toBe(pageSize);
            },
          ),
          { numRuns: 100 },
        );
      });

      it('should handle default values correctly', () => {
        fc.assert(
          fc.property(
            fc.option(fc.integer({ min: 1, max: 1000 }), { nil: undefined }),
            fc.option(fc.integer({ min: 1, max: 100 }), { nil: undefined }),
            (pageNum, pageSize) => {
              const query = new PageQueryDto();
              if (pageNum !== undefined) query.pageNum = pageNum;
              if (pageSize !== undefined) query.pageSize = pageSize;

              // 验证默认值
              const effectivePageNum = pageNum ?? 1;
              const effectivePageSize = pageSize ?? 10;

              expect(query.skip).toBe((effectivePageNum - 1) * effectivePageSize);
              expect(query.take).toBe(effectivePageSize);
            },
          ),
          { numRuns: 100 },
        );
      });

      it('should produce valid orderBy configuration', () => {
        fc.assert(
          fc.property(
            fc.option(fc.string({ minLength: 1, maxLength: 50 }), { nil: undefined }),
            fc.option(fc.constantFrom(SortOrder.ASC, SortOrder.DESC), { nil: undefined }),
            fc.option(fc.string({ minLength: 1, maxLength: 50 }), { nil: undefined }),
            (orderByColumn, isAsc, defaultField) => {
              const query = new PageQueryDto();
              if (orderByColumn !== undefined) query.orderByColumn = orderByColumn;
              if (isAsc !== undefined) query.isAsc = isAsc;

              const orderBy = query.getOrderBy(defaultField);

              if (orderByColumn || defaultField) {
                expect(orderBy).toBeDefined();
                const field = orderByColumn || defaultField;
                expect(orderBy![field!]).toBe(isAsc || SortOrder.DESC);
              } else {
                expect(orderBy).toBeUndefined();
              }
            },
          ),
          { numRuns: 100 },
        );
      });
    });

    describe('PageResponseDto', () => {
      it('should always produce valid pagination response format', () => {
        fc.assert(
          fc.property(
            fc.array(fc.record({ id: fc.integer(), name: fc.string() }), { minLength: 0, maxLength: 50 }),
            fc.integer({ min: 0, max: 10000 }),
            fc.integer({ min: 1, max: 1000 }),
            fc.integer({ min: 1, max: 100 }),
            (rows, total, pageNum, pageSize) => {
              const response = PageResponseDto.create(rows, total, pageNum, pageSize);

              // 验证响应格式
              expect(response.rows).toEqual(rows);
              expect(response.total).toBe(total);
              expect(response.pageNum).toBe(pageNum);
              expect(response.pageSize).toBe(pageSize);

              // 验证页数计算正确
              const expectedPages = pageSize > 0 ? Math.ceil(total / pageSize) : 0;
              expect(response.pages).toBe(expectedPages);

              // 验证页数是非负整数
              expect(response.pages).toBeGreaterThanOrEqual(0);
              expect(Number.isInteger(response.pages)).toBe(true);
            },
          ),
          { numRuns: 100 },
        );
      });

      it('should create response from PageQueryDto correctly', () => {
        fc.assert(
          fc.property(
            fc.array(fc.record({ id: fc.integer() }), { minLength: 0, maxLength: 20 }),
            fc.integer({ min: 0, max: 1000 }),
            fc.integer({ min: 1, max: 100 }),
            fc.integer({ min: 1, max: 100 }),
            (rows, total, pageNum, pageSize) => {
              const query = new PageQueryDto();
              query.pageNum = pageNum;
              query.pageSize = pageSize;

              const response = PageResponseDto.fromQuery(rows, total, query);

              expect(response.rows).toEqual(rows);
              expect(response.total).toBe(total);
              expect(response.pageNum).toBe(pageNum);
              expect(response.pageSize).toBe(pageSize);
            },
          ),
          { numRuns: 100 },
        );
      });
    });

    describe('PaginationHelper', () => {
      it('should produce consistent pagination parameters', () => {
        fc.assert(
          fc.property(
            fc.integer({ min: 1, max: 1000 }),
            fc.integer({ min: 1, max: 100 }),
            (pageNum, pageSize) => {
              const params = PaginationHelper.getPagination({ pageNum, pageSize });

              // 验证参数一致性
              expect(params.pageNum).toBe(pageNum);
              expect(params.pageSize).toBe(pageSize);
              expect(params.skip).toBe((pageNum - 1) * pageSize);
              expect(params.take).toBe(pageSize);
            },
          ),
          { numRuns: 100 },
        );
      });

      it('should handle string parameters correctly', () => {
        fc.assert(
          fc.property(
            fc.integer({ min: 1, max: 1000 }),
            fc.integer({ min: 1, max: 100 }),
            (pageNum, pageSize) => {
              const params = PaginationHelper.getPagination({
                pageNum: String(pageNum),
                pageSize: String(pageSize),
              });

              expect(params.pageNum).toBe(pageNum);
              expect(params.pageSize).toBe(pageSize);
            },
          ),
          { numRuns: 100 },
        );
      });

      it('should validate pagination parameters correctly', () => {
        fc.assert(
          fc.property(
            fc.integer({ min: -100, max: 1000 }),
            fc.integer({ min: -100, max: 200 }),
            (pageNum, pageSize) => {
              const validated = PaginationHelper.validatePaginationParams(pageNum, pageSize);

              // pageNum 应该至少为 1
              expect(validated.pageNum).toBeGreaterThanOrEqual(1);

              // pageSize 应该在 1-100 之间
              expect(validated.pageSize).toBeGreaterThanOrEqual(1);
              expect(validated.pageSize).toBeLessThanOrEqual(100);
            },
          ),
          { numRuns: 100 },
        );
      });

      it('should calculate pages correctly', () => {
        fc.assert(
          fc.property(
            fc.integer({ min: 0, max: 10000 }),
            fc.integer({ min: 1, max: 100 }),
            (total, pageSize) => {
              const pages = PaginationHelper.calculatePages(total, pageSize);

              // 验证页数计算
              const expectedPages = Math.ceil(total / pageSize);
              expect(pages).toBe(expectedPages);

              // 验证页数是非负整数
              expect(pages).toBeGreaterThanOrEqual(0);
              expect(Number.isInteger(pages)).toBe(true);
            },
          ),
          { numRuns: 100 },
        );
      });

      it('should create page response with correct format', () => {
        fc.assert(
          fc.property(
            fc.array(fc.record({ id: fc.integer() }), { minLength: 0, maxLength: 20 }),
            fc.integer({ min: 0, max: 1000 }),
            fc.integer({ min: 1, max: 100 }),
            fc.integer({ min: 1, max: 100 }),
            (rows, total, pageNum, pageSize) => {
              const response = PaginationHelper.createPageResponse(rows, total, { pageNum, pageSize });

              // 验证响应格式一致性
              expect(response).toHaveProperty('rows');
              expect(response).toHaveProperty('total');
              expect(response).toHaveProperty('pageNum');
              expect(response).toHaveProperty('pageSize');
              expect(response).toHaveProperty('pages');

              expect(response.rows).toEqual(rows);
              expect(response.total).toBe(total);
              expect(response.pageNum).toBe(pageNum);
              expect(response.pageSize).toBe(pageSize);
            },
          ),
          { numRuns: 100 },
        );
      });
    });
  });

  /**
   * 游标分页一致性测试
   */
  describe('Cursor Pagination Consistency', () => {
    describe('CursorPaginationDto', () => {
      it('should produce valid cursor pagination parameters', () => {
        fc.assert(
          fc.property(
            fc.option(fc.string({ minLength: 1, maxLength: 20 }), { nil: undefined }),
            fc.integer({ min: 1, max: 100 }),
            fc.constantFrom('forward', 'backward') as fc.Arbitrary<'forward' | 'backward'>,
            fc.option(fc.string({ minLength: 1, maxLength: 50 }), { nil: undefined }),
            fc.constantFrom(SortOrder.ASC, SortOrder.DESC),
            (cursor, limit, direction, orderByColumn, isAsc) => {
              const query = new CursorPaginationDto();
              if (cursor !== undefined) query.cursor = cursor;
              query.limit = limit;
              query.direction = direction;
              if (orderByColumn !== undefined) query.orderByColumn = orderByColumn;
              query.isAsc = isAsc;

              // 验证 take 等于 limit
              expect(query.take).toBe(limit);

              // 验证 orderBy 配置
              const orderBy = query.getOrderBy();
              const field = orderByColumn || 'id';
              expect(orderBy[field]).toBe(isAsc);

              // 验证 toCursorParams 返回正确格式
              const params = query.toCursorParams();
              expect(params.cursor).toBe(cursor);
              expect(params.limit).toBe(limit);
              expect(params.direction).toBe(direction);
              expect(params.orderByColumn).toBe(orderByColumn || 'id');
              expect(params.isAsc).toBe(isAsc);
            },
          ),
          { numRuns: 100 },
        );
      });

      it('should produce correct cursor condition', () => {
        fc.assert(
          fc.property(
            fc.string({ minLength: 1, maxLength: 20 }),
            fc.constantFrom('forward', 'backward') as fc.Arbitrary<'forward' | 'backward'>,
            fc.constantFrom(SortOrder.ASC, SortOrder.DESC),
            fc.string({ minLength: 1, maxLength: 20 }),
            (cursor, direction, isAsc, cursorField) => {
              const query = new CursorPaginationDto();
              query.cursor = cursor;
              query.direction = direction;
              query.isAsc = isAsc;

              const condition = query.getCursorCondition(cursorField);

              expect(condition).toBeDefined();
              expect(condition![cursorField]).toBeDefined();

              // 验证操作符正确
              const isAscending = isAsc === SortOrder.ASC;
              const isForward = direction === 'forward';
              const expectedOperator = (isForward && isAscending) || (!isForward && !isAscending) ? 'gt' : 'lt';
              expect(condition![cursorField][expectedOperator]).toBeDefined();
            },
          ),
          { numRuns: 100 },
        );
      });

      it('should return undefined cursor condition when no cursor', () => {
        fc.assert(
          fc.property(
            fc.integer({ min: 1, max: 100 }),
            fc.constantFrom('forward', 'backward') as fc.Arbitrary<'forward' | 'backward'>,
            (limit, direction) => {
              const query = new CursorPaginationDto();
              query.limit = limit;
              query.direction = direction;
              // cursor is undefined

              const condition = query.getCursorCondition();
              expect(condition).toBeUndefined();
            },
          ),
          { numRuns: 100 },
        );
      });
    });

    describe('CursorPageResponseDto', () => {
      it('should produce valid cursor pagination response format', () => {
        fc.assert(
          fc.property(
            fc.array(fc.record({ id: fc.integer(), name: fc.string() }), { minLength: 0, maxLength: 20 }),
            fc.boolean(),
            fc.constantFrom('forward', 'backward') as fc.Arbitrary<'forward' | 'backward'>,
            (rows, hasMore, direction) => {
              const response = CursorPageResponseDto.create(rows, hasMore, 'id', direction);

              // 验证响应格式
              expect(response.rows).toEqual(rows);
              expect(response.meta).toBeDefined();
              expect(response.meta).toHaveProperty('hasNextPage');
              expect(response.meta).toHaveProperty('hasPreviousPage');
              expect(response.meta).toHaveProperty('nextCursor');
              expect(response.meta).toHaveProperty('previousCursor');
              expect(response.meta).toHaveProperty('count');

              // 验证 count 正确
              expect(response.meta.count).toBe(rows.length);

              // 验证游标正确设置
              if (rows.length > 0) {
                expect(response.meta.nextCursor).toBe(String(rows[rows.length - 1].id));
                expect(response.meta.previousCursor).toBe(String(rows[0].id));
              }
            },
          ),
          { numRuns: 100 },
        );
      });

      it('should set hasNextPage and hasPreviousPage correctly based on direction', () => {
        fc.assert(
          fc.property(
            fc.array(fc.record({ id: fc.integer() }), { minLength: 1, maxLength: 10 }),
            fc.boolean(),
            fc.constantFrom('forward', 'backward') as fc.Arbitrary<'forward' | 'backward'>,
            (rows, hasMore, direction) => {
              const response = CursorPageResponseDto.create(rows, hasMore, 'id', direction);

              if (direction === 'forward') {
                expect(response.meta.hasNextPage).toBe(hasMore);
                expect(response.meta.hasPreviousPage).toBe(rows.length > 0);
              } else {
                expect(response.meta.hasNextPage).toBe(rows.length > 0);
                expect(response.meta.hasPreviousPage).toBe(hasMore);
              }
            },
          ),
          { numRuns: 100 },
        );
      });
    });

    describe('CursorPaginationMeta', () => {
      it('should create valid meta object', () => {
        fc.assert(
          fc.property(
            fc.boolean(),
            fc.boolean(),
            fc.option(fc.string({ minLength: 1, maxLength: 20 }), { nil: undefined }),
            fc.option(fc.string({ minLength: 1, maxLength: 20 }), { nil: undefined }),
            fc.integer({ min: 0, max: 100 }),
            (hasNextPage, hasPreviousPage, nextCursor, previousCursor, count) => {
              const meta = new CursorPaginationMeta({
                hasNextPage,
                hasPreviousPage,
                nextCursor,
                previousCursor,
                count,
              });

              expect(meta.hasNextPage).toBe(hasNextPage);
              expect(meta.hasPreviousPage).toBe(hasPreviousPage);
              expect(meta.nextCursor).toBe(nextCursor);
              expect(meta.previousCursor).toBe(previousCursor);
              expect(meta.count).toBe(count);
            },
          ),
          { numRuns: 100 },
        );
      });
    });
  });
});
