# 测试编写指南

本文档提供了 NestJS SaaS 多租户系统的测试编写指南，包括单元测试和 E2E 测试的最佳实践。

## 目录

- [测试架构概述](#测试架构概述)
- [单元测试编写指南](#单元测试编写指南)
- [E2E 测试编写指南](#e2e-测试编写指南)
- [测试示例代码](#测试示例代码)
- [常见问题与解决方案](#常见问题与解决方案)

## 测试架构概述

### 测试金字塔

```
        ┌─────────────┐
        │   E2E 测试   │  10% - 完整 API 流程测试
        │   (10%)     │
        ├─────────────┤
        │  集成测试    │  20% - 模块间交互测试
        │   (20%)     │
        ├─────────────┤
        │  单元测试    │  70% - 单个类/方法测试
        │   (70%)     │
        └─────────────┘
```

### 测试目录结构

```
server/
├── src/
│   ├── test-utils/              # 测试工具
│   │   ├── factories/           # 测试数据工厂
│   │   │   ├── base.factory.ts
│   │   │   ├── user.factory.ts
│   │   │   ├── role.factory.ts
│   │   │   ├── dept.factory.ts
│   │   │   ├── menu.factory.ts
│   │   │   └── config.factory.ts
│   │   ├── mocks/               # Mock 服务
│   │   │   └── service.mock.ts
│   │   ├── prisma-mock.ts       # Prisma Mock
│   │   └── index.ts
│   └── module/
│       └── **/*.spec.ts         # 单元测试文件
└── test/
    ├── seeds/                   # E2E 测试种子数据
    │   ├── user.seed.ts
    │   ├── role.seed.ts
    │   └── dept.seed.ts
    ├── setup-e2e.ts             # E2E 测试配置
    └── *.e2e-spec.ts            # E2E 测试文件
```

### 测试命名规范

| 测试类型 | 文件命名 | 位置 |
|---------|---------|------|
| 单元测试 | `*.spec.ts` | 与源文件同目录 |
| E2E 测试 | `*.e2e-spec.ts` | `test/` 目录 |
| 集成测试 | `*.integration.spec.ts` | `test/` 目录 |

## 单元测试编写指南

### Service 测试模板

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { YourService } from './your.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { RedisService } from 'src/module/common/redis/redis.service';
import { createPrismaMock } from 'src/test-utils/prisma-mock';
import { MockServiceFactory } from 'src/test-utils';

describe('YourService', () => {
  let service: YourService;
  let prisma: jest.Mocked<PrismaService>;
  let redis: jest.Mocked<RedisService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        YourService,
        {
          provide: PrismaService,
          useValue: createPrismaMock(),
        },
        {
          provide: RedisService,
          useValue: MockServiceFactory.createRedisService(),
        },
      ],
    }).compile();

    service = module.get<YourService>(YourService);
    prisma = module.get(PrismaService);
    redis = module.get(RedisService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('methodName', () => {
    it('should do something successfully', async () => {
      // Arrange - 准备测试数据
      const mockData = { id: 1, name: 'test' };
      prisma.yourModel.findUnique.mockResolvedValue(mockData);

      // Act - 执行测试
      const result = await service.methodName(1);

      // Assert - 验证结果
      expect(result.code).toBe(200);
      expect(result.data).toEqual(mockData);
      expect(prisma.yourModel.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
      });
    });

    it('should throw error when not found', async () => {
      prisma.yourModel.findUnique.mockResolvedValue(null);

      await expect(service.methodName(999)).rejects.toThrow(BusinessException);
    });
  });
});
```

### Controller 测试模板

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { YourController } from './your.controller';
import { YourService } from './your.service';
import { OperlogService } from 'src/module/monitor/operlog/operlog.service';
import { Result } from 'src/common/response/result';

describe('YourController', () => {
  let controller: YourController;
  let service: jest.Mocked<YourService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [YourController],
      providers: [
        {
          provide: YourService,
          useValue: {
            findAll: jest.fn(),
            findOne: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            remove: jest.fn(),
          },
        },
        {
          provide: OperlogService,
          useValue: { create: jest.fn() },
        },
      ],
    }).compile();

    controller = module.get<YourController>(YourController);
    service = module.get(YourService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return list', async () => {
      const mockResult = Result.page([], 0);
      service.findAll.mockResolvedValue(mockResult);

      const result = await controller.findAll({} as any);

      expect(result.code).toBe(200);
      expect(service.findAll).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return single item', async () => {
      const mockResult = Result.ok({ id: 1 });
      service.findOne.mockResolvedValue(mockResult);

      const result = await controller.findOne(1);

      expect(result.code).toBe(200);
      expect(service.findOne).toHaveBeenCalledWith(1);
    });
  });
});
```

### 测试覆盖场景

每个 Service/Controller 测试应覆盖以下场景：

1. **正常流程** - 验证正常输入返回预期结果
2. **边界条件** - 空数组、空字符串、最大/最小值
3. **错误处理** - 验证异常抛出和错误消息
4. **权限验证** - 验证不同角色的访问权限
5. **数据验证** - 验证输入参数校验



## E2E 测试编写指南

### E2E 测试基础设施

E2E 测试使用真实的数据库连接，测试完整的 API 请求流程。

#### 测试配置文件

```typescript
// test/setup-e2e.ts
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { AppModule } from '../src/app.module';

export async function createTestApp(): Promise<INestApplication> {
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = moduleFixture.createNestApplication();
  app.useGlobalPipes(new ValidationPipe({
    transform: true,
    whitelist: true,
  }));
  
  await app.init();
  return app;
}
```

### E2E 测试模板

```typescript
import request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { createTestApp, cleanupDatabase, getAuthToken } from './setup-e2e';

describe('YourController (e2e)', () => {
  let app: INestApplication;
  let authToken: string;

  beforeAll(async () => {
    app = await createTestApp();
    authToken = await getAuthToken(app);
  });

  afterAll(async () => {
    await cleanupDatabase(app);
    await app.close();
  });

  describe('GET /api/your-endpoint', () => {
    it('should return list', () => {
      return request(app.getHttpServer())
        .get('/api/your-endpoint')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.code).toBe(200);
          expect(Array.isArray(res.body.data.rows)).toBe(true);
        });
    });

    it('should return 401 without token', () => {
      return request(app.getHttpServer())
        .get('/api/your-endpoint')
        .expect(401);
    });
  });

  describe('POST /api/your-endpoint', () => {
    it('should create item', () => {
      return request(app.getHttpServer())
        .post('/api/your-endpoint')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'test_item',
          // ... other fields
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.code).toBe(200);
        });
    });

    it('should validate required fields', () => {
      return request(app.getHttpServer())
        .post('/api/your-endpoint')
        .set('Authorization', `Bearer ${authToken}`)
        .send({})
        .expect(400);
    });
  });

  describe('PUT /api/your-endpoint/:id', () => {
    it('should update item', () => {
      return request(app.getHttpServer())
        .put('/api/your-endpoint/1')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'updated_name',
        })
        .expect(200);
    });
  });

  describe('DELETE /api/your-endpoint/:id', () => {
    it('should delete item', () => {
      return request(app.getHttpServer())
        .delete('/api/your-endpoint/1')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
    });
  });
});
```

### E2E 测试辅助函数

```typescript
// 获取认证 Token
export async function getAuthToken(
  app: INestApplication,
  userName: string = 'admin',
  password: string = 'admin123',
): Promise<string> {
  const response = await request(app.getHttpServer())
    .post('/api/auth/login')
    .send({
      username: userName,
      password,
      clientId: 'pc',
      grantType: 'password',
    });

  return response.body.data?.access_token;
}

// 创建测试用户
export async function createTestUser(
  app: INestApplication,
  userData: { userName: string; password: string },
): Promise<any> {
  const prisma = app.get(PrismaService);
  const bcrypt = require('bcryptjs');
  const hashedPassword = await bcrypt.hash(userData.password, 10);

  return prisma.sysUser.create({
    data: {
      tenantId: '000000',
      userName: userData.userName,
      nickName: userData.userName,
      password: hashedPassword,
      email: `${userData.userName}@test.example.com`,
      userType: 'NORMAL',
      status: 'NORMAL',
      delFlag: 'NORMAL',
      createBy: 'test',
      updateBy: 'test',
    },
  });
}

// 清理测试数据
export async function cleanupDatabase(app: INestApplication): Promise<void> {
  const prisma = app.get(PrismaService);
  
  await prisma.$transaction([
    prisma.sysUser.deleteMany({
      where: { userName: { startsWith: 'test_' } },
    }),
    prisma.sysDept.deleteMany({
      where: { deptName: { startsWith: 'test_' } },
    }),
    // ... 其他清理操作
  ]);
}
```

## 测试示例代码

### 示例 1: 用户服务测试

```typescript
// src/module/system/user/user.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from './user.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { UserFactory } from 'src/test-utils';
import { createPrismaMock } from 'src/test-utils/prisma-mock';
import { Status, DelFlag, UserType, Gender } from '@prisma/client';
import { plainToInstance } from 'class-transformer';
import { ListUserDto } from './dto/list-user.dto';

describe('UserService', () => {
  let service: UserService;
  let prisma: jest.Mocked<PrismaService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        { provide: PrismaService, useValue: createPrismaMock() },
        // ... 其他依赖
      ],
    }).compile();

    service = module.get<UserService>(UserService);
    prisma = module.get(PrismaService);
  });

  describe('findAll', () => {
    it('should return paginated user list', async () => {
      // 使用工厂创建测试数据
      const mockUsers = UserFactory.createMany(3);
      const query = plainToInstance(ListUserDto, { pageNum: 1, pageSize: 10 });

      prisma.sysUser.findMany.mockResolvedValue(mockUsers);
      prisma.sysUser.count.mockResolvedValue(3);

      const result = await service.findAll(query);

      expect(result.code).toBe(200);
      expect(result.data.rows).toHaveLength(3);
      expect(result.data.total).toBe(3);
    });

    it('should filter by status', async () => {
      const mockUsers = UserFactory.createMany(1, { status: Status.NORMAL });
      const query = plainToInstance(ListUserDto, { 
        pageNum: 1, 
        pageSize: 10,
        status: Status.NORMAL,
      });

      prisma.sysUser.findMany.mockResolvedValue(mockUsers);
      prisma.sysUser.count.mockResolvedValue(1);

      const result = await service.findAll(query);

      expect(result.code).toBe(200);
      expect(prisma.sysUser.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: Status.NORMAL,
          }),
        }),
      );
    });
  });

  describe('findOne', () => {
    it('should return user by id', async () => {
      const mockUser = UserFactory.create({ userId: 1 });
      prisma.sysUser.findUnique.mockResolvedValue(mockUser);

      const result = await service.findOne(1);

      expect(result.code).toBe(200);
      expect(result.data.userId).toBe(1);
    });

    it('should throw error when user not found', async () => {
      prisma.sysUser.findUnique.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow();
    });
  });

  describe('create', () => {
    it('should create user successfully', async () => {
      const createDto = {
        userName: 'newuser',
        nickName: '新用户',
        password: 'password123',
        email: 'new@example.com',
        deptId: 100,
      };

      prisma.sysUser.findFirst.mockResolvedValue(null); // 用户名不存在
      prisma.sysUser.create.mockResolvedValue(
        UserFactory.create({ ...createDto, userId: 1 }),
      );

      const result = await service.create(createDto as any);

      expect(result.code).toBe(200);
      expect(prisma.sysUser.create).toHaveBeenCalled();
    });

    it('should throw error when username exists', async () => {
      const createDto = { userName: 'existinguser' };
      prisma.sysUser.findFirst.mockResolvedValue(
        UserFactory.create({ userName: 'existinguser' }),
      );

      await expect(service.create(createDto as any)).rejects.toThrow();
    });
  });
});
```

### 示例 2: 认证 E2E 测试

```typescript
// test/auth.e2e-spec.ts
import request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { createTestApp, cleanupDatabase, createTestUser } from './setup-e2e';

describe('AuthController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await cleanupDatabase(app);
    await app.close();
  });

  describe('POST /api/auth/login', () => {
    it('should login successfully with valid credentials', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          username: 'admin',
          password: 'admin123',
          clientId: 'pc',
          grantType: 'password',
        })
        .expect(200);

      expect(response.body.code).toBe(200);
      expect(response.body.data).toHaveProperty('access_token');
    });

    it('should fail with invalid password', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          username: 'admin',
          password: 'wrongpassword',
          clientId: 'pc',
          grantType: 'password',
        })
        .expect(200);

      expect(response.body.code).not.toBe(200);
    });

    it('should fail with non-existent user', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          username: 'nonexistent',
          password: 'password',
          clientId: 'pc',
          grantType: 'password',
        })
        .expect(200);

      expect(response.body.code).not.toBe(200);
    });
  });

  describe('POST /api/auth/logout', () => {
    it('should logout successfully', async () => {
      // 先登录获取 token
      const loginResponse = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          username: 'admin',
          password: 'admin123',
          clientId: 'pc',
          grantType: 'password',
        });

      const token = loginResponse.body.data.access_token;

      // 然后登出
      const response = await request(app.getHttpServer())
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.code).toBe(200);
    });
  });
});
```

## 常见问题与解决方案

### Q1: 测试报错 "Cannot set property skip of #<PageQueryDto> which has only a getter"

**原因**: `skip` 和 `take` 是 getter 属性，不能直接设置。

**解决方案**: 使用 `pageNum` 和 `pageSize` 代替：

```typescript
// ✅ 正确
const query = plainToInstance(ListDto, { pageNum: 1, pageSize: 10 });

// ❌ 错误
const query = plainToInstance(ListDto, { skip: 0, take: 10 });
```

### Q2: 测试报错类型不匹配

**原因**: 使用了字符串而不是 Prisma 枚举类型。

**解决方案**: 使用 Prisma 枚举：

```typescript
import { Status, DelFlag, UserType, Gender, DataScope } from '@prisma/client';

// ✅ 正确
const user = {
  status: Status.NORMAL,
  delFlag: DelFlag.NORMAL,
  userType: UserType.NORMAL,
  sex: Gender.MALE,
};

// ❌ 错误
const user = {
  status: '0',
  delFlag: '0',
  userType: '01',
  sex: '0',
};
```

### Q3: Mock 方法未被调用

**原因**: Mock 对象没有正确注入或方法名不匹配。

**解决方案**: 检查 provider 配置和方法名：

```typescript
// 确保 provider 配置正确
{
  provide: YourService,
  useValue: {
    methodName: jest.fn(), // 方法名必须与实际方法名一致
  },
}

// 验证 Mock 被调用
expect(service.methodName).toHaveBeenCalled();
expect(service.methodName).toHaveBeenCalledWith(expectedArgs);
```

### Q4: E2E 测试数据残留

**原因**: 测试数据没有正确清理。

**解决方案**: 在 `afterAll` 或 `afterEach` 中清理数据：

```typescript
afterAll(async () => {
  await cleanupDatabase(app);
  await app.close();
});
```

### Q5: 测试超时

**原因**: 异步操作未正确处理或数据库连接问题。

**解决方案**: 
1. 增加超时时间
2. 确保所有 Promise 都被 await
3. 检查数据库连接

```typescript
// 增加超时时间
jest.setTimeout(30000);

// 确保 await 所有异步操作
it('should do something', async () => {
  await service.asyncMethod();
  // ...
});
```

## 运行测试命令

```bash
# 运行所有单元测试
npm test

# 运行测试并生成覆盖率报告
npm test -- --coverage

# 运行单个测试文件
npm test -- path/to/file.spec.ts

# 运行 E2E 测试
npm run test:e2e

# 监听模式运行测试
npm test -- --watch

# 运行特定测试套件
npm test -- --testNamePattern="UserService"
```

## 相关文档

- [Mock 使用指南](./MOCK_GUIDE.md)
- [测试数据管理指南](./TEST_DATA_GUIDE.md)
- [测试调试指南](./DEBUGGING_GUIDE.md)
