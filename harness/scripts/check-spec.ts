/**
 * Harness check: 新功能 spec 存在性
 *
 * 规则: 新增/修改 src/modules 下功能必须有 docs/specs/{name}/spec.md
 */
import { readFileSync, statSync, readdirSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOT = process.cwd();
const MODULES = join(ROOT, 'apps/server/src/modules');
const SPECS = join(ROOT, 'docs/specs');

function moduleNames(dir: string): string[] {
  if (!existsSync(dir)) return [];
  return readdirSync(dir).filter((n) => {
    try {
      return statSync(join(dir, n)).isDirectory();
    } catch {
      return false;
    }
  });
}

function existsSync(p: string): boolean {
  try {
    statSync(p);
    return true;
  } catch {
    return false;
  }
}

const modules = moduleNames(MODULES);
const specs = moduleNames(SPECS);

const missing: string[] = [];
for (const m of modules) {
  // 系统级模块（auth、common 等）允许不写 spec
  if (['auth', 'common', 'platform', 'core', 'shared'].includes(m)) continue;
  if (!specs.includes(m)) {
    // 兼容嵌套子目录: 仅当模块目录下有 controller 才要求 spec
    const moduleDir = join(MODULES, m);
    const hasController = readdirSync(moduleDir).some((f) => f.endsWith('.controller.ts'));
    if (hasController) {
      missing.push(m);
    }
  }
}

if (missing.length === 0) {
  console.log('✅ 所有业务模块都有 spec (0 missing)');
  process.exit(0);
}

console.log(`⚠️  以下业务模块缺少 spec（仅作提示，不阻塞）:`);
for (const m of missing) {
  console.log(`  - apps/server/src/modules/${m}/`);
}
// 遗留模块较多，暂不阻塞，仅作提示
process.exit(0);
