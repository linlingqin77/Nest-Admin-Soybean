# 前端部署脚本目录

此目录包含前端项目的部署和配置脚本。

## 📁 文件说明

### deploy.cjs

前端自动化部署脚本，用于将构建后的前端项目部署到服务器。

**功能：**

- 打包前端项目
- 压缩构建产物
- 上传到远程服务器
- 备份旧版本
- 解压并替换文件

**使用方法：**

```bash
# 部署到开发环境
pnpm run deploy:dev

# 部署到测试环境
pnpm run deploy:test

# 部署到生产环境
pnpm run deploy:prod
```

### deploy.config.cjs

部署配置文件，包含不同环境的服务器配置信息（SSH、路径等）。

**配置项：**

- 服务器 SSH 连接信息
- 远程服务器路径
- 构建产物路径
- 备份设置

### deploy.config.example.cjs

部署配置示例文件，复制此文件并重命名为 `deploy.config.cjs`，然后填入实际的服务器配置。

## 🚀 快速开始

1. 复制配置示例文件：

```bash
cp scripts/deploy.config.example.cjs scripts/deploy.config.cjs
```

2. 编辑 `deploy.config.cjs`，填入服务器配置

3. 执行部署命令：

```bash
pnpm run deploy:prod
```

## ⚠️ 注意事项

- 请勿将 `deploy.config.cjs` 提交到版本控制系统
- 确保服务器已配置 SSH 密钥或密码认证
- 部署前请确认服务器路径和权限
- 建议先在测试环境验证部署流程
