import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'src/platform/prisma';
import { TenantContext } from '../context/tenant.context';
import { BusinessException } from 'src/shared/exceptions';
import { ResponseCode } from 'src/shared/response';
import { TenantStatus } from 'src/shared/enums';

/**
 * 租户创建参数
 */
export interface CreateTenantParams {
  /** 公司名称 */
  companyName: string;
  /** 联系人 */
  contactUserName?: string;
  /** 联系电话 */
  contactPhone?: string;
  /** 套餐ID */
  packageId?: number;
  /** 过期时间 */
  expireTime?: Date;
  /** 用户数量限制 */
  accountCount?: number;
  /** 备注 */
  remark?: string;
}

/**
 * 租户初始化数据
 */
export interface TenantInitData {
  /** 管理员用户名 */
  adminUserName: string;
  /** 管理员密码 */
  adminPassword: string;
  /** 管理员昵称 */
  adminNickName?: string;
}

/**
 * 租户生命周期服务
 *
 * 管理租户的创建、初始化、状态变更等生命周期操作
 */
@Injectable()
export class TenantLifecycleService {
  private readonly logger = new Logger(TenantLifecycleService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * 生成租户ID
   *
   * 格式: 6位数字，从100001开始
   */
  async generateTenantId(): Promise<string> {
    const lastTenant = await TenantContext.runIgnoringTenant(async () => {
      return this.prisma.sysTenant.findFirst({
        orderBy: { tenantId: 'desc' },
        select: { tenantId: true },
      });
    });

    if (!lastTenant) {
      return '100001';
    }

    const lastId = parseInt(lastTenant.tenantId, 10);
    return String(lastId + 1);
  }

  /**
   * 创建租户
   *
   * @param params 创建参数
   * @returns 新创建的租户ID
   */
  async createTenant(params: CreateTenantParams): Promise<string> {
    const tenantId = await this.generateTenantId();

    this.logger.log(`Creating tenant: ${tenantId} - ${params.companyName}`);

    await TenantContext.runIgnoringTenant(async () => {
      await this.prisma.sysTenant.create({
        data: {
          tenantId,
          companyName: params.companyName,
          contactUserName: params.contactUserName,
          contactPhone: params.contactPhone,
          packageId: params.packageId,
          expireTime: params.expireTime,
          accountCount: params.accountCount ?? 10,
          status: TenantStatus.NORMAL,
          delFlag: '0',
          remark: params.remark,
        },
      });
    });

    this.logger.log(`Tenant created successfully: ${tenantId}`);
    return tenantId;
  }

  /**
   * 初始化租户基础数据
   *
   * 创建租户后调用，初始化管理员用户、默认角色、默认部门等
   *
   * @param tenantId 租户ID
   * @param initData 初始化数据
   */
  async initializeTenant(tenantId: string, initData: TenantInitData): Promise<void> {
    this.logger.log(`Initializing tenant: ${tenantId}`);

    await TenantContext.runWithTenant(tenantId, async () => {
      // 1. 创建默认部门
      const dept = await this.prisma.sysDept.create({
        data: {
          tenantId,
          deptName: '总部',
          parentId: 0,
          ancestors: '0',
          orderNum: 0,
          leader: initData.adminNickName || initData.adminUserName,
          status: '0',
          delFlag: '0',
        },
      });

      // 2. 创建管理员角色
      const role = await this.prisma.sysRole.create({
        data: {
          tenantId,
          roleName: '管理员',
          roleKey: 'admin',
          roleSort: 1,
          dataScope: '1', // 全部数据权限
          status: '0',
          delFlag: '0',
        },
      });

      // 3. 创建管理员用户
      const user = await this.prisma.sysUser.create({
        data: {
          tenantId,
          deptId: dept.deptId,
          userName: initData.adminUserName,
          nickName: initData.adminNickName || initData.adminUserName,
          password: initData.adminPassword,
          userType: '00', // 系统用户
          status: '0',
          delFlag: '0',
        },
      });

      // 4. 关联用户和角色
      await this.prisma.sysUserRole.create({
        data: {
          userId: user.userId,
          roleId: role.roleId,
        },
      });

      this.logger.log(`Tenant ${tenantId} initialized: dept=${dept.deptId}, role=${role.roleId}, user=${user.userId}`);
    });
  }

  /**
   * 更新租户状态
   *
   * @param tenantId 租户ID
   * @param status 新状态
   */
  async updateStatus(tenantId: string, status: TenantStatus): Promise<void> {
    this.logger.log(`Updating tenant ${tenantId} status to ${status}`);

    await TenantContext.runIgnoringTenant(async () => {
      const tenant = await this.prisma.sysTenant.findUnique({
        where: { tenantId },
        select: { tenantId: true, status: true },
      });

      if (!tenant) {
        throw new BusinessException(ResponseCode.NOT_FOUND, `租户不存在: ${tenantId}`);
      }

      await this.prisma.sysTenant.update({
        where: { tenantId },
        data: { status },
      });
    });

    this.logger.log(`Tenant ${tenantId} status updated to ${status}`);
  }

  /**
   * 检查租户是否可用
   *
   * @param tenantId 租户ID
   * @returns 是否可用
   */
  async isTenantAvailable(tenantId: string): Promise<boolean> {
    const tenant = await TenantContext.runIgnoringTenant(async () => {
      return this.prisma.sysTenant.findUnique({
        where: { tenantId },
        select: { status: true, delFlag: true, expireTime: true },
      });
    });

    if (!tenant) {
      return false;
    }

    // 检查删除标志
    if (tenant.delFlag === '2') {
      return false;
    }

    // 检查状态
    if (tenant.status !== TenantStatus.NORMAL) {
      return false;
    }

    // 检查过期时间
    if (tenant.expireTime && tenant.expireTime < new Date()) {
      return false;
    }

    return true;
  }

  /**
   * 检查租户是否可登录
   *
   * @param tenantId 租户ID
   * @throws BusinessException 如果租户不可登录
   */
  async checkTenantCanLogin(tenantId: string): Promise<void> {
    const tenant = await TenantContext.runIgnoringTenant(async () => {
      return this.prisma.sysTenant.findUnique({
        where: { tenantId },
        select: { tenantId: true, companyName: true, status: true, delFlag: true, expireTime: true },
      });
    });

    if (!tenant) {
      throw new BusinessException(ResponseCode.NOT_FOUND, '租户不存在');
    }

    if (tenant.delFlag === '2') {
      throw new BusinessException(ResponseCode.FORBIDDEN, '租户已被删除');
    }

    if (tenant.status === TenantStatus.DISABLED) {
      throw new BusinessException(ResponseCode.FORBIDDEN, '租户已被停用，请联系管理员');
    }

    if (tenant.status === TenantStatus.EXPIRED) {
      throw new BusinessException(ResponseCode.FORBIDDEN, '租户已过期，请联系管理员续费');
    }

    if (tenant.expireTime && tenant.expireTime < new Date()) {
      // 自动更新状态为过期
      await this.updateStatus(tenantId, TenantStatus.EXPIRED);
      throw new BusinessException(ResponseCode.FORBIDDEN, '租户已过期，请联系管理员续费');
    }
  }

  /**
   * 软删除租户
   *
   * @param tenantId 租户ID
   */
  async deleteTenant(tenantId: string): Promise<void> {
    this.logger.log(`Soft deleting tenant: ${tenantId}`);

    await TenantContext.runIgnoringTenant(async () => {
      await this.prisma.sysTenant.update({
        where: { tenantId },
        data: { delFlag: '2' },
      });
    });

    this.logger.log(`Tenant ${tenantId} soft deleted`);
  }

  /**
   * 获取租户信息
   *
   * @param tenantId 租户ID
   */
  async getTenantInfo(tenantId: string) {
    return TenantContext.runIgnoringTenant(async () => {
      return this.prisma.sysTenant.findUnique({
        where: { tenantId },
      });
    });
  }
}
