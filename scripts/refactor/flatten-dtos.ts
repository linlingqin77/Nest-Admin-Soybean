/**
 * Phase 4: Flatten DTO structure
 *
 * Analyzes DTO nesting and generates flatten plan.
 * Run: npx tsx scripts/refactor/flatten-dtos.ts
 */

import { readdirSync, statSync, writeFileSync } from 'fs';
import { join } from 'path';

const ROOT = '/Users/mac/Documents/project/nest-admin/apps/server/src';
const REPORT_PATH = '/Users/mac/Documents/project/nest-admin/scripts/refactor/DTO_FLATTEN_PLAN.md';

interface DtoInfo {
  module: string;
  deep: string;
  current: string;
  proposed: string;
  lines: number;
}

function scanDtos(dir: string, depth = 0): DtoInfo[] {
  const results: DtoInfo[] = [];

  for (const entry of readdirSync(dir)) {
    const fullPath = join(dir, entry);

    if (entry === 'dto') {
      const dtoDir = fullPath;
      const moduleName = dir.split('/').pop()!;

      for (const sub of readdirSync(dtoDir)) {
        const subPath = join(dtoDir, sub);
        if (statSync(subPath).isDirectory()) {
          for (const file of readdirSync(subPath)) {
            if (file.endsWith('.dto.ts')) {
              const current = `dto/${sub}/${file}`;
              const proposed = `dto/${file.replace('.request.dto', '').replace('.response.dto', '').replace('.dto', '')}`;
              const fullCurrent = join(dtoDir, sub, file);
              const lines = fullCurrent.split('\n').length;

              results.push({
                module: moduleName,
                deep: `${sub}/${file}`,
                current,
                proposed,
                lines,
              });
            }
          }
        }
      }
      continue;
    }

    if (statSync(fullPath).isDirectory() && depth < 5) {
      results.push(...scanDtos(fullPath, depth + 1));
    }
  }

  return results;
}

// Find modules dir
const modulesDir = join(ROOT, 'modules');
let hasModules = false;
try { statSync(modulesDir); hasModules = true; } catch {}

if (!hasModules) {
  console.log('⚠ modules/ not found. Run move-files.ts first.\n');
  process.exit(0);
}

const dtos = scanDtos(modulesDir);

console.log(`\n=== DTO Flattening Analysis ===`);
console.log(`Found ${dtos.length} DTO files with nested structure\n`);

// Group by module
const byModule: Record<string, DtoInfo[]> = {};
for (const dto of dtos) {
  if (!byModule[dto.module]) byModule[dto.module] = [];
  byModule[dto.module].push(dto);
}

const planLines: string[] = [];
planLines.push('# DTO Flatten Plan\n');
planLines.push(`Generated: ${new Date().toISOString()}\n`);
planLines.push(`Total DTOs to flatten: ${dtos.length}\n\n`);

for (const [module, items] of Object.entries(byModule)) {
  planLines.push(`## ${module}\n`);
  planLines.push('| Current | Proposed | Lines |\n');
  planLines.push('|---------|----------|-------|\n');
  for (const dto of items) {
    planLines.push(`| \`${dto.current}\` | \`${dto.proposed}\` | ${dto.lines} |\n`);
  }
  planLines.push('\n');
}

writeFileSync(REPORT_PATH, planLines.join(''));

console.log('📄 DTO_FLATTEN_PLAN.md generated\n');

console.log('\n=== DTOs by module ===\n');
for (const [module, items] of Object.entries(byModule)) {
  console.log(`\n${module}: ${items.length} DTOs`);
  for (const dto of items) {
    console.log(`  ${dto.current}`);
    console.log(`  → ${dto.proposed}`);
  }
}

console.log('\n✅ Phase 4 analysis complete.\n');
console.log('To flatten: move each file and update imports.\n');
