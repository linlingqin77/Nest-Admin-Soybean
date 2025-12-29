#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// 递归查找所有 .spec.ts 文件
function findTestFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      if (file !== 'node_modules' && file !== 'dist' && file !== '.git') {
        findTestFiles(filePath, fileList);
      }
    } else if (file.endsWith('.spec.ts')) {
      fileList.push(filePath);
    }
  });
  
  return fileList;
}

const srcDir = path.join(__dirname, '..', 'src');
const testFiles = findTestFiles(srcDir);

console.log(`找到 ${testFiles.length} 个测试文件\n`);

let fixedCount = 0;
const fixes = {
  prismaMock: 0,
  mockServiceFactory: 0,
  operlogService: 0,
  statusEnum: 0,
};

testFiles.forEach(filePath => {
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;
  const fileFixes = [];

  // 修复 1: prisma mock 类型转换
  const pattern1 = /(\s+)(prisma\.\w+\.\w+)\.(mockResolvedValue|mockRejectedValue|mockResolvedValueOnce|mockRejectedValueOnce)/g;
  const newContent1 = content.replace(pattern1, (match, spaces, prismaCall, mockMethod) => {
    fixes.prismaMock++;
    return `${spaces}(${prismaCall} as jest.Mock).${mockMethod}`;
  });
  
  if (newContent1 !== content) {
    content = newContent1;
    modified = true;
    fileFixes.push('prisma mock 类型转换');
  }

  // 修复 2: prisma.$transaction mock
  const pattern2 = /(\s+)(prisma\.\$\w+)\.(mockResolvedValue|mockRejectedValue|mockResolvedValueOnce|mockRejectedValueOnce)/g;
  const newContent2 = content.replace(pattern2, (match, spaces, prismaCall, mockMethod) => {
    fixes.prismaMock++;
    return `${spaces}(${prismaCall} as jest.Mock).${mockMethod}`;
  });
  
  if (newContent2 !== content) {
    content = newContent2;
    modified = true;
    if (!fileFixes.includes('prisma mock 类型转换')) {
      fileFixes.push('prisma mock 类型转换');
    }
  }

  // 修复 3: 替换 MockServiceFactory.createPrismaService() 为 createPrismaMock()
  if (content.includes('MockServiceFactory.createPrismaService()')) {
    // 添加导入
    if (!content.includes("import { createPrismaMock }")) {
      content = content.replace(
        /(import.*from.*test-utils.*;\n)/,
        "$1import { createPrismaMock } from 'src/test-utils/prisma-mock';\n"
      );
    }
    
    // 替换使用
    content = content.replace(
      /MockServiceFactory\.createPrismaService\(\)/g,
      'createPrismaMock()'
    );
    
    modified = true;
    fixes.mockServiceFactory++;
    fileFixes.push('替换 MockServiceFactory');
  }

  // 修复 4: Controller 测试添加 OperlogService mock（仅针对 controller.spec.ts）
  if (filePath.includes('controller.spec.ts') && 
      !content.includes('OperlogService') && 
      content.includes('@Controller')) {
    
    // 添加导入
    if (!content.includes("import { OperlogService }")) {
      const importMatch = content.match(/import.*from.*;\n/);
      if (importMatch) {
        const insertPos = content.lastIndexOf(importMatch[0]) + importMatch[0].length;
        content = content.slice(0, insertPos) + 
          "import { OperlogService } from 'src/module/monitor/operlog/operlog.service';\n" +
          content.slice(insertPos);
      }
    }
    
    // 添加 mock provider
    const providerMatch = content.match(/providers:\s*\[([\s\S]*?)\]/);
    if (providerMatch && !providerMatch[1].includes('OperlogService')) {
      content = content.replace(
        /providers:\s*\[([\s\S]*?)\]/,
        (match, providers) => {
          const mockOperlog = `\n        {\n          provide: OperlogService,\n          useValue: { create: jest.fn() },\n        },`;
          return `providers: [${providers}${mockOperlog}\n      ]`;
        }
      );
      
      modified = true;
      fixes.operlogService++;
      fileFixes.push('添加 OperlogService mock');
    }
  }

  // 修复 5: Status.DISABLE -> Status.DISABLED
  if (content.includes('Status.DISABLE') && !content.includes('Status.DISABLED')) {
    content = content.replace(/Status\.DISABLE\b/g, 'Status.DISABLED');
    modified = true;
    fixes.statusEnum++;
    fileFixes.push('修复 Status 枚举');
  }

  if (modified) {
    fs.writeFileSync(filePath, content, 'utf8');
    fixedCount++;
    const relativePath = path.relative(path.join(__dirname, '..'), filePath);
    console.log(`✓ ${relativePath}`);
    console.log(`  修复: ${fileFixes.join(', ')}\n`);
  }
});

console.log('\n=== 修复总结 ===');
console.log(`修复文件数: ${fixedCount}`);
console.log(`Prisma mock 类型转换: ${fixes.prismaMock} 处`);
console.log(`替换 MockServiceFactory: ${fixes.mockServiceFactory} 处`);
console.log(`添加 OperlogService mock: ${fixes.operlogService} 处`);
console.log(`修复 Status 枚举: ${fixes.statusEnum} 处`);
