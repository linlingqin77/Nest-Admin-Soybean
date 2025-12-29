#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, '..');

// 创建 Result.ok() 的 mock 返回值
const createMockResult = (data = null) => `{ code: 200, msg: '操作成功', data: ${JSON.stringify(data)}, isSuccess: () => true }`;

// 修复文件列表
const fixes = {
  // 1. 修复 loginlog.controller.spec.ts - 添加缺失的导入
  'src/module/monitor/loginlog/loginlog.controller.spec.ts': (content) => {
    // 添加 plainToInstance 和 ListLoginlogDto 导入
    if (!content.includes("import { plainToInstance }")) {
      content = content.replace(
        /(import.*from.*;\n)/,
        "$1import { plainToInstance } from 'class-transformer';\nimport { ListLoginlogDto } from './dto/list-loginlog.dto';\n"
      );
    }
    // 修复 delFlag 类型
    content = content.replace(/delFlag: 'NORMAL'/g, "delFlag: 'NORMAL' as any");
    return content;
  },

  // 2. 修复 operlog.controller.spec.ts - 添加缺失的导入
  'src/module/monitor/operlog/operlog.controller.spec.ts': (content) => {
    if (!content.includes("import { plainToInstance }")) {
      content = content.replace(
        /(import.*from.*;\n)/,
        "$1import { plainToInstance } from 'class-transformer';\nimport { QueryOperLogDto } from './dto/operLog.dto';\n"
      );
    }
    return content;
  },

  // 3. 修复 auth.controller.spec.ts - 移除 OperlogService 导致的循环依赖
  'src/module/main/auth.controller.spec.ts': (content) => {
    // 移除 OperlogService provider
    content = content.replace(
      /,?\s*\{\s*provide:\s*OperlogService,\s*useValue:\s*\{\s*create:\s*jest\.fn\(\)\s*\},?\s*\}/g,
      ''
    );
    // 移除 OperlogService 导入
    content = content.replace(
      /import \{ OperlogService \} from 'src\/module\/monitor\/operlog\/operlog\.service';\n/g,
      ''
    );
    return content;
  },

  // 4. 修复 server.controller.spec.ts - 移除循环依赖
  'src/module/monitor/server/server.controller.spec.ts': (content) => {
    content = content.replace(
      /,?\s*\{\s*provide:\s*OperlogService,\s*useValue:\s*\{\s*create:\s*jest\.fn\(\)\s*\},?\s*\}/g,
      ''
    );
    content = content.replace(
      /import \{ OperlogService \} from 'src\/module\/monitor\/operlog\/operlog\.service';\n/g,
      ''
    );
    return content;
  },

  // 5. 修复 main.controller.spec.ts - 移除循环依赖
  'src/module/main/main.controller.spec.ts': (content) => {
    content = content.replace(
      /,?\s*\{\s*provide:\s*OperlogService,\s*useValue:\s*\{\s*create:\s*jest\.fn\(\)\s*\},?\s*\}/g,
      ''
    );
    content = content.replace(
      /import \{ OperlogService \} from 'src\/module\/monitor\/operlog\/operlog\.service';\n/g,
      ''
    );
    return content;
  },

  // 6. 修复 health.controller.spec.ts - 移除循环依赖
  'src/module/monitor/health/health.controller.spec.ts': (content) => {
    content = content.replace(
      /,?\s*\{\s*provide:\s*OperlogService,\s*useValue:\s*\{\s*create:\s*jest\.fn\(\)\s*\},?\s*\}/g,
      ''
    );
    content = content.replace(
      /import \{ OperlogService \} from 'src\/module\/monitor\/operlog\/operlog\.service';\n/g,
      ''
    );
    return content;
  },

  // 7. 修复 sse.controller.spec.ts - 移除循环依赖
  'src/module/resource/sse.controller.spec.ts': (content) => {
    content = content.replace(
      /,?\s*\{\s*provide:\s*OperlogService,\s*useValue:\s*\{\s*create:\s*jest\.fn\(\)\s*\},?\s*\}/g,
      ''
    );
    content = content.replace(
      /import \{ OperlogService \} from 'src\/module\/monitor\/operlog\/operlog\.service';\n/g,
      ''
    );
    return content;
  },

  // 8. 修复 user-role.service.spec.ts - 修复 dataScope 类型
  'src/module/system/user/services/user-role.service.spec.ts': (content) => {
    content = content.replace(/dataScope: '1'/g, "dataScope: 'ALL' as any");
    content = content.replace(/dataScope: '2'/g, "dataScope: 'CUSTOM' as any");
    
    // 修复 AllocatedListDto 使用 plainToInstance
    if (!content.includes("import { plainToInstance }")) {
      content = content.replace(
        /(import.*from.*;\n)/,
        "$1import { plainToInstance } from 'class-transformer';\n"
      );
    }
    
    // 替换 query 对象
    content = content.replace(
      /const query = \{\s*roleId: (\d+),\s*pageNum: 1,\s*pageSize: 10\s*\};/g,
      "const query = plainToInstance(AllocatedListDto, { roleId: $1, pageNum: 1, pageSize: 10 });"
    );
    content = content.replace(
      /const query = \{\s*roleId: (\d+),\s*userName: '([^']+)',\s*pageNum: 1,\s*pageSize: 10\s*\};/g,
      "const query = plainToInstance(AllocatedListDto, { roleId: $1, userName: '$2', pageNum: 1, pageSize: 10 });"
    );
    
    // 修复 authUserCancelAll 参数
    content = content.replace(
      /const data = \{\s*userIds: '1,2,3',\s*roleId: '1'\s*\};/g,
      "const data = { userIds: '1,2,3', roleId: 1 };"
    );
    
    return content;
  },

  // 9. 修复 notice.controller.spec.ts - 添加 injectUpdate
  'src/module/system/notice/notice.controller.spec.ts': (content) => {
    content = content.replace(
      /const mockUserTool = \{\s*injectCreate: jest\.fn\(\(dto\) => dto\)\s*\};/g,
      "const mockUserTool = { injectCreate: jest.fn((dto) => dto), injectUpdate: jest.fn((dto) => dto) };"
    );
    return content;
  },

  // 10. 修复 post.controller.spec.ts - 添加 injectUpdate
  'src/module/system/post/post.controller.spec.ts': (content) => {
    content = content.replace(
      /const mockUserTool = \{\s*injectCreate: jest\.fn\(\(dto\) => dto\)\s*\};/g,
      "const mockUserTool = { injectCreate: jest.fn((dto) => dto), injectUpdate: jest.fn((dto) => dto) };"
    );
    return content;
  },

  // 11. 修复 config.controller.spec.ts - 添加 injectUpdate 和修复 Result
  'src/module/system/config/config.controller.spec.ts': (content) => {
    // 修复 userTool
    content = content.replace(
      /const userTool = \{\s*injectCreate: jest\.fn\(\(dto\) => dto\)\s*\};/g,
      "const userTool = { injectCreate: jest.fn((dto) => dto), injectUpdate: jest.fn((dto) => dto) };"
    );
    
    // 修复 message -> msg
    content = content.replace(/message: '操作成功'/g, "msg: '操作成功'");
    
    // 添加 isSuccess
    content = content.replace(
      /\{ code: 200, msg: '操作成功' \}/g,
      "{ code: 200, msg: '操作成功', data: null, isSuccess: () => true }"
    );
    
    // 修复 query 使用 plainToInstance
    if (!content.includes("import { plainToInstance }")) {
      content = content.replace(
        /(import.*from.*;\n)/,
        "$1import { plainToInstance } from 'class-transformer';\n"
      );
    }
    
    content = content.replace(
      /const query = \{\s*skip: 0,\s*take: 10\s*\};/g,
      "const query = plainToInstance(ListConfigDto, { pageNum: 1, pageSize: 10 });"
    );
    
    content = content.replace(
      /const body = \{\s*skip: 0,\s*take: 10\s*\};/g,
      "const body = plainToInstance(ListConfigDto, { pageNum: 1, pageSize: 10 });"
    );
    
    return content;
  },
};

let fixedCount = 0;

Object.keys(fixes).forEach(relativePath => {
  const filePath = path.join(srcDir, relativePath);
  
  if (!fs.existsSync(filePath)) {
    console.log(`⚠ 文件不存在: ${relativePath}`);
    return;
  }
  
  const originalContent = fs.readFileSync(filePath, 'utf8');
  const newContent = fixes[relativePath](originalContent);
  
  if (newContent !== originalContent) {
    fs.writeFileSync(filePath, newContent, 'utf8');
    fixedCount++;
    console.log(`✓ ${relativePath}`);
  }
});

console.log(`\n=== 修复总结 ===`);
console.log(`修复文件数: ${fixedCount}`);
