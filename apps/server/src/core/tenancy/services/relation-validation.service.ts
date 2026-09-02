import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'src/platform/prisma';
import { TenantContext } from '../context/tenant.context';

/**
 * 关联验证结果
 */
export interface RelationValidationResult {
  /** 是否有效 */
  valid: boolean;
  /** 错误消息 */
  message?: string;
}

/**
 * 依赖检查结果
 */
export interface DependencyCheckResult {
  /** 是否存在依赖 */
  hasDependencies: boolean;
  /** 依赖详情 */
  dependencies: {
    model: string;
    count: number;
  }[];
  /** 错误消息 */
  message?: string;
}

/**
 * 关联验证服务
 *
 * 遵循阿里开发规范，不使用数据库外键约束，
 * 在应用层维护数据关联关系的完整性
 */
@Injectable()
export class RelationValidationService {
  private readonly logger = new Logger(RelationValidationService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * 验证租户套餐是否存在
   *
   * @param packageId 套餐ID
   * @returns 验证结果
   */
  async validatePackageExists(packageId: number): Promise<RelationValidationResult> {
    const pkg = await TenantContext.runIgnoringTenant(async () => {
      return this.prisma.sysTenantPackage.findUnique({
        where: { packageId },
        select: { packageId: true, status: true },
      });
    });

    if (!pkg) {
      return {
        valid: false,
        message: `套餐不存在: packageId=${packageId}`,
      };
    }

    if (pkg.status !== '0') {
      return {
        valid: false,
        message: `套餐已停用: packageId=${packageId}`,
      };
    }

    return { valid: true };
  }

  /**
   * 验证部门是否存在
   *
   * @param deptId 部门ID
   * @returns 验证结果
   */
  async validateDeptExists(deptId: number): Promise<RelationValidationResult> {
    const dept = await this.prisma.sysDept.findUnique({
      where: { deptId },
      select: { deptId: true, status: true, delFlag: true },
    });

    if (!dept) {
      return {
        valid: false,
        message: `部门不存在: deptId=${deptId}`,
      };
    }

    if (dept.delFlag === '2') {
      return {
        valid: false,
        message: `部门已删除: deptId=${deptId}`,
      };
    }

    if (dept.status !== '0') {
      return {
        valid: false,
        message: `部门已停用: deptId=${deptId}`,
      };
    }

    return { valid: true };
  }

  /**
   * 验证角色是否存在
   *
   * @param roleId 角色ID
   * @returns 验证结果
   */
  async validateRoleExists(roleId: number): Promise<RelationValidationResult> {
    const role = await this.prisma.sysRole.findUnique({
      where: { roleId },
      select: { roleId: true, status: true, delFlag: true },
    });

    if (!role) {
      return {
        valid: false,
        message: `角色不存在: roleId=${roleId}`,
      };
    }

    if (role.delFlag === '2') {
      return {
        valid: false,
        message: `角色已删除: roleId=${roleId}`,
      };
    }

    if (role.status !== '0') {
      return {
        valid: false,
        message: `角色已停用: roleId=${roleId}`,
      };
    }

    return { valid: true };
  }

  /**
   * 验证用户是否存在
   *
   * @param userId 用户ID
   * @returns 验证结果
   */
  async validateUserExists(userId: number): Promise<RelationValidationResult> {
    const user = await this.prisma.sysUser.findUnique({
      where: { userId },
      select: { userId: true, status: true, delFlag: true },
    });

    if (!user) {
      return {
        valid: false,
        message: `用户不存在: userId=${userId}`,
      };
    }

    if (user.delFlag === '2') {
      return {
        valid: false,
        message: `用户已删除: userId=${userId}`,
      };
    }

    return { valid: true };
  }

  /**
   * 验证租户是否存在
   *
   * @param tenantId 租户ID
   * @returns 验证结果
   */
  async validateTenantExists(tenantId: string): Promise<RelationValidationResult> {
    const tenant = await TenantContext.runIgnoringTenant(async () => {
      return this.prisma.sysTenant.findUnique({
        where: { tenantId },
        select: { tenantId: true, status: true, delFlag: true },
      });
    });

    if (!tenant) {
      return {
        valid: false,
        message: `租户不存在: tenantId=${tenantId}`,
      };
    }

    if (tenant.delFlag === '2') {
      return {
        valid: false,
        message: `租户已删除: tenantId=${tenantId}`,
      };
    }

    if (tenant.status !== '0') {
      return {
        valid: false,
        message: `租户已停用: tenantId=${tenantId}`,
      };
    }

    return { valid: true };
  }

  /**
   * 检查部门是否有依赖（子部门、用户）
   *
   * @param deptId 部门ID
   * @returns 依赖检查结果
   */
  async checkDeptDependencies(deptId: number): Promise<DependencyCheckResult> {
    const dependencies: { model: string; count: number }[] = [];

    // 检查子部门
    const childDeptCount = await this.prisma.sysDept.count({
      where: { parentId: deptId, delFlag: '0' },
    });
    if (childDeptCount > 0) {
      dependencies.push({ model: 'SysDept', count: childDeptCount });
    }

    // 检查用户
    const userCount = await this.prisma.sysUser.count({
      where: { deptId, delFlag: '0' },
    });
    if (userCount > 0) {
      dependencies.push({ model: 'SysUser', count: userCount });
    }

    return {
      hasDependencies: dependencies.length > 0,
      dependencies,
      message:
        dependencies.length > 0
          ? `部门存在依赖关系，无法删除: ${dependencies.map((d) => `${d.model}(${d.count})`).join(', ')}`
          : undefined,
    };
  }

  /**
   * 检查角色是否有依赖（用户）
   *
   * @param roleId 角色ID
   * @returns 依赖检查结果
   */
  async checkRoleDependencies(roleId: number): Promise<DependencyCheckResult> {
    const dependencies: { model: string; count: number }[] = [];

    // 检查用户角色关联
    const userRoleCount = await this.prisma.sysUserRole.count({
      where: { roleId },
    });
    if (userRoleCount > 0) {
      dependencies.push({ model: 'SysUserRole', count: userRoleCount });
    }

    return {
      hasDependencies: dependencies.length > 0,
      dependencies,
      message:
        dependencies.length > 0
          ? `角色存在依赖关系，无法删除: ${dependencies.map((d) => `${d.model}(${d.count})`).join(', ')}`
          : undefined,
    };
  }

  /**
   * 检查租户套餐是否有依赖（租户）
   *
   * @param packageId 套餐ID
   * @returns 依赖检查结果
   */
  async checkPackageDependencies(packageId: number): Promise<DependencyCheckResult> {
    const dependencies: { model: string; count: number }[] = [];

    // 检查使用该套餐的租户
    const tenantCount = await TenantContext.runIgnoringTenant(async () => {
      return this.prisma.sysTenant.count({
        where: { packageId, delFlag: '0' },
      });
    });
    if (tenantCount > 0) {
      dependencies.push({ model: 'SysTenant', count: tenantCount });
    }

    return {
      hasDependencies: dependencies.length > 0,
      dependencies,
      message:
        dependencies.length > 0
          ? `套餐存在依赖关系，无法删除: ${dependencies.map((d) => `${d.model}(${d.count})`).join(', ')}`
          : undefined,
    };
  }

  /**
   * 验证关联并抛出异常
   *
   * @param result 验证结果
   * @throws BadRequestException 如果验证失败
   */
  assertValid(result: RelationValidationResult): void {
    if (!result.valid) {
      throw new BadRequestException(result.message);
    }
  }

  /**
   * 检查依赖并抛出异常
   *
   * @param result 依赖检查结果
   * @throws BadRequestException 如果存在依赖
   */
  assertNoDependencies(result: DependencyCheckResult): void {
    if (result.hasDependencies) {
      throw new BadRequestException(result.message);
    }
  }
}
