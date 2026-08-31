# Nest-Admin 重构方案（目录 + Harness + 数据库）

## 目标

按 `backend-architecture.md` 重构后端目录、合并 service、扁平化 DTO、建立 Harness Engineering、全面重构数据库 schema（snake_case 复数、bigint 主键、deleted_at 软删除、新增 auth/audit 表）。

---

## 目标结构

### 后端目录（4 个顶层，模块扁平）

```
src/
├── core/          # 合并 core + security + tenant（auth/permissions/tenancy/http/audit/crypto/observability）
├── platform/      # 合并 infrastructure + resilience（config/logger/prisma/redis/queue/dataloader/storage/resilience）
├── modules/       # 业务模块全部扁平（users/roles/menus/depts/posts/dicts/clients/notices/files/tenants/sms/mails/notifies/tools/monitors/...）
└── shared/        # 纯工具（dto/utils/constants/enums/decorators/validators/response/events）
```

### 模块内部扁平

```
modules/users/
├── users.module.ts
├── users.controller.ts
├── users.service.ts     # 合并后单文件，<= 1500 行，用 region 分组
├── users.repository.ts
├── users.constant.ts
├── users.decorator.ts
└── dto/
    ├── create-user.dto.ts
    ├── update-user.dto.ts
    ├── list-user.dto.ts
    └── user.dto.ts
```

### 数据库 schema

- 表名：`snake_case` 复数（`users`/`roles`/`auth_sessions`）
- 主键：`BigInt`
- 软删除：`deletedAt DateTime?`（非字符串 `del_flag`）
- 基础字段：`tenantId`/`createdAt`/`updatedAt`/`createdBy`/`updatedBy`/`deletedBy`/`version`
- 新增表：`auth_sessions`/`refresh_tokens`/`login_attempts`/`mfa_factors`/`online_users`/`notification_reads`
- 重命名：`sys_user → users`/`sys_role → roles`/`sys_tenant → tenants` 等 50+ 张表

---

## 阶段 0：准备与基线（0.5 天）

| 任务 | 说明 |
|------|------|
| 备份基线 | `git tag before-refactor-$(date +%Y%m%d)` |
| 备份数据库 | `pg_dump -Fc > backup-before-schema-$(date +%Y%m%d).dump` |
| 基线验证 | `pnpm typecheck && pnpm build && pnpm test` 通过 |
| 检测循环依赖 | `npx madge --circular --extensions ts src/` 记录基线 |
| 编写迁移脚本 | `scripts/refactor/{move-files,rewrite-imports,merge-services,flatten-dtos,check-unused}.ts` |
| 验证脚本 | `scripts/refactor/verify.ts` |

---

## 阶段 1：基础设施 + 顶层目录合并（1.5 天）

**不做任何业务逻辑，仅文件移动 + import 重写。**

### 1.1 合并底层目录

| 原 | 新 |
|----|----|
| `infrastructure/logging/*` | `platform/logger/*` |
| `infrastructure/prisma/*` | `platform/prisma/*` |
| `infrastructure/cache/*` + `module/common/redis/*` | `platform/redis/*` |
| `module/common/bull/*` | `platform/queue/*` |
| `module/common/axios/*` | `modules/axios/*` |
| `infrastructure/dataloader/*` | `platform/dataloader/*` |
| `infrastructure/repository/*` | `platform/repository/*` |
| `module/resource/oss*` | `platform/storage/*` |
| `observability/{metrics,tracing}/*` | `core/observability/{metrics,tracing}/*` |
| `observability/audit/*` | `core/audit/*` |
| `resilience/*` | `platform/resilience/*` |

### 1.2 合并 core + security + tenant

| 原 | 新 |
|----|----|
| `core/guards/auth.guard` | `core/auth/guards/auth.guard` |
| `core/guards/permission.guard` + `roles.guard` | `core/permissions/guards/` |
| `core/guards/{throttle,multi-throttle}` | `core/http/guards/` |
| `core/decorators/api*` | `core/http/decorators/` |
| `core/decorators/{audit,operlog}.decorator` | `core/audit/decorators/` |
| `core/decorators/{data-permission,permission,role}` | `core/permissions/decorators/` |
| `core/decorators/{idempotent,lock,retry,circuit-breaker,system-cache,task}` | `core/http/decorators/` |
| `core/decorators/transactional` | `core/http/transaction/` |
| `core/decorators/{public,captcha,common,redis}` | `core/auth/decorators/` |
| `core/decorators/tenant-job` | `core/tenancy/decorators/` |
| `core/{filters,interceptors,middleware,transaction}` | `core/http/` |
| `core/constants/*` | 按用途分到 core 子目录或 shared/constants |
| `security/*` | `core/auth/*` |
| `security/mfa/*` | `core/auth/mfa/*` |
| `security/crypto/*` | `core/crypto/*` |
| `tenant/*` | `core/tenancy/*` |

### 1.3 脚本核心

约 60 条路径重写规则，扫描所有 `.ts` 文件改写 import，输出 `migration-report.md`。

### 1.4 验证

- `pnpm typecheck && pnpm build && pnpm test` 通过
- `curl /api/v1/health` 返回 200
- madge 循环依赖 ≤ 基线

---

## 阶段 2：业务模块重组 + service 合并 + DTO 扁平化（2-3 天）

### 2.1 顶层模块合并

| 原 | 新 |
|----|----|
| `module/main/*` | `modules/auth/*` |
| `module/system/{user,role,menu,dept,post,dict,client,notice}` | `modules/{users,roles,menus,depts,posts,dicts,clients,notices}` |
| `module/system/mail/{account,log,template,send}` | `modules/mails/{accounts,logs,templates,send}` |
| `module/system/sms/{channel,log,template,send}` | `modules/sms/{channels,logs,templates,send}` |
| `module/system/notify/{message,template}` | `modules/notifies/{messages,templates}` |
| `module/system/tenant` | `modules/tenants` |
| `module/system/tenant/{quota,audit,dashboard}` | `modules/tenant-{quotas,audits,dashboards}` |
| `module/system/tenant-package` | `modules/tenant-packages` |
| `module/system/{config,system-config}` | `modules/configs`（合并） |
| `module/system/{file-manager,upload}` + `module/upload` | `modules/files`（合并） |
| `module/system/tool` | `modules/tools` |
| `module/system/docs` | `modules/docs` |
| `module/monitor/{server,cache,metrics,online,job}` | `modules/monitors/{server,cache,metrics,online,jobs}` |
| `module/monitor/{loginlog,operlog,health}` | `modules/{login-logs,oper-logs,health}` |
| `module/backup` | `modules/backup` |

### 2.2 service 合并

有 `services/` 子目录的模块：user、file-manager、upload、mail、sms、notify。

合并策略：7 个 `services/*.service.ts` + 1 个主 `user.service.ts` → 1 个 `users.service.ts`，用 `// region:` 注释分组。≤ 1500 行；超过才按业务能力拆（仍在模块根目录）。

### 2.3 DTO 扁平化

- `dto/requests/create-user.request.dto.ts` → `dto/create-user.dto.ts`
- `dto/responses/user.response.dto.ts` → `dto/user.dto.ts`
- `dto/index.ts` → **删除**

### 2.4 验证

- `pnpm typecheck && pnpm build && pnpm test` 通过
- E2E 冒烟测试：登录、用户、角色、文件、多租户

---

## 阶段 3：Harness Engineering（1-1.5 天）

### 3.1 文档体系

| 文件 | 内容 |
|------|------|
| `AGENTS.md` | AI 必读规则入口、禁止事项、提交前检查 |
| `docs/engineering/constitution.md` | 技术栈、目录边界、API 契约、数据库规范、AI 底线 |
| `docs/engineering/architecture.md` | 引用 backend-architecture.md 核心内容 |
| `docs/engineering/coding-standards.md` | TS 规范、NestJS 约束、DTO 命名、Service 合并规则 |
| `docs/engineering/review-checklist.md` | 后端/前端/数据库 review 检查项 |
| `docs/specs/_template/` | 6 文件模板（spec/api/data/ui/tasks/acceptance） |
| `docs/specs/user-management/` | 完整示范 |

### 3.2 ESLint 规则

**apps/server/.eslintrc.js**：

```javascript
// 禁止 controller import Prisma/repository
// 禁止 DTO import @prisma/client
// 禁止跨模块 import repository
// import 排序
```

**apps/web/eslint.config.js**：

```javascript
// 禁止 import '@/typings/api/**'，用 generated client
```

### 3.3 harness/scripts 验证脚本

| 脚本 | 作用 |
|------|------|
| `check-boundaries.ts` | controller → Prisma、跨模块 repository |
| `check-generated.ts` | generated 文件被手改 |
| `check-spec.ts` | spec 包文件完整 |
| `verify.ts` | 聚合所有检查 |

### 3.4 验证

- `pnpm harness:verify` 通过
- 故意违规能被捕获

---

## 阶段 4：数据库 schema 全面重构（2-3 天）

### 4.1 字段级统一改造

所有表改造为：

```prisma
model User {
  id        BigInt    @id @default(autoincrement())
  tenantId  String    @map("tenant_id") @db.VarChar(64)
  deletedAt DateTime? @map("deleted_at") @db.Timestamptz(6)  // 原 del_flag
  deletedBy BigInt?   @map("deleted_by")
  createdAt DateTime  @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt DateTime  @updatedAt @map("updated_at") @db.Timestamptz(6)
  createdBy BigInt?   @map("created_by")
  updatedBy BigInt?   @map("updated_by")
  version   Int       @default(0)
  // ... 业务字段
  @@map("users")
}
```

### 4.2 表重命名映射（50+ 张）

| 旧 | 新 | 备注 |
|----|----|------|
| `sys_user` | `users` | |
| `sys_role` | `roles` | |
| `sys_menu` | `menus` | |
| `sys_dept` | `departments` | |
| `sys_post` | `posts` | |
| `sys_user_role` | `user_roles` | |
| `sys_role_menu` | `role_menus` | |
| `sys_role_dept` | `role_data_scope_departments` | |
| `sys_user_post` | `user_posts` | |
| `sys_dict_type` | `dict_types` | |
| `sys_dict_data` | `dict_items` | |
| `sys_config` | `system_configs` | |
| `sys_tenant` | `tenants` | |
| `sys_tenant_package` | `tenant_packages` | |
| `sys_tenant_quota` | `tenant_quotas` | |
| `sys_audit_log` + `sys_tenant_audit_log` | `audit_logs` | 合并 |
| `sys_oper_log` | `operation_logs` | |
| `sys_logininfor` | `login_logs` | |
| `sys_notice` | `notices` | |
| `sys_notify_message` | `notification_messages` | |
| `sys_notify_template` | `notification_templates` | |
| `sys_job` | `jobs` | |
| `sys_job_log` | `job_runs` | |
| `sys_mail_*` | `mail_*` | |
| `sys_sms_*` | `sms_*` | |
| `sys_upload` | `files` | |
| `sys_oss` | `storage_providers` | |
| `sys_oss_config` | `storage_provider_configs` | |
| `sys_file_folder` | `file_folders` | |
| `sys_file_share` | `file_shares` | |
| `sys_client` | `clients` | |
| `gen_*` | `gen_*` | 保留 |

### 4.3 新增表（6 张）

`auth_sessions`（设备管理）、`refresh_tokens`（token 轮换）、`login_attempts`（登录审计）、`mfa_factors`（TOTP/备份码）、`online_users`（在线用户）、`notification_reads`（已读状态）。

### 4.4 索引原则

租户级表优先索引：`(tenant_id, deleted_at, created_at DESC)`；unique 约束带 `tenant_id`；软删除表用 partial index `WHERE deleted_at IS NULL`。

### 4.5 迁移方式

`prisma migrate dev` 生成 migration，手工编写迁移 SQL：
1. 创建新表结构
2. 数据迁移（`del_flag='0' → deleted_at IS NULL`）
3. 切换表名（`_old` 备份）
4. 创建索引和约束
5. 编写 rollback.sql

### 4.6 代码同步

- `prisma generate` 后 TS 代码批量替换：`SysUser → User`、`delFlag → deletedAt` 等
- Repository 加 Tenant Extension：自动追加 `WHERE tenantId = ? AND deletedAt IS NULL`
- 所有 `.repository.ts` 中 Prisma where 去掉 `delFlag`，由 extension 自动处理

### 4.7 验证

- `prisma migrate dev` 成功
- 数据行数与基线一致
- 所有 E2E 测试通过
- rollback.sql 可执行

---

## 阶段 5：前端 OpenAPI 自动化（1.5 天，独立 PR）

### 5.1 新建 packages/contracts

```
packages/contracts/
├── package.json
├── openapi/openapi.json
├── permissions/permission-codes.ts
├── errors/error-codes.ts
└── pagination/pagination.schema.ts
```

### 5.2 后端导出脚本

`apps/server/scripts/export-openapi.ts`：启动 app、调 SwaggerModule、输出 JSON。

### 5.3 前端生成 client

- `openapi-typescript` 生成器
- 输出到 `apps/web/src/api/generated/`
- `pnpm gen:api`

### 5.4 改造前端

- `service/api/` 引用 generated client
- 删除 `typings/api/` 中被 generated 覆盖的手写类型

### 5.5 验证

- `pnpm typecheck && pnpm build` 通过
- 关键 API 端到端测试

---

## 风险与缓解

| 风险 | 缓解 |
|------|------|
| import 改写出错 | 脚本自动化 + 每阶段 typecheck |
| service 合并行为偏差 | E2E 测试对比 |
| 数据库迁移失败 | `pg_dump` 备份 + rollback.sql，测试环境先跑 |
| 数据丢失 | 迁移后行数对比校验 |
| 跨模块 Prisma 引用 | 脚本批量替换 + ESLint check-boundaries |
| 循环依赖增加 | madge 检测对比基线 |

---

## 预估时间

| 阶段 | 工作量 | 累计 |
|------|--------|------|
| 阶段 0：基线 | 0.5 天 | 0.5 天 |
| 阶段 1：基础设施 + 顶层目录 | 1.5 天 | 2 天 |
| 阶段 2：业务模块重组 | 2-3 天 | 4-5 天 |
| 阶段 3：Harness Engineering | 1-1.5 天 | 5-6.5 天 |
| 阶段 4：数据库重构 | 2-3 天 | 7-9.5 天 |
| 阶段 5：前端 OpenAPI | 1.5 天 | 8.5-11 天 |

**总预估：8.5-11 个工作日**

## 交付 PR

- **PR 1**（阶段 0-2）：后端目录结构 + service 合并 + DTO 扁平化
- **PR 2**（阶段 3）：Harness Engineering
- **PR 3**（阶段 4）：数据库重构
- **PR 4**（阶段 5）：前端 OpenAPI

## 不在本次范围

- 不修改 API 接口（HTTP 路径、请求响应格式）
- 不引入微服务、新的状态管理
- 前端 UI 不动
- 不补 policy 层、不分 application/domain/persistence
- 不为每个模块加 events/
- 不为现有功能重写 spec（只建模板 + 1 个示范）
