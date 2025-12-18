import { Test, TestingModule } from '@nestjs/testing';
import { Result, SUCCESS_CODE } from './result';
import { ResponseCode, IPaginatedData } from './response.interface';

describe('Result', () => {
  describe('ok', () => {
    it('should create success response with data', () => {
      const data = { id: 1, name: 'test' };
      const result = Result.ok(data);

      expect(result.code).toBe(ResponseCode.SUCCESS);
      expect(result.msg).toBe('操作成功');
      expect(result.data).toEqual(data);
      expect(result.isSuccess()).toBe(true);
    });

    it('should create success response with custom message', () => {
      const result = Result.ok(null, '创建成功');

      expect(result.code).toBe(ResponseCode.SUCCESS);
      expect(result.msg).toBe('创建成功');
      expect(result.data).toBeNull();
    });

    it('should create success response without data', () => {
      const result = Result.ok();

      expect(result.code).toBe(ResponseCode.SUCCESS);
      expect(result.data).toBeNull();
    });
  });

  describe('fail', () => {
    it('should create failure response with code', () => {
      const result = Result.fail(ResponseCode.USER_NOT_FOUND);

      expect(result.code).toBe(ResponseCode.USER_NOT_FOUND);
      expect(result.msg).toBe('用户不存在');
      expect(result.data).toBeNull();
      expect(result.isSuccess()).toBe(false);
    });

    it('should create failure response with custom message', () => {
      const result = Result.fail(ResponseCode.PARAM_INVALID, '用户名不能为空');

      expect(result.code).toBe(ResponseCode.PARAM_INVALID);
      expect(result.msg).toBe('用户名不能为空');
    });

    it('should create failure response with data', () => {
      const errorData = { field: 'username' };
      const result = Result.fail(ResponseCode.PARAM_INVALID, '参数错误', errorData);

      expect(result.data).toEqual(errorData);
    });
  });

  describe('page', () => {
    it('should create paginated response', () => {
      const rows = [{ id: 1 }, { id: 2 }];
      const result = Result.page(rows, 100, 1, 10);

      expect(result.code).toBe(ResponseCode.SUCCESS);
      expect(result.data).toBeDefined();
      expect(result.data?.rows).toEqual(rows);
      expect(result.data?.total).toBe(100);
      expect(result.data?.pageNum).toBe(1);
      expect(result.data?.pageSize).toBe(10);
      expect(result.data?.pages).toBe(10);
    });

    it('should calculate pages correctly', () => {
      const result = Result.page([], 25, 1, 10);

      expect(result.data?.pages).toBe(3);
    });
  });

  describe('when', () => {
    it('should return success when condition is true', () => {
      const result = Result.when(true, { id: 1 });

      expect(result.isSuccess()).toBe(true);
      expect(result.data).toEqual({ id: 1 });
    });

    it('should return failure when condition is false', () => {
      const result = Result.when(false, { id: 1 }, ResponseCode.OPERATION_FAILED);

      expect(result.isSuccess()).toBe(false);
      expect(result.code).toBe(ResponseCode.OPERATION_FAILED);
    });
  });

  describe('fromPromise', () => {
    it('should return success for resolved promise', async () => {
      const promise = Promise.resolve({ id: 1 });
      const result = await Result.fromPromise(promise);

      expect(result.isSuccess()).toBe(true);
      expect(result.data).toEqual({ id: 1 });
    });

    it('should return failure for rejected promise', async () => {
      const promise = Promise.reject(new Error('Test error'));
      const result = await Result.fromPromise(promise);

      expect(result.isSuccess()).toBe(false);
      expect(result.msg).toBe('Test error');
    });
  });
});
