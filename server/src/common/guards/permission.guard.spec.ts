import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PermissionGuard } from './permission.guard';

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
    const module: TestingModule = await Test.createTestingModule({
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

    guard = module.get<PermissionGuard>(PermissionGuard);
    reflector = module.get<Reflector>(Reflector);
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
  });

  describe('hasPermission', () => {
    it('should return true for exact permission match', () => {
      const result = guard.hasPermission('system:user:list', ['system:user:list']);

      expect(result).toBe(true);
    });

    it('should return false when permission not in list', () => {
      const result = guard.hasPermission('system:user:delete', ['system:user:list']);

      expect(result).toBe(false);
    });

    it('should return true for super admin permission', () => {
      const result = guard.hasPermission('any:permission:here', ['*:*:*']);

      expect(result).toBe(true);
    });

    it('should return true when super admin is among other permissions', () => {
      const result = guard.hasPermission('system:user:delete', ['system:user:list', '*:*:*']);

      expect(result).toBe(true);
    });

    it('should return false for empty permissions array', () => {
      const result = guard.hasPermission('system:user:list', []);

      expect(result).toBe(false);
    });
  });
});
