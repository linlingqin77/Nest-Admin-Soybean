import { PaginationHelper } from '@/shared/utils/pagination.helper';
import { CursorPaginationDto, PageQueryDto } from '@/shared/dto/base.dto';

describe('PaginationHelper', () => {
  describe('getPagination', () => {
    it('应该返回默认分页参数', () => {
      const result = PaginationHelper.getPagination();
      expect(result).toEqual({
        skip: 0,
        take: 10,
        pageNum: 1,
        pageSize: 10,
      });
    });

    it('应该正确计算 skip 值', () => {
      const result = PaginationHelper.getPagination({ pageNum: 3, pageSize: 20 });
      expect(result.skip).toBe(40); // (3-1) * 20
      expect(result.take).toBe(20);
      expect(result.pageNum).toBe(3);
      expect(result.pageSize).toBe(20);
    });

    it('应该处理字符串类型的参数', () => {
      const result = PaginationHelper.getPagination({ pageNum: '2', pageSize: '15' });
      expect(result.skip).toBe(15);
      expect(result.take).toBe(15);
      expect(result.pageNum).toBe(2);
      expect(result.pageSize).toBe(15);
    });

    it('应该处理无效的 pageNum', () => {
      const result = PaginationHelper.getPagination({ pageNum: 0, pageSize: 10 });
      expect(result.pageNum).toBe(1);
      expect(result.skip).toBe(0);
    });

    it('应该处理负数 pageNum', () => {
      const result = PaginationHelper.getPagination({ pageNum: -1, pageSize: 10 });
      expect(result.pageNum).toBe(1);
      expect(result.skip).toBe(0);
    });

    it('应该处理无效的 pageSize', () => {
      const result = PaginationHelper.getPagination({ pageNum: 1, pageSize: 0 });
      expect(result.pageSize).toBe(10);
      expect(result.take).toBe(10);
    });

    it('应该处理负数 pageSize', () => {
      const result = PaginationHelper.getPagination({ pageNum: 1, pageSize: -5 });
      expect(result.pageSize).toBe(10);
      expect(result.take).toBe(10);
    });
  });

  describe('paginate', () => {
    it('应该并行执行查询和计数', async () => {
      const mockData = [{ id: 1 }, { id: 2 }];
      const findMany = jest.fn().mockResolvedValue(mockData);
      const count = jest.fn().mockResolvedValue(100);

      const result = await PaginationHelper.paginate(findMany, count);

      expect(findMany).toHaveBeenCalled();
      expect(count).toHaveBeenCalled();
      expect(result).toEqual({
        rows: mockData,
        total: 100,
      });
    });

    it('应该处理空结果', async () => {
      const findMany = jest.fn().mockResolvedValue([]);
      const count = jest.fn().mockResolvedValue(0);

      const result = await PaginationHelper.paginate(findMany, count);

      expect(result).toEqual({
        rows: [],
        total: 0,
      });
    });
  });

  describe('createPageResponse', () => {
    it('应该创建正确的分页响应', () => {
      const rows = [{ id: 1 }, { id: 2 }];
      const total = 100;
      const query = { pageNum: 2, pageSize: 10 };

      const result = PaginationHelper.createPageResponse(rows, total, query);

      expect(result.rows).toEqual(rows);
      expect(result.total).toBe(100);
      expect(result.pageNum).toBe(2);
      expect(result.pageSize).toBe(10);
      expect(result.pages).toBe(10); // 100 / 10
    });

    it('应该处理默认分页参数', () => {
      const rows = [{ id: 1 }];
      const total = 50;
      const query = {};

      const result = PaginationHelper.createPageResponse(rows, total, query);

      expect(result.pageNum).toBe(1);
      expect(result.pageSize).toBe(10);
      expect(result.pages).toBe(5);
    });
  });

  describe('buildDateRange', () => {
    it('应该返回 undefined 当没有日期参数时', () => {
      expect(PaginationHelper.buildDateRange()).toBeUndefined();
      expect(PaginationHelper.buildDateRange({})).toBeUndefined();
    });

    it('应该构建开始日期条件', () => {
      const result = PaginationHelper.buildDateRange({ beginTime: '2024-01-01' });
      expect(result?.gte).toEqual(new Date('2024-01-01'));
    });

    it('应该构建结束日期条件', () => {
      const result = PaginationHelper.buildDateRange({ endTime: '2024-12-31' });
      expect(result?.lte).toEqual(new Date('2024-12-31'));
    });

    it('应该构建日期范围条件', () => {
      const result = PaginationHelper.buildDateRange({
        beginTime: '2024-01-01',
        endTime: '2024-12-31',
      });
      expect(result?.gte).toEqual(new Date('2024-01-01'));
      expect(result?.lte).toEqual(new Date('2024-12-31'));
    });
  });

  describe('buildStringFilter', () => {
    it('应该返回 undefined 当值为空时', () => {
      expect(PaginationHelper.buildStringFilter()).toBeUndefined();
      expect(PaginationHelper.buildStringFilter('')).toBeUndefined();
    });

    it('应该构建模糊查询条件', () => {
      const result = PaginationHelper.buildStringFilter('test');
      expect(result).toEqual({ contains: 'test' });
    });
  });

  describe('buildInFilter', () => {
    it('应该返回 undefined 当数组为空时', () => {
      expect(PaginationHelper.buildInFilter()).toBeUndefined();
      expect(PaginationHelper.buildInFilter([])).toBeUndefined();
    });

    it('应该构建 IN 查询条件', () => {
      const result = PaginationHelper.buildInFilter([1, 2, 3]);
      expect(result).toEqual({ in: [1, 2, 3] });
    });

    it('应该支持字符串数组', () => {
      const result = PaginationHelper.buildInFilter(['a', 'b', 'c']);
      expect(result).toEqual({ in: ['a', 'b', 'c'] });
    });
  });

  describe('parseCursorValue', () => {
    it('应该解析数字游标', () => {
      expect(PaginationHelper.parseCursorValue('123')).toBe(123);
    });

    it('应该保留字符串游标', () => {
      expect(PaginationHelper.parseCursorValue('abc123')).toBe('abc123');
    });

    it('应该处理 UUID 格式的游标', () => {
      const uuid = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
      expect(PaginationHelper.parseCursorValue(uuid)).toBe(uuid);
    });
  });

  describe('calculatePages', () => {
    it('应该正确计算总页数', () => {
      expect(PaginationHelper.calculatePages(100, 10)).toBe(10);
      expect(PaginationHelper.calculatePages(101, 10)).toBe(11);
      expect(PaginationHelper.calculatePages(99, 10)).toBe(10);
    });

    it('应该处理 pageSize 为 0 的情况', () => {
      expect(PaginationHelper.calculatePages(100, 0)).toBe(0);
    });

    it('应该处理 total 为 0 的情况', () => {
      expect(PaginationHelper.calculatePages(0, 10)).toBe(0);
    });
  });

  describe('validatePaginationParams', () => {
    it('应该返回有效的分页参数', () => {
      const result = PaginationHelper.validatePaginationParams(2, 20);
      expect(result).toEqual({ pageNum: 2, pageSize: 20 });
    });

    it('应该将 pageNum 最小值设为 1', () => {
      const result = PaginationHelper.validatePaginationParams(0, 10);
      expect(result.pageNum).toBe(1);
    });

    it('应该将负数 pageNum 设为 1', () => {
      const result = PaginationHelper.validatePaginationParams(-5, 10);
      expect(result.pageNum).toBe(1);
    });

    it('应该将 pageSize 最小值设为 1', () => {
      const result = PaginationHelper.validatePaginationParams(1, 0);
      expect(result.pageSize).toBe(10); // 0 会被转换为默认值 10
    });

    it('应该将 pageSize 最大值限制为 100', () => {
      const result = PaginationHelper.validatePaginationParams(1, 200);
      expect(result.pageSize).toBe(100);
    });

    it('应该处理字符串参数', () => {
      const result = PaginationHelper.validatePaginationParams('3', '25');
      expect(result).toEqual({ pageNum: 3, pageSize: 25 });
    });

    it('应该处理 undefined 参数', () => {
      const result = PaginationHelper.validatePaginationParams(undefined, undefined);
      expect(result).toEqual({ pageNum: 1, pageSize: 10 });
    });
  });

  describe('getCursorPagination', () => {
    it('应该返回基本游标分页参数', () => {
      const query = new CursorPaginationDto();
      query.limit = 10;

      const result = PaginationHelper.getCursorPagination(query);

      expect(result.take).toBe(11); // limit + 1
      expect(result.cursor).toBeUndefined();
      expect(result.skip).toBeUndefined();
    });

    it('应该处理带游标的分页', () => {
      const query = new CursorPaginationDto();
      query.limit = 10;
      query.cursor = '100';

      const result = PaginationHelper.getCursorPagination(query);

      expect(result.take).toBe(11);
      expect(result.cursor).toEqual({ id: 100 });
      expect(result.skip).toBe(1);
    });

    it('应该使用自定义排序字段作为游标字段', () => {
      const query = new CursorPaginationDto();
      query.limit = 10;
      query.cursor = '50';
      query.orderByColumn = 'userId';

      const result = PaginationHelper.getCursorPagination(query);

      expect(result.cursor).toEqual({ userId: 50 });
    });
  });

  describe('cursorPaginate', () => {
    it('应该正确处理有更多数据的情况', async () => {
      const mockData = Array.from({ length: 11 }, (_, i) => ({ id: i + 1 }));
      const findMany = jest.fn().mockResolvedValue(mockData);
      const query = new CursorPaginationDto();
      query.limit = 10;

      const result = await PaginationHelper.cursorPaginate(findMany, query, 'id');

      expect(result.rows).toHaveLength(10);
      expect(result.meta.hasNextPage).toBe(true);
    });

    it('应该正确处理没有更多数据的情况', async () => {
      const mockData = Array.from({ length: 5 }, (_, i) => ({ id: i + 1 }));
      const findMany = jest.fn().mockResolvedValue(mockData);
      const query = new CursorPaginationDto();
      query.limit = 10;

      const result = await PaginationHelper.cursorPaginate(findMany, query, 'id');

      expect(result.rows).toHaveLength(5);
      expect(result.meta.hasNextPage).toBe(false);
    });

    it('应该在反向分页时反转结果', async () => {
      const mockData = [{ id: 3 }, { id: 2 }, { id: 1 }];
      const findMany = jest.fn().mockResolvedValue(mockData);
      const query = new CursorPaginationDto();
      query.limit = 10;
      query.direction = 'backward';

      const result = await PaginationHelper.cursorPaginate(findMany, query, 'id');

      expect(result.rows[0].id).toBe(1);
      expect(result.rows[2].id).toBe(3);
    });
  });

  describe('createCursorResponse', () => {
    it('应该创建正确的游标响应', () => {
      const rows = [{ id: 1 }, { id: 2 }, { id: 3 }];

      const result = PaginationHelper.createCursorResponse(rows, true, 'id');

      expect(result.rows).toEqual(rows);
      expect(result.meta.hasNextPage).toBe(true);
      expect(result.meta.nextCursor).toBe('3');
    });

    it('应该处理空数据', () => {
      const result = PaginationHelper.createCursorResponse([], false, 'id');

      expect(result.rows).toEqual([]);
      expect(result.meta.hasNextPage).toBe(false);
      expect(result.meta.nextCursor).toBeUndefined();
    });
  });
});
