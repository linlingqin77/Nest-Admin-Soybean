import { ModuleMetadata, Type } from '@nestjs/common';
import { Test, TestingModule, TestingModuleBuilder } from '@nestjs/testing';
import { PrismaService } from 'src/prisma/prisma.service';
import { AppConfigService } from 'src/config/app-config.service';
import { RedisService } from 'src/module/common/redis/redis.service';
import { createPrismaMock, PrismaMock } from './prisma-mock';
import { createRedisMock, RedisMock } from './redis-mock';
import { createConfigMock, ConfigMock } from './config-mock';

/**
 * 测试模块构建器
 *
 * @description
 * 提供便捷的测试模块创建方法，自动注入常用的 Mock 服务
 *
 * @example
 * ```typescript
 * const { module, prisma, redis, config } = await TestModuleBuilder.create({
 *   providers: [UserService],
 * }).compile();
 *
 * const userService = module.get<UserService>(UserService);
 * prisma.sysUser.findMany.mockResolvedValue([...]);
 * ```
 */
export class TestModuleBuilder {
  private moduleBuilder: TestingModuleBuilder;
  private prismaMock: PrismaMock;
  private redisMock: RedisMock;
  private configMock: ConfigMock;

  private constructor(metadata: ModuleMetadata) {
    this.prismaMock = createPrismaMock();
    this.redisMock = createRedisMock();
    this.configMock = createConfigMock();

    this.moduleBuilder = Test.createTestingModule({
      ...metadata,
      providers: [
        ...(metadata.providers || []),
        {
          provide: PrismaService,
          useValue: this.prismaMock,
        },
        {
          provide: AppConfigService,
          useValue: this.configMock,
        },
        {
          provide: RedisService,
          useValue: this.redisMock,
        },
      ],
    });
  }

  /**
   * 创建测试模块构建器
   *
   * @param metadata 模块元数据
   * @returns TestModuleBuilder 实例
   */
  static create(metadata: ModuleMetadata): TestModuleBuilder {
    return new TestModuleBuilder(metadata);
  }

  /**
   * 覆盖提供者
   *
   * @param typeOrToken 要覆盖的类型或令牌
   * @returns 覆盖构建器
   */
  overrideProvider(typeOrToken: Type<any> | string | symbol) {
    return this.moduleBuilder.overrideProvider(typeOrToken);
  }

  /**
   * 覆盖守卫
   *
   * @param typeOrToken 要覆盖的守卫类型
   * @returns 覆盖构建器
   */
  overrideGuard(typeOrToken: Type<any>) {
    return this.moduleBuilder.overrideGuard(typeOrToken);
  }

  /**
   * 覆盖拦截器
   *
   * @param typeOrToken 要覆盖的拦截器类型
   * @returns 覆盖构建器
   */
  overrideInterceptor(typeOrToken: Type<any>) {
    return this.moduleBuilder.overrideInterceptor(typeOrToken);
  }

  /**
   * 编译测试模块
   *
   * @returns 编译后的测试模块和 Mock 对象
   */
  async compile(): Promise<TestModuleResult> {
    const module = await this.moduleBuilder.compile();

    return {
      module,
      prisma: this.prismaMock,
      redis: this.redisMock,
      config: this.configMock,
    };
  }

  /**
   * 获取 Prisma Mock 实例
   */
  get prisma(): PrismaMock {
    return this.prismaMock;
  }

  /**
   * 获取 Redis Mock 实例
   */
  get redis(): RedisMock {
    return this.redisMock;
  }

  /**
   * 获取 Config Mock 实例
   */
  get config(): ConfigMock {
    return this.configMock;
  }
}

/**
 * 测试模块编译结果
 */
export interface TestModuleResult {
  /** 编译后的测试模块 */
  module: TestingModule;
  /** Prisma Mock 实例 */
  prisma: PrismaMock;
  /** Redis Mock 实例 */
  redis: RedisMock;
  /** Config Mock 实例 */
  config: ConfigMock;
}

// 重新导出 Mock 类型和创建函数
export { createPrismaMock, PrismaMock } from './prisma-mock';
export { createRedisMock, RedisMock } from './redis-mock';
export { createConfigMock, ConfigMock } from './config-mock';
