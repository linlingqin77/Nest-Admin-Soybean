-- =============================================================================
-- Migration: add_performance_indexes
-- Purpose:  Add missing indexes identified during Stage 4 (database) refactoring.
--           These cover common query paths that currently force sequential scans
--           (e.g. join lookups, soft-delete filters, status filtering).
--           All changes are reversible via DROP INDEX.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Soft-delete composite indexes
--    Pattern: almost every "list" query filters by `del_flag = '0'` together
--    with `tenant_id` and/or `status`. A composite index on the prefix avoids
--    the bitmap-AND of two separate indexes.
-- -----------------------------------------------------------------------------

-- CreateIndex
CREATE INDEX IF NOT EXISTS "sys_client_del_flag_status_idx"
    ON "sys_client"("del_flag", "status");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "sys_job_tenant_id_del_flag_idx"
    ON "sys_job"("tenant_id", "del_flag", "status");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "sys_user_role_user_id_idx"
    ON "sys_user_role"("user_id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "sys_user_post_user_id_idx"
    ON "sys_user_post"("user_id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "sys_role_menu_menu_id_idx"
    ON "sys_role_menu"("menu_id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "sys_role_dept_dept_id_idx"
    ON "sys_role_dept"("dept_id");

-- -----------------------------------------------------------------------------
-- 2. Tenant-scoped join / lookup indexes
--    Foreign-key columns without an index slow down cascading deletes and JOINs.
-- -----------------------------------------------------------------------------

-- CreateIndex
CREATE INDEX IF NOT EXISTS "sys_post_dept_id_idx"
    ON "sys_post"("dept_id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "sys_user_dept_id_idx"
    ON "sys_user"("dept_id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "gen_table_column_table_id_idx"
    ON "gen_table_column"("table_id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "gen_history_template_group_id_idx"
    ON "gen_history"("template_group_id");

-- -----------------------------------------------------------------------------
-- 3. Single-column indexes that frequently appear in WHERE clauses
-- -----------------------------------------------------------------------------

-- CreateIndex
CREATE INDEX IF NOT EXISTS "sys_user_create_by_idx"
    ON "sys_user"("create_by");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "sys_role_create_by_idx"
    ON "sys_role"("create_by");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "sys_menu_create_by_idx"
    ON "sys_menu"("create_by");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "sys_dept_create_by_idx"
    ON "sys_dept"("create_by");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "sys_post_create_by_idx"
    ON "sys_post"("create_by");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "sys_tenant_update_time_idx"
    ON "sys_tenant"("update_time");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "sys_config_update_time_idx"
    ON "sys_config"("update_time");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "sys_user_update_time_idx"
    ON "sys_user"("update_time");

-- -----------------------------------------------------------------------------
-- 4. SMS / Mail log lookups (mobile / mail + time range)
-- -----------------------------------------------------------------------------

-- CreateIndex
CREATE INDEX IF NOT EXISTS "sys_sms_log_channel_id_idx"
    ON "sys_sms_log"("channel_id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "sys_sms_log_template_id_idx"
    ON "sys_sms_log"("template_id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "sys_sms_log_mobile_send_time_idx"
    ON "sys_sms_log"("mobile", "send_time");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "sys_mail_log_account_id_idx"
    ON "sys_mail_log"("account_id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "sys_mail_log_template_id_idx"
    ON "sys_mail_log"("template_id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "sys_mail_log_user_id_send_time_idx"
    ON "sys_mail_log"("user_id", "send_time");

-- -----------------------------------------------------------------------------
-- 5. Notify message tenant lookup
-- -----------------------------------------------------------------------------

-- CreateIndex
CREATE INDEX IF NOT EXISTS "sys_notify_message_template_id_idx"
    ON "sys_notify_message"("template_id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "sys_notify_message_tenant_id_create_time_idx"
    ON "sys_notify_message"("tenant_id", "create_time");

-- -----------------------------------------------------------------------------
-- 6. Tenant audit / tenant quota indexes
-- -----------------------------------------------------------------------------

-- CreateIndex
CREATE INDEX IF NOT EXISTS "sys_tenant_audit_log_operator_id_operate_time_idx"
    ON "sys_tenant_audit_log"("operator_id", "operate_time");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "sys_tenant_audit_log_module_idx"
    ON "sys_tenant_audit_log"("module");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "sys_tenant_quota_log_tenant_id_change_time_idx"
    ON "sys_tenant_quota_log"("tenant_id", "change_time");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "sys_tenant_billing_paid_time_idx"
    ON "sys_tenant_billing"("paid_time");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "sys_tenant_billing_tenant_id_status_due_date_idx"
    ON "sys_tenant_billing"("tenant_id", "status", "due_date");

-- -----------------------------------------------------------------------------
-- 7. OSS / file management indexes
-- -----------------------------------------------------------------------------

-- CreateIndex
CREATE INDEX IF NOT EXISTS "sys_oss_create_time_idx"
    ON "sys_oss"("create_time");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "sys_oss_tenant_id_create_time_idx"
    ON "sys_oss"("tenant_id", "create_time");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "sys_oss_config_status_idx"
    ON "sys_oss_config"("status");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "sys_upload_create_time_idx"
    ON "sys_upload"("create_time");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "sys_upload_tenant_id_create_time_idx"
    ON "sys_upload"("tenant_id", "create_time");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "sys_upload_storage_type_idx"
    ON "sys_upload"("storage_type");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "sys_file_share_create_time_idx"
    ON "sys_file_share"("create_time");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "sys_file_share_tenant_id_idx"
    ON "sys_file_share"("tenant_id");

-- -----------------------------------------------------------------------------
-- 8. Tenant usage / feature lookups
-- -----------------------------------------------------------------------------

-- CreateIndex
CREATE INDEX IF NOT EXISTS "sys_tenant_feature_update_time_idx"
    ON "sys_tenant_feature"("update_time");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "sys_tenant_usage_create_time_idx"
    ON "sys_tenant_usage"("create_time");

-- -----------------------------------------------------------------------------
-- DOWN: drop all indexes added above (reversible)
-- -----------------------------------------------------------------------------

-- DROP INDEX statements intentionally listed in reverse order for clarity.
-- (PostgreSQL does not require any particular drop order for non-overlapping
--  indexes, so the order here is purely cosmetic.)

-- DropIndex
DROP INDEX IF EXISTS "sys_tenant_usage_create_time_idx";

-- DropIndex
DROP INDEX IF EXISTS "sys_tenant_feature_update_time_idx";

-- DropIndex
DROP INDEX IF EXISTS "sys_file_share_tenant_id_idx";

-- DropIndex
DROP INDEX IF EXISTS "sys_file_share_create_time_idx";

-- DropIndex
DROP INDEX IF EXISTS "sys_upload_storage_type_idx";

-- DropIndex
DROP INDEX IF EXISTS "sys_upload_tenant_id_create_time_idx";

-- DropIndex
DROP INDEX IF EXISTS "sys_upload_create_time_idx";

-- DropIndex
DROP INDEX IF EXISTS "sys_oss_config_status_idx";

-- DropIndex
DROP INDEX IF EXISTS "sys_oss_tenant_id_create_time_idx";

-- DropIndex
DROP INDEX IF EXISTS "sys_oss_create_time_idx";

-- DropIndex
DROP INDEX IF EXISTS "sys_tenant_billing_tenant_id_status_due_date_idx";

-- DropIndex
DROP INDEX IF EXISTS "sys_tenant_billing_paid_time_idx";

-- DropIndex
DROP INDEX IF EXISTS "sys_tenant_quota_log_tenant_id_change_time_idx";

-- DropIndex
DROP INDEX IF EXISTS "sys_tenant_audit_log_module_idx";

-- DropIndex
DROP INDEX IF EXISTS "sys_tenant_audit_log_operator_id_operate_time_idx";

-- DropIndex
DROP INDEX IF EXISTS "sys_notify_message_tenant_id_create_time_idx";

-- DropIndex
DROP INDEX IF EXISTS "sys_notify_message_template_id_idx";

-- DropIndex
DROP INDEX IF EXISTS "sys_mail_log_user_id_send_time_idx";

-- DropIndex
DROP INDEX IF EXISTS "sys_mail_log_template_id_idx";

-- DropIndex
DROP INDEX IF EXISTS "sys_mail_log_account_id_idx";

-- DropIndex
DROP INDEX IF EXISTS "sys_sms_log_mobile_send_time_idx";

-- DropIndex
DROP INDEX IF EXISTS "sys_sms_log_template_id_idx";

-- DropIndex
DROP INDEX IF EXISTS "sys_sms_log_channel_id_idx";

-- DropIndex
DROP INDEX IF EXISTS "sys_user_update_time_idx";

-- DropIndex
DROP INDEX IF EXISTS "sys_config_update_time_idx";

-- DropIndex
DROP INDEX IF EXISTS "sys_tenant_update_time_idx";

-- DropIndex
DROP INDEX IF EXISTS "sys_post_create_by_idx";

-- DropIndex
DROP INDEX IF EXISTS "sys_dept_create_by_idx";

-- DropIndex
DROP INDEX IF EXISTS "sys_menu_create_by_idx";

-- DropIndex
DROP INDEX IF EXISTS "sys_role_create_by_idx";

-- DropIndex
DROP INDEX IF EXISTS "sys_user_create_by_idx";

-- DropIndex
DROP INDEX IF EXISTS "gen_history_template_group_id_idx";

-- DropIndex
DROP INDEX IF EXISTS "gen_table_column_table_id_idx";

-- DropIndex
DROP INDEX IF EXISTS "sys_user_dept_id_idx";

-- DropIndex
DROP INDEX IF EXISTS "sys_post_dept_id_idx";

-- DropIndex
DROP INDEX IF EXISTS "sys_role_menu_menu_id_idx";

-- DropIndex
DROP INDEX IF EXISTS "sys_role_dept_dept_id_idx";

-- DropIndex
DROP INDEX IF EXISTS "sys_user_post_user_id_idx";

-- DropIndex
DROP INDEX IF EXISTS "sys_user_role_user_id_idx";

-- DropIndex
DROP INDEX IF EXISTS "sys_job_tenant_id_del_flag_idx";

-- DropIndex
DROP INDEX IF EXISTS "sys_client_del_flag_status_idx";