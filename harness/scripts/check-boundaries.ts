/**
 * Harness check: 架构边界校验
 *
 * 1. controller 不得直接 import @prisma/client
 * 2. 不得跨模块 import *.repository
 */
import { readFileSync, statSync, readdirSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOT = process.cwd();
const SERVER_SRC = join(ROOT, 'apps/server/src');

interface Violation {
  file: string;
  rule: string;
  detail: string;
}

const violations: Violation[] = [];

function walk(dir: string): string[] {
  const out: string[] = [];
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    const st = statSync(full);
    if (st.isDirectory()) {
      if (name === 'node_modules' || name === 'dist') continue;
      out.push(...walk(full));
    } else if (/\.ts$/.test(name) && !name.endsWith('.d.ts')) {
      out.push(full);
    }
  }
  return out;
}

const controllerFiles = walk(SERVER_SRC).filter((f) => /\.controller\.ts$/.test(f));
const moduleDirs = new Set(controllerFiles.map((f) => f.split('/modules/')[1]?.split('/')[0]).filter(Boolean));

for (const file of walk(SERVER_SRC)) {
  if (file.includes('/test/') || file.includes('/tests/') || file.includes('.spec.')) continue;
  const src = readFileSync(file, 'utf8');
  const rel = relative(ROOT, file);

  // 规则 1: controller 不得 import @prisma/client
  if (rel.includes('/controllers/') || /\.controller\.ts$/.test(file)) {
    if (/from\s+['"]@prisma\/client['"]/.test(src)) {
      violations.push({ file: rel, rule: 'controller-no-prisma', detail: 'controller 不得直接 import @prisma/client' });
    }
  }

  // 规则 2: 不得跨模块 import *.repository
  const myModule = rel.includes('/modules/') ? rel.split('/modules/')[1]?.split('/')[0] : null;
  if (myModule) {
    const importRegex = /from\s+['"]([^'"]+)['"]/g;
    let m: RegExpExecArray | null;
    while ((m = importRegex.exec(src))) {
      const target = m[1];
      if (target.includes('.repository')) {
        const targetModule = target.includes('/modules/')
          ? target.split('/modules/')[1]?.split('/')[0]
          : null;
        if (targetModule && targetModule !== myModule) {
          violations.push({
            file: rel,
            rule: 'no-cross-module-repository',
            detail: `禁止跨模块 import repository: ${target}`,
          });
        }
      }
    }
  }
}

if (violations.length === 0) {
  console.log('✅ 架构边界校验通过 (0 violations)');
  process.exit(0);
}

console.error(`❌ 架构边界校验失败 (${violations.length} violations):`);
for (const v of violations) {
  console.error(`  - [${v.rule}] ${v.file}: ${v.detail}`);
}
process.exit(1);
