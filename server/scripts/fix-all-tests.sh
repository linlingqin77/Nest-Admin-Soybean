#!/bin/bash

# 批量修复测试脚本
# 这个脚本会应用常见的修复模式到所有测试文件

echo "开始批量修复测试..."

# 1. 在所有 spec 文件中添加 Prisma mock 类型转换
echo "步骤 1: 修复 Prisma mock 类型转换..."

# 查找所有需要修复的 prisma mock 调用
find src -name "*.spec.ts" -type f -exec sed -i.bak \
  -e 's/prisma\.\([a-zA-Z]*\)\.\([a-zA-Z]*\)\.mockResolvedValue/(prisma.\1.\2 as jest.Mock).mockResolvedValue/g' \
  -e 's/prisma\.\$transaction\.mockResolvedValue/(prisma.$transaction as jest.Mock).mockResolvedValue/g' \
  {} \;

echo "步骤 1 完成"

# 2. 清理备份文件
find src -name "*.spec.ts.bak" -type f -delete

echo "批量修复完成！"
echo "请运行 'npm test' 验证修复结果"
