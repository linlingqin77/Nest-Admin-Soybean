/**
 * 测试数据工厂
 *
 * @description
 * 提供创建和管理测试数据的工厂方法
 * 用于E2E测试和集成测试中创建真实的数据库记录
 *
 * @example
 * ```typescript
 * import { TestFixtures } from 'test/helpers/test-fixtures';
 *
 * describe('User E2E', () => {
 *   let fixtures: TestFixtures;
 *
 *   beforeAll(async () => {
 *     fixtures = new TestFixtures(prisma);
 *   });
 *
 *   afterAll(async () => {
 *     await fixtures.cleanupAll();
 *   });
 *
 *   it('should create user', async () => {
 *     const user = await fixtures.createTestUser({ userName: 'testuser' });
 *     expect(user.userId).toBeDefined();
 *   });
 * });
 * ```
 */

import { PrismaService } from 'src/prisma/prisma.service';
import * as bcrypt from 'bcryptjs';

/**
 * 用户创建DTO
 */
export interface CreateUserDto {
  userName: string;
  nickName: string;
  password?: string;
  deptId?: number;
  email?: string;
  phonenumber?: string;
  sex?: string;
  status?: string;
  tenantId?: string;
}

/**
 * 角色创建DTO
 */
export interface CreateRoleDto {
  roleName: string;
  roleKey: string;
  roleSort?: number;
  dataScope?: string;
  status?: string;
  tenantId?: string;
  menuIds?: number[];
}

/**
 * 部门创建DTO
 */
export interface CreateDeptDto {
  deptName: string;
  parentId?: number;
  orderNum?: number;
  leader?: string;
  phone?: string;
  email?: string;
  status?: string;
  tenantId?: string;
}

/**
 * 字典类型创建DTO
 */
export interface CreateDictTypeDto {
  dictName: string;
  dictType: string;
  status?: string;
  tenantId?: string;
}

/**
 * 字典数据创建DTO
 */
export interface CreateDictDataDto {
  dictType: string;
  dictLabel: string;
  dictValue: string;
  dictSort?: number;
  status?: string;
  tenantId?: string;
}

/**
 * 菜单创建DTO
 */
export interface CreateMenuDto {
  menuName: string;
  parentId?: number;
  orderNum?: number;
  path?: string;
  component?: string;
  menuType?: string;
  perms?: string;
  status?: string;
  tenantId?: string;
}

/**
 * 配置创建DTO
 */
export interface CreateConfigDto {
  configName: string;
  configKey: string;
  configValue: string;
  configType?: string;
  tenantId?: string;
}

/**
 * 公告创建DTO
 */
export interface CreateNoticeDto {
  noticeTitle: string;
  noticeType: string;
  noticeContent?: string;
  status?: string;
  tenantId?: string;
}

/**
 * 岗位创建DTO
 */
export interface CreatePostDto {
  postCode: string;
  postName: string;
  postSort?: number;
  status?: string;
  tenantId?: string;
}

/**
 * 测试数据工厂类
 */
export class TestFixtures {
  private prisma: PrismaService;
  private defaultTenantId: string = '000000';

  // 追踪创建的数据ID
  private createdUsers: number[] = [];
  private createdRoles: number[] = [];
  private createdDepts: number[] = [];
  private createdDictTypes: number[] = [];
  private createdDictData: number[] = [];
  private createdMenus: number[] = [];
  private createdConfigs: number[] = [];
  private createdNotices: number[] = [];
  private createdPosts: number[] = [];

  constructor(prisma: PrismaService, tenantId?: string) {
    this.prisma = prisma;
    if (tenantId) {
      this.defaultTenantId = tenantId;
    }
  }

  /**
   * 设置默认租户ID
   */
  setTenantId(tenantId: string): void {
    this.defaultTenantId = tenantId;
  }

  /**
   * 创建测试用户
   */
  async createTestUser(data: Partial<CreateUserDto> = {}): Promise<any> {
    const password = data.password || '123456';
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await this.prisma.sysUser.create({
      data: {
        tenantId: data.tenantId || this.defaultTenantId,
        userName: data.userName || `testuser_${Date.now()}`,
        nickName: data.nickName || '测试用户',
        password: hashedPassword,
        deptId: data.deptId || 100,
        email: data.email || `test_${Date.now()}@example.com`,
        phonenumber: data.phonenumber || `138${Date.now().toString().slice(-8)}`,
        sex: data.sex || '0',
        status: data.status || '0',
        delFlag: '0',
        userType: '00',
        createBy: 'test',
        updateBy: 'test',
      },
    });

    this.createdUsers.push(user.userId);
    return user;
  }

  /**
   * 创建测试角色
   */
  async createTestRole(data: Partial<CreateRoleDto> = {}): Promise<any> {
    const role = await this.prisma.sysRole.create({
      data: {
        tenantId: data.tenantId || this.defaultTenantId,
        roleName: data.roleName || `测试角色_${Date.now()}`,
        roleKey: data.roleKey || `test_role_${Date.now()}`,
        roleSort: data.roleSort || 99,
        dataScope: data.dataScope || '1',
        status: data.status || '0',
        delFlag: '0',
        menuCheckStrictly: false,
        deptCheckStrictly: false,
        createBy: 'test',
        updateBy: 'test',
      },
    });

    this.createdRoles.push(role.roleId);

    // 如果提供了菜单ID，创建角色菜单关联
    if (data.menuIds && data.menuIds.length > 0) {
      await this.prisma.sysRoleMenu.createMany({
        data: data.menuIds.map((menuId) => ({
          roleId: role.roleId,
          menuId,
        })),
      });
    }

    return role;
  }

  /**
   * 创建测试部门
   */
  async createTestDept(data: Partial<CreateDeptDto> = {}): Promise<any> {
    const dept = await this.prisma.sysDept.create({
      data: {
        tenantId: data.tenantId || this.defaultTenantId,
        deptName: data.deptName || `测试部门_${Date.now()}`,
        parentId: data.parentId || 0,
        orderNum: data.orderNum || 1,
        leader: data.leader || '测试负责人',
        phone: data.phone || '13800138000',
        email: data.email || 'dept@example.com',
        status: data.status || '0',
        delFlag: '0',
        ancestors: data.parentId ? `0,${data.parentId}` : '0',
        createBy: 'test',
        updateBy: 'test',
      },
    });

    this.createdDepts.push(dept.deptId);
    return dept;
  }

  /**
   * 创建测试字典类型
   */
  async createTestDictType(data: Partial<CreateDictTypeDto> = {}): Promise<any> {
    const dictType = await this.prisma.sysDictType.create({
      data: {
        tenantId: data.tenantId || this.defaultTenantId,
        dictName: data.dictName || `测试字典_${Date.now()}`,
        dictType: data.dictType || `test_dict_${Date.now()}`,
        status: data.status || '0',
        createBy: 'test',
        updateBy: 'test',
      },
    });

    this.createdDictTypes.push(dictType.dictId);
    return dictType;
  }

  /**
   * 创建测试字典数据
   */
  async createTestDictData(data: Partial<CreateDictDataDto> = {}): Promise<any> {
    const dictData = await this.prisma.sysDictData.create({
      data: {
        tenantId: data.tenantId || this.defaultTenantId,
        dictType: data.dictType || 'test_dict',
        dictLabel: data.dictLabel || `测试标签_${Date.now()}`,
        dictValue: data.dictValue || `test_value_${Date.now()}`,
        dictSort: data.dictSort || 1,
        status: data.status || '0',
        createBy: 'test',
        updateBy: 'test',
      },
    });

    this.createdDictData.push(dictData.dictCode);
    return dictData;
  }

  /**
   * 创建测试菜单
   */
  async createTestMenu(data: Partial<CreateMenuDto> = {}): Promise<any> {
    const menu = await this.prisma.sysMenu.create({
      data: {
        tenantId: data.tenantId || this.defaultTenantId,
        menuName: data.menuName || `测试菜单_${Date.now()}`,
        parentId: data.parentId || 0,
        orderNum: data.orderNum || 1,
        path: data.path || `/test_${Date.now()}`,
        component: data.component || '',
        menuType: data.menuType || 'M',
        perms: data.perms || '',
        status: data.status || '0',
        visible: '0',
        isFrame: '1',
        isCache: '0',
        createBy: 'test',
        updateBy: 'test',
      },
    });

    this.createdMenus.push(menu.menuId);
    return menu;
  }

  /**
   * 创建测试配置
   */
  async createTestConfig(data: Partial<CreateConfigDto> = {}): Promise<any> {
    const config = await this.prisma.sysConfig.create({
      data: {
        tenantId: data.tenantId || this.defaultTenantId,
        configName: data.configName || `测试配置_${Date.now()}`,
        configKey: data.configKey || `test.config.${Date.now()}`,
        configValue: data.configValue || 'test_value',
        configType: data.configType || 'N',
        createBy: 'test',
        updateBy: 'test',
      },
    });

    this.createdConfigs.push(config.configId);
    return config;
  }

  /**
   * 创建测试公告
   */
  async createTestNotice(data: Partial<CreateNoticeDto> = {}): Promise<any> {
    const notice = await this.prisma.sysNotice.create({
      data: {
        tenantId: data.tenantId || this.defaultTenantId,
        noticeTitle: data.noticeTitle || `测试公告_${Date.now()}`,
        noticeType: data.noticeType || '1',
        noticeContent: data.noticeContent || '测试公告内容',
        status: data.status || '0',
        createBy: 'test',
        updateBy: 'test',
      },
    });

    this.createdNotices.push(notice.noticeId);
    return notice;
  }

  /**
   * 创建测试岗位
   */
  async createTestPost(data: Partial<CreatePostDto> = {}): Promise<any> {
    const post = await this.prisma.sysPost.create({
      data: {
        tenantId: data.tenantId || this.defaultTenantId,
        postCode: data.postCode || `test_post_${Date.now()}`,
        postName: data.postName || `测试岗位_${Date.now()}`,
        postSort: data.postSort || 99,
        status: data.status || '0',
        createBy: 'test',
        updateBy: 'test',
      },
    });

    this.createdPosts.push(post.postId);
    return post;
  }

  /**
   * 创建测试文件数据
   */
  createTestFile(): { buffer: Buffer; filename: string; mimetype: string } {
    const content = 'Test file content for E2E testing';
    return {
      buffer: Buffer.from(content),
      filename: `test_file_${Date.now()}.txt`,
      mimetype: 'text/plain',
    };
  }

  /**
   * 为用户分配角色
   */
  async assignRoleToUser(userId: number, roleId: number): Promise<void> {
    await this.prisma.sysUserRole.create({
      data: {
        userId,
        roleId,
      },
    });
  }

  /**
   * 为用户分配岗位
   */
  async assignPostToUser(userId: number, postId: number): Promise<void> {
    await this.prisma.sysUserPost.create({
      data: {
        userId,
        postId,
      },
    });
  }

  /**
   * 获取创建的用户ID列表
   */
  getCreatedUserIds(): number[] {
    return [...this.createdUsers];
  }

  /**
   * 获取创建的角色ID列表
   */
  getCreatedRoleIds(): number[] {
    return [...this.createdRoles];
  }

  /**
   * 获取创建的部门ID列表
   */
  getCreatedDeptIds(): number[] {
    return [...this.createdDepts];
  }

  /**
   * 清理所有测试数据
   */
  async cleanupAll(): Promise<void> {
    try {
      // 按依赖关系逆序删除

      // 1. 删除用户角色关联
      if (this.createdUsers.length > 0) {
        await this.prisma.sysUserRole.deleteMany({
          where: { userId: { in: this.createdUsers } },
        });
      }

      // 2. 删除用户岗位关联
      if (this.createdUsers.length > 0) {
        await this.prisma.sysUserPost.deleteMany({
          where: { userId: { in: this.createdUsers } },
        });
      }

      // 3. 删除用户
      if (this.createdUsers.length > 0) {
        await this.prisma.sysUser.deleteMany({
          where: { userId: { in: this.createdUsers } },
        });
        this.createdUsers = [];
      }

      // 4. 删除角色菜单关联
      if (this.createdRoles.length > 0) {
        await this.prisma.sysRoleMenu.deleteMany({
          where: { roleId: { in: this.createdRoles } },
        });
      }

      // 5. 删除角色部门关联
      if (this.createdRoles.length > 0) {
        await this.prisma.sysRoleDept.deleteMany({
          where: { roleId: { in: this.createdRoles } },
        });
      }

      // 6. 删除角色
      if (this.createdRoles.length > 0) {
        await this.prisma.sysRole.deleteMany({
          where: { roleId: { in: this.createdRoles } },
        });
        this.createdRoles = [];
      }

      // 7. 删除部门
      if (this.createdDepts.length > 0) {
        await this.prisma.sysDept.deleteMany({
          where: { deptId: { in: this.createdDepts } },
        });
        this.createdDepts = [];
      }

      // 8. 删除字典数据
      if (this.createdDictData.length > 0) {
        await this.prisma.sysDictData.deleteMany({
          where: { dictCode: { in: this.createdDictData } },
        });
        this.createdDictData = [];
      }

      // 9. 删除字典类型
      if (this.createdDictTypes.length > 0) {
        await this.prisma.sysDictType.deleteMany({
          where: { dictId: { in: this.createdDictTypes } },
        });
        this.createdDictTypes = [];
      }

      // 10. 删除菜单
      if (this.createdMenus.length > 0) {
        await this.prisma.sysMenu.deleteMany({
          where: { menuId: { in: this.createdMenus } },
        });
        this.createdMenus = [];
      }

      // 11. 删除配置
      if (this.createdConfigs.length > 0) {
        await this.prisma.sysConfig.deleteMany({
          where: { configId: { in: this.createdConfigs } },
        });
        this.createdConfigs = [];
      }

      // 12. 删除公告
      if (this.createdNotices.length > 0) {
        await this.prisma.sysNotice.deleteMany({
          where: { noticeId: { in: this.createdNotices } },
        });
        this.createdNotices = [];
      }

      // 13. 删除岗位
      if (this.createdPosts.length > 0) {
        await this.prisma.sysPost.deleteMany({
          where: { postId: { in: this.createdPosts } },
        });
        this.createdPosts = [];
      }
    } catch (error) {
      console.error('TestFixtures cleanup error:', error);
    }
  }
}

/**
 * 创建测试数据工厂实例
 */
export function createTestFixtures(prisma: PrismaService, tenantId?: string): TestFixtures {
  return new TestFixtures(prisma, tenantId);
}

export default TestFixtures;
