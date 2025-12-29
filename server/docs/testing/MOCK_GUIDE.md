# Mock 使用指南

本文档提供了测试中 Mock 对象的创建和使用指南，帮助开发人员正确隔离测试依赖。

## 目录

- [Mock 概述](#mock-概述)
- [Mock 服务工厂](#mock-服务工厂)
- [Prisma Mock](#prisma-mock)
- [Redis Mock](#redis-mock)
- [JWT Mock](#jwt-mock)
- [配置服务 Mock](#配置服务-mock)
- [Mock 配置技巧](#mock-配置技巧)
- [常见问题](#常见问题)

## Mock 概述

### 为什么需要 Mock？

1. **隔离依赖** - 单元测试应该只测试目标代码，不依赖外部服务
2. **提高速度** - 避免真实数据库/网络调用，加快测试执行
3. **可控性** - 可以精确控制依赖的返回值和行为
4. **可重复性** - 测试结果不受外部环境影响

### Mock 工具位置

```
server/src/test-utils/
├── mocks/
│   ├── service.mock.ts      # Mock 服务工厂
│   └── index.ts
├── prisma-mock.ts           # Prisma Mock
└── index.ts                 # 统一导出
```

### 导入方式

```typescript
import { 
  MockServiceFactory,
  createPrismaMock,
} from 'src/test-utils';
```

## Mock 服务工厂

### MockServiceFactory 类

`MockServiceFactory` 提供了创建常用服务 Mock 的静态方法：

```typescript
import { MockServiceFactory } from 'src/test-utils';

// 创建 Prisma Mock
const prisma = MockServiceFactory.createPrismaService();

// 创建 Redis Mock
const redis = MockServiceFactory.createRedisService();

// 创建 JWT Mock
const jwt = MockServiceFactory.createJwtService();

// 创建配置服务 Mock
const config = MockServiceFactory.createConfigService();
```

### 在测试中使用

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { MockServiceFactory } from 'src/test-utils';

describe('YourService', () => {
  let service: YourService;
  let prisma: jest.Mocked<PrismaService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        YourService,
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

    service = module.get<YourService>(YourService);
    prisma = module.get(PrismaService);
  });
});
```

## Prisma Mock

### 创建 Prisma Mock

```typescript
import { createPrismaMock } from 'src/test-utils/prisma-mock';

const prisma = createPrismaMock();
```

### Prisma Mock 结构

```typescript
const prisma = {
  // 系统模型
  sysUser: {
    findMany: jest.fn(),
    findFirst: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
    delete: jest.fn(),
    deleteMany: jest.fn(),
    count: jest.fn(),
    aggregate: jest.fn(),
    groupBy: jest.fn(),
    upsert: jest.fn(),
  },
  sysDept: { /* 同上 */ },
  sysRole: { /* 同上 */ },
  sysMenu: { /* 同上 */ },
  // ... 其他模型

  // 事务支持
  $transaction: jest.fn(),
  
  // 连接管理
  $connect: jest.fn(),
  $disconnect: jest.fn(),
  $executeRaw: jest.fn(),
  $queryRaw: jest.fn(),
};
```

### 配置 Mock 返回值

```typescript
// 单个记录查询
prisma.sysUser.findUnique.mockResolvedValue({
  userId: 1,
  userName: 'testuser',
  status: Status.NORMAL,
});

// 列表查询
prisma.sysUser.findMany.mockResolvedValue([
  { userId: 1, userName: 'user1' },
  { userId: 2, userName: 'user2' },
]);

// 计数查询
prisma.sysUser.count.mockResolvedValue(10);

// 创建操作
prisma.sysUser.create.mockResolvedValue({
  userId: 1,
  userName: 'newuser',
});

// 更新操作
prisma.sysUser.update.mockResolvedValue({
  userId: 1,
  userName: 'updateduser',
});

// 删除操作
prisma.sysUser.delete.mockResolvedValue({ userId: 1 });
```

### 事务 Mock

```typescript
// 数组形式的事务
prisma.$transaction.mockResolvedValue([users, total]);

// 回调形式的事务
prisma.$transaction.mockImplementation(async (callback) => {
  return callback(prisma);
});
```

### 原始查询 Mock

```typescript
// $queryRaw Mock
prisma.$queryRaw.mockResolvedValue([
  { config_value: 'test_value' },
]);

// $executeRaw Mock
prisma.$executeRaw.mockResolvedValue(1); // 返回影响的行数
```

## Redis Mock

### 创建 Redis Mock

```typescript
import { MockServiceFactory } from 'src/test-utils';

const redis = MockServiceFactory.createRedisService();
```

### Redis Mock 方法

```typescript
const redis = {
  // 字符串操作
  get: jest.fn().mockResolvedValue(null),
  set: jest.fn().mockResolvedValue('OK'),
  del: jest.fn().mockResolvedValue(0),
  keys: jest.fn().mockResolvedValue([]),
  ttl: jest.fn().mockResolvedValue(-1),
  mget: jest.fn().mockResolvedValue([]),

  // 哈希操作
  hset: jest.fn().mockResolvedValue(1),
  hget: jest.fn().mockResolvedValue(null),
  hGetAll: jest.fn().mockResolvedValue({}),
  hdel: jest.fn().mockResolvedValue(0),
  hvals: jest.fn().mockResolvedValue([]),
  hmset: jest.fn().mockResolvedValue('OK'),

  // 列表操作
  lLength: jest.fn().mockResolvedValue(0),
  lRange: jest.fn().mockResolvedValue([]),
  lLeftPush: jest.fn().mockResolvedValue(0),
  lRightPush: jest.fn().mockResolvedValue(0),
  lLeftPop: jest.fn().mockResolvedValue(null),
  lRightPop: jest.fn().mockResolvedValue(null),

  // 客户端
  getClient: jest.fn(() => mockRedisClient),
  
  // 信息
  getInfo: jest.fn().mockResolvedValue({}),
  getDbSize: jest.fn().mockResolvedValue(0),
};
```

### 配置 Redis Mock

```typescript
// 缓存命中
redis.get.mockResolvedValue(JSON.stringify({ userId: 1, userName: 'cached' }));

// 缓存未命中
redis.get.mockResolvedValue(null);

// 设置缓存
redis.set.mockResolvedValue('OK');

// 删除缓存
redis.del.mockResolvedValue(1);

// 获取所有键
redis.keys.mockResolvedValue(['key1', 'key2', 'key3']);
```

## JWT Mock

### 创建 JWT Mock

```typescript
import { MockServiceFactory } from 'src/test-utils';

const jwt = MockServiceFactory.createJwtService();
```

### JWT Mock 方法

```typescript
const jwt = {
  sign: jest.fn().mockReturnValue('mock.jwt.token'),
  signAsync: jest.fn().mockResolvedValue('mock.jwt.token'),
  verify: jest.fn().mockReturnValue({ userId: 1, userName: 'testuser' }),
  verifyAsync: jest.fn().mockResolvedValue({ userId: 1, userName: 'testuser' }),
  decode: jest.fn().mockReturnValue({ userId: 1, userName: 'testuser' }),
};
```

### 配置 JWT Mock

```typescript
// 自定义 token 内容
jwt.verify.mockReturnValue({
  userId: 1,
  userName: 'admin',
  tenantId: '000000',
  roles: ['admin'],
});

// 模拟 token 过期
jwt.verify.mockImplementation(() => {
  throw new Error('Token expired');
});

// 模拟无效 token
jwt.verify.mockImplementation(() => {
  throw new Error('Invalid token');
});
```

## 配置服务 Mock

### 创建配置服务 Mock

```typescript
import { MockServiceFactory } from 'src/test-utils';

const config = MockServiceFactory.createConfigService();
```

### 配置服务 Mock 结构

```typescript
const config = {
  all: {} as any,
  app: {
    name: 'test-app',
    port: 3000,
    env: 'test',
    globalPrefix: 'api',
    locale: 'zh-CN',
    logger: { /* ... */ },
  },
  db: {
    postgresql: { /* ... */ },
  },
  redis: {
    host: 'localhost',
    port: 6379,
  },
  jwt: {
    secret: 'test-secret',
    expiresIn: '7d',
  },
  tenant: {
    enabled: true,
    defaultTenantId: '000000',
  },
  crypto: {
    rsaPublicKey: 'test-public-key',
    rsaPrivateKey: 'test-private-key',
  },
  isProduction: false,
  isDevelopment: false,
  isTest: true,
  getValue: jest.fn((path, defaultValue) => defaultValue),
};
```

### 配置自定义值

```typescript
// 覆盖特定配置
const config = MockServiceFactory.createConfigService();
config.jwt.secret = 'custom-secret';
config.tenant.enabled = false;

// 使用 getValue Mock
config.getValue.mockImplementation((path, defaultValue) => {
  if (path === 'custom.key') return 'custom-value';
  return defaultValue;
});
```

## Mock 配置技巧

### 1. 链式调用 Mock

```typescript
// 配置链式调用
prisma.sysUser.findMany
  .mockResolvedValueOnce([user1])  // 第一次调用
  .mockResolvedValueOnce([user2])  // 第二次调用
  .mockResolvedValue([]);          // 后续调用
```

### 2. 条件返回值

```typescript
prisma.sysUser.findUnique.mockImplementation(async (args) => {
  if (args.where.userId === 1) {
    return { userId: 1, userName: 'admin' };
  }
  return null;
});
```

### 3. 模拟异常

```typescript
// 模拟数据库错误
prisma.sysUser.create.mockRejectedValue(
  new Error('Unique constraint violation'),
);

// 模拟业务异常
service.findOne.mockRejectedValue(
  new BusinessException('用户不存在'),
);
```

### 4. 验证调用

```typescript
// 验证是否被调用
expect(prisma.sysUser.findUnique).toHaveBeenCalled();

// 验证调用次数
expect(prisma.sysUser.findUnique).toHaveBeenCalledTimes(1);

// 验证调用参数
expect(prisma.sysUser.findUnique).toHaveBeenCalledWith({
  where: { userId: 1 },
});

// 验证调用顺序
expect(prisma.sysUser.findFirst).toHaveBeenCalledBefore(
  prisma.sysUser.create,
);
```

### 5. 重置 Mock

```typescript
afterEach(() => {
  jest.clearAllMocks();  // 清除调用记录
  // 或
  jest.resetAllMocks();  // 重置所有 Mock
});
```

### 6. 部分 Mock

```typescript
// 只 Mock 特定方法
const service = {
  ...realService,
  specificMethod: jest.fn(),
};
```

## 常见问题

### Q1: Mock 方法返回 undefined

**原因**: 没有配置 Mock 返回值。

**解决方案**: 使用 `mockResolvedValue` 或 `mockReturnValue`：

```typescript
// 异步方法
prisma.sysUser.findUnique.mockResolvedValue(mockUser);

// 同步方法
jwt.sign.mockReturnValue('token');
```

### Q2: Mock 类型不匹配

**原因**: TypeScript 类型检查失败。

**解决方案**: 使用类型断言或 `jest.Mocked`：

```typescript
// 方法 1: 使用 jest.Mocked
let prisma: jest.Mocked<PrismaService>;
prisma = module.get(PrismaService);

// 方法 2: 使用类型断言
(prisma.sysUser.findUnique as jest.Mock).mockResolvedValue(mockUser);
```

### Q3: 事务 Mock 不工作

**原因**: 事务回调没有正确处理。

**解决方案**: 使用 `mockImplementation`：

```typescript
prisma.$transaction.mockImplementation(async (callback) => {
  if (typeof callback === 'function') {
    return callback(prisma);
  }
  return Promise.all(callback);
});
```

### Q4: Mock 调用验证失败

**原因**: Mock 在 `beforeEach` 中被重置。

**解决方案**: 确保在正确的位置配置 Mock：

```typescript
beforeEach(async () => {
  // 创建模块
  const module = await Test.createTestingModule({...}).compile();
  
  // 获取 Mock 实例
  prisma = module.get(PrismaService);
  
  // 在这里配置 Mock（如果需要全局配置）
});

it('should work', async () => {
  // 或在测试用例中配置 Mock
  prisma.sysUser.findUnique.mockResolvedValue(mockUser);
  
  // 执行测试
  const result = await service.findOne(1);
  
  // 验证
  expect(prisma.sysUser.findUnique).toHaveBeenCalled();
});
```

### Q5: 如何 Mock 私有方法

**原因**: 私有方法不能直接 Mock。

**解决方案**: 
1. 通过公共方法间接测试
2. 使用 `jest.spyOn` 配合类型断言

```typescript
// 方法 1: 间接测试（推荐）
// 测试调用私有方法的公共方法

// 方法 2: 使用 spyOn
const spy = jest.spyOn(service as any, 'privateMethod');
spy.mockReturnValue('mocked');
```

## 相关文档

- [测试编写指南](./TESTING_GUIDE.md)
- [测试数据管理指南](./TEST_DATA_GUIDE.md)
- [测试调试指南](./DEBUGGING_GUIDE.md)
