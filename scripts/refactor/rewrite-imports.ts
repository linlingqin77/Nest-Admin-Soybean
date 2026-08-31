/**
 * Phase 2: Rewrite Import Paths
 *
 * Scans all .ts files and rewrites import paths according to refactoring plan.
 *
 * Run: npx tsx scripts/refactor/rewrite-imports.ts
 */

import { readFileSync, readdirSync, statSync, writeFileSync } from 'fs';
import { join, relative, sep } from 'path';

const ROOT = '/Users/mac/Documents/project/nest-admin/apps/server/src';
// Scan src and test dirs only, exclude node_modules
const SCAN_ROOTS = [
  '/Users/mac/Documents/project/nest-admin/apps/server/src',
  '/Users/mac/Documents/project/nest-admin/apps/server/test',
];
const REPORT_PATH = '/Users/mac/Documents/project/nest-admin/scripts/refactor/migration-report.md';

// ──────────────────────────────────────────────
// 1. PATH REWRITE RULES
// Each rule: (regex to match, replacement string, optional description)
// ──────────────────────────────────────────────
type Rule = { pattern: RegExp; replacement: string; description: string };

const RULES: Rule[] = [
  // ── Infrastructure → Platform ──
  { pattern: /infrastructure\/logging/g, replacement: 'platform/logger', description: 'infrastructure/logging → platform/logger' },
  { pattern: /infrastructure\/prisma/g, replacement: 'platform/prisma', description: 'infrastructure/prisma → platform/prisma' },
  { pattern: /infrastructure\/cache/g, replacement: 'platform/redis', description: 'infrastructure/cache → platform/redis' },
  { pattern: /infrastructure\/dataloader/g, replacement: 'platform/dataloader', description: 'infrastructure/dataloader → platform/dataloader' },
  { pattern: /infrastructure\/repository/g, replacement: 'platform/repository', description: 'infrastructure/repository → platform/repository' },
  { pattern: /module\/common\/redis/g, replacement: 'platform/redis', description: 'module/common/redis → platform/redis' },
  { pattern: /module\/common\/bull/g, replacement: 'platform/queue', description: 'module/common/bull → platform/queue' },
  { pattern: /module\/common\/axios/g, replacement: 'modules/axios', description: 'module/common/axios → modules/axios' },
  { pattern: /module\/resource\/oss-config/g, replacement: 'platform/storage', description: 'module/resource/oss-config → platform/storage' },
  { pattern: /module\/resource\/oss/g, replacement: 'platform/storage', description: 'module/resource/oss → platform/storage' },

  // ── Observability ──
  { pattern: /observability\/metrics/g, replacement: 'core/observability/metrics', description: 'observability/metrics → core/observability/metrics' },
  { pattern: /observability\/tracing/g, replacement: 'core/observability/tracing', description: 'observability/tracing → core/observability/tracing' },
  { pattern: /observability\/health/g, replacement: 'core/observability/health', description: 'observability/health → core/observability/health' },
  { pattern: /observability\/audit/g, replacement: 'core/audit', description: 'observability/audit → core/audit' },

  // ── Resilience ──
  { pattern: /resilience\/circuit-breaker/g, replacement: 'platform/resilience/circuit-breaker', description: 'resilience/circuit-breaker → platform/resilience' },

  // ── Security → Core ──
  { pattern: /security\/login/g, replacement: 'core/auth', description: 'security/login → core/auth' },
  { pattern: /security\/mfa/g, replacement: 'core/auth/mfa', description: 'security/mfa → core/auth/mfa' },
  { pattern: /security\/crypto/g, replacement: 'core/crypto', description: 'security/crypto → core/crypto' },

  // ── Tenant → Core ──
  { pattern: /tenant\/middleware/g, replacement: 'core/tenancy/middleware', description: 'tenant/middleware → core/tenancy/middleware' },
  { pattern: /tenant\/types/g, replacement: 'core/tenancy/types', description: 'tenant/types → core/tenancy/types' },
  { pattern: /tenant\/context/g, replacement: 'core/tenancy/context', description: 'tenant/context → core/tenancy/context' },
  { pattern: /tenant\/decorators/g, replacement: 'core/tenancy/decorators', description: 'tenant/decorators → core/tenancy/decorators' },
  { pattern: /tenant\/constants/g, replacement: 'core/tenancy/constants', description: 'tenant/constants → core/tenancy/constants' },
  { pattern: /tenant\/exceptions/g, replacement: 'core/tenancy/exceptions', description: 'tenant/exceptions → core/tenancy/exceptions' },
  { pattern: /tenant\/extensions/g, replacement: 'core/tenancy/extensions', description: 'tenant/extensions → core/tenancy/extensions' },
  { pattern: /tenant\/services/g, replacement: 'core/tenancy/services', description: 'tenant/services → core/tenancy/services' },
  { pattern: /tenant\/guards/g, replacement: 'core/tenancy/guards', description: 'tenant/guards → core/tenancy/guards' },

  // ── Module: System → Modules ──
  { pattern: /module\/system\/auth/g, replacement: 'modules/auth', description: 'module/system/auth → modules/auth' },
  { pattern: /module\/system\/user/g, replacement: 'modules/users', description: 'module/system/user → modules/users' },
  { pattern: /module\/system\/role/g, replacement: 'modules/roles', description: 'module/system/role → modules/roles' },
  { pattern: /module\/system\/menu/g, replacement: 'modules/menus', description: 'module/system/menu → modules/menus' },
  { pattern: /module\/system\/dept/g, replacement: 'modules/depts', description: 'module/system/dept → modules/depts' },
  { pattern: /module\/system\/post/g, replacement: 'modules/posts', description: 'module/system/post → modules/posts' },
  { pattern: /module\/system\/dict/g, replacement: 'modules/dicts', description: 'module/system/dict → modules/dicts' },
  { pattern: /module\/system\/client/g, replacement: 'modules/clients', description: 'module/system/client → modules/clients' },
  { pattern: /module\/system\/notice/g, replacement: 'modules/notices', description: 'module/system/notice → modules/notices' },
  { pattern: /module\/system\/config/g, replacement: 'modules/configs', description: 'module/system/config → modules/configs' },
  { pattern: /module\/system\/system-config/g, replacement: 'modules/configs', description: 'module/system/system-config → modules/configs' },
  { pattern: /module\/system\/file-manager/g, replacement: 'modules/files', description: 'module/system/file-manager → modules/files' },
  { pattern: /module\/system\/upload/g, replacement: 'modules/files', description: 'module/system/upload → modules/files' },
  { pattern: /module\/system\/tool/g, replacement: 'modules/tools', description: 'module/system/tool → modules/tools' },
  { pattern: /module\/system\/docs/g, replacement: 'modules/docs', description: 'module/system/docs → modules/docs' },

  // ── Module: Mail ──
  { pattern: /module\/system\/mail\/account/g, replacement: 'modules/mails/accounts', description: 'mail/account → mails/accounts' },
  { pattern: /module\/system\/mail\/log/g, replacement: 'modules/mails/logs', description: 'mail/log → mails/logs' },
  { pattern: /module\/system\/mail\/template/g, replacement: 'modules/mails/templates', description: 'mail/template → mails/templates' },
  { pattern: /module\/system\/mail\/send/g, replacement: 'modules/mails/send', description: 'mail/send → mails/send' },

  // ── Module: SMS ──
  { pattern: /module\/system\/sms\/channel/g, replacement: 'modules/sms/channels', description: 'sms/channel → sms/channels' },
  { pattern: /module\/system\/sms\/log/g, replacement: 'modules/sms/logs', description: 'sms/log → sms/logs' },
  { pattern: /module\/system\/sms\/template/g, replacement: 'modules/sms/templates', description: 'sms/template → sms/templates' },
  { pattern: /module\/system\/sms\/send/g, replacement: 'modules/sms/send', description: 'sms/send → sms/send' },

  // ── Module: Notify ──
  { pattern: /module\/system\/notify\/message/g, replacement: 'modules/notifies/messages', description: 'notify/message → notifies/messages' },
  { pattern: /module\/system\/notify\/template/g, replacement: 'modules/notifies/templates', description: 'notify/template → notifies/templates' },

  // ── Module: Tenant ──
  { pattern: /module\/system\/tenant-package/g, replacement: 'modules/tenant-packages', description: 'tenant-package → tenant-packages' },
  { pattern: /module\/system\/tenant\/quota/g, replacement: 'modules/tenant-quotas', description: 'tenant/quota → tenant-quotas' },
  { pattern: /module\/system\/tenant\/audit/g, replacement: 'modules/tenant-audits', description: 'tenant/audit → tenant-audits' },
  { pattern: /module\/system\/tenant\/dashboard/g, replacement: 'modules/tenant-dashboards', description: 'tenant/dashboard → tenant-dashboards' },
  { pattern: /module\/system\/tenant/g, replacement: 'modules/tenants', description: 'tenant → tenants (do this last for tenant sub-routes)' },

  // ── Module: Monitor ──
  { pattern: /module\/monitor\/server/g, replacement: 'modules/monitors/server', description: 'monitor/server → monitors/server' },
  { pattern: /module\/monitor\/cache/g, replacement: 'modules/monitors/cache', description: 'monitor/cache → monitors/cache' },
  { pattern: /module\/monitor\/metrics/g, replacement: 'modules/monitors/metrics', description: 'monitor/metrics → monitors/metrics' },
  { pattern: /module\/monitor\/online/g, replacement: 'modules/monitors/online', description: 'monitor/online → monitors/online' },
  { pattern: /module\/monitor\/job/g, replacement: 'modules/monitors/jobs', description: 'monitor/job → monitors/jobs' },
  { pattern: /module\/monitor\/loginlog/g, replacement: 'modules/login-logs', description: 'monitor/loginlog → login-logs' },
  { pattern: /module\/monitor\/operlog/g, replacement: 'modules/oper-logs', description: 'monitor/operlog → oper-logs' },
  { pattern: /module\/monitor\/health/g, replacement: 'modules/health', description: 'monitor/health → health' },

  // ── Module: Backup ──
  { pattern: /module\/backup/g, replacement: 'modules/backup', description: 'module/backup → modules/backup' },

  // ── Module: Main → Auth ──
  { pattern: /module\/main/g, replacement: 'modules/auth', description: 'module/main → modules/auth' },

  // ── Module: Upload (root level) → files ──
  { pattern: /module\/upload/g, replacement: 'modules/files', description: 'module/upload → modules/files' },

  // ── Module: Resource (already in above rules) ──
  { pattern: /module\/resource/g, replacement: 'platform/storage', description: 'module/resource → platform/storage' },

  // ── Module: Monitor parent ──
  { pattern: /module\/monitor/g, replacement: 'modules/monitors', description: 'module/monitor → modules/monitors' },

  // ── Module: Common ──
  { pattern: /module\/common/g, replacement: 'modules', description: 'module/common → modules' },

  // ── Module: System root (catch-all) ──
  { pattern: /module\/system/g, replacement: 'modules', description: 'module/system → modules' },

  // ── Module: root level catch-all ──
  { pattern: /module\b/g, replacement: 'modules', description: 'module → modules (root)' },

  // ── Config root → platform/config (only in import paths, NOT in variable names) ──
  // Match: from 'src/config' or from 'config' (only at start of path)
  { pattern: /from\s+['"]src\/config/g, replacement: "from 'src/platform/config", description: 'src/config → src/platform/config' },
  { pattern: /from\s+['"]\.\.\/config/g, replacement: "from '../platform/config", description: '../config → ../platform/config' },
  { pattern: /from\s+['"]\.\/config/g, replacement: "from './platform/config", description: './config → ./platform/config' },

  // ── Core reorg: guards ──
  { pattern: /core\/guards\/auth\.guard/g, replacement: 'core/auth/guards/auth.guard', description: 'auth.guard → core/auth/guards' },
  { pattern: /core\/guards\/permission\.guard/g, replacement: 'core/permissions/guards/permission.guard', description: 'permission.guard → core/permissions/guards' },
  { pattern: /core\/guards\/roles\.guard/g, replacement: 'core/permissions/guards/roles.guard', description: 'roles.guard → core/permissions/guards' },
  { pattern: /core\/guards\/throttle\.guard/g, replacement: 'core/http/guards/throttle.guard', description: 'throttle.guard → core/http/guards' },
  { pattern: /core\/guards\/multi-throttle\.guard/g, replacement: 'core/http/guards/multi-throttle.guard', description: 'multi-throttle.guard → core/http/guards' },
  { pattern: /core\/guards/g, replacement: 'core/http/guards', description: 'core/guards → core/http/guards (catch-all)' },

  // ── Core reorg: filters/interceptors/middleware/transaction → core/http ──
  { pattern: /core\/filters/g, replacement: 'core/http/filters', description: 'core/filters → core/http/filters' },
  { pattern: /core\/interceptors/g, replacement: 'core/http/interceptors', description: 'core/interceptors → core/http/interceptors' },
  { pattern: /core\/middleware/g, replacement: 'core/http/middleware', description: 'core/middleware → core/http/middleware' },
  { pattern: /core\/transaction/g, replacement: 'core/http/transaction', description: 'core/transaction → core/http/transaction' },

  // ── Core reorg: decorators ──
  { pattern: /core\/decorators\/audit\.decorator/g, replacement: 'core/audit/decorators/audit.decorator', description: 'audit.decorator → core/audit' },
  { pattern: /core\/decorators\/operlog\.decorator/g, replacement: 'core/audit/decorators/operlog.decorator', description: 'operlog.decorator → core/audit' },
  { pattern: /core\/decorators\/data-permission\.decorator/g, replacement: 'core/permissions/decorators/data-permission.decorator', description: 'data-permission.decorator → core/permissions' },
  { pattern: /core\/decorators\/permission\.decorator/g, replacement: 'core/permissions/decorators/permission.decorator', description: 'permission.decorator → core/permissions' },
  { pattern: /core\/decorators\/role\.decorator/g, replacement: 'core/permissions/decorators/role.decorator', description: 'role.decorator → core/permissions' },
  { pattern: /core\/decorators\/transactional\.decorator/g, replacement: 'core/http/decorators/transactional.decorator', description: 'transactional.decorator → core/http' },
  { pattern: /core\/decorators\/idempotent\.decorator/g, replacement: 'core/http/decorators/idempotent.decorator', description: 'idempotent.decorator → core/http' },
  { pattern: /core\/decorators\/lock\.decorator/g, replacement: 'core/http/decorators/lock.decorator', description: 'lock.decorator → core/http' },
  { pattern: /core\/decorators\/retry\.decorator/g, replacement: 'core/http/decorators/retry.decorator', description: 'retry.decorator → core/http' },
  { pattern: /core\/decorators\/circuit-breaker\.decorator/g, replacement: 'core/http/decorators/circuit-breaker.decorator', description: 'circuit-breaker.decorator → core/http' },
  { pattern: /core\/decorators\/system-cache\.decorator/g, replacement: 'core/http/decorators/system-cache.decorator', description: 'system-cache.decorator → core/http' },
  { pattern: /core\/decorators\/task\.decorator/g, replacement: 'core/http/decorators/task.decorator', description: 'task.decorator → core/http' },
  { pattern: /core\/decorators\/public\.decorator/g, replacement: 'core/auth/decorators/public.decorator', description: 'public.decorator → core/auth' },
  { pattern: /core\/decorators\/captcha\.decorator/g, replacement: 'core/auth/decorators/captcha.decorator', description: 'captcha.decorator → core/auth' },
  { pattern: /core\/decorators\/common\.decorator/g, replacement: 'core/auth/decorators/common.decorator', description: 'common.decorator → core/auth' },
  { pattern: /core\/decorators\/redis\.decorator/g, replacement: 'core/auth/decorators/redis.decorator', description: 'redis.decorator → core/auth' },
  { pattern: /core\/decorators\/tenant-job\.decorator/g, replacement: 'core/tenancy/decorators/tenant-job.decorator', description: 'tenant-job.decorator → core/tenancy' },
  { pattern: /core\/decorators/g, replacement: 'core/http/decorators', description: 'core/decorators → core/http/decorators (catch-all)' },

  // ── Core reorg: constants → shared ──
  { pattern: /core\/constants/g, replacement: 'shared/constants', description: 'core/constants → shared/constants' },

  // ── Security catch-all ──
  { pattern: /security\b/g, replacement: 'core', description: 'security → core (catch-all)' },
];

// ──────────────────────────────────────────────
// 2. SCAN & REWRITE
// ──────────────────────────────────────────────
function getAllTsFiles(): string[] {
  const files: string[] = [];
  function scanDir(dir: string) {
    try {
      for (const entry of readdirSync(dir)) {
        if (entry === 'node_modules' || entry.startsWith('.')) continue;
        const fullPath = join(dir, entry);
        if (statSync(fullPath).isDirectory()) {
          scanDir(fullPath);
        } else if (entry.endsWith('.ts')) {
          files.push(fullPath);
        }
      }
    } catch {}
  }
  for (const root of SCAN_ROOTS) {
    scanDir(root);
  }
  return files;
}

interface FileChange {
  file: string;
  changes: string[];
}

const changes: FileChange[] = [];
const files = getAllTsFiles();

console.log(`\n=== Phase 2: Rewriting import paths ===`);
console.log(`Scanning ${files.length} files...\n`);

for (const file of files) {
  let content = readFileSync(file, 'utf-8');
  const originalContent = content;
  const fileChanges: string[] = [];

  for (const rule of RULES) {
    if (rule.pattern.test(content)) {
      const before = content;
      content = content.replace(rule.pattern, rule.replacement);
      if (content !== before) {
        fileChanges.push(rule.description);
      }
    }
  }

  if (content !== originalContent) {
    writeFileSync(file, content);
    changes.push({ file: file.replace('/Users/mac/Documents/project/nest-admin/', ''), changes: fileChanges });
  }
}

console.log(`\n✅ Rewrote ${changes.length} files\n`);

// ──────────────────────────────────────────────
// 3. Generate Report
// ──────────────────────────────────────────────
const reportLines: string[] = [];
reportLines.push('# Refactoring Migration Report\n');
reportLines.push(`**Total files modified**: ${changes.length}\n`);
reportLines.push(`**Timestamp**: ${new Date().toISOString()}\n`);
reportLines.push('\n---\n\n## File Changes\n');

for (const { file, changes: fileChanges } of changes) {
  reportLines.push(`### ${file}\n`);
  for (const change of fileChanges) {
    reportLines.push(`- ${change}`);
  }
  reportLines.push('\n');
}

writeFileSync(REPORT_PATH, reportLines.join(''));
console.log(`📄 Report: ${REPORT_PATH}\n`);

// Print top 20 most changed rules
const ruleCount: Record<string, number> = {};
for (const { changes: fileChanges } of changes) {
  for (const change of fileChanges) {
    ruleCount[change] = (ruleCount[change] || 0) + 1;
  }
}

console.log('\nTop changes by frequency:');
const sorted = Object.entries(ruleCount).sort((a, b) => b[1] - a[1]).slice(0, 20);
for (const [rule, count] of sorted) {
  console.log(`  ${count.toString().padStart(4)} ${rule}`);
}
