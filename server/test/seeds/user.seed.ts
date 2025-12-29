import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

/**
 * 测试用户种子数据
 * 用于 E2E 测试的预置用户
 */
export async function seedTestUsers(prisma: PrismaClient) {
  const hashedPassword = await bcrypt.hash('admin123', 10);

  // 创建或更新 admin 用户（用于测试）
  const existingAdmin = await prisma.sysUser.findFirst({
    where: { userName: 'admin' },
  });

  let admin;
  if (existingAdmin) {
    admin = await prisma.sysUser.update({
      where: { userId: existingAdmin.userId },
      data: {
        password: hashedPassword,
        status: 'NORMAL',
        delFlag: 'NORMAL',
      },
    });
  } else {
    admin = await prisma.sysUser.create({
      data: {
        tenantId: '000000',
        deptId: 103,
        userName: 'admin',
        nickName: 'Nest Admin',
        userType: 'SYSTEM',
        email: 'admin@nestadmin.com',
        phonenumber: '15888888888',
        sex: 'FEMALE',
        avatar: '',
        password: hashedPassword,
        status: 'NORMAL',
        delFlag: 'NORMAL',
        loginIp: '127.0.0.1',
        loginDate: new Date(),
        createBy: 'admin',
        updateBy: 'admin',
        remark: '管理员',
      },
    });
  }

  // 创建测试管理员用户
  const testAdmin = await prisma.sysUser.create({
    data: {
      tenantId: '000000',
      deptId: 100,
      userName: 'test_admin',
      nickName: '测试管理员',
      userType: 'NORMAL',
      email: 'test_admin@test.example.com',
      phonenumber: '13800138001',
      sex: 'MALE',
      avatar: '',
      password: hashedPassword,
      status: 'NORMAL',
      delFlag: 'NORMAL',
      loginIp: '127.0.0.1',
      loginDate: new Date(),
      createBy: 'test_seed',
      updateBy: 'test_seed',
      remark: 'E2E测试管理员用户',
    },
  });

  // 创建测试普通用户
  const testUser = await prisma.sysUser.create({
    data: {
      tenantId: '000000',
      deptId: 101,
      userName: 'test_user',
      nickName: '测试用户',
      userType: 'NORMAL',
      email: 'test_user@test.example.com',
      phonenumber: '13800138002',
      sex: 'FEMALE',
      avatar: '',
      password: hashedPassword,
      status: 'NORMAL',
      delFlag: 'NORMAL',
      loginIp: '127.0.0.1',
      loginDate: new Date(),
      createBy: 'test_seed',
      updateBy: 'test_seed',
      remark: 'E2E测试普通用户',
    },
  });

  // 创建测试禁用用户
  const testDisabledUser = await prisma.sysUser.create({
    data: {
      tenantId: '000000',
      deptId: 101,
      userName: 'test_disabled',
      nickName: '测试禁用用户',
      userType: 'NORMAL',
      email: 'test_disabled@test.example.com',
      phonenumber: '13800138003',
      sex: 'MALE',
      avatar: '',
      password: hashedPassword,
      status: 'DISABLED',
      delFlag: 'NORMAL',
      loginIp: '127.0.0.1',
      loginDate: new Date(),
      createBy: 'test_seed',
      updateBy: 'test_seed',
      remark: 'E2E测试禁用用户',
    },
  });

  // 创建测试部门经理用户
  const testManager = await prisma.sysUser.create({
    data: {
      tenantId: '000000',
      deptId: 102,
      userName: 'test_manager',
      nickName: '测试部门经理',
      userType: 'NORMAL',
      email: 'test_manager@test.example.com',
      phonenumber: '13800138004',
      sex: 'MALE',
      avatar: '',
      password: hashedPassword,
      status: 'NORMAL',
      delFlag: 'NORMAL',
      loginIp: '127.0.0.1',
      loginDate: new Date(),
      createBy: 'test_seed',
      updateBy: 'test_seed',
      remark: 'E2E测试部门经理用户',
    },
  });

  console.log('✓ 测试用户种子数据创建成功');
  console.log(`  - 管理员: ${admin.userName} (ID: ${admin.userId})`);
  console.log(`  - 测试管理员: ${testAdmin.userName} (ID: ${testAdmin.userId})`);
  console.log(`  - 测试用户: ${testUser.userName} (ID: ${testUser.userId})`);
  console.log(`  - 测试禁用用户: ${testDisabledUser.userName} (ID: ${testDisabledUser.userId})`);
  console.log(`  - 测试部门经理: ${testManager.userName} (ID: ${testManager.userId})`);

  return {
    admin,
    testAdmin,
    testUser,
    testDisabledUser,
    testManager,
  };
}

/**
 * 清理测试用户数据
 */
export async function cleanupTestUsers(prisma: PrismaClient) {
  await prisma.sysUser.deleteMany({
    where: {
      OR: [
        { userName: { startsWith: 'test_' } },
        { email: { contains: '@test.example.com' } },
      ],
    },
  });

  console.log('✓ 测试用户数据清理完成');
}
