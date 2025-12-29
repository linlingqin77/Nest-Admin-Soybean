# E2E 测试种子数据

本目录包含用于 E2E 测试的种子数据脚本。

## 概述

测试种子数据用于在 E2E 测试前预置必要的测试数据，包括：

- **测试用户** - 不同权限级别的测试用户
- **测试部门** - 多层级的测试部门结构
- **测试角色** - 不同权限范围的测试角色

## 数据标识

所有测试数据都有明确的标识，便于识别和清理：

- **用户**: `userType='99'` 或 `userName` 以 `test_` 开头
- **部门**: `deptName` 以 `E2E测试` 开头或 `deptId` 在 9000-9999 范围
- **角色**: `roleName` 以 `E2E测试` 开头或 `roleId` 在 9000-9999 范围

## 使用方法

### 在 E2E 测试中使用

```typescript
import { seedAllTestData, cleanupAllTestData } from './seeds';
import { PrismaClient } from '@prisma/client';

describe('E2E Tests', () => {
  let prisma: PrismaClient;

  beforeAll(async () => {
    prisma = new PrismaClient();
    await seedAllTestData(prisma);
  });

  afterAll(async () => {
    await cleanupAllTestData(prisma);
    await prisma.$disconnect();
  });

  // 测试用例...
});
```

### 单独使用种子函数

```typescript
import { seedTestUsers, seedTestDepts, seedTestRoles } from './seeds';

// 只创建测试用户
await seedTestUsers(prisma);

// 只创建测试部门
await seedTestDepts(prisma);

// 只创建测试角色
await seedTestRoles(prisma);
```

### 命令行执行

```bash
# 创建测试种子数据
npx ts-node test/seeds/run-seed.ts

# 清理测试数据
npx ts-node test/seeds/run-seed.ts --cleanup

# 重置测试数据（清理后重新创建）
npx ts-node test/seeds/run-seed.ts --reset
```

## 测试数据详情

### 测试用户

| 用户名 | 昵称 | 角色 | 状态 | 密码 |
|--------|------|------|------|------|
| test_admin | 测试管理员 | E2E测试管理员 | 正常 | test123456 |
| test_user | 测试用户 | E2E测试用户 | 正常 | test123456 |
| test_manager | 测试部门经理 | E2E测试部门经理 | 正常 | test123456 |
| test_disabled | 测试禁用用户 | - | 禁用 | test123456 |

### 测试部门

```
E2E测试部门 (9000)
├── E2E测试技术部 (9001)
│   └── E2E测试研发部 (9003)
├── E2E测试市场部 (9002)
└── E2E测试禁用部门 (9004) [禁用]
```

### 测试角色

| 角色ID | 角色名称 | 角色标识 | 数据权限 | 状态 |
|--------|----------|----------|----------|------|
| 9000 | E2E测试管理员 | test_admin | 全部数据 | 正常 |
| 9001 | E2E测试用户 | test_user | 自定义数据 | 正常 |
| 9002 | E2E测试部门经理 | test_manager | 本部门及以下 | 正常 |
| 9003 | E2E测试只读用户 | test_readonly | 仅本人数据 | 正常 |
| 9004 | E2E测试禁用角色 | test_disabled | 全部数据 | 禁用 |

## 注意事项

1. **数据隔离**: 测试数据使用特定的 ID 范围（9000-9999），避免与生产数据冲突
2. **自动清理**: 测试结束后应调用清理函数，避免数据残留
3. **密码安全**: 测试用户密码为 `test123456`，仅用于测试环境
4. **租户隔离**: 所有测试数据都属于默认租户 `000000`

## 文件说明

- `user.seed.ts` - 测试用户种子数据
- `dept.seed.ts` - 测试部门种子数据
- `role.seed.ts` - 测试角色种子数据
- `index.ts` - 统一导出和批量操作
- `run-seed.ts` - 命令行执行脚本
- `README.md` - 本文档
