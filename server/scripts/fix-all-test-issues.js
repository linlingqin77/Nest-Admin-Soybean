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

// 需要修复的特定文件和修复内容
const specificFixes = [
  {
    file: 'src/module/monitor/job/job-log.service.spec.ts',
    fixes: [
      {
        find: /const query = \{\s*pageNum: 1,\s*pageSize: 10,?\s*\};/g,
        replace: 'const query = plainToInstance(ListJobLogDto, { pageNum: 1, pageSize: 10 });',
        description: '修复 DTO 使用 plainToInstance'
      },
      {
        find: /const query = \{\s*pageNum: 1,\s*pageSize: 10,\s*jobName: 'test',?\s*\};/g,
        replace: 'const query = plainToInstance(ListJobLogDto, { pageNum: 1, pageSize: 10, jobName: \'test\' });',
        description: '修复 DTO 使用 plainToInstance (带 jobName)'
      },
      {
        find: /const query = \{\s*pageNum: 1,\s*pageSize: 10,\s*status: Status\.NORMAL,?\s*\};/g,
        replace: 'const query = plainToInstance(ListJobLogDto, { pageNum: 1, pageSize: 10, status: Status.NORMAL });',
        description: '修复 DTO 使用 plainToInstance (带 status)'
      }
    ]
  },
  {
    file: 'src/module/system/config/config.service.spec.ts',
    fixes: [
      {
        find: /const updateDto = \{\s*configKey: 'test\.key',\s*configValue: 'new value',?\s*\};/g,
        replace: `const updateDto = {
        configId: 1,
        configName: 'Test Config',
        configKey: 'test.key',
        configValue: 'new value',
        configType: 'Y',
      };`,
        description: '修复 UpdateConfigDto 缺少必需字段'
      }
    ]
  }
];

const srcDir = path.join(__dirname, '..', 'src');
const testFiles = findTestFiles(srcDir);

console.log(`找到 ${testFiles.length} 个测试文件\n`);

let fixedCount = 0;

// 应用特定修复
specificFixes.forEach(({ file, fixes }) => {
  const filePath = path.join(__dirname, '..', file);
  
  if (!fs.existsSync(filePath)) {
    console.log(`⚠ 文件不存在: ${file}`);
    return;
  }
  
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;
  const appliedFixes = [];
  
  fixes.forEach(({ find, replace, description }) => {
    if (content.match(find)) {
      content = content.replace(find, replace);
      modified = true;
      appliedFixes.push(description);
    }
  });
  
  if (modified) {
    fs.writeFileSync(filePath, content, 'utf8');
    fixedCount++;
    console.log(`✓ ${file}`);
    appliedFixes.forEach(fix => console.log(`  - ${fix}`));
    console.log();
  }
});

console.log(`\n=== 修复总结 ===`);
console.log(`修复文件数: ${fixedCount}`);
