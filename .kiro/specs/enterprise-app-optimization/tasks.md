# 实现计划：企业级应用优化

## 概述

本实现计划将 Nest-Admin-Soybean 后端服务优化为达到市面上成熟 NestJS 企业级应用标准的项目。按照测试优先、渐进式增强的原则，分阶段实施。

## 任务列表

### 第一阶段：测试基础设施

- [x] 1. 搭建测试框架和工具
  - [x] 1.1 创建测试工具模块 `server/src/test-utils/test-module.ts`
    - 实现 TestModuleBuilder 类
    - 实现 mockPrisma、mockRedis、mockConfig 方法
    - _需求: 1.10_
  - [x] 1.2 创建测试数据工厂 `server/test/fixtures/`
    - 创建 user.fixture.ts
    - 创建 role.fixture.ts
    - 创建 tenant.fixture.ts
    - _需求: 1.1_
  - [x] 1.3 配置 Jest 覆盖率阈值
    - 修改 jest.config.js 设置 100% 覆盖率目标
    - _需求: 1.1_

- [x] 2. 核心 Service 单元测试
  - [x] 2.1 编写 UserService 单元测试
    - 测试 create、findAll、findOne、update、remove 方法
    - 测试登录、注册、密码重置流程
    - _需求: 1.1_
  - [x] 2.2 编写 UserService 属性测试
    - **属性 1: 多租户数据隔离**
    - **验证: 需求 1.7**
  - [x] 2.3 编写 RoleService 单元测试
    - 测试角色 CRUD 操作
    - 测试角色权限分配
    - _需求: 1.1_
  - [x] 2.4 编写 TenantService 单元测试
    - 测试租户 CRUD 操作
    - 测试租户状态管理
    - _需求: 1.1_
  - [x] 2.5 编写 DeptService 单元测试
    - 测试部门树结构操作
    - _需求: 1.1_
  - [x] 2.6 编写 MenuService 单元测试
    - 测试菜单树结构操作
    - _需求: 1.1_
  - [x] 2.7 编写 ConfigService 单元测试
    - 测试配置 CRUD 操作
    - 测试配置缓存
    - _需求: 1.1_

- [x] 3. Guard 和 Interceptor 测试
  - [x] 3.1 编写 JwtAuthGuard 单元测试
    - 测试 Token 验证逻辑
    - 测试白名单跳过逻辑
    - _需求: 1.3_
  - [x] 3.2 编写 PermissionGuard 单元测试
    - 测试权限验证逻辑
    - _需求: 1.3_
  - [x] 3.3 编写 TenantGuard 单元测试
    - 测试租户上下文设置
    - 测试 @IgnoreTenant 装饰器
    - _需求: 1.3_
  - [x] 3.4 编写 RolesGuard 单元测试
    - 测试角色验证逻辑
    - _需求: 1.3_
  - [x] 3.5 编写 DecryptInterceptor 单元测试
    - 测试请求解密逻辑
    - _需求: 1.4_
  - [x] 3.6 编写 TransactionalInterceptor 单元测试
    - 测试事务包装逻辑
    - _需求: 1.4_
  - [x] 3.7 编写事务回滚属性测试
    - **属性 3: 事务原子性**
    - **验证: 需求 1.8, 10.4**

- [x] 4. Repository 层测试
  - [x] 4.1 编写 UserRepository 单元测试
    - 测试 CRUD 操作
    - 测试软删除逻辑
    - _需求: 1.2_
  - [x] 4.2 编写 BaseRepository 单元测试
    - 测试通用方法
    - _需求: 1.2_

- [x] 5. 检查点 - 测试覆盖率验证
  - 运行 `npm run test:cov` 验证覆盖率达到 100%
  - 确保所有测试通过，如有问题请询问用户


### 第二阶段：可观测性增强

- [x] 6. 健康检查模块
  - [x] 6.1 创建 HealthModule `server/src/common/health/health.module.ts`
    - 实现 PrismaHealthIndicator
    - 实现 RedisHealthIndicator
    - _需求: 2.1_
  - [x] 6.2 创建 HealthController
    - 实现 /health 端点
    - 实现 /health/live 端点
    - 实现 /health/ready 端点
    - _需求: 2.1_
  - [x] 6.3 创建 /info 端点
    - 返回版本、启动时间、Node.js 版本
    - _需求: 2.2_

- [x] 7. Prometheus 指标收集
  - [x] 7.1 创建 MetricsService `server/src/common/metrics/metrics.service.ts`
    - 实现 HTTP 请求计数器
    - 实现 HTTP 请求延迟直方图
    - _需求: 2.3_
  - [x] 7.2 添加业务指标
    - 实现登录次数计数器
    - 实现按租户 API 调用计数器
    - 实现缓存命中率 Gauge
    - _需求: 2.4_
  - [x] 7.3 创建 MetricsInterceptor
    - 自动收集请求指标
    - _需求: 2.3_

- [x] 8. 请求追踪
  - [x] 8.1 创建 RequestIdMiddleware `server/src/common/middleware/request-id.middleware.ts`
    - 生成或提取 Request ID
    - 设置响应头 X-Request-Id
    - _需求: 2.5_
  - [x] 8.2 集成 Request ID 到 Pino Logger
    - 修改 LoggerModule 配置
    - _需求: 2.5_
  - [x] 8.3 编写请求追踪属性测试
    - **属性 14: 请求追踪**
    - **验证: 需求 2.5**

- [x] 9. 慢查询日志
  - [x] 9.1 创建 Prisma 查询日志中间件
    - 记录超过 500ms 的查询
    - _需求: 2.10_
  - [x] 9.2 编写慢查询记录属性测试
    - **属性 13: 慢查询记录**
    - **验证: 需求 2.10, 8.5**

- [x] 10. 检查点 - 可观测性验证
  - 验证 /health 端点返回正确状态
  - 验证 /metrics 端点返回 Prometheus 格式
  - 确保所有测试通过，如有问题请询问用户

### 第三阶段：高可用性保障

- [x] 11. 熔断器实现
  - [x] 11.1 安装 cockatiel 依赖
    - `npm install cockatiel`
    - _需求: 3.1_
  - [x] 11.2 创建 CircuitBreakerService `server/src/common/resilience/circuit-breaker.service.ts`
    - 实现熔断器创建和管理
    - 支持配置失败阈值、冷却时间
    - _需求: 3.1, 3.2_
  - [x] 11.3 创建 @CircuitBreaker 装饰器
    - 简化熔断器使用
    - _需求: 3.1_
  - [x] 11.4 编写熔断器属性测试
    - **属性 4: 熔断器状态转换**
    - **验证: 需求 3.1, 3.2**

- [x] 12. 重试机制
  - [x] 12.1 创建 @Retry 装饰器 `server/src/common/decorators/retry.decorator.ts`
    - 支持配置重试次数
    - 支持指数退避策略
    - _需求: 3.3_
  - [x] 12.2 编写 Retry 装饰器单元测试
    - _需求: 3.3_

- [x] 13. 多级缓存
  - [x] 13.1 安装 node-cache 依赖
    - `npm install node-cache`
    - _需求: 8.1_
  - [x] 13.2 创建 MultiLevelCacheService `server/src/common/cache/multi-level-cache.service.ts`
    - 实现 L1 本地缓存
    - 实现 L2 Redis 缓存
    - 实现缓存回填逻辑
    - _需求: 8.1_
  - [x] 13.3 编写缓存一致性属性测试
    - **属性 2: 缓存一致性**
    - **验证: 需求 1.9, 8.1**

- [x] 14. 优雅关闭
  - [x] 14.1 配置 NestJS 优雅关闭
    - 修改 main.ts 添加 enableShutdownHooks
    - _需求: 3.8_
  - [x] 14.2 实现连接清理逻辑
    - Prisma 连接关闭
    - Redis 连接关闭
    - _需求: 3.8_

- [x] 15. 检查点 - 高可用性验证
  - ✅ 验证熔断器状态转换正确 (50 个测试通过，包含 8 个 PBT 测试)
  - ⏳ 验证重试机制工作正常 (Task 12 尚未实现)
  - ✅ 验证多级缓存一致性 (37 个测试通过，包含 7 个 PBT 测试)
  - ✅ 验证优雅关闭配置 (已配置 shutdown hooks)
  - ✅ 验证健康检查 (19 个测试通过)
  - 总计: 106 个测试全部通过，等待 Task 12 完成


### 第四阶段：安全性深化

- [x] 16. 多维度限流
  - [x] 16.1 创建 MultiThrottleGuard `server/src/common/guards/multi-throttle.guard.ts`
    - 实现 IP 限流
    - 实现用户限流
    - 实现租户限流
    - _需求: 4.1_
  - [x] 16.2 编写限流属性测试
    - **属性 5: 限流正确性**
    - **验证: 需求 4.1, 5.2**

- [x] 17. 审计日志系统
  - [x] 17.1 创建 SysAuditLog 数据模型
    - 添加 Prisma schema
    - 运行迁移
    - _需求: 4.4_
  - [x] 17.2 创建 AuditService `server/src/common/audit/audit.service.ts`
    - 实现审计日志记录
    - 实现异步写入
    - _需求: 4.4_
  - [x] 17.3 创建 AuditInterceptor `server/src/common/interceptors/audit.interceptor.ts`
    - 自动记录敏感操作
    - _需求: 4.4_
  - [x] 17.4 创建 @Audit 装饰器
    - 标记需要审计的方法
    - _需求: 4.4_
  - [x] 17.5 编写审计日志属性测试
    - **属性 6: 审计日志完整性**
    - **验证: 需求 4.4, 4.5**

- [x] 18. 数据脱敏
  - [x] 18.1 创建 DataMaskingService `server/src/common/utils/data-masking.service.ts`
    - 实现手机号脱敏
    - 实现邮箱脱敏
    - 实现身份证脱敏
    - _需求: 4.6_
  - [x] 18.2 集成到日志系统
    - 修改 Pino 配置添加脱敏
    - _需求: 4.6_
  - [x] 18.3 编写数据脱敏属性测试
    - **属性 7: 数据脱敏正确性**
    - **验证: 需求 4.6**

- [x] 19. 登录安全增强
  - [x] 19.1 实现登录失败计数
    - 使用 Redis 记录失败次数
    - _需求: 4.3_
  - [x] 19.2 实现账户锁定逻辑
    - 5 次失败后锁定 15 分钟
    - _需求: 4.3_
  - [x] 19.3 编写登录锁定属性测试
    - **属性 8: 登录失败锁定**
    - **验证: 需求 4.3**

- [x] 20. Token 管理增强
  - [x] 20.1 实现 Token 黑名单
    - 登出后 Token 立即失效
    - _需求: 4.8_
  - [x] 20.2 实现密码修改后 Token 失效
    - 修改密码后使所有 Token 失效
    - _需求: 4.9_
  - [x] 20.3 编写 Token 失效属性测试
    - **属性 9: Token 失效**
    - **验证: 需求 4.9**

- [x] 21. 检查点 - 安全性验证
  - 验证限流正确工作
  - 验证审计日志完整记录
  - 确保所有测试通过，如有问题请询问用户

### 第五阶段：多租户增强

- [x] 22. 租户功能开关
  - [x] 22.1 创建 SysTenantFeature 数据模型
    - 添加 Prisma schema
    - 运行迁移
    - _需求: 5.1_
  - [x] 22.2 创建 FeatureToggleService `server/src/common/tenant/feature-toggle.service.ts`
    - 实现功能开关查询
    - 实现功能开关设置
    - _需求: 5.1_
  - [x] 22.3 创建 @RequireFeature 装饰器
    - 检查租户功能是否启用
    - _需求: 5.1_

- [x] 23. 租户配额管理
  - [x] 23.1 创建 SysTenantUsage 数据模型
    - 添加 Prisma schema
    - 运行迁移
    - _需求: 5.5_
  - [x] 23.2 创建 TenantQuotaService `server/src/common/tenant/quota.service.ts`
    - 实现配额检查
    - 实现使用量统计
    - _需求: 5.5, 5.6_
  - [x] 23.3 编写租户配额属性测试
    - **属性 10: 租户配额限制**
    - **验证: 需求 5.5**

- [x] 24. 租户数据导出
  - [x] 24.1 创建 TenantExportService
    - 实现 JSON 导出
    - 实现 CSV 导出
    - _需求: 5.3_

- [x] 25. 检查点 - 多租户验证
  - 验证功能开关正确工作
  - 验证配额限制正确执行
  - 确保所有测试通过，如有问题请询问用户


### 第六阶段：API 规范化

- [x] 26. 统一响应格式
  - [x] 26.1 完善 Result 类
    - 确保所有响应使用统一格式
    - 添加 requestId 字段
    - _需求: 6.6_
  - [x] 26.2 编写错误响应格式属性测试
    - **属性 12: 错误响应格式**
    - **验证: 需求 6.6**

- [x] 27. 分页规范化
  - [x] 27.1 完善分页 DTO
    - 统一分页参数命名
    - _需求: 6.4_
  - [x] 27.2 实现游标分页
    - 创建 CursorPaginationDto
    - 修改 PaginationHelper 支持游标分页
    - _需求: 6.5_
  - [x] 27.3 编写分页一致性属性测试
    - **属性 11: 分页一致性**
    - **验证: 需求 6.4**

- [x] 28. API 版本控制
  - [x] 28.1 配置 API 版本控制
    - 修改 main.ts 添加版本控制
    - _需求: 6.2_

- [x] 29. 批量操作端点
  - [x] 29.1 实现批量创建端点
    - POST /users/batch
    - _需求: 6.8_
  - [x] 29.2 实现批量删除端点
    - DELETE /users/batch
    - _需求: 6.8_

- [x] 30. 检查点 - API 规范验证
  - 验证所有 API 返回统一格式
  - 验证分页格式一致
  - 确保所有测试通过，如有问题请询问用户

### 第七阶段：性能优化

- [x] 31. N+1 查询优化
  - [x] 31.1 审查现有查询
    - 识别 N+1 查询问题
    - _需求: 8.4_
  - [x] 31.2 实现 DataLoader 模式
    - 创建 UserLoader
    - 创建 DeptLoader
    - _需求: 8.4_

- [x] 32. 响应压缩
  - [x] 32.1 配置 compression 中间件
    - 安装 compression 包
    - 修改 main.ts 启用压缩
    - _需求: 8.3_

- [x] 33. 异步处理优化
  - [x] 33.1 审查 Bull Queue 使用
    - 确保耗时任务使用队列
    - _需求: 8.6_

- [x] 34. 检查点 - 性能验证
  - 验证响应压缩生效
  - 验证 N+1 查询已优化
  - 确保所有测试通过，如有问题请询问用户

### 第八阶段：代码质量

- [-] 35. 消除 any 类型
  - [x] 35.1 审查核心业务代码
    - 识别所有 any 类型
    - _需求: 9.2_
  - [x] 35.2 替换 any 为具体类型
    - 修复类型定义
    - _需求: 9.2_

- [x] 36. 完善 JSDoc 注释
  - [x] 36.1 为公共 Service 方法添加注释
    - UserService
    - RoleService
    - TenantService
    - _需求: 9.4_

- [-] 37. 代码重构
  - [x] 37.1 提取重复代码
    - 识别重复逻辑
    - 提取到工具类或基类
    - _需求: 9.7_

- [x] 38. 最终检查点
  - 运行完整测试套件
  - 验证覆盖率达到 100%
  - 验证所有属性测试通过
  - 确保所有测试通过，如有问题请询问用户

## 注意事项

- 所有任务都是必须完成的任务
- 每个检查点需要确保所有测试通过后再继续
- 属性测试使用 fast-check 库，每个属性至少运行 100 次迭代
- 所有新增代码需要遵循现有代码风格
- 测试覆盖率目标为 100%
