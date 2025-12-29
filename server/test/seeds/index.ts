import { PrismaClient } from '@prisma/client';
import { seedTestUsers, cleanupTestUsers } from './user.seed';
import { seedTestDepts, cleanupTestDepts } from './dept.seed';
import { seedTestRoles, cleanupTestRoles, assignTestRoleMenus, assignTestRoleDepts } from './role.seed';

/**
 * 执行所有测试种子数据
 * 按照依赖顺序创建：部门 -> 角色 -> 用户 -> 角色权限分配
 */
export async function seedAllTestData(prisma: PrismaClient) {
  console.log('开始创建测试种子数据...\n');

  try {
    // 1. 创建测试部门
    console.log('1. 创建测试部门...');
    const depts = await seedTestDepts(prisma);

    // 2. 创建测试角色
    console.log('\n2. 创建测试角色...');
    const roles = await seedTestRoles(prisma);

    // 3. 创建测试用户
    console.log('\n3. 创建测试用户...');
    const users = await seedTestUsers(prisma);

    // 4. 为测试角色分配菜单权限
    console.log('\n4. 分配角色菜单权限...');
    await assignTestRoleMenus(prisma);

    // 5. 为测试角色分配部门权限
    console.log('\n5. 分配角色部门权限...');
    await assignTestRoleDepts(prisma);

    // 6. 为测试用户分配角色
    console.log('\n6. 分配用户角色...');
    await assignTestUserRoles(prisma, users, roles);

    console.log('\n✅ 所有测试种子数据创建成功！');

    return {
      depts,
      roles,
      users,
    };
  } catch (error) {
    console.error('\n❌ 创建测试种子数据失败:', error);
    throw error;
  }
}

/**
 * 为测试用户分配角色
 */
async function assignTestUserRoles(prisma: PrismaClient, users: any, roles: any) {
  // 为 admin 用户分配系统内置的 admin 角色（roleId: 1）
  const systemAdminRole = await prisma.sysRole.findFirst({
    where: { roleKey: 'admin', delFlag: 'NORMAL' },
  });

  if (systemAdminRole) {
    await prisma.sysUserRole.upsert({
      where: {
        userId_roleId: {
          userId: users.admin.userId,
          roleId: systemAdminRole.roleId,
        },
      },
      update: {},
      create: {
        userId: users.admin.userId,
        roleId: systemAdminRole.roleId,
      },
    });
  }

  // 为 admin 用户分配测试管理员角色
  await prisma.sysUserRole.upsert({
    where: {
      userId_roleId: {
        userId: users.admin.userId,
        roleId: roles.testAdminRole.roleId,
      },
    },
    update: {},
    create: {
      userId: users.admin.userId,
      roleId: roles.testAdminRole.roleId,
    },
  });

  // 为测试管理员分配管理员角色
  await prisma.sysUserRole.upsert({
    where: {
      userId_roleId: {
        userId: users.testAdmin.userId,
        roleId: roles.testAdminRole.roleId,
      },
    },
    update: {},
    create: {
      userId: users.testAdmin.userId,
      roleId: roles.testAdminRole.roleId,
    },
  });

  // 为测试用户分配普通用户角色
  await prisma.sysUserRole.upsert({
    where: {
      userId_roleId: {
        userId: users.testUser.userId,
        roleId: roles.testUserRole.roleId,
      },
    },
    update: {},
    create: {
      userId: users.testUser.userId,
      roleId: roles.testUserRole.roleId,
    },
  });

  // 为测试部门经理分配部门经理角色
  await prisma.sysUserRole.upsert({
    where: {
      userId_roleId: {
        userId: users.testManager.userId,
        roleId: roles.testManagerRole.roleId,
      },
    },
    update: {},
    create: {
      userId: users.testManager.userId,
      roleId: roles.testManagerRole.roleId,
    },
  });

  console.log('✓ 用户角色分配完成');
}

/**
 * 清理所有测试数据
 * 按照依赖顺序清理：用户 -> 角色 -> 部门
 */
export async function cleanupAllTestData(prisma: PrismaClient) {
  console.log('开始清理测试数据...\n');

  try {
    // 1. 清理测试用户
    console.log('1. 清理测试用户...');
    await cleanupTestUsers(prisma);

    // 2. 清理测试角色
    console.log('\n2. 清理测试角色...');
    await cleanupTestRoles(prisma);

    // 3. 清理测试部门
    console.log('\n3. 清理测试部门...');
    await cleanupTestDepts(prisma);

    console.log('\n✅ 所有测试数据清理完成！');
  } catch (error) {
    console.error('\n❌ 清理测试数据失败:', error);
    throw error;
  }
}

/**
 * 重置测试数据
 * 先清理再创建
 */
export async function resetTestData(prisma: PrismaClient) {
  console.log('重置测试数据...\n');
  await cleanupAllTestData(prisma);
  console.log('\n');
  await seedAllTestData(prisma);
}

// 导出单独的种子函数
export { seedTestUsers, cleanupTestUsers } from './user.seed';
export { seedTestDepts, cleanupTestDepts } from './dept.seed';
export {
  seedTestRoles,
  cleanupTestRoles,
  assignTestRoleMenus,
  assignTestRoleDepts,
} from './role.seed';
