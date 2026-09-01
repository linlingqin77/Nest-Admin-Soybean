# Backend Implementation Guide

> 项目当前后端架构的实际指南。本文记录**我们项目的实际实现**，与 [`backend-architecture.md`](./backend-architecture.md) 中的理论架构设计互补。

## 1. 目录结构（4 个顶层）

后端代码位于 `apps/server/src/`，按职责分为 4 个顶层目录：

```
src/
├── main.ts              # NestJS 入口
├── app.module.ts        # 根模块
│
├── core/                # 横切关注点（横切所有业务）
│   ├── auth/            # 登录、JWT、Token 黑名单、登录锁定、MFA
│   ├── permissions/     # 角色、权限、数据权限
│   ├── tenancy/         # 多租户上下文、租户守卫、租户装饰器
│   ├── http/            # 过滤器、拦截器、中间件、事务装饰器
│   ├── audit/           # 审计日志
│   ├── crypto/          # 加解密
│   └── observability/   # 指标、追踪、健康检查
│
├── platform/            # 基础设施
│   ├── config/          # AppConfigService（强类型配置）
│   ├── logger/          # Pino 日志
│   ├── prisma/          # Prisma 服务
│   ├── redis/           # Redis 客户端
│   ├── queue/           # Bull 队列
│   ├── dataloader/      # N+1 查询优化
│   ├── storage/         # OSS 存储
│   └── resilience/      # 熔断器
│
├── modules/             # 业务模块
│   ├── auth/            # 认证（main 业务）
│   ├── users/
│   ├── roles/
│   ├── menus/
│   ├── depts/           # 部门
│   ├── posts/           # 岗位
│   ├── dicts/
│   ├── clients/
│   ├── notices/
│   ├── files/
│   ├── tenants/
│   ├── tenant-packages/
│   ├── configs/
│   ├── sms/
│   ├── mails/
│   ├── notifies/
│   ├── tools/           # 代码生成器
│   ├── monitors/        # 监控
│   ├── login-logs/
│   ├── oper-logs/
│   ├── health/
│   ├── backup/
│   ├── axios/           # 公共 axios 客户端
│   └── docs/            # API 文档
│
└── shared/              # 纯工具
    ├── dto/             # 通用 DTO
    ├── utils/
    ├── constants/
    ├── enums/
    ├── decorators/      # 纯语法装饰器
    ├── validators/
    ├── response/        # Result 包装
    └── events/
```

## 2. 模块内部扁平结构

**简单模块**（绝大多数）：

```
modules/users/
├── users.module.ts
├── users.controller.ts
├── users.service.ts           # 单一服务文件（≤ 1500 行）
├── users.repository.ts
├── users.constant.ts          # 模块常量
├── users.decorator.ts         # 可选：模块专用装饰器
└── dto/
    ├── create-user.dto.ts
    ├── update-user.dto.ts
    ├── list-user.dto.ts
    ├── change-status.dto.ts
    ├── reset-pwd.dto.ts
    └── user.dto.ts            # response
```

**复杂模块**（代码量大）允许在模块根目录按业务能力拆出独立 service 文件（不放在 `services/` 子目录）：

```
modules/files/
├── files.module.ts
├── files.controller.ts
├── upload.service.ts
├── share.service.ts
├── files.repository.ts
└── dto/
```

## 3. DTO 命名规范

| 用途 | 命名格式 | 文件名 | 示例 |
|------|----------|--------|------|
| 请求 DTO | `XxxRequestDto` | `xxx-request.dto.ts` | `CreateUserRequestDto` |
| 响应 DTO | `XxxResponseDto` | `xxx-response.dto.ts` | `UserResponseDto` |
| 通用 VO | `XxxVo` | `xxx.vo.ts` | `TenantAuditLogVo` |

**禁止**：
- ❌ `dto/index.ts`（用命名导入）
- ❌ `dto/requests/` 和 `dto/responses/` 子目录（扁平化）
- ❌ 名字不带 `Request/Response` 后缀（如 `CreateUserDto` 错误）

## 4. 调用链规范

```
Controller → Service → Repository → Prisma
```

**禁止**：
- ❌ Controller 直接 import `@prisma/client`
- ❌ Controller 直接注入 `PrismaService`
- ❌ 模块之间互相 import `*.repository.ts`
- ❌ 跨模块直接查另一模块的表

**允许**：
- ✅ 通过 service 层调用其他模块
- ✅ 通过 shared 事件总线做低耦合副作用

## 5. 数据库命名规范

| 类型 | 命名 | 示例 |
|------|------|------|
| 表名 | `snake_case` 复数 | `users`, `auth_sessions` |
| 字段名 | `snake_case` | `created_at`, `tenant_id` |
| 主键 | `bigint` 自增 | `id` |
| 时间字段 | `timestamptz` | `created_at`, `updated_at` |
| 软删除 | `deleted_at: timestamptz?` | `deleted_at IS NULL` |

详见 [`docs/development/backend-architecture.md`](./backend-architecture.md) 第 4 节"表结构设计原则"。

## 6. 迁移文件命名

`apps/server/prisma/migrations/YYYYMMDDHHMMSS_<description>/migration.sql`

**示例**：
```
migrations/
├── 20260116010531_add_enterprise_code_generator_models/
└── 20260201000000_add_performance_indexes/
```

## 7. Harness Engineering 工作流

项目根目录的 `AGENTS.md` 是 AI 协作者入口规则。提交前必须跑：

```bash
pnpm harness:check-boundaries  # 检查 controller 越界访问 Prisma
pnpm harness:check-generated   # 检查 generated 文件被手改
pnpm harness:check-spec        # 检查 spec 完整性
pnpm harness:verify            # 聚合所有检查 + lint + typecheck + test + build
```

详见 [`harness/`](../../harness/) 目录。

## 8. OpenAPI 自动化

后端启动时自动生成 `public/openApi.json`，可通过以下命令复制到 `packages/contracts`：

```bash
pnpm --filter @nest-admin/server build
pnpm --filter @nest-admin/server generate:openapi
```

前端自动消费：

```bash
pnpm --filter @nest-admin/web generate:api
```

## 9. 常用命令

| 任务 | 命令 |
|------|------|
| 启动开发服务器 | `pnpm dev:server` |
| 类型检查 | `pnpm --filter @nest-admin/server build` |
| 运行测试 | `pnpm --filter @nest-admin/server test` |
| 数据库迁移 | `pnpm prisma migrate dev` |
| 数据库 seed | `pnpm prisma:seed:only` |
| 格式化代码 | `pnpm format` |
| 检查 lint | `pnpm --filter @nest-admin/server lint` |

## 10. 添加新模块

1. 在 `modules/` 创建模块目录（扁平结构，参考上面"简单模块"）
2. 写 `xxx.module.ts`、`xxx.controller.ts`、`xxx.service.ts`、`xxx.repository.ts`
3. 在 `dto/` 创建请求/响应 DTO（命名规范见第 3 节）
4. 在 `app.module.ts` 注册新模块
5. 运行 `pnpm harness:verify` 确保通过

## 11. 关键文件位置速查

| 内容 | 位置 |
|------|------|
| 数据库 schema | `apps/server/prisma/schema.prisma` |
| 启动入口 | `apps/server/src/main.ts` |
| 根模块 | `apps/server/src/app.module.ts` |
| 配置定义 | `apps/server/src/platform/config/` |
| 通用 DTO | `apps/server/src/shared/dto/` |
| 通用工具 | `apps/server/src/shared/utils/` |
| Harness 脚本 | `harness/scripts/` |
| 工程文档 | `docs/engineering/` |
| 共享 OpenAPI | `packages/contracts/openapi/openapi.json` |

## 12. 已知架构债

> 这部分记录**当前代码中违反架构规范但可以接受**的设计。如果需要做下一轮重构，这些是候选目标。

### 12.1 `shared/services/user-role-bridge.service.ts`（🟡 P1）

**问题**：`shared/` 按设计只放"纯工具、不含业务规则"，但 `user-role-bridge.service.ts` 是一个 NestJS `@Injectable` 服务，单纯为了解决 `UserService` 和 `MenuService` 之间的循环依赖而存在。

**位置**：`apps/server/src/shared/services/user-role-bridge.service.ts`

**推荐重构**：
- 方案 A：将 `getRoleIdsByUserId` 移到 `UsersService` 或独立的 `UsersRepository` 中
- 方案 B：使用 NestJS 的 `forwardRef(() => ...)` 打破循环依赖
- 方案 C：将菜单和用户的查询拆到独立的 `ReadModel` 中

### 12.2 `core/decorators/` 8 个文件混杂（🟢 P3）

**问题**：`core/decorators/` 直接挂在 `core/` 下，混杂了多种主题：
- `api-version.decorator.ts`, `api.decorator.ts` → 属于 `core/http/decorators/`
- `require-permission.decorator.ts`, `require-role.decorator.ts` → 属于 `core/permissions/decorators/`
- `throttle.decorator.ts`, `optimistic-lock.decorator.ts` → 属于 `core/http/decorators/`
- `version.decorator.ts` → 通用

**推荐重构**：迁移到各自主题子目录，`core/decorators/` 只保留通用装饰器（目前为空）。

### 12.3 `core/audit/` 与 `core/observability/` 概念重叠（🟡 P2）

**问题**：`core/audit/`（3 个文件）是审计日志，`core/observability/metrics/` 是指标——但都叫"observability"。

**历史原因**：早期架构把 metrics/tracing/health 都放在 `observability/` 下，audit 是后加的独立模块。

**推荐重构**：合并 `core/audit/` 到 `core/observability/audit/`，统一命名空间。

### 12.4 `shared/` 子目录过多（🟢 P3）

**现状**：`shared/` 下有 11 个子目录（`validators/`、`enums/`、`dto/`、`exceptions/`、`events/`、`services/`、`entities/`、`decorators/`、`constants/`、`utils/`、`response/`）。每个职责清晰，但目录数过多。

**推荐重构**：
- 短期：保持现状，子目录独立维护
- 长期：合并 `entities/` + `response/` + `dto/` 到 `types/`；`events/` + `services/` 移到业务层或拆为领域事件

### 12.5 已完成的重构债（✅ 已处理）

- ✅ 重复的 `src/observability/` 与 `src/core/observability/` → 已删除旧位置
- ✅ 30+ 处预存的 TypeScript 类型错误 → 已修复（102→0）
