import { Test, TestingModule } from '@nestjs/testing';
import { Response } from 'express';
import {
  TenantExportService,
  ExportFormat,
  ExportDataType,
  TenantExportData,
} from './tenant-export.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { BusinessException } from 'src/common/exceptions';

describe('TenantExportService', () => {
  let service: TenantExportService;
  let prismaService: jest.Mocked<PrismaService>;

  const mockTenant = {
    id: 1,
    tenantId: '100001',
    companyName: 'Test Company',
    contactUserName: 'John Doe',
    contactPhone: '13800138000',
    status: '0',
    delFlag: '0',
    createTime: new Date(),
  };

  const mockUsers = [
    {
      userId: 1,
      tenantId: '100001',
      userName: 'admin',
      nickName: 'Administrator',
      email: 'admin@test.com',
      phonenumber: '13800138001',
      sex: '0',
      status: '0',
      password: 'hashedpassword',
      delFlag: '0',
      createTime: new Date(),
    },
  ];

  const mockRoles = [
    {
      roleId: 1,
      tenantId: '100001',
      roleName: 'Admin',
      roleKey: 'admin',
      roleSort: 1,
      status: '0',
      delFlag: '0',
      createTime: new Date(),
    },
  ];

  const mockDepts = [
    {
      deptId: 1,
      tenantId: '100001',
      deptName: 'IT Department',
      parentId: 0,
      orderNum: 1,
      leader: 'John',
      status: '0',
      delFlag: '0',
    },
  ];

  const mockPosts = [
    {
      postId: 1,
      tenantId: '100001',
      postCode: 'CEO',
      postName: 'Chief Executive Officer',
      postSort: 1,
      status: '0',
      delFlag: '0',
    },
  ];

  const mockMenus = [
    {
      menuId: 1,
      tenantId: '100001',
      menuName: 'Dashboard',
      parentId: 0,
      path: '/dashboard',
      component: 'Dashboard',
      perms: 'system:dashboard',
      status: '0',
      delFlag: '0',
    },
  ];

  const mockDictTypes = [
    {
      dictId: 1,
      tenantId: '100001',
      dictName: 'Status',
      dictType: 'sys_status',
      status: '0',
      delFlag: '0',
    },
  ];

  const mockDictData = [
    {
      dictCode: 1,
      tenantId: '100001',
      dictType: 'sys_status',
      dictLabel: 'Normal',
      dictValue: '0',
      dictSort: 1,
      status: '0',
      delFlag: '0',
    },
  ];

  const mockConfigs = [
    {
      configId: 1,
      tenantId: '100001',
      configName: 'Site Name',
      configKey: 'sys.site.name',
      configValue: 'Test Site',
      configType: 'Y',
      delFlag: '0',
    },
  ];

  const mockNotices = [
    {
      noticeId: 1,
      tenantId: '100001',
      noticeTitle: 'Welcome',
      noticeType: '1',
      status: '0',
      delFlag: '0',
      createTime: new Date(),
    },
  ];

  beforeEach(async () => {
    const mockPrismaService = {
      sysTenant: {
        findUnique: jest.fn(),
      },
      sysUser: {
        findMany: jest.fn(),
      },
      sysRole: {
        findMany: jest.fn(),
      },
      sysDept: {
        findMany: jest.fn(),
      },
      sysMenu: {
        findMany: jest.fn(),
      },
      sysPost: {
        findMany: jest.fn(),
      },
      sysDictType: {
        findMany: jest.fn(),
      },
      sysDictData: {
        findMany: jest.fn(),
      },
      sysConfig: {
        findMany: jest.fn(),
      },
      sysNotice: {
        findMany: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TenantExportService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<TenantExportService>(TenantExportService);
    prismaService = module.get(PrismaService);
  });

  describe('exportTenantData', () => {
    it('should throw error when tenantId is empty', async () => {
      await expect(
        service.exportTenantData('', {
          format: ExportFormat.JSON,
          dataTypes: [ExportDataType.USERS],
        }),
      ).rejects.toThrow(BusinessException);
    });

    it('should throw error when tenant does not exist', async () => {
      (prismaService.sysTenant.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(
        service.exportTenantData('999999', {
          format: ExportFormat.JSON,
          dataTypes: [ExportDataType.USERS],
        }),
      ).rejects.toThrow(BusinessException);
    });

    it('should export users data as JSON', async () => {
      (prismaService.sysTenant.findUnique as jest.Mock).mockResolvedValue(mockTenant);
      (prismaService.sysUser.findMany as jest.Mock).mockResolvedValue(mockUsers);

      const result = await service.exportTenantData('100001', {
        format: ExportFormat.JSON,
        dataTypes: [ExportDataType.USERS],
      });

      expect(result).toBeDefined();
      expect((result as TenantExportData).tenantId).toBe('100001');
      expect((result as TenantExportData).users).toHaveLength(1);
      // Password should be removed
      expect((result as TenantExportData).users![0]).not.toHaveProperty('password');
    });

    it('should export all data types when ALL is specified', async () => {
      (prismaService.sysTenant.findUnique as jest.Mock).mockResolvedValue(mockTenant);
      (prismaService.sysUser.findMany as jest.Mock).mockResolvedValue(mockUsers);
      (prismaService.sysRole.findMany as jest.Mock).mockResolvedValue(mockRoles);
      (prismaService.sysDept.findMany as jest.Mock).mockResolvedValue(mockDepts);
      (prismaService.sysMenu.findMany as jest.Mock).mockResolvedValue(mockMenus);
      (prismaService.sysPost.findMany as jest.Mock).mockResolvedValue(mockPosts);
      (prismaService.sysDictType.findMany as jest.Mock).mockResolvedValue(mockDictTypes);
      (prismaService.sysDictData.findMany as jest.Mock).mockResolvedValue(mockDictData);
      (prismaService.sysConfig.findMany as jest.Mock).mockResolvedValue(mockConfigs);
      (prismaService.sysNotice.findMany as jest.Mock).mockResolvedValue(mockNotices);

      const result = await service.exportTenantData('100001', {
        format: ExportFormat.JSON,
        dataTypes: [ExportDataType.ALL],
      });

      expect(result).toBeDefined();
      const data = result as TenantExportData;
      expect(data.users).toBeDefined();
      expect(data.roles).toBeDefined();
      expect(data.depts).toBeDefined();
      expect(data.menus).toBeDefined();
      expect(data.posts).toBeDefined();
      expect(data.dictTypes).toBeDefined();
      expect(data.dictData).toBeDefined();
      expect(data.configs).toBeDefined();
      expect(data.notices).toBeDefined();
    });

    it('should mask sensitive data when maskSensitiveData is true', async () => {
      (prismaService.sysTenant.findUnique as jest.Mock).mockResolvedValue(mockTenant);
      (prismaService.sysUser.findMany as jest.Mock).mockResolvedValue(mockUsers);

      const result = await service.exportTenantData('100001', {
        format: ExportFormat.JSON,
        dataTypes: [ExportDataType.USERS],
        maskSensitiveData: true,
      });

      const data = result as TenantExportData;
      expect(data.users![0].phonenumber).toBe('138****8001');
      expect(data.users![0].email).toBe('a**n@test.com');
    });

    it('should not mask sensitive data when maskSensitiveData is false', async () => {
      (prismaService.sysTenant.findUnique as jest.Mock).mockResolvedValue(mockTenant);
      (prismaService.sysUser.findMany as jest.Mock).mockResolvedValue(mockUsers);

      const result = await service.exportTenantData('100001', {
        format: ExportFormat.JSON,
        dataTypes: [ExportDataType.USERS],
        maskSensitiveData: false,
      });

      const data = result as TenantExportData;
      expect(data.users![0].phonenumber).toBe('13800138001');
      expect(data.users![0].email).toBe('admin@test.com');
    });

    it('should export to response when res is provided for JSON', async () => {
      (prismaService.sysTenant.findUnique as jest.Mock).mockResolvedValue(mockTenant);
      (prismaService.sysUser.findMany as jest.Mock).mockResolvedValue(mockUsers);

      const mockRes = {
        setHeader: jest.fn(),
        send: jest.fn(),
      } as unknown as Response;

      await service.exportTenantData(
        '100001',
        {
          format: ExportFormat.JSON,
          dataTypes: [ExportDataType.USERS],
        },
        mockRes,
      );

      expect(mockRes.setHeader).toHaveBeenCalledWith(
        'Content-Type',
        'application/json; charset=utf-8',
      );
      expect(mockRes.setHeader).toHaveBeenCalledWith(
        'Content-Disposition',
        expect.stringContaining('attachment; filename='),
      );
      expect(mockRes.send).toHaveBeenCalled();
    });

    it('should export to response when res is provided for CSV', async () => {
      (prismaService.sysTenant.findUnique as jest.Mock).mockResolvedValue(mockTenant);
      (prismaService.sysUser.findMany as jest.Mock).mockResolvedValue(mockUsers);

      const mockRes = {
        setHeader: jest.fn(),
        send: jest.fn(),
      } as unknown as Response;

      await service.exportTenantData(
        '100001',
        {
          format: ExportFormat.CSV,
          dataTypes: [ExportDataType.USERS],
        },
        mockRes,
      );

      expect(mockRes.setHeader).toHaveBeenCalledWith(
        'Content-Type',
        'text/csv; charset=utf-8',
      );
      expect(mockRes.setHeader).toHaveBeenCalledWith(
        'Content-Disposition',
        expect.stringContaining('.csv'),
      );
      expect(mockRes.send).toHaveBeenCalled();
    });
  });

  describe('exportSingleTypeAsJson', () => {
    it('should export single data type as JSON', async () => {
      (prismaService.sysTenant.findUnique as jest.Mock).mockResolvedValue(mockTenant);
      (prismaService.sysRole.findMany as jest.Mock).mockResolvedValue(mockRoles);

      const mockRes = {
        setHeader: jest.fn(),
        send: jest.fn(),
      } as unknown as Response;

      await service.exportSingleTypeAsJson('100001', ExportDataType.ROLES, mockRes);

      expect(mockRes.send).toHaveBeenCalled();
      const sentData = JSON.parse((mockRes.send as jest.Mock).mock.calls[0][0]);
      expect(sentData.roles).toBeDefined();
    });
  });

  describe('exportSingleTypeAsCsv', () => {
    it('should export single data type as CSV', async () => {
      (prismaService.sysTenant.findUnique as jest.Mock).mockResolvedValue(mockTenant);
      (prismaService.sysRole.findMany as jest.Mock).mockResolvedValue(mockRoles);

      const mockRes = {
        setHeader: jest.fn(),
        send: jest.fn(),
      } as unknown as Response;

      await service.exportSingleTypeAsCsv('100001', ExportDataType.ROLES, mockRes);

      expect(mockRes.send).toHaveBeenCalled();
      const csvContent = (mockRes.send as jest.Mock).mock.calls[0][0];
      // Should contain BOM and header
      expect(csvContent).toContain('\uFEFF');
      expect(csvContent).toContain('角色ID');
      expect(csvContent).toContain('角色名称');
    });
  });

  describe('exportAllAsJson', () => {
    it('should export all data as JSON', async () => {
      (prismaService.sysTenant.findUnique as jest.Mock).mockResolvedValue(mockTenant);
      (prismaService.sysUser.findMany as jest.Mock).mockResolvedValue(mockUsers);
      (prismaService.sysRole.findMany as jest.Mock).mockResolvedValue(mockRoles);
      (prismaService.sysDept.findMany as jest.Mock).mockResolvedValue(mockDepts);
      (prismaService.sysMenu.findMany as jest.Mock).mockResolvedValue(mockMenus);
      (prismaService.sysPost.findMany as jest.Mock).mockResolvedValue(mockPosts);
      (prismaService.sysDictType.findMany as jest.Mock).mockResolvedValue(mockDictTypes);
      (prismaService.sysDictData.findMany as jest.Mock).mockResolvedValue(mockDictData);
      (prismaService.sysConfig.findMany as jest.Mock).mockResolvedValue(mockConfigs);
      (prismaService.sysNotice.findMany as jest.Mock).mockResolvedValue(mockNotices);

      const mockRes = {
        setHeader: jest.fn(),
        send: jest.fn(),
      } as unknown as Response;

      await service.exportAllAsJson('100001', mockRes);

      expect(mockRes.send).toHaveBeenCalled();
      const sentData = JSON.parse((mockRes.send as jest.Mock).mock.calls[0][0]);
      expect(sentData.users).toBeDefined();
      expect(sentData.roles).toBeDefined();
    });
  });

  describe('getExportData', () => {
    it('should return export data without writing to response', async () => {
      (prismaService.sysTenant.findUnique as jest.Mock).mockResolvedValue(mockTenant);
      (prismaService.sysUser.findMany as jest.Mock).mockResolvedValue(mockUsers);

      const result = await service.getExportData('100001', {
        dataTypes: [ExportDataType.USERS],
      });

      expect(result).toBeDefined();
      expect(result.tenantId).toBe('100001');
      expect(result.users).toHaveLength(1);
    });

    it('should use default options when not provided', async () => {
      (prismaService.sysTenant.findUnique as jest.Mock).mockResolvedValue(mockTenant);
      (prismaService.sysUser.findMany as jest.Mock).mockResolvedValue(mockUsers);
      (prismaService.sysRole.findMany as jest.Mock).mockResolvedValue(mockRoles);
      (prismaService.sysDept.findMany as jest.Mock).mockResolvedValue(mockDepts);
      (prismaService.sysMenu.findMany as jest.Mock).mockResolvedValue(mockMenus);
      (prismaService.sysPost.findMany as jest.Mock).mockResolvedValue(mockPosts);
      (prismaService.sysDictType.findMany as jest.Mock).mockResolvedValue(mockDictTypes);
      (prismaService.sysDictData.findMany as jest.Mock).mockResolvedValue(mockDictData);
      (prismaService.sysConfig.findMany as jest.Mock).mockResolvedValue(mockConfigs);
      (prismaService.sysNotice.findMany as jest.Mock).mockResolvedValue(mockNotices);

      const result = await service.getExportData('100001');

      expect(result).toBeDefined();
      // Default should export all data types
      expect(result.users).toBeDefined();
      expect(result.roles).toBeDefined();
    });
  });

  describe('CSV formatting', () => {
    it('should properly escape CSV values with commas', async () => {
      const userWithComma = {
        ...mockUsers[0],
        nickName: 'John, Doe',
      };
      (prismaService.sysTenant.findUnique as jest.Mock).mockResolvedValue(mockTenant);
      (prismaService.sysUser.findMany as jest.Mock).mockResolvedValue([userWithComma]);

      const mockRes = {
        setHeader: jest.fn(),
        send: jest.fn(),
      } as unknown as Response;

      await service.exportSingleTypeAsCsv('100001', ExportDataType.USERS, mockRes);

      const csvContent = (mockRes.send as jest.Mock).mock.calls[0][0];
      expect(csvContent).toContain('"John, Doe"');
    });

    it('should properly escape CSV values with quotes', async () => {
      const userWithQuote = {
        ...mockUsers[0],
        nickName: 'John "The Admin" Doe',
      };
      (prismaService.sysTenant.findUnique as jest.Mock).mockResolvedValue(mockTenant);
      (prismaService.sysUser.findMany as jest.Mock).mockResolvedValue([userWithQuote]);

      const mockRes = {
        setHeader: jest.fn(),
        send: jest.fn(),
      } as unknown as Response;

      await service.exportSingleTypeAsCsv('100001', ExportDataType.USERS, mockRes);

      const csvContent = (mockRes.send as jest.Mock).mock.calls[0][0];
      expect(csvContent).toContain('"John ""The Admin"" Doe"');
    });
  });

  describe('data masking', () => {
    it('should mask phone numbers correctly', async () => {
      (prismaService.sysTenant.findUnique as jest.Mock).mockResolvedValue(mockTenant);
      (prismaService.sysUser.findMany as jest.Mock).mockResolvedValue([
        { ...mockUsers[0], phonenumber: '13912345678' },
      ]);

      const result = await service.getExportData('100001', {
        dataTypes: [ExportDataType.USERS],
        maskSensitiveData: true,
      });

      expect(result.users![0].phonenumber).toBe('139****5678');
    });

    it('should mask email addresses correctly', async () => {
      (prismaService.sysTenant.findUnique as jest.Mock).mockResolvedValue(mockTenant);
      (prismaService.sysUser.findMany as jest.Mock).mockResolvedValue([
        { ...mockUsers[0], email: 'longusername@example.com' },
      ]);

      const result = await service.getExportData('100001', {
        dataTypes: [ExportDataType.USERS],
        maskSensitiveData: true,
      });

      expect(result.users![0].email).toBe('l**e@example.com');
    });

    it('should handle short email local parts', async () => {
      (prismaService.sysTenant.findUnique as jest.Mock).mockResolvedValue(mockTenant);
      (prismaService.sysUser.findMany as jest.Mock).mockResolvedValue([
        { ...mockUsers[0], email: 'ab@example.com' },
      ]);

      const result = await service.getExportData('100001', {
        dataTypes: [ExportDataType.USERS],
        maskSensitiveData: true,
      });

      expect(result.users![0].email).toBe('**@example.com');
    });
  });
});
