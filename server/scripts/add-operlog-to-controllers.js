#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// 递归查找所有 controller.spec.ts 文件
function findControllerTests(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      if (file !== 'node_modules' && file !== 'dist' && file !== '.git') {
        findControllerTests(filePath, fileList);
      }
    } else if (file.endsWith('.controller.spec.ts')) {
      fileList.push(filePath);
    }
  });
  
  return fileList;
}

const srcDir = path.join(__dirname, '..', 'src');
const testFiles = findControllerTests(srcDir);

console.log(`找到 ${testFiles.length} 个 controller 测试文件\n`);

let fixedCount = 0;

testFiles.forEach(filePath => {
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;
  const fixes = [];

  // 检查是否已经有 OperlogService
  if (content.includes('OperlogService')) {
    return;
  }

  // 检查是否有 @Controller 装饰器（确认是 controller 测试）
  if (!content.includes('Controller')) {
    return;
  }

  // 添加 OperlogService 导入
  const importMatch = content.match(/import.*from.*;\n/);
  if (importMatch) {
    const lastImportPos = content.lastIndexOf(importMatch[0]) + importMatch[0].length;
    const operlogImport = "import { OperlogService } from 'src/module/monitor/operlog/operlog.service';\n";
    content = content.slice(0, lastImportPos) + operlogImport + content.slice(lastImportPos);
    modified = true;
    fixes.push('添加 OperlogService 导入');
  }

  // 在 providers 数组中添加 OperlogService mock
  const providerMatch = content.match(/providers:\s*\[([\s\S]*?)\],?\s*\}\)\.compile\(\)/);
  if (providerMatch) {
    const providers = providerMatch[1];
    // 检查是否已经有 OperlogService provider
    if (!providers.includes('OperlogService')) {
      const operlogProvider = `,\n        {\n          provide: OperlogService,\n          useValue: { create: jest.fn() },\n        }`;
      content = content.replace(
        /providers:\s*\[([\s\S]*?)\],?\s*(\}\)\.compile\(\))/,
        `providers: [$1${operlogProvider}\n      ],\n      $2`
      );
      modified = true;
      fixes.push('添加 OperlogService provider');
    }
  }

  if (modified) {
    fs.writeFileSync(filePath, content, 'utf8');
    fixedCount++;
    const relativePath = path.relative(path.join(__dirname, '..'), filePath);
    console.log(`✓ ${relativePath}`);
    fixes.forEach(fix => console.log(`  - ${fix}`));
    console.log();
  }
});

console.log(`\n=== 修复总结 ===`);
console.log(`修复文件数: ${fixedCount}`);
