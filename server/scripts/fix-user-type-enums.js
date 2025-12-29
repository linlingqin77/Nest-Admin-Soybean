#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const filesToFix = [
  'src/module/system/user/services/user-profile.service.spec.ts',
  'src/module/system/user/services/user-auth.service.spec.ts',
  'src/module/system/user/services/user-role.service.spec.ts',
  'src/module/system/user/user.controller.spec.ts',
  'src/module/system/user/user.service.spec.ts',
];

let fixedCount = 0;

filesToFix.forEach(relativePath => {
  const filePath = path.join(__dirname, '..', relativePath);
  
  if (!fs.existsSync(filePath)) {
    console.log(`⚠ 文件不存在: ${relativePath}`);
    return;
  }
  
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;
  const fixes = [];
  
  // 修复 userType: '01' -> userType: 'SYSTEM' as any
  if (content.includes("userType: '01'") || content.includes("userType: '00'")) {
    content = content.replace(/userType: '01'/g, "userType: 'SYSTEM' as any");
    content = content.replace(/userType: '00'/g, "userType: 'SYSTEM' as any");
    modified = true;
    fixes.push('修复 userType 枚举');
  }
  
  // 修复 sex: '0' -> sex: 'MALE' as any
  if (content.includes("sex: '0'") || content.includes("sex: '1'")) {
    content = content.replace(/sex: '0'/g, "sex: 'MALE' as any");
    content = content.replace(/sex: '1'/g, "sex: 'FEMALE' as any");
    modified = true;
    fixes.push('修复 sex 枚举');
  }
  
  // 修复 status: 'NORMAL' -> status: Status.NORMAL
  if (content.includes("status: 'NORMAL'") && !content.includes('Status.NORMAL')) {
    content = content.replace(/status: 'NORMAL'/g, 'status: Status.NORMAL');
    modified = true;
    fixes.push('修复 status 枚举');
  }
  
  if (content.includes("status: 'DISABLED'") && !content.includes('Status.DISABLED')) {
    content = content.replace(/status: 'DISABLED'/g, 'status: Status.DISABLED');
    modified = true;
    fixes.push('修复 status 枚举');
  }
  
  // 修复 delFlag: 'NORMAL' -> delFlag: DelFlag.NORMAL
  if (content.includes("delFlag: 'NORMAL'") && !content.includes('DelFlag.NORMAL')) {
    content = content.replace(/delFlag: 'NORMAL'/g, 'delFlag: DelFlag.NORMAL');
    modified = true;
    fixes.push('修复 delFlag 枚举');
  }
  
  // 确保导入了 Status 和 DelFlag
  if (modified) {
    if (!content.includes('import { Status') && !content.includes('from \'@prisma/client\'')) {
      content = content.replace(
        /(import.*from.*;\n)/,
        "$1import { Status, DelFlag } from '@prisma/client';\n"
      );
    } else if (!content.includes('DelFlag')) {
      content = content.replace(
        /import \{ Status \} from '@prisma\/client';/,
        "import { Status, DelFlag } from '@prisma/client';"
      );
    }
  }
  
  if (modified) {
    fs.writeFileSync(filePath, content, 'utf8');
    fixedCount++;
    console.log(`✓ ${relativePath}`);
    fixes.forEach(fix => console.log(`  - ${fix}`));
    console.log();
  }
});

console.log(`\n=== 修复总结 ===`);
console.log(`修复文件数: ${fixedCount}`);
