# Review Checklist

## PR 创建前必检

### 功能正确性
- [ ] 满足 `docs/specs/{feature}/spec.md` 中的所有需求
- [ ] 新增 API 有对应的单元测试（覆盖率 ≥ 80%）
- [ ] 边界条件已处理（空值、非法输入、超长数据）
- [ ] 错误码符合 `packages/contracts/errors/`

### 架构合规
- [ ] Controller 未直接 import `@prisma/client`
- [ ] Controller 未直接 import `PrismaService`
- [ ] 无跨模块 `*.repository` import
- [ ] 无循环依赖
- [ ] service 文件行数 ≤ 1500

### 数据库
- [ ] 迁移脚本已生成（`prisma migrate dev`）
- [ ] 迁移脚本有 rollback
- [ ] 软删除表使用了 `deleted_at` 而非 `del_flag`
- [ ] 索引已添加（tenant_id 组合索引）
- [ ] 新增字段不影响现有数据

### 安全
- [ ] 权限码已注册在 `packages/contracts/permissions/`
- [ ] 无 SQL 注入风险（用 Prisma 参数化查询）
- [ ] 敏感字段（密码、token）未泄漏到响应
- [ ] 导出接口有权限校验

### OpenAPI
- [ ] Controller 有 `@ApiTags` 和 `@ApiOperation` 装饰器
- [ ] 请求/响应 DTO 有 `@ApiProperty` 文档
- [ ] 错误响应有 `@ApiResponse`
- [ ] `packages/contracts/` 已同步更新

### 前端（如涉及）
- [ ] API client 已重新生成（`pnpm openapi-typescript`）
- [ ] 类型导入来自 `api/generated`
- [ ] 页面已替换硬编码的类型

### 测试
- [ ] 核心业务逻辑有单元测试
- [ ] 关键 API 有集成测试
- [ ] 测试不依赖外部真实服务（Mock 到位）

### 代码质量
- [ ] `pnpm lint` 通过
- [ ] `pnpm typecheck` 通过
- [ ] 无 TODO、FIXME、XXX（未解决的）
- [ ] 日志级别合理（DEBUG/INFO/WARN/ERROR）
- [ ] 无 `console.log`
