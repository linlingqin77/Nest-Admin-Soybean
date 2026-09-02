/**
 * 租户 Mock 服务
 *
 * @description
 * 提供租户模块测试所需的 Mock 实现
 * 包含 MockPrismaService, MockRedisService, MockConfigService 的租户特定配置
 *
 * @requirements 1.1, 2.1, 3.1
 */

import { createMockPrisma, MockPrismaService, createModelMock } from './prisma.mock';
import { createMockRedis, MockRedisService } from './redis.mock';
import { createMockConfig, MockConfigService } from './config.mock';
import { TenantContext, TenantContextData } from '../../src/core/tenancy/context/tenant.context';
import { SUPER_TENANT_ID, TENANT_MODELS } from '../../src/core/tenancy/constants/tenant-models';

/**
 * 租户测试配置
 */
export interface TenantTestConfig {
  /** 是否启用租户功能 */
  enabled: boolean;
  /** 超级租户ID */
  superTenantId: string;
  /** 默认租户ID */
  defaultTenantId: string;
}

/**
 * 默认租户测试配置
 */
export const defaultTenantTestConfig: TenantTestConfig = {
  enabled: true,
  superTenantId: SUPER_TENANT_ID,
  defaultTenantId: SUPER_TENANT_ID,
};

/**
 * 租户测试数据
 */
export interface TenantTestData {
  tenantId: string;
  companyName: string;
  status: '0' | '1' | '2';
  delFlag: '0' | '2';
  expireTime?: Date;
  accountCount: number;
  packageId?: number;
}

/**
 * 用户测试数据
 */
export interface UserTestData {
  userId: number;
  tenantId: string;
  userName: string;
  status: '0' | '1';
  delFlag: '0' | '2';
}

/**
 * 配额测试数据
 */
export interface QuotaTestData {
  tenantId: string;
  resource: 'users' | 'storage' | 'api_calls';
  quota: number;
  currentUsage: number;
}

/**
 * 创建租户专用的 Prisma Mock
 *
 * @param platform/config 租户配置
 * @returns 配置好的 MockPrismaService
 */
export function createTenantMockPrisma(mockConfig: Partial<TenantTestConfig> = {}): MockPrismaService {
  const mock = createMockPrisma();

  // 添加租户相关的默认行为
  mock.sysTenant.findUnique.mockImplementation(async (args: any) => {
    const tenantId = args?.where?.tenantId;
    if (tenantId === SUPER_TENANT_ID) {
      return {
        id: 1,
        tenantId: SUPER_TENANT_ID,
        companyName: '超级租户',
        status: '0',
        delFlag: '0',
        accountCount: -1,
        expireTime: new Date('2099-12-31'),
      };
    }
    return null;
  });

  mock.sysTenant.findFirst.mockImplementation(async (args: any) => {
    const tenantId = args?.where?.tenantId;
    if (tenantId === SUPER_TENANT_ID) {
      return {
        id: 1,
        tenantId: SUPER_TENANT_ID,
        companyName: '超级租户',
        status: '0',
        delFlag: '0',
        accountCount: -1,
        expireTime: new Date('2099-12-31'),
      };
    }
    return null;
  });

  return mock;
}

/**
 * 创建租户专用的 Redis Mock
 *
 * @returns 配置好的 MockRedisService
 */
export function createTenantMockRedis(): MockRedisService {
  const mock = createMockRedis();

  // 预设一些租户相关的缓存数据
  mock._store.set(
    'tenant:000000:info',
    JSON.stringify({
      tenantId: SUPER_TENANT_ID,
      companyName: '超级租户',
      status: '0',
    }),
  );

  return mock;
}

/**
 * 创建租户专用的 Config Mock
 *
 * @param platform/config 租户配置覆盖
 * @returns 配置好的 MockConfigService
 */
export function createTenantMockConfig(mockConfig: Partial<TenantTestConfig> = {}): MockConfigService {
  const tenantConfig = { ...defaultTenantTestConfig, ...mockConfig };

  return createMockConfig({
    'tenant.enabled': tenantConfig.enabled,
    'tenant.defaultTenantId': tenantConfig.defaultTenantId,
  });
}

/**
 * 创建 AppConfigService Mock
 *
 * @param platform/config 租户配置覆盖
 * @returns AppConfigService Mock 对象
 */
export function createMockAppConfigService(mockConfig: Partial<TenantTestConfig> = {}) {
  const tenantConfig = { ...defaultTenantTestConfig, ...mockConfig };

  return {
    tenant: {
      enabled: tenantConfig.enabled,
      defaultTenantId: tenantConfig.defaultTenantId,
    },
    get: jest.fn((key: string) => {
      if (key === 'tenant.enabled') return tenantConfig.enabled;
      if (key === 'tenant.defaultTenantId') return tenantConfig.defaultTenantId;
      return undefined;
    }),
  };
}

/**
 * 创建测试租户数据
 *
 * @param overrides 覆盖默认值
 * @returns 租户测试数据
 */
export function createTestTenantData(overrides: Partial<TenantTestData> = {}): TenantTestData {
  return {
    tenantId: '100001',
    companyName: '测试租户',
    status: '0',
    delFlag: '0',
    expireTime: new Date('2099-12-31'),
    accountCount: 100,
    packageId: 1,
    ...overrides,
  };
}

/**
 * 创建测试用户数据
 *
 * @param tenantId 租户ID
 * @param overrides 覆盖默认值
 * @returns 用户测试数据
 */
export function createTestUserData(tenantId: string, overrides: Partial<UserTestData> = {}): UserTestData {
  return {
    userId: 1,
    tenantId,
    userName: 'testuser',
    status: '0',
    delFlag: '0',
    ...overrides,
  };
}

/**
 * 创建测试配额数据
 *
 * @param tenantId 租户ID
 * @param overrides 覆盖默认值
 * @returns 配额测试数据
 */
export function createTestQuotaData(tenantId: string, overrides: Partial<QuotaTestData> = {}): QuotaTestData {
  return {
    tenantId,
    resource: 'users',
    quota: 100,
    currentUsage: 50,
    ...overrides,
  };
}

/**
 * 生成随机租户ID (6位数字字符串)
 *
 * @returns 随机租户ID
 */
export function generateRandomTenantId(): string {
  const num = Math.floor(100000 + Math.random() * 900000);
  return String(num);
}

/**
 * 生成非超级租户的随机租户ID
 *
 * @returns 非超级租户的随机租户ID
 */
export function generateNormalTenantId(): string {
  let tenantId: string;
  do {
    tenantId = generateRandomTenantId();
  } while (tenantId === SUPER_TENANT_ID);
  return tenantId;
}

/**
 * 生成租户ID对 (用于隔离测试)
 *
 * @returns 两个不同的租户ID
 */
export function generateTenantIdPair(): [string, string] {
  const tenantA = generateNormalTenantId();
  let tenantB: string;
  do {
    tenantB = generateNormalTenantId();
  } while (tenantB === tenantA);
  return [tenantA, tenantB];
}

/**
 * 检查模型是否为租户模型
 *
 * @param model 模型名称
 * @returns 是否为租户模型
 */
export function isTenantModel(model: string): boolean {
  return TENANT_MODELS.has(model);
}

/**
 * 获取所有租户模型名称
 *
 * @returns 租户模型名称数组
 */
export function getTenantModels(): string[] {
  return Array.from(TENANT_MODELS);
}

/**
 * 获取非租户模型名称示例
 *
 * @returns 非租户模型名称数组
 */
export function getNonTenantModels(): string[] {
  return ['GenTable', 'GenTableColumn', 'SysTenant', 'SysTenantPackage'];
}

// 重新导出基础 Mock 创建函数
export { createMockPrisma, createMockRedis, createMockConfig };
export type { MockPrismaService, MockRedisService, MockConfigService };
