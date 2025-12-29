# 测试指南

本文档描述了项目的测试架构、运行方式和最佳实践。

## 测试统计

| 指标 | 数值 |
|------|------|
| 测试套件 | 72 个 |
| 测试用例 | 825 个 |
| 语句覆盖率 | 62.71% |
| 分支覆盖率 | 40.59% |
| 函数覆盖率 | 55.11% |
| 行覆盖率 | 62.81% |

## 运行测试

```bash
# 运行所有测试
npm test

# 运行测试并生成覆盖率报告
npm test -- --coverage

# 运行单个测试文件
npm test -- path/to/file.spec.ts

# 监听模式运行测试
npm test -- --watch
```

## 测试目录结构

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

## 测试类型

### 单元测试

单元测试位于 `src/module/**/*.spec.ts`，测试单个服务或控制器的功能。

```typescript
// 示例：user.service.spec.ts
describe('UserService', () => {
  let service: UserService;
  let prisma: jest.Mocked<PrismaService>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        UserService,
        { provide: PrismaService, useValue: createPrismaMock() },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
    prisma = module.get(PrismaService);
  });

  it('should find user by id', async () => {
    const mockUser = { userId: 1, userName: 'test' };
    prisma.sysUser.findUnique.mockResolvedValue(mockUser);

    const result = await service.findOne(1);

    expect(result.code).toBe(200);
    expect(result.data.userId).toBe(1);
  });
});
```

### E2E 测试

E2E 测试位于 `test/*.e2e-spec.ts`，测试完整的 API 请求流程。

```typescript
// 示例：auth.e2e-spec.ts
describe('AuthController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('/auth/login (POST)', () => {
    return request(app.getHttpServer())
      .post('/auth/login')
      .send({ userName: 'admin', password: 'admin123' })
      .expect(200);
  });
});
```

## 测试工具

### 测试数据工厂

使用工厂类创建测试数据：

```typescript
import { UserFactory, RoleFactory } from 'src/test-utils/factories';

// 创建单个用户
const user = UserFactory.create({ userName: 'testuser' });

// 创建管理员用户
const admin = UserFactory.createAdmin();

// 批量创建用户
const users = UserFactory.createMany(5);

// 创建角色
const role = RoleFactory.createAdminRole();
```

### Prisma Mock

使用 `createPrismaMock()` 创建 Prisma 服务的 Mock：

```typescript
import { createPrismaMock } from 'src/test-utils/prisma-mock';

const prisma = createPrismaMock();

// 设置 Mock 返回值
prisma.sysUser.findUnique.mockResolvedValue(mockUser);
prisma.$transaction.mockResolvedValue([users, total]);
```

## 最佳实践

### 1. 使用 Prisma 枚举类型

```typescript
// ✅ 正确
import { Status, DelFlag, UserType, Gender } from '@prisma/client';

const user = {
  status: Status.NORMAL,
  delFlag: DelFlag.NORMAL,
  userType: UserType.NORMAL,
  sex: Gender.MALE,
};

// ❌ 错误 - 不要使用字符串
const user = {
  status: '0',
  delFlag: '0',
  userType: '01',
  sex: '0',
};
```

### 2. 使用 Result 对象

```typescript
// ✅ 正确
return Result.ok(data);
return Result.page(rows, total);
return Result.fail(ResponseCode.BUSINESS_ERROR, '错误信息');

// ❌ 错误 - 不要手动构造
return { code: 200, data };
```

### 3. 使用 plainToInstance 实例化 DTO

```typescript
// ✅ 正确
const query = plainToInstance(ListUserDto, { pageNum: 1, pageSize: 10 });

// ❌ 错误 - 不要直接使用对象
const query = { pageNum: 1, pageSize: 10 };
```

### 4. Mock 依赖服务

```typescript
// Controller 测试需要 Mock OperlogService
providers: [
  { provide: OperlogService, useValue: { create: jest.fn() } },
];

// Service 测试需要 Mock ConfigService
providers: [
  { 
    provide: ConfigService, 
    useValue: { 
      getConfigValue: jest.fn().mockResolvedValue('false'),
      getSystemConfigValue: jest.fn().mockResolvedValue('false'),
    } 
  },
];
```

### 5. 测试异常情况

```typescript
it('should throw error for non-existent user', async () => {
  prisma.sysUser.findUnique.mockResolvedValue(null);

  await expect(service.findOne(999)).rejects.toThrow(BusinessException);
});
```

## 常见问题

### Q: 测试报错 "Cannot set property skip of #<PageQueryDto> which has only a getter"

A: `skip` 和 `take` 是 getter 属性，使用 `pageNum` 和 `pageSize` 代替：

```typescript
// ✅ 正确
const query = plainToInstance(ListDto, { pageNum: 1, pageSize: 10 });

// ❌ 错误
const query = plainToInstance(ListDto, { skip: 0, take: 10 });
```

### Q: 测试报错 "configService is not available"

A: 需要在 providers 中添加 ConfigService Mock：

```typescript
providers: [
  {
    provide: ConfigService,
    useValue: {
      getConfigValue: jest.fn().mockResolvedValue('false'),
      getSystemConfigValue: jest.fn().mockResolvedValue('false'),
    },
  },
];
```

### Q: 测试报错类型不匹配

A: 确保使用 Prisma 枚举类型而不是字符串：

```typescript
import { Status, UserType, Gender, DataScope } from '@prisma/client';
```
