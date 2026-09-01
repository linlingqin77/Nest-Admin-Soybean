/**
 * Harness check: 检查 generated 文件是否被手改
 *
 * 参考 harness/rules/generated-files.json
 */
import { readFileSync, statSync, readdirSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOT = process.cwd();
const RULES_PATH = join(ROOT, 'harness/rules/generated-files.json');

interface Rules {
  patterns: string[];
  rule: string;
}

const rules: Rules = JSON.parse(readFileSync(RULES_PATH, 'utf8'));

function globToRegex(glob: string): RegExp {
  let re = glob
    .replace(/[.+^${}()|[\]\\]/g, '\\$&')
    .replace(/\*\*/g, '::DOUBLESTAR::')
    .replace(/\*/g, '[^/]*')
    .replace(/::DOUBLESTAR::/g, '.*');
  return new RegExp(`^${re}`);
}

const patterns = rules.patterns.map(globToRegex);

function checkFile(file: string): boolean {
  const rel = relative(ROOT, file);
  return patterns.some((re) => re.test(rel));
}

function walk(dir: string): string[] {
  const out: string[] = [];
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    const st = statSync(full);
    if (st.isDirectory()) {
      if (name === '.git' || name === 'node_modules') continue;
      try {
        out.push(...walk(full));
      } catch {}
    } else {
      out.push(full);
    }
  }
  return out;
}

// 用 git diff 检测工作区中已修改的 generated 文件
import { execSync } from 'node:child_process';
let diff = '';
try {
  diff = execSync('git diff --name-only HEAD', { cwd: ROOT, encoding: 'utf8' });
} catch {
  console.log('⚠️  非 git 仓库或无 HEAD，跳过 generated-files 检查');
  process.exit(0);
}

const modified = diff.split('\n').filter(Boolean);
const violations = modified.filter(checkFile);

if (violations.length === 0) {
  console.log('✅ generated 文件未被手改 (0 violations)');
  process.exit(0);
}

console.error(`❌ 检测到手改 generated 文件 (${violations.length}):`);
for (const v of violations) {
  console.error(`  - ${v}`);
}
console.error('\n规则: ' + rules.rule);
process.exit(1);
