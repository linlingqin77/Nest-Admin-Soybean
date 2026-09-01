import { request } from '@/service/request';

// ===================== 租户管理 =====================

/** 租户列表 */
export function fetchTenantFindAll(params?: Api.System.TenantSearchParams) {
  return request<Api.System.TenantList>({
    url: '/system/tenant/list',
    method: 'get',
    params
  });
}

/** 租户详情 */
export function fetchTenantFindOne(id: string) {
  return request<Api.System.Tenant>({
    url: `/system/tenant/${id}`,
    method: 'get'
  });
}

/** 创建租户 */
export function fetchTenantCreate(data: Api.System.TenantOperateParams) {
  return request<void>({
    url: '/system/tenant/',
    method: 'post',
    data
  });
}

/** 更新租户 */
export function fetchTenantUpdate(data: Api.System.TenantOperateParams) {
  return request<void>({
    url: '/system/tenant/',
    method: 'put',
    data
  });
}

/** 删除租户 */
export function fetchTenantRemove(ids: CommonType.IdType | string) {
  return request<void>({
    url: `/system/tenant/${ids}`,
    method: 'delete'
  });
}

/** 同步租户字典 */
export function fetchTenantSyncDict() {
  return request<void>({
    url: '/system/tenant/syncTenantDict',
    method: 'get'
  });
}

/** 同步租户套餐 */
export function fetchTenantSyncPackage() {
  return request<void>({
    url: '/system/tenant/syncTenantPackage',
    method: 'get'
  });
}

/** 同步租户配置 */
export function fetchTenantSyncConfig() {
  return request<void>({
    url: '/system/tenant/syncTenantConfig',
    method: 'get'
  });
}

/** 导出租户 */
export function fetchTenantExport(params?: Api.System.TenantSearchParams) {
  return request<Blob, 'blob'>({
    url: '/system/tenant/export',
    method: 'post',
    params,
    responseType: 'blob'
  });
}

// ===================== 租户切换 =====================

/** 获取租户选择列表 */
export function fetchGetTenantSelectList() {
  return request<Api.System.TenantSelectItem[]>({
    url: '/system/tenant/select-list',
    method: 'get'
  });
}

/** 切换租户 */
export function fetchSwitchTenant(tenantId: string) {
  return request<Api.Auth.LoginToken>({
    url: `/system/tenant/dynamic/${tenantId}`,
    method: 'get'
  });
}

/** 恢复原租户 */
export function fetchClearTenant() {
  return request<Api.Auth.LoginToken>({
    url: '/system/tenant/dynamic/clear',
    method: 'get'
  });
}

/** 切换租户 (旧接口) */
export function fetchChangeTenant(tenantId: string) {
  return request<Api.Auth.LoginToken>({
    url: `/system/tenant/dynamic/${tenantId}`,
    method: 'get'
  });
}

/** 恢复租户 */
export function fetchRestoreTenant() {
  return request<Api.Auth.LoginToken>({
    url: '/system/tenant/dynamic/clear',
    method: 'get'
  });
}

/** 获取租户切换状态 */
export function fetchGetTenantSwitchStatus() {
  return request<Api.System.TenantSwitchStatus>({
    url: '/system/tenant/switch-status',
    method: 'get'
  });
}

// ===================== 租户配额 =====================

/** 获取租户配额列表 */
export function fetchGetTenantQuotaList(params?: Api.System.TenantQuotaSearchParams) {
  return request<Api.System.TenantQuotaList>({
    url: '/system/tenant/quota/list',
    method: 'get',
    params
  });
}

/** 获取租户配额详情 */
export function fetchGetTenantQuotaDetail(tenantId: CommonType.IdType) {
  return request<Api.System.TenantQuota>({
    url: `/system/tenant/quota/${tenantId}`,
    method: 'get'
  });
}

/** 更新租户配额 */
export function fetchUpdateTenantQuota(data: Api.System.UpdateTenantQuotaParams) {
  return request<boolean>({
    url: '/system/tenant/quota/',
    method: 'put',
    data
  });
}

/** 检查配额 */
export function fetchCheckTenantQuota(data: { tenantId: string; quotaType: string }) {
  return request<boolean>({
    url: '/system/tenant/quota/check',
    method: 'post',
    data
  });
}

// ===================== 租户审计 =====================

/** 获取租户审计日志列表 */
export function fetchGetTenantAuditLogList(params?: Api.System.TenantAuditLogSearchParams) {
  return request<Api.System.TenantAuditLogList>({
    url: '/system/tenant/audit/list',
    method: 'get',
    params
  });
}

/** 获取租户审计日志详情 */
export function fetchGetTenantAuditLogDetail(auditId: CommonType.IdType) {
  return request<Api.System.TenantAuditLog>({
    url: `/system/tenant/audit/${auditId}`,
    method: 'get'
  });
}

/** 获取审计日志统计 */
export function fetchGetTenantAuditStats() {
  return request<Api.System.TenantAuditStats>({
    url: '/system/tenant/audit/stats/summary',
    method: 'get'
  });
}

/** 导出租户审计日志 */
export function fetchExportTenantAuditLog(params?: Api.System.TenantAuditLogSearchParams) {
  return request<Blob, 'blob'>({
    url: '/system/tenant/audit/export',
    method: 'post',
    data: params,
    responseType: 'blob'
  });
}

// ===================== 租户仪表盘 =====================

/** 获取租户仪表盘数据 */
export function fetchGetDashboardData() {
  return request<Api.System.TenantDashboardData>({
    url: '/system/tenant/dashboard/',
    method: 'get'
  });
}

/** 获取租户统计数据 */
export function fetchGetTenantDashboardStats() {
  return request<Api.System.TenantDashboardStats>({
    url: '/system/tenant/dashboard/stats',
    method: 'get'
  });
}

/** 获取租户增长趋势 */
export function fetchGetTenantDashboardTrend() {
  return request<Api.System.TenantTrendData[]>({
    url: '/system/tenant/dashboard/trend',
    method: 'get'
  });
}

/** 获取套餐分布 */
export function fetchGetTenantPackageDistribution() {
  return request<Api.System.PackageDistribution[]>({
    url: '/system/tenant/dashboard/package-distribution',
    method: 'get'
  });
}

/** 获取即将到期租户 */
export function fetchGetExpiringTenants() {
  return request<Api.System.Tenant[]>({
    url: '/system/tenant/dashboard/expiring-tenants',
    method: 'get'
  });
}

/** 获取配额使用 TOP10 */
export function fetchGetTenantQuotaTop() {
  return request<Api.System.QuotaTopItem[]>({
    url: '/system/tenant/dashboard/quota-top',
    method: 'get'
  });
}
