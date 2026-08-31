import { Test, TestingModule } from '@nestjs/testing';
import {
  TenantLifecycleService,
  CreateTenantParams,
  TenantInitData,
} from '@/core/tenancy/services/tenant-lifecycle.service';
import { PrismaService } from '@/platform/prisma';
import { TenantStatus } from '@/shared/enums';
import { BusinessException } from '@/shared/exceptions';
import { ResponseCode } from '@/shared/response';

describe('TenantLifecycleService', () => {
  let service: TenantLifecycleService;
  let prisma: jest.Mocked<PrismaService>;

  const mockPrismaService = {
    sysTenant: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    sysDept: {
      create: jest.fn(),
    },
    sysRole: {
      create: jest.fn(),
    },
    sysUser: {
      create: jest.fn(),
    },
    sysUserRole: {
      create: jest.fn(),
    },
  };

  beforeEach(async () => {
    const modules: TestingModule = await Test.createTestingModule({
      providers: [
        TenantLifecycleService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = modules.get<TenantLifecycleService>(TenantLifecycleService);
    prisma = modules.get(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('generateTenantId', () => {
    it('应该在没有租户时返回 100001', async () => {
      mockPrismaService.sysTenant.findFirst.mockResolvedValue(null);

      const result = await service.generateTenantId();

      expect(result).toBe('100001');
    });

    it('应该返回最后一个租户ID加1', async () => {
      mockPrismaService.sysTenant.findFirst.mockResolvedValue({ tenantId: '100005' });

      const result = await service.generateTenantId();

      expect(result).toBe('100006');
    });

    it('应该正确处理大数字租户ID', async () => {
      mockPrismaService.sysTenant.findFirst.mockResolvedValue({ tenantId: '999999' });

      const result = await service.generateTenantId();

      expect(result).toBe('1000000');
    });
  });

  describe('createTenant', () => {
    const createParams: CreateTenantParams = {
      companyName: '测试公司',
      contactUserName: '张三',
      contactPhone: '13800138000',
      packageId: 1,
      accountCount: 20,
      remark: '测试备注',
    };

    it('应该成功创建租户', async () => {
      mockPrismaService.sysTenant.findFirst.mockResolvedValue(null);
      mockPrismaService.sysTenant.create.mockResolvedValue({ tenantId: '100001' });

      const result = await service.createTenant(createParams);

      expect(result).toBe('100001');
      expect(mockPrismaService.sysTenant.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          tenantId: '100001',
          companyName: '测试公司',
          contactUserName: '张三',
          contactPhone: '13800138000',
          packageId: 1,
          accountCount: 20,
          status: TenantStatus.NORMAL,
          delFlag: '0',
          remark: '测试备注',
        }),
      });
    });

    it('应该使用默认的 accountCount', async () => {
      mockPrismaService.sysTenant.findFirst.mockResolvedValue(null);
      mockPrismaService.sysTenant.create.mockResolvedValue({ tenantId: '100001' });

      await service.createTenant({ companyName: '测试公司' });

      expect(mockPrismaService.sysTenant.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          accountCount: 10,
        }),
      });
    });
  });

  describe('initializeTenant', () => {
    const initData: TenantInitData = {
      adminUserName: 'admin',
      adminPassword: 'hashedPassword',
      adminNickName: '管理员',
    };

    it('应该成功初始化租户', async () => {
      mockPrismaService.sysDept.create.mockResolvedValue({ deptId: 1 });
      mockPrismaService.sysRole.create.mockResolvedValue({ roleId: 1 });
      mockPrismaService.sysUser.create.mockResolvedValue({ userId: 1 });
      mockPrismaService.sysUserRole.create.mockResolvedValue({});

      await service.initializeTenant('100001', initData);

      expect(mockPrismaService.sysDept.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          tenantId: '100001',
          deptName: '总部',
          parentId: 0,
        }),
      });

      expect(mockPrismaService.sysRole.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          tenantId: '100001',
          roleName: '管理员',
          roleKey: 'admin',
        }),
      });

      expect(mockPrismaService.sysUser.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          tenantId: '100001',
          userName: 'admin',
          nickName: '管理员',
        }),
      });

      expect(mockPrismaService.sysUserRole.create).toHaveBeenCalledWith({
        data: {
          userId: 1,
          roleId: 1,
        },
      });
    });

    it('应该使用用户名作为默认昵称', async () => {
      mockPrismaService.sysDept.create.mockResolvedValue({ deptId: 1 });
      mockPrismaService.sysRole.create.mockResolvedValue({ roleId: 1 });
      mockPrismaService.sysUser.create.mockResolvedValue({ userId: 1 });
      mockPrismaService.sysUserRole.create.mockResolvedValue({});

      await service.initializeTenant('100001', {
        adminUserName: 'admin',
        adminPassword: 'hashedPassword',
      });

      expect(mockPrismaService.sysUser.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          nickName: 'admin',
        }),
      });
    });
  });

  describe('updateStatus', () => {
    it('应该成功更新租户状态', async () => {
      mockPrismaService.sysTenant.findUnique.mockResolvedValue({
        tenantId: '100001',
        status: TenantStatus.NORMAL,
      });
      mockPrismaService.sysTenant.update.mockResolvedValue({});

      await service.updateStatus('100001', TenantStatus.DISABLED);

      expect(mockPrismaService.sysTenant.update).toHaveBeenCalledWith({
        where: { tenantId: '100001' },
        data: { status: TenantStatus.DISABLED },
      });
    });

    it('应该在租户不存在时抛出异常', async () => {
      mockPrismaService.sysTenant.findUnique.mockResolvedValue(null);

      await expect(service.updateStatus('999999', TenantStatus.DISABLED)).rejects.toThrow(BusinessException);
    });
  });

  describe('isTenantAvailable', () => {
    it('应该返回 true 当租户正常时', async () => {
      mockPrismaService.sysTenant.findUnique.mockResolvedValue({
        status: TenantStatus.NORMAL,
        delFlag: '0',
        expireTime: new Date(Date.now() + 86400000), // 明天
      });

      const result = await service.isTenantAvailable('100001');

      expect(result).toBe(true);
    });

    it('应该返回 false 当租户不存在时', async () => {
      mockPrismaService.sysTenant.findUnique.mockResolvedValue(null);

      const result = await service.isTenantAvailable('999999');

      expect(result).toBe(false);
    });

    it('应该返回 false 当租户已删除时', async () => {
      mockPrismaService.sysTenant.findUnique.mockResolvedValue({
        status: TenantStatus.NORMAL,
        delFlag: '2',
        expireTime: null,
      });

      const result = await service.isTenantAvailable('100001');

      expect(result).toBe(false);
    });

    it('应该返回 false 当租户已禁用时', async () => {
      mockPrismaService.sysTenant.findUnique.mockResolvedValue({
        status: TenantStatus.DISABLED,
        delFlag: '0',
        expireTime: null,
      });

      const result = await service.isTenantAvailable('100001');

      expect(result).toBe(false);
    });

    it('应该返回 false 当租户已过期时', async () => {
      mockPrismaService.sysTenant.findUnique.mockResolvedValue({
        status: TenantStatus.NORMAL,
        delFlag: '0',
        expireTime: new Date(Date.now() - 86400000), // 昨天
      });

      const result = await service.isTenantAvailable('100001');

      expect(result).toBe(false);
    });

    it('应该返回 true 当没有过期时间时', async () => {
      mockPrismaService.sysTenant.findUnique.mockResolvedValue({
        status: TenantStatus.NORMAL,
        delFlag: '0',
        expireTime: null,
      });

      const result = await service.isTenantAvailable('100001');

      expect(result).toBe(true);
    });
  });

  describe('checkTenantCanLogin', () => {
    it('应该在租户正常时不抛出异常', async () => {
      mockPrismaService.sysTenant.findUnique.mockResolvedValue({
        tenantId: '100001',
        companyName: '测试公司',
        status: TenantStatus.NORMAL,
        delFlag: '0',
        expireTime: new Date(Date.now() + 86400000),
      });

      await expect(service.checkTenantCanLogin('100001')).resolves.not.toThrow();
    });

    it('应该在租户不存在时抛出异常', async () => {
      mockPrismaService.sysTenant.findUnique.mockResolvedValue(null);

      await expect(service.checkTenantCanLogin('999999')).rejects.toThrow(BusinessException);
    });

    it('应该在租户已删除时抛出异常', async () => {
      mockPrismaService.sysTenant.findUnique.mockResolvedValue({
        tenantId: '100001',
        companyName: '测试公司',
        status: TenantStatus.NORMAL,
        delFlag: '2',
        expireTime: null,
      });

      await expect(service.checkTenantCanLogin('100001')).rejects.toThrow(BusinessException);
    });

    it('应该在租户已禁用时抛出异常', async () => {
      mockPrismaService.sysTenant.findUnique.mockResolvedValue({
        tenantId: '100001',
        companyName: '测试公司',
        status: TenantStatus.DISABLED,
        delFlag: '0',
        expireTime: null,
      });

      await expect(service.checkTenantCanLogin('100001')).rejects.toThrow(BusinessException);
    });

    it('应该在租户状态为过期时抛出异常', async () => {
      mockPrismaService.sysTenant.findUnique.mockResolvedValue({
        tenantId: '100001',
        companyName: '测试公司',
        status: TenantStatus.EXPIRED,
        delFlag: '0',
        expireTime: null,
      });

      await expect(service.checkTenantCanLogin('100001')).rejects.toThrow(BusinessException);
    });

    it('应该在租户过期时间已过时自动更新状态并抛出异常', async () => {
      mockPrismaService.sysTenant.findUnique.mockResolvedValue({
        tenantId: '100001',
        companyName: '测试公司',
        status: TenantStatus.NORMAL,
        delFlag: '0',
        expireTime: new Date(Date.now() - 86400000), // 昨天
      });
      mockPrismaService.sysTenant.update.mockResolvedValue({});

      await expect(service.checkTenantCanLogin('100001')).rejects.toThrow(BusinessException);
      expect(mockPrismaService.sysTenant.update).toHaveBeenCalledWith({
        where: { tenantId: '100001' },
        data: { status: TenantStatus.EXPIRED },
      });
    });
  });

  describe('deleteTenant', () => {
    it('应该成功软删除租户', async () => {
      mockPrismaService.sysTenant.update.mockResolvedValue({});

      await service.deleteTenant('100001');

      expect(mockPrismaService.sysTenant.update).toHaveBeenCalledWith({
        where: { tenantId: '100001' },
        data: { delFlag: '2' },
      });
    });
  });

  describe('getTenantInfo', () => {
    it('应该返回租户信息', async () => {
      const tenantInfo = {
        tenantId: '100001',
        companyName: '测试公司',
        status: TenantStatus.NORMAL,
      };
      mockPrismaService.sysTenant.findUnique.mockResolvedValue(tenantInfo);

      const result = await service.getTenantInfo('100001');

      expect(result).toEqual(tenantInfo);
    });

    it('应该在租户不存在时返回 null', async () => {
      mockPrismaService.sysTenant.findUnique.mockResolvedValue(null);

      const result = await service.getTenantInfo('999999');

      expect(result).toBeNull();
    });
  });
});
