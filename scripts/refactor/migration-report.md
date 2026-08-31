# Refactoring Migration Report
**Total files modified**: 262
**Timestamp**: 2026-08-30T10:09:35.518Z

---

## File Changes
### apps/server/src/app.module.ts
- infrastructure/logging → platform/logger- infrastructure/prisma → platform/prisma- infrastructure/dataloader → platform/dataloader- observability/metrics → core/observability/metrics- observability/tracing → core/observability/tracing- observability/audit → core/audit- resilience/circuit-breaker → platform/resilience- security/login → core/auth- security/mfa → core/auth/mfa- security/crypto → core/crypto- module/main → modules/auth- module/upload → modules/files- module/resource → platform/storage- module/monitor → modules/monitors- module/common → modules- module/system → modules- module → modules (root)- ./config → ./platform/config- core/guards → core/http/guards (catch-all)- core/filters → core/http/filters- core/interceptors → core/http/interceptors
### apps/server/src/core/audit/audit.module.ts
- infrastructure/prisma → platform/prisma- module → modules (root)
### apps/server/src/core/audit/audit.service.ts
- infrastructure/prisma → platform/prisma- tenant/context → core/tenancy/context- module → modules (root)
### apps/server/src/core/audit/decorators/audit.decorator.ts
- module → modules (root)- core/interceptors → core/http/interceptors
### apps/server/src/core/audit/decorators/operlog.decorator.ts
- core/interceptors → core/http/interceptors- core/constants → shared/constants
### apps/server/src/core/audit/index.ts
- module → modules (root)
### apps/server/src/core/auth/decorators/captcha.decorator.ts
- module/common/redis → platform/redis- module/system/config → modules/configs
### apps/server/src/core/auth/decorators/public.decorator.ts
- core/constants → shared/constants
### apps/server/src/core/auth/decorators/redis.decorator.ts
- module/common/redis → platform/redis
### apps/server/src/core/auth/guards/auth.guard.ts
- security/login → core/auth- module/system/user → modules/users- src/config → src/platform/config- core/constants → shared/constants
### apps/server/src/core/auth/index.ts
- module → modules (root)- security → core (catch-all)
### apps/server/src/core/auth/login-security.module.ts
- security → core (catch-all)
### apps/server/src/core/auth/login-security.service.ts
- module/common/redis → platform/redis
### apps/server/src/core/auth/mfa/index.ts
- module → modules (root)
### apps/server/src/core/auth/mfa/mfa.service.ts
- infrastructure/prisma → platform/prisma- module/common/redis → platform/redis
### apps/server/src/core/auth/token-blacklist.service.ts
- module/common/redis → platform/redis
### apps/server/src/core/crypto/crypto.service.ts
- module/common/redis → platform/redis- src/config → src/platform/config
### apps/server/src/core/crypto/index.ts
- module → modules (root)
### apps/server/src/core/decorators/api.decorator.ts
- security → core (catch-all)
### apps/server/src/core/decorators/optimistic-lock.decorator.ts
- core/interceptors → core/http/interceptors
### apps/server/src/core/decorators/require-permission.decorator.ts
- core/constants → shared/constants
### apps/server/src/core/decorators/require-role.decorator.ts
- core/constants → shared/constants
### apps/server/src/core/decorators/throttle.decorator.ts
- multi-throttle.guard → core/http/guards
### apps/server/src/core/http/decorators/circuit-breaker.decorator.ts
- resilience/circuit-breaker → platform/resilience
### apps/server/src/core/http/decorators/idempotent.decorator.ts
- core/interceptors → core/http/interceptors
### apps/server/src/core/http/decorators/lock.decorator.ts
- core/interceptors → core/http/interceptors
### apps/server/src/core/http/decorators/system-cache.decorator.ts
- module/common/redis → platform/redis
### apps/server/src/core/http/decorators/transactional.decorator.ts
- infrastructure/prisma → platform/prisma- transactional.decorator → core/http
### apps/server/src/core/http/guards/multi-throttle.guard.ts
- module/common/redis → platform/redis
### apps/server/src/core/http/guards/throttle.guard.ts
- module → modules (root)
### apps/server/src/core/http/interceptors/audit.interceptor.ts
- observability/audit → core/audit- module → modules (root)- audit.decorator → core/audit
### apps/server/src/core/http/interceptors/data-permission.interceptor.ts
- data-permission.decorator → core/permissions
### apps/server/src/core/http/interceptors/idempotent.interceptor.ts
- module/common/redis → platform/redis- idempotent.decorator → core/http
### apps/server/src/core/http/interceptors/lock.interceptor.ts
- module/common/redis → platform/redis- lock.decorator → core/http
### apps/server/src/core/http/interceptors/operlog.interceptor.ts
- monitor/operlog → oper-logs- operlog.decorator → core/audit- core/constants → shared/constants
### apps/server/src/core/http/interceptors/optimistic-lock.interceptor.ts
- infrastructure/prisma → platform/prisma- core/decorators → core/http/decorators (catch-all)
### apps/server/src/core/http/interceptors/retry.interceptor.ts
- retry.decorator → core/http
### apps/server/src/core/observability/metrics/index.ts
- module → modules (root)
### apps/server/src/core/observability/tracing/index.ts
- module → modules (root)
### apps/server/src/core/permissions/decorators/data-permission.decorator.ts
- core/interceptors → core/http/interceptors
### apps/server/src/core/permissions/guards/permission.guard.ts
- core/constants → shared/constants
### apps/server/src/core/permissions/guards/roles.guard.ts
- core/constants → shared/constants
### apps/server/src/core/tenancy/context/cls.module.ts
- infrastructure/prisma → platform/prisma
### apps/server/src/core/tenancy/context/index.ts
- module → modules (root)
### apps/server/src/core/tenancy/decorators/tenant-job.decorator.ts
- infrastructure/prisma → platform/prisma
### apps/server/src/core/tenancy/guards/tenant.guard.ts
- src/config → src/platform/config
### apps/server/src/core/tenancy/index.ts
- module → modules (root)
### apps/server/src/core/tenancy/services/feature-toggle.service.ts
- infrastructure/prisma → platform/prisma- module/common/redis → platform/redis
### apps/server/src/core/tenancy/services/quota.service.ts
- infrastructure/prisma → platform/prisma- module/common/redis → platform/redis
### apps/server/src/core/tenancy/services/relation-validation.service.ts
- infrastructure/prisma → platform/prisma
### apps/server/src/core/tenancy/services/tenant-export.service.ts
- infrastructure/prisma → platform/prisma
### apps/server/src/core/tenancy/services/tenant-lifecycle.service.ts
- infrastructure/prisma → platform/prisma
### apps/server/src/core/tenancy/services/tenant.helper.ts
- src/config → src/platform/config
### apps/server/src/main.ts
- module → modules (root)- src/config → src/platform/config
### apps/server/src/module/common/common.module.ts
- module → modules (root)- src/config → src/platform/config
### apps/server/src/module/monitor/dto/responses/index.ts
- module → modules (root)
### apps/server/src/module/monitor/monitor.module.ts
- module → modules (root)
### apps/server/src/module/resource/resource.module.ts
- module → modules (root)- src/config → src/platform/config
### apps/server/src/module/resource/sse.controller.ts
- module/common/redis → platform/redis- core/constants → shared/constants
### apps/server/src/module/system/mail/mail.module.ts
- module → modules (root)
### apps/server/src/module/system/notify/notify.module.ts
- module → modules (root)
### apps/server/src/module/system/sms/sms.module.ts
- module → modules (root)
### apps/server/src/module/system/system.module.ts
- module → modules (root)- ./config → ./platform/config
### apps/server/src/modules/auth/auth.controller.ts
- infrastructure/prisma → platform/prisma- module/common/redis → platform/redis- security/login → core/auth- security/crypto → core/crypto- module/system/user → modules/users- module/system/config → modules/configs- src/config → src/platform/config- common.decorator → core/auth- core/decorators → core/http/decorators (catch-all)- security → core (catch-all)
### apps/server/src/modules/auth/auth.strategy.ts
- module/common/redis → platform/redis- src/config → src/platform/config
### apps/server/src/modules/auth/dto/requests/auth-login.request.dto.ts
- tenant/context → core/tenancy/context
### apps/server/src/modules/auth/dto/requests/auth-register.request.dto.ts
- tenant/context → core/tenancy/context
### apps/server/src/modules/auth/main.controller.ts
- module/common/redis → platform/redis- module/system/user → modules/users- module/system/menu → modules/menus- module/system/config → modules/configs- common.decorator → core/auth- core/decorators → core/http/decorators (catch-all)- security → core (catch-all)
### apps/server/src/modules/auth/main.service.ts
- module/common/axios → modules/axios- observability/metrics → core/observability/metrics- common.decorator → core/auth
### apps/server/src/modules/backup/backup.service.ts
- task.decorator → core/http
### apps/server/src/modules/clients/client.controller.ts
- operlog.decorator → core/audit- core/decorators → core/http/decorators (catch-all)
### apps/server/src/modules/clients/client.repository.ts
- infrastructure/prisma → platform/prisma- infrastructure/repository → platform/repository
### apps/server/src/modules/clients/client.service.ts
- infrastructure/logging → platform/logger- transactional.decorator → core/http
### apps/server/src/modules/configs/config.controller.ts
- ./config → ./platform/config- operlog.decorator → core/audit- core/decorators → core/http/decorators (catch-all)
### apps/server/src/modules/configs/config.module.ts
- infrastructure/prisma → platform/prisma- ./config → ./platform/config
### apps/server/src/modules/configs/config.repository.ts
- infrastructure/prisma → platform/prisma- infrastructure/repository → platform/repository
### apps/server/src/modules/configs/config.service.ts
- infrastructure/logging → platform/logger- module/common/redis → platform/redis- tenant/context → core/tenancy/context- ./config → ./platform/config- transactional.decorator → core/http- redis.decorator → core/auth
### apps/server/src/modules/configs/dto/responses/index.ts
- ./config → ./platform/config
### apps/server/src/modules/configs/system-config.service.ts
- infrastructure/prisma → platform/prisma- module/common/redis → platform/redis- system-cache.decorator → core/http
### apps/server/src/modules/depts/dept.controller.ts
- operlog.decorator → core/audit- core/decorators → core/http/decorators (catch-all)
### apps/server/src/modules/depts/dept.repository.ts
- infrastructure/prisma → platform/prisma- infrastructure/repository → platform/repository
### apps/server/src/modules/depts/dept.service.ts
- infrastructure/logging → platform/logger- transactional.decorator → core/http- redis.decorator → core/auth
### apps/server/src/modules/dicts/dict.controller.ts
- operlog.decorator → core/audit- core/decorators → core/http/decorators (catch-all)
### apps/server/src/modules/dicts/dict.repository.ts
- infrastructure/prisma → platform/prisma- infrastructure/repository → platform/repository
### apps/server/src/modules/dicts/dict.service.ts
- module/common/redis → platform/redis- transactional.decorator → core/http- redis.decorator → core/auth
### apps/server/src/modules/docs/docs.controller.ts
- module/system/user → modules/users
### apps/server/src/modules/docs/index.ts
- module → modules (root)
### apps/server/src/modules/files/file-folder.repository.ts
- infrastructure/prisma → platform/prisma- infrastructure/repository → platform/repository
### apps/server/src/modules/files/file-manager.controller.ts
- module/system/user → modules/users- operlog.decorator → core/audit- core/decorators → core/http/decorators (catch-all)
### apps/server/src/modules/files/file-manager.module.ts
- src/config → src/platform/config
### apps/server/src/modules/files/file-manager.service.ts
- infrastructure/logging → platform/logger- tenant/context → core/tenancy/context- module/upload → modules/files- src/config → src/platform/config- transactional.decorator → core/http
### apps/server/src/modules/files/processors/thumbnail.processor.ts
- observability/metrics → core/observability/metrics- src/config → src/platform/config
### apps/server/src/modules/files/services/file-access.service.ts
- src/config → src/platform/config
### apps/server/src/modules/files/services/version.service.ts
- src/config → src/platform/config
### apps/server/src/modules/files/upload.service.ts
- src/config → src/platform/config
### apps/server/src/modules/health/health.controller.ts
- observability/health → core/observability/health- module/system/user → modules/users
### apps/server/src/modules/health/health.module.ts
- observability/health → core/observability/health- module → modules (root)
### apps/server/src/modules/health/info.controller.ts
- module/system/user → modules/users
### apps/server/src/modules/login-logs/loginlog.controller.ts
- module/monitor → modules/monitors- operlog.decorator → core/audit- core/decorators → core/http/decorators (catch-all)
### apps/server/src/modules/login-logs/loginlog.repository.ts
- infrastructure/prisma → platform/prisma- infrastructure/repository → platform/repository
### apps/server/src/modules/login-logs/loginlog.service.ts
- infrastructure/prisma → platform/prisma
### apps/server/src/modules/mails/accounts/mail-account.controller.ts
- module/system/user → modules/users- operlog.decorator → core/audit- core/decorators → core/http/decorators (catch-all)
### apps/server/src/modules/mails/accounts/mail-account.repository.ts
- infrastructure/prisma → platform/prisma- infrastructure/repository → platform/repository
### apps/server/src/modules/mails/accounts/mail-account.service.ts
- transactional.decorator → core/http
### apps/server/src/modules/mails/logs/mail-log.controller.ts
- core/decorators → core/http/decorators (catch-all)
### apps/server/src/modules/mails/logs/mail-log.repository.ts
- infrastructure/prisma → platform/prisma
### apps/server/src/modules/mails/send/mail-send.controller.ts
- operlog.decorator → core/audit- core/decorators → core/http/decorators (catch-all)
### apps/server/src/modules/mails/send/mail-send.module.ts
- module → modules (root)
### apps/server/src/modules/mails/send/mail-send.service.ts
- resilience/circuit-breaker → platform/resilience- idempotent.decorator → core/http- circuit-breaker.decorator → core/http
### apps/server/src/modules/mails/templates/mail-template.controller.ts
- module/system/user → modules/users- operlog.decorator → core/audit- core/decorators → core/http/decorators (catch-all)
### apps/server/src/modules/mails/templates/mail-template.module.ts
- module → modules (root)
### apps/server/src/modules/mails/templates/mail-template.repository.ts
- infrastructure/prisma → platform/prisma- infrastructure/repository → platform/repository
### apps/server/src/modules/mails/templates/mail-template.service.ts
- transactional.decorator → core/http
### apps/server/src/modules/menus/menu.controller.ts
- module/system/user → modules/users- operlog.decorator → core/audit- core/decorators → core/http/decorators (catch-all)
### apps/server/src/modules/menus/menu.repository.ts
- infrastructure/prisma → platform/prisma- infrastructure/repository → platform/repository
### apps/server/src/modules/menus/menu.service.ts
- transactional.decorator → core/http- redis.decorator → core/auth
### apps/server/src/modules/menus/utils.ts
- module/system/user → modules/users
### apps/server/src/modules/monitors/cache/cache.controller.ts
- module/monitor → modules/monitors- operlog.decorator → core/audit- core/decorators → core/http/decorators (catch-all)
### apps/server/src/modules/monitors/cache/cache.service.ts
- module/common/redis → platform/redis
### apps/server/src/modules/monitors/jobs/job-log.controller.ts
- module/monitor → modules/monitors- operlog.decorator → core/audit- core/decorators → core/http/decorators (catch-all)
### apps/server/src/modules/monitors/jobs/job-log.service.ts
- infrastructure/prisma → platform/prisma
### apps/server/src/modules/monitors/jobs/job.controller.ts
- module/system/user → modules/users- module/monitor → modules/monitors- operlog.decorator → core/audit- core/decorators → core/http/decorators (catch-all)
### apps/server/src/modules/monitors/jobs/job.module.ts
- module/system/notice → modules/notices- module/backup → modules/backup- module → modules (root)
### apps/server/src/modules/monitors/jobs/job.repository.ts
- infrastructure/prisma → platform/prisma- infrastructure/repository → platform/repository
### apps/server/src/modules/monitors/jobs/job.service.ts
- infrastructure/logging → platform/logger- transactional.decorator → core/http
### apps/server/src/modules/monitors/jobs/task.service.ts
- infrastructure/prisma → platform/prisma- tenant/context → core/tenancy/context- tenant/decorators → core/tenancy/decorators- module/system/notice → modules/notices- module/upload → modules/files- task.decorator → core/http
### apps/server/src/modules/monitors/metrics/metrics.controller.ts
- module/system/user → modules/users
### apps/server/src/modules/monitors/online/online.controller.ts
- module/monitor → modules/monitors- operlog.decorator → core/audit- core/decorators → core/http/decorators (catch-all)
### apps/server/src/modules/monitors/online/online.service.ts
- module/common/redis → platform/redis
### apps/server/src/modules/monitors/server/server.controller.ts
- module/monitor → modules/monitors- core/decorators → core/http/decorators (catch-all)
### apps/server/src/modules/notices/notice.controller.ts
- operlog.decorator → core/audit- core/decorators → core/http/decorators (catch-all)
### apps/server/src/modules/notices/notice.repository.ts
- infrastructure/prisma → platform/prisma- infrastructure/repository → platform/repository
### apps/server/src/modules/notices/notice.service.ts
- transactional.decorator → core/http
### apps/server/src/modules/notifies/messages/notify-message.controller.ts
- module/system/user → modules/users- operlog.decorator → core/audit- core/decorators → core/http/decorators (catch-all)
### apps/server/src/modules/notifies/messages/notify-message.module.ts
- module → modules (root)
### apps/server/src/modules/notifies/messages/notify-message.repository.ts
- infrastructure/prisma → platform/prisma
### apps/server/src/modules/notifies/messages/notify-message.service.ts
- infrastructure/prisma → platform/prisma
### apps/server/src/modules/notifies/templates/notify-template.controller.ts
- module/system/user → modules/users- operlog.decorator → core/audit- core/decorators → core/http/decorators (catch-all)
### apps/server/src/modules/notifies/templates/notify-template.repository.ts
- infrastructure/prisma → platform/prisma- infrastructure/repository → platform/repository
### apps/server/src/modules/notifies/templates/notify-template.service.ts
- transactional.decorator → core/http
### apps/server/src/modules/oper-logs/operlog.controller.ts
- module/monitor → modules/monitors- operlog.decorator → core/audit- core/decorators → core/http/decorators (catch-all)
### apps/server/src/modules/oper-logs/operlog.repository.ts
- infrastructure/prisma → platform/prisma- infrastructure/repository → platform/repository
### apps/server/src/modules/oper-logs/operlog.service.ts
- infrastructure/prisma → platform/prisma- module/common/axios → modules/axios- module/system/dict → modules/dicts
### apps/server/src/modules/posts/post.controller.ts
- operlog.decorator → core/audit- core/decorators → core/http/decorators (catch-all)
### apps/server/src/modules/posts/post.repository.ts
- infrastructure/prisma → platform/prisma- infrastructure/repository → platform/repository
### apps/server/src/modules/posts/post.service.ts
- transactional.decorator → core/http
### apps/server/src/modules/roles/role.controller.ts
- module/system/user → modules/users- operlog.decorator → core/audit- core/decorators → core/http/decorators (catch-all)
### apps/server/src/modules/roles/role.repository.ts
- infrastructure/prisma → platform/prisma- infrastructure/repository → platform/repository
### apps/server/src/modules/roles/role.service.ts
- transactional.decorator → core/http
### apps/server/src/modules/sms/channels/sms-channel.controller.ts
- module/system/user → modules/users- operlog.decorator → core/audit- core/decorators → core/http/decorators (catch-all)
### apps/server/src/modules/sms/channels/sms-channel.repository.ts
- infrastructure/prisma → platform/prisma- infrastructure/repository → platform/repository
### apps/server/src/modules/sms/channels/sms-channel.service.ts
- transactional.decorator → core/http
### apps/server/src/modules/sms/logs/sms-log.controller.ts
- core/decorators → core/http/decorators (catch-all)
### apps/server/src/modules/sms/logs/sms-log.repository.ts
- infrastructure/prisma → platform/prisma
### apps/server/src/modules/sms/send/sms-send.controller.ts
- operlog.decorator → core/audit- core/decorators → core/http/decorators (catch-all)
### apps/server/src/modules/sms/send/sms-send.module.ts
- module → modules (root)
### apps/server/src/modules/sms/send/sms-send.service.ts
- resilience/circuit-breaker → platform/resilience- idempotent.decorator → core/http- circuit-breaker.decorator → core/http
### apps/server/src/modules/sms/templates/sms-template.controller.ts
- module/system/user → modules/users- operlog.decorator → core/audit- core/decorators → core/http/decorators (catch-all)
### apps/server/src/modules/sms/templates/sms-template.module.ts
- module → modules (root)
### apps/server/src/modules/sms/templates/sms-template.repository.ts
- infrastructure/prisma → platform/prisma- infrastructure/repository → platform/repository
### apps/server/src/modules/sms/templates/sms-template.service.ts
- transactional.decorator → core/http
### apps/server/src/modules/tenant-packages/tenant-package.controller.ts
- operlog.decorator → core/audit- core/decorators → core/http/decorators (catch-all)
### apps/server/src/modules/tenant-packages/tenant-package.repository.ts
- infrastructure/prisma → platform/prisma- infrastructure/repository → platform/repository
### apps/server/src/modules/tenant-packages/tenant-package.service.ts
- infrastructure/logging → platform/logger- tenant/decorators → core/tenancy/decorators- transactional.decorator → core/http
### apps/server/src/modules/tenants/audit/dto/requests/tenant-audit.request.dto.ts
- module → modules (root)
### apps/server/src/modules/tenants/audit/dto/responses/tenant-audit.response.dto.ts
- module → modules (root)
### apps/server/src/modules/tenants/audit/tenant-audit.controller.ts
- module → modules (root)- core/decorators → core/http/decorators (catch-all)
### apps/server/src/modules/tenants/audit/tenant-audit.service.ts
- infrastructure/prisma → platform/prisma- tenant/decorators → core/tenancy/decorators- module → modules (root)
### apps/server/src/modules/tenants/dashboard/tenant-dashboard.controller.ts
- core/decorators → core/http/decorators (catch-all)
### apps/server/src/modules/tenants/dashboard/tenant-dashboard.service.ts
- infrastructure/prisma → platform/prisma- module/common/redis → platform/redis- tenant/context → core/tenancy/context- tenant/decorators → core/tenancy/decorators
### apps/server/src/modules/tenants/quota/tenant-quota.controller.ts
- module/system/user → modules/users- core/decorators → core/http/decorators (catch-all)
### apps/server/src/modules/tenants/quota/tenant-quota.service.ts
- infrastructure/prisma → platform/prisma- tenant/context → core/tenancy/context- tenant/decorators → core/tenancy/decorators
### apps/server/src/modules/tenants/tenant.controller.ts
- module/system/user → modules/users- operlog.decorator → core/audit- core/decorators → core/http/decorators (catch-all)
### apps/server/src/modules/tenants/tenant.repository.ts
- infrastructure/prisma → platform/prisma- tenant/context → core/tenancy/context
### apps/server/src/modules/tenants/tenant.service.ts
- infrastructure/logging → platform/logger- module/common/redis → platform/redis- tenant/context → core/tenancy/context- tenant/decorators → core/tenancy/decorators- module/system/user → modules/users- transactional.decorator → core/http- idempotent.decorator → core/http- lock.decorator → core/http
### apps/server/src/modules/tools/datasource/datasource.controller.ts
- module/system/user → modules/users- multi-throttle.guard → core/http/guards- operlog.decorator → core/audit- core/decorators → core/http/decorators (catch-all)
### apps/server/src/modules/tools/datasource/datasource.service.ts
- infrastructure/prisma → platform/prisma- tenant/context → core/tenancy/context
### apps/server/src/modules/tools/dto/gen-table.dto.ts
- module/system → modules
### apps/server/src/modules/tools/gen-table.service.ts
- infrastructure/prisma → platform/prisma- module/system/user → modules/users- ./config → ./platform/config
### apps/server/src/modules/tools/history/history.controller.ts
- operlog.decorator → core/audit- core/decorators → core/http/decorators (catch-all)
### apps/server/src/modules/tools/history/history.service.ts
- infrastructure/prisma → platform/prisma- tenant/context → core/tenancy/context- module/system/user → modules/users
### apps/server/src/modules/tools/preview/preview.service.ts
- module → modules (root)
### apps/server/src/modules/tools/template/dto/template.dto.ts
- module → modules (root)
### apps/server/src/modules/tools/template/index.ts
- module → modules (root)
### apps/server/src/modules/tools/template/nestjs/controller.ts
- core/decorators → core/http/decorators (catch-all)
### apps/server/src/modules/tools/template/nestjs/service.ts
- infrastructure/prisma → platform/prisma- tenant/context → core/tenancy/context
### apps/server/src/modules/tools/template/sql/menu.sql.ts
- module → modules (root)
### apps/server/src/modules/tools/template/sql/permission.sql.ts
- module → modules (root)
### apps/server/src/modules/tools/template/template.controller.ts
- module/system/user → modules/users- operlog.decorator → core/audit- core/decorators → core/http/decorators (catch-all)
### apps/server/src/modules/tools/template/template.service.ts
- infrastructure/prisma → platform/prisma- tenant/context → core/tenancy/context
### apps/server/src/modules/tools/template/utils/code-formatter.ts
- module → modules (root)
### apps/server/src/modules/tools/template/utils/naming-converter.ts
- module → modules (root)
### apps/server/src/modules/tools/template/vue/api.js.ts
- module → modules (root)
### apps/server/src/modules/tools/template/vue/dialogVue.vue.ts
- module → modules (root)
### apps/server/src/modules/tools/template/vue/indexVue.vue.ts
- module → modules (root)
### apps/server/src/modules/tools/template/vue/searchVue.vue.ts
- module → modules (root)
### apps/server/src/modules/tools/tool.controller.ts
- module/system/user → modules/users- multi-throttle.guard → core/http/guards- operlog.decorator → core/audit- core/decorators → core/http/decorators (catch-all)
### apps/server/src/modules/tools/tool.repository.ts
- infrastructure/prisma → platform/prisma- infrastructure/repository → platform/repository
### apps/server/src/modules/tools/tool.service.ts
- module/system/user → modules/users- ./config → ./platform/config- transactional.decorator → core/http
### apps/server/src/modules/users/services/user-auth.service.ts
- infrastructure/logging → platform/logger- infrastructure/prisma → platform/prisma- module/common/redis → platform/redis- security/login → core/auth- module/system/role → modules/roles- module/main → modules/auth- captcha.decorator → core/auth- common.decorator → core/auth- redis.decorator → core/auth- security → core (catch-all)
### apps/server/src/modules/users/services/user-batch.service.ts
- transactional.decorator → core/http- idempotent.decorator → core/http
### apps/server/src/modules/users/services/user-crud.service.ts
- module/system/role → modules/roles- module/system/dept → modules/depts- transactional.decorator → core/http- idempotent.decorator → core/http- lock.decorator → core/http- redis.decorator → core/auth
### apps/server/src/modules/users/services/user-profile.service.ts
- infrastructure/prisma → platform/prisma- module/common/redis → platform/redis- security/login → core/auth- lock.decorator → core/http
### apps/server/src/modules/users/services/user-query.service.ts
- infrastructure/prisma → platform/prisma- module/system/dept → modules/depts
### apps/server/src/modules/users/services/user-role.service.ts
- module/system/role → modules/roles- transactional.decorator → core/http
### apps/server/src/modules/users/user.controller.ts
- module/system/user → modules/users- module/upload → modules/files- operlog.decorator → core/audit- core/decorators → core/http/decorators (catch-all)
### apps/server/src/modules/users/user.decorator.ts
- module/system/user → modules/users- core/constants → shared/constants
### apps/server/src/modules/users/user.module.ts
- src/config → src/platform/config
### apps/server/src/modules/users/user.repository.ts
- infrastructure/prisma → platform/prisma- infrastructure/repository → platform/repository
### apps/server/src/modules/users/user.service.ts
- module/main → modules/auth- transactional.decorator → core/http- captcha.decorator → core/auth- common.decorator → core/auth
### apps/server/src/observability/health/index.ts
- module → modules (root)
### apps/server/src/observability/health/prisma.health.ts
- infrastructure/prisma → platform/prisma
### apps/server/src/observability/health/redis.health.ts
- module/common/redis → platform/redis
### apps/server/src/platform/config/index.ts
- ./config → ./platform/config
### apps/server/src/platform/dataloader/dataloader.module.ts
- infrastructure/prisma → platform/prisma
### apps/server/src/platform/dataloader/dept.loader.ts
- infrastructure/prisma → platform/prisma
### apps/server/src/platform/dataloader/dict.loader.ts
- infrastructure/prisma → platform/prisma
### apps/server/src/platform/dataloader/index.ts
- module → modules (root)
### apps/server/src/platform/dataloader/menu.loader.ts
- infrastructure/prisma → platform/prisma
### apps/server/src/platform/dataloader/post.loader.ts
- infrastructure/prisma → platform/prisma
### apps/server/src/platform/dataloader/role.loader.ts
- infrastructure/prisma → platform/prisma
### apps/server/src/platform/dataloader/user.loader.ts
- infrastructure/prisma → platform/prisma
### apps/server/src/platform/logger/index.ts
- module → modules (root)
### apps/server/src/platform/logger/logger.module.ts
- src/config → src/platform/config
### apps/server/src/platform/logger/pino-logger.config.ts
- tenant/context → core/tenancy/context
### apps/server/src/platform/logger/structured-logger.service.ts
- module → modules (root)
### apps/server/src/platform/prisma/index.ts
- module → modules (root)
### apps/server/src/platform/prisma/prisma.service.ts
- tenant/extensions → core/tenancy/extensions- src/config → src/platform/config
### apps/server/src/platform/queue/bull.module.ts
- src/config → src/platform/config
### apps/server/src/platform/queue/index.ts
- module → modules (root)
### apps/server/src/platform/redis/cache-manager.service.ts
- infrastructure/prisma → platform/prisma- module/common/redis → platform/redis
### apps/server/src/platform/redis/cache-warmup.service.ts
- infrastructure/prisma → platform/prisma
### apps/server/src/platform/redis/index.ts
- module → modules (root)
### apps/server/src/platform/redis/multi-level-cache.service.ts
- module/common/redis → platform/redis
### apps/server/src/platform/redis/redis.module.ts
- module → modules (root)
### apps/server/src/platform/repository/base.repository.ts
- infrastructure/prisma → platform/prisma
### apps/server/src/platform/repository/soft-delete.repository.ts
- infrastructure/prisma → platform/prisma
### apps/server/src/platform/resilience/circuit-breaker/index.ts
- module → modules (root)- circuit-breaker.decorator → core/http
### apps/server/src/platform/storage/oss-config.controller.ts
- module/system/user → modules/users- operlog.decorator → core/audit- core/decorators → core/http/decorators (catch-all)
### apps/server/src/platform/storage/oss-config.repository.ts
- infrastructure/prisma → platform/prisma- infrastructure/repository → platform/repository
### apps/server/src/platform/storage/oss-config.service.ts
- infrastructure/logging → platform/logger- transactional.decorator → core/http
### apps/server/src/platform/storage/oss.controller.ts
- module/system/user → modules/users- operlog.decorator → core/audit- core/decorators → core/http/decorators (catch-all)
### apps/server/src/platform/storage/oss.module.ts
- module/upload → modules/files- module → modules (root)
### apps/server/src/platform/storage/oss.repository.ts
- infrastructure/prisma → platform/prisma- infrastructure/repository → platform/repository
### apps/server/src/platform/storage/oss.service.ts
- infrastructure/logging → platform/logger- module/upload → modules/files- transactional.decorator → core/http
### apps/server/src/shared/enums/index.ts
- ./config → ./platform/config
### apps/server/src/shared/services/user-role-bridge.service.ts
- infrastructure/prisma → platform/prisma
### apps/server/src/test-utils/config-mock.ts
- src/config → src/platform/config
### apps/server/src/test-utils/index.ts
- module → modules (root)- ./config → ./platform/config
### apps/server/src/test-utils/prisma-mock.ts
- infrastructure/prisma → platform/prisma
### apps/server/src/test-utils/redis-mock.ts
- module/common/redis → platform/redis
### apps/server/src/test-utils/test-module.ts
- infrastructure/prisma → platform/prisma- module/common/redis → platform/redis- module → modules (root)- src/config → src/platform/config- ./config → ./platform/config
### apps/server/test/mocks/tenant.mock.ts
- ./config → ./platform/config
### apps/server/test/module/upload/processors/thumbnail.processor.spec.ts
- observability/metrics → core/observability/metrics
### apps/server/test/unit/core/decorators/circuit-breaker.decorator.spec.ts
- resilience/circuit-breaker → platform/resilience
### apps/server/test/unit/module/monitor/health/health.controller.spec.ts
- observability/health → core/observability/health
### apps/server/test/unit/observability/health/prisma.health.spec.ts
- observability/health → core/observability/health
### apps/server/test/unit/observability/health/redis.health.spec.ts
- observability/health → core/observability/health
### apps/server/test/unit/observability/metrics/metrics.interceptor.spec.ts
- observability/metrics → core/observability/metrics
### apps/server/test/unit/observability/metrics/metrics.service.spec.ts
- observability/metrics → core/observability/metrics
### apps/server/test/unit/resilience/circuit-breaker/circuit-breaker.service.pbt.spec.ts
- resilience/circuit-breaker → platform/resilience
### apps/server/test/unit/resilience/circuit-breaker/circuit-breaker.service.spec.ts
- resilience/circuit-breaker → platform/resilience
