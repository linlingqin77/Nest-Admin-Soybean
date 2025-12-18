# NestJS 企业级架构优化方案

## 一、架构审查总结

经过对项目的全面审查，发现以下主要问题和优化机会：

### 1.1 原有问题清单

| 问题类别 | 具体问题 | 严重程度 |
|---------|---------|---------|
| 响应结构 | `ResultData` 缺乏泛型支持，响应码散落各处 | 🔴 高 |
| 异常处理 | 异常类型单一，缺乏细分，错误码与消息未统一管理 | 🔴 高 |
| 架构分层 | Service 层职责过重，缺乏 Repository 层抽象 | 🟡 中 |
| 事务管理 | 手动管理事务，缺乏声明式事务支持 | 🟡 中 |
| DTO 验证 | 分页 DTO 设计简陋，缺乏工具方法 | 🟡 中 |
| 目录结构 | 存在重复目录（interceptor/interceptors） | 🟢 低 |
| 测试覆盖 | 缺乏单元测试和集成测试 | 🔴 高 |

---

## 二、已完成的优化

### 2.1 统一响应结构体系

**新增文件：**
- [response/response.interface.ts](src/common/response/response.interface.ts) - 响应接口定义
- [response/result.ts](src/common/response/result.ts) - 统一响应类

**核心改进：**

```typescript
// 标准化响应码枚举
export enum ResponseCode {
  SUCCESS = 200,
  BUSINESS_ERROR = 1000,
  USER_NOT_FOUND = 3001,
  TENANT_DISABLED = 4002,
  // ... 完整错误码体系
}

// 泛型响应类
export class Result<T = any> {
  static ok<T>(data?: T, msg?: string): Result<T>;
  static fail<T>(code: ResponseCode, msg?: string): Result<T>;
  static page<T>(rows: T[], total: number): Result<IPaginatedData<T>>;
}

// 使用示例
return Result.ok(user);
return Result.fail(ResponseCode.USER_NOT_FOUND);
return Result.page(users, total, pageNum, pageSize);
```

### 2.2 完善异常处理体系

**更新文件：**
- [exceptions/business.exception.ts](src/common/exceptions/business.exception.ts)

**新增文件：**
- [filters/global-exception.filter.ts](src/common/filters/global-exception.filter.ts)

**核心改进：**

```typescript
// 细分异常类型
export class BusinessException extends HttpException { }     // 业务异常 -> 200
export class AuthenticationException extends HttpException { } // 认证异常 -> 401
export class AuthorizationException extends HttpException { }  // 授权异常 -> 403
export class ValidationException extends HttpException { }     // 验证异常 -> 400
export class NotFoundException extends HttpException { }       // 未找到 -> 404

// 便捷断言方法
BusinessException.throwIf(condition, ResponseCode.USER_NOT_FOUND);
BusinessException.throwIfNull(user, ResponseCode.USER_NOT_FOUND);
BusinessException.throwIfEmpty(users, ResponseCode.DATA_NOT_FOUND);
```

### 2.3 Repository 层抽象

**新增文件：**
- [repository/base.repository.ts](src/common/repository/base.repository.ts)

**核心特性：**

```typescript
// 基础仓储类
export abstract class BaseRepository<T, D> {
  async findById(id: number | string): Promise<T | null>;
  async findPage(options: QueryOptions): Promise<IPaginatedData<T>>;
  async create(data: any): Promise<T>;
  async update(id: number | string, data: any): Promise<T>;
  async softDelete(id: number | string): Promise<T>;
  // ...
}

// 带软删除的仓储类
export abstract class SoftDeleteRepository<T, D> extends BaseRepository<T, D> {
  // 自动添加 delFlag = '0' 过滤
}

// 使用示例
@Injectable()
export class UserRepository extends SoftDeleteRepository<SysUser, Prisma.SysUserDelegate> {
  constructor(prisma: PrismaService) {
    super(prisma, 'sysUser');
  }

  protected getPrimaryKeyName(): string {
    return 'userId';
  }
}
```

### 2.4 声明式事务管理

**新增文件：**
- [decorators/transactional.decorator.ts](src/common/decorators/transactional.decorator.ts)
- [interceptors/transactional.interceptor.ts](src/common/interceptors/transactional.interceptor.ts)

**核心特性：**

```typescript
// 声明式事务
@Transactional()
async createUserWithRoles(data: CreateUserDto) {
  const user = await this.userRepo.create(data);
  await this.roleRepo bindRoles(user.id, data.roleIds);
  return user;
}

// 指定隔离级别
@Transactional({ isolationLevel: IsolationLevel.Serializable })
async transferMoney(from: number, to: number, amount: number) {
  // 需要串行化隔离级别的操作
}
```

### 2.5 优化 DTO 验证体系

**新增文件：**
- [dto/base.dto.ts](src/common/dto/base.dto.ts)

**核心改进：**

```typescript
// 标准分页 DTO
export class PageQueryDto {
  pageNum?: number = 1;
  pageSize?: number = 10;
  orderByColumn?: string;
  isAsc?: SortOrder;
  params?: DateRangeDto;

  // 便捷方法
  get skip(): number;
  get take(): number;
  getOrderBy(defaultField?: string): Record<string, 'asc' | 'desc'>;
  getDateRange(fieldName?: string): Record<string, any>;
}

// 使用示例
export class ListUserDto extends PageQueryDto {
  @IsOptional()
  @IsString()
  userName?: string;
}

// 在 Service 中使用
async findAll(query: ListUserDto) {
  return this.prisma.sysUser.findMany({
    skip: query.skip,
    take: query.take,
    orderBy: query.getOrderBy('createTime'),
    where: {
      ...query.getDateRange('createTime'),
    },
  });
}
```

### 2.6 单元测试示例

**新增测试文件：**
- [response/result.spec.ts](src/common/response/result.spec.ts)
- [exceptions/business.exception.spec.ts](src/common/exceptions/business.exception.spec.ts)
- [filters/global-exception.filter.spec.ts](src/common/filters/global-exception.filter.spec.ts)

---

## 三、推荐的后续优化

### 3.1 Service 层拆分

**问题：** `UserService` 830 行代码，职责过重

**建议：**

```
src/module/system/user/
├── user.controller.ts
├── user.module.ts
├── user.service.ts          # 协调层，处理业务流程
├── user.repository.ts       # 数据访问层
├── user-auth.service.ts     # 认证相关逻辑
├── user-cache.service.ts    # 缓存相关逻辑
├── dto/
└── vo/
```

### 3.2 配置验证增强

**建议添加 Zod Schema 验证：**

```typescript
import { z } from 'zod';

const configSchema = z.object({
  app: z.object({
    port: z.number().int().min(1).max(65535),
    env: z.enum(['development', 'test', 'production']),
  }),
  db: z.object({
    postgresql: z.object({
      host: z.string(),
      port: z.number().int(),
      // ...
    }),
  }),
  jwt: z.object({
    secretkey: z.string().min(32, 'JWT secret must be at least 32 characters'),
  }),
});
```

### 3.3 API 版本控制

**建议：**

```typescript
// 使用 URI 版本控制
@Controller('v1/users')
export class UserV1Controller { }

@Controller('v2/users')
export class UserV2Controller { }

// 或使用 Header 版本控制
app.enableVersioning({
  type: VersioningType.HEADER,
  header: 'X-API-Version',
});
```

### 3.4 健康检查增强

**建议添加更多健康指标：**

```typescript
@Injectable()
export class DatabaseHealthIndicator extends HealthIndicator {
  async isHealthy(): Promise<HealthIndicatorResult> {
    // 检查数据库连接池状态
    // 检查慢查询
    // 检查连接数
  }
}
```

### 3.5 日志增强

**建议：**
- 添加链路追踪 ID（已有 requestId）
- 添加业务日志装饰器
- 添加审计日志

```typescript
@AuditLog({ 
  action: 'USER_CREATE',
  resource: 'USER',
  description: '创建用户'
})
async create(dto: CreateUserDto) { }
```

---

## 四、迁移指南

### 4.1 响应类迁移

**旧代码：**
```typescript
import { ResultData } from 'src/common/utils/result';
return ResultData.ok(data);
return ResultData.fail(500, '操作失败');
```

**新代码：**
```typescript
import { Result, ResponseCode } from 'src/common/response';
return Result.ok(data);
return Result.fail(ResponseCode.OPERATION_FAILED);
```

### 4.2 异常迁移

**旧代码：**
```typescript
throw new BusinessException(500, '用户不存在');
```

**新代码：**
```typescript
throw new BusinessException(ResponseCode.USER_NOT_FOUND);
// 或使用便捷方法
BusinessException.throwIfNull(user, ResponseCode.USER_NOT_FOUND, '用户不存在');
```

### 4.3 分页 DTO 迁移

**旧代码：**
```typescript
export class ListUserDto extends PagingDto { }
```

**新代码：**
```typescript
export class ListUserDto extends PageQueryDto {
  // 可直接使用 skip, take, getOrderBy() 等方法
}
```

---

## 五、目录结构（优化后）

```
server/src/
├── app.module.ts
├── main.ts
├── config/
│   └── index.ts
├── common/
│   ├── response/              # 统一响应 ✨新增
│   │   ├── index.ts
│   │   ├── response.interface.ts
│   │   └── result.ts
│   ├── exceptions/            # 异常处理 ✨优化
│   │   ├── business.exception.ts
│   │   └── business.exception.spec.ts
│   ├── filters/               # 过滤器 ✨优化
│   │   ├── global-exception.filter.ts
│   │   └── http-exceptions-filter.ts (deprecated)
│   ├── repository/            # 仓储层 ✨新增
│   │   ├── index.ts
│   │   └── base.repository.ts
│   ├── decorators/            # 装饰器
│   │   ├── transactional.decorator.ts  # ✨新增
│   │   └── ...
│   ├── interceptors/          # 拦截器 ✨统一
│   │   ├── index.ts
│   │   └── transactional.interceptor.ts
│   ├── dto/                   # DTO ✨优化
│   │   ├── base.dto.ts
│   │   └── index.ts
│   ├── guards/
│   ├── tenant/
│   ├── crypto/
│   ├── logger/
│   └── ...
├── module/
│   ├── system/
│   ├── monitor/
│   └── ...
└── prisma/
```

---

## 六、性能建议

1. **数据库连接池优化**
   ```typescript
   // prisma.service.ts
   new PrismaClient({
     datasources: {
       db: { url: connectionString }
     },
     // 添加连接池配置
   });
   ```

2. **Redis 缓存策略**
   - 使用 `@Cacheable` 装饰器统一缓存
   - 设置合理的 TTL
   - 使用 Redis Pipeline 批量操作

3. **查询优化**
   - 使用 `select` 减少字段返回
   - 合理使用索引
   - 避免 N+1 查询问题

---

## 七、安全建议

1. **敏感信息处理**
   - 配置加密存储（已支持 RSA 加密）
   - 日志脱敏（已实现）
   - 响应数据脱敏

2. **API 安全**
   - Rate Limiting（已实现）
   - CORS 配置
   - CSRF 保护（可选启用）

3. **认证安全**
   - Token 刷新机制
   - 密码强度验证（已实现）
   - 登录失败锁定

---

## 八、总结

本次优化主要围绕以下方面进行：

1. ✅ **响应结构标准化** - 统一错误码，泛型支持
2. ✅ **异常体系完善** - 细分异常类型，便捷断言方法
3. ✅ **分层架构优化** - Repository 层抽象
4. ✅ **声明式事务** - @Transactional 装饰器
5. ✅ **DTO 增强** - 分页便捷方法
6. ✅ **测试覆盖** - 单元测试示例

这些优化使项目更符合企业级标准，提高了代码的可维护性、可测试性和健壮性。
