/**
 * @file user.decorator.spec.ts
 * @description Migrated from src/modules/users/user.decorator.spec.ts
 * Unit tests for User decorators
 */
import { ExecutionContext } from '@nestjs/common';
import { User, NotRequireAuth, UserTool } from '@/modules/users/user.decorator';
import { ROUTE_ARGS_METADATA } from '@nestjs/common/constants';

describe('User Decorators', () => {
  describe('User decorator', () => {
    const getParamDecoratorFactory = (decorator: Function) => {
      class TestClass {
        testMethod(@decorator() value: any) {}
      }
      const args = Reflect.getMetadata(ROUTE_ARGS_METADATA, TestClass, 'testMethod');
      return args[Object.keys(args)[0]].factory;
    };

    const createMockContext = (user: any): ExecutionContext =>
      ({
        switchToHttp: () => ({
          getRequest: () => ({ user }),
        }),
      }) as ExecutionContext;

    it('should return entire user object when no data specified', () => {
      const factory = getParamDecoratorFactory(User);
      const mockUser = { userId: 1, userName: 'admin' };
      const ctx = createMockContext(mockUser);

      const result = factory(undefined, ctx);
      expect(result).toEqual(mockUser);
    });

    it('should return specific property when data is specified', () => {
      const factory = getParamDecoratorFactory(User);
      const mockUser = { userId: 1, userName: 'admin' };
      const ctx = createMockContext(mockUser);

      const result = factory('userName', ctx);
      expect(result).toBe('admin');
    });

    it('should return nested property', () => {
      const factory = getParamDecoratorFactory(User);
      const mockUser = { user: { userName: 'admin', dept: { deptName: 'IT' } } };
      const ctx = createMockContext(mockUser);

      const result = factory('user.userName', ctx);
      expect(result).toBe('admin');
    });

    it('should return undefined for non-existent property', () => {
      const factory = getParamDecoratorFactory(User);
      const mockUser = { userId: 1 };
      const ctx = createMockContext(mockUser);

      const result = factory('nonExistent', ctx);
      expect(result).toBeUndefined();
    });

    it('should handle null user', () => {
      const factory = getParamDecoratorFactory(User);
      const ctx = createMockContext(null);

      const result = factory('userId', ctx);
      expect(result).toBeUndefined();
    });
  });

  describe('NotRequireAuth decorator', () => {
    it('should set notRequireAuth metadata to true', () => {
      class TestClass {
        @NotRequireAuth()
        testMethod() {}
      }

      const metadata = Reflect.getMetadata('notRequireAuth', TestClass.prototype.testMethod);
      expect(metadata).toBe(true);
    });
  });

  describe('UserTool decorator', () => {
    const getParamDecoratorFactory = (decorator: Function) => {
      class TestClass {
        testMethod(@decorator() value: any) {}
      }
      const args = Reflect.getMetadata(ROUTE_ARGS_METADATA, TestClass, 'testMethod');
      return args[Object.keys(args)[0]].factory;
    };

    const createMockContext = (user: any): ExecutionContext =>
      ({
        switchToHttp: () => ({
          getRequest: () => ({ user }),
        }),
      }) as ExecutionContext;

    it('should return injectCreate and injectUpdate functions', () => {
      const factory = getParamDecoratorFactory(UserTool);
      const mockUser = { user: { userName: 'admin' } };
      const ctx = createMockContext(mockUser);

      const result = factory(undefined, ctx);
      expect(typeof result.injectCreate).toBe('function');
      expect(typeof result.injectUpdate).toBe('function');
    });

    describe('injectCreate', () => {
      it('should inject createBy and updateBy', () => {
        const factory = getParamDecoratorFactory(UserTool);
        const mockUser = { user: { userName: 'admin' } };
        const ctx = createMockContext(mockUser);

        const { injectCreate } = factory(undefined, ctx);
        const data = { name: 'test' };
        const result = injectCreate(data);

        expect(result.createBy).toBe('admin');
        expect(result.updateBy).toBe('admin');
      });

      it('should not override existing createBy', () => {
        const factory = getParamDecoratorFactory(UserTool);
        const mockUser = { user: { userName: 'admin' } };
        const ctx = createMockContext(mockUser);

        const { injectCreate } = factory(undefined, ctx);
        const data = { name: 'test', createBy: 'existing' };
        const result = injectCreate(data);

        expect(result.createBy).toBe('existing');
      });
    });

    describe('injectUpdate', () => {
      it('should inject updateBy', () => {
        const factory = getParamDecoratorFactory(UserTool);
        const mockUser = { user: { userName: 'admin' } };
        const ctx = createMockContext(mockUser);

        const { injectUpdate } = factory(undefined, ctx);
        const data = { name: 'test' };
        const result = injectUpdate(data);

        expect(result.updateBy).toBe('admin');
      });

      it('should not override existing updateBy', () => {
        const factory = getParamDecoratorFactory(UserTool);
        const mockUser = { user: { userName: 'admin' } };
        const ctx = createMockContext(mockUser);

        const { injectUpdate } = factory(undefined, ctx);
        const data = { name: 'test', updateBy: 'existing' };
        const result = injectUpdate(data);

        expect(result.updateBy).toBe('existing');
      });
    });
  });
});
