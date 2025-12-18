# 企业级架构快速上手指南

## 🎯 核心改变

本次重构完全移除了向后兼容代码，统一使用企业级标准 API。

---

## 📦 1. 统一响应 API

### Result<T> - 通用响应

```typescript
import { Result } from 'src/common/response';

// ✅ 成功响应
return Result.ok(data);
return Result.ok(user, '查询成功');

// ✅ 失败响应
return Result.fail(ResponseCode.USER_NOT_FOUND);
return Result.fail(ResponseCode.BUSINESS_ERROR, '操作失败');

// ✅ 分页响应（自动计算总页数）
return Result.page(list, total);
return Result.page(list, total, pageNum, pageSize);

// ✅ 条件响应
return Result.when(
  user !== null,
  user,
  ResponseCode.USER_NOT_FOUND,
  '用户不存在'
);

// ✅ Promise 响应
return Result.fromPromise(
  this.userService.findById(id),
  ResponseCode.USER_NOT_FOUND,
  '用户不存在'
);
```

### ResponseCode - 统一错误码

```typescript
enum ResponseCode {
  // 标准 HTTP 状态码
  SUCCESS = 200,
  UNAUTHORIZED = 401,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
  INTERNAL_SERVER_ERROR = 500,
  
  // 业务错误码 (1000+)
  BUSINESS_ERROR = 1000,
  VALIDATION_ERROR = 1001,
  USER_NOT_FOUND = 1002,
  // ... 自定义业务码
}
```

---

## 🚨 2. 异常处理体系

### 5 种异常类型

```typescript
import {
  BusinessException,
  AuthenticationException,
  AuthorizationException,
  ValidationException,
  NotFoundException,
} from 'src/common/exceptions';

// 1️⃣ 业务异常 (HTTP 200, 业务错误码)
throw new BusinessException('操作失败', ResponseCode.BUSINESS_ERROR);
BusinessException.throwIf(balance < amount, '余额不足');
BusinessException.throwIfNull(user, '用户不存在');
BusinessException.throwIfEmpty(list, '列表为空');

// 2️⃣ 认证异常 (HTTP 401)
throw new AuthenticationException('未登录');
AuthenticationException.throwIf(!token, '请先登录');

// 3️⃣ 授权异常 (HTTP 403)
throw new AuthorizationException('无权限访问');
AuthorizationException.throwIf(!hasPermission, '权限不足');

// 4️⃣ 验证异常 (HTTP 400)
throw new ValidationException('参数错误');

// 5️⃣ 404 异常 (HTTP 404)
throw new NotFoundException('资源不存在');
```

### 断言式 API（推荐）

```typescript
// ✅ 简洁优雅的异常抛出
BusinessException.throwIfNull(user, '用户不存在');
BusinessException.throwIfEmpty(roles, '角色列表为空');
BusinessException.throwIf(age < 18, '未成年用户');
AuthenticationException.throwIf(!isLoggedIn, '请先登录');
```

---

## 📄 3. DTO 分页查询

### PageQueryDto 基类

```typescript
import { PageQueryDto } from 'src/common/dto';

export class ListUserDto extends PageQueryDto {
  @IsOptional()
  @IsString()
  username?: string;
  
  @IsOptional()
  @IsEnum(UserStatus)
  status?: UserStatus;
}
```

### 便捷方法

```typescript
class PageQueryDto {
  pageNum: number = 1;      // 当前页码
  pageSize: number = 10;    // 每页条数
  orderByColumn?: string;   // 排序字段
  isAsc?: 'asc' | 'desc';   // 排序方式
  beginTime?: string;       // 开始时间
  endTime?: string;         // 结束时间
  
  // 计算属性
  get skip(): number;       // 跳过记录数
  get take(): number;       // 获取记录数
  
  // 便捷方法
  getOrderBy(defaultField?: string): Prisma.OrderByInput | undefined;
  getDateRange(field: string): { [field]: { gte, lte } } | undefined;
}
```

### Service 层使用

```typescript
async findAll(query: ListUserDto) {
  const where: Prisma.UserWhereInput = {};
  
  // ✅ 使用便捷方法构建查询条件
  const dateRange = query.getDateRange('createTime');
  if (dateRange) Object.assign(where, dateRange);
  
  if (query.username) {
    where.username = { contains: query.username };
  }
  
  const [list, total] = await this.prisma.$transaction([
    this.prisma.user.findMany({
      where,
      skip: query.skip,          // ✅ 使用 skip
      take: query.take,          // ✅ 使用 take
      orderBy: query.getOrderBy('createTime'), // ✅ 使用排序方法
    }),
    this.prisma.user.count({ where }),
  ]);
  
  // ✅ 使用 Result.page 返回分页数据
  return Result.page(FormatDateFields(list), total);
}
```

---

## 🏗️ 4. Repository 模式

### 基础 Repository

```typescript
import { BaseRepository } from 'src/common/repository';
import { Injectable } from '@nestjs/common';

@Injectable()
export class UserRepository extends BaseRepository<SysUser, CreateUserDto> {
  constructor(prisma: PrismaService) {
    super(prisma, 'sysUser'); // 传入 Prisma model 名称
  }
  
  // 继承的方法：
  // - findById(id)
  // - findPage(query, where?, orderBy?)
  // - create(data)
  // - update(id, data)
  // - delete(id)
  // - count(where?)
  // - exists(where)
}
```

### 软删除 Repository

```typescript
import { SoftDeleteRepository } from 'src/common/repository';

@Injectable()
export class UserRepository extends SoftDeleteRepository<SysUser, CreateUserDto> {
  constructor(prisma: PrismaService) {
    super(prisma, 'sysUser', 'delFlag'); // 传入软删除字段
  }
  
  // 额外的方法：
  // - softDelete(id)
  // - restore(id)
}
```

### Service 层使用 Repository

```typescript
@Injectable()
export class UserService {
  constructor(private readonly userRepo: UserRepository) {}
  
  async findAll(query: ListUserDto) {
    const where = { username: { contains: query.username } };
    const result = await this.userRepo.findPage(query, where);
    return Result.page(result.rows, result.total);
  }
  
  async findOne(id: string) {
    const user = await this.userRepo.findById(id);
    BusinessException.throwIfNull(user, '用户不存在');
    return Result.ok(user);
  }
  
  async create(dto: CreateUserDto) {
    const exists = await this.userRepo.exists({ username: dto.username });
    BusinessException.throwIf(exists, '用户名已存在');
    
    const user = await this.userRepo.create(dto);
    return Result.ok(user);
  }
}
```

---

## 🔄 5. 声明式事务

### @Transactional 装饰器

```typescript
import { Transactional } from 'src/common/decorators';

@Injectable()
export class UserService {
  @Transactional()
  async createUserWithProfile(dto: CreateUserDto) {
    // ✅ 所有数据库操作自动在事务中执行
    const user = await this.userRepo.create(dto);
    await this.profileRepo.create({
      userId: user.userId,
      nickname: dto.username,
    });
    
    // ✅ 任何异常自动回滚
    BusinessException.throwIf(user.age < 18, '年龄不符合要求');
    
    return user;
  }
}
```

### 手动事务（如需更精细控制）

```typescript
async updateUserAndLog(userId: string, data: UpdateUserDto) {
  return await this.prisma.$transaction(async (tx) => {
    const user = await tx.sysUser.update({
      where: { userId },
      data,
    });
    
    await tx.sysOperLog.create({
      data: {
        operName: '更新用户',
        userId,
      },
    });
    
    return user;
  });
}
```

---

## 🎨 6. Controller 最佳实践

```typescript
import { Controller, Get, Post, Body, Query, Param } from '@nestjs/common';
import { Api } from 'src/common/decorators/api.decorator';
import { RequirePermission } from 'src/common/decorators/permission.decorator';
import { User } from 'src/common/decorators/user.decorator';
import { Result } from 'src/common/response';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}
  
  @Get()
  @Api({ summary: '查询用户列表', type: UserListVo })
  @RequirePermission('system:user:list')
  async findAll(@Query() query: ListUserDto) {
    return await this.userService.findAll(query);
  }
  
  @Get(':id')
  @Api({ summary: '查询用户详情', type: UserVo })
  @RequirePermission('system:user:query')
  async findOne(@Param('id') id: string) {
    return await this.userService.findOne(id);
  }
  
  @Post()
  @Api({ summary: '创建用户', type: UserVo })
  @RequirePermission('system:user:add')
  async create(
    @Body() dto: CreateUserDto,
    @User() currentUser: UserInfo,
  ) {
    return await this.userService.create(dto);
  }
}
```

---

## 📋 7. 完整示例

### DTO 定义
```typescript
// list-user.dto.ts
import { PageQueryDto } from 'src/common/dto';
import { IsOptional, IsString, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ListUserDto extends PageQueryDto {
  @ApiProperty({ description: '用户名', required: false })
  @IsOptional()
  @IsString()
  username?: string;
  
  @ApiProperty({ description: '状态', enum: ['0', '1'], required: false })
  @IsOptional()
  @IsEnum(['0', '1'])
  status?: string;
}
```

### Service 实现
```typescript
// user.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { Result } from 'src/common/response';
import { BusinessException } from 'src/common/exceptions';
import { Transactional } from 'src/common/decorators';
import { FormatDateFields } from 'src/common/utils';
import { Prisma } from '@prisma/client';

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}
  
  async findAll(query: ListUserDto) {
    const where: Prisma.SysUserWhereInput = { delFlag: '0' };
    
    // 使用便捷方法构建查询条件
    const dateRange = query.getDateRange('createTime');
    if (dateRange) Object.assign(where, dateRange);
    
    if (query.username) {
      where.username = { contains: query.username };
    }
    
    if (query.status) {
      where.status = query.status;
    }
    
    const [list, total] = await this.prisma.$transaction([
      this.prisma.sysUser.findMany({
        where,
        skip: query.skip,
        take: query.take,
        orderBy: query.getOrderBy('createTime'),
      }),
      this.prisma.sysUser.count({ where }),
    ]);
    
    return Result.page(FormatDateFields(list), total);
  }
  
  async findOne(id: string) {
    const user = await this.prisma.sysUser.findUnique({
      where: { userId: id, delFlag: '0' },
    });
    
    BusinessException.throwIfNull(user, '用户不存在');
    return Result.ok(FormatDateFields(user));
  }
  
  @Transactional()
  async create(dto: CreateUserDto) {
    // 检查用户名是否存在
    const exists = await this.prisma.sysUser.findFirst({
      where: { username: dto.username, delFlag: '0' },
    });
    BusinessException.throwIf(exists !== null, '用户名已存在');
    
    // 创建用户
    const user = await this.prisma.sysUser.create({
      data: {
        ...dto,
        delFlag: '0',
        status: dto.status ?? '0',
      },
    });
    
    // 创建用户配置（事务中）
    await this.prisma.sysUserConfig.create({
      data: { userId: user.userId },
    });
    
    return Result.ok(FormatDateFields(user), '创建成功');
  }
  
  @Transactional()
  async update(id: string, dto: UpdateUserDto) {
    // 验证用户存在
    const user = await this.prisma.sysUser.findUnique({
      where: { userId: id, delFlag: '0' },
    });
    BusinessException.throwIfNull(user, '用户不存在');
    
    // 更新用户
    const updated = await this.prisma.sysUser.update({
      where: { userId: id },
      data: dto,
    });
    
    return Result.ok(FormatDateFields(updated), '更新成功');
  }
  
  async softDelete(ids: string[]) {
    const result = await this.prisma.sysUser.updateMany({
      where: { userId: { in: ids } },
      data: { delFlag: '1' },
    });
    
    BusinessException.throwIf(result.count === 0, '删除失败');
    return Result.ok(null, '删除成功');
  }
}
```

### Controller 实现
```typescript
// user.controller.ts
import { Controller, Get, Post, Put, Delete, Body, Query, Param } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Api } from 'src/common/decorators/api.decorator';
import { RequirePermission } from 'src/common/decorators/permission.decorator';
import { UserService } from './user.service';
import { ListUserDto, CreateUserDto, UpdateUserDto } from './dto';
import { UserListVo, UserVo } from './vo';

@ApiTags('用户管理')
@Controller('system/user')
export class UserController {
  constructor(private readonly userService: UserService) {}
  
  @Get('list')
  @Api({ summary: '查询用户列表', type: UserListVo })
  @RequirePermission('system:user:list')
  async findAll(@Query() query: ListUserDto) {
    return await this.userService.findAll(query);
  }
  
  @Get(':id')
  @Api({ summary: '查询用户详情', type: UserVo })
  @RequirePermission('system:user:query')
  async findOne(@Param('id') id: string) {
    return await this.userService.findOne(id);
  }
  
  @Post()
  @Api({ summary: '创建用户', type: UserVo })
  @RequirePermission('system:user:add')
  async create(@Body() dto: CreateUserDto) {
    return await this.userService.create(dto);
  }
  
  @Put(':id')
  @Api({ summary: '更新用户', type: UserVo })
  @RequirePermission('system:user:edit')
  async update(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    return await this.userService.update(id, dto);
  }
  
  @Delete(':ids')
  @Api({ summary: '删除用户' })
  @RequirePermission('system:user:remove')
  async remove(@Param('ids') ids: string) {
    return await this.userService.softDelete(ids.split(','));
  }
}
```

---

## ✅ 迁移检查清单

从旧 API 迁移到新 API，确保：

- [ ] 所有 `ResultData` 替换为 `Result`
- [ ] 所有 `PagingDto` 替换为 `PageQueryDto`
- [ ] 使用 `query.skip` 和 `query.take` 代替手动计算
- [ ] 使用 `query.getDateRange()` 代替手动时间范围处理
- [ ] 使用 `query.getOrderBy()` 代替手动排序处理
- [ ] 分页响应使用 `Result.page(list, total)`
- [ ] 异常抛出使用断言 API（如 `BusinessException.throwIfNull()`）
- [ ] Service 层数据库操作考虑使用 Repository 模式
- [ ] 需要事务的操作使用 `@Transactional()` 装饰器
- [ ] Controller 使用 `@Api()` 装饰器统一 Swagger 文档

---

## 🚀 下一步

1. 运行测试验证：`pnpm test`
2. 启动开发服务器：`pnpm start:dev`
3. 检查 Swagger 文档：`http://localhost:8080/api/docs`
4. 阅读完整文档：[ARCHITECTURE_OPTIMIZATION.md](./ARCHITECTURE_OPTIMIZATION.md)

---

**恭喜！你现在已经掌握了企业级 NestJS 项目的核心开发模式！** 🎉
