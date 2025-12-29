import { PrismaClient } from '@prisma/client';

/**
 * 测试角色种子数据
 * 用于 E2E 测试的预置角色
 */
export async function seedTestRoles(prisma: PrismaClient) {
  // 创建测试管理员角色
  const testAdminRole = await prisma.sysRole.upsert({
    where: { roleId: 9000 },
    update: {},
    create: {
      roleId: 9000,
      tenantId: '000000',
      roleName: 'E2E测试管理员',
      roleKey: 'test_admin',
      roleSort: 999,
      dataScope: 'ALL', // 全部数据权限
      menuCheckStrictly: false,
      deptCheckStrictly: false,
      status: 'NORMAL',
      delFlag: 'NORMAL',
      createBy: 'test_seed',
      updateBy: 'test_seed',
      remark: 'E2E测试管理员角色，拥有所有权限',
    },
  });

  // 创建测试普通用户角色
  const testUserRole = await prisma.sysRole.upsert({
    where: { roleId: 9001 },
    update: {},
    create: {
      roleId: 9001,
      tenantId: '000000',
      roleName: 'E2E测试用户',
      roleKey: 'test_user',
      roleSort: 1000,
      dataScope: 'CUSTOM', // 自定义数据权限
      menuCheckStrictly: false,
      deptCheckStrictly: false,
      status: 'NORMAL',
      delFlag: 'NORMAL',
      createBy: 'test_seed',
      updateBy: 'test_seed',
      remark: 'E2E测试普通用户角色，有限权限',
    },
  });

  // 创建测试部门经理角色
  const testManagerRole = await prisma.sysRole.upsert({
    where: { roleId: 9002 },
    update: {},
    create: {
      roleId: 9002,
      tenantId: '000000',
      roleName: 'E2E测试部门经理',
      roleKey: 'test_manager',
      roleSort: 1001,
      dataScope: 'DEPT_AND_CHILD', // 本部门及以下数据权限
      menuCheckStrictly: false,
      deptCheckStrictly: false,
      status: 'NORMAL',
      delFlag: 'NORMAL',
      createBy: 'test_seed',
      updateBy: 'test_seed',
      remark: 'E2E测试部门经理角色，管理本部门数据',
    },
  });

  // 创建测试只读角色
  const testReadonlyRole = await prisma.sysRole.upsert({
    where: { roleId: 9003 },
    update: {},
    create: {
      roleId: 9003,
      tenantId: '000000',
      roleName: 'E2E测试只读用户',
      roleKey: 'test_readonly',
      roleSort: 1002,
      dataScope: 'SELF', // 仅本人数据权限
      menuCheckStrictly: false,
      deptCheckStrictly: false,
      status: 'NORMAL',
      delFlag: 'NORMAL',
      createBy: 'test_seed',
      updateBy: 'test_seed',
      remark: 'E2E测试只读用户角色，只能查看自己的数据',
    },
  });

  // 创建测试禁用角色
  const testDisabledRole = await prisma.sysRole.upsert({
    where: { roleId: 9004 },
    update: {},
    create: {
      roleId: 9004,
      tenantId: '000000',
      roleName: 'E2E测试禁用角色',
      roleKey: 'test_disabled',
      roleSort: 1003,
      dataScope: 'ALL',
      menuCheckStrictly: false,
      deptCheckStrictly: false,
      status: 'DISABLED',
      delFlag: 'NORMAL',
      createBy: 'test_seed',
      updateBy: 'test_seed',
      remark: 'E2E测试禁用角色',
    },
  });

  console.log('✓ 测试角色种子数据创建成功');
  console.log(`  - 管理员角色: ${testAdminRole.roleName} (ID: ${testAdminRole.roleId})`);
  console.log(`  - 普通用户角色: ${testUserRole.roleName} (ID: ${testUserRole.roleId})`);
  console.log(`  - 部门经理角色: ${testManagerRole.roleName} (ID: ${testManagerRole.roleId})`);
  console.log(`  - 只读用户角色: ${testReadonlyRole.roleName} (ID: ${testReadonlyRole.roleId})`);
  console.log(`  - 禁用角色: ${testDisabledRole.roleName} (ID: ${testDisabledRole.roleId})`);

  return {
    testAdminRole,
    testUserRole,
    testManagerRole,
    testReadonlyRole,
    testDisabledRole,
  };
}

/**
 * 为测试角色分配菜单权限
 * 需要在菜单数据存在后调用
 */
export async function assignTestRoleMenus(prisma: PrismaClient) {
  // 获取所有菜单ID（用于管理员角色）
  const allMenus = await prisma.sysMenu.findMany({
    where: { delFlag: 'NORMAL' },
    select: { menuId: true },
  });

  const allMenuIds = allMenus.map((m) => m.menuId);

  // 为系统内置的 admin 角色（roleId: 1）分配所有菜单权限
  if (allMenuIds.length > 0) {
    // 先删除已有的关联
    await prisma.sysRoleMenu.deleteMany({
      where: { roleId: 1 },
    });

    // 创建新的关联
    await prisma.sysRoleMenu.createMany({
      data: allMenuIds.map((menuId) => ({
        roleId: 1,
        menuId,
      })),
      skipDuplicates: true,
    });

    console.log(`✓ 为系统管理员角色(roleId:1)分配了 ${allMenuIds.length} 个菜单权限`);
  }

  // 为测试管理员角色分配所有菜单权限
  if (allMenuIds.length > 0) {
    // 先删除已有的关联
    await prisma.sysRoleMenu.deleteMany({
      where: { roleId: 9000 },
    });

    // 创建新的关联
    await prisma.sysRoleMenu.createMany({
      data: allMenuIds.map((menuId) => ({
        roleId: 9000,
        menuId,
      })),
      skipDuplicates: true,
    });

    console.log(`✓ 为测试管理员角色分配了 ${allMenuIds.length} 个菜单权限`);
  }

  // 为测试普通用户角色分配部分菜单权限（仅查询权限）
  const basicMenus = await prisma.sysMenu.findMany({
    where: {
      AND: [
        { delFlag: 'NORMAL' },
        {
          OR: [
            { perms: { contains: ':query' } },
            { perms: { contains: ':list' } },
            { menuType: 'DIRECTORY' }, // 目录
            { menuType: 'MENU' }, // 菜单
          ],
        },
      ],
    },
    select: { menuId: true },
  });

  const basicMenuIds = basicMenus.map((m) => m.menuId);

  if (basicMenuIds.length > 0) {
    await prisma.sysRoleMenu.deleteMany({
      where: { roleId: 9001 },
    });

    await prisma.sysRoleMenu.createMany({
      data: basicMenuIds.map((menuId) => ({
        roleId: 9001,
        menuId,
      })),
      skipDuplicates: true,
    });

    console.log(`✓ 为测试普通用户角色分配了 ${basicMenuIds.length} 个菜单权限`);
  }
}

/**
 * 为测试角色分配部门权限
 */
export async function assignTestRoleDepts(prisma: PrismaClient) {
  // 为测试部门经理角色分配部门权限
  const testDepts = await prisma.sysDept.findMany({
    where: {
      deptName: { startsWith: 'E2E测试' },
    },
    select: { deptId: true },
  });

  const testDeptIds = testDepts.map((d) => d.deptId);

  if (testDeptIds.length > 0) {
    await prisma.sysRoleDept.deleteMany({
      where: { roleId: 9002 },
    });

    await prisma.sysRoleDept.createMany({
      data: testDeptIds.map((deptId) => ({
        roleId: 9002,
        deptId,
      })),
      skipDuplicates: true,
    });

    console.log(`✓ 为测试部门经理角色分配了 ${testDeptIds.length} 个部门权限`);
  }
}

/**
 * 清理测试角色数据
 */
export async function cleanupTestRoles(prisma: PrismaClient) {
  // 先删除角色关联数据
  await prisma.sysRoleMenu.deleteMany({
    where: { roleId: { gte: 9000, lte: 9999 } },
  });

  await prisma.sysRoleDept.deleteMany({
    where: { roleId: { gte: 9000, lte: 9999 } },
  });

  await prisma.sysUserRole.deleteMany({
    where: { roleId: { gte: 9000, lte: 9999 } },
  });

  // 删除角色
  await prisma.sysRole.deleteMany({
    where: {
      OR: [
        { roleName: { startsWith: 'E2E测试' } },
        { roleKey: { startsWith: 'test_' } },
        { roleId: { gte: 9000, lte: 9999 } },
      ],
    },
  });

  console.log('✓ 测试角色数据清理完成');
}
