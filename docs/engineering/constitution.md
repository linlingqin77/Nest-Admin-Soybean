# 项目宪法

> **所有开发的最高规则**。技术栈、目录边界、API 契约、数据库规范、AI 协作底线。任何修改必须经评审。

## 1. 技术栈

### 后端
- **语言**：TypeScript（严格模式）
- **框架**：NestJS 10
- **数据库**：PostgreSQL 15+（生产）/ SQLite（开发可选）
- **ORM**：Prisma 5
- **缓存**：Redis 7
- **队列**：BullMQ
- **日志**：Pino + nestjs-pino
- **追踪**：OpenTelemetry
- **指标**：Prometheus
- **校验**：class-validator + class-transformer

### 前端
- **框架**：Vue 3.5+（Composition API）
- **构建**：Vite 7
- **状态**：Pinia
- **UI**：Naive UI 2
- **HTTP**：@sa/axios
- **样式**：UnoCSS
- **i18n**：vue-i18n

### 基础设施
- **包管理**：pnpm 10（workspace monorepo）
- **构建编排**：Turborepo
- **部署**：Coolify + GitHub Actions
- **监控**：自托管 Prometheus + Grafana

## 2. 目录边界

### 后端 `apps/server/src/`

| 目录 | 职责 | 可以包含 | 禁止 |
|------|------|----------|------|
| `core/` | 横切关注点 | 认证、权限、租户、HTTP 横切、审计、加解密、可观测性 | 业务逻辑 |
| `platform/` | 基础设施 | 配置、日志、Prisma、Redis、队列、存储、弹性 | 业务逻辑 |
| `modules/` | 业务模块 | 每个模块一个目录，扁平化 | 跨模块 repository import |
| `shared/` | 纯工具 | 通用 DTO、utils、constants、enums | 业务规则 |

### 规则

- Controller **禁止**直接注入 `@prisma/client`
- Controller **禁止**直接 `import PrismaService`
- 模块之间**禁止**直接 `import *.repository`
- 跨模块调用必须通过 service（application layer）
- 单个 service 文件 ≤ 1500 行

### 前端 `apps/web/src/`

- 现有结构基本保持
- API 调用必须用 `src/api/generated/`（OpenAPI 自动生成）
- 禁止手写响应类型
- 禁止 import `@/typings/api/**`

## 3. API 契约

### 主协议：REST + OpenAPI

- 后端用 `@nestjs/swagger` 维护 OpenAPI
- 前端用 `openapi-typescript` 生成 client
- 错误码统一在 `packages/contracts/errors/`
- 权限码统一在 `packages/contracts/permissions/`
- 分页模型统一在 `packages/contracts/pagination/`

### 响应体格式

```json
{
  "code": "OK",
  "message": "OK",
  "data": {},
  "requestId": "req_01H...",
  "timestamp": "2026-08-30T10:00:00.000Z"
}
```

### HTTP 状态码

| 场景 | 状态码 |
|------|--------|
| 成功 | 200 |
| 创建成功 | 201 |
| 参数错误 | 400 |
| 未登录 | 401 |
| 无权限 | 403 |
| 资源不存在 | 404 |
| 冲突（唯一键重复） | 409 |
| 业务规则失败 | 422 |
| 服务异常 | 500 |

## 4. 数据库规范

### 命名

- 表名：`snake_case` 复数（`users`、`auth_sessions`）
- 字段名：`snake_case`（`created_at`、`tenant_id`）
- 主键：`bigint` 自动递增
- 时间：`timestamptz`
- 软删除：`deleted_at`（timestamp，非字符串 `del_flag`）

### 基础字段（每张租户级表必含）

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | `bigint` | 主键 |
| `tenant_id` | `varchar(64)` | 租户 ID |
| `created_at` | `timestamptz` | 创建时间 |
| `updated_at` | `timestamptz` | 更新时间 |
| `created_by` | `bigint?` | 创建人 |
| `updated_by` | `bigint?` | 更新人 |
| `deleted_at` | `timestamptz?` | 软删除时间 |
| `deleted_by` | `bigint?` | 删除人 |
| `version` | `int` | 乐观锁版本 |

### 索引

- 租户级列表索引：`(tenant_id, deleted_at, created_at DESC)`
- 唯一业务键带 `tenant_id`：`unique(tenant_id, username)`
- 软删除表用 partial index：`WHERE deleted_at IS NULL`
- 日志表按时间建索引，必要时按月分区

### 迁移

- 用 `prisma migrate dev` 生成迁移
- 必须有 rollback 脚本
- 生产部署前在测试环境跑一次

## 5. 测试要求

| 类型 | 覆盖内容 |
|------|----------|
| 单元测试 | 业务逻辑、DTO transformer、权限判断 |
| 集成测试 | Repository、Prisma 查询 |
| E2E 测试 | 关键 API 端到端（登录、用户、角色、文件） |
| 安全回归 | 越权、跨租户、软删除绕过、导出权限 |

## 6. AI 协作底线

- 必读 `AGENTS.md` 和 `docs/engineering/constitution.md`
- 必读 `docs/specs/{feature}/spec.md`（新功能）
- 禁止手改 `generated` 文件
- 禁止 controller 访问 Prisma
- 禁止跨模块查表
- 提交前跑 `pnpm harness:verify`

## 7. 修改宪法的条件

- 需要 2 个以上核心开发者评审通过
- 必须在 PR 描述中说明修改原因
- 必须同步更新相关 checklist
