import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { GlobalExceptionFilter } from '../src/common/filters/global-exception.filter';
import cookieParser from 'cookie-parser';
import { AppConfigService } from '../src/config/app-config.service';
import request from 'supertest';

/**
 * 创建测试应用实例
 * 配置与生产环境一致的中间件和管道
 */
export async function createTestApp(): Promise<INestApplication> {
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = moduleFixture.createNestApplication();
  const config = app.get(AppConfigService);

  // 设置 API 前缀
  const prefix = config.app.prefix;
  app.setGlobalPrefix(prefix);

  // 全局验证管道
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // 全局异常过滤器
  app.useGlobalFilters(new GlobalExceptionFilter());

  // Cookie 解析器
  app.use(cookieParser());

  await app.init();

  // 在测试环境中禁用验证码
  const prisma = app.get(PrismaService);
  try {
    // 更新系统配置，禁用验证码
    await prisma.sysSystemConfig.upsert({
      where: {
        configKey: 'sys.account.captchaEnabled',
      },
      update: {
        configValue: 'false',
      },
      create: {
        configKey: 'sys.account.captchaEnabled',
        configName: '验证码开关（测试）',
        configValue: 'false',
        configType: 'YES',
        status: 'NORMAL',
        delFlag: 'NORMAL',
        createBy: 'test',
        updateBy: 'test',
      },
    });
  } catch (error) {
    console.warn('禁用验证码配置失败，继续测试:', error.message);
  }

  return app;
}

/**
 * 清理测试数据库
 * 删除所有测试相关的数据
 */
export async function cleanupDatabase(app: INestApplication): Promise<void> {
  const prisma = app.get(PrismaService);

  try {
    // 使用事务确保数据一致性
    await prisma.$transaction(async (tx) => {
      // 清理测试用户相关数据（通过用户名前缀识别测试用户）
      await tx.sysUser.deleteMany({
        where: {
          OR: [
            { userName: { startsWith: 'test_' } },
            { userName: { startsWith: 'e2e_' } },
            { email: { contains: '@test.example.com' } },
          ],
        },
      });

      // 清理测试部门
      await tx.sysDept.deleteMany({
        where: {
          OR: [
            { deptName: { startsWith: 'test_' } },
            { deptName: { contains: 'E2E' } },
          ],
        },
      });

      // 清理测试角色
      await tx.sysRole.deleteMany({
        where: {
          OR: [
            { roleName: { startsWith: 'test_' } },
            { roleName: { contains: 'E2E' } },
          ],
        },
      });

      // 清理测试菜单
      await tx.sysMenu.deleteMany({
        where: {
          OR: [
            { menuName: { startsWith: 'test_' } },
            { menuName: { contains: 'E2E' } },
          ],
        },
      });

      // 清理测试配置
      await tx.sysConfig.deleteMany({
        where: {
          OR: [
            { configKey: { startsWith: 'test.' } },
            { configKey: { contains: 'e2e' } },
          ],
        },
      });

      // 清理测试字典
      await tx.sysDictType.deleteMany({
        where: {
          OR: [
            { dictType: { startsWith: 'test_' } },
            { dictType: { contains: 'e2e' } },
          ],
        },
      });

      // 清理测试通知
      await tx.sysNotice.deleteMany({
        where: {
          OR: [
            { noticeTitle: { startsWith: 'test_' } },
            { noticeTitle: { contains: 'E2E' } },
          ],
        },
      });

      // 清理测试岗位
      await tx.sysPost.deleteMany({
        where: {
          OR: [
            { postName: { startsWith: 'test_' } },
            { postName: { contains: 'E2E' } },
          ],
        },
      });

      // 清理测试租户（非默认租户）
      await tx.sysTenant.deleteMany({
        where: {
          AND: [
            { tenantId: { not: '000000' } },
            {
              OR: [
                { companyName: { startsWith: 'test_' } },
                { companyName: { contains: 'E2E' } },
              ],
            },
          ],
        },
      });

      // 清理测试定时任务
      await tx.sysJob.deleteMany({
        where: {
          OR: [
            { jobName: { startsWith: 'test_' } },
            { jobName: { contains: 'E2E' } },
          ],
        },
      });

      // 清理测试操作日志（保留最近的日志）
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      await tx.sysOperLog.deleteMany({
        where: {
          AND: [
            { operTime: { lt: thirtyDaysAgo } },
            {
              OR: [
                { operName: { startsWith: 'test_' } },
                { title: { contains: 'E2E' } },
              ],
            },
          ],
        },
      });

      // 清理测试登录日志
      await tx.sysLogininfor.deleteMany({
        where: {
          AND: [
            { loginTime: { lt: thirtyDaysAgo } },
            {
              OR: [
                { userName: { startsWith: 'test_' } },
                { userName: { contains: 'e2e' } },
              ],
            },
          ],
        },
      });
    });
  } catch (error) {
    console.error('清理测试数据失败:', error);
    throw error;
  }
}

/**
 * 获取认证 Token
 * 使用指定的用户名和密码登录，返回 JWT Token
 */
export async function getAuthToken(
  app: INestApplication,
  userName: string = 'admin',
  password: string = 'admin123',
): Promise<string> {
  const config = app.get(AppConfigService);
  const prefix = config.app.prefix;

  try {
    const response = await request(app.getHttpServer())
      .post(`${prefix}/auth/login`)
      .send({
        username: userName, // 使用 username 而不是 userName
        password,
        clientId: 'pc',
        grantType: 'password',
      })
      .expect(200);

    if (response.body.code !== 200) {
      throw new Error(`登录失败: ${response.body.msg}`);
    }

    // 新的登录接口返回 access_token 而不是 token
    const token = response.body.data?.access_token || response.body.data?.token;
    if (!token) {
      throw new Error('登录响应中未找到 token');
    }

    return token;
  } catch (error) {
    console.error('获取认证 Token 失败:', error);
    throw error;
  }
}

/**
 * 创建测试用户
 * 用于 E2E 测试的临时用户
 */
export async function createTestUser(
  app: INestApplication,
  userData: {
    userName: string;
    password: string;
    nickName?: string;
    email?: string;
    phonenumber?: string;
    deptId?: number;
    roleIds?: number[];
  },
): Promise<any> {
  const prisma = app.get(PrismaService);
  const bcrypt = require('bcryptjs');

  const hashedPassword = await bcrypt.hash(userData.password, 10);

  // 确保字段长度不超过数据库限制
  const userName = userData.userName.length > 30 ? userData.userName.substring(0, 30) : userData.userName;
  const nickName = userData.nickName 
    ? (userData.nickName.length > 30 ? userData.nickName.substring(0, 30) : userData.nickName)
    : (userName.length > 30 ? userName.substring(0, 30) : userName);
  const email = userData.email 
    ? (userData.email.length > 50 ? userData.email.substring(0, 50) : userData.email)
    : `${userName.substring(0, 20)}@test.example.com`;

  const user = await prisma.sysUser.create({
    data: {
      tenantId: '000000',
      userName,
      nickName,
      password: hashedPassword,
      email,
      phonenumber: userData.phonenumber || '13800138000',
      userType: 'NORMAL', // 使用普通用户类型，以便可以修改状态
      deptId: userData.deptId || 100,
      sex: 'MALE',
      status: 'NORMAL',
      delFlag: 'NORMAL',
      createBy: 'test',
      updateBy: 'test',
    },
  });

  // 如果指定了角色，创建用户角色关联
  if (userData.roleIds && userData.roleIds.length > 0) {
    await prisma.sysUserRole.createMany({
      data: userData.roleIds.map((roleId) => ({
        userId: user.userId,
        roleId,
      })),
    });
  }

  return user;
}

/**
 * 创建测试部门
 */
export async function createTestDept(
  app: INestApplication,
  deptData: {
    deptName: string;
    parentId?: number;
    orderNum?: number;
    leader?: string;
  },
): Promise<any> {
  const prisma = app.get(PrismaService);

  // 确保部门名称不超过 30 个字符
  const deptName = deptData.deptName.length > 30 
    ? deptData.deptName.substring(0, 30) 
    : deptData.deptName;

  // 确保 leader 不超过 20 个字符
  const leader = deptData.leader 
    ? (deptData.leader.length > 20 ? deptData.leader.substring(0, 20) : deptData.leader)
    : '';

  const dept = await prisma.sysDept.create({
    data: {
      tenantId: '000000',
      deptName,
      parentId: deptData.parentId || 0,
      ancestors: deptData.parentId ? `0,${deptData.parentId}` : '0',
      orderNum: deptData.orderNum || 0,
      leader,
      phone: '',
      email: '',
      status: 'NORMAL',
      delFlag: 'NORMAL',
      createBy: 'test',
      updateBy: 'test',
    },
  });

  return dept;
}

/**
 * 创建测试角色
 */
export async function createTestRole(
  app: INestApplication,
  roleData: {
    roleName: string;
    roleKey: string;
    roleSort?: number;
    menuIds?: number[];
  },
): Promise<any> {
  const prisma = app.get(PrismaService);

  // 确保字段长度不超过数据库限制
  const roleName = roleData.roleName.length > 30 ? roleData.roleName.substring(0, 30) : roleData.roleName;
  const roleKey = roleData.roleKey.length > 100 ? roleData.roleKey.substring(0, 100) : roleData.roleKey;

  const role = await prisma.sysRole.create({
    data: {
      tenantId: '000000',
      roleName,
      roleKey,
      roleSort: roleData.roleSort || 0,
      dataScope: 'ALL' as any, // 使用 ALL 枚举值
      menuCheckStrictly: false,
      deptCheckStrictly: false,
      status: 'NORMAL',
      delFlag: 'NORMAL',
      createBy: 'test',
      updateBy: 'test',
    },
  });

  // 如果指定了菜单，创建角色菜单关联
  if (roleData.menuIds && roleData.menuIds.length > 0) {
    await prisma.sysRoleMenu.createMany({
      data: roleData.menuIds.map((menuId) => ({
        roleId: role.roleId,
        menuId,
      })),
    });
  }

  return role;
}

/**
 * 等待应用就绪
 * 用于确保应用完全启动后再执行测试
 */
export async function waitForApp(app: INestApplication, maxWaitTime: number = 5000): Promise<void> {
  const startTime = Date.now();
  const config = app.get(AppConfigService);
  const prefix = config.app.prefix;

  while (Date.now() - startTime < maxWaitTime) {
    try {
      const response = await request(app.getHttpServer()).get(`${prefix}/health`);
      if (response.status === 200) {
        return;
      }
    } catch (error) {
      // 继续等待
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  throw new Error('应用启动超时');
}
