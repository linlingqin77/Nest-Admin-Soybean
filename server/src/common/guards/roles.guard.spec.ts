import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from './roles.guard';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: Reflector;

  const createMockContext = (roles: string[] = []): ExecutionContext => {
    return {
      switchToHttp: () => ({
        getRequest: () => ({
          user: { roles },
        }),
      }),
      getHandler: () => ({}),
      getClass: () => ({}),
    } as ExecutionContext;
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RolesGuard,
        {
          provide: Reflector,
          useValue: {
            getAllAndOverride: jest.fn(),
          },
        },
      ],
    }).compile();

    guard = module.get<RolesGuard>(RolesGuard);
    reflector = module.get<Reflector>(Reflector);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('canActivate', () => {
    it('should allow access when no role decorator is set', async () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);
      const context = createMockContext([]);

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
    });

    it('should allow access when user has the required role', async () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue('admin');
      const context = createMockContext(['admin', 'user']);

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
    });

    it('should deny access when user lacks the required role', async () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue('admin');
      const context = createMockContext(['user', 'guest']);

      const result = await guard.canActivate(context);

      expect(result).toBe(false);
    });

    it('should check both handler and class for role decorator', async () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);
      const context = createMockContext([]);

      await guard.canActivate(context);

      expect(reflector.getAllAndOverride).toHaveBeenCalledWith('role', [
        context.getHandler(),
        context.getClass(),
      ]);
    });
  });

  describe('hasRole', () => {
    it('should return true for exact role match', () => {
      const result = guard.hasRole('admin', ['admin', 'user']);

      expect(result).toBe(true);
    });

    it('should return false when role not in list', () => {
      const result = guard.hasRole('admin', ['user', 'guest']);

      expect(result).toBe(false);
    });

    it('should return false for empty roles array', () => {
      const result = guard.hasRole('admin', []);

      expect(result).toBe(false);
    });

    it('should handle single role in array', () => {
      const result = guard.hasRole('admin', ['admin']);

      expect(result).toBe(true);
    });

    it('should be case sensitive', () => {
      const result = guard.hasRole('Admin', ['admin']);

      expect(result).toBe(false);
    });
  });
});
