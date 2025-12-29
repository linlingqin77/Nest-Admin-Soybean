#!/usr/bin/env node
/**
 * 全面修复所有测试文件的脚本
 * 一次性修复所有已知问题
 */

const fs = require('fs');
const path = require('path');

// 需要修复的文件列表和对应的修复函数
const fixes = [];

// 辅助函数：读取文件
function readFile(filePath) {
  const fullPath = path.join(__dirname, '..', filePath);
  if (!fs.existsSync(fullPath)) {
    console.log(`文件不存在: ${filePath}`);
    return null;
  }
  return fs.readFileSync(fullPath, 'utf-8');
}

// 辅助函数：写入文件
function writeFile(filePath, content) {
  const fullPath = path.join(__dirname, '..', filePath);
  fs.writeFileSync(fullPath, content, 'utf-8');
  console.log(`✅ 已修复: ${filePath}`);
}

// 1. 修复 redis.service.spec.ts - blpop/brpop mock 返回值问题
function fixRedisServiceSpec() {
  const filePath = 'src/module/common/redis/redis.service.spec.ts';
  let content = readFile(filePath);
  if (!content) return;

  // 修复 blpop mock - 应该返回 [key, value] 格式
  content = content.replace(
    /mockClient\.blpop\.mockResolvedValue\('value1'\)/g,
    "mockClient.blpop.mockResolvedValue(['list1', 'value1'])"
  );
  
  // 修复 brpop mock
  content = content.replace(
    /mockClient\.brpop\.mockResolvedValue\('value1'\)/g,
    "mockClient.brpop.mockResolvedValue(['list1', 'value1'])"
  );

  // 修复空列表返回 null 的情况
  content = content.replace(
    /moc