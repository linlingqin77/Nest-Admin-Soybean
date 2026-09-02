import { Exclude, Expose } from 'class-transformer';
import { toDto, toDtoList, toDtoPage } from '@/shared/utils/serialize.util';

// 测试用 DTO 类
class TestResponseDto {
  @Expose()
  id!: number;

  @Expose()
  name!: string;

  @Exclude()
  password!: string;

  @Exclude()
  delFlag!: string;
}

describe('serialize.util', () => {
  describe('toDto', () => {
    it('should convert plain object to DTO instance with only @Expose fields', () => {
      const plain = {
        id: 1,
        name: 'test',
        password: 'secret',
        delFlag: '0',
        extraField: 'should be excluded',
      };

      const result = toDto(TestResponseDto, plain);

      expect(result).toBeDefined();
      expect(result!.id).toBe(1);
      expect(result!.name).toBe('test');
      expect(result!.password).toBeUndefined();
      expect(result!.delFlag).toBeUndefined();
      expect((result as any).extraField).toBeUndefined();
    });

    it('should return null when plain is null', () => {
      const result = toDto(TestResponseDto, null);
      expect(result).toBeNull();
    });

    it('should return null when plain is undefined', () => {
      const result = toDto(TestResponseDto, undefined);
      expect(result).toBeNull();
    });
  });

  describe('toDtoList', () => {
    it('should convert array of plain objects to DTO instances', () => {
      const plainList = [
        { id: 1, name: 'test1', password: 'secret1', delFlag: '0' },
        { id: 2, name: 'test2', password: 'secret2', delFlag: '1' },
      ];

      const result = toDtoList(TestResponseDto, plainList);

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe(1);
      expect(result[0].name).toBe('test1');
      expect(result[0].password).toBeUndefined();
      expect(result[1].id).toBe(2);
      expect(result[1].name).toBe('test2');
      expect(result[1].password).toBeUndefined();
    });

    it('should return empty array when plainList is null', () => {
      const result = toDtoList(TestResponseDto, null);
      expect(result).toEqual([]);
    });

    it('should return empty array when plainList is undefined', () => {
      const result = toDtoList(TestResponseDto, undefined);
      expect(result).toEqual([]);
    });

    it('should return empty array when plainList is empty', () => {
      const result = toDtoList(TestResponseDto, []);
      expect(result).toEqual([]);
    });
  });

  describe('toDtoPage', () => {
    it('should convert paginated data with rows and total', () => {
      const pageData = {
        rows: [
          { id: 1, name: 'test1', password: 'secret1', delFlag: '0' },
          { id: 2, name: 'test2', password: 'secret2', delFlag: '1' },
        ],
        total: 100,
      };

      const result = toDtoPage(TestResponseDto, pageData);

      expect(result!.total).toBe(100);
      expect(result!.rows).toHaveLength(2);
      expect(result!.rows[0].id).toBe(1);
      expect(result!.rows[0].password).toBeUndefined();
    });

    it('should return empty result when data is null', () => {
      const result = toDtoPage(TestResponseDto, null);
      expect(result).toEqual({ rows: [], total: 0 });
    });

    it('should return empty result when data is undefined', () => {
      const result = toDtoPage(TestResponseDto, undefined);
      expect(result).toEqual({ rows: [], total: 0 });
    });
  });

  describe('sensitive fields filtering', () => {
    it('should exclude all sensitive fields marked with @Exclude', () => {
      const plain = {
        id: 1,
        name: 'test',
        password: 'should-be-excluded',
        delFlag: 'should-be-excluded',
      };

      const result = toDto(TestResponseDto, plain);

      expect(result!.id).toBe(1);
      expect(result!.name).toBe('test');
      expect(result!.password).toBeUndefined();
      expect(result!.delFlag).toBeUndefined();
    });
  });
});
