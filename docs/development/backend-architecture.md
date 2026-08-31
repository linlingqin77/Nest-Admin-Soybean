# 务实型商业后台架构设计

本文是一份面向 **TypeScript 全栈开发者、中小团队、真实商业化后台系统** 的架构学习文档。

它不是当前项目实现说明，也不以现有目录、现有 `sys_*` 表或当前 Prisma Schema 为设计前提。这里描述的是：如果从零设计一套可商用、可维护、类型安全、支持单租户和多租户的后台管理系统，我会采用的务实方案。

## 设计定位

这套架构的目标不是追求理论上的复杂，而是服务真实商业化交付：

- 一个 TS 全栈开发者或中小团队可以长期维护。
- 默认单体部署，避免一开始承担微服务复杂度。
- 模块边界清楚，未来确实变大时可以拆。
- 前后端类型尽量自动同步，减少手写接口类型。
- 权限、租户、审计、日志、任务、文件等后台基础能力内建。
- 表结构完整但不过度企业化，不提前引入复杂计费、事件溯源或分布式事务。

我会把它定义为：

```text
强约束模块化单体
+ REST/OpenAPI generated client
+ PostgreSQL/Prisma/Redis
+ 可关闭的多租户能力
+ RBAC/数据权限/审计
+ 未来可拆分边界
```

## 为什么不是那些方案

### 为什么不默认微服务

中小团队商业后台的核心问题通常不是服务拆得不够细，而是业务变化快、交付压力大、人员有限。微服务会带来额外成本：

- 服务发现、网关、链路追踪、部署编排、日志聚合。
- 跨服务事务和最终一致性。
- 本地开发和联调复杂度。
- API 契约和版本治理成本。

所以默认不拆微服务。先把单体内部边界设计好，等某些模块出现独立扩展压力时再拆。

优先考虑未来拆分的模块：

- 文件处理
- 通知发送
- 定时任务
- 审计日志
- 报表导出

这些模块通常和核心用户权限链路耦合较低，拆出去收益更高。

### 为什么不默认 GraphQL

后台管理系统大多数接口是明确动作：

- 创建用户
- 分配角色
- 查询菜单树
- 导出日志
- 上传文件
- 禁用租户

这些天然适合 REST。GraphQL 更适合多端复杂聚合、前端自由选择字段、内容平台或电商详情页。后台系统默认上 GraphQL 会增加 schema、resolver、权限细粒度控制和缓存复杂度。

因此 GraphQL 可以作为复杂聚合 BFF 的可选能力，但不作为默认主协议。

### 为什么 TS 全栈也不全系统 tRPC

tRPC 的开发体验很好，尤其是前后端都由同一个 TS 团队维护时。但真实商业化系统通常还要考虑：

- Swagger/OpenAPI 文档交付。
- 第三方系统接入。
- 移动端或自动化脚本调用。
- API 测试、网关、监控和审计。
- 后续可能跨语言调用。

所以主协议选择 `REST + OpenAPI + generated client`。如果某些内部页面只服务 TS Web 管理端，可以局部使用 tRPC，但不要把 tRPC 作为唯一公开协议。

## 技术选型

| 领域 | 默认选择 | 原因 |
| --- | --- | --- |
| 后端框架 | NestJS | TypeScript 生态成熟，模块化和 DI 适合后台系统 |
| 数据库 | PostgreSQL | 关系模型、索引、JSONB、事务、扩展能力都足够强 |
| ORM | Prisma | TS 类型体验好，开发效率高 |
| 复杂查询 | Repository 内 raw SQL | 报表和复杂统计不强行用 ORM 表达 |
| 缓存 | Redis | 登录态、验证码、热点配置、限流、队列都可复用 |
| 队列 | BullMQ 或 Bull | Node 生态成熟，适合任务、通知、文件处理 |
| 接口契约 | OpenAPI | 可生成前端 SDK，便于测试和第三方接入 |
| 实时能力 | SSE 优先，WebSocket 备用 | 通知和任务进度用 SSE 更简单 |
| 日志 | Pino | 结构化日志、性能好 |
| 指标 | Prometheus | 商业后台常见可观测标准 |
| Trace | OpenTelemetry | 后续拆分服务时仍可复用 |

不默认使用：

- 微服务
- GraphQL
- 完整 DDD
- CQRS
- Event Sourcing
- Kubernetes
- 分布式事务

这些能力不是不能用，而是不该成为中小团队后台系统的默认复杂度。

## Harness Engineering 工程目录

在 AI 辅助开发成为常态后，项目架构不只要约束人，也要约束 AI。Harness Engineering 的核心不是写更长的 prompt，而是把 AI 开发放进一套可执行的工程轨道：

```text
先读规则 -> 再读 spec -> 按 skill 做事 -> 按 contract 改接口 -> 按 checklist 自查 -> 按 script 验证 -> 按 CI 合并
```

这套后台架构推荐的 AI Harness 目标是：

- AI 不能绕过架构边界。
- AI 不能脑补 API、字段、权限码和错误码。
- AI 不能手改 generated 文件。
- AI 不能只写代码不补测试。
- AI 不能做无关重构。
- AI 产物必须通过自动检查，而不是只靠人工信任。

推荐工程目录：

```text
project/
  AGENTS.md
  README.md
  package.json
  pnpm-workspace.yaml

  apps/
    web/                       # Vue Vben Admin
    server/                    # NestJS API
    worker/                    # 可选 BullMQ worker

  packages/
    contracts/                 # OpenAPI、错误码、权限码、事件契约
    eslint-config/             # import 边界、代码规范
    tsconfig/                  # 统一 TS 配置
    test-utils/                # 测试工具

  docs/
    engineering/
      constitution.md          # 项目宪法
      architecture.md          # 架构说明
      ai-harness.md            # AI 协作规则
      coding-standards.md      # 代码规范
      review-checklist.md      # 人工 review 清单

    specs/
      _template/
        spec.md                # 需求和范围
        api.md                 # API、错误码、权限码
        data.md                # 表结构、索引、迁移说明
        ui.md                  # 页面、表格、表单、交互
        tasks.md               # 可执行任务拆分
        acceptance.md          # 验收标准

      user-management/
        spec.md
        api.md
        data.md
        ui.md
        tasks.md
        acceptance.md

  harness/
    prompts/
      backend-module.md
      frontend-vben-page.md
      code-review.md
      test-generation.md

    skills/
      backend-module/
        SKILL.md
      frontend-vben-page/
        SKILL.md
      openapi-contract/
        SKILL.md
      security-review/
        SKILL.md

    checklists/
      backend-checklist.md
      frontend-checklist.md
      api-contract-checklist.md
      database-checklist.md
      release-checklist.md

    scripts/
      check-boundaries.ts
      check-generated.ts
      check-openapi-diff.ts
      check-spec-complete.ts
      verify-feature.ts

    rules/
      eslint-boundaries.config.js
      dependency-cruiser.config.js
      generated-files.json
      forbidden-imports.json

    templates/
      backend-module/
      frontend-page/
      spec-pack/
      migration-note.md
```

### `AGENTS.md`

`AGENTS.md` 是 AI 入口规则，所有 coding agent 进入项目后先读它。它不应该很长，而应该短、硬、可检查：

```md
# Agent Rules

- Follow docs/engineering/constitution.md.
- Do not implement a feature without a spec in docs/specs.
- Do not edit generated files.
- Backend flow: controller -> service/usecase -> policy -> repository -> prisma.
- Frontend must use generated OpenAPI client.
- Every protected endpoint must declare a permission code.
- Run lint, typecheck, test and build before completion.
```

`AGENTS.md` 负责告诉 AI “必须遵守什么”。细节放到 `docs/engineering` 和 `harness/skills`。

### `docs/engineering`

`docs/engineering` 放长期有效的工程规则：

| 文件 | 作用 |
| --- | --- |
| `constitution.md` | 项目宪法，规定技术栈、目录边界、API、数据库、测试和 AI 协作底线 |
| `architecture.md` | 前后端架构、模块边界、数据流和部署策略 |
| `ai-harness.md` | AI 如何读 spec、如何拆任务、如何自检、哪些行为禁止 |
| `coding-standards.md` | TypeScript、Vue、NestJS、Prisma、测试规范 |
| `review-checklist.md` | 人工 review 只看高风险点，避免逐行低效检查 |

项目宪法里应该写清楚：

```text
Controller must not import Prisma.
Frontend must not handwrite API response types.
Every protected endpoint must declare a permission code.
Every tenant table must include tenant_id.
Generated files must not be edited manually.
```

这些规则要尽量能被 lint、脚本或 CI 检查。

### `docs/specs`

`docs/specs` 是规格驱动开发的入口。每个功能一个规格包：

```text
docs/specs/user-management/
  spec.md
  api.md
  data.md
  ui.md
  tasks.md
  acceptance.md
```

AI 开发前必须先读对应规格包。每个文件职责固定：

| 文件 | 内容 |
| --- | --- |
| `spec.md` | 目标、用户、范围、非目标、业务规则 |
| `api.md` | REST API、DTO、错误码、权限码、分页、导出、SSE |
| `data.md` | 表结构、字段、唯一约束、索引、迁移和回滚说明 |
| `ui.md` | Vben 页面、表格列、筛选项、表单字段、按钮权限 |
| `tasks.md` | AI 可执行的小任务，不允许一个任务覆盖过大范围 |
| `acceptance.md` | 验收场景、测试点、边界条件 |

AI 不应该根据一句“做用户管理”直接开发，而应该根据这些规格小步实现。

### `packages/contracts`

`packages/contracts` 是前后端共享契约中心：

```text
packages/contracts/
  openapi/
    openapi.json
    openapi.yaml

  errors/
    error-codes.ts

  permissions/
    permission-codes.ts

  pagination/
    pagination.schema.ts

  events/
    audit-events.ts
    notification-events.ts
```

约束：

- OpenAPI 是前后端主契约。
- 前端 `apps/web/src/api/generated` 由 OpenAPI 生成。
- 错误码、权限码、分页模型进入契约，不允许前后端各写一套。
- AI 修改接口时必须同步更新契约，并通过 OpenAPI diff。

### `harness/skills`

Skills 是 AI 的专项操作说明，不是业务代码。

例如 `harness/skills/backend-module/SKILL.md`：

```text
1. Read docs/specs/{feature}/spec.md first.
2. Read api.md and data.md.
3. Create DTO and OpenAPI metadata.
4. Create repository.
5. Create policy.
6. Create service/usecase.
7. Create controller.
8. Add unit/integration/e2e tests.
9. Do not modify frontend files.
10. Do not bypass repository.
```

例如 `harness/skills/frontend-vben-page/SKILL.md`：

```text
1. Read ui.md and api.md.
2. Regenerate OpenAPI client if contract changed.
3. Use apps/web/src/api/generated only.
4. Implement Vben page under views/{feature}.
5. Add table, filter, form and permission buttons.
6. Do not handwrite API response types.
7. Add route and menu metadata only as specified.
```

Skills 的价值是让 AI 重复做同类任务时稳定执行同一套流程。

### `harness/rules`

`harness/rules` 放机器可执行的边界规则：

```text
harness/rules/
  forbidden-imports.json
  generated-files.json
  dependency-cruiser.config.js
  eslint-boundaries.config.js
```

典型规则：

```json
{
  "forbidden": [
    {
      "from": "apps/server/src/modules/*/*.controller.ts",
      "to": "apps/server/src/platform/prisma/**",
      "reason": "Controller must not access Prisma directly."
    },
    {
      "from": "apps/server/src/modules/*/**",
      "to": "apps/server/src/modules/*/*.repository.ts",
      "reason": "Modules must not import repositories from other modules."
    },
    {
      "from": "apps/web/src/views/**",
      "to": "apps/web/src/api/generated/**",
      "reason": "Generated API files are read-only from feature pages."
    }
  ]
}
```

真实落地时可以用 ESLint、dependency-cruiser、Nx boundaries 或自定义脚本实现。

### `harness/scripts`

`harness/scripts` 把规则变成可运行检查：

| 脚本 | 作用 |
| --- | --- |
| `check-boundaries.ts` | 检查跨模块 import、controller 访问 ORM、repository 越界 |
| `check-generated.ts` | 检查 generated 文件是否被手改 |
| `check-openapi-diff.ts` | 检查 OpenAPI 是否有破坏性变更 |
| `check-spec-complete.ts` | 检查功能规格包是否完整 |
| `verify-feature.ts` | 聚合执行某个 feature 的 lint、typecheck、test、build |

推荐命令：

```bash
pnpm harness:check-boundaries
pnpm harness:check-generated
pnpm harness:check-openapi-diff
pnpm harness:check-spec docs/specs/user-management
pnpm harness:verify-feature user-management
```

AI 提交前必须跑这些检查；CI 也必须跑一遍。

### `harness/checklists`

Checklist 给 AI 自查，也给人类 review：

```text
harness/checklists/
  backend-checklist.md
  frontend-checklist.md
  api-contract-checklist.md
  database-checklist.md
  release-checklist.md
```

后端 checklist 重点：

```text
- 是否声明权限码？
- 是否需要审计？
- 是否有租户过滤？
- 是否 controller 直接访问 Prisma？
- 是否跨模块查表？
- 是否补测试？
```

前端 checklist 重点：

```text
- 是否使用 generated client？
- 是否手写响应类型？
- 是否处理权限按钮？
- 是否处理 single/multi tenant 显示差异？
- 是否处理 loading、empty、error 状态？
- 是否通过 typecheck 和 build？
```

### 最小可落地版本

如果一开始不想建立完整 harness，可以先做最小版本：

```text
project/
  AGENTS.md

  docs/
    engineering/
      constitution.md
      architecture.md
      review-checklist.md

    specs/
      _template/
        spec.md
        api.md
        data.md
        ui.md
        tasks.md

  harness/
    checklists/
      backend-checklist.md
      frontend-checklist.md

    rules/
      forbidden-imports.json

    scripts/
      check-boundaries.ts
      check-generated.ts
```

这个最小版本已经能管住大部分 AI 乱写问题。

Harness Engineering 的重点不是目录本身，而是让 AI 的每一步都有轨道：

```text
规则让 AI 知道边界
spec 让 AI 知道需求
contract 让 AI 不乱改接口
skill 让 AI 稳定执行任务
checklist 让 AI 自查
script 让机器自动拦截
CI 让错误不能合并
```

## 推荐目录结构

默认目录保持直观，避免过度抽象：

```text
src/
  main.ts
  app.module.ts

  core/
    auth/
    permissions/
    tenancy/
    http/
    errors/
    audit/

  platform/
    config/
    logger/
    prisma/
    redis/
    queue/
    storage/
    observability/

  modules/
    auth/
    users/
    roles/
    permissions/
    menus/
    tenants/
    departments/
    posts/
    system-config/
    files/
    notices/
    jobs/
    monitor/
    audit-logs/

  shared/
    dto/
    types/
    utils/
```

目录职责：

| 目录 | 职责 |
| --- | --- |
| `core` | 认证、权限、租户、HTTP 横切能力、错误、审计 |
| `platform` | 配置、日志、数据库、Redis、队列、存储、可观测性 |
| `modules` | 真实业务模块 |
| `shared` | 纯工具、通用 DTO、通用类型，不能包含业务规则 |

## 模块开发规范

简单模块使用固定结构：

```text
users/
  users.module.ts
  users.controller.ts
  users.service.ts
  users.repository.ts
  users.policy.ts
  dto/
```

推荐调用链：

```text
controller -> service/usecase -> policy -> repository -> prisma
```

各层职责：

| 层 | 应该做什么 | 不应该做什么 |
| --- | --- | --- |
| Controller | HTTP 入参、DTO、调用 service/usecase | 写业务规则、直接查数据库 |
| Service/UseCase | 编排业务流程、事务边界、调用 policy/repository | 拼复杂 SQL、处理 HTTP 细节 |
| Policy | 权限、资源归属、业务约束判断 | 访问 HTTP request |
| Repository | Prisma 查询、raw SQL、分页、排序 | 判断用户能不能操作 |
| Prisma | ORM 映射和数据库访问 | 承担业务语义 |

当模块变复杂时再升级目录：

```text
users/
  http/
    users.controller.ts
    dto/
  application/
    create-user.usecase.ts
    update-user.usecase.ts
    assign-roles.usecase.ts
  domain/
    users.policy.ts
    users.errors.ts
  persistence/
    users.repository.ts
```

不要一开始就把所有模块都拆成 DDD 目录。只有用户、角色、租户、文件、任务这类复杂模块值得升级。

## 架构边界自动化

模块化单体的风险是边界靠人遵守，所以要用工具加约束。

必须禁止：

- Controller 直接注入 Prisma。
- 跨模块直接 import repository。
- 一个模块直接查另一个模块拥有的表。
- 业务代码到处手写 `tenant_id` 条件。
- 多个模块各自实现同一套权限判断。

允许：

- 通过 application service 调用其他模块能力。
- 通过 service port 定义跨模块依赖。
- 通过 domain event 触发低耦合副作用。

可以用 ESLint 或依赖边界工具表达规则：

```text
modules/users/** 不能 import modules/roles/**/*.repository
modules/*/controller.ts 不能 import platform/prisma
modules/*/repository.ts 才能 import platform/prisma
```

这三条约束比复杂目录更重要。

## 前后端通信规范

### 主协议

主方案：

```text
REST + OpenAPI + generated client
```

后端维护 OpenAPI，前端通过工具生成：

- API 请求函数
- Request DTO 类型
- Response DTO 类型
- 分页类型
- 错误码类型
- 权限码类型

前端不手写接口路径和返回类型。

### 响应约定

推荐保留统一业务响应体，同时使用标准 HTTP 状态码：

```json
{
  "code": "USER_DISABLED",
  "message": "用户已被禁用",
  "data": null,
  "requestId": "req_01H...",
  "timestamp": "2026-06-10T10:00:00.000Z"
}
```

成功响应：

```json
{
  "code": "OK",
  "message": "OK",
  "data": {},
  "requestId": "req_01H...",
  "timestamp": "2026-06-10T10:00:00.000Z"
}
```

HTTP 状态码不要全部返回 200：

| 场景 | HTTP 状态码 |
| --- | --- |
| 参数错误 | 400 |
| 未登录 | 401 |
| 无权限 | 403 |
| 资源不存在 | 404 |
| 冲突，例如唯一键重复 | 409 |
| 业务规则失败 | 422 |
| 服务异常 | 500 |

这样对网关、监控、测试和第三方接入都更友好。

### 分页约定

列表接口统一：

```text
GET /api/users?page=1&pageSize=20&keyword=admin
```

响应：

```json
{
  "rows": [],
  "total": 100,
  "page": 1,
  "pageSize": 20
}
```

分页字段必须统一，避免每个模块自己定义。

### 文件上传和导出

文件上传：

```text
POST /api/files
Content-Type: multipart/form-data
```

导出建议异步化：

```text
POST /api/operation-logs/export-tasks
GET  /api/export-tasks/{id}
```

不要让大导出长期占用 HTTP 请求。

### 实时能力

优先使用 SSE：

```text
GET /api/events
```

适合：

- 站内通知
- 任务进度
- 导出完成
- 在线状态变化

WebSocket 只用于强双向场景：

- 在线协作
- 高频互动
- 实时控制台

### tRPC 的位置

tRPC 可以用于：

- 内部工具页
- 纯 TS Web 管理端
- 不需要开放给第三方的低风险模块

但不要作为唯一主协议。系统主契约仍然是 OpenAPI。

## 单租户和多租户设计

系统应该是 `tenant-aware`，不是 `tenant-only`。

运行模式：

```text
TENANCY_MODE=single
TENANCY_DEFAULT_ID=default
```

或：

```text
TENANCY_MODE=multi
TENANCY_DEFAULT_ID=default
```

### single-tenant 模式

适合：

- 单公司后台
- 内部运营系统
- 单客户私有化部署

行为：

- 所有租户级业务数据写入 `tenant_id = 'default'`。
- 租户管理、套餐、额度、租户切换菜单可以隐藏。
- RBAC、数据权限、审计照常使用。

### multi-tenant 模式

适合：

- SaaS
- 多客户平台
- 代理商系统

行为：

- 登录和请求解析当前 `tenant_id`。
- Repository Scope 或 Prisma Extension 自动追加租户过滤。
- 创建数据时自动写入当前 `tenant_id`。
- 跨租户操作必须显式进入 system context，并写审计。

### 为什么不用 `tenant_id = null`

业务表推荐始终使用默认租户：

```text
tenant_id = 'default'
```

不推荐单租户时大量使用 `tenant_id is null`，原因：

- 唯一约束更复杂。
- 查询条件更复杂。
- 后续升级多租户需要补数据。
- 代码容易出现双分支。

推荐唯一约束：

```text
unique(tenant_id, username)
unique(tenant_id, role_code)
unique(tenant_id, config_key)
```

单租户和多租户都适用。

## 权限设计

权限分四层：

```text
登录态 -> 租户范围 -> RBAC -> 数据权限/资源策略
```

### RBAC

基础关系：

```text
user -> user_roles -> roles -> role_permissions -> permissions
```

权限码推荐格式：

```text
users:create
users:update
users:delete
roles:assign
files:download
audit-logs:export
```

菜单和权限不要强绑定：

- `menus` 负责前端导航和页面结构。
- `permissions` 负责后端动作授权。
- `role_menus` 控制用户能看到什么。
- `role_permissions` 控制用户能做什么。

### 数据权限

常见数据范围：

| 范围 | 含义 |
| --- | --- |
| `all` | 当前租户全部数据 |
| `dept_tree` | 本部门及子部门 |
| `dept` | 本部门 |
| `self` | 仅本人 |
| `custom` | 指定部门集合 |

数据权限不要塞在角色表一个字段里，应该单独建表，因为不同资源可能需要不同范围。

### 资源策略

RBAC 判断“有没有动作权限”，资源策略判断“能不能操作这个具体资源”。

例子：

- 用户有 `roles:assign`，但不能把别人提升为超级管理员。
- 用户有 `users:update`，但不能修改跨租户用户。
- 用户有 `files:delete`，但不能删除别人上传且被锁定的文件。

这些规则放在 policy，不放在 controller 或 repository。

## 缓存、任务和审计

### 缓存

适合缓存：

- 当前用户权限
- 菜单树
- 系统配置
- 字典项
- 验证码
- 限流计数

缓存 key 必须包含租户：

```text
tenant:{tenantId}:user:{userId}:permissions
tenant:{tenantId}:dict:{dictType}
tenant:{tenantId}:config:{configKey}
```

### 队列任务

队列任务必须显式携带：

```json
{
  "tenantId": "default",
  "actorUserId": 1,
  "requestId": "req_01H..."
}
```

不要让队列任务依赖 HTTP 请求上下文。

适合异步任务：

- 大文件处理
- 缩略图生成
- 导出报表
- 发送邮件/短信
- 批量导入
- 审计副作用

### 审计

审计日志不软删除。必须记录：

- 谁
- 在哪个租户
- 什么时间
- 什么 IP 和设备
- 对什么资源
- 做了什么动作
- 成功还是失败
- 修改前后关键字段
- requestId

高风险动作必须审计：

- 登录失败
- 修改密码
- 修改角色
- 分配权限
- 删除数据
- 导出数据
- 跨租户访问
- 修改租户配置

## 表结构设计原则

统一命名：

- 表名：`snake_case` 复数，例如 `users`。
- 字段名：`snake_case`，例如 `created_at`。
- 主键：默认 `bigint`。
- 时间：默认 `timestamptz`。
- 软删除：`deleted_at`、`deleted_by`。

基础字段：

| 字段 | 类型建议 | 说明 |
| --- | --- | --- |
| `id` | `bigint` | 主键 |
| `tenant_id` | `varchar(64)` | 租户 ID，租户级表必填 |
| `created_at` | `timestamptz` | 创建时间 |
| `updated_at` | `timestamptz` | 更新时间 |
| `created_by` | `bigint` | 创建人 |
| `updated_by` | `bigint` | 更新人 |
| `deleted_at` | `timestamptz` | 软删除时间 |
| `deleted_by` | `bigint` | 删除人 |
| `version` | `int` | 乐观锁版本 |

索引原则：

- 租户级列表优先建 `(tenant_id, deleted_at, created_at)`。
- 唯一业务键带 `tenant_id`。
- 软删除表使用 partial index：`where deleted_at is null`。
- 日志表按时间建索引，必要时按月分区。
- 不为所有字段盲目建索引，只服务真实查询。

## Auth 表结构

用途：登录态、刷新令牌、登录安全、多因素认证。

租户隔离：是。单租户使用 `tenant_id = 'default'`。

| 表 | 关键字段 | 唯一约束 | 常用索引 |
| --- | --- | --- | --- |
| `auth_sessions` | `id`, `tenant_id`, `user_id`, `device_id`, `ip`, `user_agent`, `status`, `last_active_at`, `expires_at`, `revoked_at` | `device_id` 可唯一，也可按业务不唯一 | `(tenant_id, user_id, status)`, `(expires_at)` |
| `refresh_tokens` | `id`, `tenant_id`, `session_id`, `token_hash`, `expires_at`, `revoked_at`, `rotated_from_id` | `token_hash` | `(session_id)`, `(expires_at)` |
| `login_attempts` | `id`, `tenant_id`, `username`, `ip`, `success`, `failure_reason`, `created_at` | 无 | `(tenant_id, username, created_at)`, `(ip, created_at)` |
| `mfa_factors` | `id`, `tenant_id`, `user_id`, `type`, `secret_encrypted`, `enabled_at`, `disabled_at` | `(tenant_id, user_id, type)` | `(tenant_id, user_id)` |

设计说明：

- access token 可以短有效期，不必落库。
- refresh token 必须只存 hash，不存明文。
- session 是踢下线、设备管理、密码修改后失效的基础。
- 登录失败限制可以结合 Redis，但数据库保留安全审计数据。

## User / Permission 表结构

用途：用户、角色、权限、菜单和授权关系。

租户隔离：是。平台级超级管理员可以放在 `tenant_id = 'default'` 或独立 system context。

| 表 | 关键字段 | 唯一约束 | 常用索引 |
| --- | --- | --- | --- |
| `users` | `id`, `tenant_id`, `username`, `password_hash`, `nickname`, `email`, `phone`, `avatar_file_id`, `status`, `last_login_at`, `dept_id` | `(tenant_id, username)`, `(tenant_id, email)`, `(tenant_id, phone)` 按需 | `(tenant_id, status)`, `(tenant_id, dept_id)` |
| `roles` | `id`, `tenant_id`, `role_code`, `role_name`, `description`, `status`, `is_system` | `(tenant_id, role_code)` | `(tenant_id, status)` |
| `permissions` | `id`, `permission_code`, `module`, `resource`, `action`, `description` | `permission_code` | `(module, resource)` |
| `menus` | `id`, `tenant_id`, `parent_id`, `menu_name`, `menu_type`, `path`, `component`, `icon`, `sort`, `visible`, `status`, `permission_code` | `(tenant_id, path)` 按需 | `(tenant_id, parent_id, sort)` |
| `user_roles` | `tenant_id`, `user_id`, `role_id` | `(tenant_id, user_id, role_id)` | `(tenant_id, user_id)`, `(tenant_id, role_id)` |
| `role_permissions` | `tenant_id`, `role_id`, `permission_id` | `(tenant_id, role_id, permission_id)` | `(tenant_id, role_id)` |
| `role_menus` | `tenant_id`, `role_id`, `menu_id` | `(tenant_id, role_id, menu_id)` | `(tenant_id, role_id)` |

设计说明：

- `permissions` 可以是全局表，因为权限码属于系统能力，不一定按租户变化。
- `menus` 可以按租户隔离，支持不同租户套餐显示不同菜单。
- 用户看到什么由 `role_menus` 决定，能做什么由 `role_permissions` 决定。

## Tenant 表结构

用途：单租户和多租户统一基础。

租户隔离：`tenants` 自身是系统级表，其他租户业务表按 `tenant_id` 隔离。

| 表 | 关键字段 | 唯一约束 | 常用索引 |
| --- | --- | --- | --- |
| `tenants` | `id`, `tenant_id`, `tenant_name`, `status`, `domain`, `contact_name`, `contact_phone`, `package_id`, `expires_at` | `tenant_id`, `domain` 按需 | `(status)`, `(expires_at)` |
| `tenant_packages` | `id`, `package_code`, `package_name`, `status`, `description` | `package_code` | `(status)` |
| `tenant_package_features` | `package_id`, `feature_code`, `enabled`, `limit_value` | `(package_id, feature_code)` | `(package_id)` |
| `tenant_quotas` | `id`, `tenant_id`, `quota_key`, `quota_limit`, `quota_used`, `reset_period` | `(tenant_id, quota_key)` | `(tenant_id)` |
| `tenant_usage_records` | `id`, `tenant_id`, `usage_key`, `amount`, `occurred_at`, `source` | 无 | `(tenant_id, usage_key, occurred_at)` |

设计说明：

- single-tenant 模式也创建一条默认租户：`tenant_id = 'default'`。
- 套餐和额度是多租户商业化能力，单租户模式可以隐藏。
- 不要让业务表引用租户表后到处 join，租户上下文由基础设施提供。

## Organization 表结构

用途：部门、岗位、数据权限。

租户隔离：是。

| 表 | 关键字段 | 唯一约束 | 常用索引 |
| --- | --- | --- | --- |
| `departments` | `id`, `tenant_id`, `parent_id`, `dept_name`, `dept_code`, `path`, `sort`, `leader_user_id`, `status` | `(tenant_id, dept_code)` | `(tenant_id, parent_id, sort)`, `(tenant_id, path)` |
| `posts` | `id`, `tenant_id`, `post_code`, `post_name`, `sort`, `status` | `(tenant_id, post_code)` | `(tenant_id, status)` |
| `user_posts` | `tenant_id`, `user_id`, `post_id` | `(tenant_id, user_id, post_id)` | `(tenant_id, user_id)` |
| `role_data_scopes` | `id`, `tenant_id`, `role_id`, `resource`, `scope_type` | `(tenant_id, role_id, resource)` | `(tenant_id, role_id)` |
| `role_data_scope_departments` | `tenant_id`, `data_scope_id`, `department_id` | `(tenant_id, data_scope_id, department_id)` | `(tenant_id, data_scope_id)` |

设计说明：

- `departments.path` 保存祖先路径，便于查询子树。
- 数据权限按资源配置，不固定在角色表上。
- `custom` 数据范围通过 `role_data_scope_departments` 表表达。

## System 表结构

用途：系统配置、租户配置、字典、客户端。

租户隔离：系统配置是全局，租户配置按租户隔离。

| 表 | 关键字段 | 唯一约束 | 常用索引 |
| --- | --- | --- | --- |
| `system_configs` | `id`, `config_key`, `config_value`, `value_type`, `description`, `is_public` | `config_key` | `(is_public)` |
| `tenant_configs` | `id`, `tenant_id`, `config_key`, `config_value`, `value_type`, `description` | `(tenant_id, config_key)` | `(tenant_id)` |
| `dict_types` | `id`, `tenant_id`, `dict_code`, `dict_name`, `status` | `(tenant_id, dict_code)` | `(tenant_id, status)` |
| `dict_items` | `id`, `tenant_id`, `dict_type_id`, `item_label`, `item_value`, `sort`, `status`, `tag_type` | `(tenant_id, dict_type_id, item_value)` | `(tenant_id, dict_type_id, sort)` |
| `clients` | `id`, `client_id`, `client_name`, `client_secret_hash`, `grant_types`, `status`, `access_token_ttl`, `refresh_token_ttl` | `client_id` | `(status)` |

设计说明：

- 全局默认配置放 `system_configs`。
- 租户覆盖配置放 `tenant_configs`。
- 读取配置时优先级：租户配置 > 系统配置 > 代码默认值。

## File 表结构

用途：文件、文件夹、分享、存储提供商。

租户隔离：是。

| 表 | 关键字段 | 唯一约束 | 常用索引 |
| --- | --- | --- | --- |
| `files` | `id`, `tenant_id`, `folder_id`, `original_name`, `stored_name`, `mime_type`, `size_bytes`, `hash`, `storage_provider_id`, `storage_key`, `uploader_id`, `status` | `(tenant_id, hash)` 可选 | `(tenant_id, folder_id)`, `(tenant_id, uploader_id, created_at)` |
| `file_folders` | `id`, `tenant_id`, `parent_id`, `folder_name`, `path`, `owner_user_id` | `(tenant_id, parent_id, folder_name)` | `(tenant_id, parent_id)` |
| `file_shares` | `id`, `tenant_id`, `file_id`, `share_token_hash`, `expires_at`, `access_limit`, `access_count`, `created_by` | `share_token_hash` | `(tenant_id, file_id)`, `(expires_at)` |
| `storage_providers` | `id`, `tenant_id`, `provider_type`, `provider_name`, `config_encrypted`, `is_default`, `status` | `(tenant_id, provider_name)` | `(tenant_id, status)` |

设计说明：

- 存储密钥加密保存，不明文落库。
- 文件可以先按租户隔离，后续大规模时再拆对象存储桶或独立文件服务。
- 分享 token 只存 hash。

## Notice / Message 表结构

用途：公告、站内信、消息已读状态。

租户隔离：是。

| 表 | 关键字段 | 唯一约束 | 常用索引 |
| --- | --- | --- | --- |
| `notices` | `id`, `tenant_id`, `title`, `content`, `notice_type`, `publish_status`, `published_at`, `created_by` | 无 | `(tenant_id, publish_status, published_at)` |
| `notification_messages` | `id`, `tenant_id`, `receiver_user_id`, `title`, `content`, `message_type`, `source_type`, `source_id`, `sent_at` | 无 | `(tenant_id, receiver_user_id, sent_at)` |
| `notification_reads` | `tenant_id`, `message_id`, `user_id`, `read_at` | `(tenant_id, message_id, user_id)` | `(tenant_id, user_id, read_at)` |

设计说明：

- 公告是发布内容，站内信是发送到人的消息。
- 已读状态独立建表，便于一条消息发给多人。
- SSE 可以订阅当前用户的新消息。

## Job 表结构

用途：定时任务定义、执行记录。

租户隔离：任务可按租户隔离，也可系统级。建议字段保留 `tenant_id`，系统任务使用 `tenant_id = 'default'` 或 system context。

| 表 | 关键字段 | 唯一约束 | 常用索引 |
| --- | --- | --- | --- |
| `jobs` | `id`, `tenant_id`, `job_code`, `job_name`, `cron_expression`, `handler_name`, `payload_json`, `status`, `next_run_at` | `(tenant_id, job_code)` | `(tenant_id, status, next_run_at)` |
| `job_runs` | `id`, `tenant_id`, `job_id`, `run_status`, `started_at`, `finished_at`, `duration_ms`, `error_message`, `trace_id` | 无 | `(tenant_id, job_id, started_at)`, `(run_status, started_at)` |

设计说明：

- job handler 名称不能直接来自用户输入执行任意代码。
- 任务 payload 必须校验 schema。
- 执行记录不建议软删除，按时间归档。

## Audit / Monitor 表结构

用途：审计、操作日志、登录日志、在线用户。

租户隔离：是。日志类表通常不软删除，按时间归档或分区。

| 表 | 关键字段 | 唯一约束 | 常用索引 |
| --- | --- | --- | --- |
| `audit_logs` | `id`, `tenant_id`, `actor_user_id`, `action`, `resource_type`, `resource_id`, `before_json`, `after_json`, `ip`, `user_agent`, `request_id`, `success`, `created_at` | 无 | `(tenant_id, actor_user_id, created_at)`, `(tenant_id, resource_type, resource_id)`, `(request_id)` |
| `operation_logs` | `id`, `tenant_id`, `user_id`, `module`, `operation`, `method`, `path`, `status_code`, `duration_ms`, `request_id`, `created_at` | 无 | `(tenant_id, user_id, created_at)`, `(tenant_id, module, created_at)` |
| `login_logs` | `id`, `tenant_id`, `username`, `user_id`, `ip`, `user_agent`, `success`, `failure_reason`, `created_at` | 无 | `(tenant_id, username, created_at)`, `(ip, created_at)` |
| `online_users` | `id`, `tenant_id`, `user_id`, `session_id`, `ip`, `user_agent`, `last_active_at`, `expires_at` | `session_id` | `(tenant_id, user_id)`, `(expires_at)` |

设计说明：

- `audit_logs` 记录业务关键动作。
- `operation_logs` 记录接口访问和操作行为。
- `login_logs` 记录登录安全。
- `online_users` 可以由 Redis 维护，数据库表用于查询和兼容管理后台。

## 可选扩展表

以下表不建议一开始全部创建，等业务确实需要再加：

| 功能 | 表 |
| --- | --- |
| 短信 | `sms_channels`, `sms_templates`, `sms_logs` |
| 邮件 | `mail_accounts`, `mail_templates`, `mail_logs` |
| 代码生成 | `gen_data_sources`, `gen_template_groups`, `gen_templates`, `gen_tables`, `gen_table_columns`, `gen_histories` |
| 计费 | `billing_accounts`, `billing_orders`, `billing_items`, `invoices` |
| 复杂审批 | `workflow_definitions`, `workflow_instances`, `workflow_tasks` |

务实原则：没有明确业务场景，不提前把所有企业功能塞进第一版。

## 微服务拆分条件

只有满足下面条件时再考虑拆：

- 模块有独立扩容需求。
- 模块有独立发布节奏。
- 模块边界已经通过代码约束稳定存在。
- 跨模块调用很少，数据所有权清楚。
- 团队有能力维护独立部署、监控和契约版本。

推荐拆分顺序：

```text
notification -> file -> job -> audit -> report -> iam
```

`iam` 不建议早拆，因为认证和权限是后台系统的核心链路，拆早会显著提高复杂度。

## 测试策略

最低测试组合：

| 类型 | 覆盖内容 |
| --- | --- |
| Unit Test | policy、权限判断、数据权限、DTO transformer |
| Repository Integration Test | Prisma 查询、分页、软删除、租户过滤 |
| E2E Test | 登录、用户、角色、菜单、租户、文件、任务 |
| Security Regression | 越权、跨租户、软删除绕过、导出权限 |
| Contract Test | OpenAPI 是否破坏前端生成类型 |

关键场景必须双模式跑：

```text
TENANCY_MODE=single
TENANCY_MODE=multi
```

至少覆盖：

- 单租户下普通 CRUD 不需要手写租户条件。
- 多租户下不能读取其他租户数据。
- 队列任务必须带 tenantId。
- 超级管理员跨租户操作必须写审计。

## 最终评分

在以下前提下：

```text
TypeScript 全栈
中小团队
真实商业化
后台管理 / SaaS / 内部运营系统
```

这套架构可以达到约 `9.7/10`。

它不是理论最强架构，但足够务实：

- 能快速交付。
- 边界不乱。
- 类型安全。
- 支持单租户和多租户。
- 权限和审计可靠。
- 后续有机会演进到微服务。

真正的 10 分不存在，因为所有架构都有取舍。对中小团队来说，最好的架构不是把未来所有可能性都提前设计进去，而是：

```text
简单但有边界，快但不乱，能赚钱，后面还能长。
```
