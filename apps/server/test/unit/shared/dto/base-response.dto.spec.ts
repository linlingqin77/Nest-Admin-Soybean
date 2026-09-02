import { plainToInstance } from 'class-transformer';
import { Expose } from 'class-transformer';
import { BaseResponseDto } from '@/shared/dto/base.response.dto';

/**
 * Unit Tests for BaseResponseDto
 *
 * Feature: date-serialization-refactor
 * 测试 BaseResponseDto 的日期格式化和字段排除功能
 *
 * **Validates: Requirements 2.1, 2.2, 2.3**
 */
describe('BaseResponseDto Unit Tests', () => {
  // 测试用子类
  class TestUserResponseDto extends BaseResponseDto {
    @Expose()
    userId!: number;

    @Expose()
    userName!: string;
  }

  // 带额外日期字段的子类
  class TestLoginResponseDto extends BaseResponseDto {
    @Expose()
    userId!: number;

    @Expose()
    loginTime?: string;
  }

  const transformOptions = {
    excludeExtraneousValues: true,
    enableImplicitConversion: true,
  };

  describe('createTime 格式化', () => {
    it('should format createTime from Date object to YYYY-MM-DD HH:mm:ss', () => {
      const plainData = {
        userId: 1,
        userName: 'testuser',
        createTime: new Date('2025-01-15T10:30:45.000Z'),
        updateTime: null,
      };

      const result = plainToInstance(TestUserResponseDto, plainData, transformOptions);

      expect(result.createTime).toBeDefined();
      expect(typeof result.createTime).toBe('string');
      expect(result.createTime).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/);
    });

    it('should format createTime from ISO string to YYYY-MM-DD HH:mm:ss', () => {
      const plainData = {
        userId: 1,
        userName: 'testuser',
        createTime: '2025-01-15T10:30:45.000Z',
        updateTime: null,
      };

      const result = plainToInstance(TestUserResponseDto, plainData, transformOptions);

      expect(result.createTime).toBeDefined();
      expect(typeof result.createTime).toBe('string');
      expect(result.createTime).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/);
    });

    it('should preserve null createTime', () => {
      const plainData = {
        userId: 1,
        userName: 'testuser',
        createTime: null,
        updateTime: null,
      };

      const result = plainToInstance(TestUserResponseDto, plainData, transformOptions);

      expect(result.createTime).toBeNull();
    });

    it('should preserve undefined createTime', () => {
      const plainData = {
        userId: 1,
        userName: 'testuser',
      };

      const result = plainToInstance(TestUserResponseDto, plainData, transformOptions);

      expect(result.createTime).toBeUndefined();
    });
  });

  describe('updateTime 格式化', () => {
    it('should format updateTime from Date object to YYYY-MM-DD HH:mm:ss', () => {
      const plainData = {
        userId: 1,
        userName: 'testuser',
        createTime: null,
        updateTime: new Date('2025-01-16T14:20:30.000Z'),
      };

      const result = plainToInstance(TestUserResponseDto, plainData, transformOptions);

      expect(result.updateTime).toBeDefined();
      expect(typeof result.updateTime).toBe('string');
      expect(result.updateTime).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/);
    });

    it('should format updateTime from ISO string to YYYY-MM-DD HH:mm:ss', () => {
      const plainData = {
        userId: 1,
        userName: 'testuser',
        createTime: null,
        updateTime: '2025-01-16T14:20:30.000Z',
      };

      const result = plainToInstance(TestUserResponseDto, plainData, transformOptions);

      expect(result.updateTime).toBeDefined();
      expect(typeof result.updateTime).toBe('string');
      expect(result.updateTime).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/);
    });

    it('should preserve null updateTime', () => {
      const plainData = {
        userId: 1,
        userName: 'testuser',
        createTime: null,
        updateTime: null,
      };

      const result = plainToInstance(TestUserResponseDto, plainData, transformOptions);

      expect(result.updateTime).toBeNull();
    });

    it('should preserve undefined updateTime', () => {
      const plainData = {
        userId: 1,
        userName: 'testuser',
        createTime: null,
      };

      const result = plainToInstance(TestUserResponseDto, plainData, transformOptions);

      expect(result.updateTime).toBeUndefined();
    });
  });

  describe('子类继承行为', () => {
    it('should inherit date formatting in child class', () => {
      const plainData = {
        userId: 1,
        userName: 'testuser',
        createTime: new Date('2025-01-15T10:30:45.000Z'),
        updateTime: new Date('2025-01-16T14:20:30.000Z'),
      };

      const result = plainToInstance(TestUserResponseDto, plainData, transformOptions);

      expect(result.userId).toBe(1);
      expect(result.userName).toBe('testuser');
      expect(result.createTime).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/);
      expect(result.updateTime).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/);
    });

    it('should expose createBy, updateBy, and remark fields', () => {
      const plainData = {
        userId: 1,
        userName: 'testuser',
        createBy: 'admin',
        updateBy: 'admin',
        remark: 'test remark',
        createTime: null,
        updateTime: null,
      };

      const result = plainToInstance(TestUserResponseDto, plainData, transformOptions);

      expect(result.createBy).toBe('admin');
      expect(result.updateBy).toBe('admin');
      expect(result.remark).toBe('test remark');
    });

    it('should exclude sensitive fields (delFlag, tenantId, password)', () => {
      const plainData = {
        userId: 1,
        userName: 'testuser',
        delFlag: '0',
        tenantId: 1,
        password: 'secret123',
        createTime: null,
        updateTime: null,
      };

      const result = plainToInstance(TestUserResponseDto, plainData, transformOptions);

      expect(result.delFlag).toBeUndefined();
      expect(result.tenantId).toBeUndefined();
      expect(result.password).toBeUndefined();
    });

    it('should work with multiple child classes independently', () => {
      const userData = {
        userId: 1,
        userName: 'testuser',
        createTime: new Date('2025-01-15T10:30:45.000Z'),
        updateTime: new Date('2025-01-16T14:20:30.000Z'),
      };

      const loginData = {
        userId: 2,
        loginTime: '2025-01-17T08:00:00.000Z',
        createTime: new Date('2025-01-10T09:00:00.000Z'),
        updateTime: null,
      };

      const userResult = plainToInstance(TestUserResponseDto, userData, transformOptions);
      const loginResult = plainToInstance(TestLoginResponseDto, loginData, transformOptions);

      expect(userResult.userId).toBe(1);
      expect(userResult.createTime).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/);

      expect(loginResult.userId).toBe(2);
      expect(loginResult.createTime).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/);
      // loginTime 没有 @DateFormat 装饰器，保持原值
      expect(loginResult.loginTime).toBe('2025-01-17T08:00:00.000Z');
    });
  });

  describe('同时格式化 createTime 和 updateTime', () => {
    it('should format both createTime and updateTime correctly', () => {
      const plainData = {
        userId: 1,
        userName: 'testuser',
        createTime: new Date('2025-01-15T10:30:45.000Z'),
        updateTime: new Date('2025-01-16T14:20:30.000Z'),
      };

      const result = plainToInstance(TestUserResponseDto, plainData, transformOptions);

      expect(result.createTime).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/);
      expect(result.updateTime).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/);
      // 确保两个时间不同
      expect(result.createTime).not.toBe(result.updateTime);
    });
  });
});
