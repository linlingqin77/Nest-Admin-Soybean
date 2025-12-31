import { SysTenant, SysTenantPackage } from '@prisma/client';

/**
 * 租户测试数据工厂
 *
 * @description
 * 提供创建测试租户数据的工厂方法
 */

/**
 * 默认租户数据
 */
export const defaultTenant: SysTenant = {
  id: 1,
  tenantId: '000000',
  contactUserName: '管理员',
  contactPhone: '13800138000',
  companyName: '测试公司',
  licenseNumber: null,
  address: '测试地址',
  intro: '测试公司简介',
  domain: null,
  packageId: 1,
  expireTime: new Date('2099-12-31'),
  accountCount: -1, // 不限制
  storageQuota: 10240, // 10GB
  storageUsed: 0,
  apiQuota: 10000, // API 日调用量上限
  status: '0',
  delFlag: '0',
  createBy: 'admin',
  createTime: new Date(),
  updateBy: 'admin',
  updateTime: new Date(),
  remark: null,
};

/**
 * 创建租户测试数据
 *
 * @param overrides 要覆盖的字段
 * @returns 租户数据
 *
 * @example
 * ```typescript
 * const tenant = createTenant({ companyName: '自定义公司' });
 * const expiredTenant = createTenant({ expireTime: new Date('2020-01-01') });
 * ```
 */
export const createTenant = (overrides: Partial<SysTenant> = {}): SysTenant => {
  return {
    ...defaultTenant,
    ...overrides,
  };
};

/**
 * 创建多个租户测试数据
 *
 * @param count 租户数量
 * @param overrides 要覆盖的字段（可以是函数）
 * @returns 租户数据数组
 *
 * @example
 * ```typescript
 * const tenants = createTenants(5);
 * const tenantsWithPackage = createTenants(3, (i) => ({ packageId: i + 1 }));
 * ```
 */
export const createTenants = (
  count: number,
  overrides: Partial<SysTenant> | ((index: number) => Partial<SysTenant>) = {},
): SysTenant[] => {
  return Array.from({ length: count }, (_, index) => {
    const override = typeof overrides === 'function' ? overrides(index) : overrides;
    const tenantId = String(index + 1).padStart(6, '0');
    return createTenant({
      id: index + 1,
      tenantId,
      companyName: `测试公司${index + 1}`,
      contactUserName: `管理员${index + 1}`,
      contactPhone: `1380013800${index}`,
      ...override,
    });
  });
};

/**
 * 创建超级租户（默认租户）
 */
export const createSuperTenant = (overrides: Partial<SysTenant> = {}): SysTenant => {
  return createTenant({
    id: 1,
    tenantId: '000000',
    companyName: '超级租户',
    accountCount: -1,
    ...overrides,
  });
};

/**
 * 创建普通租户
 */
export const createNormalTenant = (overrides: Partial<SysTenant> = {}): SysTenant => {
  return createTenant({
    id: 2,
    tenantId: '000001',
    companyName: '普通租户',
    accountCount: 100,
    ...overrides,
  });
};

/**
 * 创建禁用租户
 */
export const createDisabledTenant = (overrides: Partial<SysTenant> = {}): SysTenant => {
  return createTenant({
    id: 3,
    tenantId: '000002',
    companyName: '禁用租户',
    status: '1',
    ...overrides,
  });
};

/**
 * 创建已过期租户
 */
export const createExpiredTenant = (overrides: Partial<SysTenant> = {}): SysTenant => {
  return createTenant({
    id: 4,
    tenantId: '000003',
    companyName: '已过期租户',
    expireTime: new Date('2020-01-01'),
    ...overrides,
  });
};

/**
 * 创建已删除租户
 */
export const createDeletedTenant = (overrides: Partial<SysTenant> = {}): SysTenant => {
  return createTenant({
    id: 5,
    tenantId: '000004',
    companyName: '已删除租户',
    delFlag: '2',
    ...overrides,
  });
};

/**
 * 创建配额已满租户
 */
export const createQuotaFullTenant = (overrides: Partial<SysTenant> = {}): SysTenant => {
  return createTenant({
    id: 6,
    tenantId: '000005',
    companyName: '配额已满租户',
    accountCount: 10,
    storageQuota: 1024,
    storageUsed: 1024,
    ...overrides,
  });
};

/**
 * 默认租户套餐数据
 */
export const defaultTenantPackage: SysTenantPackage = {
  packageId: 1,
  packageName: '基础套餐',
  menuIds: '1,2,3,4,5',
  menuCheckStrictly: false,
  status: '0',
  delFlag: '0',
  createBy: 'admin',
  createTime: new Date(),
  updateBy: 'admin',
  updateTime: new Date(),
  remark: null,
};

/**
 * 创建租户套餐测试数据
 *
 * @param overrides 要覆盖的字段
 * @returns 租户套餐数据
 */
export const createTenantPackage = (overrides: Partial<SysTenantPackage> = {}): SysTenantPackage => {
  return {
    ...defaultTenantPackage,
    ...overrides,
  };
};

/**
 * 创建多个租户套餐测试数据
 */
export const createTenantPackages = (
  count: number,
  overrides: Partial<SysTenantPackage> | ((index: number) => Partial<SysTenantPackage>) = {},
): SysTenantPackage[] => {
  return Array.from({ length: count }, (_, index) => {
    const override = typeof overrides === 'function' ? overrides(index) : overrides;
    return createTenantPackage({
      packageId: index + 1,
      packageName: `套餐${index + 1}`,
      ...override,
    });
  });
};

/**
 * 租户创建 DTO 数据
 */
export interface CreateTenantDto {
  tenantId?: string;
  companyName: string;
  contactUserName?: string;
  contactPhone?: string;
  licenseNumber?: string;
  address?: string;
  intro?: string;
  domain?: string;
  packageId?: number;
  expireTime?: Date;
  accountCount?: number;
  storageQuota?: number;
  status?: string;
  remark?: string;
}

/**
 * 创建租户 DTO 测试数据
 */
export const createTenantDto = (overrides: Partial<CreateTenantDto> = {}): CreateTenantDto => {
  return {
    companyName: '新租户公司',
    contactUserName: '联系人',
    contactPhone: '13900139000',
    licenseNumber: '91110000000000000X',
    address: '北京市朝阳区',
    intro: '新租户简介',
    domain: 'new-tenant.example.com',
    packageId: 1,
    expireTime: new Date('2099-12-31'),
    accountCount: 100,
    storageQuota: 10240,
    status: '0',
    remark: '',
    ...overrides,
  };
};

/**
 * 租户更新 DTO 数据
 */
export interface UpdateTenantDto {
  id: number;
  companyName?: string;
  contactUserName?: string;
  contactPhone?: string;
  licenseNumber?: string;
  address?: string;
  intro?: string;
  domain?: string;
  packageId?: number;
  expireTime?: Date;
  accountCount?: number;
  storageQuota?: number;
  status?: string;
  remark?: string;
}

/**
 * 创建租户更新 DTO 测试数据
 */
export const createUpdateTenantDto = (overrides: Partial<UpdateTenantDto> = {}): UpdateTenantDto => {
  return {
    id: 1,
    companyName: '更新后的公司',
    contactUserName: '新联系人',
    contactPhone: '13900139001',
    address: '上海市浦东新区',
    intro: '更新后的简介',
    packageId: 2,
    accountCount: 200,
    storageQuota: 20480,
    status: '0',
    remark: '已更新',
    ...overrides,
  };
};

/**
 * 租户状态枚举
 */
export const TenantStatus = {
  /** 正常 */
  NORMAL: '0',
  /** 禁用 */
  DISABLED: '1',
} as const;

/**
 * 删除标志枚举
 */
export const DelFlag = {
  /** 正常 */
  NORMAL: '0',
  /** 已删除 */
  DELETED: '2',
} as const;
