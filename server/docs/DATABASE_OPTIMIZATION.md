# Database Performance Optimization Report

## 概述

本文档记录了针对 Nest-Admin-Soybean 后端系统的数据库性能优化工作，包括索引优化和 N+1 查询问题的解决方案。

## 1. 数据库索引优化

### 1.1 已添加的索引

#### SysDept（部门表）
```prisma
@@index([tenantId, delFlag, status])
@@index([parentId])
```
- **优化场景**：部门列表查询、租户隔离查询
- **预期效果**：提升部门筛选和树形结构构建速度

#### SysMenu（菜单表）
```prisma
@@index([tenantId, delFlag, status])
@@index([parentId, orderNum])
```
- **优化场景**：菜单权限查询、路由构建
- **预期效果**：加速用户权限菜单加载，优化树形菜单排序

#### SysPost（岗位表）
```prisma
@@index([tenantId, delFlag, status])
```
- **优化场景**：岗位列表查询
- **预期效果**：提升岗位数据过滤性能

#### SysOperLog（操作日志表）
```prisma
@@index([tenantId, status, operTime])
@@index([tenantId, operName, operTime])
```
- **优化场景**：日志查询、用户操作记录审计
- **预期效果**：显著提升日志检索速度

#### SysLogininfor（登录日志表）
```prisma
@@index([tenantId, status, loginTime])
@@index([tenantId, userName, loginTime])
```
- **优化场景**：登录历史查询、安全审计
- **预期效果**：加速用户登录记录检索

### 1.2 索引选择原则

1. **租户隔离优先**：所有多租户表的索引都包含 `tenantId` 字段
2. **常用筛选条件**：`delFlag`、`status` 等高频过滤字段
3. **排序字段**：`orderNum`、`loginTime`、`operTime` 等排序字段
4. **外键字段**：`parentId` 等关联查询字段

### 1.3 迁移记录

- Migration: `20251219070121_test` - SysNotice 索引
- Migration: `20251219071104_test1` - 其他系统表索引

## 2. N+1 查询优化

### 2.1 已优化的场景

#### UserService.attachDeptInfo()
**问题**：循环查询用户所属部门信息
```typescript
// ❌ 优化前（N+1 查询）
for (const user of users) {
  user.dept = await prisma.sysDept.findUnique({
    where: { deptId: user.deptId }
  });
}
```

**解决方案**：批量查询 + 内存映射
```typescript
// ✅ 优化后（单次查询）
const deptIds = users.map(u => u.deptId).filter(Boolean);
const depts = await prisma.sysDept.findMany({
  where: { deptId: { in: deptIds } }
});
const deptMap = new Map(depts.map(d => [d.deptId, d]));
users.forEach(user => {
  user.dept = deptMap.get(user.deptId);
});
```

### 2.2 推荐优化的场景

#### RoleService.getPermissionsByRoleIds()
**当前实现**：
```typescript
const roleMenus = await prisma.sysRoleMenu.findMany({
  where: { roleId: { in: roleIds } },
  select: { menuId: true }
});
const menuIds = roleMenus.map(rm => rm.menuId);
const menus = await prisma.sysMenu.findMany({
  where: { menuId: { in: menuIds } }
});
```
**状态**：✅ 已优化（使用批量查询）

#### MenuService 树形结构构建
**当前实现**：
```typescript
const menus = await prisma.sysMenu.findMany({
  where: { ... },
  orderBy: [{ parentId: 'asc' }, { orderNum: 'asc' }]
});
return this.buildMenuTree(menus);
```
**状态**：✅ 已优化（单次查询 + 内存构建）

### 2.3 优化最佳实践

1. **批量查询模式**
   ```typescript
   // 收集所有需要查询的ID
   const ids = entities.map(e => e.foreignId).filter(Boolean);
   
   // 单次批量查询
   const related = await prisma.relatedTable.findMany({
     where: { id: { in: ids } }
   });
   
   // 构建映射表
   const relatedMap = new Map(related.map(r => [r.id, r]));
   
   // 内存关联
   entities.forEach(e => {
     e.related = relatedMap.get(e.foreignId);
   });
   ```

2. **Prisma Include 优化**
   ```typescript
   // 使用 Prisma 关系查询自动优化
   const users = await prisma.sysUser.findMany({
     include: {
       dept: true,  // Prisma 自动使用 JOIN
       roles: {
         include: {
           role: true
         }
       }
     }
   });
   ```

3. **Select 字段优化**
   ```typescript
   // 只查询需要的字段
   const users = await prisma.sysUser.findMany({
     select: {
       userId: true,
       userName: true,
       dept: {
         select: {
           deptId: true,
           deptName: true
         }
       }
     }
   });
   ```

## 3. 性能监控建议

### 3.1 慢查询监控

在 `prisma.service.ts` 中添加查询时间日志：
```typescript
this.$use(async (params, next) => {
  const start = Date.now();
  const result = await next(params);
  const duration = Date.now() - start;
  
  if (duration > 1000) {
    this.logger.warn({
      model: params.model,
      action: params.action,
      duration: `${duration}ms`
    }, 'Slow query detected');
  }
  
  return result;
});
```

### 3.2 查询分析工具

```bash
# PostgreSQL 慢查询日志
ALTER DATABASE nest_admin SET log_min_duration_statement = 1000;

# 查看查询执行计划
EXPLAIN ANALYZE SELECT * FROM sys_user WHERE tenant_id = '000000';
```

## 4. 优化效果评估

### 4.1 预期性能提升

| 场景 | 优化前 | 优化后 | 提升 |
|------|--------|--------|------|
| 用户列表查询（100条） | ~500ms | ~50ms | 90% |
| 菜单权限加载 | ~300ms | ~30ms | 90% |
| 操作日志查询（分页） | ~1000ms | ~100ms | 90% |
| 部门树构建 | ~200ms | ~40ms | 80% |

### 4.2 监控指标

- 数据库连接池使用率：< 70%
- 平均查询响应时间：< 100ms
- P95 查询响应时间：< 500ms
- 慢查询数量：0 queries > 1s

## 5. 后续优化方向

1. **读写分离**：配置主从数据库，读请求分发到从库
2. **查询缓存**：使用 Redis 缓存高频查询结果
3. **分表分库**：按租户 ID 或时间维度分表（日志表）
4. **物化视图**：预计算复杂统计查询
5. **全文搜索**：使用 PostgreSQL 全文索引或 Elasticsearch

## 6. 注意事项

1. **索引维护成本**：索引会增加写入开销，需权衡读写比例
2. **索引选择性**：低选择性字段（如 status）不适合单独索引
3. **复合索引顺序**：遵循"最左前缀"原则
4. **定期分析**：执行 `ANALYZE` 更新统计信息
5. **索引监控**：定期检查未使用的索引，避免浪费

## 7. 相关文档

- [Multi-Tenant Migration Guide](./MULTI_TENANT_MIGRATION.md)
- [Logging and Monitoring](./LOGGING_MONITORING.md)
- [Prisma Best Practices](https://www.prisma.io/docs/guides/performance-and-optimization)
