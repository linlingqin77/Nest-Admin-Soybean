/**
 * 统一的元数据 Key 常量定义
 *
 * 所有自定义装饰器使用的 Reflector metadata key 集中管理。
 * 使用 SCREAMING_SNAKE_CASE 命名规范，值使用常量字符串。
 */
export const METADATA_KEYS = {
  /** 权限控制 - @RequirePermission */
  PERMISSION: 'PERMISSION',
  /** 角色控制 - @RequireRole */
  ROLE: 'ROLE',
  /** 操作日志 - @Operlog */
  OPERLOG: 'OPERLOG',
  /** 审计日志 - @Audit */
  AUDIT: 'AUDIT_CONFIG',
  /** 分布式锁 - @Lock */
  LOCK: 'LOCK',
  /** 幂等性 - @Idempotent */
  IDEMPOTENT: 'IDEMPOTENT',
  /** 缓存 - @Cacheable / @CacheEvict / @CachePut */
  CACHE: 'CACHE_CONFIG',
  /** 验证码 - @Captcha */
  CAPTCHA: 'CAPTCHA_CONFIG',
  /** 免认证 - @Public */
  NOT_REQUIRE_AUTH: 'NOT_REQUIRE_AUTH',
  /** 忽略租户 - @IgnoreTenant */
  IGNORE_TENANT: 'IGNORE_TENANT',
  /** 乐观锁 - @OptimisticLock */
  OPTIMISTIC_LOCK: 'OPTIMISTIC_LOCK',
  /** 数据权限 - @DataPermission */
  DATA_PERMISSION: 'DATA_PERMISSION',
  /** 熔断器 - @CircuitBreaker */
  CIRCUIT_BREAKER: 'CIRCUIT_BREAKER',
  /** 重试 - @Retry */
  RETRY: 'RETRY',
  /** 限流 - @Throttle */
  THROTTLE: 'THROTTLE',
  /** 跳过限流 - @SkipThrottle */
  SKIP_THROTTLE: 'SKIP_THROTTLE',
  /** 系统缓存 - @SystemCache */
  SYSTEM_CACHE: 'SYSTEM_CACHE',
  /** 功能特性 - @RequireFeature */
  REQUIRE_FEATURE: 'REQUIRE_FEATURE',
  /** 定时任务 - @Task */
  TASK: 'TASK',
  /** 租户任务 - @TenantJob */
  TENANT_JOB: 'TENANT_JOB',
  /** API 版本 - @ApiVersion */
  API_VERSION: 'API_VERSION',
} as const;
