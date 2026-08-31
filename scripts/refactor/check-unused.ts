/**
 * Phase 5: Check for unused files and dead imports
 * Run: npx tsx scripts/refactor/check-unused.ts
 */

import { readdirSync, readFileSync, statSync, unlinkSync, writeFileSync } from 'fs';
import { join } from 'path';

const ROOT = '/Users/mac/Documents/project/nest-admin/apps/server/src';

interface FileInfo {
  path: string;
  reExportedBy: string[];
  importedBy: string[];
}

function getAllTsFiles(dir: string): string[] {
  const files: string[] = [];
  for (const entry of readdirSync(dir)) {
    const fullPath = join(dir, entry);
    if (statSync(fullPath).isDirectory()) {
      files.push(...getAllTsFiles(fullPath));
    } else if (entry.endsWith('.ts') && !entry.endsWith('.spec.ts')) {
      files.push(fullPath);
    }
  }
  return files;
}

function getExportPaths(content: string): string[] {
  const paths: string[] = [];
  // Named exports: export { foo } from './bar'
  const reExports = content.matchAll(/export\s*\{[^}]*\}\s*from\s*['"]([^'"]+)['"]/g);
  for (const m of reExports) {
    paths.push(m[1]);
  }
  // Default + named: export { default } from './bar'
  const reExports2 = content.matchAll(/export\s+.*?\s+from\s+['"]([^'"]+)['"]/g);
  for (const m of reExports2) {
    paths.push(m[1]);
  }
  return paths;
}

function getImportPaths(content: string): string[] {
  const paths: string[] = [];
  const imports = content.matchAll(/import\s+.*?\s+from\s+['"]([^'"]+)['"]/g);
  for (const m of imports) {
    paths.push(m[1]);
  }
  const sideEffect = content.matchAll(/import\s+['"]([^'"]+)['"]/g);
  for (const m of sideEffect) {
    paths.push(m[1]);
  }
  return paths;
}

function resolvePath(from: string, importPath: string): string | null {
  // Skip external/absolute imports
  if (importPath.startsWith('@') || importPath.startsWith('#')) return null;
  if (importPath.startsWith('http')) return null;

  const fromDir = join(from, '..');
  const exts = ['', '.ts', '.tsx', '/index.ts'];

  for (const ext of exts) {
    try {
      const resolved = join(fromDir, importPath + ext);
      if (statSync(resolved).isFile()) return resolved;
    } catch {}
  }
  return null;
}

console.log('\n=== Phase 5: Check Unused Files ===\n');

const allFiles = getAllTsFiles(ROOT);
console.log(`Total files: ${allFiles.length}\n`);

// Build import graph
const importGraph: Map<string, string[]> = new Map();
const fileMap: Map<string, string> = new Map();

for (const file of allFiles) {
  const relative = file.replace(ROOT + '/', '');
  fileMap.set(relative, file);

  try {
    const content = readFileSync(file, 'utf-8');
    const imports = getImportPaths(content);
    const resolved = imports
      .map((p) => resolvePath(file, p))
      .filter(Boolean) as string[];
    importGraph.set(relative, resolved);
  } catch {}
}

// Find files only imported by themselves (orphan candidates)
const orphanCandidates: string[] = [];
const allImportTargets = new Set<string>();
for (const targets of importGraph.values()) {
  for (const t of targets) {
    allImportTargets.add(t);
  }
}

// Files not imported by anyone (excluding main entry points)
const entryPoints = ['main.ts', 'app.module.ts'];
const orphans: string[] = [];

for (const [file] of importGraph) {
  if (!allImportTargets.has(file) && !entryPoints.includes(file.split('/').pop()!)) {
    orphans.push(file);
  }
}

console.log(`\n📦 Potentially orphaned files (not imported by others):\n`);
for (const o of orphans.sort()) {
  console.log(`  ${o}`);
}

writeFileSync(
  '/Users/mac/Documents/project/nest-admin/scripts/refactor/ORPHANS.md',
  '# Orphan Files Report\n\n' + orphans.map((o) => `- \`${o}\``).join('\n')
);

console.log(`\n📄 ORPHANS.md generated\n`);
console.log('✅ Phase 5 complete.\n');
console.log('⚠ Manual review needed: check ORPHANS.md for files that should be deleted.\n');
