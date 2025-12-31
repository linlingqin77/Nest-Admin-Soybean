# 需求文档

## 简介

本文档对 Nest-Admin-Soybean 后端服务（Server）进行全面分析，目标是将其打造成达到市面上成熟 NestJS 企业级应用标准的项目。参考 NestJS 官方最佳实践、社区成熟项目（如 NestJS Boilerplate、Awesome NestJS 推荐项目）以及生产环境实战经验。

## 术语表

- **Multi_Tenant_System（多租户系统）**: 支持多个租户共享同一应用实例，数据相互隔离
- **RBAC（基于角色的访问控制）**: Role-Based Access Control，通过角色分配权限
- **CQRS（命令查询职责分离）**: Command Query Responsibility Segregation
- **Event_Sourcing（事件溯源）**: 通过事件记录状态变化
- **Circuit_Breaker（熔断器）**: 防止级联故障的设计模式
- **Rate_Limiter（限流器）**: 控制请求频率的组件
- **Audit_Log（审计日志）**: 记录关键操作的日志系统
- **Data_Masking（数据脱敏）**: 保护敏感信息的技术手段
- **Repository_Pattern（仓储模式）**: 数据访问层抽象模式
- **Guard（守卫）**: NestJS 权限验证组件
- **Interceptor（拦截器）**: NestJS 请求/响应处理组件
- **Pipe（管道）**: NestJS 数据转换和验证组件
- **Decorator（装饰器）**: NestJS 元数据注解

## NestJS 企业级应用标准对照

### 成熟 NestJS 企业级项目特性对照

| 企业级特性 | 当前实现 | 状态 | 说明 |
|-----------|---------|------|------|
| 模块化架构 | ✅ 7 个核心模块 | ✅ 完善 | System/Monitor/Upload/Resource/Common/Main/Backup |
| 依赖注入 | ✅ NestJS IoC | ✅ 完善 | 标准 NestJS DI 容器 |
| 配置管理 | ✅ @nestjs/config | ✅ 完善 | 强类型配置 + 环境分离 |
| 数据库 ORM | ✅ Prisma | ✅ 完善 | 类型安全 + 迁移管理 |
| 认证授权 | ✅ JWT + Passport | ✅ 完善 | Guard 链式验证 |
| 缓存 | ✅ Redis + 装饰器 | ✅ 完善 | @Cacheable/@CacheEvict |
| 日志 | ✅ Pino | ✅ 完善 | 结构化日志 + 轮转 |
| API 文档 | ✅ Swagger | ✅ 完善 | OpenAPI 3.0 |
| 限流 | ✅ @nestjs/throttler | ✅ 完善 | 全局 + 自定义限流 |
| 队列 | ✅ Bull | ✅ 完善 | 异步任务处理 |
| 健康检查 | ✅ @nestjs/terminus | ✅ 完善 | DB/Redis/Disk/Memory |
| 监控指标 | ⚠️ Prometheus 基础 | ⚠️ 需增强 | 缺少业务指标 |
| 测试覆盖 | ❌ 仅基础框架 | ❌ 需补充 | 缺少业务测试 |
| 熔断降级 | ❌ 未实现 | ❌ 需实现 | 缺少容错机制 |
| 分布式追踪 | ❌ 未实现 | ❌ 需实现 | 缺少 Trace ID |
| 事件驱动 | ⚠️ 部分实现 | ⚠️ 需增强 | 缺少领域事件 |

## 需求列表

### 需求 1：测试覆盖率提升（NestJS 测试最佳实践）

**用户故事：** 作为开发团队，我希望有完善的自动化测试体系，达到 NestJS 企业级项目的测试标准。

#### 验收标准

1. THE Test_Suite SHALL 核心业务 Service（UserService、RoleService、TenantService、DeptService、MenuService、ConfigService）的代码覆盖率达到 100%
2. THE Test_Suite SHALL 为 Repository 层提供 100% 覆盖率的单元测试
3. THE Test_Suite SHALL 为所有 Guard（JwtAuthGuard、PermissionGuard、TenantGuard、RolesGuard、ThrottlerGuard）提供完整测试
4. THE Test_Suite SHALL 为所有 Interceptor（DecryptInterceptor、TransactionalInterceptor、LoggingInterceptor）提供完整测试
5. THE Test_Suite SHALL 为所有 Pipe（ValidationPipe、ParseIntPipe 等自定义管道）提供完整测试
6. THE Test_Suite SHALL 包含 Controller 层的集成测试，使用 @nestjs/testing 的 Test.createTestingModule
7. THE Test_Suite SHALL 测试多租户隔离的正确性，确保 Prisma Extension 正确注入租户过滤
8. THE Test_Suite SHALL 为事务回滚场景提供完整测试
9. THE Test_Suite SHALL 为缓存命中/失效场景提供完整测试
10. THE Test_Suite SHALL 使用 Jest 的 Mock 功能隔离外部依赖

### 需求 2：可观测性增强（NestJS 监控最佳实践）

**用户故事：** 作为运维团队，我希望有完善的监控和告警体系，达到 NestJS 企业级项目的可观测性标准。

#### 验收标准

1. THE Monitoring_System SHALL 使用 @nestjs/terminus 暴露完整的健康检查端点（/health、/health/live、/health/ready）
2. THE Monitoring_System SHALL 暴露应用信息端点（/info），包含版本、启动时间、Node.js 版本、内存使用
3. THE Monitoring_System SHALL 使用 prom-client 收集 HTTP 请求指标（请求数、延迟直方图、状态码分布）
4. THE Monitoring_System SHALL 收集业务指标（登录次数、API 调用量按租户、缓存命中率）
5. THE Logging_System SHALL 使用 nestjs-pino 实现带有 Request ID 的结构化日志
6. THE Logging_System SHALL 支持日志级别动态调整（不重启应用）
7. WHEN 请求耗时超过 3 秒 THEN THE Monitoring_System SHALL 记录慢请求详情
8. THE Monitoring_System SHALL 暴露 Prisma 连接池状态（活跃连接、空闲连接）
9. THE Monitoring_System SHALL 暴露 Redis 连接状态和命令延迟
10. THE Logging_System SHALL 自动记录所有数据库慢查询（超过 500ms）

### 需求 3：高可用性保障（NestJS 弹性模式）

**用户故事：** 作为系统架构师，我希望有高可用架构设计，达到 NestJS 企业级项目的弹性标准。

#### 验收标准

1. THE System SHALL 使用 cockatiel 或 opossum 实现熔断器模式
2. THE Circuit_Breaker SHALL 支持配置：失败阈值（默认 5 次）、冷却时间（默认 30 秒）、半开状态请求数
3. THE System SHALL 实现重试机制，支持指数退避策略
4. THE System SHALL 实现超时控制，所有外部调用默认 10 秒超时
5. THE Cache_Layer SHALL 实现缓存穿透保护（布隆过滤器或空值缓存）
6. THE Cache_Layer SHALL 实现缓存雪崩保护（随机过期时间）
7. IF Redis 连接失败 THEN THE System SHALL 降级到本地内存缓存
8. THE System SHALL 使用 @nestjs/terminus 实现优雅关闭，等待进行中请求完成
9. THE Database_Layer SHALL 支持连接重试（最多 3 次，间隔 1 秒）
10. THE System SHALL 支持配置热更新（通过 Redis Pub/Sub 或轮询）

### 需求 4：安全性深化（NestJS 安全最佳实践）

**用户故事：** 作为安全工程师，我希望有完善的安全防护措施，达到 NestJS 企业级项目的安全标准。

#### 验收标准

1. THE Security_System SHALL 使用 @nestjs/throttler 实现多维度限流（全局、IP、用户、租户）
2. THE Security_System SHALL 实现 IP 黑名单功能，支持动态添加/移除
3. WHEN 登录失败 5 次 THEN THE System SHALL 锁定账户 15 分钟并发送告警
4. THE Audit_System SHALL 使用 Interceptor 自动记录所有敏感操作（创建、更新、删除）
5. THE Audit_Log SHALL 包含：操作者、租户、时间戳、IP、User-Agent、请求参数、响应状态
6. THE Data_Masking_System SHALL 在日志中脱敏：手机号（138****8888）、邮箱（a**@**.com）、身份证（110***********1234）
7. THE Password_Policy SHALL 使用 bcrypt（cost factor 12）加密密码
8. THE Session_Management SHALL 支持 Token 黑名单（登出后 Token 立即失效）
9. WHEN 用户密码被修改 THEN THE System SHALL 使该用户所有 Token 失效
10. THE Security_System SHALL 使用 helmet 设置安全响应头

### 需求 5：多租户能力增强（SaaS 平台标准）

**用户故事：** 作为产品经理，我希望有更灵活的多租户管理能力，达到 SaaS 平台标准。

#### 验收标准

1. THE Tenant_System SHALL 支持租户级别功能开关（使用 Redis Hash 存储）
2. THE Tenant_System SHALL 实现租户级别限流（独立于全局限流）
3. THE Tenant_System SHALL 支持租户数据导出（JSON/CSV/Excel）
4. WHEN 租户状态变为禁用 THEN THE System SHALL 立即拒绝该租户所有请求
5. THE Tenant_System SHALL 支持租户配额：用户数上限、存储空间上限、API 日调用量上限
6. THE Tenant_System SHALL 记录租户资源使用统计（API 调用、存储、用户数）
7. THE Tenant_System SHALL 支持租户数据彻底删除（硬删除 + 审计记录）
8. THE Tenant_System SHALL 支持租户自定义配置（覆盖系统默认配置）

### 需求 6：API 设计规范化（NestJS REST 最佳实践）

**用户故事：** 作为 API 使用者，我希望有规范且一致的 API 设计，达到 NestJS REST 最佳实践标准。

#### 验收标准

1. THE API_System SHALL 遵循 RESTful 规范：GET（查询）、POST（创建）、PUT（全量更新）、PATCH（部分更新）、DELETE（删除）
2. THE API_System SHALL 实现 API 版本控制，通过 URL 路径（/api/v1）或请求头
3. THE API_Documentation SHALL 使用 @nestjs/swagger 装饰器生成完整文档，包含请求/响应示例
4. THE API_System SHALL 实现统一分页格式：{ rows: [], total: number, pageNum: number, pageSize: number }
5. THE API_System SHALL 支持游标分页（cursor-based）用于大数据集
6. THE API_System SHALL 返回统一错误格式：{ code: number, msg: string, data: null, requestId: string, timestamp: string }
7. THE API_System SHALL 使用 class-validator 进行请求验证，返回详细字段错误
8. THE API_System SHALL 支持批量操作：POST /users/batch（批量创建）、DELETE /users/batch（批量删除）
9. THE API_System SHALL 支持字段过滤：GET /users?fields=id,name,email

### 需求 7：数据备份与恢复

**用户故事：** 作为系统管理员，我希望有完善的数据备份和恢复机制。

#### 验收标准

1. THE Backup_System SHALL 提供 pg_dump 封装脚本，支持全量备份
2. THE Backup_System SHALL 支持按租户导出数据（使用 Prisma 查询 + JSON 序列化）
3. THE Recovery_System SHALL 提供数据恢复脚本
4. THE Backup_System SHALL 记录备份操作日志
5. THE System SHALL 支持数据导入验证（格式检查、外键约束检查）

### 需求 8：性能优化深化（NestJS 性能最佳实践）

**用户故事：** 作为性能工程师，我希望有更深入的性能优化，达到 NestJS 企业级项目的性能标准。

#### 验收标准

1. THE Cache_System SHALL 实现两级缓存：L1（node-cache 本地缓存，TTL 60s）、L2（Redis，TTL 5min）
2. THE Database_System SHALL 使用 Prisma 的 select 和 include 优化查询字段
3. THE API_System SHALL 使用 compression 中间件启用 gzip 压缩
4. THE System SHALL 使用 DataLoader 模式解决 N+1 查询问题
5. WHEN 数据库查询耗时超过 500ms THEN THE System SHALL 记录慢查询日志
6. THE System SHALL 支持异步处理：使用 Bull Queue 处理耗时任务
7. THE Connection_Pool SHALL 配置合理的连接数（默认 10，最大 20）
8. THE System SHALL 实现请求去重（相同请求 500ms 内只处理一次）

### 需求 9：代码质量与可维护性（NestJS 代码规范）

**用户故事：** 作为技术负责人，我希望有高质量且可维护的代码库，达到 NestJS 企业级项目的代码规范标准。

#### 验收标准

1. THE Codebase SHALL 通过 ESLint（@typescript-eslint）和 Prettier 强制代码风格
2. THE Codebase SHALL 核心业务逻辑中消除所有 TypeScript 'any' 类型
3. THE Architecture SHALL 遵循 NestJS 推荐的模块化架构：Module → Controller → Service → Repository
4. THE Codebase SHALL 为所有公共方法提供 JSDoc 注释
5. THE Codebase SHALL 使用统一的异常类：BusinessException、AuthenticationException、ValidationException
6. THE Codebase SHALL 使用统一的响应类：Result.ok()、Result.fail()、Result.page()
7. THE Codebase SHALL 使用 DTO 进行请求验证，使用 VO 进行响应封装
8. THE Codebase SHALL 遵循单一职责原则，Service 方法不超过 50 行

### 需求 10：事务与数据一致性（NestJS 事务管理）

**用户故事：** 作为开发者，我希望有完善的事务管理机制，达到 NestJS 企业级项目的数据一致性标准。

#### 验收标准

1. THE Transaction_System SHALL 支持 @Transactional 装饰器声明式事务
2. THE Transaction_System SHALL 支持事务传播行为：REQUIRED（默认）、REQUIRES_NEW、SUPPORTS
3. THE Transaction_System SHALL 支持事务隔离级别配置
4. WHEN 事务中发生异常 THEN THE System SHALL 自动回滚
5. THE Transaction_System SHALL 支持 rollbackFor 指定回滚异常类型
6. THE Transaction_System SHALL 支持 noRollbackFor 指定不回滚异常类型
7. THE Transaction_System SHALL 支持事务超时配置（默认 30 秒）
8. THE System SHALL 使用 Prisma 的 $transaction API 实现事务

## 优先级矩阵

| 需求 | 优先级 | 影响 | 工作量 | NestJS 对标 |
|------|--------|------|--------|------------|
| 需求 1：测试覆盖率 | P0 | 高 | 高 | @nestjs/testing |
| 需求 2：可观测性 | P0 | 高 | 中 | @nestjs/terminus + prom-client |
| 需求 3：高可用性 | P1 | 高 | 中 | cockatiel/opossum |
| 需求 4：安全性深化 | P1 | 高 | 中 | @nestjs/throttler + helmet |
| 需求 10：事务一致性 | P1 | 高 | 中 | Prisma $transaction |
| 需求 9：代码质量 | P1 | 中 | 低 | NestJS 官方规范 |
| 需求 7：数据备份 | P1 | 高 | 低 | - |
| 需求 5：多租户增强 | P2 | 中 | 中 | - |
| 需求 6：API 规范化 | P2 | 中 | 低 | @nestjs/swagger |
| 需求 8：性能深化 | P2 | 中 | 中 | cache-manager |

## 总体评估

### 当前状态
- **总体评分**：91/100（A 级）
- **NestJS 企业级对标度**：80%
- **生产就绪度**：✅ 基本就绪
- **企业级合规**：⚠️ 需要补充测试和监控

### 与 NestJS 企业级标准的差距
1. **测试覆盖**：需要达到 100% 核心业务覆盖率
2. **弹性模式**：缺乏熔断器、重试机制
3. **监控指标**：需要增加业务指标收集
4. **分布式追踪**：需要实现 Request ID 链路追踪
5. **多级缓存**：需要实现 L1 + L2 缓存架构

### 建议优化路径
1. **第一阶段（2-3 周）**：测试覆盖率 100%、完善监控指标
2. **第二阶段（3-4 周）**：实现熔断/重试、增强安全审计
3. **第三阶段（4-6 周）**：多租户增强、性能优化、多级缓存
