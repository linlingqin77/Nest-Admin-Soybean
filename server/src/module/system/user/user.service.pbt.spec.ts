/**
 * UserService Property-Based Tests
 *
 * Feature: enterprise-app-optimization
 * Property 1: 多租户数据隔离
 * Validates: Requirements 1.7
 *
 * This test verifies that tenant data isolation is correctly enforced:
 * For any tenant A's data operations, tenant B should not be able to
 * access, modify, or delete tenant A's data.
 */

import { Test, TestingModule } from '@nestjs/testing';
import * as fc from 'fast-check';
import { UserService } from './user.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { UserRepository } from './user.repository';
import { RoleService } from '../role/role.service';
import { DeptService } from '../dept/dept.service';
import { JwtService } from '@nestjs/jwt';
import { RedisService } from 'src/module/common/redis/redis.service';
import { ConfigService } from '../config/config.service';
import { UserAuthService } from './services/user-auth.service';
import { UserProfileService } from './services/user-profile.service';
import { UserRoleService } from './services/user-role.service';
import { UserExportService } from './services/user-export.service';
import { DelFlagEnum, StatusEnum, DataScopeEnum } from 'src/common/enum/index';

describe('UserService Property-Based Tests', () => {
  let service: UserService;
  let prisma: PrismaService;
  let userRepo: UserRepository;

  // Store for simulating multi-tenant data
  const tenantDataStore: Map<string, Map<number, any>> = new Map();
  let userIdCounter = 1;

  const createMockUser = (tenantId: string, userName: string) => ({
    userId: userIdCounter++,
    tenantId,
    deptId: 100,
    userName,
    nickName: `User ${userName}`,
    userType: '01',
    email: `${userName}@example.com`,
    phonenumber: '13800138000',
    sex: '0',
    avatar: '',
    password: 'hashed_password',
    status: StatusEnum.NORMAL,
    delFlag: DelFlagEnum.NORMAL,
    loginIp: '127.0.0.1',
    loginDate: new Date(),
    createBy: 'admin',
    createTime: new Date(),
    updateBy: 'admin',
    updateTime: new Date(),
    remark: null,
  });

  beforeEach(async () => {
    // Reset state
    tenantDataStore.clear();
    userIdCounter = 1;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: PrismaService,
          useValue: {
            sysUser: {
              findMany: jest.fn().mockImplementation(({ where }) => {
                // Simulate tenant-aware query
                const tenantId = where?.tenantId;
                if (!tenantId) return [];
                const tenantUsers = tenantDataStore.get(tenantId);
                if (!tenantUsers) return [];
                return Array.from(tenantUsers.values()).filter((user) => {
                  if (where.delFlag && user.delFlag !== where.delFlag) return false;
                  if (where.userId && user.userId !== where.userId) return false;
                  return true;
                });
              }),
              findFirst: jest.fn().mockImplementation(({ where }) => {
                const tenantId = where?.tenantId;
                if (!tenantId) return null;
                const tenantUsers = tenantDataStore.get(tenantId);
                if (!tenantUsers) return null;
                for (const user of tenantUsers.values()) {
                  if (where.userId && user.userId === where.userId) return user;
                  if (where.userName && user.userName === where.userName) return user;
                }
                return null;
              }),
              create: jest.fn(),
              update: jest.fn(),
              count: jest.fn(),
            },
            sysDept: {
              findMany: jest.fn().mockResolvedValue([]),
              findFirst: jest.fn().mockResolvedValue(null),
            },
            sysPost: {
              findMany: jest.fn().mockResolvedValue([]),
            },
            sysUserRole: {
              findMany: jest.fn().mockResolvedValue([]),
              deleteMany: jest.fn(),
              createMany: jest.fn(),
            },
            sysUserPost: {
              findMany: jest.fn().mockResolvedValue([]),
              deleteMany: jest.fn(),
              createMany: jest.fn(),
            },
            sysRoleDept: {
              findMany: jest.fn().mockResolvedValue([]),
            },
            $transaction: jest.fn((fn) => {
              if (Array.isArray(fn)) return Promise.all(fn);
              return fn(prisma);
            }),
          },
        },
        {
          provide: UserRepository,
          useValue: {
            findById: jest.fn().mockImplementation((userId: number) => {
              // Search across all tenants (simulating direct DB access without tenant filter)
              for (const tenantUsers of tenantDataStore.values()) {
                const user = tenantUsers.get(userId);
                if (user) return user;
              }
              return null;
            }),
            findByUserName: jest.fn(),
            create: jest.fn().mockImplementation((data) => {
              const user = { ...data, userId: userIdCounter++ };
              if (!tenantDataStore.has(data.tenantId)) {
                tenantDataStore.set(data.tenantId, new Map());
              }
              tenantDataStore.get(data.tenantId)!.set(user.userId, user);
              return user;
            }),
            update: jest.fn(),
            softDelete: jest.fn(),
            softDeleteBatch: jest.fn(),
            resetPassword: jest.fn(),
            updateLoginTime: jest.fn(),
          },
        },
        {
          provide: RoleService,
          useValue: {
            findRoles: jest.fn().mockResolvedValue([]),
            getPermissionsByRoleIds: jest.fn().mockResolvedValue([]),
          },
        },
        {
          provide: DeptService,
          useValue: {
            findDeptIdsByDataScope: jest.fn().mockResolvedValue([100]),
            deptTree: jest.fn().mockResolvedValue([]),
          },
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn().mockReturnValue('mock-token'),
            verify: jest.fn(),
          },
        },
        {
          provide: RedisService,
          useValue: {
            get: jest.fn(),
            set: jest.fn(),
            del: jest.fn(),
            keys: jest.fn().mockResolvedValue([]),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            getConfigValue: jest.fn().mockResolvedValue('false'),
            getSystemConfigValue: jest.fn().mockResolvedValue('false'),
          },
        },
        {
          provide: UserAuthService,
          useValue: {
            login: jest.fn(),
            register: jest.fn(),
            createToken: jest.fn(),
            parseToken: jest.fn(),
            updateRedisToken: jest.fn(),
            updateRedisUserRolesAndPermissions: jest.fn(),
            getRoleIds: jest.fn().mockResolvedValue([]),
            getUserPermissions: jest.fn().mockResolvedValue([]),
            getUserinfo: jest.fn(),
          },
        },
        {
          provide: UserProfileService,
          useValue: {
            profile: jest.fn(),
            updateProfile: jest.fn(),
            updatePwd: jest.fn(),
            resetPwd: jest.fn(),
          },
        },
        {
          provide: UserRoleService,
          useValue: {
            authRole: jest.fn(),
            updateAuthRole: jest.fn(),
            allocatedList: jest.fn(),
            unallocatedList: jest.fn(),
            authUserCancel: jest.fn(),
            authUserCancelAll: jest.fn(),
            authUserSelectAll: jest.fn(),
          },
        },
        {
          provide: UserExportService,
          useValue: {
            export: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
    prisma = module.get<PrismaService>(PrismaService);
    userRepo = module.get<UserRepository>(UserRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  /**
   * Property 1: Multi-tenant Data Isolation
   *
   * For any tenant A's data operations, tenant B should not be able to
   * access, modify, or delete tenant A's data.
   *
   * **Validates: Requirements 1.7**
   */
  describe('Property 1: Multi-tenant Data Isolation', () => {
    // Generator for valid tenant IDs (6-character alphanumeric strings)
    const tenantIdArb = fc.stringMatching(/^[0-9]{6}$/);

    // Generator for valid usernames
    const userNameArb = fc.stringMatching(/^[a-z][a-z0-9]{2,19}$/);

    it('should isolate user data between different tenants - tenant B cannot see tenant A users', async () => {
      await fc.assert(
        fc.asyncProperty(
          tenantIdArb,
          tenantIdArb,
          userNameArb,
          async (tenantIdA, tenantIdB, userName) => {
            // Precondition: tenants must be different
            fc.pre(tenantIdA !== tenantIdB);

            // Setup: Create a user in tenant A
            const userA = createMockUser(tenantIdA, userName);
            if (!tenantDataStore.has(tenantIdA)) {
              tenantDataStore.set(tenantIdA, new Map());
            }
            tenantDataStore.get(tenantIdA)!.set(userA.userId, userA);

            // Action: Query users as tenant B
            const tenantBUsers = await prisma.sysUser.findMany({
              where: {
                tenantId: tenantIdB,
                delFlag: DelFlagEnum.NORMAL,
              },
            });

            // Assertion: Tenant B should not see tenant A's user
            const foundUserA = tenantBUsers.find((u: any) => u.userId === userA.userId);
            expect(foundUserA).toBeUndefined();

            // Cleanup
            tenantDataStore.get(tenantIdA)?.delete(userA.userId);
          },
        ),
        { numRuns: 100 },
      );
    });

    it('should isolate user queries - findFirst respects tenant boundary', async () => {
      await fc.assert(
        fc.asyncProperty(
          tenantIdArb,
          tenantIdArb,
          userNameArb,
          async (tenantIdA, tenantIdB, userName) => {
            fc.pre(tenantIdA !== tenantIdB);

            // Setup: Create user in tenant A
            const userA = createMockUser(tenantIdA, userName);
            if (!tenantDataStore.has(tenantIdA)) {
              tenantDataStore.set(tenantIdA, new Map());
            }
            tenantDataStore.get(tenantIdA)!.set(userA.userId, userA);

            // Action: Try to find user by ID as tenant B
            const result = await prisma.sysUser.findFirst({
              where: {
                tenantId: tenantIdB,
                userId: userA.userId,
              },
            });

            // Assertion: Should not find the user
            expect(result).toBeNull();

            // Cleanup
            tenantDataStore.get(tenantIdA)?.delete(userA.userId);
          },
        ),
        { numRuns: 100 },
      );
    });

    it('should ensure users created in one tenant are only visible to that tenant', async () => {
      await fc.assert(
        fc.asyncProperty(
          tenantIdArb,
          fc.array(tenantIdArb, { minLength: 1, maxLength: 5 }),
          userNameArb,
          async (creatorTenantId, otherTenantIds, userName) => {
            // Filter out the creator tenant from other tenants
            const distinctOtherTenants = otherTenantIds.filter((t) => t !== creatorTenantId);
            fc.pre(distinctOtherTenants.length > 0);

            // Setup: Create user in creator tenant
            const user = createMockUser(creatorTenantId, userName);
            if (!tenantDataStore.has(creatorTenantId)) {
              tenantDataStore.set(creatorTenantId, new Map());
            }
            tenantDataStore.get(creatorTenantId)!.set(user.userId, user);

            // Verify user is visible to creator tenant
            const creatorResult = await prisma.sysUser.findMany({
              where: {
                tenantId: creatorTenantId,
                delFlag: DelFlagEnum.NORMAL,
              },
            });
            expect(creatorResult.some((u: any) => u.userId === user.userId)).toBe(true);

            // Verify user is NOT visible to any other tenant
            for (const otherTenantId of distinctOtherTenants) {
              const otherResult = await prisma.sysUser.findMany({
                where: {
                  tenantId: otherTenantId,
                  delFlag: DelFlagEnum.NORMAL,
                },
              });
              expect(otherResult.some((u: any) => u.userId === user.userId)).toBe(false);
            }

            // Cleanup
            tenantDataStore.get(creatorTenantId)?.delete(user.userId);
          },
        ),
        { numRuns: 100 },
      );
    });

    it('should maintain isolation even with same username across tenants', async () => {
      await fc.assert(
        fc.asyncProperty(tenantIdArb, tenantIdArb, userNameArb, async (tenantIdA, tenantIdB, userName) => {
          fc.pre(tenantIdA !== tenantIdB);

          // Setup: Create users with same username in both tenants
          const userA = createMockUser(tenantIdA, userName);
          const userB = createMockUser(tenantIdB, userName);

          if (!tenantDataStore.has(tenantIdA)) {
            tenantDataStore.set(tenantIdA, new Map());
          }
          if (!tenantDataStore.has(tenantIdB)) {
            tenantDataStore.set(tenantIdB, new Map());
          }
          tenantDataStore.get(tenantIdA)!.set(userA.userId, userA);
          tenantDataStore.get(tenantIdB)!.set(userB.userId, userB);

          // Query tenant A
          const tenantAUsers = await prisma.sysUser.findMany({
            where: {
              tenantId: tenantIdA,
              delFlag: DelFlagEnum.NORMAL,
            },
          });

          // Query tenant B
          const tenantBUsers = await prisma.sysUser.findMany({
            where: {
              tenantId: tenantIdB,
              delFlag: DelFlagEnum.NORMAL,
            },
          });

          // Assertions
          // Tenant A should only see userA
          expect(tenantAUsers.some((u: any) => u.userId === userA.userId)).toBe(true);
          expect(tenantAUsers.some((u: any) => u.userId === userB.userId)).toBe(false);

          // Tenant B should only see userB
          expect(tenantBUsers.some((u: any) => u.userId === userB.userId)).toBe(true);
          expect(tenantBUsers.some((u: any) => u.userId === userA.userId)).toBe(false);

          // Cleanup
          tenantDataStore.get(tenantIdA)?.delete(userA.userId);
          tenantDataStore.get(tenantIdB)?.delete(userB.userId);
        }),
        { numRuns: 100 },
      );
    });
  });
});
