# 设计文档

## 概述

本设计文档详细描述 Nest-Admin-Soybean 后端服务的企业级优化方案，目标是将其打造成达到市面上成熟 NestJS 企业级应用标准的项目。优化涵盖测试覆盖、可观测性、高可用性、安全性、多租户、API 规范、性能和代码质量等方面。

## 架构概览

### 当前架构

```
┌─────────────────────────────────────────────────────────────┐
│                      NestJS Application                      │
├─────────────────────────────────────────────────────────────┤
│  Guards: Throttle → JwtAuth → Tenant → Roles → Permission   │
├─────────────────────────────────────────────────────────────┤
│  Interceptors: Decrypt → Transactional → Logging            │
├─────────────────────────────────────────────────────────────┤
│  Modules: System | Monitor | Upload | Resource | Common     │
├─────────────────────────────────────────────────────────────┤
│  Services: User | Role | Dept | Menu | Config | Tenant      │
├─────────────────────────────────────────────────────────────┤
│  Repositories: BaseRepository → SoftDeleteRepository        │
├─────────────────────────────────────────────────────────────┤
│  Data Layer: Prisma ORM + PostgreSQL | Redis Cache          │
└─────────────────────────────────────────────────────────────┘
```

### 目标架构

```
┌─────────────────────────────────────────────────────────────┐
│                      NestJS Application                      │
├─────────────────────────────────────────────────────────────┤
│  Middleware: RequestId → Compression → Security Headers     │
├─────────────────────────────────────────────────────────────┤
│  Guards: Throttle → JwtAuth → Tenant → Roles → Permission   │
├─────────────────────────────────────────────────────────────┤
│  Interceptors: CircuitBreaker → Retry → Cache → Audit       │
├─────────────────────────────────────────────────────────────┤
│  Modules: System | Monitor | Upload | Resource | Common     │
├─────────────────────────────────────────────────────────────┤
│  Services: User | Role | Dept | Menu | Config | Tenant      │
├─────────────────────────────────────────────────────────────┤
│  Repositories: BaseRepository → SoftDeleteRepository        │
├─────────────────────────────────────────────────────────────┤
│  Cache Layer: L1 (Memory) → L2 (Redis)                      │
├─────────────────────────────────────────────────────────────┤
│  Data Layer: Prisma ORM + PostgreSQL                        │
├─────────────────────────────────────────────────────────────┤
│  Observability: Prometheus | Pino | Health Checks           │
└─────────────────────────────────────────────────────────────┘
```


## 组件与接口

### 1. 测试框架组件

#### 1.1 测试目录结构

```
server/
├── src/
│   └── module/
│       └── system/
│           └── user/
│               ├── user.service.ts
│               ├── user.service.spec.ts      # 单元测试
│               └── user.controller.spec.ts   # 集成测试
├── test/
│   ├── e2e/                                  # E2E 测试
│   │   ├── auth.e2e-spec.ts
│   │   └── user.e2e-spec.ts
│   ├── fixtures/                             # 测试数据
│   │   └── user.fixture.ts
│   └── utils/                                # 测试工具
│       ├── test-module.ts
│       └── prisma-mock.ts
```

#### 1.2 测试基础设施

```typescript
// test/utils/test-module.ts
export class TestModuleBuilder {
  static async create(metadata: ModuleMetadata): Promise<TestingModule>;
  static mockPrisma(): DeepMockProxy<PrismaClient>;
  static mockRedis(): MockRedisService;
  static mockConfig(): MockConfigService;
}
```

### 2. 可观测性组件

#### 2.1 健康检查模块

```typescript
// src/common/health/health.module.ts
@Module({
  imports: [TerminusModule],
  controllers: [HealthController],
  providers: [
    PrismaHealthIndicator,
    RedisHealthIndicator,
    DiskHealthIndicator,
    MemoryHealthIndicator,
  ],
})
export class HealthModule {}
```

#### 2.2 指标收集服务

```typescript
// src/common/metrics/metrics.service.ts
@Injectable()
export class MetricsService {
  // HTTP 请求指标
  httpRequestsTotal: Counter;
  httpRequestDuration: Histogram;
  
  // 业务指标
  loginAttemptsTotal: Counter;
  apiCallsByTenant: Counter;
  cacheHitRate: Gauge;
  
  // 系统指标
  activeConnections: Gauge;
  queueJobsTotal: Counter;
}
```

#### 2.3 请求追踪中间件

```typescript
// src/common/middleware/request-id.middleware.ts
@Injectable()
export class RequestIdMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction): void {
    const requestId = req.headers['x-request-id'] || generateUUID();
    req['requestId'] = requestId;
    res.setHeader('X-Request-Id', requestId);
    // 注入到 Pino logger context
    next();
  }
}
```


### 3. 高可用性组件

#### 3.1 熔断器服务

```typescript
// src/common/resilience/circuit-breaker.service.ts
import { CircuitBreaker, ConsecutiveBreaker, ExponentialBackoff } from 'cockatiel';

@Injectable()
export class CircuitBreakerService {
  private breakers: Map<string, CircuitBreaker> = new Map();
  
  createBreaker(name: string, options: CircuitBreakerOptions): CircuitBreaker {
    const breaker = new CircuitBreaker({
      halfOpenAfter: options.cooldownMs || 30000,
      breaker: new ConsecutiveBreaker(options.threshold || 5),
    });
    this.breakers.set(name, breaker);
    return breaker;
  }
  
  async execute<T>(name: string, fn: () => Promise<T>): Promise<T> {
    const breaker = this.breakers.get(name);
    if (!breaker) throw new Error(`Breaker ${name} not found`);
    return breaker.execute(fn);
  }
}
```

#### 3.2 重试装饰器

```typescript
// src/common/decorators/retry.decorator.ts
export function Retry(options: RetryOptions = {}): MethodDecorator {
  return (target, propertyKey, descriptor) => {
    const originalMethod = descriptor.value;
    descriptor.value = async function (...args: any[]) {
      const maxRetries = options.maxRetries || 3;
      const backoff = options.backoff || 'exponential';
      
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          return await originalMethod.apply(this, args);
        } catch (error) {
          if (attempt === maxRetries) throw error;
          await sleep(calculateBackoff(attempt, backoff));
        }
      }
    };
  };
}
```

#### 3.3 多级缓存服务

```typescript
// src/common/cache/multi-level-cache.service.ts
@Injectable()
export class MultiLevelCacheService {
  private l1Cache: NodeCache; // 本地内存缓存
  private l2Cache: RedisService; // Redis 缓存
  
  async get<T>(key: string): Promise<T | null> {
    // L1 查找
    const l1Value = this.l1Cache.get<T>(key);
    if (l1Value !== undefined) return l1Value;
    
    // L2 查找
    const l2Value = await this.l2Cache.get<T>(key);
    if (l2Value !== null) {
      // 回填 L1
      this.l1Cache.set(key, l2Value, 60); // 60s TTL
      return l2Value;
    }
    
    return null;
  }
  
  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    // 同时写入 L1 和 L2
    this.l1Cache.set(key, value, Math.min(ttl || 300, 60));
    await this.l2Cache.set(key, value, ttl || 300);
  }
}
```


### 4. 安全性组件

#### 4.1 多维度限流守卫

```typescript
// src/common/guards/multi-throttle.guard.ts
@Injectable()
export class MultiThrottleGuard implements CanActivate {
  constructor(
    private readonly redisService: RedisService,
    private readonly config: AppConfigService,
  ) {}
  
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const ip = request.ip;
    const userId = request.user?.userId;
    const tenantId = request.user?.tenantId;
    
    // IP 限流
    await this.checkLimit(`throttle:ip:${ip}`, this.config.throttle.ipLimit);
    
    // 用户限流
    if (userId) {
      await this.checkLimit(`throttle:user:${userId}`, this.config.throttle.userLimit);
    }
    
    // 租户限流
    if (tenantId) {
      await this.checkLimit(`throttle:tenant:${tenantId}`, this.config.throttle.tenantLimit);
    }
    
    return true;
  }
}
```

#### 4.2 审计日志拦截器

```typescript
// src/common/interceptors/audit.interceptor.ts
@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(
    private readonly auditService: AuditService,
    private readonly reflector: Reflector,
  ) {}
  
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const auditConfig = this.reflector.get<AuditConfig>('audit', context.getHandler());
    if (!auditConfig) return next.handle();
    
    const request = context.switchToHttp().getRequest();
    const startTime = Date.now();
    
    return next.handle().pipe(
      tap({
        next: (response) => {
          this.auditService.log({
            action: auditConfig.action,
            userId: request.user?.userId,
            tenantId: request.user?.tenantId,
            ip: request.ip,
            userAgent: request.headers['user-agent'],
            requestParams: this.maskSensitiveData(request.body),
            responseStatus: 'success',
            duration: Date.now() - startTime,
          });
        },
        error: (error) => {
          this.auditService.log({
            action: auditConfig.action,
            userId: request.user?.userId,
            tenantId: request.user?.tenantId,
            ip: request.ip,
            userAgent: request.headers['user-agent'],
            requestParams: this.maskSensitiveData(request.body),
            responseStatus: 'error',
            errorMessage: error.message,
            duration: Date.now() - startTime,
          });
        },
      }),
    );
  }
}
```

#### 4.3 数据脱敏服务

```typescript
// src/common/utils/data-masking.service.ts
@Injectable()
export class DataMaskingService {
  maskPhone(phone: string): string {
    if (!phone || phone.length < 7) return phone;
    return phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2');
  }
  
  maskEmail(email: string): string {
    if (!email || !email.includes('@')) return email;
    const [local, domain] = email.split('@');
    const maskedLocal = local.length > 2 
      ? local[0] + '**' + local.slice(-1) 
      : '**';
    return `${maskedLocal}@${domain}`;
  }
  
  maskIdCard(idCard: string): string {
    if (!idCard || idCard.length < 10) return idCard;
    return idCard.replace(/(\d{3})\d+(\d{4})/, '$1***********$2');
  }
  
  maskObject<T extends object>(obj: T, fields: string[]): T {
    const masked = { ...obj };
    for (const field of fields) {
      if (masked[field]) {
        masked[field] = this.autoMask(masked[field], field);
      }
    }
    return masked;
  }
}
```


### 5. 多租户增强组件

#### 5.1 租户功能开关服务

```typescript
// src/common/tenant/feature-toggle.service.ts
@Injectable()
export class FeatureToggleService {
  constructor(private readonly redisService: RedisService) {}
  
  async isEnabled(tenantId: string, feature: string): Promise<boolean> {
    const key = `tenant:${tenantId}:features`;
    const value = await this.redisService.hget(key, feature);
    return value === '1' || value === 'true';
  }
  
  async setFeature(tenantId: string, feature: string, enabled: boolean): Promise<void> {
    const key = `tenant:${tenantId}:features`;
    await this.redisService.hset(key, feature, enabled ? '1' : '0');
  }
  
  async getTenantFeatures(tenantId: string): Promise<Record<string, boolean>> {
    const key = `tenant:${tenantId}:features`;
    const features = await this.redisService.hgetall(key);
    return Object.fromEntries(
      Object.entries(features).map(([k, v]) => [k, v === '1' || v === 'true'])
    );
  }
}
```

#### 5.2 租户配额服务

```typescript
// src/common/tenant/quota.service.ts
@Injectable()
export class TenantQuotaService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redisService: RedisService,
  ) {}
  
  async checkQuota(tenantId: string, resource: QuotaResource): Promise<boolean> {
    const tenant = await this.getTenantWithQuota(tenantId);
    const usage = await this.getResourceUsage(tenantId, resource);
    
    switch (resource) {
      case QuotaResource.USERS:
        return tenant.accountCount === -1 || usage < tenant.accountCount;
      case QuotaResource.STORAGE:
        return usage < tenant.storageQuota;
      case QuotaResource.API_CALLS:
        return usage < (tenant.apiQuota || 10000);
      default:
        return true;
    }
  }
  
  async incrementUsage(tenantId: string, resource: QuotaResource, amount: number = 1): Promise<void> {
    const key = `tenant:${tenantId}:usage:${resource}`;
    await this.redisService.incrby(key, amount);
  }
}
```

### 6. 事务管理组件

#### 6.1 增强的事务装饰器

```typescript
// src/common/decorators/transactional.decorator.ts
export interface TransactionalOptions {
  propagation?: Propagation;
  isolationLevel?: IsolationLevel;
  timeout?: number;
  rollbackFor?: Type<Error>[];
  noRollbackFor?: Type<Error>[];
  readOnly?: boolean;
}

export enum Propagation {
  REQUIRED = 'REQUIRED',           // 默认，有事务则加入，无则创建
  REQUIRES_NEW = 'REQUIRES_NEW',   // 总是创建新事务
  SUPPORTS = 'SUPPORTS',           // 有事务则加入，无则非事务执行
  NOT_SUPPORTED = 'NOT_SUPPORTED', // 非事务执行
  NEVER = 'NEVER',                 // 必须非事务执行
  MANDATORY = 'MANDATORY',         // 必须在事务中执行
}

export enum IsolationLevel {
  READ_UNCOMMITTED = 'ReadUncommitted',
  READ_COMMITTED = 'ReadCommitted',
  REPEATABLE_READ = 'RepeatableRead',
  SERIALIZABLE = 'Serializable',
}

export function Transactional(options: TransactionalOptions = {}): MethodDecorator {
  return SetMetadata(TRANSACTIONAL_KEY, {
    propagation: options.propagation || Propagation.REQUIRED,
    isolationLevel: options.isolationLevel || IsolationLevel.READ_COMMITTED,
    timeout: options.timeout || 30000,
    rollbackFor: options.rollbackFor || [],
    noRollbackFor: options.noRollbackFor || [],
    readOnly: options.readOnly || false,
  });
}
```


## 数据模型

### 审计日志表

```prisma
model SysAuditLog {
  id          Int       @id @default(autoincrement())
  tenantId    String    @map("tenant_id") @db.VarChar(20)
  userId      Int?      @map("user_id")
  userName    String?   @map("user_name") @db.VarChar(50)
  action      String    @db.VarChar(100)
  module      String    @db.VarChar(50)
  targetType  String?   @map("target_type") @db.VarChar(50)
  targetId    String?   @map("target_id") @db.VarChar(100)
  oldValue    String?   @map("old_value") @db.Text
  newValue    String?   @map("new_value") @db.Text
  ip          String    @db.VarChar(128)
  userAgent   String?   @map("user_agent") @db.VarChar(500)
  status      String    @db.Char(1)
  errorMsg    String?   @map("error_msg") @db.VarChar(2000)
  duration    Int       @default(0)
  createTime  DateTime  @map("create_time") @default(now())
  
  @@index([tenantId, createTime])
  @@index([userId, createTime])
  @@index([action])
  @@map("sys_audit_log")
}
```

### 租户功能开关表

```prisma
model SysTenantFeature {
  id          Int       @id @default(autoincrement())
  tenantId    String    @map("tenant_id") @db.VarChar(20)
  featureKey  String    @map("feature_key") @db.VarChar(100)
  enabled     Boolean   @default(false)
  config      String?   @db.Text
  createTime  DateTime  @map("create_time") @default(now())
  updateTime  DateTime  @map("update_time") @updatedAt
  
  @@unique([tenantId, featureKey])
  @@map("sys_tenant_feature")
}
```

### 租户使用统计表

```prisma
model SysTenantUsage {
  id          Int       @id @default(autoincrement())
  tenantId    String    @map("tenant_id") @db.VarChar(20)
  date        DateTime  @db.Date
  apiCalls    Int       @default(0) @map("api_calls")
  storageUsed Int       @default(0) @map("storage_used")
  userCount   Int       @default(0) @map("user_count")
  createTime  DateTime  @map("create_time") @default(now())
  
  @@unique([tenantId, date])
  @@index([tenantId, date])
  @@map("sys_tenant_usage")
}
```

## 错误处理

### 统一异常体系

```typescript
// src/common/exceptions/index.ts
export class BusinessException extends HttpException {
  constructor(code: ResponseCode, message?: string) {
    super({ code, msg: message || getDefaultMessage(code) }, HttpStatus.OK);
  }
  
  static throwIf(condition: boolean, code: ResponseCode, message?: string): void {
    if (condition) throw new BusinessException(code, message);
  }
  
  static throwIfNull<T>(value: T | null | undefined, code: ResponseCode): asserts value is T {
    if (value === null || value === undefined) {
      throw new BusinessException(code);
    }
  }
}

export class AuthenticationException extends HttpException {
  constructor(message: string = '认证失败') {
    super({ code: ResponseCode.UNAUTHORIZED, msg: message }, HttpStatus.UNAUTHORIZED);
  }
}

export class AuthorizationException extends HttpException {
  constructor(message: string = '权限不足') {
    super({ code: ResponseCode.FORBIDDEN, msg: message }, HttpStatus.FORBIDDEN);
  }
}

export class ValidationException extends HttpException {
  constructor(errors: ValidationError[]) {
    super({
      code: ResponseCode.VALIDATION_ERROR,
      msg: '参数验证失败',
      errors: formatValidationErrors(errors),
    }, HttpStatus.BAD_REQUEST);
  }
}
```


## 正确性属性

*正确性属性是系统应该在所有有效执行中保持为真的特征或行为——本质上是关于系统应该做什么的正式声明。属性作为人类可读规范和机器可验证正确性保证之间的桥梁。*

### 属性 1：多租户数据隔离

*对于任意*租户 A 的数据操作，租户 B 不应该能够访问、修改或删除租户 A 的数据。

**验证：需求 1.7, 5.4**

### 属性 2：缓存一致性

*对于任意*数据更新操作，更新后的数据应该在缓存中被正确失效或更新，后续查询应该返回最新数据。

**验证：需求 1.9, 8.1**

### 属性 3：事务原子性

*对于任意*标记为 @Transactional 的方法，如果方法执行过程中发生异常，所有数据变更应该被回滚到方法执行前的状态。

**验证：需求 1.8, 10.4**

### 属性 4：熔断器状态转换

*对于任意*熔断器，当连续失败次数达到阈值时，熔断器应该从 CLOSED 状态转换为 OPEN 状态；在冷却时间后，应该转换为 HALF_OPEN 状态；如果 HALF_OPEN 状态下请求成功，应该转换回 CLOSED 状态。

**验证：需求 3.1, 3.2**

### 属性 5：限流正确性

*对于任意*限流配置，当请求频率超过配置的阈值时，后续请求应该被拒绝；当时间窗口过去后，请求应该被允许。

**验证：需求 4.1, 5.2**

### 属性 6：审计日志完整性

*对于任意*标记为需要审计的操作，审计日志应该包含操作者、租户、时间戳、IP、请求参数和响应状态。

**验证：需求 4.4, 4.5**

### 属性 7：数据脱敏正确性

*对于任意*包含敏感字段的日志输出，敏感数据应该被正确脱敏：手机号显示为 138****8888 格式，邮箱显示为 a**@**.com 格式。

**验证：需求 4.6**

### 属性 8：登录失败锁定

*对于任意*用户，当连续登录失败达到 5 次时，账户应该被锁定 15 分钟；锁定期间的登录尝试应该被拒绝。

**验证：需求 4.3**

### 属性 9：Token 失效

*对于任意*用户，当密码被修改后，该用户之前颁发的所有 Token 应该立即失效。

**验证：需求 4.9**

### 属性 10：租户配额限制

*对于任意*租户，当资源使用量达到配额上限时，后续的资源创建请求应该被拒绝。

**验证：需求 5.5**

### 属性 11：分页一致性

*对于任意*分页查询，返回的数据应该符合统一格式：{ rows: [], total: number, pageNum: number, pageSize: number }。

**验证：需求 6.4**

### 属性 12：错误响应格式

*对于任意* API 错误，响应应该符合统一格式：{ code: number, msg: string, data: null, requestId: string }。

**验证：需求 6.6**

### 属性 13：慢查询记录

*对于任意*数据库查询，当执行时间超过 500ms 时，应该被记录到慢查询日志中。

**验证：需求 2.10, 8.5**

### 属性 14：请求追踪

*对于任意* HTTP 请求，响应头中应该包含 X-Request-Id，且该 ID 应该在所有相关日志中出现。

**验证：需求 2.5**


## 测试策略

### 测试类型

1. **单元测试**：验证单个组件的行为
   - Service 层测试：使用 Mock 隔离依赖
   - Repository 层测试：使用 Prisma Mock
   - Guard/Interceptor/Pipe 测试：使用 ExecutionContext Mock

2. **集成测试**：验证组件间的交互
   - Controller 测试：使用 @nestjs/testing 的 Test.createTestingModule
   - API 端点测试：使用 supertest

3. **属性测试**：验证系统属性在所有输入下成立
   - 使用 fast-check 库进行属性测试
   - 每个属性测试至少运行 100 次迭代

### 测试框架配置

```typescript
// jest.config.js
module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: 'src',
  testRegex: '.*\\.spec\\.ts$',
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  collectCoverageFrom: ['**/*.(t|j)s'],
  coverageDirectory: '../coverage',
  testEnvironment: 'node',
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 100,
      lines: 100,
      statements: 100,
    },
  },
};
```

### 属性测试示例

```typescript
// src/common/tenant/tenant.extension.spec.ts
import * as fc from 'fast-check';

describe('多租户数据隔离属性测试', () => {
  // Feature: enterprise-app-optimization, Property 1: 多租户数据隔离
  it('租户 A 的数据对租户 B 不可见', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 6, maxLength: 6 }), // tenantIdA
        fc.string({ minLength: 6, maxLength: 6 }), // tenantIdB
        fc.string({ minLength: 1 }),               // userData
        async (tenantIdA, tenantIdB, userData) => {
          fc.pre(tenantIdA !== tenantIdB);
          
          // 设置租户 A 上下文，创建数据
          TenantContext.setTenantId(tenantIdA);
          const created = await userService.create({ userName: userData });
          
          // 设置租户 B 上下文，尝试查询
          TenantContext.setTenantId(tenantIdB);
          const found = await userService.findOne(created.userId);
          
          // 租户 B 不应该能看到租户 A 的数据
          expect(found).toBeNull();
        }
      ),
      { numRuns: 100 }
    );
  });
});
```

### 测试覆盖率目标

| 模块 | 目标覆盖率 | 说明 |
|------|-----------|------|
| UserService | 100% | 核心业务逻辑 |
| RoleService | 100% | 核心业务逻辑 |
| TenantService | 100% | 核心业务逻辑 |
| DeptService | 100% | 核心业务逻辑 |
| MenuService | 100% | 核心业务逻辑 |
| ConfigService | 100% | 核心业务逻辑 |
| Guards | 100% | 安全关键组件 |
| Interceptors | 100% | 横切关注点 |
| Repositories | 100% | 数据访问层 |
| Utils | 80% | 工具函数 |

## 实施计划

### 第一阶段：测试基础设施（2 周）

1. 搭建测试框架和工具
2. 编写核心 Service 单元测试
3. 编写 Guard/Interceptor 单元测试
4. 达到 100% 核心业务覆盖率

### 第二阶段：可观测性和高可用（3 周）

1. 完善健康检查端点
2. 实现 Prometheus 业务指标
3. 实现熔断器和重试机制
4. 实现多级缓存

### 第三阶段：安全性和多租户（3 周）

1. 实现多维度限流
2. 完善审计日志系统
3. 实现数据脱敏
4. 增强多租户功能

### 第四阶段：性能和代码质量（2 周）

1. 优化 N+1 查询
2. 消除 any 类型
3. 完善 JSDoc 注释
4. 代码重构和清理
