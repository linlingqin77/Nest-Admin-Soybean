# Coding Standards

## 命名规范

### 文件名
- 通用：`kebab-case`（`user-repository.ts`）
- 测试：`*.spec.ts` 或 `*.test.ts`
- DTO：`*.dto.ts`、`*.vo.ts`、`*.request.dto.ts`、`*.response.dto.ts`
- Entity/Model：`*.entity.ts`

### 类名
- Service：`XxxService`
- Controller：`XxxController`
- Repository：`XxxRepository`
- DTO：`XxxDto`、`XxxVo`、`XxxRequestDto`、`XxxResponseDto`

### 变量/函数
- 局部变量：`camelCase`
- 常量：`UPPER_SNAKE_CASE`
- 私有字段：`private _xxx` 或 `#xxx`（TypeScript 优先 `private readonly`）

## 代码组织

### Controller 层
```typescript
@Controller('prefix')
@ApiTags('Xxx')
@ApiBearerAuth()
export class XxxController {
  // 1. 构造器依赖注入
  // 2. 公开方法（路由处理）
  // 3. 私有辅助方法（仅本类使用）
}
```

### Service 层
```typescript
@Injectable()
export class XxxService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: RedisService,
  ) {}

  // 公开方法（业务逻辑）
  // 私有辅助方法（仅本 service 使用）
}
```

### Repository 层
```typescript
@Injectable()
export class XxxRepository {
  constructor(private readonly prisma: PrismaService) {}

  // 仅负责 CRUD，不含业务逻辑
}
```

## DTO 规范

### 请求 DTO
```typescript
export class CreateXxxRequestDto {
  @ApiProperty({ description: '名称' })
  @IsString()
  @MaxLength(100)
  name: string;

  @ApiPropertyOptional({ description: '描述' })
  @IsString()
  @IsOptional()
  description?: string;
}
```

### 响应 VO
```typescript
export class XxxVo {
  @ApiProperty({ description: 'ID' })
  @Expose()
  id: number;

  @ApiProperty({ description: '名称' })
  @Expose()
  name: string;
}
```

## 错误处理

```typescript
// 使用 Result 统一响应
return Result.ok(data);
return Result.fail('错误信息', ResponseCode.BAD_REQUEST);

// 业务异常
throw new BusinessException(ResponseCode.NOT_FOUND, '资源不存在');

// 参数校验失败
throw new BusinessException(ResponseCode.BAD_REQUEST, '参数错误');
```

## 日志规范

```typescript
// DEBUG：开发调试
this.logger.debug('查询条件', query);

// INFO：业务事件
this.logger.info('用户登录成功', { userId, ip });

// WARN：潜在问题
this.logger.warn('Token 即将过期', { userId, expiresIn });

// ERROR：异常
this.logger.error('数据库连接失败', error);
```

## Import 顺序

```typescript
// 1. Node 内置
import { readFile } from 'fs';

// 2. 第三方包
import { Injectable } from '@nestjs/common';

// 3. 项目内部 - 绝对路径优先
import { UserService } from '@/modules/users/user.service';
import { Result } from '@/shared/response';

// 4. 相对路径
import { UserEntity } from '../entities/user.entity';
```

## 注释规范

- 每个 public 方法必须有 JSDoc（描述、参数、返回值）
- 业务逻辑复杂的代码块加行内注释
- 禁止无意义的注释（如 `// increment i`）
