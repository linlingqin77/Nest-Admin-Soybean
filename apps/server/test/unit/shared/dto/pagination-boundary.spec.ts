import { CursorPaginationDto, PageQueryDto, PageResponseDto, SortOrder } from '@/shared/dto/base.dto';

/**
 * Boundary Condition Tests for Pagination DTOs
 *
 * Feature: enterprise-app-optimization
 * Validates: Requirements 3.3.6
 *
 * Tests boundary conditions for pagination parameters:
 * - Minimum/maximum values
 * - Edge cases
 * - Default values
 */
describe('Pagination Boundary Condition Tests', () => {
  describe('PageQueryDto Boundary Tests', () => {
    describe('pageNum boundaries', () => {
      it('should use default pageNum=1 when not provided', () => {
        const dto = new PageQueryDto();
        expect(dto.pageNum).toBe(1);
        expect(dto.skip).toBe(0);
      });

      it('should handle pageNum=1 (minimum valid value)', () => {
        const dto = new PageQueryDto();
        dto.pageNum = 1;
        expect(dto.skip).toBe(0);
      });

      it('should handle large pageNum values', () => {
        const dto = new PageQueryDto();
        dto.pageNum = 1000000;
        dto.pageSize = 10;
        expect(dto.skip).toBe(9999990);
      });

      it('should handle pageNum=0 gracefully (edge case)', () => {
        const dto = new PageQueryDto();
        dto.pageNum = 0;
        dto.pageSize = 10;
        // Implementation uses (pageNum || 1) which treats 0 as falsy, so uses 1
        expect(dto.skip).toBe(0);
      });

      it('should handle undefined pageNum', () => {
        const dto = new PageQueryDto();
        dto.pageNum = undefined;
        expect(dto.skip).toBe(0); // Uses default 1
      });
    });

    describe('pageSize boundaries', () => {
      it('should use default pageSize=10 when not provided', () => {
        const dto = new PageQueryDto();
        expect(dto.pageSize).toBe(10);
        expect(dto.take).toBe(10);
      });

      it('should handle pageSize=1 (minimum valid value)', () => {
        const dto = new PageQueryDto();
        dto.pageSize = 1;
        expect(dto.take).toBe(1);
      });

      it('should handle pageSize=100 (maximum valid value)', () => {
        const dto = new PageQueryDto();
        dto.pageSize = 100;
        expect(dto.take).toBe(100);
      });

      it('should handle undefined pageSize', () => {
        const dto = new PageQueryDto();
        dto.pageSize = undefined;
        expect(dto.take).toBe(10); // Uses default
      });
    });

    describe('skip calculation boundaries', () => {
      it('should calculate skip=0 for first page', () => {
        const dto = new PageQueryDto();
        dto.pageNum = 1;
        dto.pageSize = 10;
        expect(dto.skip).toBe(0);
      });

      it('should calculate skip correctly for second page', () => {
        const dto = new PageQueryDto();
        dto.pageNum = 2;
        dto.pageSize = 10;
        expect(dto.skip).toBe(10);
      });

      it('should calculate skip correctly for large page numbers', () => {
        const dto = new PageQueryDto();
        dto.pageNum = 100;
        dto.pageSize = 50;
        expect(dto.skip).toBe(4950);
      });
    });

    describe('orderBy boundaries', () => {
      it('should return undefined when no orderByColumn', () => {
        const dto = new PageQueryDto();
        expect(dto.getOrderBy()).toBeUndefined();
      });

      it('should use default field when provided', () => {
        const dto = new PageQueryDto();
        const orderBy = dto.getOrderBy('createTime');
        expect(orderBy).toEqual({ createTime: 'desc' });
      });

      it('should use orderByColumn when set', () => {
        const dto = new PageQueryDto();
        dto.orderByColumn = 'userName';
        const orderBy = dto.getOrderBy('createTime');
        expect(orderBy).toEqual({ userName: 'desc' });
      });

      it('should respect isAsc setting', () => {
        const dto = new PageQueryDto();
        dto.orderByColumn = 'userName';
        dto.isAsc = SortOrder.ASC;
        const orderBy = dto.getOrderBy();
        expect(orderBy).toEqual({ userName: 'asc' });
      });
    });

    describe('dateRange boundaries', () => {
      it('should return undefined when no date range', () => {
        const dto = new PageQueryDto();
        expect(dto.getDateRange()).toBeUndefined();
      });

      it('should handle only beginTime', () => {
        const dto = new PageQueryDto();
        dto.params = { beginTime: '2024-01-01' };
        const range = dto.getDateRange();
        expect(range).toBeDefined();
        expect(range!.createTime.gte).toEqual(new Date('2024-01-01'));
        expect(range!.createTime.lte).toBeUndefined();
      });

      it('should handle only endTime', () => {
        const dto = new PageQueryDto();
        dto.params = { endTime: '2024-12-31' };
        const range = dto.getDateRange();
        expect(range).toBeDefined();
        expect(range!.createTime.gte).toBeUndefined();
        expect(range!.createTime.lte).toEqual(new Date('2024-12-31 23:59:59'));
      });

      it('should handle both beginTime and endTime', () => {
        const dto = new PageQueryDto();
        dto.params = { beginTime: '2024-01-01', endTime: '2024-12-31' };
        const range = dto.getDateRange();
        expect(range).toBeDefined();
        expect(range!.createTime.gte).toEqual(new Date('2024-01-01'));
        expect(range!.createTime.lte).toEqual(new Date('2024-12-31 23:59:59'));
      });

      it('should use custom field name', () => {
        const dto = new PageQueryDto();
        dto.params = { beginTime: '2024-01-01' };
        const range = dto.getDateRange('updateTime');
        expect(range).toBeDefined();
        expect(range!.updateTime).toBeDefined();
      });
    });

    describe('toPaginationParams boundaries', () => {
      it('should return correct params with defaults', () => {
        const dto = new PageQueryDto();
        const params = dto.toPaginationParams();
        expect(params).toEqual({
          skip: 0,
          take: 10,
          pageNum: 1,
          pageSize: 10,
        });
      });

      it('should return correct params with custom values', () => {
        const dto = new PageQueryDto();
        dto.pageNum = 5;
        dto.pageSize = 20;
        const params = dto.toPaginationParams();
        expect(params).toEqual({
          skip: 80,
          take: 20,
          pageNum: 5,
          pageSize: 20,
        });
      });
    });
  });

  describe('CursorPaginationDto Boundary Tests', () => {
    describe('limit boundaries', () => {
      it('should use default limit=10 when not provided', () => {
        const dto = new CursorPaginationDto();
        expect(dto.limit).toBe(10);
        expect(dto.take).toBe(10);
      });

      it('should handle limit=1 (minimum valid value)', () => {
        const dto = new CursorPaginationDto();
        dto.limit = 1;
        expect(dto.take).toBe(1);
      });

      it('should handle limit=100 (maximum valid value)', () => {
        const dto = new CursorPaginationDto();
        dto.limit = 100;
        expect(dto.take).toBe(100);
      });
    });

    describe('cursor boundaries', () => {
      it('should return undefined cursor condition when no cursor', () => {
        const dto = new CursorPaginationDto();
        expect(dto.getCursorCondition()).toBeUndefined();
      });

      it('should handle numeric cursor', () => {
        const dto = new CursorPaginationDto();
        dto.cursor = '123';
        dto.direction = 'forward';
        dto.isAsc = SortOrder.DESC;
        const condition = dto.getCursorCondition();
        expect(condition).toEqual({ id: { lt: 123 } });
      });

      it('should handle string cursor', () => {
        const dto = new CursorPaginationDto();
        dto.cursor = 'abc-123';
        dto.direction = 'forward';
        dto.isAsc = SortOrder.DESC;
        const condition = dto.getCursorCondition();
        expect(condition).toEqual({ id: { lt: 'abc-123' } });
      });

      it('should handle forward + asc direction', () => {
        const dto = new CursorPaginationDto();
        dto.cursor = '100';
        dto.direction = 'forward';
        dto.isAsc = SortOrder.ASC;
        const condition = dto.getCursorCondition();
        expect(condition).toEqual({ id: { gt: 100 } });
      });

      it('should handle backward + desc direction', () => {
        const dto = new CursorPaginationDto();
        dto.cursor = '100';
        dto.direction = 'backward';
        dto.isAsc = SortOrder.DESC;
        const condition = dto.getCursorCondition();
        expect(condition).toEqual({ id: { gt: 100 } });
      });

      it('should handle backward + asc direction', () => {
        const dto = new CursorPaginationDto();
        dto.cursor = '100';
        dto.direction = 'backward';
        dto.isAsc = SortOrder.ASC;
        const condition = dto.getCursorCondition();
        expect(condition).toEqual({ id: { lt: 100 } });
      });

      it('should use custom cursor field', () => {
        const dto = new CursorPaginationDto();
        dto.cursor = '100';
        dto.direction = 'forward';
        dto.isAsc = SortOrder.DESC;
        const condition = dto.getCursorCondition('userId');
        expect(condition).toEqual({ userId: { lt: 100 } });
      });
    });

    describe('direction boundaries', () => {
      it('should default to forward direction', () => {
        const dto = new CursorPaginationDto();
        expect(dto.direction).toBe('forward');
      });

      it('should handle backward direction', () => {
        const dto = new CursorPaginationDto();
        dto.direction = 'backward';
        expect(dto.direction).toBe('backward');
      });
    });
  });

  describe('PageResponseDto Boundary Tests', () => {
    describe('pages calculation boundaries', () => {
      it('should calculate pages=0 when total=0', () => {
        const response = new PageResponseDto([], 0, 1, 10);
        expect(response.pages).toBe(0);
      });

      it('should calculate pages=1 when total <= pageSize', () => {
        const response = new PageResponseDto([1, 2, 3], 3, 1, 10);
        expect(response.pages).toBe(1);
      });

      it('should calculate pages correctly when total > pageSize', () => {
        const response = new PageResponseDto([1, 2, 3, 4, 5, 6, 7, 8, 9, 10], 25, 1, 10);
        expect(response.pages).toBe(3);
      });

      it('should handle exact division', () => {
        const response = new PageResponseDto([1, 2, 3, 4, 5, 6, 7, 8, 9, 10], 20, 1, 10);
        expect(response.pages).toBe(2);
      });

      it('should handle pageSize=0 gracefully', () => {
        const response = new PageResponseDto([], 10, 1, 0);
        expect(response.pages).toBe(0);
      });

      it('should handle large total values', () => {
        const response = new PageResponseDto([], 1000000, 1, 100);
        expect(response.pages).toBe(10000);
      });
    });

    describe('static factory methods', () => {
      it('should create response with create method', () => {
        const response = PageResponseDto.create([1, 2, 3], 100, 1, 10);
        expect(response.rows).toEqual([1, 2, 3]);
        expect(response.total).toBe(100);
        expect(response.pageNum).toBe(1);
        expect(response.pageSize).toBe(10);
        expect(response.pages).toBe(10);
      });

      it('should create response from query', () => {
        const query = new PageQueryDto();
        query.pageNum = 2;
        query.pageSize = 20;
        const response = PageResponseDto.fromQuery([1, 2, 3], 100, query);
        expect(response.pageNum).toBe(2);
        expect(response.pageSize).toBe(20);
        expect(response.pages).toBe(5);
      });

      it('should use defaults when query has undefined values', () => {
        const query = new PageQueryDto();
        query.pageNum = undefined;
        query.pageSize = undefined;
        const response = PageResponseDto.fromQuery([1, 2, 3], 100, query);
        expect(response.pageNum).toBe(1);
        expect(response.pageSize).toBe(10);
      });
    });
  });
});
