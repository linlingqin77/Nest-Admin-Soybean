import { QueryBuilder, createWhereWithDelFlag, buildListQuery } from './query-builder.helper';

describe('QueryBuilder', () => {
  describe('create', () => {
    it('should create an empty query builder', () => {
      const builder = QueryBuilder.create();
      expect(builder.build()).toEqual({});
    });

    it('should create a query builder with initial conditions', () => {
      const builder = QueryBuilder.create({ status: '0' });
      expect(builder.build()).toEqual({ status: '0' });
    });
  });

  describe('addDelFlag', () => {
    it('should add delFlag condition', () => {
      const result = QueryBuilder.create().addDelFlag().build();
      expect(result).toEqual({ delFlag: '0' });
    });
  });

  describe('addContains', () => {
    it('should add contains condition when value is provided', () => {
      const result = QueryBuilder.create().addContains('userName', 'admin').build();
      expect(result).toEqual({ userName: { contains: 'admin' } });
    });

    it('should not add condition when value is empty', () => {
      const result = QueryBuilder.create().addContains('userName', '').build();
      expect(result).toEqual({});
    });

    it('should not add condition when value is undefined', () => {
      const result = QueryBuilder.create().addContains('userName', undefined).build();
      expect(result).toEqual({});
    });
  });

  describe('addEquals', () => {
    it('should add equals condition when value is provided', () => {
      const result = QueryBuilder.create().addEquals('status', '0').build();
      expect(result).toEqual({ status: '0' });
    });

    it('should not add condition when value is empty string', () => {
      const result = QueryBuilder.create().addEquals('status', '').build();
      expect(result).toEqual({});
    });

    it('should not add condition when value is null', () => {
      const result = QueryBuilder.create().addEquals('status', null).build();
      expect(result).toEqual({});
    });

    it('should add condition when value is 0', () => {
      const result = QueryBuilder.create().addEquals('count', 0).build();
      expect(result).toEqual({ count: 0 });
    });
  });

  describe('addNumber', () => {
    it('should add number condition', () => {
      const result = QueryBuilder.create().addNumber('deptId', 100).build();
      expect(result).toEqual({ deptId: 100 });
    });

    it('should convert string to number', () => {
      const result = QueryBuilder.create().addNumber('deptId', '100').build();
      expect(result).toEqual({ deptId: 100 });
    });

    it('should not add condition when value is empty', () => {
      const result = QueryBuilder.create().addNumber('deptId', '').build();
      expect(result).toEqual({});
    });
  });

  describe('addDateRange', () => {
    it('should add date range condition when both dates are provided', () => {
      const result = QueryBuilder.create()
        .addDateRange('createTime', { beginTime: '2024-01-01', endTime: '2024-12-31' })
        .build();
      expect(result.createTime).toBeDefined();
      expect((result.createTime as any).gte).toBeInstanceOf(Date);
      expect((result.createTime as any).lte).toBeInstanceOf(Date);
    });

    it('should not add condition when params is undefined', () => {
      const result = QueryBuilder.create().addDateRange('createTime', undefined).build();
      expect(result).toEqual({});
    });

    it('should not add condition when dates are empty', () => {
      const result = QueryBuilder.create().addDateRange('createTime', {}).build();
      expect(result).toEqual({});
    });
  });

  describe('addIn', () => {
    it('should add IN condition when values are provided', () => {
      const result = QueryBuilder.create().addIn('roleId', [1, 2, 3]).build();
      expect(result).toEqual({ roleId: { in: [1, 2, 3] } });
    });

    it('should not add condition when values is empty array', () => {
      const result = QueryBuilder.create().addIn('roleId', []).build();
      expect(result).toEqual({});
    });

    it('should not add condition when values is undefined', () => {
      const result = QueryBuilder.create().addIn('roleId', undefined).build();
      expect(result).toEqual({});
    });
  });

  describe('addNotIn', () => {
    it('should add NOT IN condition when values are provided', () => {
      const result = QueryBuilder.create().addNotIn('roleId', [1, 2]).build();
      expect(result).toEqual({ roleId: { notIn: [1, 2] } });
    });
  });

  describe('addOr', () => {
    it('should add OR condition', () => {
      const result = QueryBuilder.create()
        .addOr([{ status: '0' }, { status: '1' }])
        .build();
      expect(result).toEqual({ OR: [{ status: '0' }, { status: '1' }] });
    });

    it('should not add OR when conditions is empty', () => {
      const result = QueryBuilder.create().addOr([]).build();
      expect(result).toEqual({});
    });
  });

  describe('addAnd', () => {
    it('should add AND condition', () => {
      const result = QueryBuilder.create()
        .addAnd([{ status: '0' }, { delFlag: '0' }])
        .build();
      expect(result).toEqual({ AND: [{ status: '0' }, { delFlag: '0' }] });
    });

    it('should append to existing AND conditions', () => {
      const result = QueryBuilder.create()
        .addAnd([{ status: '0' }])
        .addAnd([{ delFlag: '0' }])
        .build();
      expect(result).toEqual({ AND: [{ status: '0' }, { delFlag: '0' }] });
    });
  });

  describe('addIf', () => {
    it('should add condition when shouldAdd is true', () => {
      const result = QueryBuilder.create().addIf(true, 'status', '0').build();
      expect(result).toEqual({ status: '0' });
    });

    it('should not add condition when shouldAdd is false', () => {
      const result = QueryBuilder.create().addIf(false, 'status', '0').build();
      expect(result).toEqual({});
    });
  });

  describe('merge', () => {
    it('should merge other conditions', () => {
      const result = QueryBuilder.create<Record<string, unknown>>({ status: '0' }).merge({ delFlag: '0' }).build();
      expect(result).toEqual({ status: '0', delFlag: '0' });
    });
  });

  describe('chaining', () => {
    it('should support method chaining', () => {
      const result = QueryBuilder.create()
        .addDelFlag()
        .addContains('userName', 'admin')
        .addEquals('status', '0')
        .addNumber('deptId', 100)
        .build();

      expect(result).toEqual({
        delFlag: '0',
        userName: { contains: 'admin' },
        status: '0',
        deptId: 100,
      });
    });
  });
});

describe('createWhereWithDelFlag', () => {
  it('should create where with delFlag', () => {
    const result = createWhereWithDelFlag();
    expect(result).toEqual({ delFlag: '0' });
  });

  it('should merge additional conditions', () => {
    const result = createWhereWithDelFlag({ status: '0' });
    expect(result).toEqual({ delFlag: '0', status: '0' });
  });
});

describe('buildListQuery', () => {
  it('should build list query with all field types', () => {
    const query = {
      userName: 'admin',
      status: '0',
      deptId: '100',
      params: { beginTime: '2024-01-01', endTime: '2024-12-31' },
    };

    const result = buildListQuery(query, {
      contains: ['userName'],
      equals: ['status'],
      number: ['deptId'],
      dateRange: { field: 'createTime' },
    });

    expect(result.delFlag).toBe('0');
    expect(result.userName).toEqual({ contains: 'admin' });
    expect(result.status).toBe('0');
    expect(result.deptId).toBe(100);
    expect(result.createTime).toBeDefined();
  });
});
