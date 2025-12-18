#!/bin/bash

# Phase 3: 重构 UserService 使用 UserRepository

cd "$(dirname "$0")/.."

echo "🚀 开始重构 UserService 使用 Repository 模式..."
echo ""

FILE="src/module/system/user/user.service.ts"

if [ ! -f "$FILE" ]; then
  echo "❌ 文件不存在: $FILE"
  exit 1
fi

echo "📝 正在重构查询方法..."

# 备份原文件
cp "$FILE" "${FILE}.backup"

# 重构 findByUserName
perl -i -0pe 's/await this\.prisma\.sysUser\.findFirst\(\{\s*where:\s*\{\s*userName:\s*([^,]+),\s*\},?\s*\}\)/await this.userRepo.findByUserName($1)/gs' "$FILE"

# 重构 findById
perl -i -0pe 's/await this\.prisma\.sysUser\.findFirst\(\{\s*where:\s*\{\s*userId:\s*([^,]+),?\s*delFlag:\s*DelFlagEnum\.NORMAL,?\s*\},?\s*\}\)/await this.userRepo.findById($1)/gs' "$FILE"

echo "✅ 基础重构完成"
echo ""
echo "⚠️  注意：由于查询复杂性，部分方法需要手动重构"
echo "  - login 方法中的密码验证查询"
echo "  - findAll 方法的分页查询"
echo "  - getUserinfo 方法的关联查询"
echo ""
echo "正在验证编译..."
npx tsc --noEmit --skipLibCheck 2>&1 | head -20

echo ""
echo "📄 备份文件: ${FILE}.backup"
