# Design Document: 全面测试覆盖与质量保证

## Overview

本设计文档描述了 NestJS SaaS 多租户系统的全面测试覆盖与质量保证方案。该方案旨在实现 100% 的业务模块测试覆盖率，确保零编译错误，并通过完整的接口测试验证系统功能的正确性。

### 当前状态分析

根据代码扫描结果：
- **Service 文件总数**: 34 个
- **Controller 文件总数**: 25 个
- **现有测试文件**: 20 个
- **Service 测试覆盖率**: 20.58% (7/34)
- **Controller 测试覆盖率**: 0% (0/25)

### 目标

1. **100% Service 层测试覆盖** - 新增 27 个 Service 测试
2. **100% Controller 层测试覆盖** - 新增 25 个 Controller 测试
3. **完整的 E2E 测试** - 覆盖所有 API 端点
4. **零编译错误** - 所有测试代码类型安全
5. **快速测试执行** - 单元测试 < 30 秒

### 测试策略

采用三层测试金字塔结构：
- **单元测试（70%）**: 测试单个类和方法
- **集成测试（20%）**: 测试模块间交互
- **E2E 测试（10%）**: 测试完整的 API 流程


## Architecture

### 测试架构层次

```
┌─────────────────────────────────────────────────────────┐
│                    E2E Tests (10%)                      │
│  - API 端点测试                                          │
│  - 完整请求响应流程                                       │
│  - 认证授权验证                                          │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│              Integration Tests (20%)                    │
│  - Service + Repository 集成                            │
│  - 多模块交互测试                                        │
│  - 数据库事务测试                                        │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│                Unit Tests (70%)                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │ Controller   │  │   Service    │  │  Repository  │ │
│  │   Tests      │  │    Tests     │  │    Tests     │ │
│  └──────────────┘  └──────────────┘  └──────────────┘ │
└─────────────────────────────────────────────────────────┘
```

### 测试工具栈

- **测试框架**: Jest 29.x
- **测试工具**: @nestjs/testing
- **Mock 库**: jest.fn(), jest.spyOn()
- **E2E 测试**: supertest
- **覆盖率工具**: Istanbul (Jest 内置)
- **数据库**: SQLite (测试环境)
- **属性测试**: fast-check


## Components and Interfaces

### 1. 测试工厂模块 (Test Factory Module)

#### 1.1 测试数据工厂

创建统一的测试数据生成工厂：

```typescript
// test-utils/factories/user.factory.ts
import { SysUser, Status, DelFlag } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

export class UserFactory {
  static create(overrides?: Partial<SysUser>): SysUser {
    return {
      userId: 1,
      tenantId: '000000',
      deptId: 100,
      userName: 'testuser',
      nickName: '测试用户',
      userType: '01',
      email: 'test@example.com',
      phonenumber: '13800138000',
      sex: '0',
      avatar: '',
      password: bcrypt.hashSync('password123', 10),
      status: Status.NORMAL,
      delFlag: DelFlag.NORMAL,
      loginIp: '127.0.0.1',
      loginDate: new Date(),
      createBy: 'admin',
      createTime: new Date(),
      updateBy: 'admin',
      updateTime: new Date(),
      remark: null,
      ...overrides,
    };
  }

  static createMany(count: number, overrides?: Partial<SysUser>): SysUser[] {
    return Array.from({ length: count }, (_, i) =>
      this.create({ userId: i + 1, userName: `user${i + 1}`, ...overrides })
    );
  }
}
```


#### 1.2 Mock 服务工厂

创建统一的 Mock 服务生成器：

```typescript
// test-utils/mocks/service.mock.ts
export class MockServiceFactory {
  static createPrismaService() {
    return {
      sysUser: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        count: jest.fn(),
      },
      sysDept: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      $transaction: jest.fn((fn) => {
        if (Array.isArray(fn)) return Promise.all(fn);
        return fn(this);
      }),
    };
  }

  static createRedisService() {
    return {
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
      keys: jest.fn().mockResolvedValue([]),
      getClient: jest.fn(() => ({
        get: jest.fn(),
        set: jest.fn(),
        del: jest.fn(),
      })),
    };
  }
}
```


### 2. Service 层测试模式

#### 2.1 标准 Service 测试模板

```typescript
// 示例: config.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from './config.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { RedisService } from 'src/module/common/redis/redis.service';
import { MockServiceFactory } from 'test-utils/mocks/service.mock';
import { ConfigFactory } from 'test-utils/factories/config.factory';

describe('ConfigService', () => {
  let service: ConfigService;
  let prisma: PrismaService;
  let redis: RedisService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ConfigService,
        {
          provide: PrismaService,
          useValue: MockServiceFactory.createPrismaService(),
        },
        {
          provide: RedisService,
          useValue: MockServiceFactory.createRedisService(),
        },
      ],
    }).compile();

    service = module.get<ConfigService>(ConfigService);
    prisma = module.get<PrismaService>(PrismaService);
    redis = module.get<RedisService>(RedisService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return all configs', async () => {
      const mockConfigs = ConfigFactory.createMany(3);
      (prisma.sysConfig.findMany as jest.Mock).mockResolvedValue(mockConfigs);

      const result = await service.findAll({});

      expect(result.code).toBe(200);
      expect(result.data).toHaveLength(3);
    });
  });

  // 更多测试用例...
});
```


### 3. Controller 层测试模式

#### 3.1 标准 Controller 测试模板

```typescript
// 示例: config.controller.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigController } from './config.controller';
import { ConfigService } from './config.service';

describe('ConfigController', () => {
  let controller: ConfigController;
  let service: ConfigService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ConfigController],
      providers: [
        {
          provide: ConfigService,
          useValue: {
            findAll: jest.fn(),
            findOne: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            remove: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<ConfigController>(ConfigController);
    service = module.get<ConfigService>(ConfigService);
  });

  describe('findAll', () => {
    it('should return config list', async () => {
      const mockResult = { code: 200, data: [] };
      (service.findAll as jest.Mock).mockResolvedValue(mockResult);

      const result = await controller.findAll({});

      expect(result.code).toBe(200);
      expect(service.findAll).toHaveBeenCalled();
    });
  });
});
```


### 4. E2E 测试模式

#### 4.1 E2E 测试基础设施

```typescript
// test/setup-e2e.ts
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

export async function createTestApp(): Promise<INestApplication> {
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = moduleFixture.createNestApplication();
  app.useGlobalPipes(new ValidationPipe());
  
  await app.init();
  return app;
}

export async function cleanupDatabase(app: INestApplication): Promise<void> {
  const prisma = app.get(PrismaService);
  // 清理测试数据
  await prisma.$transaction([
    prisma.sysUser.deleteMany({ where: { userType: '99' } }),
    prisma.sysDept.deleteMany({ where: { deptName: { startsWith: 'test_' } } }),
  ]);
}
```

#### 4.2 E2E 测试示例

```typescript
// test/config.e2e-spec.ts
import * as request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { createTestApp, cleanupDatabase } from './setup-e2e';

describe('ConfigController (e2e)', () => {
  let app: INestApplication;
  let authToken: string;

  beforeAll(async () => {
    app = await createTestApp();
    
    // 获取认证 token
    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ userName: 'admin', password: 'admin123' });
    
    authToken = loginResponse.body.data.token;
  });

  afterAll(async () => {
    await cleanupDatabase(app);
    await app.close();
  });

  describe('/config (GET)', () => {
    it('should return config list', () => {
      return request(app.getHttpServer())
        .get('/config')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.code).toBe(200);
          expect(Array.isArray(res.body.data)).toBe(true);
        });
    });
  });
});
```


## Data Models

### 测试数据模型

#### 测试夹具接口

```typescript
export interface TestFixture<T> {
  create(overrides?: Partial<T>): T;
  createMany(count: number, overrides?: Partial<T>): T[];
  createWithRelations(relations: Record<string, any>): T;
}
```

#### Mock 配置接口

```typescript
export interface MockConfig {
  prisma?: Partial<PrismaService>;
  redis?: Partial<RedisService>;
  jwt?: Partial<JwtService>;
  customMocks?: Record<string, any>;
}
```

### 测试覆盖率模型

```typescript
export interface CoverageReport {
  lines: {
    total: number;
    covered: number;
    percentage: number;
  };
  branches: {
    total: number;
    covered: number;
    percentage: number;
  };
  functions: {
    total: number;
    covered: number;
    percentage: number;
  };
  statements: {
    total: number;
    covered: number;
    percentage: number;
  };
}
```


## Correctness Properties

*属性（Property）是一个特征或行为，应该在系统的所有有效执行中保持为真——本质上是关于系统应该做什么的形式化陈述。属性是人类可读规范和机器可验证正确性保证之间的桥梁。*

### Property 1: 所有 Service 类都有对应的测试文件

*For any* Service 类文件（匹配 `*.service.ts` 且不是 `.spec.ts`），应该存在对应的 `.spec.ts` 测试文件。

**Validates: Requirements 1.1, 1.2**

### Property 2: 所有 Controller 类都有对应的测试文件

*For any* Controller 类文件（匹配 `*.controller.ts`），应该存在对应的 `.spec.ts` 测试文件。

**Validates: Requirements 2.1, 2.2**

### Property 3: 所有 Repository 类都有对应的测试文件

*For any* Repository 类文件（匹配 `*.repository.ts`），应该存在对应的 `.spec.ts` 测试文件。

**Validates: Requirements 3.1, 3.2**

### Property 4: Service 测试使用 Mock 隔离依赖

*For any* Service 测试文件，所有外部依赖（PrismaService, RedisService 等）应该使用 Mock 对象而非真实实例。

**Validates: Requirements 1.3**

### Property 5: Controller 测试使用 Mock Service

*For any* Controller 测试文件，所有 Service 依赖应该使用 Mock 对象。

**Validates: Requirements 2.3**

### Property 6: 测试覆盖率达到 100%

*For any* 业务模块（Service, Controller, Repository），代码覆盖率应该达到 100%（行覆盖率、分支覆盖率、函数覆盖率）。

**Validates: Requirements 1.5, 2.6, 3.6**


### Property 7: 测试验证异常处理

*For any* Service 或 Controller 方法中抛出异常的代码路径，应该有对应的测试用例验证异常类型和消息。

**Validates: Requirements 1.6**

### Property 8: Controller 测试验证请求参数

*For any* Controller 方法接受参数，应该有测试用例验证参数验证逻辑（包括必填、类型、格式等）。

**Validates: Requirements 2.4**

### Property 9: Controller 测试验证响应格式

*For any* Controller 方法，测试应该验证响应包含正确的 `code` 和 `data` 字段。

**Validates: Requirements 2.5**

### Property 10: 所有 API 端点都有 E2E 测试

*For any* Controller 中定义的 API 端点（使用 @Get, @Post, @Put, @Delete 装饰器），应该有对应的 E2E 测试用例。

**Validates: Requirements 4.1, 4.2**

### Property 11: E2E 测试验证完整流程

*For any* E2E 测试，应该包含完整的请求构造、发送、响应验证流程。

**Validates: Requirements 4.4**

### Property 12: E2E 测试验证认证授权

*For any* 需要认证的 API 端点，E2E 测试应该包含认证 token 的设置和验证。

**Validates: Requirements 4.5**

### Property 13: E2E 测试清理数据

*For any* E2E 测试文件，应该包含 `afterAll` 或 `afterEach` 钩子来清理测试数据。

**Validates: Requirements 4.6**

### Property 14: 测试代码零类型错误

*For any* 测试文件，运行 TypeScript 编译器应该返回零类型错误。

**Validates: Requirements 8.2, 8.4**

### Property 15: Mock 对象类型兼容

*For any* Mock 对象，其类型应该与被 Mock 的原始对象类型兼容（可赋值）。

**Validates: Requirements 8.5**

### Property 16: 单元测试执行时间

*For any* 单元测试套件的执行，总时间应该小于 30 秒。

**Validates: Requirements 9.1**

### Property 17: 特殊场景测试覆盖

*For any* 多租户、权限控制、并发操作等特殊场景，应该有专门的测试用例验证其正确性。

**Validates: Requirements 12.1, 12.2, 12.3**


## Error Handling

### 1. 测试失败处理

- **单元测试失败**: 提供清晰的错误消息，指出失败的断言和期望值
- **E2E 测试失败**: 记录完整的请求和响应信息，便于调试
- **超时处理**: 设置合理的超时时间，避免测试挂起

### 2. Mock 错误处理

- **Mock 未配置**: 当调用未配置的 Mock 方法时，提供清晰的错误提示
- **Mock 返回值错误**: 验证 Mock 返回值的类型和结构
- **Mock 调用验证失败**: 提供详细的调用信息（参数、次数等）

### 3. 数据清理错误处理

- **清理失败**: 记录清理失败的原因，不影响其他测试
- **数据残留**: 提供手动清理脚本
- **事务回滚**: E2E 测试使用事务确保数据隔离

### 4. 类型错误处理

- **编译错误**: 在测试运行前进行类型检查
- **类型不兼容**: 提供类型转换建议
- **泛型推导失败**: 提供显式类型注解示例


## Testing Strategy

### 单元测试

使用 Jest 进行单元测试，覆盖以下场景：

1. **Service 层测试**
   - 测试所有公共方法
   - 测试正常流程和边界条件
   - 测试错误处理逻辑
   - 使用 Mock 隔离依赖
   - 验证方法调用和参数

2. **Controller 层测试**
   - 测试所有 API 端点
   - 测试请求参数验证
   - 测试响应格式
   - 使用 Mock Service
   - 验证装饰器行为

3. **Repository 层测试**
   - 测试 CRUD 操作
   - 测试查询条件构造
   - 测试事务处理
   - 使用 Mock Prisma Client
   - 验证类型推导

### 集成测试

测试多个模块之间的交互：

1. **Service + Repository 集成**
   - 测试数据流转
   - 测试事务一致性
   - 使用真实的 Prisma Client（测试数据库）

2. **多模块交互**
   - 测试跨模块调用
   - 测试数据关联
   - 测试级联操作

### E2E 测试

测试完整的 API 请求流程：

1. **认证流程测试**
   - 登录/登出
   - Token 验证
   - 权限检查

2. **业务流程测试**
   - 用户管理流程
   - 部门管理流程
   - 角色权限流程

3. **特殊场景测试**
   - 多租户隔离
   - 并发操作
   - 文件上传


### 属性测试

使用 fast-check 进行属性测试（最少 100 次迭代）：

1. **Property 1-3: 测试文件存在性**
   - 扫描所有 Service/Controller/Repository 文件
   - 验证对应的 .spec.ts 文件存在

2. **Property 4-5: Mock 使用验证**
   - 静态分析测试文件
   - 验证使用了 Mock 对象

3. **Property 6: 覆盖率验证**
   - 解析 Jest 覆盖率报告
   - 验证所有模块达到 100%

4. **Property 14: 类型错误验证**
   - 运行 TypeScript 编译器
   - 验证零类型错误

5. **Property 16: 性能验证**
   - 测量测试执行时间
   - 验证小于 30 秒

### 测试配置

所有属性测试使用以下配置：

```typescript
import * as fc from 'fast-check';

describe('Feature: comprehensive-testing-coverage', () => {
  it('Property 1: 所有 Service 类都有对应的测试文件', () => {
    fc.assert(
      fc.property(
        fc.constant(getAllServiceFiles()),
        (serviceFiles) => {
          return serviceFiles.every(file => {
            const testFile = file.replace('.service.ts', '.service.spec.ts');
            return fs.existsSync(testFile);
          });
        }
      ),
      { numRuns: 1 } // 只需运行一次，因为是确定性检查
    );
  });
});
```

### 测试覆盖率目标

- **单元测试覆盖率**: 100%
- **集成测试覆盖率**: 关键业务流程 100%
- **E2E 测试覆盖率**: 所有 API 端点 100%
- **属性测试覆盖率**: 所有核心属性

### 测试执行顺序

1. **类型检查** (tsc --noEmit)
2. **单元测试** (jest --testPathPattern=spec.ts)
3. **集成测试** (jest --testPathPattern=integration.spec.ts)
4. **E2E 测试** (jest --testPathPattern=e2e-spec.ts)
5. **属性测试** (jest --testPathPattern=property.spec.ts)
6. **覆盖率报告生成**

