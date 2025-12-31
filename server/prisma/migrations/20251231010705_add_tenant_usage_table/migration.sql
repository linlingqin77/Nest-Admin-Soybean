-- AlterTable
ALTER TABLE "gen_table" ALTER COLUMN "create_time" SET DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN "update_time" SET DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "gen_table_column" ALTER COLUMN "create_time" SET DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN "update_time" SET DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "sys_client" ALTER COLUMN "create_time" SET DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN "update_time" SET DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "sys_config" ALTER COLUMN "create_time" SET DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN "update_time" SET DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "sys_dept" ALTER COLUMN "create_time" SET DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN "update_time" SET DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "sys_dict_data" ALTER COLUMN "create_time" SET DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN "update_time" SET DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "sys_dict_type" ALTER COLUMN "create_time" SET DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN "update_time" SET DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "sys_file_folder" ALTER COLUMN "create_time" SET DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN "update_time" SET DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "sys_file_share" ALTER COLUMN "create_time" SET DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "sys_job" ALTER COLUMN "create_time" SET DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN "update_time" SET DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "sys_job_log" ALTER COLUMN "create_time" SET DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "sys_logininfor" ALTER COLUMN "login_time" SET DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "sys_menu" ALTER COLUMN "create_time" SET DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN "update_time" SET DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "sys_notice" ALTER COLUMN "create_time" SET DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN "update_time" SET DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "sys_oper_log" ALTER COLUMN "oper_time" SET DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "sys_post" ALTER COLUMN "create_time" SET DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN "update_time" SET DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "sys_role" ALTER COLUMN "create_time" SET DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN "update_time" SET DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "sys_tenant" ALTER COLUMN "create_time" SET DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN "update_time" SET DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "sys_tenant_package" ALTER COLUMN "create_time" SET DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN "update_time" SET DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "sys_upload" ALTER COLUMN "create_time" SET DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN "update_time" SET DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "sys_user" ALTER COLUMN "create_time" SET DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN "update_time" SET DEFAULT CURRENT_TIMESTAMP;

-- CreateTable
CREATE TABLE "sys_system_config" (
    "config_id" SERIAL NOT NULL,
    "config_name" VARCHAR(100) NOT NULL,
    "config_key" VARCHAR(100) NOT NULL,
    "config_value" VARCHAR(500) NOT NULL,
    "config_type" CHAR(1) NOT NULL,
    "create_by" VARCHAR(64) NOT NULL DEFAULT '',
    "create_time" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "update_by" VARCHAR(64) NOT NULL DEFAULT '',
    "update_time" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "remark" VARCHAR(500),
    "status" CHAR(1) NOT NULL DEFAULT '0',
    "del_flag" CHAR(1) NOT NULL DEFAULT '0',

    CONSTRAINT "sys_system_config_pkey" PRIMARY KEY ("config_id")
);

-- CreateTable
CREATE TABLE "sys_audit_log" (
    "id" SERIAL NOT NULL,
    "tenant_id" VARCHAR(20) NOT NULL,
    "user_id" INTEGER,
    "user_name" VARCHAR(50),
    "action" VARCHAR(100) NOT NULL,
    "module" VARCHAR(50) NOT NULL,
    "target_type" VARCHAR(50),
    "target_id" VARCHAR(100),
    "old_value" TEXT,
    "new_value" TEXT,
    "ip" VARCHAR(128) NOT NULL,
    "user_agent" VARCHAR(500),
    "request_id" VARCHAR(64),
    "status" CHAR(1) NOT NULL,
    "error_msg" VARCHAR(2000),
    "duration" INTEGER NOT NULL DEFAULT 0,
    "create_time" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sys_audit_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sys_tenant_feature" (
    "id" SERIAL NOT NULL,
    "tenant_id" VARCHAR(20) NOT NULL,
    "feature_key" VARCHAR(100) NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "config" TEXT,
    "create_by" VARCHAR(64) NOT NULL DEFAULT '',
    "create_time" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "update_by" VARCHAR(64) NOT NULL DEFAULT '',
    "update_time" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sys_tenant_feature_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sys_tenant_usage" (
    "id" SERIAL NOT NULL,
    "tenant_id" VARCHAR(20) NOT NULL,
    "date" DATE NOT NULL,
    "api_calls" INTEGER NOT NULL DEFAULT 0,
    "storage_used" INTEGER NOT NULL DEFAULT 0,
    "user_count" INTEGER NOT NULL DEFAULT 0,
    "create_time" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sys_tenant_usage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "sys_system_config_config_key_key" ON "sys_system_config"("config_key");

-- CreateIndex
CREATE INDEX "sys_system_config_status_idx" ON "sys_system_config"("status");

-- CreateIndex
CREATE INDEX "sys_system_config_config_type_idx" ON "sys_system_config"("config_type");

-- CreateIndex
CREATE INDEX "sys_system_config_del_flag_status_idx" ON "sys_system_config"("del_flag", "status");

-- CreateIndex
CREATE INDEX "sys_system_config_create_time_idx" ON "sys_system_config"("create_time");

-- CreateIndex
CREATE INDEX "sys_audit_log_tenant_id_create_time_idx" ON "sys_audit_log"("tenant_id", "create_time");

-- CreateIndex
CREATE INDEX "sys_audit_log_user_id_create_time_idx" ON "sys_audit_log"("user_id", "create_time");

-- CreateIndex
CREATE INDEX "sys_audit_log_action_idx" ON "sys_audit_log"("action");

-- CreateIndex
CREATE INDEX "sys_audit_log_module_idx" ON "sys_audit_log"("module");

-- CreateIndex
CREATE INDEX "sys_audit_log_target_type_target_id_idx" ON "sys_audit_log"("target_type", "target_id");

-- CreateIndex
CREATE INDEX "sys_tenant_feature_tenant_id_idx" ON "sys_tenant_feature"("tenant_id");

-- CreateIndex
CREATE INDEX "sys_tenant_feature_feature_key_idx" ON "sys_tenant_feature"("feature_key");

-- CreateIndex
CREATE UNIQUE INDEX "sys_tenant_feature_tenant_id_feature_key_key" ON "sys_tenant_feature"("tenant_id", "feature_key");

-- CreateIndex
CREATE INDEX "sys_tenant_usage_tenant_id_date_idx" ON "sys_tenant_usage"("tenant_id", "date");

-- CreateIndex
CREATE UNIQUE INDEX "sys_tenant_usage_tenant_id_date_key" ON "sys_tenant_usage"("tenant_id", "date");
