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

const fixes = {
  // 修复 1: job.controller.spec.ts 的导入路径
  'src/module/monitor/job/job.controller.spec.ts': (content) => {
    if (content.includes("from './dto/list-job.dto'")) {
      content = content.replace("from './dto/list-job.dto'", "from './dto/create-job.dto'");
      
      // 添加 plainToInstance 使用
      content = content.replace(
        /const query = \{\s*pageNum: 1,\s*pageSize: 10\s*\};/g,
        'const query = plainToInstance(ListJobDto, { pageNum: 1, pageSize: 10 });'
      );
      
      // 确保有 plainToInstance 导入
      if (!content.includes('plainToInstance')) {
        content = content.replace(
          /(import.*from.*;\n)/,
          "$1import { plainToInstance } from 'class-transformer';\n"
        );
      }
      
      return { modified: true, content, fixes: ['修复导入路径', '添加 plainToInstance'] };
    }
    return { modified: false };
  },
  
  // 修复 2: loginlog.controller.spec.ts 的 DTO 使用
  'src/module/monitor/loginlog/loginlog.controller.spec.ts': (content) => {
    let modified = false;
    const appliedFixes = [];
    
    // 替换所有直接使用对象的地方为 plainToInstance
    if (content.includes('{ skip: 0, take: 10, pageNum: 1, pageSize: 10 }')) {
      content = content.replace(
        /\{ skip: 0, take: 10, pageNum: 1, pageSize: 10 \}/g,
        'plainToInstance(ListLoginlogDto, { pageNum: 1, pageSize: 10 })'
      );
      modified = true;
      appliedFixes.push('修复 DTO 使用 plainToInstance');
    }
    
    // 添加缺失的字段到 mock 数据
    if (content.includes('infoId: 1,') && !content.includes('tenantId:')) {
      content = content.replace(
        /const mockLoginLog = \{/,
        `const mockLoginLog = {\n    tenantId: '000000',`
      );
      content = content.replace(
        /status: Status\.NORMAL,/,
        `status: Status.NORMAL,\n    deviceType: 'PC' as any,`
      );
      modified = true;
      appliedFixes.push('添加缺失字段');
    }
    
    // 确保有 plainToInstance 导入
    if (modified && !content.includes('plainToInstance')) {
      content = content.replace(
        /(import.*from.*;\n)/,
        "$1import { plainToInstance } from 'class-transformer';\n"
      );
    }
    
    return modified ? { modified: true, content, fixes: appliedFixes } : { modified: false };
  },
  
  // 修复 3: operlog.controller.spec.ts 的 DTO 使用
  'src/module/monitor/operlog/operlog.controller.spec.ts': (content) => {
    let modified = false;
    const appliedFixes = [];
    
    // 替换 query 对象为 plainToInstance
    if (content.includes('{ pageNum: 1, pageSize: 10, skip: 0, take: 10 }')) {
      content = content.replace(
        /\{ pageNum: 1, pageSize: 10, skip: 0, take: 10 \}/g,
        'plainToInstance(QueryOperLogDto, { pageNum: 1, pageSize: 10 })'
      );
      modified = true;
      appliedFixes.push('修复 DTO 使用 plainToInstance');
    }
    
    // 添加缺失的字段到 mock 数据
    if (content.includes('operId: 1,') && !content.includes('tenantId:')) {
      content = content.replace(
        /const mockOperLog = \{/,
        `const mockOperLog = {\n    tenantId: '000000',`
      );
      modified = true;
      appliedFixes.push('添加 tenantId 字段');
    }
    
    // 确保有 plainToInstance 导入
    if (modified && !content.includes('plainToInstance')) {
      content = content.replace(
        /(import.*from.*;\n)/,
        "$1import { plainToInstance } from 'class-transformer';\n"
      );
    }
    
    return modified ? { modified: true, content, fixes: appliedFixes } : { modified: false };
  },
  
  // 修复 4: dept.controller.spec.ts 的 Result 对象
  'src/module/system/dept/dept.controller.spec.ts': (content) => {
    let modified = false;
    const appliedFixes = [];
    
    // 修复缺少 msg 和 isSuccess 的 Result 对象
    content = content.replace(
      /const mockResult = \{ code: 200, msg: '操作成功' \};/g,
      "const mockResult = { code: 200, msg: '操作成功', data: null, isSuccess: true };"
    );
    
    content = content.replace(
      /const mockResult = \{ code: 200, data: \[\] \};/g,
      "const mockResult = { code: 200, msg: '操作成功', data: [], isSuccess: true };"
    );
    
    content = content.replace(
      /const mockResult = \{ code: 200, data: \{ deptId: 1, deptName: '测试部门' \} \};/g,
      "const mockResult = { code: 200, msg: '操作成功', data: { deptId: 1, deptName: '测试部门' }, isSuccess: true };"
    );
    
    content = content.replace(
      /const mockResult = \{ code: 200, data: \{\} \};/g,
      "const mockResult = { code: 200, msg: '操作成功', data: {}, isSuccess: true };"
    );
    
    // 修复 UpdateDeptDto 缺少 parentId
    if (content.includes('deptId: 1, deptName:') && !content.includes('parentId:')) {
      content = content.replace(
        /const updateDto = \{[\s\S]*?deptId: 1,[\s\S]*?deptName: '更新部门',[\s\S]*?orderNum: 1,?[\s\S]*?\};/,
        `const updateDto = {
        deptId: 1,
        parentId: 0,
        deptName: '更新部门',
        orderNum: 1,
      };`
      );
      modified = true;
      appliedFixes.push('添加 parentId 字段');
    }
    
    if (content !== fs.readFileSync(path.join(__dirname, '..', 'src/module/system/dept/dept.controller.spec.ts'), 'utf8')) {
      modified = true;
      appliedFixes.push('修复 Result 对象');
    }
    
    return modified ? { modified: true, content, fixes: appliedFixes } : { modified: false };
  },
};

const srcDir = path.join(__dirname, '..', 'src');
const testFiles = findTestFiles(srcDir);

console.log(`找到 ${testFiles.length} 个测试文件\n`);

let fixedCount = 0;

// 应用特定修复
Object.keys(fixes).forEach(relativePath => {
  const filePath = path.join(__dirname, '..', relativePath);
  
  if (!fs.existsSync(filePath)) {
    console.log(`⚠ 文件不存在: ${relativePath}`);
    return;
  }
  
  const content = fs.readFileSync(filePath, 'utf8');
  const result = fixes[relativePath](content);
  
  if (result.modified) {
    fs.writeFileSync(filePath, result.content, 'utf8');
    fixedCount++;
    console.log(`✓ ${relativePath}`);
    result.fixes.forEach(fix => console.log(`  - ${fix}`));
    console.log();
  }
});

console.log(`\n=== 修复总结 ===`);
console.log(`修复文件数: ${fixedCount}`);
