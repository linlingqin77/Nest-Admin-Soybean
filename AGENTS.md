# Agent Rules

> **AI 协作者必读规则**。所有 AI（Claude Code / Cursor / 其他）在参与本项目前必须阅读并遵守。

## 核心原则

1. **严格遵循** [docs/engineering/constitution.md](./docs/engineering/constitution.md)
2. **没有 spec 不写功能代码**：新功能必须先有 `docs/specs/{feature}/` 规格包
3. **不修改 generated 文件**：见 `harness/rules/generated-files.json`
4. **后端调用链**：`controller -> service -> repository -> prisma`
5. **禁止 controller 直接 import @prisma/client**
6. **禁止跨模块 import *.repository**
7. **变更 API 前必须更新 OpenAPI 契约**

## 提交前自检

```bash
pnpm harness:verify
```

这一步会跑：

- `harness:check-boundaries` — 检查 controller → Prisma、跨模块 repository 越界
- `harness:check-generated` — 检查 generated 文件被手改
- `lint` + `typecheck` + `test` + `build`

任何一项失败，**禁止提交**。

## 禁止事项

- ❌ 不要绕过架构边界
- ❌ 不要脑补 API 字段、权限码、错误码
- ❌ 不要手改 generated 文件
- ❌ 不要做无关重构
- ❌ 不要跳过测试

## 任务流程

```
读规则 (AGENTS.md)
   ↓
读 spec (docs/specs/{feature}/spec.md)
   ↓
按 skill 做事 (harness/skills/)
   ↓
按 contract 改接口 (packages/contracts/)
   ↓
按 checklist 自查 (harness/checklists/)
   ↓
按 script 验证 (harness/scripts/verify)
   ↓
提交
```

## 详细规范

- 后端架构：[docs/development/backend-architecture.md](./docs/development/backend-architecture.md)
- 编码规范：[docs/engineering/coding-standards.md](./docs/engineering/coding-standards.md)
- Review 清单：[docs/engineering/review-checklist.md](./docs/engineering/review-checklist.md)
- Spec 模板：[docs/specs/_template/](./docs/specs/_template/)
