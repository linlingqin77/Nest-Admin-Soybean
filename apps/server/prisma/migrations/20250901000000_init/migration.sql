-- CreateTable
CREATE TABLE "sys_tenant" (
    "id" SERIAL NOT NULL,
    "tenant_id" VARCHAR(20) NOT NULL,
    "contact_user_name" VARCHAR(50),
    "contact_phone" VARCHAR(20),
    "company_name" VARCHAR(100) NOT NULL,
    "license_number" VARCHAR(50),
    "address" VARCHAR(200),
    "intro" TEXT,
    "domain" VARCHAR(100),
    "package_id" INTEGER,
    "expire_time" TIMESTAMP(6),
    "account_count" INTEGER NOT NULL DEFAULT -1,
    "storage_quota" INTEGER NOT NULL DEFAULT 10240,
    "storage_used" INTEGER NOT NULL DEFAULT 0,
    "api_quota" INTEGER NOT NULL DEFAULT 10000,
    "status" CHAR(1) NOT NULL DEFAULT '0',
    "del_flag" BOOLEAN NOT NULL DEFAULT false,
    "create_by" VARCHAR(64) NOT NULL DEFAULT '',
    "create_time" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "update_by" VARCHAR(64) NOT NULL DEFAULT '',
    "update_time" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "remark" VARCHAR(500),

    CONSTRAINT "sys_tenant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sys_tenant_package" (
    "package_id" SERIAL NOT NULL,
    "package_name" VARCHAR(50) NOT NULL,
    "menu_ids" TEXT,
    "menu_check_strictly" BOOLEAN NOT NULL DEFAULT false,
    "status" CHAR(1) NOT NULL DEFAULT '0',
    "del_flag" BOOLEAN NOT NULL DEFAULT false,
    "create_by" VARCHAR(64) NOT NULL DEFAULT '',
    "create_time" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "update_by" VARCHAR(64) NOT NULL DEFAULT '',
    "update_time" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "remark" VARCHAR(500),

    CONSTRAINT "sys_tenant_package_pkey" PRIMARY KEY ("package_id")
);

-- CreateTable
CREATE TABLE "sys_client" (
    "id" SERIAL NOT NULL,
    "client_id" VARCHAR(64) NOT NULL,
    "client_key" VARCHAR(64) NOT NULL,
    "client_secret" VARCHAR(255) NOT NULL,
    "grant_type_list" VARCHAR(255),
    "device_type" VARCHAR(20),
    "active_timeout" INTEGER NOT NULL DEFAULT 1800,
    "timeout" INTEGER NOT NULL DEFAULT 86400,
    "status" CHAR(1) NOT NULL DEFAULT '0',
    "del_flag" BOOLEAN NOT NULL DEFAULT false,
    "create_by" VARCHAR(64) NOT NULL DEFAULT '',
    "create_time" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "update_by" VARCHAR(64) NOT NULL DEFAULT '',
    "update_time" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sys_client_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gen_data_source" (
    "id" SERIAL NOT NULL,
    "tenant_id" VARCHAR(20) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "type" VARCHAR(20) NOT NULL,
    "host" VARCHAR(255) NOT NULL,
    "port" INTEGER NOT NULL,
    "database" VARCHAR(100) NOT NULL,
    "username" VARCHAR(100) NOT NULL,
    "password" VARCHAR(500) NOT NULL,
    "status" CHAR(1) NOT NULL DEFAULT '0',
    "del_flag" BOOLEAN NOT NULL DEFAULT false,
    "create_by" VARCHAR(64) NOT NULL DEFAULT '',
    "create_time" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "update_by" VARCHAR(64) NOT NULL DEFAULT '',
    "update_time" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "remark" VARCHAR(500),

    CONSTRAINT "gen_data_source_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gen_template_group" (
    "id" SERIAL NOT NULL,
    "tenant_id" VARCHAR(20),
    "name" VARCHAR(100) NOT NULL,
    "description" VARCHAR(500),
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "status" CHAR(1) NOT NULL DEFAULT '0',
    "del_flag" BOOLEAN NOT NULL DEFAULT false,
    "create_by" VARCHAR(64) NOT NULL DEFAULT '',
    "create_time" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "update_by" VARCHAR(64) NOT NULL DEFAULT '',
    "update_time" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "gen_template_group_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gen_template" (
    "id" SERIAL NOT NULL,
    "group_id" INTEGER NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "file_name" VARCHAR(200) NOT NULL,
    "file_path" VARCHAR(500) NOT NULL,
    "content" TEXT NOT NULL,
    "language" VARCHAR(20) NOT NULL,
    "sort" INTEGER NOT NULL DEFAULT 0,
    "status" CHAR(1) NOT NULL DEFAULT '0',
    "del_flag" BOOLEAN NOT NULL DEFAULT false,
    "create_by" VARCHAR(64) NOT NULL DEFAULT '',
    "create_time" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "update_by" VARCHAR(64) NOT NULL DEFAULT '',
    "update_time" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "gen_template_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gen_history" (
    "id" SERIAL NOT NULL,
    "tenant_id" VARCHAR(20) NOT NULL,
    "table_id" INTEGER NOT NULL,
    "table_name" VARCHAR(200) NOT NULL,
    "template_group_id" INTEGER NOT NULL,
    "snapshot" TEXT NOT NULL,
    "generated_by" VARCHAR(64) NOT NULL,
    "generated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "gen_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gen_table" (
    "table_id" SERIAL NOT NULL,
    "tenant_id" VARCHAR(20) NOT NULL DEFAULT '000000',
    "data_source_id" INTEGER,
    "template_group_id" INTEGER,
    "table_name" VARCHAR(200) NOT NULL,
    "table_comment" VARCHAR(500) NOT NULL,
    "sub_table_name" VARCHAR(64),
    "sub_table_fk_name" VARCHAR(64),
    "class_name" VARCHAR(100) NOT NULL,
    "tpl_category" VARCHAR(200) NOT NULL,
    "tpl_web_type" VARCHAR(30) NOT NULL,
    "package_name" VARCHAR(100) NOT NULL,
    "module_name" VARCHAR(30) NOT NULL,
    "business_name" VARCHAR(30) NOT NULL,
    "function_name" VARCHAR(50) NOT NULL,
    "function_author" VARCHAR(50) NOT NULL,
    "gen_type" CHAR(1) NOT NULL,
    "gen_path" VARCHAR(200) NOT NULL,
    "options" VARCHAR(1000) NOT NULL,
    "status" CHAR(1) NOT NULL,
    "del_flag" BOOLEAN NOT NULL,
    "create_by" VARCHAR(64) NOT NULL,
    "create_time" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "update_by" VARCHAR(64) NOT NULL,
    "update_time" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "remark" VARCHAR(500),

    CONSTRAINT "gen_table_pkey" PRIMARY KEY ("table_id")
);

-- CreateTable
CREATE TABLE "gen_table_column" (
    "column_id" SERIAL NOT NULL,
    "table_id" INTEGER NOT NULL,
    "column_name" VARCHAR(200) NOT NULL,
    "column_comment" VARCHAR(500) NOT NULL,
    "column_type" VARCHAR(100) NOT NULL,
    "java_type" VARCHAR(500) NOT NULL,
    "java_field" VARCHAR(200) NOT NULL,
    "is_pk" CHAR(1) NOT NULL,
    "is_increment" CHAR(1) NOT NULL,
    "is_required" CHAR(1) NOT NULL,
    "is_insert" CHAR(1) NOT NULL,
    "is_edit" CHAR(1),
    "is_list" CHAR(1),
    "is_query" CHAR(1),
    "query_type" VARCHAR(200) NOT NULL,
    "html_type" VARCHAR(200) NOT NULL,
    "dict_type" VARCHAR(200) NOT NULL,
    "column_default" VARCHAR(200),
    "sort" INTEGER NOT NULL,
    "status" CHAR(1) NOT NULL,
    "del_flag" BOOLEAN NOT NULL,
    "create_by" VARCHAR(64) NOT NULL,
    "create_time" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "update_by" VARCHAR(64) NOT NULL,
    "update_time" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "remark" VARCHAR(500),

    CONSTRAINT "gen_table_column_pkey" PRIMARY KEY ("column_id")
);

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
    "del_flag" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "sys_system_config_pkey" PRIMARY KEY ("config_id")
);

-- CreateTable
CREATE TABLE "sys_config" (
    "config_id" SERIAL NOT NULL,
    "tenant_id" VARCHAR(20) NOT NULL DEFAULT '000000',
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
    "del_flag" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "sys_config_pkey" PRIMARY KEY ("config_id")
);

-- CreateTable
CREATE TABLE "sys_dept" (
    "dept_id" SERIAL NOT NULL,
    "tenant_id" VARCHAR(20) NOT NULL DEFAULT '000000',
    "parent_id" INTEGER NOT NULL,
    "ancestors" VARCHAR(50) NOT NULL,
    "dept_name" VARCHAR(30) NOT NULL,
    "order_num" INTEGER NOT NULL,
    "leader" VARCHAR(20) NOT NULL DEFAULT '',
    "phone" VARCHAR(11) NOT NULL DEFAULT '',
    "email" VARCHAR(50) NOT NULL DEFAULT '',
    "status" CHAR(1) NOT NULL DEFAULT '0',
    "del_flag" BOOLEAN NOT NULL DEFAULT false,
    "create_by" VARCHAR(64) NOT NULL DEFAULT '',
    "create_time" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "update_by" VARCHAR(64) NOT NULL DEFAULT '',
    "update_time" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "remark" VARCHAR(500),

    CONSTRAINT "sys_dept_pkey" PRIMARY KEY ("dept_id")
);

-- CreateTable
CREATE TABLE "sys_dict_data" (
    "dict_code" SERIAL NOT NULL,
    "tenant_id" VARCHAR(20) NOT NULL DEFAULT '000000',
    "dict_sort" INTEGER NOT NULL DEFAULT 0,
    "dict_label" VARCHAR(100) NOT NULL,
    "dict_value" VARCHAR(100) NOT NULL,
    "dict_type" VARCHAR(100) NOT NULL,
    "css_class" VARCHAR(100) NOT NULL DEFAULT '',
    "list_class" VARCHAR(100) NOT NULL DEFAULT '',
    "is_default" CHAR(1) NOT NULL DEFAULT 'N',
    "status" CHAR(1) NOT NULL DEFAULT '0',
    "create_by" VARCHAR(64) NOT NULL DEFAULT '',
    "create_time" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "update_by" VARCHAR(64) NOT NULL DEFAULT '',
    "update_time" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "remark" VARCHAR(500),
    "del_flag" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "sys_dict_data_pkey" PRIMARY KEY ("dict_code")
);

-- CreateTable
CREATE TABLE "sys_dict_type" (
    "dict_id" SERIAL NOT NULL,
    "tenant_id" VARCHAR(20) NOT NULL DEFAULT '000000',
    "dict_name" VARCHAR(100) NOT NULL,
    "dict_type" VARCHAR(100) NOT NULL,
    "status" CHAR(1) NOT NULL DEFAULT '0',
    "create_by" VARCHAR(64) NOT NULL DEFAULT '',
    "create_time" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "update_by" VARCHAR(64) NOT NULL DEFAULT '',
    "update_time" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "remark" VARCHAR(500),
    "del_flag" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "sys_dict_type_pkey" PRIMARY KEY ("dict_id")
);

-- CreateTable
CREATE TABLE "sys_job" (
    "job_id" SERIAL NOT NULL,
    "tenant_id" VARCHAR(20) NOT NULL DEFAULT '000000',
    "job_name" VARCHAR(64) NOT NULL,
    "job_group" VARCHAR(64) NOT NULL,
    "invoke_target" VARCHAR(500) NOT NULL,
    "cron_expression" VARCHAR(255),
    "misfire_policy" VARCHAR(20),
    "concurrent" CHAR(1),
    "status" CHAR(1),
    "create_by" VARCHAR(64) NOT NULL,
    "create_time" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "update_by" VARCHAR(64) NOT NULL,
    "update_time" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "remark" VARCHAR(500),

    CONSTRAINT "sys_job_pkey" PRIMARY KEY ("job_id")
);

-- CreateTable
CREATE TABLE "sys_job_log" (
    "job_log_id" SERIAL NOT NULL,
    "job_name" VARCHAR(64) NOT NULL,
    "job_group" VARCHAR(64) NOT NULL,
    "invoke_target" VARCHAR(500) NOT NULL,
    "job_message" VARCHAR(500),
    "status" CHAR(1) NOT NULL,
    "exception_info" VARCHAR(2000),
    "create_time" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sys_job_log_pkey" PRIMARY KEY ("job_log_id")
);

-- CreateTable
CREATE TABLE "sys_logininfor" (
    "info_id" SERIAL NOT NULL,
    "tenant_id" VARCHAR(20) NOT NULL DEFAULT '000000',
    "user_name" VARCHAR(50) NOT NULL,
    "ipaddr" VARCHAR(128) NOT NULL,
    "login_location" VARCHAR(255) NOT NULL DEFAULT '',
    "browser" VARCHAR(50) NOT NULL,
    "os" VARCHAR(50) NOT NULL,
    "device_type" CHAR(1) NOT NULL DEFAULT '0',
    "status" CHAR(1) NOT NULL,
    "msg" VARCHAR(255) NOT NULL,
    "del_flag" BOOLEAN NOT NULL DEFAULT false,
    "login_time" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sys_logininfor_pkey" PRIMARY KEY ("info_id")
);

-- CreateTable
CREATE TABLE "sys_menu" (
    "menu_id" SERIAL NOT NULL,
    "tenant_id" VARCHAR(20) NOT NULL DEFAULT '000000',
    "menu_name" VARCHAR(50) NOT NULL,
    "parent_id" INTEGER NOT NULL,
    "order_num" INTEGER NOT NULL,
    "path" VARCHAR(200) NOT NULL DEFAULT '',
    "component" VARCHAR(255),
    "query" VARCHAR(255) NOT NULL DEFAULT '',
    "is_frame" CHAR(1) NOT NULL,
    "is_cache" CHAR(1) NOT NULL,
    "menu_type" CHAR(1) NOT NULL,
    "visible" CHAR(1) NOT NULL,
    "status" CHAR(1) NOT NULL,
    "perms" VARCHAR(100) NOT NULL DEFAULT '',
    "icon" VARCHAR(100) NOT NULL DEFAULT '',
    "create_by" VARCHAR(64) NOT NULL DEFAULT '',
    "create_time" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "update_by" VARCHAR(64) NOT NULL DEFAULT '',
    "update_time" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "remark" VARCHAR(500),
    "del_flag" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "sys_menu_pkey" PRIMARY KEY ("menu_id")
);

-- CreateTable
CREATE TABLE "sys_notice" (
    "notice_id" SERIAL NOT NULL,
    "tenant_id" VARCHAR(20) NOT NULL DEFAULT '000000',
    "notice_title" VARCHAR(50) NOT NULL,
    "notice_type" CHAR(1) NOT NULL,
    "notice_content" TEXT,
    "status" CHAR(1) NOT NULL DEFAULT '0',
    "create_by" VARCHAR(64) NOT NULL DEFAULT '',
    "create_time" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "update_by" VARCHAR(64) NOT NULL DEFAULT '',
    "update_time" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "del_flag" BOOLEAN NOT NULL DEFAULT false,
    "remark" VARCHAR(500),

    CONSTRAINT "sys_notice_pkey" PRIMARY KEY ("notice_id")
);

-- CreateTable
CREATE TABLE "sys_oper_log" (
    "oper_id" SERIAL NOT NULL,
    "tenant_id" VARCHAR(20) NOT NULL DEFAULT '000000',
    "title" VARCHAR(50) NOT NULL,
    "business_type" INTEGER NOT NULL,
    "request_method" VARCHAR(10) NOT NULL,
    "operator_type" INTEGER NOT NULL,
    "oper_name" VARCHAR(50) NOT NULL,
    "dept_name" VARCHAR(50) NOT NULL,
    "oper_url" VARCHAR(255) NOT NULL,
    "oper_location" VARCHAR(255) NOT NULL,
    "oper_param" VARCHAR(2000) NOT NULL,
    "json_result" VARCHAR(2000) NOT NULL,
    "error_msg" VARCHAR(2000) NOT NULL,
    "method" VARCHAR(100) NOT NULL,
    "oper_ip" VARCHAR(255) NOT NULL,
    "oper_time" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" CHAR(1) NOT NULL,
    "cost_time" INTEGER NOT NULL,

    CONSTRAINT "sys_oper_log_pkey" PRIMARY KEY ("oper_id")
);

-- CreateTable
CREATE TABLE "sys_post" (
    "post_id" SERIAL NOT NULL,
    "tenant_id" VARCHAR(20) NOT NULL DEFAULT '000000',
    "dept_id" INTEGER,
    "post_code" VARCHAR(64) NOT NULL,
    "post_category" VARCHAR(100),
    "post_name" VARCHAR(50) NOT NULL,
    "post_sort" INTEGER NOT NULL DEFAULT 0,
    "status" CHAR(1) NOT NULL DEFAULT '0',
    "create_by" VARCHAR(64) NOT NULL DEFAULT '',
    "create_time" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "update_by" VARCHAR(64) NOT NULL DEFAULT '',
    "update_time" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "remark" VARCHAR(500),
    "del_flag" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "sys_post_pkey" PRIMARY KEY ("post_id")
);

-- CreateTable
CREATE TABLE "sys_role" (
    "role_id" SERIAL NOT NULL,
    "tenant_id" VARCHAR(20) NOT NULL DEFAULT '000000',
    "role_name" VARCHAR(30) NOT NULL,
    "role_key" VARCHAR(100) NOT NULL,
    "role_sort" INTEGER NOT NULL,
    "data_scope" CHAR(1) NOT NULL DEFAULT '1',
    "menu_check_strictly" BOOLEAN NOT NULL DEFAULT false,
    "dept_check_strictly" BOOLEAN NOT NULL DEFAULT false,
    "status" CHAR(1) NOT NULL DEFAULT '0',
    "del_flag" BOOLEAN NOT NULL DEFAULT false,
    "create_by" VARCHAR(64) NOT NULL DEFAULT '',
    "create_time" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "update_by" VARCHAR(64) NOT NULL DEFAULT '',
    "update_time" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "remark" VARCHAR(500),

    CONSTRAINT "sys_role_pkey" PRIMARY KEY ("role_id")
);

-- CreateTable
CREATE TABLE "sys_role_dept" (
    "role_id" INTEGER NOT NULL,
    "dept_id" INTEGER NOT NULL,

    CONSTRAINT "sys_role_dept_pkey" PRIMARY KEY ("role_id","dept_id")
);

-- CreateTable
CREATE TABLE "sys_role_menu" (
    "role_id" INTEGER NOT NULL,
    "menu_id" INTEGER NOT NULL,

    CONSTRAINT "sys_role_menu_pkey" PRIMARY KEY ("role_id","menu_id")
);

-- CreateTable
CREATE TABLE "sys_file_folder" (
    "folder_id" SERIAL NOT NULL,
    "tenant_id" VARCHAR(20) NOT NULL DEFAULT '000000',
    "parent_id" INTEGER NOT NULL DEFAULT 0,
    "folder_name" VARCHAR(100) NOT NULL,
    "folder_path" VARCHAR(500) NOT NULL,
    "order_num" INTEGER NOT NULL DEFAULT 0,
    "status" CHAR(1) NOT NULL DEFAULT '0',
    "del_flag" BOOLEAN NOT NULL DEFAULT false,
    "create_by" VARCHAR(64) NOT NULL DEFAULT '',
    "create_time" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "update_by" VARCHAR(64) NOT NULL DEFAULT '',
    "update_time" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "remark" VARCHAR(500),

    CONSTRAINT "sys_file_folder_pkey" PRIMARY KEY ("folder_id")
);

-- CreateTable
CREATE TABLE "sys_upload" (
    "upload_id" VARCHAR(255) NOT NULL,
    "tenant_id" VARCHAR(20) NOT NULL DEFAULT '000000',
    "folder_id" INTEGER NOT NULL DEFAULT 0,
    "size" INTEGER NOT NULL,
    "file_name" VARCHAR(255) NOT NULL,
    "new_file_name" VARCHAR(255) NOT NULL,
    "url" VARCHAR(500) NOT NULL,
    "ext" VARCHAR(50),
    "mime_type" VARCHAR(100),
    "storage_type" VARCHAR(20) NOT NULL DEFAULT 'local',
    "file_md5" VARCHAR(32),
    "thumbnail" VARCHAR(500),
    "parent_file_id" VARCHAR(255),
    "version" INTEGER NOT NULL DEFAULT 1,
    "is_latest" BOOLEAN NOT NULL DEFAULT true,
    "download_count" INTEGER NOT NULL DEFAULT 0,
    "status" CHAR(1) NOT NULL DEFAULT '0',
    "del_flag" BOOLEAN NOT NULL DEFAULT false,
    "create_by" VARCHAR(64) NOT NULL DEFAULT '',
    "create_time" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "update_by" VARCHAR(64) NOT NULL DEFAULT '',
    "update_time" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "remark" VARCHAR(500),

    CONSTRAINT "sys_upload_pkey" PRIMARY KEY ("upload_id")
);

-- CreateTable
CREATE TABLE "sys_file_share" (
    "share_id" VARCHAR(64) NOT NULL,
    "tenant_id" VARCHAR(20) NOT NULL DEFAULT '000000',
    "upload_id" VARCHAR(255) NOT NULL,
    "share_code" VARCHAR(6),
    "expire_time" TIMESTAMP(6),
    "max_download" INTEGER NOT NULL DEFAULT -1,
    "download_count" INTEGER NOT NULL DEFAULT 0,
    "status" CHAR(1) NOT NULL DEFAULT '0',
    "create_by" VARCHAR(64) NOT NULL DEFAULT '',
    "create_time" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sys_file_share_pkey" PRIMARY KEY ("share_id")
);

-- CreateTable
CREATE TABLE "sys_user" (
    "user_id" SERIAL NOT NULL,
    "tenant_id" VARCHAR(20) NOT NULL DEFAULT '000000',
    "dept_id" INTEGER,
    "user_name" VARCHAR(30) NOT NULL,
    "nick_name" VARCHAR(30) NOT NULL,
    "user_type" VARCHAR(2) NOT NULL,
    "email" VARCHAR(50) NOT NULL DEFAULT '',
    "phonenumber" VARCHAR(11) NOT NULL DEFAULT '',
    "sex" CHAR(1) NOT NULL DEFAULT '0',
    "avatar" VARCHAR(255) NOT NULL DEFAULT '',
    "password" VARCHAR(200) NOT NULL,
    "status" CHAR(1) NOT NULL DEFAULT '0',
    "del_flag" BOOLEAN NOT NULL DEFAULT false,
    "login_ip" VARCHAR(128) NOT NULL DEFAULT '',
    "login_date" TIMESTAMP(6),
    "create_by" VARCHAR(64) NOT NULL DEFAULT '',
    "create_time" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "update_by" VARCHAR(64) NOT NULL DEFAULT '',
    "update_time" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "remark" VARCHAR(500),

    CONSTRAINT "sys_user_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "sys_user_post" (
    "user_id" INTEGER NOT NULL,
    "post_id" INTEGER NOT NULL,

    CONSTRAINT "sys_user_post_pkey" PRIMARY KEY ("user_id","post_id")
);

-- CreateTable
CREATE TABLE "sys_user_role" (
    "user_id" INTEGER NOT NULL,
    "role_id" INTEGER NOT NULL,

    CONSTRAINT "sys_user_role_pkey" PRIMARY KEY ("user_id","role_id")
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

-- CreateTable
CREATE TABLE "sys_sms_channel" (
    "id" SERIAL NOT NULL,
    "code" VARCHAR(50) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "signature" VARCHAR(100) NOT NULL,
    "api_key" VARCHAR(255) NOT NULL,
    "api_secret" VARCHAR(255) NOT NULL,
    "callback_url" VARCHAR(500),
    "status" CHAR(1) NOT NULL DEFAULT '0',
    "remark" VARCHAR(500),
    "create_by" VARCHAR(64) NOT NULL DEFAULT '',
    "create_time" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "update_by" VARCHAR(64) NOT NULL DEFAULT '',
    "update_time" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "del_flag" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "sys_sms_channel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sys_sms_template" (
    "id" SERIAL NOT NULL,
    "channel_id" INTEGER NOT NULL,
    "code" VARCHAR(100) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "content" TEXT NOT NULL,
    "params" TEXT,
    "api_template_id" VARCHAR(100) NOT NULL,
    "type" INTEGER NOT NULL DEFAULT 1,
    "status" CHAR(1) NOT NULL DEFAULT '0',
    "remark" VARCHAR(500),
    "create_by" VARCHAR(64) NOT NULL DEFAULT '',
    "create_time" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "update_by" VARCHAR(64) NOT NULL DEFAULT '',
    "update_time" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "del_flag" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "sys_sms_template_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sys_sms_log" (
    "id" BIGSERIAL NOT NULL,
    "channel_id" INTEGER NOT NULL,
    "channel_code" VARCHAR(50) NOT NULL,
    "template_id" INTEGER NOT NULL,
    "template_code" VARCHAR(100) NOT NULL,
    "mobile" VARCHAR(20) NOT NULL,
    "content" TEXT NOT NULL,
    "params" TEXT,
    "send_status" INTEGER NOT NULL DEFAULT 0,
    "send_time" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "receive_status" INTEGER,
    "receive_time" TIMESTAMP(6),
    "api_send_code" VARCHAR(100),
    "api_receive_code" VARCHAR(100),
    "error_msg" TEXT,

    CONSTRAINT "sys_sms_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sys_mail_account" (
    "id" SERIAL NOT NULL,
    "mail" VARCHAR(255) NOT NULL,
    "username" VARCHAR(255) NOT NULL,
    "password" VARCHAR(255) NOT NULL,
    "host" VARCHAR(255) NOT NULL,
    "port" INTEGER NOT NULL,
    "ssl_enable" BOOLEAN NOT NULL DEFAULT false,
    "status" CHAR(1) NOT NULL DEFAULT '0',
    "remark" VARCHAR(500),
    "create_by" VARCHAR(64) NOT NULL DEFAULT '',
    "create_time" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "update_by" VARCHAR(64) NOT NULL DEFAULT '',
    "update_time" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "del_flag" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "sys_mail_account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sys_mail_template" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "code" VARCHAR(100) NOT NULL,
    "account_id" INTEGER NOT NULL,
    "nickname" VARCHAR(100) NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "content" TEXT NOT NULL,
    "params" TEXT,
    "status" CHAR(1) NOT NULL DEFAULT '0',
    "remark" VARCHAR(500),
    "create_by" VARCHAR(64) NOT NULL DEFAULT '',
    "create_time" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "update_by" VARCHAR(64) NOT NULL DEFAULT '',
    "update_time" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "del_flag" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "sys_mail_template_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sys_mail_log" (
    "id" BIGSERIAL NOT NULL,
    "user_id" INTEGER,
    "user_type" INTEGER,
    "to_mail" VARCHAR(255) NOT NULL,
    "account_id" INTEGER NOT NULL,
    "from_mail" VARCHAR(255) NOT NULL,
    "template_id" INTEGER NOT NULL,
    "template_code" VARCHAR(100) NOT NULL,
    "template_nickname" VARCHAR(100) NOT NULL,
    "template_title" VARCHAR(255) NOT NULL,
    "template_content" TEXT NOT NULL,
    "template_params" TEXT,
    "send_status" INTEGER NOT NULL DEFAULT 0,
    "send_time" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "error_msg" TEXT,

    CONSTRAINT "sys_mail_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sys_notify_template" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "code" VARCHAR(100) NOT NULL,
    "nickname" VARCHAR(100) NOT NULL,
    "content" TEXT NOT NULL,
    "params" TEXT,
    "type" INTEGER NOT NULL DEFAULT 1,
    "status" CHAR(1) NOT NULL DEFAULT '0',
    "remark" VARCHAR(500),
    "create_by" VARCHAR(64) NOT NULL DEFAULT '',
    "create_time" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "update_by" VARCHAR(64) NOT NULL DEFAULT '',
    "update_time" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "del_flag" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "sys_notify_template_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sys_notify_message" (
    "id" BIGSERIAL NOT NULL,
    "tenant_id" VARCHAR(20) NOT NULL DEFAULT '000000',
    "user_id" INTEGER NOT NULL,
    "user_type" INTEGER NOT NULL DEFAULT 1,
    "template_id" INTEGER NOT NULL,
    "template_code" VARCHAR(100) NOT NULL,
    "template_nickname" VARCHAR(100) NOT NULL,
    "template_content" TEXT NOT NULL,
    "template_params" TEXT,
    "read_status" BOOLEAN NOT NULL DEFAULT false,
    "read_time" TIMESTAMP(6),
    "del_flag" BOOLEAN NOT NULL DEFAULT false,
    "create_time" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sys_notify_message_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sys_tenant_quota" (
    "id" SERIAL NOT NULL,
    "tenant_id" VARCHAR(20) NOT NULL,
    "user_quota" INTEGER NOT NULL DEFAULT -1,
    "user_used" INTEGER NOT NULL DEFAULT 0,
    "storage_quota" BIGINT NOT NULL DEFAULT -1,
    "storage_used" BIGINT NOT NULL DEFAULT 0,
    "api_quota" INTEGER NOT NULL DEFAULT -1,
    "api_used" INTEGER NOT NULL DEFAULT 0,
    "create_time" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "update_time" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "sys_tenant_quota_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sys_tenant_quota_log" (
    "id" SERIAL NOT NULL,
    "tenant_id" VARCHAR(20) NOT NULL,
    "quota_type" VARCHAR(50) NOT NULL,
    "old_value" BIGINT NOT NULL,
    "new_value" BIGINT NOT NULL,
    "change_by" VARCHAR(64) NOT NULL,
    "change_time" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sys_tenant_quota_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sys_tenant_billing" (
    "id" SERIAL NOT NULL,
    "bill_no" VARCHAR(50) NOT NULL,
    "tenant_id" VARCHAR(20) NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "cycle" VARCHAR(20) NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'pending',
    "due_date" TIMESTAMP(6) NOT NULL,
    "paid_time" TIMESTAMP(6),
    "remark" VARCHAR(500),
    "create_by" VARCHAR(64) NOT NULL,
    "create_time" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "update_time" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "sys_tenant_billing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sys_tenant_billing_item" (
    "id" SERIAL NOT NULL,
    "billing_id" INTEGER NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "type" VARCHAR(50) NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "description" VARCHAR(500),

    CONSTRAINT "sys_tenant_billing_item_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sys_tenant_audit_log" (
    "id" BIGSERIAL NOT NULL,
    "tenant_id" VARCHAR(20) NOT NULL,
    "operator_id" INTEGER NOT NULL,
    "operator_name" VARCHAR(50) NOT NULL,
    "action_type" VARCHAR(50) NOT NULL,
    "action_desc" VARCHAR(500) NOT NULL,
    "module" VARCHAR(100) NOT NULL,
    "ip_address" VARCHAR(128) NOT NULL,
    "user_agent" VARCHAR(500),
    "request_url" VARCHAR(500),
    "request_method" VARCHAR(10),
    "request_params" TEXT,
    "before_data" TEXT,
    "after_data" TEXT,
    "response_data" TEXT,
    "operate_time" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sys_tenant_audit_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sys_oss_config" (
    "oss_config_id" SERIAL NOT NULL,
    "tenant_id" VARCHAR(20) NOT NULL DEFAULT '000000',
    "config_key" VARCHAR(100) NOT NULL,
    "access_key" VARCHAR(255) NOT NULL,
    "secret_key" VARCHAR(255) NOT NULL,
    "bucket_name" VARCHAR(255) NOT NULL,
    "prefix" VARCHAR(255),
    "endpoint" VARCHAR(255) NOT NULL,
    "domain" VARCHAR(255),
    "is_https" CHAR(1) NOT NULL DEFAULT 'N',
    "region" VARCHAR(100),
    "access_policy" CHAR(1) NOT NULL DEFAULT '1',
    "status" CHAR(1) NOT NULL DEFAULT '1',
    "ext1" VARCHAR(255),
    "remark" VARCHAR(500),
    "del_flag" BOOLEAN NOT NULL DEFAULT false,
    "create_by" VARCHAR(64) NOT NULL DEFAULT '',
    "create_time" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "update_by" VARCHAR(64) NOT NULL DEFAULT '',
    "update_time" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sys_oss_config_pkey" PRIMARY KEY ("oss_config_id")
);

-- CreateTable
CREATE TABLE "sys_oss" (
    "oss_id" BIGSERIAL NOT NULL,
    "tenant_id" VARCHAR(20) NOT NULL DEFAULT '000000',
    "file_name" VARCHAR(255) NOT NULL,
    "original_name" VARCHAR(255) NOT NULL,
    "file_suffix" VARCHAR(50) NOT NULL,
    "url" VARCHAR(500) NOT NULL,
    "size" BIGINT NOT NULL DEFAULT 0,
    "service" VARCHAR(50) NOT NULL DEFAULT 'local',
    "del_flag" BOOLEAN NOT NULL DEFAULT false,
    "create_by" VARCHAR(64) NOT NULL DEFAULT '',
    "create_time" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "update_by" VARCHAR(64) NOT NULL DEFAULT '',
    "update_time" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sys_oss_pkey" PRIMARY KEY ("oss_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "sys_tenant_tenant_id_key" ON "sys_tenant"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "sys_client_client_id_key" ON "sys_client"("client_id");

-- CreateIndex
CREATE INDEX "gen_data_source_tenant_id_status_idx" ON "gen_data_source"("tenant_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "gen_data_source_tenant_id_name_key" ON "gen_data_source"("tenant_id", "name");

-- CreateIndex
CREATE INDEX "gen_template_group_tenant_id_status_idx" ON "gen_template_group"("tenant_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "gen_template_group_tenant_id_name_key" ON "gen_template_group"("tenant_id", "name");

-- CreateIndex
CREATE INDEX "gen_template_group_id_idx" ON "gen_template"("group_id");

-- CreateIndex
CREATE INDEX "gen_template_status_idx" ON "gen_template"("status");

-- CreateIndex
CREATE INDEX "gen_history_tenant_id_table_id_idx" ON "gen_history"("tenant_id", "table_id");

-- CreateIndex
CREATE INDEX "gen_history_generated_at_idx" ON "gen_history"("generated_at");

-- CreateIndex
CREATE INDEX "gen_table_tenant_id_del_flag_idx" ON "gen_table"("tenant_id", "del_flag");

-- CreateIndex
CREATE INDEX "gen_table_data_source_id_idx" ON "gen_table"("data_source_id");

-- CreateIndex
CREATE INDEX "gen_table_template_group_id_idx" ON "gen_table"("template_group_id");

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
CREATE INDEX "sys_config_tenant_id_status_idx" ON "sys_config"("tenant_id", "status");

-- CreateIndex
CREATE INDEX "sys_config_tenant_id_config_type_idx" ON "sys_config"("tenant_id", "config_type");

-- CreateIndex
CREATE INDEX "sys_config_tenant_id_del_flag_status_idx" ON "sys_config"("tenant_id", "del_flag", "status");

-- CreateIndex
CREATE INDEX "sys_config_config_key_idx" ON "sys_config"("config_key");

-- CreateIndex
CREATE INDEX "sys_config_create_time_idx" ON "sys_config"("create_time");

-- CreateIndex
CREATE UNIQUE INDEX "sys_config_tenant_id_config_key_key" ON "sys_config"("tenant_id", "config_key");

-- CreateIndex
CREATE INDEX "sys_dept_tenant_id_status_idx" ON "sys_dept"("tenant_id", "status");

-- CreateIndex
CREATE INDEX "sys_dept_tenant_id_parent_id_idx" ON "sys_dept"("tenant_id", "parent_id");

-- CreateIndex
CREATE INDEX "sys_dept_status_idx" ON "sys_dept"("status");

-- CreateIndex
CREATE INDEX "sys_dept_tenant_id_del_flag_status_idx" ON "sys_dept"("tenant_id", "del_flag", "status");

-- CreateIndex
CREATE INDEX "sys_dept_parent_id_idx" ON "sys_dept"("parent_id");

-- CreateIndex
CREATE INDEX "sys_dict_data_tenant_id_dict_type_status_idx" ON "sys_dict_data"("tenant_id", "dict_type", "status");

-- CreateIndex
CREATE INDEX "sys_dict_data_dict_type_idx" ON "sys_dict_data"("dict_type");

-- CreateIndex
CREATE UNIQUE INDEX "sys_dict_data_tenant_id_dict_type_dict_value_key" ON "sys_dict_data"("tenant_id", "dict_type", "dict_value");

-- CreateIndex
CREATE INDEX "sys_dict_type_tenant_id_status_idx" ON "sys_dict_type"("tenant_id", "status");

-- CreateIndex
CREATE INDEX "sys_dict_type_dict_type_idx" ON "sys_dict_type"("dict_type");

-- CreateIndex
CREATE UNIQUE INDEX "sys_dict_type_tenant_id_dict_type_key" ON "sys_dict_type"("tenant_id", "dict_type");

-- CreateIndex
CREATE INDEX "sys_job_tenant_id_status_idx" ON "sys_job"("tenant_id", "status");

-- CreateIndex
CREATE INDEX "sys_job_invoke_target_idx" ON "sys_job"("invoke_target");

-- CreateIndex
CREATE INDEX "sys_logininfor_tenant_id_login_time_idx" ON "sys_logininfor"("tenant_id", "login_time");

-- CreateIndex
CREATE INDEX "sys_logininfor_user_name_idx" ON "sys_logininfor"("user_name");

-- CreateIndex
CREATE INDEX "sys_logininfor_status_idx" ON "sys_logininfor"("status");

-- CreateIndex
CREATE INDEX "sys_logininfor_login_time_idx" ON "sys_logininfor"("login_time");

-- CreateIndex
CREATE INDEX "sys_logininfor_tenant_id_user_name_login_time_idx" ON "sys_logininfor"("tenant_id", "user_name", "login_time");

-- CreateIndex
CREATE INDEX "sys_logininfor_tenant_id_status_login_time_idx" ON "sys_logininfor"("tenant_id", "status", "login_time");

-- CreateIndex
CREATE INDEX "sys_menu_tenant_id_status_idx" ON "sys_menu"("tenant_id", "status");

-- CreateIndex
CREATE INDEX "sys_menu_tenant_id_parent_id_idx" ON "sys_menu"("tenant_id", "parent_id");

-- CreateIndex
CREATE INDEX "sys_menu_status_idx" ON "sys_menu"("status");

-- CreateIndex
CREATE INDEX "sys_menu_tenant_id_del_flag_status_idx" ON "sys_menu"("tenant_id", "del_flag", "status");

-- CreateIndex
CREATE INDEX "sys_menu_parent_id_order_num_idx" ON "sys_menu"("parent_id", "order_num");

-- CreateIndex
CREATE INDEX "sys_notice_tenant_id_status_idx" ON "sys_notice"("tenant_id", "status");

-- CreateIndex
CREATE INDEX "sys_notice_tenant_id_notice_type_idx" ON "sys_notice"("tenant_id", "notice_type");

-- CreateIndex
CREATE INDEX "sys_notice_tenant_id_create_time_idx" ON "sys_notice"("tenant_id", "create_time");

-- CreateIndex
CREATE INDEX "sys_notice_tenant_id_del_flag_status_idx" ON "sys_notice"("tenant_id", "del_flag", "status");

-- CreateIndex
CREATE INDEX "sys_notice_create_time_idx" ON "sys_notice"("create_time");

-- CreateIndex
CREATE INDEX "sys_oper_log_tenant_id_oper_time_idx" ON "sys_oper_log"("tenant_id", "oper_time");

-- CreateIndex
CREATE INDEX "sys_oper_log_oper_name_idx" ON "sys_oper_log"("oper_name");

-- CreateIndex
CREATE INDEX "sys_oper_log_status_idx" ON "sys_oper_log"("status");

-- CreateIndex
CREATE INDEX "sys_oper_log_oper_time_idx" ON "sys_oper_log"("oper_time");

-- CreateIndex
CREATE INDEX "sys_oper_log_business_type_idx" ON "sys_oper_log"("business_type");

-- CreateIndex
CREATE INDEX "sys_oper_log_tenant_id_status_oper_time_idx" ON "sys_oper_log"("tenant_id", "status", "oper_time");

-- CreateIndex
CREATE INDEX "sys_oper_log_tenant_id_oper_name_oper_time_idx" ON "sys_oper_log"("tenant_id", "oper_name", "oper_time");

-- CreateIndex
CREATE INDEX "sys_post_tenant_id_status_idx" ON "sys_post"("tenant_id", "status");

-- CreateIndex
CREATE INDEX "sys_post_dept_id_idx" ON "sys_post"("dept_id");

-- CreateIndex
CREATE INDEX "sys_post_tenant_id_del_flag_status_idx" ON "sys_post"("tenant_id", "del_flag", "status");

-- CreateIndex
CREATE INDEX "sys_role_tenant_id_status_idx" ON "sys_role"("tenant_id", "status");

-- CreateIndex
CREATE INDEX "sys_role_tenant_id_del_flag_status_idx" ON "sys_role"("tenant_id", "del_flag", "status");

-- CreateIndex
CREATE INDEX "sys_role_tenant_id_role_key_idx" ON "sys_role"("tenant_id", "role_key");

-- CreateIndex
CREATE INDEX "sys_role_role_key_idx" ON "sys_role"("role_key");

-- CreateIndex
CREATE INDEX "sys_role_menu_role_id_idx" ON "sys_role_menu"("role_id");

-- CreateIndex
CREATE INDEX "sys_role_menu_menu_id_idx" ON "sys_role_menu"("menu_id");

-- CreateIndex
CREATE INDEX "sys_file_folder_tenant_id_parent_id_idx" ON "sys_file_folder"("tenant_id", "parent_id");

-- CreateIndex
CREATE INDEX "sys_upload_tenant_id_folder_id_idx" ON "sys_upload"("tenant_id", "folder_id");

-- CreateIndex
CREATE INDEX "sys_upload_file_md5_del_flag_idx" ON "sys_upload"("file_md5", "del_flag");

-- CreateIndex
CREATE INDEX "sys_upload_parent_file_id_version_idx" ON "sys_upload"("parent_file_id", "version");

-- CreateIndex
CREATE INDEX "sys_file_share_share_id_share_code_idx" ON "sys_file_share"("share_id", "share_code");

-- CreateIndex
CREATE INDEX "sys_file_share_upload_id_idx" ON "sys_file_share"("upload_id");

-- CreateIndex
CREATE INDEX "sys_user_tenant_id_status_idx" ON "sys_user"("tenant_id", "status");

-- CreateIndex
CREATE INDEX "sys_user_tenant_id_user_name_idx" ON "sys_user"("tenant_id", "user_name");

-- CreateIndex
CREATE INDEX "sys_user_tenant_id_create_time_idx" ON "sys_user"("tenant_id", "create_time");

-- CreateIndex
CREATE INDEX "sys_user_tenant_id_phonenumber_idx" ON "sys_user"("tenant_id", "phonenumber");

-- CreateIndex
CREATE INDEX "sys_user_tenant_id_email_idx" ON "sys_user"("tenant_id", "email");

-- CreateIndex
CREATE INDEX "sys_user_tenant_id_del_flag_status_idx" ON "sys_user"("tenant_id", "del_flag", "status");

-- CreateIndex
CREATE INDEX "sys_user_user_name_idx" ON "sys_user"("user_name");

-- CreateIndex
CREATE INDEX "sys_user_dept_id_idx" ON "sys_user"("dept_id");

-- CreateIndex
CREATE INDEX "sys_user_status_idx" ON "sys_user"("status");

-- CreateIndex
CREATE INDEX "sys_user_phonenumber_idx" ON "sys_user"("phonenumber");

-- CreateIndex
CREATE INDEX "sys_user_email_idx" ON "sys_user"("email");

-- CreateIndex
CREATE INDEX "sys_user_post_post_id_idx" ON "sys_user_post"("post_id");

-- CreateIndex
CREATE INDEX "sys_user_role_role_id_idx" ON "sys_user_role"("role_id");

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

-- CreateIndex
CREATE UNIQUE INDEX "sys_sms_channel_code_key" ON "sys_sms_channel"("code");

-- CreateIndex
CREATE INDEX "sys_sms_channel_status_idx" ON "sys_sms_channel"("status");

-- CreateIndex
CREATE INDEX "sys_sms_channel_code_idx" ON "sys_sms_channel"("code");

-- CreateIndex
CREATE UNIQUE INDEX "sys_sms_template_code_key" ON "sys_sms_template"("code");

-- CreateIndex
CREATE INDEX "sys_sms_template_channel_id_idx" ON "sys_sms_template"("channel_id");

-- CreateIndex
CREATE INDEX "sys_sms_template_status_idx" ON "sys_sms_template"("status");

-- CreateIndex
CREATE INDEX "sys_sms_template_type_idx" ON "sys_sms_template"("type");

-- CreateIndex
CREATE INDEX "sys_sms_log_mobile_idx" ON "sys_sms_log"("mobile");

-- CreateIndex
CREATE INDEX "sys_sms_log_send_time_idx" ON "sys_sms_log"("send_time");

-- CreateIndex
CREATE INDEX "sys_sms_log_send_status_idx" ON "sys_sms_log"("send_status");

-- CreateIndex
CREATE INDEX "sys_sms_log_template_code_idx" ON "sys_sms_log"("template_code");

-- CreateIndex
CREATE UNIQUE INDEX "sys_mail_account_mail_key" ON "sys_mail_account"("mail");

-- CreateIndex
CREATE INDEX "sys_mail_account_status_idx" ON "sys_mail_account"("status");

-- CreateIndex
CREATE UNIQUE INDEX "sys_mail_template_code_key" ON "sys_mail_template"("code");

-- CreateIndex
CREATE INDEX "sys_mail_template_account_id_idx" ON "sys_mail_template"("account_id");

-- CreateIndex
CREATE INDEX "sys_mail_template_status_idx" ON "sys_mail_template"("status");

-- CreateIndex
CREATE INDEX "sys_mail_log_to_mail_idx" ON "sys_mail_log"("to_mail");

-- CreateIndex
CREATE INDEX "sys_mail_log_send_time_idx" ON "sys_mail_log"("send_time");

-- CreateIndex
CREATE INDEX "sys_mail_log_send_status_idx" ON "sys_mail_log"("send_status");

-- CreateIndex
CREATE INDEX "sys_mail_log_template_code_idx" ON "sys_mail_log"("template_code");

-- CreateIndex
CREATE UNIQUE INDEX "sys_notify_template_code_key" ON "sys_notify_template"("code");

-- CreateIndex
CREATE INDEX "sys_notify_template_status_idx" ON "sys_notify_template"("status");

-- CreateIndex
CREATE INDEX "sys_notify_template_type_idx" ON "sys_notify_template"("type");

-- CreateIndex
CREATE INDEX "sys_notify_message_tenant_id_user_id_idx" ON "sys_notify_message"("tenant_id", "user_id");

-- CreateIndex
CREATE INDEX "sys_notify_message_user_id_read_status_idx" ON "sys_notify_message"("user_id", "read_status");

-- CreateIndex
CREATE INDEX "sys_notify_message_create_time_idx" ON "sys_notify_message"("create_time");

-- CreateIndex
CREATE UNIQUE INDEX "sys_tenant_quota_tenant_id_key" ON "sys_tenant_quota"("tenant_id");

-- CreateIndex
CREATE INDEX "sys_tenant_quota_tenant_id_idx" ON "sys_tenant_quota"("tenant_id");

-- CreateIndex
CREATE INDEX "sys_tenant_quota_log_tenant_id_idx" ON "sys_tenant_quota_log"("tenant_id");

-- CreateIndex
CREATE INDEX "sys_tenant_quota_log_change_time_idx" ON "sys_tenant_quota_log"("change_time");

-- CreateIndex
CREATE UNIQUE INDEX "sys_tenant_billing_bill_no_key" ON "sys_tenant_billing"("bill_no");

-- CreateIndex
CREATE INDEX "sys_tenant_billing_tenant_id_idx" ON "sys_tenant_billing"("tenant_id");

-- CreateIndex
CREATE INDEX "sys_tenant_billing_status_idx" ON "sys_tenant_billing"("status");

-- CreateIndex
CREATE INDEX "sys_tenant_billing_due_date_idx" ON "sys_tenant_billing"("due_date");

-- CreateIndex
CREATE INDEX "sys_tenant_billing_create_time_idx" ON "sys_tenant_billing"("create_time");

-- CreateIndex
CREATE INDEX "sys_tenant_billing_item_billing_id_idx" ON "sys_tenant_billing_item"("billing_id");

-- CreateIndex
CREATE INDEX "sys_tenant_audit_log_tenant_id_idx" ON "sys_tenant_audit_log"("tenant_id");

-- CreateIndex
CREATE INDEX "sys_tenant_audit_log_operator_id_idx" ON "sys_tenant_audit_log"("operator_id");

-- CreateIndex
CREATE INDEX "sys_tenant_audit_log_action_type_idx" ON "sys_tenant_audit_log"("action_type");

-- CreateIndex
CREATE INDEX "sys_tenant_audit_log_operate_time_idx" ON "sys_tenant_audit_log"("operate_time");

-- CreateIndex
CREATE INDEX "sys_tenant_audit_log_tenant_id_operate_time_idx" ON "sys_tenant_audit_log"("tenant_id", "operate_time");

-- CreateIndex
CREATE INDEX "sys_tenant_audit_log_tenant_id_action_type_operate_time_idx" ON "sys_tenant_audit_log"("tenant_id", "action_type", "operate_time");

-- CreateIndex
CREATE INDEX "sys_oss_config_tenant_id_idx" ON "sys_oss_config"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "sys_oss_config_tenant_id_config_key_key" ON "sys_oss_config"("tenant_id", "config_key");

-- CreateIndex
CREATE INDEX "sys_oss_tenant_id_idx" ON "sys_oss"("tenant_id");

-- CreateIndex
CREATE INDEX "sys_oss_file_name_idx" ON "sys_oss"("file_name");

-- AddForeignKey
ALTER TABLE "gen_template" ADD CONSTRAINT "gen_template_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "gen_template_group"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gen_history" ADD CONSTRAINT "gen_history_table_id_fkey" FOREIGN KEY ("table_id") REFERENCES "gen_table"("table_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gen_history" ADD CONSTRAINT "gen_history_template_group_id_fkey" FOREIGN KEY ("template_group_id") REFERENCES "gen_template_group"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gen_table" ADD CONSTRAINT "gen_table_data_source_id_fkey" FOREIGN KEY ("data_source_id") REFERENCES "gen_data_source"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gen_table" ADD CONSTRAINT "gen_table_template_group_id_fkey" FOREIGN KEY ("template_group_id") REFERENCES "gen_template_group"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gen_table_column" ADD CONSTRAINT "gen_table_column_table_id_fkey" FOREIGN KEY ("table_id") REFERENCES "gen_table"("table_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sys_file_share" ADD CONSTRAINT "sys_file_share_upload_id_fkey" FOREIGN KEY ("upload_id") REFERENCES "sys_upload"("upload_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sys_sms_template" ADD CONSTRAINT "sys_sms_template_channel_id_fkey" FOREIGN KEY ("channel_id") REFERENCES "sys_sms_channel"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sys_mail_template" ADD CONSTRAINT "sys_mail_template_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "sys_mail_account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sys_tenant_billing_item" ADD CONSTRAINT "sys_tenant_billing_item_billing_id_fkey" FOREIGN KEY ("billing_id") REFERENCES "sys_tenant_billing"("id") ON DELETE CASCADE ON UPDATE CASCADE;

