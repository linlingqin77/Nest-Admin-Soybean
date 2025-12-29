# 测试修复策略

## 当前状态
- 失败的测试套件: 44/72
- 通过的测试套件: 28/72
- 失败的测试: 111
- 通过的测试: 347

## 主要问题类型

### 1. DTO 对象缺少方法 (getOrderBy, getDateRange)

**问题**: 测试中直接传递普通对象，而不是 DTO 实例

**解决方案**:
```typescript
// 错误的方式
await service.findAll({ pageNum: 1, pageSize: 10 });

// 正确的方式
import { plainToInstance } from 'class-transformer';
import { ListXxxDto } from './dto/list-xxx.dto';

const query = plainToInstance(ListXxxDto, { pageNum: 1, pageSize: 10 });
await service.findAll(query);
```

**需要修复的文件**:
- 所有使用分页查询的 service.spec.ts 文件
- 特别是 monitor 和 system 模块下的服务测试

### 2. Prisma Mock 类型问题

**问题**: 使用 `MockServiceFactory.createPrismaService()` 创建的 mock 没有正确的类型

**解决方案**:
```typescript
// 错误的方式
import { MockServiceFactory } from 'src/test-utils/mocks/service.mock';
useValue: MockServiceFactory.createPrismaService()

// 正确的方式
import { createPrismaMock } from 'src/test-utils/prisma-mock';
useValue: createPrismaMock()

// 在测试中使用时需要类型转换
(prisma.sysUser.findMany as jest.Mock).mockResolvedValue([]);
(prisma.$transaction as jest.Mock).mockResolvedValue([[], 0]);
```

**需要修复的文件**:
- 所有直接使用 PrismaService 的测试文件
- 特别是需要 mock Prisma 方法的测试

### 3. 枚举值错误

**问题**: 使用了错误的枚举值

**解决方案**:
```typescript
// 错误
Status.DISABLE

// 正确
Status.DISABLED
```

### 4. DTO 类型不完整

**问题**: 创建 DTO 对象时缺少必需字段

**解决方案**: 查看 DTO 定义，确保包含所有必需字段

例如 `UpdateConfigDto` 需要:
- configId
- configName
- configKey
- configValue
- configType

## 批量修复步骤

### 步骤 1: 修复所有 DTO 相关问题
1. 在所有 service.spec.ts 文件顶部添加导入:
   ```typescript
   import { plainToInstance } from 'class-transformer';
   import { ListXxxDto } from './dto/list-xxx.dto';
   ```

2. 替换所有直接传递对象的地方:
   ```typescript
   const query = plainToInstance(ListXxxDto, { pageNum: 1, pageSize: 10, ...otherFields });
   await service.findAll(query);
   ```

### 步骤 2: 修复所有 Prisma Mock 问题
1. 替换 MockServiceFactory.createPrismaService() 为 createPrismaMock()
2. 添加类型转换到所有 mock 调用

### 步骤 3: 修复枚举值
1. 全局搜索 `Status.DISABLE` 并替换为 `Status.DISABLED`

### 步骤 4: 修复 DTO 类型不完整问题
1. 检查每个 DTO 的定义
2. 确保测试中创建的对象包含所有必需字段

## 已修复的文件
- ✅ server/src/module/monitor/loginlog/loginlog.service.spec.ts
- ✅ server/src/module/monitor/operlog/operlog.service.spec.ts
- ✅ server/src/module/monitor/metrics/metrics.controller.spec.ts
- ✅ server/src/module/system/config/config.service.spec.ts (部分)
- ✅ server/src/module/common/redis/cache-manager.service.spec.ts (部分)
- ✅ server/src/module/monitor/job/job-log.service.spec.ts

## 待修复的文件 (优先级排序)

### 高优先级 (核心业务模块)
1. server/src/module/system/user/user.service.spec.ts
2. server/src/module/system/user/user.controller.spec.ts
3. server/src/module/system/dept/dept.controller.spec.ts
4. server/src/module/system/role/role.controller.spec.ts
5. server/src/module/system/menu/menu.controller.spec.ts

### 中优先级 (系统配置模块)
6. server/src/module/system/dict/dict.service.spec.ts
7. server/src/module/system/dict/dict.controller.spec.ts
8. server/src/module/system/config/config.controller.spec.ts
9. server/src/module/system/notice/notice.service.spec.ts
10. server/src/module/system/notice/notice.controller.spec.ts
11. server/src/module/system/post/post.service.spec.ts
12. server/src/module/system/post/post.controller.spec.ts

### 低优先级 (其他模块)
13. server/src/module/system/tenant/tenant.service.spec.ts
14. server/src/module/system/tenant/tenant.controller.spec.ts
15. server/src/module/system/system-config/system-config.service.spec.ts
16. server/src/module/main/main.controller.spec.ts

## 自动化修复脚本建议

可以创建一个脚本来自动化一些常见的修复:

```typescript
// scripts/fix-tests.ts
import * as fs from 'fs';
import * as path from 'path';

// 1. 替换 Status.DISABLE 为 Status.DISABLED
// 2. 添加必要的导入
// 3. 替换 MockServiceFactory.createPrismaService() 为 createPrismaMock()
```

## 下一步行动

1. 继续修复高优先级的测试文件
2. 运行测试验证修复
3. 重复直到所有测试通过
4. 更新 tasks.md 标记任务完成
