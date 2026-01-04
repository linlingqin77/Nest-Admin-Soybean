/**
 * 测试辅助类
 *
 * @description
 * 提供E2E测试和集成测试所需的通用工具方法
 * - 应用初始化
 * - 登录获取Token
 * - 测试数据清理
 *
 * @example
 * ```typescript
 * import { TestHelper } from 'test/helpers/test-helper';
 *
 * describe('Auth E2E', () => {
 *   let helper: TestHelper;
 *
 *   beforeAll(async () => {
 *     helper = new TestHelper();
 *     await helper.init();
 *   });
 *
 *   afterAll(async () => {
 *     await helper.cleanup();
 *     await helper.close();
 *   });
 *
 *   it('should login', async () => {
 *     const token = await helper.login();
 *     expect(token).toBeDefined();
 *   });
 * });
 * ```
 */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe, VersioningType } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from 'src/app.module';
import { PrismaService } from 'src/prisma/prisma.service';
import { ClsService } from 'nestjs-cls';
import { GlobalExceptionFilter } from 'src/common/filters/global-exception.filter';
import { ResponseInterceptor } from 'src/common/interceptors/response.interceptor';

/**
 * 测试配置接口
 */
export interface TestConfig {
  /** 管理员用户名 */
  adminUsername: string;
  /** 管理员密码 */
  adminPassword: string;
  /** 租户ID */
  tenantId: string;
  /** API前缀 */
  apiPrefix: string;
  /** 请求超时时间 */
  timeout: number;
}

/**
 * 默认测试配置
 */
export const defaultTestConfig: TestConfig = {
  adminUsername: 'admin',
  adminPassword: 'admin123',
  tenantId: '000000',
  apiPrefix: '/api/v1',
  timeout: 30000,
};

/**
 * 测试上下文接口
 */
export interface TestContext {
  /** NestJS 应用实例 */
  app: INestApplication;
  /** 认证Token */
  token: string;
  /** 创建的测试数据ID */
  createdIds: {
    users: number[];
    roles: number[];
    depts: number[];
    dictTypes: number[];
    dictData: number[];
    menus: number[];
    configs: number[];
    notices: number[];
    posts: number[];
    jobs: number[];
    tenants: number[];
    files: number[];
  };
}

/**
 * 测试辅助类
 */
export class TestHelper {
  private app: INestApplication | null = null;
  private token: string = '';
  private config: TestConfig;
  private prisma: PrismaService | null = null;
  private createdIds: TestContext['createdIds'] = {
    users: [],
    roles: [],
    depts: [],
    dictTypes: [],
    dictData: [],
    menus: [],
    configs: [],
    notices: [],
    posts: [],
    jobs: [],
    tenants: [],
    files: [],
  };

  constructor(config: Partial<TestConfig> = {}) {
    this.config = { ...defaultTestConfig, ...config };
  }

  /**
   * 初始化测试应用
   *
   * @returns NestJS 应用实例
   */
  async init(): Promise<INestApplication> {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    this.app = moduleFixture.createNestApplication();

    // 设置全局前缀
    this.app.setGlobalPrefix(this.config.apiPrefix.replace('/v1', ''));

    // 启用版本控制
    this.app.enableVersioning({
      type: VersioningType.URI,
      defaultVersion: '1',
      prefix: 'v',
    });

    // 全局验证管道
    this.app.useGlobalPipes(
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
    const clsService = this.app.get(ClsService);
    this.app.useGlobalFilters(new GlobalExceptionFilter(clsService));

    // 全局响应拦截器
    this.app.useGlobalInterceptors(new ResponseInterceptor(clsService));

    // 获取 Prisma 服务
    this.prisma = this.app.get(PrismaService);

    await this.app.init();

    return this.app;
  }

  /**
   * 关闭测试应用
   */
  async close(): Promise<void> {
    if (this.app) {
      await this.app.close();
      this.app = null;
    }
  }

  /**
   * 获取应用实例
   */
  getApp(): INestApplication {
    if (!this.app) {
      throw new Error('TestHelper not initialized. Call init() first.');
    }
    return this.app;
  }

  /**
   * 获取 Prisma 服务
   */
  getPrisma(): PrismaService {
    if (!this.prisma) {
      throw new Error('TestHelper not initialized. Call init() first.');
    }
    return this.prisma;
  }

  /**
   * 登录并获取Token
   *
   * @param username 用户名
   * @param password 密码
   * @param tenantId 租户ID
   * @returns 访问Token
   */
  async login(
    username: string = this.config.adminUsername,
    password: string = this.config.adminPassword,
    tenantId: string = this.config.tenantId,
  ): Promise<string> {
    if (!this.app) {
      throw new Error('TestHelper not initialized. Call init() first.');
    }

    const response = await request(this.app.getHttpServer())
      .post(`${this.config.apiPrefix}/auth/login`)
      .set('tenant-id', tenantId)
      .send({
        username,
        password,
      })
      .expect(200);

    if (response.body.code === 200 && response.body.data?.access_token) {
      this.token = response.body.data.access_token;
      return this.token;
    }

    throw new Error(`Login failed: ${response.body.msg || 'Unknown error'}`);
  }

  /**
   * 获取当前Token
   */
  getToken(): string {
    return this.token;
  }

  /**
   * 设置Token
   */
  setToken(token: string): void {
    this.token = token;
  }

  /**
   * 获取已认证的请求对象
   *
   * @returns Supertest 请求对象
   */
  getAuthRequest(): request.SuperTest<request.Test> {
    if (!this.app) {
      throw new Error('TestHelper not initialized. Call init() first.');
    }
    return request(this.app.getHttpServer());
  }

  /**
   * 获取未认证的请求对象
   *
   * @returns Supertest 请求对象
   */
  getRequest(): request.SuperTest<request.Test> {
    if (!this.app) {
      throw new Error('TestHelper not initialized. Call init() first.');
    }
    return request(this.app.getHttpServer());
  }

  /**
   * 发送已认证的GET请求
   *
   * @param url 请求URL
   * @returns 请求对象
   */
  authGet(url: string): request.Test {
    return this.getAuthRequest()
      .get(url)
      .set('Authorization', `Bearer ${this.token}`)
      .set('tenant-id', this.config.tenantId);
  }

  /**
   * 发送已认证的POST请求
   *
   * @param url 请求URL
   * @returns 请求对象
   */
  authPost(url: string): request.Test {
    return this.getAuthRequest()
      .post(url)
      .set('Authorization', `Bearer ${this.token}`)
      .set('tenant-id', this.config.tenantId);
  }

  /**
   * 发送已认证的PUT请求
   *
   * @param url 请求URL
   * @returns 请求对象
   */
  authPut(url: string): request.Test {
    return this.getAuthRequest()
      .put(url)
      .set('Authorization', `Bearer ${this.token}`)
      .set('tenant-id', this.config.tenantId);
  }

  /**
   * 发送已认证的DELETE请求
   *
   * @param url 请求URL
   * @returns 请求对象
   */
  authDelete(url: string): request.Test {
    return this.getAuthRequest()
      .delete(url)
      .set('Authorization', `Bearer ${this.token}`)
      .set('tenant-id', this.config.tenantId);
  }

  /**
   * 记录创建的测试数据ID
   *
   * @param type 数据类型
   * @param id 数据ID
   */
  trackCreatedId(type: keyof TestContext['createdIds'], id: number): void {
    this.createdIds[type].push(id);
  }

  /**
   * 获取创建的测试数据ID
   */
  getCreatedIds(): TestContext['createdIds'] {
    return this.createdIds;
  }

  /**
   * 清理测试数据
   *
   * @description
   * 按照依赖关系的逆序删除测试数据
   */
  async cleanup(): Promise<void> {
    if (!this.prisma) {
      return;
    }

    try {
      // 按依赖关系逆序删除
      // 1. 删除文件
      if (this.createdIds.files.length > 0) {
        await this.prisma.sysUpload.deleteMany({
          where: { uploadId: { in: this.createdIds.files.map(String) } },
        });
      }

      // 2. 删除任务
      if (this.createdIds.jobs.length > 0) {
        await this.prisma.sysJob.deleteMany({
          where: { jobId: { in: this.createdIds.jobs } },
        });
      }

      // 3. 删除公告
      if (this.createdIds.notices.length > 0) {
        await this.prisma.sysNotice.deleteMany({
          where: { noticeId: { in: this.createdIds.notices } },
        });
      }

      // 4. 删除配置
      if (this.createdIds.configs.length > 0) {
        await this.prisma.sysConfig.deleteMany({
          where: { configId: { in: this.createdIds.configs } },
        });
      }

      // 5. 删除字典数据
      if (this.createdIds.dictData.length > 0) {
        await this.prisma.sysDictData.deleteMany({
          where: { dictCode: { in: this.createdIds.dictData } },
        });
      }

      // 6. 删除字典类型
      if (this.createdIds.dictTypes.length > 0) {
        await this.prisma.sysDictType.deleteMany({
          where: { dictId: { in: this.createdIds.dictTypes } },
        });
      }

      // 7. 删除用户角色关联
      if (this.createdIds.users.length > 0) {
        await this.prisma.sysUserRole.deleteMany({
          where: { userId: { in: this.createdIds.users } },
        });
      }

      // 8. 删除用户岗位关联
      if (this.createdIds.users.length > 0) {
        await this.prisma.sysUserPost.deleteMany({
          where: { userId: { in: this.createdIds.users } },
        });
      }

      // 9. 删除用户
      if (this.createdIds.users.length > 0) {
        await this.prisma.sysUser.deleteMany({
          where: { userId: { in: this.createdIds.users } },
        });
      }

      // 10. 删除角色菜单关联
      if (this.createdIds.roles.length > 0) {
        await this.prisma.sysRoleMenu.deleteMany({
          where: { roleId: { in: this.createdIds.roles } },
        });
      }

      // 11. 删除角色部门关联
      if (this.createdIds.roles.length > 0) {
        await this.prisma.sysRoleDept.deleteMany({
          where: { roleId: { in: this.createdIds.roles } },
        });
      }

      // 12. 删除角色
      if (this.createdIds.roles.length > 0) {
        await this.prisma.sysRole.deleteMany({
          where: { roleId: { in: this.createdIds.roles } },
        });
      }

      // 13. 删除菜单
      if (this.createdIds.menus.length > 0) {
        await this.prisma.sysMenu.deleteMany({
          where: { menuId: { in: this.createdIds.menus } },
        });
      }

      // 14. 删除岗位
      if (this.createdIds.posts.length > 0) {
        await this.prisma.sysPost.deleteMany({
          where: { postId: { in: this.createdIds.posts } },
        });
      }

      // 15. 删除部门
      if (this.createdIds.depts.length > 0) {
        await this.prisma.sysDept.deleteMany({
          where: { deptId: { in: this.createdIds.depts } },
        });
      }

      // 16. 删除租户
      if (this.createdIds.tenants.length > 0) {
        await this.prisma.sysTenant.deleteMany({
          where: { id: { in: this.createdIds.tenants } },
        });
      }

      // 重置ID追踪
      this.createdIds = {
        users: [],
        roles: [],
        depts: [],
        dictTypes: [],
        dictData: [],
        menus: [],
        configs: [],
        notices: [],
        posts: [],
        jobs: [],
        tenants: [],
        files: [],
      };
    } catch (error) {
      console.error('Cleanup error:', error);
    }
  }

  /**
   * 获取测试配置
   */
  getConfig(): TestConfig {
    return this.config;
  }

  /**
   * 获取API前缀
   */
  getApiPrefix(): string {
    return this.config.apiPrefix;
  }
}

/**
 * 创建测试辅助实例
 *
 * @param config 测试配置
 * @returns TestHelper 实例
 */
export function createTestHelper(config: Partial<TestConfig> = {}): TestHelper {
  return new TestHelper(config);
}

export default TestHelper;
