-- Downgrade BigInt primary keys and storage fields to Integer
-- Safe to run: all target tables have 0 rows in current database

-- SysSmsLog: id BIGSERIAL → SERIAL
ALTER TABLE "sys_sms_log" DROP CONSTRAINT "sys_sms_log_pkey",
ALTER COLUMN "id" SET DATA TYPE INTEGER,
ADD CONSTRAINT "sys_sms_log_pkey" PRIMARY KEY ("id");

-- SysMailLog: id BIGSERIAL → SERIAL
ALTER TABLE "sys_mail_log" DROP CONSTRAINT "sys_mail_log_pkey",
ALTER COLUMN "id" SET DATA TYPE INTEGER,
ADD CONSTRAINT "sys_mail_log_pkey" PRIMARY KEY ("id");

-- SysNotifyMessage: id BIGSERIAL → SERIAL
ALTER TABLE "sys_notify_message" DROP CONSTRAINT "sys_notify_message_pkey",
ALTER COLUMN "id" SET DATA TYPE INTEGER,
ADD CONSTRAINT "sys_notify_message_pkey" PRIMARY KEY ("id");

-- SysTenantAuditLog: id BIGSERIAL → SERIAL
ALTER TABLE "sys_tenant_audit_log" DROP CONSTRAINT "sys_tenant_audit_log_pkey",
ALTER COLUMN "id" SET DATA TYPE INTEGER,
ADD CONSTRAINT "sys_tenant_audit_log_pkey" PRIMARY KEY ("id");

-- SysOss: ossId BIGSERIAL → SERIAL, size BIGINT → INTEGER
ALTER TABLE "sys_oss" DROP CONSTRAINT "sys_oss_pkey",
ALTER COLUMN "oss_id" SET DATA TYPE INTEGER,
ALTER COLUMN "size" SET DATA TYPE INTEGER,
ADD CONSTRAINT "sys_oss_pkey" PRIMARY KEY ("oss_id");

-- SysTenantQuota: storage_quota/storage_used BIGINT → INTEGER
ALTER TABLE "sys_tenant_quota" ALTER COLUMN "storage_quota" SET DATA TYPE INTEGER,
ALTER COLUMN "storage_used" SET DATA TYPE INTEGER;

-- SysTenantQuotaLog: old_value/new_value BIGINT → INTEGER
ALTER TABLE "sys_tenant_quota_log" ALTER COLUMN "old_value" SET DATA TYPE INTEGER,
ALTER COLUMN "new_value" SET DATA TYPE INTEGER;
