import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PermissionGuard } from '@/core/permissions/guards/permission.guard';

describe('PermissionGuard', () => {
  let guard: PermissionGuard;
  let reflector: Reflector;

  const createMockContext = (permissions: string[] = []): ExecutionContext => {
    return {
      switchToHttp: () => ({
        getRequest: () => ({
          user: { permissions },
        }),
      }),
      getHandler: () => ({}),
      getClass: () => ({}),
    } as ExecutionContext;
  };

  beforeEach(async () => {
    const modules: TestingModule = await Test.createTestingModule({
      providers: [
        PermissionGuard,
        {
          provide: Reflector,
          useValue: {
            getAllAndOverride: jest.fn(),
          },
        },
      ],
    }).compile();

    guard = modules.get<PermissionGuard>(PermissionGuard);
    reflector = modules.get<Reflector>(Reflector);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('canActivate', () => {
    it('should allow access when no permission decorator is set', async () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);
      const context = createMockContext([]);

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
    });

    it('should allow access when user has the required permission', async () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue('system:user:list');
      const context = createMockContext(['system:user:list', 'system:user:add']);

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
    });

    it('should deny access when user lacks the required permission', async () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue('system:user:delete');
      const context = createMockContext(['system:user:list', 'system:user:add']);

      const result = await guard.canActivate(context);

      expect(result).toBe(false);
    });

    it('should allow access when user has super admin permission (*:*:*)', async () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue('system:user:delete');
      const context = createMockContext(['*:*:*']);

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
    });

    it('should allow access when user has wildcard permission matching required', async () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue('system:user:add');
      const context = createMockContext(['system:user:*']);

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
    });
  });

  describe('hasPermission', () => {
    describe('精确匹配', () => {
      it('should return true for exact permission match', () => {
        const result = guard.hasPermission('system:user:list', ['system:user:list']);

        expect(result).toBe(true);
      });

      it('should return false when permission not in list', () => {
        const result = guard.hasPermission('system:user:delete', ['system:user:list']);

        expect(result).toBe(false);
      });

      it('should return false for empty permissions array', () => {
        const result = guard.hasPermission('system:user:list', []);

        expect(result).toBe(false);
      });

      it('should return true when exact match exists among multiple permissions', () => {
        const result = guard.hasPermission('system:user:edit', [
          'system:user:list',
          'system:user:edit',
          'system:role:list',
        ]);

        expect(result).toBe(true);
      });

      it('should return false for partial string match (not wildcard)', () => {
        const result = guard.hasPermission('system:user:list', ['system:user:lis']);

        expect(result).toBe(false);
      });

      it('should be case sensitive for exact match', () => {
        const result = guard.hasPermission('system:user:list', ['System:User:List']);

        expect(result).toBe(false);
      });
    });

    describe('超级权限 *:*:*', () => {
      it('should return true for super admin permission', () => {
        const result = guard.hasPermission('any:permission:here', ['*:*:*']);

        expect(result).toBe(true);
      });

      it('should return true when super admin is among other permissions', () => {
        const result = guard.hasPermission('system:user:delete', ['system:user:list', '*:*:*']);

        expect(result).toBe(true);
      });

      it('should match any three-segment permission with super admin', () => {
        const testCases = ['system:user:add', 'system:role:edit', 'monitor:online:list', 'tool:gen:code', 'a:b:c'];

        testCases.forEach((permission) => {
          const result = guard.hasPermission(permission, ['*:*:*']);
          expect(result).toBe(true);
        });
      });

      it('should return true for super admin even with complex permission', () => {
        const result = guard.hasPermission('very:complex:permission', ['*:*:*']);

        expect(result).toBe(true);
      });
    });

    describe('通配符匹配', () => {
      describe('操作级通配符 (system:user:*)', () => {
        it('should match system:user:add with system:user:*', () => {
          const result = guard.hasPermission('system:user:add', ['system:user:*']);

          expect(result).toBe(true);
        });

        it('should match system:user:edit with system:user:*', () => {
          const result = guard.hasPermission('system:user:edit', ['system:user:*']);

          expect(result).toBe(true);
        });

        it('should match system:user:delete with system:user:*', () => {
          const result = guard.hasPermission('system:user:delete', ['system:user:*']);

          expect(result).toBe(true);
        });

        it('should match system:user:list with system:user:*', () => {
          const result = guard.hasPermission('system:user:list', ['system:user:*']);

          expect(result).toBe(true);
        });

        it('should not match system:role:add with system:user:*', () => {
          const result = guard.hasPermission('system:role:add', ['system:user:*']);

          expect(result).toBe(false);
        });

        it('should not match monitor:user:add with system:user:*', () => {
          const result = guard.hasPermission('monitor:user:add', ['system:user:*']);

          expect(result).toBe(false);
        });
      });

      describe('资源级通配符 (system:*:*)', () => {
        it('should match system:user:add with system:*:*', () => {
          const result = guard.hasPermission('system:user:add', ['system:*:*']);

          expect(result).toBe(true);
        });

        it('should match system:role:edit with system:*:*', () => {
          const result = guard.hasPermission('system:role:edit', ['system:*:*']);

          expect(result).toBe(true);
        });

        it('should match system:dept:delete with system:*:*', () => {
          const result = guard.hasPermission('system:dept:delete', ['system:*:*']);

          expect(result).toBe(true);
        });

        it('should not match monitor:online:list with system:*:*', () => {
          const result = guard.hasPermission('monitor:online:list', ['system:*:*']);

          expect(result).toBe(false);
        });

        it('should not match tool:gen:code with system:*:*', () => {
          const result = guard.hasPermission('tool:gen:code', ['system:*:*']);

          expect(result).toBe(false);
        });
      });

      describe('中间段通配符 (system:*:add)', () => {
        it('should match system:user:add with system:*:add', () => {
          const result = guard.hasPermission('system:user:add', ['system:*:add']);

          expect(result).toBe(true);
        });

        it('should match system:role:add with system:*:add', () => {
          const result = guard.hasPermission('system:role:add', ['system:*:add']);

          expect(result).toBe(true);
        });

        it('should not match system:user:edit with system:*:add', () => {
          const result = guard.hasPermission('system:user:edit', ['system:*:add']);

          expect(result).toBe(false);
        });

        it('should not match monitor:user:add with system:*:add', () => {
          const result = guard.hasPermission('monitor:user:add', ['system:*:add']);

          expect(result).toBe(false);
        });
      });

      describe('首段通配符 (*:user:*)', () => {
        it('should match system:user:add with *:user:*', () => {
          const result = guard.hasPermission('system:user:add', ['*:user:*']);

          expect(result).toBe(true);
        });

        it('should match monitor:user:list with *:user:*', () => {
          const result = guard.hasPermission('monitor:user:list', ['*:user:*']);

          expect(result).toBe(true);
        });

        it('should not match system:role:add with *:user:*', () => {
          const result = guard.hasPermission('system:role:add', ['*:user:*']);

          expect(result).toBe(false);
        });
      });

      describe('多个通配符权限组合', () => {
        it('should match when one of multiple wildcard permissions matches', () => {
          const result = guard.hasPermission('system:user:add', ['monitor:*:*', 'system:user:*', 'tool:gen:code']);

          expect(result).toBe(true);
        });

        it('should return false when no wildcard permission matches', () => {
          const result = guard.hasPermission('system:user:add', ['monitor:*:*', 'system:role:*', 'tool:gen:code']);

          expect(result).toBe(false);
        });

        it('should match with mixed exact and wildcard permissions', () => {
          const result = guard.hasPermission('system:dept:list', [
            'system:user:list',
            'system:dept:*',
            'monitor:online:list',
          ]);

          expect(result).toBe(true);
        });
      });

      describe('边界情况', () => {
        it('should not match different segment count', () => {
          const result = guard.hasPermission('system:user', ['system:user:*']);

          expect(result).toBe(false);
        });

        it('should not match four-segment permission with three-segment wildcard', () => {
          const result = guard.hasPermission('system:user:add:extra', ['system:user:*']);

          expect(result).toBe(false);
        });

        it('should handle empty string permission', () => {
          const result = guard.hasPermission('', ['system:user:*']);

          expect(result).toBe(false);
        });

        it('should handle permission with only colons', () => {
          const result = guard.hasPermission('::', ['*:*:*']);

          expect(result).toBe(true);
        });
      });
    });
  });
});
