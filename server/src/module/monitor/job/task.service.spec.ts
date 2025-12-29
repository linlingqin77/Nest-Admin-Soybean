import { Test, TestingModule } from '@nestjs/testing';
import { TaskService } from './task.service';
import { ModuleRef } from '@nestjs/core';
import { JobLogService } from './job-log.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { NoticeService } from 'src/module/system/notice/notice.service';
import { VersionService } from 'src/module/upload/services/version.service';
import { createPrismaMock } from 'src/test-utils/prisma-mock';
import { BusinessException } from 'src/common/exceptions';
import { Status } from '@prisma/client';

describe('TaskService', () => {
  let service: TaskService;
  let moduleRef: jest.Mocked<ModuleRef>;
  let jobLogService: jest.Mocked<JobLogService>;
  let prisma: ReturnType<typeof createPrismaMock>;
  let noticeService: jest.Mocked<NoticeService>;
  let versionService: jest.Mocked<VersionService>;

  beforeEach(async () => {
    prisma = createPrismaMock();

    const mockModuleRef = {
      get: jest.fn(),
    };

    const mockJobLogService = {
      addJobLog: jest.fn().mockResolvedValue(undefined),
    };

    const mockNoticeService = {
      create: jest.fn().mockResolvedValue(undefined),
    };

    const mockVersionService = {
      deletePhysicalFile: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TaskService,
        {
          provide: ModuleRef,
          useValue: mockModuleRef,
        },
        {
          provide: JobLogService,
          useValue: mockJobLogService,
        },
        {
          provide: PrismaService,
          useValue: prisma,
        },
        {
          provide: NoticeService,
          useValue: mockNoticeService,
        },
        {
          provide: VersionService,
          useValue: mockVersionService,
        },
      ],
    }).compile();

    service = module.get<TaskService>(TaskService);
    moduleRef = module.get(ModuleRef);
    jobLogService = module.get(JobLogService);
    prisma = module.get(PrismaService);
    noticeService = module.get(NoticeService);
    versionService = module.get(VersionService);

    // 手动注册测试任务到 taskMap
    const taskMap = (service as any).taskMap;
    taskMap.set('task.noParams', service.ryNoParams.bind(service));
    taskMap.set('task.params', service.ryParams.bind(service));
    taskMap.set('task.clearTemp', service.clearTemp.bind(service));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getTasks', () => {
    it('should return list of registered tasks', () => {
      const tasks = service.getTasks();

      expect(Array.isArray(tasks)).toBe(true);
      expect(tasks).toContain('task.noParams');
      expect(tasks).toContain('task.params');
      expect(tasks).toContain('task.clearTemp');
    });
  });

  describe('executeTask', () => {
    it('should execute task without parameters', async () => {
      const result = await service.executeTask('task.noParams', 'testJob', 'DEFAULT');

      expect(result).toBe(true);
      expect(jobLogService.addJobLog).toHaveBeenCalled();
    });

    it('should execute task with parameters', async () => {
      const result = await service.executeTask('task.params("test", 123, true)', 'testJob', 'DEFAULT');

      expect(result).toBe(true);
      expect(jobLogService.addJobLog).toHaveBeenCalled();
    });

    it('should handle task execution failure', async () => {
      const result = await service.executeTask('nonexistent.task', 'testJob', 'DEFAULT');

      expect(result).toBe(false);
      expect(jobLogService.addJobLog).toHaveBeenCalledWith(
        expect.objectContaining({
          status: Status.DISABLED,
          jobMessage: expect.stringContaining('执行失败'),
        }),
      );
    });

    it('should return false for invalid invoke target format', async () => {
      const result = await service.executeTask('', 'testJob', 'DEFAULT');
      expect(result).toBe(false);
    });

    it('should record execution time in log', async () => {
      await service.executeTask('task.noParams', 'testJob', 'DEFAULT');

      expect(jobLogService.addJobLog).toHaveBeenCalledWith(
        expect.objectContaining({
          jobMessage: expect.stringContaining('耗时'),
        }),
      );
    });
  });

  describe('ryNoParams', () => {
    it('should execute without parameters', async () => {
      await expect(service.ryNoParams()).resolves.not.toThrow();
    });
  });

  describe('ryParams', () => {
    it('should execute with parameters', async () => {
      await expect(service.ryParams('test', 123, true)).resolves.not.toThrow();
    });
  });

  describe('clearTemp', () => {
    it('should execute clear temp task', async () => {
      await expect(service.clearTemp()).resolves.not.toThrow();
    });
  });

  describe('monitorSystem', () => {
    it('should execute monitor system task', async () => {
      await expect(service.monitorSystem()).resolves.not.toThrow();
    });
  });

  describe('backupDatabase', () => {
    it('should execute backup database task', async () => {
      await expect(service.backupDatabase()).resolves.not.toThrow();
    });
  });

  describe('storageQuotaAlert', () => {
    it('should check storage quota and send alerts', async () => {
      const mockTenants = [
        {
          tenantId: '000001',
          companyName: 'Test Company',
          storageQuota: 1000,
          storageUsed: 850,
          contactUserName: 'admin',
        },
      ];

      (prisma.sysTenant.findMany as jest.Mock).mockResolvedValue(mockTenants as any);

      await service.storageQuotaAlert();

      expect(prisma.sysTenant.findMany).toHaveBeenCalled();
      expect(noticeService.create).toHaveBeenCalled();
    });

    it('should not send alert when usage is below threshold', async () => {
      const mockTenants = [
        {
          tenantId: '000001',
          companyName: 'Test Company',
          storageQuota: 1000,
          storageUsed: 500,
          contactUserName: 'admin',
        },
      ];

      (prisma.sysTenant.findMany as jest.Mock).mockResolvedValue(mockTenants as any);

      await service.storageQuotaAlert();

      expect(noticeService.create).not.toHaveBeenCalled();
    });

    it('should handle empty tenant list', async () => {
      (prisma.sysTenant.findMany as jest.Mock).mockResolvedValue([]);

      await expect(service.storageQuotaAlert()).resolves.not.toThrow();
    });
  });

  describe('cleanOldFileVersions', () => {
    it('should clean old file versions when enabled', async () => {
      (prisma.sysConfig.findFirst as jest.Mock)
        .mockResolvedValueOnce({ configValue: 'true' } as any)
        .mockResolvedValueOnce({ configValue: '5' } as any);

      (prisma.sysUpload.groupBy as jest.Mock).mockResolvedValue([
        { parentFileId: 1, _count: { uploadId: 10 } },
      ] as any);

      (prisma.sysUpload.findMany as jest.Mock).mockResolvedValue([
        { uploadId: 1, version: 10, fileName: 'test.txt' },
        { uploadId: 2, version: 9, fileName: 'test.txt' },
        { uploadId: 3, version: 8, fileName: 'test.txt' },
        { uploadId: 4, version: 7, fileName: 'test.txt' },
        { uploadId: 5, version: 6, fileName: 'test.txt' },
        { uploadId: 6, version: 5, fileName: 'test.txt' },
      ] as any);

      (prisma.sysUpload.delete as jest.Mock).mockResolvedValue({} as any);

      await service.cleanOldFileVersions();

      expect(prisma.sysUpload.delete).toHaveBeenCalled();
      expect(versionService.deletePhysicalFile).toHaveBeenCalled();
    });

    it('should skip when auto clean is disabled', async () => {
      (prisma.sysConfig.findFirst as jest.Mock).mockResolvedValue({ configValue: 'false' } as any);

      await service.cleanOldFileVersions();

      expect(prisma.sysUpload.groupBy).not.toHaveBeenCalled();
    });

    it('should handle no files to clean', async () => {
      (prisma.sysConfig.findFirst as jest.Mock)
        .mockResolvedValueOnce({ configValue: 'true' } as any)
        .mockResolvedValueOnce({ configValue: '5' } as any);

      (prisma.sysUpload.groupBy as jest.Mock).mockResolvedValue([]);

      await expect(service.cleanOldFileVersions()).resolves.not.toThrow();
    });
  });
});
