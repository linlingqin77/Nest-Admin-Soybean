import { PrismaClient } from '@prisma/client';

/**
 * 测试部门种子数据
 * 用于 E2E 测试的预置部门
 */
export async function seedTestDepts(prisma: PrismaClient) {
  // 创建测试根部门
  const testRootDept = await prisma.sysDept.upsert({
    where: { deptId: 9000 },
    update: {},
    create: {
      deptId: 9000,
      tenantId: '000000',
      parentId: 0,
      ancestors: '0',
      deptName: 'E2E测试部门',
      orderNum: 999,
      leader: 'test_admin',
      phone: '13800138000',
      email: 'test_dept@test.example.com',
      status: 'NORMAL',
      delFlag: 'NORMAL',
      createBy: 'test_seed',
      updateBy: 'test_seed',
    },
  });

  // 创建测试子部门1 - 技术部
  const testTechDept = await prisma.sysDept.upsert({
    where: { deptId: 9001 },
    update: {},
    create: {
      deptId: 9001,
      tenantId: '000000',
      parentId: 9000,
      ancestors: '0,9000',
      deptName: 'E2E测试技术部',
      orderNum: 1,
      leader: 'test_manager',
      phone: '13800138001',
      email: 'tech@test.example.com',
      status: 'NORMAL',
      delFlag: 'NORMAL',
      createBy: 'test_seed',
      updateBy: 'test_seed',
    },
  });

  // 创建测试子部门2 - 市场部
  const testMarketDept = await prisma.sysDept.upsert({
    where: { deptId: 9002 },
    update: {},
    create: {
      deptId: 9002,
      tenantId: '000000',
      parentId: 9000,
      ancestors: '0,9000',
      deptName: 'E2E测试市场部',
      orderNum: 2,
      leader: 'test_user',
      phone: '13800138002',
      email: 'market@test.example.com',
      status: 'NORMAL',
      delFlag: 'NORMAL',
      createBy: 'test_seed',
      updateBy: 'test_seed',
    },
  });

  // 创建测试子部门3 - 研发部（技术部下级）
  const testDevDept = await prisma.sysDept.upsert({
    where: { deptId: 9003 },
    update: {},
    create: {
      deptId: 9003,
      tenantId: '000000',
      parentId: 9001,
      ancestors: '0,9000,9001',
      deptName: 'E2E测试研发部',
      orderNum: 1,
      leader: 'test_admin',
      phone: '13800138003',
      email: 'dev@test.example.com',
      status: 'NORMAL',
      delFlag: 'NORMAL',
      createBy: 'test_seed',
      updateBy: 'test_seed',
    },
  });

  // 创建测试禁用部门
  const testDisabledDept = await prisma.sysDept.upsert({
    where: { deptId: 9004 },
    update: {},
    create: {
      deptId: 9004,
      tenantId: '000000',
      parentId: 9000,
      ancestors: '0,9000',
      deptName: 'E2E测试禁用部门',
      orderNum: 999,
      leader: '',
      phone: '',
      email: '',
      status: 'DISABLED',
      delFlag: 'NORMAL',
      createBy: 'test_seed',
      updateBy: 'test_seed',
    },
  });

  console.log('✓ 测试部门种子数据创建成功');
  console.log(`  - 根部门: ${testRootDept.deptName} (ID: ${testRootDept.deptId})`);
  console.log(`  - 技术部: ${testTechDept.deptName} (ID: ${testTechDept.deptId})`);
  console.log(`  - 市场部: ${testMarketDept.deptName} (ID: ${testMarketDept.deptId})`);
  console.log(`  - 研发部: ${testDevDept.deptName} (ID: ${testDevDept.deptId})`);
  console.log(`  - 禁用部门: ${testDisabledDept.deptName} (ID: ${testDisabledDept.deptId})`);

  return {
    testRootDept,
    testTechDept,
    testMarketDept,
    testDevDept,
    testDisabledDept,
  };
}

/**
 * 清理测试部门数据
 */
export async function cleanupTestDepts(prisma: PrismaClient) {
  await prisma.sysDept.deleteMany({
    where: {
      OR: [
        { deptName: { startsWith: 'E2E测试' } },
        { deptName: { contains: 'test_' } },
        { deptId: { gte: 9000, lte: 9999 } },
      ],
    },
  });

  console.log('✓ 测试部门数据清理完成');
}
