# UserService Refactoring Documentation

## 概述

本文档详细说明了 UserService 的重构方案，通过服务委托模式（Service Delegation Pattern）将原有的单一服务拆分为多个专职子服务，提升代码可维护性和职责清晰度。

## 重构目标

1. **单一职责原则**：每个服务负责特定的业务领域
2. **降低复杂度**：将 1500+ 行代码拆分为更小的模块
3. **提升可测试性**：独立服务更容易编写单元测试
4. **保持兼容性**：不破坏现有 API 接口

## 架构设计

### 服务层次结构

```
UserService (主服务)
├── UserAuthService      (认证相关)
├── UserProfileService   (个人资料)
├── UserRoleService      (角色权限)
└── UserExportService    (导入导出)
```

### 职责划分

| 服务 | 职责 | 核心方法 |
|------|------|----------|
| **UserService** | 用户管理主服务，协调子服务 | `findAll`, `create`, `update`, `remove` |
| **UserAuthService** | 认证与密码管理 | `validateUser`, `resetPwd`, `changePassword` |
| **UserProfileService** | 用户资料维护 | `getProfile`, `updateProfile`, `updateAvatar` |
| **UserRoleService** | 角色与权限管理 | `getUserRoles`, `authRole`, `getAuthUserRoles` |
| **UserExportService** | 批量操作 | `importData`, `exportExcel` |

## 实现细节

### 1. UserService（主服务）

**文件路径**：`src/module/system/user/user.service.ts`

**核心功能**：
- CRUD 基础操作
- 用户列表查询（分页、筛选）
- 用户信息获取
- 委托子服务处理专门业务

**示例代码**：
```typescript
@Injectable()
export class UserService {
  constructor(
    private prisma: PrismaService,
    private userRepo: UserRepository,
    private userAuthService: UserAuthService,
    private userProfileService: UserProfileService,
    private userRoleService: UserRoleService,
    private userExportService: UserExportService,
  ) {}

  // 委托认证服务
  async resetPwd(userId: number, password: string) {
    return this.userAuthService.resetPwd(userId, password);
  }

  // 委托资料服务
  async getProfile(userId: number) {
    return this.userProfileService.getProfile(userId);
  }

  // 主服务负责核心业务
  async findAll(query: ListUserDto) {
    const where = this.buildWhereCondition(query);
    const result = await this.userRepo.findPageWithDept(
      where,
      query.skip,
      query.take,
    );
    return ResponseSuccess(ResponseData(result));
  }
}
```

### 2. UserAuthService（认证服务）

**文件路径**：`src/module/system/user/services/user-auth.service.ts`

**核心功能**：
- 用户名/密码验证
- 密码重置
- 密码修改
- 密码加密/验证

**关键实现**：
```typescript
@Injectable()
export class UserAuthService {
  async validateUser(username: string, password: string) {
    const user = await this.prisma.sysUser.findUnique({
      where: { userName: username }
    });
    
    if (!user || user.delFlag === DelFlagEnum.DELETED) {
      throw new BusinessException(ErrorEnum.USER_NOT_FOUND);
    }
    
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      throw new BusinessException(ErrorEnum.INVALID_PASSWORD);
    }
    
    return user;
  }

  async changePassword(userId: number, oldPwd: string, newPwd: string) {
    const user = await this.findById(userId);
    
    const isMatch = await bcrypt.compare(oldPwd, user.password);
    if (!isMatch) {
      throw new BusinessException(ErrorEnum.OLD_PASSWORD_INCORRECT);
    }
    
    const hashedPassword = await bcrypt.hash(newPwd, 10);
    await this.prisma.sysUser.update({
      where: { userId },
      data: { password: hashedPassword }
    });
    
    return ResponseSuccess();
  }
}
```

### 3. UserProfileService（资料服务）

**文件路径**：`src/module/system/user/services/user-profile.service.ts`

**核心功能**：
- 获取用户详细资料
- 更新个人资料
- 头像上传/更新
- 用户信息展示

**关键实现**：
```typescript
@Injectable()
export class UserProfileService {
  async getProfile(userId: number) {
    const user = await this.prisma.sysUser.findUnique({
      where: { userId },
      include: {
        dept: true,
        roles: {
          include: { role: true }
        }
      }
    });
    
    return ResponseSuccess(user);
  }

  async updateProfile(userId: number, updateDto: UpdateProfileDto) {
    const { nickName, phonenumber, email, sex } = updateDto;
    
    await this.prisma.sysUser.update({
      where: { userId },
      data: { nickName, phonenumber, email, sex }
    });
    
    return ResponseSuccess();
  }
}
```

### 4. UserRoleService（角色服务）

**文件路径**：`src/module/system/user/services/user-role.service.ts`

**核心功能**：
- 用户角色分配
- 用户角色查询
- 批量授权/取消授权
- 角色用户列表

**关键实现**：
```typescript
@Injectable()
export class UserRoleService {
  async authRole(userId: number, roleIds: number[]) {
    // 删除现有角色
    await this.prisma.sysUserRole.deleteMany({
      where: { userId }
    });
    
    // 批量插入新角色
    if (roleIds?.length > 0) {
      await this.prisma.sysUserRole.createMany({
        data: roleIds.map(roleId => ({ userId, roleId })),
        skipDuplicates: true
      });
    }
    
    return ResponseSuccess();
  }

  async getUserRoles(userId: number) {
    const userRoles = await this.prisma.sysUserRole.findMany({
      where: { userId },
      include: { role: true }
    });
    
    return userRoles.map(ur => ur.role);
  }
}
```

### 5. UserExportService（导入导出服务）

**文件路径**：`src/module/system/user/services/user-export.service.ts`

**核心功能**：
- Excel 导入用户数据
- Excel 导出用户数据
- 数据验证与转换
- 导入模板下载

**关键实现**：
```typescript
@Injectable()
export class UserExportService {
  async importData(file: Express.Multer.File, updateSupport: boolean) {
    const workbook = XLSX.read(file.buffer);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json(sheet);
    
    const results = {
      success: 0,
      failed: 0,
      errors: []
    };
    
    for (const row of data) {
      try {
        await this.importUser(row, updateSupport);
        results.success++;
      } catch (error) {
        results.failed++;
        results.errors.push({
          row: row,
          error: error.message
        });
      }
    }
    
    return ResponseSuccess(results);
  }

  async exportExcel(query: ListUserDto) {
    const users = await this.userRepo.findAllWithDept(query);
    
    const data = users.map(user => ({
      '用户名': user.userName,
      '昵称': user.nickName,
      '邮箱': user.email,
      '手机号': user.phonenumber,
      '部门': user.dept?.deptName,
      '状态': user.status === '0' ? '正常' : '停用'
    }));
    
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, '用户列表');
    
    return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  }
}
```

## 依赖注入配置

**文件路径**：`src/module/system/user/user.module.ts`

```typescript
@Module({
  imports: [
    PrismaModule,
    SharedModule,
  ],
  controllers: [UserController],
  providers: [
    UserService,
    UserRepository,
    UserAuthService,
    UserProfileService,
    UserRoleService,
    UserExportService,
  ],
  exports: [UserService], // 对外只暴露主服务
})
export class UserModule {}
```

## 性能优化

### N+1 查询优化

**问题场景**：获取用户列表时需要关联部门信息

**优化方案**：
```typescript
// ❌ 优化前
async findAll(query: ListUserDto) {
  const users = await this.prisma.sysUser.findMany({ ... });
  for (const user of users) {
    user.dept = await this.prisma.sysDept.findUnique({
      where: { deptId: user.deptId }
    });
  }
  return users;
}

// ✅ 优化后
async findAll(query: ListUserDto) {
  const users = await this.prisma.sysUser.findMany({ ... });
  
  const deptIds = users.map(u => u.deptId).filter(Boolean);
  const depts = await this.prisma.sysDept.findMany({
    where: { deptId: { in: deptIds } }
  });
  
  const deptMap = new Map(depts.map(d => [d.deptId, d]));
  users.forEach(user => {
    user.dept = deptMap.get(user.deptId);
  });
  
  return users;
}
```

## 测试策略

### 单元测试示例

**文件路径**：`src/module/system/user/services/user-auth.service.spec.ts`

```typescript
describe('UserAuthService', () => {
  let service: UserAuthService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        UserAuthService,
        {
          provide: PrismaService,
          useValue: { sysUser: { findUnique: jest.fn(), update: jest.fn() } }
        }
      ]
    }).compile();

    service = module.get(UserAuthService);
    prisma = module.get(PrismaService);
  });

  describe('validateUser', () => {
    it('should return user when credentials are valid', async () => {
      const mockUser = {
        userId: 1,
        userName: 'admin',
        password: await bcrypt.hash('admin123', 10),
        delFlag: '0'
      };
      
      jest.spyOn(prisma.sysUser, 'findUnique').mockResolvedValue(mockUser);
      
      const result = await service.validateUser('admin', 'admin123');
      
      expect(result).toBeDefined();
      expect(result.userName).toBe('admin');
    });

    it('should throw error when password is incorrect', async () => {
      const mockUser = {
        userId: 1,
        userName: 'admin',
        password: await bcrypt.hash('admin123', 10),
        delFlag: '0'
      };
      
      jest.spyOn(prisma.sysUser, 'findUnique').mockResolvedValue(mockUser);
      
      await expect(
        service.validateUser('admin', 'wrongpass')
      ).rejects.toThrow();
    });
  });
});
```

## 迁移指南

### 对现有代码的影响

**向后兼容**：UserService 保留所有原有方法，只是内部实现改为委托调用

**示例**：
```typescript
// 调用方代码无需修改
class SomeController {
  constructor(private userService: UserService) {}

  @Post('reset-password')
  async resetPassword(@Body() dto: ResetPwdDto) {
    // 调用方式不变，内部自动委托给 UserAuthService
    return this.userService.resetPwd(dto.userId, dto.password);
  }
}
```

## 最佳实践

1. **服务边界清晰**：每个子服务只处理自己领域的逻辑
2. **避免循环依赖**：子服务之间不相互依赖
3. **统一错误处理**：使用 BusinessException 抛出业务异常
4. **日志记录**：关键操作添加 @Operlog 装饰器
5. **缓存策略**：高频查询使用 @Cacheable 装饰器

## 相关文档

- [Database Optimization](./DATABASE_OPTIMIZATION.md)
- [Multi-Tenant Migration Guide](./MULTI_TENANT_MIGRATION.md)
- [Business Code Optimization](./BUSINESS_CODE_OPTIMIZATION.md)
