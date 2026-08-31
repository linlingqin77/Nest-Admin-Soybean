/**
 * Phase 1: Move & Merge Directories
 *
 * Moves and merges directories according to the refactoring plan:
 * - infrastructure/* → platform/*
 * - core/* + security/* + tenant/* → core/* (reorganized)
 * - module/* → modules/*
 *
 * Run: npx tsx scripts/refactor/move-files.ts
 */

import { cpSync, existsSync, mkdirSync, rmSync, statSync, readdirSync } from 'fs';
import { join, basename } from 'path';

const ROOT = '/Users/mac/Documents/project/nest-admin/apps/server/src';

// ──────────────────────────────────────────────
// 1. PATH REMAPPING RULES
// ──────────────────────────────────────────────
const MOVE_RULES: Array<[from: string, to: string]> = [
  // ── Infrastructure → Platform ──
  [`${ROOT}/infrastructure/logging`, `${ROOT}/platform/logger`],
  [`${ROOT}/infrastructure/prisma`, `${ROOT}/platform/prisma`],
  [`${ROOT}/infrastructure/cache`, `${ROOT}/platform/redis`],
  [`${ROOT}/infrastructure/dataloader`, `${ROOT}/platform/dataloader`],
  [`${ROOT}/infrastructure/repository`, `${ROOT}/platform/repository`],
  [`${ROOT}/module/common/redis`, `${ROOT}/platform/redis`],
  [`${ROOT}/module/common/bull`, `${ROOT}/platform/queue`],
  [`${ROOT}/module/common/axios`, `${ROOT}/modules/axios`],
  [`${ROOT}/module/resource/oss-config`, `${ROOT}/platform/storage`],
  [`${ROOT}/module/resource/oss`, `${ROOT}/platform/storage`],

  // ── Observability ──
  [`${ROOT}/observability/metrics`, `${ROOT}/core/observability/metrics`],
  [`${ROOT}/observability/tracing`, `${ROOT}/core/observability/tracing`],
  [`${ROOT}/observability/audit`, `${ROOT}/core/audit`],

  // ── Resilience ──
  [`${ROOT}/resilience`, `${ROOT}/platform/resilience`],

  // ── Security → Core ──
  [`${ROOT}/security/login`, `${ROOT}/core/auth`],
  [`${ROOT}/security/mfa`, `${ROOT}/core/auth/mfa`],
  [`${ROOT}/security/crypto`, `${ROOT}/core/crypto`],

  // ── Tenant → Core ──
  [`${ROOT}/tenant`, `${ROOT}/core/tenancy`],

  // ── Module: System → Modules ──
  [`${ROOT}/module/system/auth`, `${ROOT}/modules/auth`],
  [`${ROOT}/module/system/user`, `${ROOT}/modules/users`],
  [`${ROOT}/module/system/role`, `${ROOT}/modules/roles`],
  [`${ROOT}/module/system/menu`, `${ROOT}/modules/menus`],
  [`${ROOT}/module/system/dept`, `${ROOT}/modules/depts`],
  [`${ROOT}/module/system/post`, `${ROOT}/modules/posts`],
  [`${ROOT}/module/system/dict`, `${ROOT}/modules/dicts`],
  [`${ROOT}/module/system/client`, `${ROOT}/modules/clients`],
  [`${ROOT}/module/system/notice`, `${ROOT}/modules/notices`],

  // ── Module: Mail ──
  [`${ROOT}/module/system/mail/account`, `${ROOT}/modules/mails/accounts`],
  [`${ROOT}/module/system/mail/log`, `${ROOT}/modules/mails/logs`],
  [`${ROOT}/module/system/mail/template`, `${ROOT}/modules/mails/templates`],
  [`${ROOT}/module/system/mail/send`, `${ROOT}/modules/mails/send`],

  // ── Module: SMS ──
  [`${ROOT}/module/system/sms/channel`, `${ROOT}/modules/sms/channels`],
  [`${ROOT}/module/system/sms/log`, `${ROOT}/modules/sms/logs`],
  [`${ROOT}/module/system/sms/template`, `${ROOT}/modules/sms/templates`],
  [`${ROOT}/module/system/sms/send`, `${ROOT}/modules/sms/send`],

  // ── Module: Notify ──
  [`${ROOT}/module/system/notify/message`, `${ROOT}/modules/notifies/messages`],
  [`${ROOT}/module/system/notify/template`, `${ROOT}/modules/notifies/templates`],

  // ── Module: Tenant ──
  [`${ROOT}/module/system/tenant`, `${ROOT}/modules/tenants`],
  [`${ROOT}/module/system/tenant/quota`, `${ROOT}/modules/tenant-quotas`],
  [`${ROOT}/module/system/tenant/audit`, `${ROOT}/modules/tenant-audits`],
  [`${ROOT}/module/system/tenant/dashboard`, `${ROOT}/modules/tenant-dashboards`],
  [`${ROOT}/module/system/tenant-package`, `${ROOT}/modules/tenant-packages`],

  // ── Module: Config ──
  [`${ROOT}/module/system/config`, `${ROOT}/modules/configs`],
  [`${ROOT}/module/system/system-config`, `${ROOT}/modules/configs`], // merge with above

  // ── Module: File ──
  [`${ROOT}/module/system/file-manager`, `${ROOT}/modules/files`],
  [`${ROOT}/module/system/upload`, `${ROOT}/modules/files`], // merge with above
  [`${ROOT}/module/upload`, `${ROOT}/modules/files`], // merge with above

  // ── Module: Tool ──
  [`${ROOT}/module/system/tool`, `${ROOT}/modules/tools`],

  // ── Module: Docs ──
  [`${ROOT}/module/system/docs`, `${ROOT}/modules/docs`],

  // ── Module: Monitor ──
  [`${ROOT}/module/monitor/server`, `${ROOT}/modules/monitors/server`],
  [`${ROOT}/module/monitor/cache`, `${ROOT}/modules/monitors/cache`],
  [`${ROOT}/module/monitor/metrics`, `${ROOT}/modules/monitors/metrics`],
  [`${ROOT}/module/monitor/online`, `${ROOT}/modules/monitors/online`],
  [`${ROOT}/module/monitor/job`, `${ROOT}/modules/monitors/jobs`],
  [`${ROOT}/module/monitor/loginlog`, `${ROOT}/modules/login-logs`],
  [`${ROOT}/module/monitor/operlog`, `${ROOT}/modules/oper-logs`],
  [`${ROOT}/module/monitor/health`, `${ROOT}/modules/health`],

  // ── Module: Backup ──
  [`${ROOT}/module/backup`, `${ROOT}/modules/backup`],

  // ── Module: Main (Auth) ──
  [`${ROOT}/module/main`, `${ROOT}/modules/auth`],
];

// ──────────────────────────────────────────────
// 2. CORE REORGANIZATION (guards, decorators, etc.)
// ──────────────────────────────────────────────

// Core internal reorganization: move files within core/
const CORE_REORG_RULES: Array<[from: string, to: string]> = [
  // Guards
  [`${ROOT}/core/guards/auth.guard.ts`, `${ROOT}/core/auth/guards/auth.guard.ts`],
  [`${ROOT}/core/guards/permission.guard.ts`, `${ROOT}/core/permissions/guards/permission.guard.ts`],
  [`${ROOT}/core/guards/roles.guard.ts`, `${ROOT}/core/permissions/guards/roles.guard.ts`],
  [`${ROOT}/core/guards/throttle.guard.ts`, `${ROOT}/core/http/guards/throttle.guard.ts`],
  [`${ROOT}/core/guards/multi-throttle.guard.ts`, `${ROOT}/core/http/guards/multi-throttle.guard.ts`],

  // Decorators → HTTP
  [`${ROOT}/core/decorators/api-tenant.decorator.ts`, `${ROOT}/core/http/decorators/api-tenant.decorator.ts`],
  [`${ROOT}/core/decorators/api-user.decorator.ts`, `${ROOT}/core/http/decorators/api-user.decorator.ts`],
  [`${ROOT}/core/decorators/api-catch.decorator.ts`, `${ROOT}/core/http/decorators/api-catch.decorator.ts`],
  [`${ROOT}/core/decorators/api-result-response.decorator.ts`, `${ROOT}/core/http/decorators/api-result-response.decorator.ts`],
  [`${ROOT}/core/decorators/api-batch.decorator.ts`, `${ROOT}/core/http/decorators/api-batch.decorator.ts`],
  [`${ROOT}/core/decorators/api-translate.decorator.ts`, `${ROOT}/core/http/decorators/api-translate.decorator.ts`],
  [`${ROOT}/core/decorators/api-notification.decorator.ts`, `${ROOT}/core/http/decorators/api-notification.decorator.ts`],
  [`${ROOT}/core/decorators/api-query-params.decorator.ts`, `${ROOT}/core/http/decorators/api-query-params.decorator.ts`],

  // Decorators → Audit
  [`${ROOT}/core/decorators/audit.decorator.ts`, `${ROOT}/core/audit/decorators/audit.decorator.ts`],
  [`${ROOT}/core/decorators/operlog.decorator.ts`, `${ROOT}/core/audit/decorators/operlog.decorator.ts`],

  // Decorators → Permissions
  [`${ROOT}/core/decorators/data-permission.decorator.ts`, `${ROOT}/core/permissions/decorators/data-permission.decorator.ts`],
  [`${ROOT}/core/decorators/permission.decorator.ts`, `${ROOT}/core/permissions/decorators/permission.decorator.ts`],
  [`${ROOT}/core/decorators/role.decorator.ts`, `${ROOT}/core/permissions/decorators/role.decorator.ts`],

  // Decorators → HTTP
  [`${ROOT}/core/decorators/idempotent.decorator.ts`, `${ROOT}/core/http/decorators/idempotent.decorator.ts`],
  [`${ROOT}/core/decorators/lock.decorator.ts`, `${ROOT}/core/http/decorators/lock.decorator.ts`],
  [`${ROOT}/core/decorators/retry.decorator.ts`, `${ROOT}/core/http/decorators/retry.decorator.ts`],
  [`${ROOT}/core/decorators/circuit-breaker.decorator.ts`, `${ROOT}/core/http/decorators/circuit-breaker.decorator.ts`],
  [`${ROOT}/core/decorators/system-cache.decorator.ts`, `${ROOT}/core/http/decorators/system-cache.decorator.ts`],
  [`${ROOT}/core/decorators/task.decorator.ts`, `${ROOT}/core/http/decorators/task.decorator.ts`],
  [`${ROOT}/core/decorators/transactional.decorator.ts`, `${ROOT}/core/http/decorators/transactional.decorator.ts`],

  // Decorators → Auth
  [`${ROOT}/core/decorators/public.decorator.ts`, `${ROOT}/core/auth/decorators/public.decorator.ts`],
  [`${ROOT}/core/decorators/captcha.decorator.ts`, `${ROOT}/core/auth/decorators/captcha.decorator.ts`],
  [`${ROOT}/core/decorators/common.decorator.ts`, `${ROOT}/core/auth/decorators/common.decorator.ts`],
  [`${ROOT}/core/decorators/redis.decorator.ts`, `${ROOT}/core/auth/decorators/redis.decorator.ts`],

  // Decorators → Tenancy
  [`${ROOT}/core/decorators/tenant-job.decorator.ts`, `${ROOT}/core/tenancy/decorators/tenant-job.decorator.ts`],

  // HTTP
  [`${ROOT}/core/filters`, `${ROOT}/core/http/filters`],
  [`${ROOT}/core/interceptors`, `${ROOT}/core/http/interceptors`],
  [`${ROOT}/core/middleware`, `${ROOT}/core/http/middleware`],
  [`${ROOT}/core/transaction`, `${ROOT}/core/http/transaction`],

  // Constants → shared
  [`${ROOT}/core/constants`, `${ROOT}/shared/constants`],

  // config root → platform/config
  [`${ROOT}/config`, `${ROOT}/platform/config`],
];

// ──────────────────────────────────────────────
// 3. HELPER: Copy directory recursively
// ──────────────────────────────────────────────
function copyDir(src: string, dest: string) {
  if (!existsSync(src)) return;
  mkdirSync(dest, { recursive: true });
  for (const entry of readdirSync(src)) {
    const srcPath = join(src, entry);
    const destPath = join(dest, entry);
    if (statSync(srcPath).isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      cpSync(srcPath, destPath);
    }
  }
}

// ──────────────────────────────────────────────
// 4. HELPER: Move file or directory
// ──────────────────────────────────────────────
function moveItem(src: string, dest: string) {
  if (!existsSync(src)) {
    console.warn(`  ⚠ ${src} does not exist, skipping`);
    return;
  }
  mkdirSync(join(dest, '..'), { recursive: true });

  const stat = statSync(src);
  if (stat.isDirectory()) {
    copyDir(src, dest);
    rmSync(src, { recursive: true });
  } else {
    cpSync(src, dest);
    rmSync(src);
  }
  console.log(`  ✓ ${src}\n    → ${dest}`);
}

// ──────────────────────────────────────────────
// 5. Execute Phase 1 moves
// ──────────────────────────────────────────────
console.log('\n=== Phase 1: Moving & Merging Directories ===\n');

console.log('\n[1/4] Infrastructure → Platform...');
for (const [from, to] of MOVE_RULES.slice(0, 10)) {
  moveItem(from, to);
}

console.log('\n[2/4] Observability → Core...');
for (const [from, to] of MOVE_RULES.slice(10, 13)) {
  moveItem(from, to);
}

console.log('\n[3/4] Resilience → Platform...');
for (const [from, to] of MOVE_RULES.slice(13, 14)) {
  moveItem(from, to);
}

console.log('\n[4/4] Security/Tenant → Core...');
for (const [from, to] of MOVE_RULES.slice(14, 17)) {
  moveItem(from, to);
}

// ──────────────────────────────────────────────
// 6. Execute Core internal reorganization
// ──────────────────────────────────────────────
console.log('\n=== Core Internal Reorganization ===\n');

for (const [from, to] of CORE_REORG_RULES) {
  moveItem(from, to);
}

// ──────────────────────────────────────────────
// 7. Module → Modules
// ──────────────────────────────────────────────
console.log('\n=== Module → Modules ===\n');

const moduleRules = MOVE_RULES.slice(17); // All module/* rules
console.log(`\n[Module → Modules] Moving ${moduleRules.length} entries...`);
for (const [from, to] of moduleRules) {
  moveItem(from, to);
}

// ──────────────────────────────────────────────
// 8. Create stub directories that must exist
// ──────────────────────────────────────────────
console.log('\n=== Creating stub directories ===\n');
const stubs = [
  `${ROOT}/core/auth/guards`,
  `${ROOT}/core/auth/mfa`,
  `${ROOT}/core/auth/decorators`,
  `${ROOT}/core/permissions/guards`,
  `${ROOT}/core/permissions/decorators`,
  `${ROOT}/core/http/guards`,
  `${ROOT}/core/http/filters`,
  `${ROOT}/core/http/interceptors`,
  `${ROOT}/core/http/middleware`,
  `${ROOT}/core/http/decorators`,
  `${ROOT}/core/http/transaction`,
  `${ROOT}/core/audit/decorators`,
  `${ROOT}/core/tenancy/decorators`,
  `${ROOT}/core/observability/metrics`,
  `${ROOT}/core/observability/tracing`,
  `${ROOT}/platform/logger`,
  `${ROOT}/platform/queue`,
  `${ROOT}/platform/dataloader`,
  `${ROOT}/platform/resilience`,
  `${ROOT}/platform/storage`,
  `${ROOT}/platform/config`,
  `${ROOT}/modules/auth`,
  `${ROOT}/modules/users`,
  `${ROOT}/modules/roles`,
  `${ROOT}/modules/menus`,
  `${ROOT}/modules/depts`,
  `${ROOT}/modules/posts`,
  `${ROOT}/modules/dicts`,
  `${ROOT}/modules/clients`,
  `${ROOT}/modules/notices`,
  `${ROOT}/modules/files`,
  `${ROOT}/modules/tenants`,
  `${ROOT}/modules/tenant-quotas`,
  `${ROOT}/modules/tenant-audits`,
  `${ROOT}/modules/tenant-dashboards`,
  `${ROOT}/modules/tenant-packages`,
  `${ROOT}/modules/configs`,
  `${ROOT}/modules/mails/accounts`,
  `${ROOT}/modules/mails/logs`,
  `${ROOT}/modules/mails/templates`,
  `${ROOT}/modules/mails/send`,
  `${ROOT}/modules/sms/channels`,
  `${ROOT}/modules/sms/logs`,
  `${ROOT}/modules/sms/templates`,
  `${ROOT}/modules/sms/send`,
  `${ROOT}/modules/notifies/messages`,
  `${ROOT}/modules/notifies/templates`,
  `${ROOT}/modules/tools`,
  `${ROOT}/modules/docs`,
  `${ROOT}/modules/monitors/server`,
  `${ROOT}/modules/monitors/cache`,
  `${ROOT}/modules/monitors/metrics`,
  `${ROOT}/modules/monitors/online`,
  `${ROOT}/modules/monitors/jobs`,
  `${ROOT}/modules/login-logs`,
  `${ROOT}/modules/oper-logs`,
  `${ROOT}/modules/health`,
  `${ROOT}/modules/backup`,
  `${ROOT}/modules/axios`,
  `${ROOT}/shared/constants`,
];

for (const stub of stubs) {
  if (!existsSync(stub)) {
    mkdirSync(stub, { recursive: true });
    console.log(`  ✓ Created: ${stub}`);
  }
}

console.log('\n✅ Phase 1 move complete. Run rewrite-imports.ts next.\n');
