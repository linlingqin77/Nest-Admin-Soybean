#!/bin/bash

# 批量优化业务代码，替换硬编码错误码为 ResponseCode 枚举

cd "$(dirname "$0")/.."

echo "开始批量优化业务代码..."

# 1. 替换 Result.fail(500, ...) 为 Result.fail(ResponseCode.INTERNAL_SERVER_ERROR, ...)
find src/module -type f -name "*.service.ts" -o -name "*.controller.ts" | while read file; do
  if grep -q "Result.fail(500," "$file"; then
    echo "优化: $file"
    # 使用 perl 进行替换（Mac 上sed的-i选项需要备份文件名）
    perl -i -pe 's/Result\.fail\(500,/Result.fail(ResponseCode.INTERNAL_SERVER_ERROR,/g' "$file"
  fi
done

# 2. 替换 Result.fail(400, ...) 为 Result.fail(ResponseCode.BAD_REQUEST, ...)
find src/module -type f -name "*.service.ts" -o -name "*.controller.ts" | while read file; do
  if grep -q "Result.fail(400," "$file"; then
    perl -i -pe 's/Result\.fail\(400,/Result.fail(ResponseCode.BAD_REQUEST,/g' "$file"
  fi
done

# 3. 替换 Result.fail(404, ...) 为 Result.fail(ResponseCode.NOT_FOUND, ...)
find src/module -type f -name "*.service.ts" -o -name "*.controller.ts" | while read file; do
  if grep -q "Result.fail(404," "$file"; then
    perl -i -pe 's/Result\.fail\(404,/Result.fail(ResponseCode.NOT_FOUND,/g' "$file"
  fi
done

# 4. 替换 Result.fail(501, ...) 为 Result.fail(ResponseCode.NOT_IMPLEMENTED, ...)
find src/module -type f -name "*.service.ts" -o -name "*.controller.ts" | while read file; do
  if grep -q "Result.fail(501," "$file"; then
    perl -i -pe 's/Result\.fail\(501,/Result.fail(ResponseCode.NOT_IMPLEMENTED,/g' "$file"
  fi
done

# 5. 确保导入了 ResponseCode
find src/module -type f -name "*.service.ts" -o -name "*.controller.ts" | while read file; do
  if grep -q "ResponseCode\." "$file" && ! grep -q "ResponseCode } from" "$file"; then
    echo "添加 ResponseCode 导入: $file"
    # 如果已有 Result 导入，就扩展它
    if grep -q "import { Result } from 'src/common/response'" "$file"; then
      perl -i -pe "s/import \{ Result \} from 'src\/common\/response'/import { Result, ResponseCode } from 'src\/common\/response'/g" "$file"
    elif grep -q 'import.*from.*src/common/response' "$file"; then
      # 如果有其他形式的导入，在下一行添加
      perl -i -pe "s/(import.*from.*'src\/common\/response';)/\$1\nimport { ResponseCode } from 'src\/common\/response';/g" "$file"
    fi
  fi
done

echo "批量优化完成！"
echo ""
echo "请手动检查以下文件，将 throw new Error 替换为 BusinessException:"
grep -r "throw new Error" src/module --include="*.service.ts" | cut -d: -f1 | sort -u
