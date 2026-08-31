/**
 * @file Queue Access Guard Unit Tests
 * @description Migrated from src/platform/queue/guards/queue-access.guard.spec.ts
 */
import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { QueueAccessGuard } from '@/platform/queue/guards/queue-access.guard';

describe('QueueAccessGuard', () => {
  let guard: QueueAccessGuard;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new QueueAccessGuard(reflector);
  });

  const createMockContext = (user: any, method: string = 'GET'): ExecutionContext =>
    ({
      switchToHttp: () => ({
        getRequest: () => ({ user, method }),
      }),
      getHandler: () => jest.fn(),
      getClass: () => jest.fn(),
    }) as unknown as ExecutionContext;

  describe('canActivate', () => {
    it('should throw ForbiddenException when user is not authenticated', async () => {
      const context = createMockContext(null);

      await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
      await expect(guard.canActivate(context)).rejects.toThrow('需要登录才能访问队列监控面板');
    });

    it('should throw ForbiddenException when user has no permissions', async () => {
      const context = createMockContext({ permissions: [] });

      await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
      await expect(guard.canActivate(context)).rejects.toThrow('没有访问队列监控面板的权限');
    });

    it('should allow access with view permission for GET request', async () => {
      const context = createMockContext({ permissions: ['monitor:queue:view'] }, 'GET');

      const result = await guard.canActivate(context);
      expect(result).toBe(true);
    });

    it('should allow access with manage permission for GET request', async () => {
      const context = createMockContext({ permissions: ['monitor:queue:manage'] }, 'GET');

      const result = await guard.canActivate(context);
      expect(result).toBe(true);
    });

    it('should throw ForbiddenException for POST without manage permission', async () => {
      const context = createMockContext({ permissions: ['monitor:queue:view'] }, 'POST');

      await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
      await expect(guard.canActivate(context)).rejects.toThrow('没有管理队列的权限，仅允许查看');
    });

    it('should throw ForbiddenException for PUT without manage permission', async () => {
      const context = createMockContext({ permissions: ['monitor:queue:view'] }, 'PUT');

      await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
    });

    it('should throw ForbiddenException for DELETE without manage permission', async () => {
      const context = createMockContext({ permissions: ['monitor:queue:view'] }, 'DELETE');

      await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
    });

    it('should throw ForbiddenException for PATCH without manage permission', async () => {
      const context = createMockContext({ permissions: ['monitor:queue:view'] }, 'PATCH');

      await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
    });

    it('should allow POST with manage permission', async () => {
      const context = createMockContext({ permissions: ['monitor:queue:manage'] }, 'POST');

      const result = await guard.canActivate(context);
      expect(result).toBe(true);
    });

    it('should allow DELETE with manage permission', async () => {
      const context = createMockContext({ permissions: ['monitor:queue:manage'] }, 'DELETE');

      const result = await guard.canActivate(context);
      expect(result).toBe(true);
    });

    it('should handle undefined permissions array', async () => {
      const context = createMockContext({ permissions: undefined });

      await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
    });
  });
});
