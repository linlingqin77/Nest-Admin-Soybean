import { BatchOperationHelper, BatchResult, BatchValidator } from './batch-operation.helper';

describe('BatchOperationHelper', () => {
  describe('execute', () => {
    it('should process all items successfully', async () => {
      const items = [{ name: 'item1' }, { name: 'item2' }, { name: 'item3' }];

      const result = await BatchOperationHelper.execute(items, {
        processor: {
          process: async (item, index) => ({ ...item, id: index + 1 }),
        },
      });

      expect(result.successCount).toBe(3);
      expect(result.failedCount).toBe(0);
      expect(result.totalCount).toBe(3);
      expect(result.results).toHaveLength(3);
      expect(result.results.every((r) => r.success)).toBe(true);
    });

    it('should handle validation failures', async () => {
      const items = [{ name: 'valid' }, { name: '' }, { name: 'valid2' }];

      const result = await BatchOperationHelper.execute(items, {
        validators: [
          {
            validate: async (item) => (item.name === '' ? '名称不能为空' : null),
          },
        ],
        processor: {
          process: async (item) => item,
        },
      });

      expect(result.successCount).toBe(2);
      expect(result.failedCount).toBe(1);
      expect(result.results[1].success).toBe(false);
      expect(result.results[1].error).toBe('名称不能为空');
    });

    it('should handle processing errors', async () => {
      const items = [{ name: 'item1' }, { name: 'error' }, { name: 'item3' }];

      const result = await BatchOperationHelper.execute(items, {
        processor: {
          process: async (item) => {
            if (item.name === 'error') {
              throw new Error('处理失败');
            }
            return item;
          },
        },
        continueOnError: true,
      });

      expect(result.successCount).toBe(2);
      expect(result.failedCount).toBe(1);
      expect(result.results[1].error).toBe('处理失败');
    });

    it('should stop on error when continueOnError is false', async () => {
      const items = [{ name: 'item1' }, { name: 'error' }, { name: 'item3' }];

      const result = await BatchOperationHelper.execute(items, {
        processor: {
          process: async (item) => {
            if (item.name === 'error') {
              throw new Error('处理失败');
            }
            return item;
          },
        },
        continueOnError: false,
      });

      expect(result.successCount).toBe(1);
      expect(result.failedCount).toBe(2);
      expect(result.results[2].error).toBe('操作已中止');
    });

    it('should run multiple validators', async () => {
      const items = [{ name: '', email: 'invalid' }];

      const result = await BatchOperationHelper.execute(items, {
        validators: [
          { validate: async (item) => (item.name === '' ? '名称不能为空' : null) },
          { validate: async (item) => (!item.email.includes('@') ? '邮箱格式错误' : null) },
        ],
        processor: {
          process: async (item) => item,
        },
      });

      expect(result.failedCount).toBe(1);
      // 第一个验证器失败后就停止
      expect(result.results[0].error).toBe('名称不能为空');
    });
  });

  describe('executeDelete', () => {
    it('should delete all items successfully', async () => {
      const ids = [1, 2, 3];
      const deletedIds: number[] = [];

      const result = await BatchOperationHelper.executeDelete(ids, {
        doDelete: async (id) => {
          deletedIds.push(id);
        },
      });

      expect(result.successCount).toBe(3);
      expect(result.failedCount).toBe(0);
      expect(deletedIds).toEqual([1, 2, 3]);
    });

    it('should block specified IDs', async () => {
      const ids = [1, 2, 3];

      const result = await BatchOperationHelper.executeDelete(ids, {
        blockedIds: [1],
        blockedMessage: '系统管理员不可删除',
        doDelete: async () => {},
      });

      expect(result.successCount).toBe(2);
      expect(result.failedCount).toBe(1);
      expect(result.results[0].error).toBe('系统管理员不可删除');
    });

    it('should check canDelete before deleting', async () => {
      const ids = [1, 2, 3];

      const result = await BatchOperationHelper.executeDelete(ids, {
        canDelete: async (id) => (id === 2 ? '该项正在使用中' : null),
        doDelete: async () => {},
      });

      expect(result.successCount).toBe(2);
      expect(result.failedCount).toBe(1);
      expect(result.results[1].error).toBe('该项正在使用中');
    });

    it('should handle delete errors', async () => {
      const ids = [1, 2];

      const result = await BatchOperationHelper.executeDelete(ids, {
        doDelete: async (id) => {
          if (id === 2) {
            throw new Error('删除失败');
          }
        },
      });

      expect(result.successCount).toBe(1);
      expect(result.failedCount).toBe(1);
      expect(result.results[1].error).toBe('删除失败');
    });
  });

  describe('createUniqueValidator', () => {
    it('should validate uniqueness', async () => {
      const existingNames = ['admin', 'test'];
      const validator = BatchOperationHelper.createUniqueValidator<{ name: string }>(
        async (value) => existingNames.includes(value as string),
        (item) => item.name,
        '用户名',
      );

      const result1 = await validator.validate({ name: 'admin' }, 0);
      expect(result1).toBe('用户名 "admin" 已存在');

      const result2 = await validator.validate({ name: 'newuser' }, 0);
      expect(result2).toBeNull();
    });
  });

  describe('createRequiredValidator', () => {
    it('should validate required fields', async () => {
      const validator = BatchOperationHelper.createRequiredValidator<{ name: string }>(
        (item) => item.name,
        '用户名',
      );

      const result1 = await validator.validate({ name: '' }, 0);
      expect(result1).toBe('用户名 不能为空');

      const result2 = await validator.validate({ name: 'test' }, 0);
      expect(result2).toBeNull();
    });
  });

  describe('toResult', () => {
    it('should wrap batch result in Result', () => {
      const batchResult: BatchResult = {
        successCount: 2,
        failedCount: 1,
        totalCount: 3,
        results: [],
      };

      const result = BatchOperationHelper.toResult(batchResult);
      expect(result.data).toEqual(batchResult);
    });
  });
});
