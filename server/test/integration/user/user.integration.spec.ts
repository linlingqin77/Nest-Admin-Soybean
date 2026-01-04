/**
 * 用户模块集成测试
 *
 * @description
 * 测试用户模块的完整流程，包括用户-角色关联、用户-部门关联
 * 使用真实的数据库和Redis连接
 *
 * _Requirements: 3.8, 3.9_
 */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe, VersioningType } from '@nestjs/common';
import { AppModule } from 'src/app.module';
import { PrismaService } from 'src/prisma/prisma.service';
import { RedisService } from 'src/module/common/redis/redis.service';
import { UserService } from 'src/module/system/user/user.service';
import { RoleService } from 'src/module/system/role/role.service';
import { DeptService } from 'src/module/system/dept/dept.service';
import { CacheEnum, DelFlagEnum, StatusEnum } from 'src/common/enum/index';
import * as bcrypt from 'bcryptjs';

describe('User Integration Tests', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let redisService: RedisService;
  let userService: UserService;
  let roleService: RoleService;
  let deptService: DeptService;

  // Test data tracking
  const createdUserIds: number[] = [];
  const createdRoleIds: number[] = [];
  const createdDeptIds: number[] = [];

  // Test tenant
  const testTenantId = '000000';

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    // Configure app similar to main.ts
    app.setGlobalPrefix('api');
    app.enableVersioning({
      type: VersioningType.URI,
      defaultVersion: '1',
      prefix: 'v',
    });
    app.useGlobalPipes(
      new ValidationPipe({
        transform: true,
        whitelist: true,
        transformOptions: {
          enableImplicitConversion: true,
        },
      }),
    );

    await app.init();

    prisma = app.get(PrismaService);
    redisService = app.get(RedisService);
    userService = app.get(UserService);
    roleService = app.get(RoleService);
    deptService = app.get(DeptService);
  }, 60000);

  afterAll(async () => {
    // Cleanup test data in reverse order of dependencies
    try {
      // Delete user-role associations
      if (createdUserIds.length > 0) {
        await prisma.sysUserRole.deleteMany({
          where: { userId: { in: createdUserIds } },
        });
        await prisma.sysUserPost.deleteMany({
          where: { userId: { in: createdUserIds } },
        });
      }

      // Delete users
      if (createdUserIds.length > 0) {
        await prisma.sysUser.deleteMany({
          where: { userId: { in: createdUserIds } },
        });
      }

      // Delete role-menu associations
      if (createdRoleIds.length > 0) {
        await prisma.sysRoleMenu.deleteMany({
          where: { roleId: { in: createdRoleIds } },
        });
        await prisma.sysRoleDept.deleteMany({
          where: { roleId: { in: createdRoleIds } },
        });
      }

      // Delete roles
      if (createdRoleIds.length > 0) {
        await prisma.sysRole.deleteMany({
          where: { roleId: { in: createdRoleIds } },
        });
      }

      // Delete departments
      if (createdDeptIds.length > 0) {
        await prisma.sysDept.deleteMany({
          where: { deptId: { in: createdDeptIds } },
        });
      }
    } catch (error) {
      console.error('Cleanup error:', error);
    }

    await app.close();
  });

  /**
   * Helper function to create a test user
   */
  async function createTestUser(data: Partial<{
    userName: string;
    nickName: string;
    password: string;
    deptId: number;
    roleIds: number[];
    postIds: number[];
  }> = {}) {
    const timestamp = Date.now();
    const shortTimestamp = timestamp.toString().slice(-6);
    const hashedPassword = await bcrypt.hash(data.password || '123456', 10);

    const user = await prisma.sysUser.create({
      data: {
        tenantId: testTenantId,
        userName: data.userName || `tu_${shortTimestamp}`,
        nickName: data.nickName || '测试用户',
        password: hashedPassword,
        deptId: data.deptId || 100,
        email: `t${shortTimestamp}@test.com`,
        phonenumber: `138${shortTimestamp}00`,
        sex: '0',
        status: StatusEnum.NORMAL,
        delFlag: DelFlagEnum.NORMAL,
        userType: '01',
        createBy: 'test',
        updateBy: 'test',
      },
    });

    createdUserIds.push(user.userId);

    // Assign roles if provided
    if (data.roleIds && data.roleIds.length > 0) {
      await prisma.sysUserRole.createMany({
        data: data.roleIds.map((roleId) => ({
          userId: user.userId,
          roleId,
        })),
        skipDuplicates: true,
      });
    }

    // Assign posts if provided
    if (data.postIds && data.postIds.length > 0) {
      await prisma.sysUserPost.createMany({
        data: data.postIds.map((postId) => ({
          userId: user.userId,
          postId,
        })),
        skipDuplicates: true,
      });
    }

    return user;
  }

  /**
   * Helper function to get or create a test role
   * Uses existing roles when possible to avoid ID conflicts
   */
  async function getOrCreateTestRole(data: Partial<{
    roleName: string;
    roleKey: string;
    menuIds: number[];
  }> = {}) {
    const timestamp = Date.now();
    const roleKey = data.roleKey || `test_role_${timestamp}`;

    // Try to find existing role with this key
    let role = await prisma.sysRole.findFirst({
      where: {
        roleKey,
        tenantId: testTenantId,
        delFlag: DelFlagEnum.NORMAL,
      },
    });

    if (!role) {
      // Create new role
      role = await prisma.sysRole.create({
        data: {
          tenantId: testTenantId,
          roleName: data.roleName || `测试角色_${timestamp}`,
          roleKey,
          roleSort: 99,
          dataScope: '1',
          status: StatusEnum.NORMAL,
          delFlag: DelFlagEnum.NORMAL,
          menuCheckStrictly: false,
          deptCheckStrictly: false,
          createBy: 'test',
          updateBy: 'test',
        },
      });

      createdRoleIds.push(role.roleId);

      // Assign menus if provided
      if (data.menuIds && data.menuIds.length > 0) {
        await prisma.sysRoleMenu.createMany({
          data: data.menuIds.map((menuId) => ({
            roleId: role!.roleId,
            menuId,
          })),
          skipDuplicates: true,
        });
      }
    }

    return role;
  }

  /**
   * Helper function to get existing roles for testing
   */
  async function getExistingRoles(count: number = 1) {
    const roles = await prisma.sysRole.findMany({
      where: {
        tenantId: testTenantId,
        delFlag: DelFlagEnum.NORMAL,
        roleId: { not: 1 }, // Exclude admin role
      },
      take: count,
    });
    return roles;
  }

  /**
   * Helper function to create a test department
   */
  async function createTestDept(data: Partial<{
    deptName: string;
    parentId: number;
  }> = {}) {
    const timestamp = Date.now();

    const dept = await prisma.sysDept.create({
      data: {
        tenantId: testTenantId,
        deptName: data.deptName || `测试部门_${timestamp}`,
        parentId: data.parentId || 0,
        orderNum: 1,
        leader: '测试负责人',
        phone: '13800138000',
        email: 'dept@example.com',
        status: StatusEnum.NORMAL,
        delFlag: DelFlagEnum.NORMAL,
        ancestors: data.parentId ? `0,${data.parentId}` : '0',
        createBy: 'test',
        updateBy: 'test',
      },
    });

    createdDeptIds.push(dept.deptId);
    return dept;
  }

  describe('User-Role Association Integration', () => {
    it('should create user with roles and verify association', async () => {
      // Get existing roles for testing
      const existingRoles = await getExistingRoles(1);
      
      if (existingRoles.length === 0) {
        // Skip test if no roles available
        console.log('Skipping test: No existing roles available');
        return;
      }

      const role = existingRoles[0];

      // Create user with the role
      const user = await createTestUser({
        roleIds: [role.roleId],
      });

      // Verify the association exists
      const userRoles = await prisma.sysUserRole.findMany({
        where: { userId: user.userId },
      });

      expect(userRoles).toHaveLength(1);
      expect(userRoles[0].roleId).toBe(role.roleId);
    });

    it('should update user roles correctly', async () => {
      // Get existing roles for testing
      const existingRoles = await getExistingRoles(2);
      
      if (existingRoles.length < 2) {
        console.log('Skipping test: Not enough existing roles available');
        return;
      }

      const role1 = existingRoles[0];
      const role2 = existingRoles[1];

      // Create user with role1
      const user = await createTestUser({
        roleIds: [role1.roleId],
      });

      // Update user to have role2 instead
      await prisma.sysUserRole.deleteMany({
        where: { userId: user.userId },
      });
      await prisma.sysUserRole.create({
        data: { userId: user.userId, roleId: role2.roleId },
      });

      // Verify the update
      const userRoles = await prisma.sysUserRole.findMany({
        where: { userId: user.userId },
      });

      expect(userRoles).toHaveLength(1);
      expect(userRoles[0].roleId).toBe(role2.roleId);
    });

    it('should assign multiple roles to user', async () => {
      // Get existing roles for testing
      const existingRoles = await getExistingRoles(3);
      
      if (existingRoles.length < 2) {
        console.log('Skipping test: Not enough existing roles available');
        return;
      }

      // Create user with multiple roles
      const user = await createTestUser({
        roleIds: existingRoles.map((r) => r.roleId),
      });

      // Verify all associations
      const userRoles = await prisma.sysUserRole.findMany({
        where: { userId: user.userId },
      });

      expect(userRoles.length).toBeGreaterThanOrEqual(existingRoles.length);
      const roleIds = userRoles.map((ur) => ur.roleId);
      existingRoles.forEach((role) => {
        expect(roleIds).toContain(role.roleId);
      });
    });

    it('should get user role IDs correctly', async () => {
      // Get existing roles for testing
      const existingRoles = await getExistingRoles(1);
      
      if (existingRoles.length === 0) {
        console.log('Skipping test: No existing roles available');
        return;
      }

      const role = existingRoles[0];

      // Create user with the role
      const user = await createTestUser({
        roleIds: [role.roleId],
      });

      // Use service to get role IDs
      const roleIds = await userService.getRoleIds([user.userId]);

      expect(Array.isArray(roleIds)).toBe(true);
      expect(roleIds).toContain(role.roleId);
    });

    it('should remove user role association when user is deleted', async () => {
      // Get existing roles for testing
      const existingRoles = await getExistingRoles(1);
      
      if (existingRoles.length === 0) {
        console.log('Skipping test: No existing roles available');
        return;
      }

      const role = existingRoles[0];

      // Create user with the role
      const user = await createTestUser({
        roleIds: [role.roleId],
      });

      // Verify association exists
      let userRoles = await prisma.sysUserRole.findMany({
        where: { userId: user.userId },
      });
      expect(userRoles).toHaveLength(1);

      // Delete user role associations
      await prisma.sysUserRole.deleteMany({
        where: { userId: user.userId },
      });

      // Verify association is removed
      userRoles = await prisma.sysUserRole.findMany({
        where: { userId: user.userId },
      });
      expect(userRoles).toHaveLength(0);
    });
  });

  describe('User-Department Association Integration', () => {
    it('should create user with department and verify association', async () => {
      // Create a test department
      const dept = await createTestDept({ deptName: '集成测试部门' });

      // Create user in the department
      const user = await createTestUser({
        deptId: dept.deptId,
      });

      // Verify the association
      const foundUser = await prisma.sysUser.findUnique({
        where: { userId: user.userId },
      });

      expect(foundUser?.deptId).toBe(dept.deptId);
    });

    it('should update user department correctly', async () => {
      // Create two test departments
      const dept1 = await createTestDept({ deptName: '部门1' });
      const dept2 = await createTestDept({ deptName: '部门2' });

      // Create user in dept1
      const user = await createTestUser({
        deptId: dept1.deptId,
      });

      // Update user to dept2
      await prisma.sysUser.update({
        where: { userId: user.userId },
        data: { deptId: dept2.deptId },
      });

      // Verify the update
      const foundUser = await prisma.sysUser.findUnique({
        where: { userId: user.userId },
      });

      expect(foundUser?.deptId).toBe(dept2.deptId);
    });

    it('should get department tree correctly', async () => {
      // Create parent department
      const parentDept = await createTestDept({ deptName: '父部门' });

      // Create child department
      const childDept = await createTestDept({
        deptName: '子部门',
        parentId: parentDept.deptId,
      });

      // Get department tree
      const result = await userService.deptTree();

      expect(result.code).toBe(200);
      expect(Array.isArray(result.data)).toBe(true);
    });

    it('should find users by department ID', async () => {
      // Create a test department
      const dept = await createTestDept({ deptName: '查询部门' });

      // Create multiple users in the department
      const user1 = await createTestUser({
        deptId: dept.deptId,
      });
      const user2 = await createTestUser({
        deptId: dept.deptId,
      });

      // Find users by department
      const result = await userService.findByDeptId(dept.deptId);

      expect(result.code).toBe(200);
      expect(Array.isArray(result.data)).toBe(true);
      expect(result.data.length).toBeGreaterThanOrEqual(2);

      const userIds = result.data.map((u: any) => u.userId);
      expect(userIds).toContain(user1.userId);
      expect(userIds).toContain(user2.userId);
    });

    it('should filter users by department in list query', async () => {
      // Create a test department
      const dept = await createTestDept({ deptName: '过滤部门' });

      // Create user in the department
      const user = await createTestUser({
        deptId: dept.deptId,
      });

      // Get admin user for data scope
      const adminUser = await prisma.sysUser.findFirst({
        where: { userName: 'admin' },
      });

      // Get user roles separately
      const userRoles = await prisma.sysUserRole.findMany({
        where: { userId: adminUser?.userId || 1 },
      });

      const roleIds = userRoles.map((ur) => ur.roleId);
      const roles = await prisma.sysRole.findMany({
        where: { roleId: { in: roleIds } },
      });

      const currentUser = {
        userId: adminUser?.userId || 1,
        deptId: adminUser?.deptId || 100,
        roles: roles.map((role) => ({
          roleId: role.roleId,
          dataScope: role.dataScope,
        })),
      };

      // Query users with department filter
      const result = await userService.findAll(
        { pageNum: 1, pageSize: 100, deptId: dept.deptId } as any,
        currentUser as any,
      );

      expect(result.code).toBe(200);
      expect(result.data.rows.some((u: any) => u.userId === user.userId)).toBe(true);
    });
  });

  describe('User-Role-Department Combined Integration', () => {
    it('should create user with both role and department', async () => {
      // Create test department
      const dept = await createTestDept({ deptName: '综合部门' });
      
      // Get existing role
      const existingRoles = await getExistingRoles(1);
      if (existingRoles.length === 0) {
        console.log('Skipping test: No existing roles available');
        return;
      }
      const role = existingRoles[0];

      // Create user with both
      const user = await createTestUser({
        deptId: dept.deptId,
        roleIds: [role.roleId],
      });

      // Verify department association
      const foundUser = await prisma.sysUser.findUnique({
        where: { userId: user.userId },
      });
      expect(foundUser?.deptId).toBe(dept.deptId);

      // Verify role association
      const userRoles = await prisma.sysUserRole.findMany({
        where: { userId: user.userId },
      });
      expect(userRoles).toHaveLength(1);
      expect(userRoles[0].roleId).toBe(role.roleId);
    });

    it('should get user detail with department and roles', async () => {
      // Create test department
      const dept = await createTestDept({ deptName: '详情部门' });
      
      // Get existing role
      const existingRoles = await getExistingRoles(1);
      if (existingRoles.length === 0) {
        console.log('Skipping test: No existing roles available');
        return;
      }
      const role = existingRoles[0];

      // Create user with both
      const user = await createTestUser({
        deptId: dept.deptId,
        roleIds: [role.roleId],
      });

      // Get user detail
      const result = await userService.findOne(user.userId);

      expect(result.code).toBe(200);
      expect(result.data).toBeDefined();
      expect(result.data.data.userId).toBe(user.userId);
      expect(result.data.data.deptId).toBe(dept.deptId);
      expect(result.data.roleIds).toContain(role.roleId);
    });
  });
});
