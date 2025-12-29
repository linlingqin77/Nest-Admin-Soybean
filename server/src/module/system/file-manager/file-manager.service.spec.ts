import { Test, TestingModule } from '@nestjs/testing';
import { FileManagerService } from './file-manager.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { FileAccessService } from './services/file-access.service';
import { VersionService } from '../../upload/services/version.service';
import { AppConfigService } from 'src/config/app-config.service';
import { TenantContext } from 'src/common/tenant/tenant.context';
import { DelFlagEnum, StatusEnum } from 'src/common/enum';
import { ResponseCode } from 'src/common/response';

describe('FileManagerService', () => {
  let service: FileManagerService;
  let prisma: PrismaService;
  let fileAccessService: FileAccessService;
  let versionService: VersionService;
  let config: AppConfigService;

  const mockPrismaService = {
    sysFileFolder: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      count: jest.fn(),
    },
    sysUpload: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    sysFileShare: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    sysTenant: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    $transaction: jest.fn((fn) => {
      if (Array.isArray(fn)) return Promise.all(fn);
      return fn(mockPrismaService);
    }),
  };

  const mockFileAccessService = {
    generateAccessToken: jest.fn(),
    verifyAccessToken: jest.fn(),
  };

  const mockVersionService = {
    deletePhysicalFile: jest.fn(),
    checkAndCleanOldVersions: jest.fn(),
  };

  const mockConfigService = {
    app: {
      file: {
        location: 'upload',
        serveRoot: '/files',
      },
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FileManagerService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: FileAccessService,
          useValue: mockFileAccessService,
        },
        {
          provide: VersionService,
          useValue: mockVersionService,
        },
        {
          provide: AppConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<FileManagerService>(FileManagerService);
    prisma = module.get<PrismaService>(PrismaService);
    fileAccessService = module.get<FileAccessService>(FileAccessService);
    versionService = module.get<VersionService>(VersionService);
    config = module.get<AppConfigService>(AppConfigService);

    jest.spyOn(TenantContext, 'getTenantId').mockReturnValue('000000');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createFolder', () => {
    it('should create a folder successfully', async () => {
      const createDto = {
        parentId: 0,
        folderName: '测试文件夹',
        orderNum: 0,
        remark: '测试',
      };
      const mockFolder = {
        folderId: 1,
        tenantId: '000000',
        parentId: 0,
        folderName: '测试文件夹',
        folderPath: '/',
        orderNum: 0,
        remark: '测试',
        createBy: 'admin',
        updateBy: 'admin',
      };

      mockPrismaService.sysFileFolder.findFirst.mockResolvedValue(null);
      mockPrismaService.sysFileFolder.create.mockResolvedValue(mockFolder);

      const result = await service.createFolder(createDto, 'admin');

      expect(result.code).toBe(200);
      expect(result.data).toEqual(mockFolder);
      expect(prisma.sysFileFolder.findFirst).toHaveBeenCalled();
      expect(prisma.sysFileFolder.create).toHaveBeenCalled();
    });

    it('should throw error if folder name exists', async () => {
      const createDto = {
        parentId: 0,
        folderName: '测试文件夹',
      };

      mockPrismaService.sysFileFolder.findFirst.mockResolvedValue({ folderId: 1 });

      await expect(service.createFolder(createDto, 'admin')).rejects.toThrow();
    });
  });

  describe('updateFolder', () => {
    it('should update folder successfully', async () => {
      const updateDto = {
        folderId: 1,
        folderName: '更新文件夹',
        orderNum: 1,
      };
      const mockFolder = {
        folderId: 1,
        tenantId: '000000',
        parentId: 0,
        folderName: '测试文件夹',
        delFlag: DelFlagEnum.NORMAL,
      };
      const mockUpdated = { ...mockFolder, folderName: '更新文件夹' };

      mockPrismaService.sysFileFolder.findUnique.mockResolvedValue(mockFolder);
      mockPrismaService.sysFileFolder.findFirst.mockResolvedValue(null);
      mockPrismaService.sysFileFolder.update.mockResolvedValue(mockUpdated);

      const result = await service.updateFolder(updateDto, 'admin');

      expect(result.code).toBe(200);
      expect(result.data.folderName).toBe('更新文件夹');
    });
  });

  describe('deleteFolder', () => {
    it('should delete folder successfully', async () => {
      const mockFolder = {
        folderId: 1,
        tenantId: '000000',
        delFlag: DelFlagEnum.NORMAL,
      };

      mockPrismaService.sysFileFolder.findUnique.mockResolvedValue(mockFolder);
      mockPrismaService.sysFileFolder.count.mockResolvedValue(0);
      mockPrismaService.sysUpload.count.mockResolvedValue(0);
      mockPrismaService.sysFileFolder.update.mockResolvedValue(mockFolder);

      const result = await service.deleteFolder(1, 'admin');

      expect(result.code).toBe(200);
      expect(prisma.sysFileFolder.update).toHaveBeenCalled();
    });

    it('should throw error if folder has children', async () => {
      const mockFolder = {
        folderId: 1,
        tenantId: '000000',
        delFlag: DelFlagEnum.NORMAL,
      };

      mockPrismaService.sysFileFolder.findUnique.mockResolvedValue(mockFolder);
      mockPrismaService.sysFileFolder.count.mockResolvedValue(1);

      await expect(service.deleteFolder(1, 'admin')).rejects.toThrow();
    });
  });

  describe('listFolders', () => {
    it('should return folder list', async () => {
      const query = { parentId: 0 };
      const mockFolders = [
        { folderId: 1, folderName: '文件夹1' },
        { folderId: 2, folderName: '文件夹2' },
      ];

      mockPrismaService.sysFileFolder.findMany.mockResolvedValue(mockFolders);

      const result = await service.listFolders(query);

      expect(result.code).toBe(200);
      expect(result.data).toEqual(mockFolders);
    });
  });

  describe('getFolderTree', () => {
    it('should return folder tree', async () => {
      const mockFolders = [
        { folderId: 1, parentId: 0, folderName: '根文件夹' },
        { folderId: 2, parentId: 1, folderName: '子文件夹' },
      ];

      mockPrismaService.sysFileFolder.findMany.mockResolvedValue(mockFolders);

      const result = await service.getFolderTree();

      expect(result.code).toBe(200);
      expect(Array.isArray(result.data)).toBe(true);
    });
  });

  describe('listFiles', () => {
    it('should return file list', async () => {
      const query = { folderId: 0, pageNum: 1, pageSize: 10 };
      const mockFiles = [
        { uploadId: '1', fileName: '文件1.txt' },
        { uploadId: '2', fileName: '文件2.txt' },
      ];

      mockPrismaService.sysUpload.findMany.mockResolvedValue(mockFiles);
      mockPrismaService.sysUpload.count.mockResolvedValue(2);

      const result = await service.listFiles(query);

      expect(result.code).toBe(200);
      expect(result.data.rows).toEqual(mockFiles);
      expect(result.data.total).toBe(2);
    });
  });

  describe('moveFiles', () => {
    it('should move files successfully', async () => {
      const moveDto = {
        uploadIds: ['1', '2'],
        targetFolderId: 1,
      };
      const mockFolder = {
        folderId: 1,
        tenantId: '000000',
        delFlag: DelFlagEnum.NORMAL,
      };

      mockPrismaService.sysFileFolder.findUnique.mockResolvedValue(mockFolder);
      mockPrismaService.sysUpload.updateMany.mockResolvedValue({ count: 2 });

      const result = await service.moveFiles(moveDto, 'admin');

      expect(result.code).toBe(200);
      expect(prisma.sysUpload.updateMany).toHaveBeenCalled();
    });
  });

  describe('renameFile', () => {
    it('should rename file successfully', async () => {
      const renameDto = {
        uploadId: '1',
        newFileName: '新文件名.txt',
      };
      const mockFile = {
        uploadId: '1',
        tenantId: '000000',
        fileName: '旧文件名.txt',
      };
      const mockUpdated = { ...mockFile, fileName: '新文件名.txt' };

      mockPrismaService.sysUpload.findUnique.mockResolvedValue(mockFile);
      mockPrismaService.sysUpload.update.mockResolvedValue(mockUpdated);

      const result = await service.renameFile(renameDto, 'admin');

      expect(result.code).toBe(200);
      expect(result.data.fileName).toBe('新文件名.txt');
    });
  });

  describe('deleteFiles', () => {
    it('should delete files successfully', async () => {
      const uploadIds = ['1', '2'];
      const mockFile = {
        uploadId: '1',
        size: 1024 * 1024,
        delFlag: DelFlagEnum.NORMAL,
        fileName: 'test.txt',
      };

      mockPrismaService.sysUpload.findUnique.mockResolvedValue(mockFile);
      mockPrismaService.sysUpload.update.mockResolvedValue(mockFile);
      mockPrismaService.sysTenant.update.mockResolvedValue({});

      const result = await service.deleteFiles(uploadIds, 'admin');

      expect(result.code).toBe(200);
    });
  });

  describe('getFileDetail', () => {
    it('should return file detail', async () => {
      const mockFile = {
        uploadId: '1',
        tenantId: '000000',
        fileName: 'test.txt',
        delFlag: DelFlagEnum.NORMAL,
      };

      mockPrismaService.sysUpload.findUnique.mockResolvedValue(mockFile);

      const result = await service.getFileDetail('1');

      expect(result.code).toBe(200);
      expect(result.data).toEqual(mockFile);
    });
  });

  describe('createShare', () => {
    it('should create share link successfully', async () => {
      const createDto = {
        uploadId: '1',
        shareCode: '1234',
        expireHours: 24,
        maxDownload: 10,
      };
      const mockFile = {
        uploadId: '1',
        tenantId: '000000',
        delFlag: DelFlagEnum.NORMAL,
      };
      const mockShare = {
        shareId: 'share-1',
        tenantId: '000000',
        uploadId: '1',
        shareCode: '1234',
        expireTime: new Date(),
      };

      mockPrismaService.sysUpload.findUnique.mockResolvedValue(mockFile);
      mockPrismaService.sysFileShare.create.mockResolvedValue(mockShare);

      const result = await service.createShare(createDto, 'admin');

      expect(result.code).toBe(200);
      expect(result.data.shareId).toBe('share-1');
    });
  });

  describe('getShare', () => {
    it('should return share info', async () => {
      const getDto = {
        shareId: 'share-1',
        shareCode: '1234',
      };
      const mockShare = {
        shareId: 'share-1',
        uploadId: '1',
        shareCode: '1234',
        status: StatusEnum.NORMAL,
        expireTime: new Date(Date.now() + 86400000),
        maxDownload: 10,
        downloadCount: 0,
      };
      const mockFile = {
        uploadId: '1',
        fileName: 'test.txt',
        delFlag: DelFlagEnum.NORMAL,
      };

      mockPrismaService.sysFileShare.findUnique.mockResolvedValue(mockShare);
      mockPrismaService.sysUpload.findUnique.mockResolvedValue(mockFile);

      const result = await service.getShare(getDto);

      expect(result.code).toBe(200);
      expect(result.data.shareInfo).toEqual(mockShare);
      expect(result.data.fileInfo).toEqual(mockFile);
    });
  });

  describe('downloadShare', () => {
    it('should increment download count', async () => {
      mockPrismaService.sysFileShare.update.mockResolvedValue({});

      const result = await service.downloadShare('share-1');

      expect(result.code).toBe(200);
      expect(prisma.sysFileShare.update).toHaveBeenCalled();
    });
  });

  describe('cancelShare', () => {
    it('should cancel share successfully', async () => {
      const mockShare = {
        shareId: 'share-1',
        tenantId: '000000',
      };

      mockPrismaService.sysFileShare.findUnique.mockResolvedValue(mockShare);
      mockPrismaService.sysFileShare.update.mockResolvedValue({});

      const result = await service.cancelShare('share-1', 'admin');

      expect(result.code).toBe(200);
    });
  });

  describe('myShares', () => {
    it('should return user shares', async () => {
      const mockShares = [
        { shareId: 'share-1', upload: { fileName: 'file1.txt' } },
        { shareId: 'share-2', upload: { fileName: 'file2.txt' } },
      ];

      mockPrismaService.sysFileShare.findMany.mockResolvedValue(mockShares);

      const result = await service.myShares('admin');

      expect(result.code).toBe(200);
      expect(result.data).toEqual(mockShares);
    });
  });

  describe('getRecycleList', () => {
    it('should return recycle bin files', async () => {
      const query = { pageNum: 1, pageSize: 10 };
      const mockFiles = [
        { uploadId: '1', fileName: 'deleted1.txt' },
        { uploadId: '2', fileName: 'deleted2.txt' },
      ];

      mockPrismaService.sysUpload.findMany.mockResolvedValue(mockFiles);
      mockPrismaService.sysUpload.count.mockResolvedValue(2);

      const result = await service.getRecycleList(query);

      expect(result.code).toBe(200);
      expect(result.data.rows).toEqual(mockFiles);
      expect(result.data.total).toBe(2);
    });
  });

  describe('restoreFiles', () => {
    it('should restore files from recycle bin', async () => {
      const uploadIds = ['1'];
      const mockFile = {
        uploadId: '1',
        tenantId: '000000',
        size: 1024 * 1024,
        delFlag: DelFlagEnum.DELETED,
        fileName: 'test.txt',
      };

      mockPrismaService.sysUpload.findUnique.mockResolvedValue(mockFile);
      mockPrismaService.sysUpload.update.mockResolvedValue(mockFile);
      mockPrismaService.sysTenant.update.mockResolvedValue({});

      const result = await service.restoreFiles(uploadIds, 'admin');

      expect(result.code).toBe(200);
    });
  });

  describe('clearRecycle', () => {
    it('should permanently delete files', async () => {
      const uploadIds = ['1'];
      const mockFile = {
        uploadId: '1',
        tenantId: '000000',
        delFlag: DelFlagEnum.DELETED,
        fileName: 'test.txt',
      };

      mockPrismaService.sysUpload.findUnique.mockResolvedValue(mockFile);
      mockVersionService.deletePhysicalFile.mockResolvedValue(undefined);
      mockPrismaService.sysUpload.delete.mockResolvedValue(mockFile);

      const result = await service.clearRecycle(uploadIds, 'admin');

      expect(result.code).toBe(200);
      expect(versionService.deletePhysicalFile).toHaveBeenCalled();
    });
  });

  describe('getFileVersions', () => {
    it('should return file version history', async () => {
      const mockFile = {
        uploadId: '1',
        tenantId: '000000',
        version: 2,
        parentFileId: null,
      };
      const mockVersions = [
        { uploadId: '1', version: 1, isLatest: false },
        { uploadId: '2', version: 2, isLatest: true },
      ];

      mockPrismaService.sysUpload.findUnique.mockResolvedValue(mockFile);
      mockPrismaService.sysUpload.findMany.mockResolvedValue(mockVersions);

      const result = await service.getFileVersions('1');

      expect(result.code).toBe(200);
      expect(result.data.currentVersion).toBe(2);
      expect(result.data.versions).toEqual(mockVersions);
    });
  });

  describe('getAccessToken', () => {
    it('should generate access token', async () => {
      const mockFile = {
        uploadId: '1',
        tenantId: '000000',
        delFlag: DelFlagEnum.NORMAL,
      };

      mockPrismaService.sysUpload.findUnique.mockResolvedValue(mockFile);
      mockFileAccessService.generateAccessToken.mockReturnValue('token-123');

      const result = await service.getAccessToken('1');

      expect(result.code).toBe(200);
      expect(result.data.token).toBe('token-123');
      expect(result.data.expiresIn).toBe(1800);
    });
  });

  describe('getStorageStats', () => {
    it('should return storage statistics', async () => {
      const mockTenant = {
        storageQuota: 1000,
        storageUsed: 500,
        companyName: '测试公司',
      };

      mockPrismaService.sysTenant.findUnique.mockResolvedValue(mockTenant);

      const result = await service.getStorageStats();

      expect(result.code).toBe(200);
      expect(result.data.used).toBe(500);
      expect(result.data.quota).toBe(1000);
      expect(result.data.percentage).toBe(50);
      expect(result.data.remaining).toBe(500);
    });
  });
});
