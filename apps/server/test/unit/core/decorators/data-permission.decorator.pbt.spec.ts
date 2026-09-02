import * as fc from 'fast-check';
import { Test, TestingModule } from '@nestjs/testing';
import { CallHandler, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { of } from 'rxjs';
import {
  DATA_PERMISSION_CONTEXT_KEY,
  DATA_PERMISSION_KEY,
  DataPermissionContext,
  DataPermissionInterceptor,
  DataPermissionOptions,
  DataPermissionSqlBuilder,
  DataScope,
} from '@/core/permissions/decorators/data-permission.decorator';

/**
 * Property-Based Tests for DataPermissionInterceptor
 *
 * Feature: tenant-management-enhancement
 * Property 22: 数据权限过滤正确性
 * Property 23: 数据权限禁用正确性
 * Validates: Requirements 11.2, 11.3, 11.5
 *
 * For any method marked with @DataPermission:
 * - Returned data should conform to the user's data permission scope
 * - When enable=false, no permission filtering should be applied
 */
describe('DataPermissionInterceptor Property-Based Tests', () => {
  let interceptor: DataPermissionInterceptor;
  let reflector: Reflector;

  const createMockContext = (user: any = {}): ExecutionContext => {
    const request: any = {
      method: 'GET',
      path: '/api/test',
      query: {},
      body: {},
      params: {},
      user,
    };

    return {
      switchToHttp: () => ({
        getRequest: () => request,
      }),
      getHandler: () => ({}),
      getClass: () => ({}),
    } as ExecutionContext;
  };

  const defaultOptions: DataPermissionOptions = {
    enable: true,
    deptAlias: '',
    userAlias: '',
    deptIdColumn: 'deptId',
    userIdColumn: 'userId',
  };

  beforeEach(async () => {
    const modules: TestingModule = await Test.createTestingModule({
      providers: [
        DataPermissionInterceptor,
        {
          provide: Reflector,
          useValue: {
            get: jest.fn(),
          },
        },
      ],
    }).compile();

    interceptor = modules.get<DataPermissionInterceptor>(DataPermissionInterceptor);
    reflector = modules.get<Reflector>(Reflector);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  /**
   * Property 22: 数据权限过滤正确性
   *
   * For any user with a specific data scope, the permission context
   * should correctly reflect their access level.
   *
   * **Validates: Requirements 11.2, 11.3**
   */
  it('Property 22: For any user with SELF scope, context should filter by userId', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate random user IDs
        fc.integer({ min: 1, max: 10000 }),
        // Generate random dept IDs
        fc.integer({ min: 1, max: 1000 }),
        async (userId, deptId) => {
          // Configure options
          jest.spyOn(reflector, 'get').mockReturnValue(defaultOptions);

          // Create user with SELF data scope
          const user = {
            userId,
            deptId,
            roles: [{ dataScope: DataScope.SELF }],
          };

          const context = createMockContext(user);
          const handler: CallHandler = {
            handle: () => of({ success: true }),
          };

          // Execute interceptor
          const observable = await interceptor.intercept(context, handler);
          await new Promise((resolve) => {
            observable.subscribe({ next: resolve });
          });

          // Get the permission context from request
          const request = context.switchToHttp().getRequest();
          const permissionContext: DataPermissionContext = request[DATA_PERMISSION_CONTEXT_KEY];

          // Property: For SELF scope, context should have correct userId and dataScope
          return (
            permissionContext.enabled === true &&
            permissionContext.dataScope === DataScope.SELF &&
            permissionContext.userId === userId
          );
        },
      ),
      { numRuns: 100 },
    );
  });

  /**
   * Property 22b: For DEPT_ONLY scope, context should include only user's department
   *
   * **Validates: Requirements 11.2, 11.3**
   */
  it('Property 22b: For any user with DEPT_ONLY scope, context should include only their dept', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate random user IDs
        fc.integer({ min: 1, max: 10000 }),
        // Generate random dept IDs
        fc.integer({ min: 1, max: 1000 }),
        async (userId, deptId) => {
          // Configure options
          jest.spyOn(reflector, 'get').mockReturnValue(defaultOptions);

          // Create user with DEPT_ONLY data scope
          const user = {
            userId,
            deptId,
            roles: [{ dataScope: DataScope.DEPT_ONLY }],
          };

          const context = createMockContext(user);
          const handler: CallHandler = {
            handle: () => of({ success: true }),
          };

          // Execute interceptor
          const observable = await interceptor.intercept(context, handler);
          await new Promise((resolve) => {
            observable.subscribe({ next: resolve });
          });

          // Get the permission context from request
          const request = context.switchToHttp().getRequest();
          const permissionContext: DataPermissionContext = request[DATA_PERMISSION_CONTEXT_KEY];

          // Property: For DEPT_ONLY scope, deptIds should contain only user's deptId
          return (
            permissionContext.enabled === true &&
            permissionContext.dataScope === DataScope.DEPT_ONLY &&
            permissionContext.deptIds.length === 1 &&
            permissionContext.deptIds[0] === deptId
          );
        },
      ),
      { numRuns: 100 },
    );
  });

  /**
   * Property 22c: For ALL scope (admin), context should allow all data
   *
   * **Validates: Requirements 11.2**
   */
  it('Property 22c: For any admin user, context should have ALL scope', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate random user IDs
        fc.integer({ min: 1, max: 10000 }),
        // Generate random dept IDs
        fc.integer({ min: 1, max: 1000 }),
        async (userId, deptId) => {
          // Configure options
          jest.spyOn(reflector, 'get').mockReturnValue(defaultOptions);

          // Create admin user
          const user = {
            userId,
            deptId,
            isAdmin: true,
            roles: [{ roleKey: 'admin', dataScope: DataScope.ALL }],
          };

          const context = createMockContext(user);
          const handler: CallHandler = {
            handle: () => of({ success: true }),
          };

          // Execute interceptor
          const observable = await interceptor.intercept(context, handler);
          await new Promise((resolve) => {
            observable.subscribe({ next: resolve });
          });

          // Get the permission context from request
          const request = context.switchToHttp().getRequest();
          const permissionContext: DataPermissionContext = request[DATA_PERMISSION_CONTEXT_KEY];

          // Property: For admin user, dataScope should be ALL
          return (
            permissionContext.enabled === true &&
            permissionContext.dataScope === DataScope.ALL &&
            permissionContext.deptIds.length === 0 // No dept filtering for ALL scope
          );
        },
      ),
      { numRuns: 100 },
    );
  });

  /**
   * Property 23: 数据权限禁用正确性
   *
   * For any method with enable=false, no permission filtering should be applied.
   *
   * **Validates: Requirements 11.5**
   */
  it('Property 23: For any method with enable=false, permission should be disabled', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate random user IDs
        fc.integer({ min: 1, max: 10000 }),
        // Generate random dept IDs
        fc.integer({ min: 1, max: 1000 }),
        // Generate random data scopes
        fc.constantFrom(DataScope.SELF, DataScope.DEPT_ONLY, DataScope.DEPT_AND_CHILD),
        async (userId, deptId, userDataScope) => {
          // Configure options with enable=false
          jest.spyOn(reflector, 'get').mockReturnValue({
            ...defaultOptions,
            enable: false,
          });

          // Create user with restricted data scope
          const user = {
            userId,
            deptId,
            roles: [{ dataScope: userDataScope }],
          };

          const context = createMockContext(user);
          const handler: CallHandler = {
            handle: () => of({ success: true }),
          };

          // Execute interceptor
          const observable = await interceptor.intercept(context, handler);
          await new Promise((resolve) => {
            observable.subscribe({ next: resolve });
          });

          // Get the permission context from request
          const request = context.switchToHttp().getRequest();
          const permissionContext: DataPermissionContext = request[DATA_PERMISSION_CONTEXT_KEY];

          // Property: When enable=false, permission should be disabled and scope should be ALL
          return permissionContext.enabled === false && permissionContext.dataScope === DataScope.ALL;
        },
      ),
      { numRuns: 100 },
    );
  });

  /**
   * Property 22d: SQL builder should generate correct conditions for each scope
   *
   * **Validates: Requirements 11.3**
   */
  it('Property 22d: For any permission context, SQL builder should generate correct conditions', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate random user IDs
        fc.integer({ min: 1, max: 10000 }),
        // Generate random dept IDs
        fc.array(fc.integer({ min: 1, max: 1000 }), { minLength: 1, maxLength: 5 }),
        // Generate random data scopes
        fc.constantFrom(
          DataScope.ALL,
          DataScope.SELF,
          DataScope.DEPT_ONLY,
          DataScope.DEPT_CUSTOM,
          DataScope.DEPT_AND_CHILD,
        ),
        async (userId, deptIds, dataScope) => {
          const context: DataPermissionContext = {
            enabled: true,
            dataScope,
            userId,
            deptId: deptIds[0],
            deptIds: dataScope === DataScope.ALL || dataScope === DataScope.SELF ? [] : deptIds,
            options: defaultOptions,
          };

          // Build Prisma where condition
          const prismaWhere = DataPermissionSqlBuilder.buildPrismaWhere(context);

          // Build raw SQL condition
          const { sql, params } = DataPermissionSqlBuilder.buildRawSqlCondition(context);

          // Property: SQL conditions should match the data scope
          switch (dataScope) {
            case DataScope.ALL:
              return Object.keys(prismaWhere).length === 0 && sql === '1=1' && params.length === 0;

            case DataScope.SELF:
              // Prisma uses the configured column name (userId by default)
              const userIdKey = defaultOptions.userIdColumn || 'userId';
              return prismaWhere[userIdKey] === userId && sql.includes(userIdKey) && params.includes(userId);

            case DataScope.DEPT_ONLY:
            case DataScope.DEPT_CUSTOM:
            case DataScope.DEPT_AND_CHILD:
              // Prisma uses the configured column name (deptId by default)
              const deptIdKey = defaultOptions.deptIdColumn || 'deptId';
              const deptCondition = prismaWhere[deptIdKey];

              // Check Prisma condition
              const prismaValid =
                deptCondition !== undefined &&
                deptCondition.in !== undefined &&
                Array.isArray(deptCondition.in) &&
                deptCondition.in.length === context.deptIds.length;

              // Check SQL condition - uses the column name from options
              const sqlValid =
                sql.includes(deptIdKey) && sql.includes('IN') && params.length === context.deptIds.length;

              return prismaValid && sqlValid;

            default:
              return true;
          }
        },
      ),
      { numRuns: 100 },
    );
  });

  /**
   * Property 23b: Disabled context should generate no filtering conditions
   *
   * **Validates: Requirements 11.5**
   */
  it('Property 23b: For any disabled context, SQL builder should generate no conditions', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate random user IDs
        fc.integer({ min: 1, max: 10000 }),
        // Generate random dept IDs
        fc.integer({ min: 1, max: 1000 }),
        async (userId, deptId) => {
          const context: DataPermissionContext = {
            enabled: false,
            dataScope: DataScope.ALL,
            userId,
            deptId,
            deptIds: [],
            options: { ...defaultOptions, enable: false },
          };

          // Build Prisma where condition
          const prismaWhere = DataPermissionSqlBuilder.buildPrismaWhere(context);

          // Build raw SQL condition
          const { sql, params } = DataPermissionSqlBuilder.buildRawSqlCondition(context);

          // Property: Disabled context should generate no filtering
          return Object.keys(prismaWhere).length === 0 && sql === '1=1' && params.length === 0;
        },
      ),
      { numRuns: 100 },
    );
  });
});
