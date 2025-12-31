# N+1 查询分析报告

## 概述

本文档分析了 Nest-Admin-Soybean 后端服务中的 N+1 查询问题，并提供了使用 DataLoader 模式的优化方案。

## 什么是 N+1 查询问题

N+1 查询问题是指在获取关联数据时，首先执行 1 次查询获取主数据列表，然后对列表中的每一项执行 N 次额外查询获取关联数据。这会导致数据库查询次数随数据量线性增长，严重影响性能。

## 已识别的 N+1 查询场景

### 1. UserService.findAll() - 用户列表查询

**位置**: `server/src/module/system/user/user.service.ts`

**问题描述**:
- 查询用户列表后，调用 `attachDeptInfo()` 批量获取部门信息
- 当前实现已经使用批量查询优化，不存在 N+1 问题

**当前实现** (已优化):
```typescript
private async attachDeptInfo(users: SysUser[]): Promise<UserWithDept[]> {
  const deptIds = Array.from(new Set(users.map(item => item.deptId).filter(...)));
  const depts = await this.prisma.sysDept.findMany({
    where: { deptId: { in: deptIds } }
  });
  // 使用 Map 进行 O(1) 查找
  const deptMap = new Map(depts.map(dept => [dept.deptId, dept]));
  return users.map(item => ({ ...item, dept: deptMap.get(item.deptId) }));
}
```

### 2. UserService.findOne() - 用户详情查询

**位置**: `server/src/module/system/user/user.service.ts`

**问题描述**:
- 查询单个用户时，需要获取部门、岗位、角色等关联数据
- 当前使用 `Promise.all` 并行查询，减少了总耗时
- 可以进一步使用 DataLoader 在请求级别缓存

**当前实现**:
```typescript
const [dept, postList, allPosts, roleIds, allRoles] = await Promise.all([
  data?.deptId ? this.prisma.sysDept.findFirst(...) : Promise.resolve(null),
  this.prisma.sysUserPost.findMany({ where: { userId } }),
  this.prisma.sysPost.findMany(...),
  this.getRoleIds([userId]),
  this.roleService.findRoles(...)
]);
```

**优化建议**: 使用 DeptLoader 和 RoleLoader 进行请求级别缓存

### 3. UserService.buildDataScopeConditions() - 数据权限构建

**位置**: `server/src/module/system/user/user.service.ts`

**问题描述**:
- 遍历用户角色，根据数据权限范围查询部门
- 已优化为批量收集后统一查询

**当前实现** (已优化):
```typescript
// 批量查询自定义数据范围的部门
if (customRoleIds.length > 0) {
  const roleDeptRows = await this.prisma.sysRoleDept.findMany({
    where: { roleId: { in: customRoleIds } }
  });
  roleDeptRows.forEach(row => deptIdSet.add(row.deptId));
}
```

### 4. RoleService.getPermissionsByRoleIds() - 角色权限查询

**位置**: `server/src/module/system/role/role.service.ts`

**问题描述**:
- 根据角色 ID 列表获取权限
- 已优化为两次批量查询

**当前实现** (已优化):
```typescript
const roleMenuRows = await this.prisma.sysRoleMenu.findMany({
  where: { roleId: { in: roleIds } }
});
const menuIds = Uniq(roleMenuRows.map(row => row.menuId));
const permissions = await this.prisma.sysMenu.findMany({
  where: { menuId: { in: menuIds } }
});
```

### 5. RoleRepository.findPageWithMenuCount() - 角色列表查询

**位置**: `server/src/module/system/role/role.repository.ts`

**问题描述**:
- 查询角色列表后，需要获取每个角色的菜单数量
- 已使用 groupBy 优化为单次聚合查询

**当前实现** (已优化):
```typescript
const menuCounts = await this.prisma.sysRoleMenu.groupBy({
  by: ['roleId'],
  where: { roleId: { in: roleIds } },
  _count: { menuId: true }
});
```

## DataLoader 实现

### 已实现的 DataLoader

1. **UserLoader** (`server/src/common/dataloader/user.loader.ts`)
   - `load(userId)` - 加载单个用户
   - `loadMany(userIds)` - 批量加载用户
   - `loadWithDept(userIds)` - 加载用户及部门信息
   - `loadUserRoleIds(userIds)` - 加载用户角色 ID
   - `loadUserPostIds(userIds)` - 加载用户岗位 ID

2. **DeptLoader** (`server/src/common/dataloader/dept.loader.ts`)
   - `load(deptId)` - 加载单个部门
   - `loadMany(deptIds)` - 批量加载部门
   - `loadWithChildren(deptIds)` - 加载部门及子部门
   - `loadDirectChildren(parentIds)` - 加载直接子部门
   - `loadUserCounts(deptIds)` - 加载部门用户数量
   - `loadAncestors(deptIds)` - 加载部门祖先链

3. **RoleLoader** (`server/src/common/dataloader/role.loader.ts`)
   - `load(roleId)` - 加载单个角色
   - `loadMany(roleIds)` - 批量加载角色
   - `loadByUserIds(userIds)` - 按用户 ID 加载角色
   - `loadMenuIds(roleIds)` - 加载角色菜单 ID
   - `loadDeptIds(roleIds)` - 加载角色部门 ID（数据权限）
   - `loadPermissions(roleIds)` - 加载角色权限
   - `loadUserCounts(roleIds)` - 加载角色用户数量

### DataLoader 使用示例

```typescript
// 在 Service 中注入
constructor(
  private readonly userLoader: UserLoader,
  private readonly deptLoader: DeptLoader,
  private readonly roleLoader: RoleLoader,
) {}

// 批量加载用户
async getUsersWithDetails(userIds: number[]) {
  // 这些调用会被合并为一次数据库查询
  const users = await this.userLoader.loadMany(userIds);
  
  // 批量加载部门
  const deptIds = users.map(u => u?.deptId).filter(Boolean);
  const depts = await this.deptLoader.loadMany(deptIds);
  
  // 批量加载角色
  const roleMap = await this.roleLoader.loadByUserIds(userIds);
  
  return users.map(user => ({
    ...user,
    dept: depts.find(d => d?.deptId === user?.deptId),
    roles: roleMap.get(user?.userId) ?? []
  }));
}
```

## 性能对比

| 场景 | 优化前查询次数 | 优化后查询次数 | 改善 |
|------|--------------|--------------|------|
| 查询 100 个用户及部门 | 101 次 | 2 次 | 98% |
| 查询 50 个角色及权限 | 51 次 | 2 次 | 96% |
| 查询用户详情（含角色、部门、岗位） | 5 次 | 5 次（并行） | 响应时间减少 |

## 最佳实践

1. **使用 DataLoader 进行请求级别缓存**
   - DataLoader 在同一请求周期内自动合并和缓存查询
   - 适用于需要多次查询相同数据的场景

2. **批量查询优化**
   - 使用 `findMany` + `where: { id: { in: ids } }` 替代循环查询
   - 使用 `groupBy` 进行聚合统计

3. **并行查询**
   - 使用 `Promise.all` 并行执行独立查询
   - 减少总响应时间

4. **使用 Map 进行 O(1) 查找**
   - 将查询结果转换为 Map
   - 避免在循环中使用 `find` 进行 O(n) 查找

## 结论

当前代码库中的大部分 N+1 查询问题已经通过批量查询和并行查询进行了优化。新增的 DataLoader 模块提供了更强大的请求级别缓存能力，可以进一步优化复杂场景下的数据加载性能。
