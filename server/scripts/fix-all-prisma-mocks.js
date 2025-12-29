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

console.log(`找到 ${testFiles.length} 个测试文件`);

let fixedCount = 0;
let totalReplacements = 0;

testFiles.forEach(filePath => {
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;
  let replacements = 0;

  // 模式 1: 修复 prisma.xxx.yyy.mockResolvedValue -> (prisma.xxx.yyy as jest.Mock).mockResolvedValue
  const pattern1 = /(\s+)(prisma\.\w+\.\w+)\.(mockResolvedValue|mockRejectedValue|mockResolvedValueOnce|mockRejectedValueOnce)/g;
  const newContent1 = content.replace(pattern1, (match, spaces, prismaCall, mockMethod) => {
    replacements++;
    return `${spaces}(${prismaCall} as jest.Mock).${mockMethod}`;
  });
  
  if (newContent1 !== content) {
    content = newContent1;
    modified = true;
  }

  // 模式 2: 修复 prisma.$transaction.mockResolvedValue -> (prisma.$transaction as jest.Mock).mockResolvedValue
  const pattern2 = /(\s+)(prisma\.\$\w+)\.(mockResolvedValue|mockRejectedValue|mockResolvedValueOnce|mockRejectedValueOnce)/g;
  const newContent2 = content.replace(pattern2, (match, spaces, prismaCall, mockMethod) => {
    replacements++;
    return `${spaces}(${prismaCall} as jest.Mock).${mockMethod}`;
  });
  
  if (newContent2 !== content) {
    content = newContent2;
    modified = true;
  }

  if (modified) {
    fs.writeFileSync(filePath, content, 'utf8');
    fixedCount++;
    totalReplacements += replacements;
    const relativePath = path.relative(path.join(__dirname, '..'), filePath);
    console.log(`✓ 修复 ${relativePath} (${replacements} 处替换)`);
  }
});

console.log(`\n总计: 修复了 ${fixedCount} 个文件，共 ${totalReplacements} 处替换`);
