# 类型安全开发指南

## 概述

本指南介绍了 Nest-Admin-Soybean 项目中类型安全改造的最佳实践和开发规范。

## 目录

- [类型安全原则](#类型安全原则)
- [Prisma 枚举使用](#prisma-枚举使用)
- [DTO 类型定义](#dto-类型定义)
- [Repository 类型安全](#repository-类型安全)
- [日志使用规范](#日志使用规范)
- [常量管理](#常量管理)
- [ESLint 规则](#eslint-规则)
- [常见问题](#常见问题)

---

## 类型安全原则

### 1. 禁止使用 any 类型

❌ **错误示例**:
```typescript
function processData(data: any) {
  return data.value;
}
```

✅ **正确示例**:
```typescript
interface DataType {
  value: string;
}

function processData(data: DataType): string {
  return data.value;
}
```

### 2. 显式声明函数返回类型

❌ **错误示例**:
```typescript
async function getUser(id: number) {
  return this.userRepository.findById(id);
}
```

✅ **正确示例**:
```typescript
async function getUser(id: number): Promise<User | null> {
  return this.userRepository.findById(id);
}
```

### 3. 使用类型守卫处理 null/undefined

❌ **错误示例**:
```typescript
const user = await this.getUser(id);
return user.name; // 可能为 null
```

✅ **正确示例**:
```typescript
const user = await this.getUser(id);
if (!user) {
  throw new NotFoundException('用户不存在');
}
return user.name;
```

---

## Prisma 枚举使用

### 枚举定义

在 `prisma/schema.prisma` 中定义枚举：

```prisma
enum Status {
  NORMAL   @map("0")
  DISABLED @map("1")
}

enum DelFlag {
  NORMAL  @map("0")
  DELETED @map("2")
}
```

### 在代码中使用枚举

✅ **正确使用**:
```typescript
import { Status, DelFlag } from '@prisma/client';

// 查询
const users = await prisma.sysUser.findMany({
  where: {
    status: Status.NORMAL,
    delFlag: DelFlag.NORMAL
  }
});

// 更新
await prisma.sysUser.update({
  where: { userId: 1 },
  data: { status: Status.DISABLED }
});
```

❌ **错误使用**:
```typescript
// 不要使用字符串字面量
const users = await prisma.sysUser.findMany({
  where: {
    status: "0",  // ❌ 错误
    delFlag: "0"  // ❌ 错误
  }
});
```

### 枚举类型转换

```typescript
// 从字符串转换为枚举
function stringToStatus(value: string): Status {
  const statusMap: Record<string, Status> = {
    '0': Status.NORMAL,
    '1': Status.DISABLED
  };
  return statusMap[value] ?? Status.NORMAL;
}

// 从枚举转换为字符串（用于前端）
function statusToString(status: Status): string {
  const stringMap: Record<Status, string> = {
    [Status.NORMAL]: '正常',
    [Status.DISABLED]: '停用'
  };
  return stringMap[status];
}
```

---

## DTO 类型定义

### 基本 DTO 定义

```typescript
import { IsString, IsEnum, IsOptional, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { Status } from '@prisma/client';

export class CreateUserDto {
  @IsString()
  userName!: string;

  @IsString()
  nickName!: string;

  @IsEnum(Status)
  status!: Status;

  @IsOptional()
  @IsInt()
  @Min(1)
  deptId?: number;
}
```

### DTO 装饰器使用规范

| 字段类型 | 必需装饰器 | 可选装饰器 |
|---------|-----------|-----------|
| 字符串 | `@IsString()` | `@IsOptional()`, `@MinLength()`, `@MaxLength()` |
| 数字 | `@IsInt()` 或 `@IsNumber()` | `@IsOptional()`, `@Min()`, `@Max()` |
| 布尔值 | `@IsBoolean()` | `@IsOptional()` |
| 枚举 | `@IsEnum(EnumType)` | `@IsOptional()` |
| 数组 | `@IsArray()` | `@IsOptional()`, `@ArrayMinSize()`, `@ArrayMaxSize()` |
| 嵌套对象 | `@ValidateNested()`, `@Type()` | `@IsOptional()` |

### 可选字段处理

```typescript
export class UpdateUserDto {
  @IsOptional()
  @IsString()
  nickName?: string;

  @IsOptional()
  @IsEnum(Status)
  status?: Status;
}
```

### 嵌套对象验证

```typescript
export class CreateOrderDto {
  @IsString()
  orderNo!: string;

  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  @IsArray()
  items!: OrderItemDto[];
}

export class OrderItemDto {
  @IsString()
  productId!: string;

  @IsInt()
  @Min(1)
  quantity!: number;
}
```

---

## Repository 类型安全

### 使用 Prisma 生成的类型

```typescript
import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { Prisma, SysUser } from '@prisma/client';

@Injectable()
export class UserRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: Prisma.SysUserCreateInput): Promise<SysUser> {
    return this.prisma.sysUser.create({ data });
  }

  async findById(userId: number): Promise<SysUser | null> {
    return this.prisma.sysUser.findUnique({
      where: { userId }
    });
  }

  async findMany(args: Prisma.SysUserFindManyArgs): Promise<SysUser[]> {
    return this.prisma.sysUser.findMany(args);
  }

  async update(
    where: Prisma.SysUserWhereUniqueInput,
    data: Prisma.SysUserUpdateInput
  ): Promise<SysUser> {
    return this.prisma.sysUser.update({ where, data });
  }
}
```

### 类型推导

Prisma 提供完整的类型推导：

```typescript
// 自动推导返回类型
const user = await prisma.sysUser.findUnique({
  where: { userId: 1 },
  select: {
    userId: true,
    userName: true,
    dept: {
      select: {
        deptName: true
      }
    }
  }
});

// user 的类型自动推导为:
// {
//   userId: number;
//   userName: string;
//   dept: { deptName: string } | null;
// }
```

---

## 日志使用规范

### 使用 AppLogger 替代 console

❌ **错误示例**:
```typescript
console.log('用户登录成功');
console.error('登录失败', error);
```

✅ **正确示例**:
```typescript
import { Injectable } from '@nestjs/common';
import { AppLogger } from 'src/common/logger/app-logger.service';

@Injectable()
export class AuthService {
  constructor(private readonly logger: AppLogger) {
    this.logger.setContext(AuthService.name);
  }

  async login(username: string): Promise<void> {
    this.logger.log(`用户 ${username} 登录成功`);
  }

  async handleError(error: Error): Promise<void> {
    this.logger.error('登录失败', error.stack);
  }
}
```

### 日志级别使用

```typescript
// 调试信息
this.logger.debug('调试信息', { data: someData });

// 普通日志
this.logger.log('操作成功');

// 警告信息
this.logger.warn('配置项缺失，使用默认值');

// 错误信息
this.logger.error('操作失败', error.stack);
```

### 日志上下文

AppLogger 自动注入租户和用户信息：

```typescript
// 日志输出会自动包含:
{
  "level": "info",
  "message": "用户登录成功",
  "tenantId": "000000",
  "userId": 1,
  "context": "AuthService",
  "timestamp": "2025-12-26T10:00:00.000Z"
}
```

---

## 常量管理

### 常量定义

在 `src/common/constants/` 目录下定义常量：

```typescript
// src/common/constants/status.constants.ts
export const STATUS = {
  NORMAL: '0',
  DISABLED: '1',
} as const;

export const DEL_FLAG = {
  NORMAL: '0',
  DELETED: '2',
} as const;

export type StatusValue = typeof STATUS[keyof typeof STATUS];
export type DelFlagValue = typeof DEL_FLAG[keyof typeof DEL_FLAG];
```

### 使用常量

✅ **正确使用**:
```typescript
import { STATUS, DEL_FLAG } from 'src/common/constants';

// 使用常量
if (user.status === STATUS.NORMAL) {
  // ...
}
```

❌ **错误使用**:
```typescript
// 不要硬编码字符串
if (user.status === "0") {  // ❌ 错误
  // ...
}
```

### 错误消息常量

```typescript
// src/common/constants/error.constants.ts
export const ERROR_MESSAGES = {
  USER_NOT_FOUND: '用户不存在',
  INVALID_PASSWORD: '密码错误',
  PERMISSION_DENIED: '权限不足',
} as const;

// 使用
throw new NotFoundException(ERROR_MESSAGES.USER_NOT_FOUND);
```

---

## ESLint 规则

### 配置的规则

```javascript
{
  // 禁止使用 any 类型
  '@typescript-eslint/no-explicit-any': 'error',
  
  // 禁止使用 console
  'no-console': 'error',
  
  // 要求显式返回类型
  '@typescript-eslint/explicit-function-return-type': ['error', {
    allowExpressions: true,
    allowTypedFunctionExpressions: true,
  }],
  
  // 命名规范
  '@typescript-eslint/naming-convention': [
    'error',
    {
      selector: 'default',
      format: ['camelCase'],
    },
    {
      selector: 'variable',
      format: ['camelCase', 'UPPER_CASE', 'PascalCase'],
    },
    {
      selector: 'typeLike',
      format: ['PascalCase'],
    },
    {
      selector: 'enumMember',
      format: ['UPPER_CASE'],
    },
  ],
}
```

### 运行 ESLint

```bash
# 检查代码
npm run lint

# 自动修复
npm run lint -- --fix
```

---

## 常见问题

### Q1: 如何处理 Prisma 返回的 null 值？

```typescript
// 使用可选链和空值合并
const userName = user?.userName ?? '未知用户';

// 使用类型守卫
if (user === null) {
  throw new NotFoundException('用户不存在');
}
return user.userName;
```

### Q2: 如何在 DTO 中使用 Prisma 枚举？

```typescript
import { Status } from '@prisma/client';
import { IsEnum } from 'class-validator';

export class UpdateStatusDto {
  @IsEnum(Status)
  status!: Status;
}
```

### Q3: 如何处理日期类型？

```typescript
// Prisma 返回 Date 对象
const user = await prisma.sysUser.findUnique({
  where: { userId: 1 }
});

// 格式化日期
import { FormatDate } from 'src/common/utils';
const formattedDate = FormatDate(user.createTime);
```

### Q4: 如何避免循环依赖？

```typescript
// 使用 forwardRef
import { forwardRef, Inject } from '@nestjs/common';

@Injectable()
export class UserService {
  constructor(
    @Inject(forwardRef(() => DeptService))
    private readonly deptService: DeptService
  ) {}
}
```

### Q5: 如何处理大量的 TypeScript 错误？

1. **逐步修复**: 从最简单的错误开始（如未使用的导入）
2. **使用 IDE**: 利用 VSCode 的快速修复功能
3. **批量替换**: 使用正则表达式批量修复相似错误
4. **临时禁用**: 对于复杂问题，可以临时使用 `// @ts-ignore`，但要添加 TODO 注释

```typescript
// TODO: 修复类型定义
// @ts-ignore
const result = complexFunction(data);
```

---

## 最佳实践总结

1. ✅ **始终使用 Prisma 生成的类型**
2. ✅ **为所有 DTO 添加验证装饰器**
3. ✅ **使用 AppLogger 替代 console**
4. ✅ **使用枚举替代魔法字符串**
5. ✅ **显式声明函数返回类型**
6. ✅ **处理所有可能的 null/undefined 情况**
7. ✅ **遵循 ESLint 规则**
8. ✅ **编写类型安全的测试**

---

## 相关文档

- [类型安全改造报告](./TYPE_SAFETY_TEST_REPORT.md)
- [迁移指南](./TYPE_SAFETY_MIGRATION.md)
- [Prisma 文档](https://www.prisma.io/docs/)
- [class-validator 文档](https://github.com/typestack/class-validator)
- [NestJS 文档](https://docs.nestjs.com/)
