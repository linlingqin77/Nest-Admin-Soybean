# 开始开发

本指南将帮助你快速上手 Nest-Admin-Soybean 的开发工作，了解开发流程和最佳实践。

## 开发环境配置

### 1. IDE 推荐

**VS Code** 是推荐的开发工具，安装以下扩展：

#### 必装扩展
- **Vue - Official** - Vue 3 语法支持
- **Prisma** - Prisma ORM 支持
- **ESLint** - 代码检查
- **EditorConfig** - 编辑器配置

#### 推荐扩展
- **UnoCSS** - UnoCSS 智能提示
- **Auto Rename Tag** - 自动重命名标签
- **Path Intellisense** - 路径智能提示
- **GitLens** - Git 增强

### 2. VS Code 配置

创建 `.vscode/settings.json`：

```json
{
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "eslint.validate": [
    "javascript",
    "javascriptreact",
    "typescript",
    "typescriptreact",
    "vue"
  ],
  "[prisma]": {
    "editor.defaultFormatter": "Prisma.prisma"
  },
  "typescript.tsdk": "node_modules/typescript/lib"
}
```

### 3. 环境变量

#### 后端环境变量

`.env.development`:
```ini
# 环境
NODE_ENV=development

# 端口（通过 config/index.ts 配置）
# PORT=8080

# 数据库配置通过 config/index.ts 管理
```

#### 前端环境变量

`.env.development`:
```ini
# API 地址
VITE_API_BASE_URL=http://localhost:8080/api

# 应用端口
VITE_PORT=9527

# 是否启用加密
VITE_ENABLE_ENCRYPT=true

# 是否启用 Mock
VITE_USE_MOCK=false
```

## 开发流程

### 1. 启动开发服务器

**后端**：
```bash
cd server
pnpm start:dev
```

**前端**：
```bash
cd admin-naive-ui
pnpm dev
```

### 2. 查看 API 文档

访问 `http://localhost:8080/api-docs` 查看 Swagger 文档。

### 3. 热重载

- **后端**: NestJS 监听文件变化自动重启
- **前端**: Vite HMR 即时更新


## 开发一个新功能

详细的开发指南、4 层目录结构、DTO 命名规范、调用链约束，请阅读 **[implementation-guide.md](./implementation-guide.md)**。

> 简要流程（以"部门管理"为例）：
>
> 1. **设计数据库**：编辑 `apps/server/prisma/schema.prisma`，表名用 `snake_case` 复数
> 2. **运行迁移**：`pnpm prisma migrate dev`
> 3. **创建模块**：`apps/server/src/modules/depts/`，扁平结构
> 4. **写 DTO**：`dto/create-dept.request.dto.ts` 命名规范
> 5. **写 controller → service → repository**：调用链规范见 implementation-guide
> 6. **在 `app.module.ts` 注册**
> 7. **运行 harness**：`pnpm harness:verify`

## 常用命令

### 后端命令

```bash
# 启动开发服务器
pnpm start:dev

# 生成 Prisma 客户端
pnpm prisma:generate

# 创建迁移
pnpm prisma:migrate

# 运行种子数据
pnpm prisma:seed

# 查看 Prisma Studio
pnpm prisma:studio

# 运行单元测试
pnpm test

# 运行测试并监听
pnpm test:watch

# 运行测试并生成覆盖率
pnpm test:cov

# 运行 E2E 测试
pnpm test:e2e

# 运行集成测试
pnpm test:integration

# 运行所有测试
pnpm test:all

# 构建生产版本
pnpm build:prod
```

### 前端命令

```bash
# 启动开发服务器
pnpm dev

# 生成路由
pnpm gen-route

# 生成 API 类型
pnpm gen:api

# 类型检查
pnpm typecheck

# 代码检查
pnpm lint

# 代码格式化
pnpm format

# 运行单元测试
pnpm test

# 运行测试并监听
pnpm test:watch

# 运行测试并生成覆盖率
pnpm test:cov

# 可视化测试界面
pnpm test:ui

# 打开 Cypress 交互界面
pnpm cypress:open

# 运行 Cypress E2E 测试
pnpm cypress:run

# 运行所有测试
pnpm test:all

# 构建生产版本
pnpm build
```

## 调试技巧

### 1. VS Code 调试配置

`.vscode/launch.json`:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "attach",
      "name": "Attach NestJS",
      "port": 9229,
      "restart": true,
      "stopOnEntry": false
    }
  ]
}
```

启动调试：
```bash
pnpm start:debug
```

### 2. Chrome DevTools

前端调试直接使用 Chrome DevTools：
- 按 F12 打开开发者工具
- Sources 标签页设置断点
- Console 查看日志

### 3. Prisma Studio

可视化查看和编辑数据库：

```bash
pnpm prisma:studio
```

访问 `http://localhost:5555`

## 下一步

- [数据库开发](/development/database) - 学习 Prisma 开发
- [API 开发](/development/api) - 深入 API 开发
- [前端架构](/development/frontend-architecture) - 了解前端架构
- [后端架构](/development/backend-architecture) - 了解后端架构
