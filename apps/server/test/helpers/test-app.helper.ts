/**
 * 测试应用辅助函数
 *
 * @description
 * 提供创建测试应用和获取认证 Token 的辅助函数
 *
 * @requirements 9.1
 */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, Type, ValidationPipe } from '@nestjs/common';
import request from 'supertest';

/**
 * 测试应用配置选项
 */
export interface TestAppOptions {
  /** 要导入的模块 */
  imports?: Type<any>[];
  /** 要覆盖的 Provider */
  providers?: Array<{
    provide: any;
    useValue?: any;
    useClass?: Type<any>;
    useFactory?: (...args: any[]) => any;
  }>;
  /** 是否启用验证管道 */
  enableValidation?: boolean;
  /** 全局前缀 */
  globalPrefix?: string;
}

/**
 * 创建测试应用
 *
 * @param AppModule 应用主模块
 * @param options 配置选项
 * @returns 测试应用实例
 *
 * @example
 * ```typescript
 * const app = await createTestApp(AppModule, {
 *   providers: [
 *     { provide: PrismaService, useValue: mockPrisma },
 *   ],
 * });
 * ```
 */
export const createTestApp = async (AppModule: Type<any>, options: TestAppOptions = {}): Promise<INestApplication> => {
  const { imports = [], providers = [], enableValidation = true, globalPrefix } = options;

  let moduleBuilder = Test.createTestingModule({
    imports: [AppModule, ...imports],
  });

  // 覆盖 Provider
  for (const provider of providers) {
    if (provider.useValue !== undefined) {
      moduleBuilder = moduleBuilder.overrideProvider(provider.provide).useValue(provider.useValue);
    } else if (provider.useClass) {
      moduleBuilder = moduleBuilder.overrideProvider(provider.provide).useClass(provider.useClass);
    } else if (provider.useFactory) {
      moduleBuilder = moduleBuilder.overrideProvider(provider.provide).useFactory({
        factory: provider.useFactory,
      });
    }
  }

  const moduleFixture: TestingModule = await moduleBuilder.compile();
  const app = moduleFixture.createNestApplication();

  // 配置全局前缀
  if (globalPrefix) {
    app.setGlobalPrefix(globalPrefix);
  }

  // 配置验证管道
  if (enableValidation) {
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
        transformOptions: {
          enableImplicitConversion: true,
        },
      }),
    );
  }

  await app.init();
  return app;
};

/**
 * 登录凭证
 */
export interface LoginCredentials {
  userName: string;
  password: string;
  tenantId?: string;
}

/**
 * 获取认证 Token
 *
 * @param app 测试应用实例
 * @param credentials 登录凭证
 * @param loginPath 登录接口路径
 * @returns JWT Token
 *
 * @example
 * ```typescript
 * const token = await getAuthToken(app, {
 *   userName: 'admin',
 *   password: 'admin123',
 * });
 * ```
 */
export const getAuthToken = async (
  app: INestApplication,
  credentials: LoginCredentials,
  loginPath = '/auth/login',
): Promise<string> => {
  const response = await request(app.getHttpServer()).post(loginPath).send(credentials).expect(200);

  const { data } = response.body;
  if (!data?.token) {
    throw new Error('登录失败：未获取到 Token');
  }

  return data.token;
};

/**
 * 获取管理员 Token
 *
 * @param app 测试应用实例
 * @returns 管理员 JWT Token
 */
export const getAdminToken = async (app: INestApplication): Promise<string> => {
  return getAuthToken(app, {
    userName: 'admin',
    password: 'admin123',
  });
};

/**
 * 获取普通用户 Token
 *
 * @param app 测试应用实例
 * @returns 普通用户 JWT Token
 */
export const getUserToken = async (app: INestApplication): Promise<string> => {
  return getAuthToken(app, {
    userName: 'user',
    password: 'user123',
  });
};

/**
 * 创建带认证的请求
 *
 * @param app 测试应用实例
 * @param token JWT Token
 * @returns supertest 请求对象
 */
export const createAuthenticatedRequest = (app: INestApplication, token: string) => {
  return {
    get: (url: string) => request(app.getHttpServer()).get(url).set('Authorization', `Bearer ${token}`),
    post: (url: string) => request(app.getHttpServer()).post(url).set('Authorization', `Bearer ${token}`),
    put: (url: string) => request(app.getHttpServer()).put(url).set('Authorization', `Bearer ${token}`),
    patch: (url: string) => request(app.getHttpServer()).patch(url).set('Authorization', `Bearer ${token}`),
    delete: (url: string) => request(app.getHttpServer()).delete(url).set('Authorization', `Bearer ${token}`),
  };
};

/**
 * 关闭测试应用
 *
 * @param app 测试应用实例
 */
export const closeTestApp = async (app: INestApplication): Promise<void> => {
  if (app) {
    await app.close();
  }
};

export default {
  createTestApp,
  getAuthToken,
  getAdminToken,
  getUserToken,
  createAuthenticatedRequest,
  closeTestApp,
};
