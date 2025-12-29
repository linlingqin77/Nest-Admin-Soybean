import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'postgresql://postgres:123456@127.0.0.1:5432/nest-admin-soybean?schema=public',
    },
  },
});

async function checkAdminUser() {
  try {
    const admin = await prisma.sysUser.findFirst({
      where: { userName: 'admin' },
    });

    if (!admin) {
      console.log('❌ 未找到 admin 用户');
      return;
    }

    console.log('✓ 找到 admin 用户:');
    console.log('  - userId:', admin.userId);
    console.log('  - userName:', admin.userName);
    console.log('  - nickName:', admin.nickName);
    console.log('  - email:', admin.email);
    console.log('  - status:', admin.status);
    console.log('  - delFlag:', admin.delFlag);
    console.log('  - password hash:', admin.password);
    console.log('');

    // 测试密码
    const passwords = ['admin123', 'admin', '123456'];
    console.log('测试密码:');
    for (const pwd of passwords) {
      const isMatch = await bcrypt.compare(pwd, admin.password);
      console.log(`  - "${pwd}": ${isMatch ? '✓ 匹配' : '✗ 不匹配'}`);
    }
  } catch (error) {
    console.error('错误:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAdminUser();
