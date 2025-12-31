import { Test, TestingModule } from '@nestjs/testing';
import { FileManagerService } from './file-manager.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { AppConfigService } from 'src/config/app-config.service';
import { FileAccessService } from './services/file-access.service';
import { VersionService } from '../../upload/services/version.service';
import { createConfigMock, ConfigMock } from 'src/test-utils/config-mock';
import { TenantContext } from 'src/common/tenant/tenant.context';
import { BusinessException } from 'src/common/exceptions';

// 创建简单的 Prisma Mock
const createSimplePrismaMock = () => ({
  sysFileFolder: {
    findFirst: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
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
  $transaction: jest.fn().mockImplementation(async (arg) => {
    if (typeof arg === 'function') {
      return arg({});
    }
    return arg;
  }),
});

// Mock TenantContext
jest.mock('src/common/tenant/tenant.context', () => ({
  TenantContext: {
    getTenantId: jest.fn().mockReturnValue('000001'),
  },
}));

// Mock GenerateUUID
jest.mock('src/common/utils', () => ({
  GenerateUUID: jest.fn().mockReturnValue('test-uuid-123'),
}));

describe('FileManagerService', () => {
  let service: FileManagerService;
  let prismaMock: ReturnType<typeof createSimplePrismaMock>;
  let configMock: ConfigMock;
  let fileAccessServiceMock: jest.Mocked<FileAccessService>;
  let versionServiceMock: jest.Mocked<VersionService>;

  const mockTenantId = '000001';

  beforeEach(async () => {
    prismaMock = createSimplePrismaMock();
    configMock = createConfigMock();

    fileAccessServiceMock = {
      generateAccessToken: jest.fn().mockReturnValue('test-token'),
      verifyAccessToken: jest.fn().mockReturnValue({ fileId: 'file-1', tenantId: mockTenantId }),
    } as any;

    versionServiceMock = {
      deletePhysicalFile: jest.fn().mockResolvedValue(undefined),
      checkAndCleanOldVersions: jest.fn().mockResolvedValue(undefined),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FileManagerService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: AppConfigService, useValue: configMock },
        { provide: FileAccessService, useValue: fileAccessServiceMock },
        { provide: VersionService, useValue: versionServiceMock },
      ],
    }).compile();

    service = module.get<FileManagerService>(FileManagerService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createFolder', () => {
    it('should create folder in root', async () => {
      prismaMock.sysFileFolder.findFirst.mockResolvedValue(null);
      prismaMock.sysFileFolder.create.mockResolvedValue({
        folderId: 1,
        folderName: 'test-folder',
        folderPath: '/',
        parentId: 0,
        tenantId: mockTenantId,
      } as any);

      const result = await service.createFolder(
        { folderName: 'test-folder', parentId: 0 },
        'admin',
      );

      expect(result.code).toBe(200);
      expect(prismaMock.sysFileFolder.create).toHaveBeenCalled();
    });

    it('should create folder with parent', async () => {
      prismaMock.sysFileFolder.findFirst.mockResolvedValue(null);
      prismaMock.sysFileFolder.findUnique.mockResolvedValue({
        folderId: 1,
        folderName: 'parent',
        folderPath: '/',
        delFlag: '0',
      } as any);
      prismaMock.sysFileFolder.create.mockResolvedValue({
        folderId: 2,
        folderName: 'child',
        folderPath: '/parent/',
        parentId: 1,
      } as any);

      const result = await service.createFolder(
        { folderName: 'child', parentId: 1 },
        'admin',
      );

      expect(result.code).toBe(200);
    });

    it('should throw error when folder name exists', async () => {
      prismaMock.sysFileFolder.findFirst.mockResolvedValue({ folderId: 1 } as any);

      await expect(
        service.createFolder({ folderName: 'existing', parentId: 0 }, 'admin'),
      ).rejects.toThrow(BusinessException);
    });

    it('should throw error when parent folder not found', async () => {
      prismaMock.sysFileFolder.findFirst.mockResolvedValue(null);
      prismaMock.sysFileFolder.findUnique.mockResolvedValue(null);

      await expect(
        service.createFolder({ folderName: 'child', parentId: 999 }, 'admin'),
      ).rejects.toThrow(BusinessException);
    });
  });

  describe('updateFolder', () => {
    it('should update folder successfully', async () => {
      prismaMock.sysFileFolder.findUnique.mockResolvedValue({
        folderId: 1,
        folderName: 'old-name',
        tenantId: mockTenantId,
        parentId: 0,
      } as any);
      prismaMock.sysFileFolder.findFirst.mockResolvedValue(null);
      prismaMock.sysFileFolder.update.mockResolvedValue({
        folderId: 1,
        folderName: 'new-name',
      } as any);

      const result = await service.updateFolder(
        { folderId: 1, folderName: 'new-name' },
        'admin',
      );

      expect(result.code).toBe(200);
    });

    it('should return error when folder not found', async () => {
      prismaMock.sysFileFolder.findUnique.mockResolvedValue(null);

      const result = await service.updateFolder({ folderId: 999 }, 'admin');

      expect(result.code).toBe(500);
    });

    it('should throw error when new name already exists', async () => {
      prismaMock.sysFileFolder.findUnique.mockResolvedValue({
        folderId: 1,
        folderName: 'old-name',
        tenantId: mockTenantId,
        parentId: 0,
      } as any);
      prismaMock.sysFileFolder.findFirst.mockResolvedValue({ folderId: 2 } as any);

      await expect(
        service.updateFolder({ folderId: 1, folderName: 'existing' }, 'admin'),
      ).rejects.toThrow(BusinessException);
    });
  });

  describe('deleteFolder', () => {
    it('should delete folder successfully', async () => {
      prismaMock.sysFileFolder.findUnique.mockResolvedValue({
        folderId: 1,
        tenantId: mockTenantId,
      } as any);
      prismaMock.sysFileFolder.count.mockResolvedValue(0);
      prismaMock.sysUpload.count.mockResolvedValue(0);
      prismaMock.sysFileFolder.update.mockResolvedValue({} as any);

      const result = await service.deleteFolder(1, 'admin');

      expect(result.code).toBe(200);
    });

    it('should return error when folder not found', async () => {
      prismaMock.sysFileFolder.findUnique.mockResolvedValue(null);

      const result = await service.deleteFolder(999, 'admin');

      expect(result.code).toBe(500);
    });

    it('should throw error when folder has children', async () => {
      prismaMock.sysFileFolder.findUnique.mockResolvedValue({
        folderId: 1,
        tenantId: mockTenantId,
      } as any);
      prismaMock.sysFileFolder.count.mockResolvedValue(1);

      await expect(service.deleteFolder(1, 'admin')).rejects.toThrow(BusinessException);
    });

    it('should throw error when folder has files', async () => {
      prismaMock.sysFileFolder.findUnique.mockResolvedValue({
        folderId: 1,
        tenantId: mockTenantId,
      } as any);
      prismaMock.sysFileFolder.count.mockResolvedValue(0);
      prismaMock.sysUpload.count.mockResolvedValue(1);
      prismaMock.sysUpload.findMany.mockResolvedValue([]);

      await expect(service.deleteFolder(1, 'admin')).rejects.toThrow(BusinessException);
    });
  });

  describe('listFolders', () => {
    it('should list folders', async () => {
      prismaMock.sysFileFolder.findMany.mockResolvedValue([
        { folderId: 1, folderName: 'folder1' },
        { folderId: 2, folderName: 'folder2' },
      ] as any);

      const result = await service.listFolders({});

      expect(result.code).toBe(200);
      expect(result.data).toHaveLength(2);
    });

    it('should filter by parentId', async () => {
      prismaMock.sysFileFolder.findMany.mockResolvedValue([]);

      await service.listFolders({ parentId: 1 });

      expect(prismaMock.sysFileFolder.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ parentId: 1 }),
        }),
      );
    });

    it('should filter by folderName', async () => {
      prismaMock.sysFileFolder.findMany.mockResolvedValue([]);

      await service.listFolders({ folderName: 'test' });

      expect(prismaMock.sysFileFolder.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            folderName: { contains: 'test' },
          }),
        }),
      );
    });
  });

  describe('getFolderTree', () => {
    it('should return folder tree', async () => {
      prismaMock.sysFileFolder.findMany.mockResolvedValue([
        { folderId: 1, folderName: 'root', parentId: 0 },
        { folderId: 2, folderName: 'child', parentId: 1 },
      ] as any);

      const result = await service.getFolderTree();

      expect(result.code).toBe(200);
      expect(result.data).toHaveLength(1);
      expect(result.data[0].children).toHaveLength(1);
    });
  });

  describe('listFiles', () => {
    it('should list files with pagination', async () => {
      prismaMock.sysUpload.findMany.mockResolvedValue([{ uploadId: '1' }] as any);
      prismaMock.sysUpload.count.mockResolvedValue(1);
      prismaMock.$transaction.mockResolvedValue([
        [{ uploadId: '1' }],
        1,
      ]);

      const result = await service.listFiles({ pageNum: 1, pageSize: 10 });

      expect(result.code).toBe(200);
    });

    it('should filter by folderId', async () => {
      prismaMock.$transaction.mockResolvedValue([[], 0]);

      await service.listFiles({ folderId: 1 });

      expect(prismaMock.$transaction).toHaveBeenCalled();
    });

    it('should filter by extension', async () => {
      prismaMock.$transaction.mockResolvedValue([[], 0]);

      await service.listFiles({ ext: 'pdf' });

      expect(prismaMock.$transaction).toHaveBeenCalled();
    });

    it('should filter by multiple extensions', async () => {
      prismaMock.$transaction.mockResolvedValue([[], 0]);

      await service.listFiles({ exts: 'jpg,png,gif' });

      expect(prismaMock.$transaction).toHaveBeenCalled();
    });
  });

  describe('moveFiles', () => {
    it('should move files to target folder', async () => {
      prismaMock.sysFileFolder.findUnique.mockResolvedValue({
        folderId: 2,
        tenantId: mockTenantId,
        delFlag: '0',
      } as any);
      prismaMock.sysUpload.updateMany.mockResolvedValue({ count: 1 });

      const result = await service.moveFiles(
        { uploadIds: ['file-1'], targetFolderId: 2 },
        'admin',
      );

      expect(result.code).toBe(200);
    });

    it('should move files to root folder', async () => {
      prismaMock.sysUpload.updateMany.mockResolvedValue({ count: 1 });

      const result = await service.moveFiles(
        { uploadIds: ['file-1'], targetFolderId: 0 },
        'admin',
      );

      expect(result.code).toBe(200);
    });

    it('should return error when target folder not found', async () => {
      prismaMock.sysFileFolder.findUnique.mockResolvedValue(null);

      const result = await service.moveFiles(
        { uploadIds: ['file-1'], targetFolderId: 999 },
        'admin',
      );

      expect(result.code).toBe(500);
    });
  });

  describe('renameFile', () => {
    it('should rename file successfully', async () => {
      prismaMock.sysUpload.findUnique.mockResolvedValue({
        uploadId: 'file-1',
        tenantId: mockTenantId,
      } as any);
      prismaMock.sysUpload.update.mockResolvedValue({
        uploadId: 'file-1',
        fileName: 'new-name.txt',
      } as any);

      const result = await service.renameFile(
        { uploadId: 'file-1', newFileName: 'new-name.txt' },
        'admin',
      );

      expect(result.code).toBe(200);
    });

    it('should return error when file not found', async () => {
      prismaMock.sysUpload.findUnique.mockResolvedValue(null);

      const result = await service.renameFile(
        { uploadId: 'not-exist', newFileName: 'new.txt' },
        'admin',
      );

      expect(result.code).toBe(500);
    });
  });

  describe('deleteFiles', () => {
    it('should delete files and update storage', async () => {
      prismaMock.sysUpload.findUnique.mockResolvedValue({
        uploadId: 'file-1',
        size: 1024 * 1024 * 5, // 5MB
        delFlag: '0',
        fileName: 'test.txt',
      } as any);
      prismaMock.sysUpload.update.mockResolvedValue({} as any);
      prismaMock.sysTenant.update.mockResolvedValue({} as any);

      const result = await service.deleteFiles(['file-1'], 'admin');

      expect(result.code).toBe(200);
      expect(prismaMock.sysTenant.update).toHaveBeenCalled();
    });

    it('should skip already deleted files', async () => {
      prismaMock.sysUpload.findUnique.mockResolvedValue({
        uploadId: 'file-1',
        delFlag: '1',
      } as any);

      const result = await service.deleteFiles(['file-1'], 'admin');

      expect(result.code).toBe(200);
      expect(prismaMock.sysUpload.update).not.toHaveBeenCalled();
    });
  });

  describe('getFileDetail', () => {
    it('should return file detail', async () => {
      prismaMock.sysUpload.findUnique.mockResolvedValue({
        uploadId: 'file-1',
        tenantId: mockTenantId,
        delFlag: '0',
        fileName: 'test.txt',
      } as any);

      const result = await service.getFileDetail('file-1');

      expect(result.code).toBe(200);
    });

    it('should return error when file not found', async () => {
      prismaMock.sysUpload.findUnique.mockResolvedValue(null);

      const result = await service.getFileDetail('not-exist');

      expect(result.code).toBe(500);
    });
  });

  describe('createShare', () => {
    it('should create share link', async () => {
      prismaMock.sysUpload.findUnique.mockResolvedValue({
        uploadId: 'file-1',
        tenantId: mockTenantId,
        delFlag: '0',
      } as any);
      prismaMock.sysFileShare.create.mockResolvedValue({
        shareId: 'share-1',
        shareCode: '1234',
        expireTime: null,
      } as any);

      const result = await service.createShare(
        { uploadId: 'file-1', shareCode: '1234' },
        'admin',
      );

      expect(result.code).toBe(200);
      expect(result.data.shareId).toBe('share-1');
    });

    it('should create share with expiration', async () => {
      prismaMock.sysUpload.findUnique.mockResolvedValue({
        uploadId: 'file-1',
        tenantId: mockTenantId,
        delFlag: '0',
      } as any);
      prismaMock.sysFileShare.create.mockResolvedValue({
        shareId: 'share-1',
        expireTime: new Date(),
      } as any);

      const result = await service.createShare(
        { uploadId: 'file-1', expireHours: 24 },
        'admin',
      );

      expect(result.code).toBe(200);
    });
  });

  describe('getShare', () => {
    it('should return share info', async () => {
      prismaMock.sysFileShare.findUnique.mockResolvedValue({
        shareId: 'share-1',
        uploadId: 'file-1',
        status: '0',
        shareCode: null,
        expireTime: null,
        maxDownload: -1,
        downloadCount: 0,
      } as any);
      prismaMock.sysUpload.findUnique.mockResolvedValue({
        uploadId: 'file-1',
        delFlag: '0',
      } as any);

      const result = await service.getShare({ shareId: 'share-1' });

      expect(result.code).toBe(200);
    });

    it('should return error for invalid share code', async () => {
      prismaMock.sysFileShare.findUnique.mockResolvedValue({
        shareId: 'share-1',
        status: '0',
        shareCode: '1234',
      } as any);

      const result = await service.getShare({ shareId: 'share-1', shareCode: 'wrong' });

      expect(result.code).toBe(500);
    });

    it('should return error for expired share', async () => {
      prismaMock.sysFileShare.findUnique.mockResolvedValue({
        shareId: 'share-1',
        status: '0',
        shareCode: null,
        expireTime: new Date('2020-01-01'),
      } as any);

      const result = await service.getShare({ shareId: 'share-1' });

      expect(result.code).toBe(500);
    });

    it('should return error when download limit reached', async () => {
      prismaMock.sysFileShare.findUnique.mockResolvedValue({
        shareId: 'share-1',
        status: '0',
        shareCode: null,
        expireTime: null,
        maxDownload: 5,
        downloadCount: 5,
      } as any);

      const result = await service.getShare({ shareId: 'share-1' });

      expect(result.code).toBe(500);
    });
  });

  describe('downloadShare', () => {
    it('should increment download count', async () => {
      prismaMock.sysFileShare.update.mockResolvedValue({} as any);

      const result = await service.downloadShare('share-1');

      expect(result.code).toBe(200);
      expect(prismaMock.sysFileShare.update).toHaveBeenCalledWith({
        where: { shareId: 'share-1' },
        data: { downloadCount: { increment: 1 } },
      });
    });
  });

  describe('cancelShare', () => {
    it('should cancel share', async () => {
      prismaMock.sysFileShare.findUnique.mockResolvedValue({
        shareId: 'share-1',
        tenantId: mockTenantId,
      } as any);
      prismaMock.sysFileShare.update.mockResolvedValue({} as any);

      const result = await service.cancelShare('share-1', 'admin');

      expect(result.code).toBe(200);
    });

    it('should return error when share not found', async () => {
      prismaMock.sysFileShare.findUnique.mockResolvedValue(null);

      const result = await service.cancelShare('not-exist', 'admin');

      expect(result.code).toBe(500);
    });
  });

  describe('myShares', () => {
    it('should return user shares', async () => {
      prismaMock.sysFileShare.findMany.mockResolvedValue([
        { shareId: 'share-1' },
        { shareId: 'share-2' },
      ] as any);

      const result = await service.myShares('admin');

      expect(result.code).toBe(200);
      expect(result.data).toHaveLength(2);
    });
  });

  describe('getRecycleList', () => {
    it('should return deleted files', async () => {
      prismaMock.sysUpload.findMany.mockResolvedValue([{ uploadId: '1' }] as any);
      prismaMock.sysUpload.count.mockResolvedValue(1);

      const result = await service.getRecycleList({ pageNum: 1, pageSize: 10 });

      expect(result.code).toBe(200);
    });
  });

  describe('restoreFiles', () => {
    it('should restore files from recycle bin', async () => {
      prismaMock.sysUpload.findUnique.mockResolvedValue({
        uploadId: 'file-1',
        tenantId: mockTenantId,
        delFlag: '1',
        size: 1024 * 1024,
        fileName: 'test.txt',
      } as any);
      prismaMock.sysUpload.update.mockResolvedValue({} as any);
      prismaMock.sysTenant.update.mockResolvedValue({} as any);

      const result = await service.restoreFiles(['file-1'], 'admin');

      expect(result.code).toBe(200);
    });

    it('should skip non-deleted files', async () => {
      prismaMock.sysUpload.findUnique.mockResolvedValue({
        uploadId: 'file-1',
        tenantId: mockTenantId,
        delFlag: '0',
      } as any);

      const result = await service.restoreFiles(['file-1'], 'admin');

      expect(result.code).toBe(200);
      expect(prismaMock.sysUpload.update).not.toHaveBeenCalled();
    });
  });

  describe('clearRecycle', () => {
    it('should permanently delete files', async () => {
      prismaMock.sysUpload.findUnique.mockResolvedValue({
        uploadId: 'file-1',
        tenantId: mockTenantId,
        delFlag: '1',
        fileName: 'test.txt',
      } as any);
      prismaMock.sysUpload.delete.mockResolvedValue({} as any);

      const result = await service.clearRecycle(['file-1'], 'admin');

      expect(result.code).toBe(200);
      expect(versionServiceMock.deletePhysicalFile).toHaveBeenCalled();
    });
  });

  describe('getFileVersions', () => {
    it('should return file versions', async () => {
      prismaMock.sysUpload.findUnique.mockResolvedValue({
        uploadId: 'file-1',
        tenantId: mockTenantId,
        parentFileId: null,
        version: 1,
      } as any);
      prismaMock.sysUpload.findMany.mockResolvedValue([
        { uploadId: 'file-1', version: 1 },
      ] as any);

      const result = await service.getFileVersions('file-1');

      expect(result.code).toBe(200);
    });

    it('should return error when file not found', async () => {
      prismaMock.sysUpload.findUnique.mockResolvedValue(null);

      const result = await service.getFileVersions('not-exist');

      expect(result.code).toBe(500);
    });
  });

  describe('restoreVersion', () => {
    it('should restore to target version', async () => {
      prismaMock.sysUpload.findUnique.mockResolvedValue({
        uploadId: 'v1',
        tenantId: mockTenantId,
        delFlag: '0',
        parentFileId: null,
        version: 1,
        size: 1024,
      } as any);
      prismaMock.sysUpload.findFirst.mockResolvedValue({
        uploadId: 'v2',
        version: 2,
        isLatest: true,
        folderId: 1,
      } as any);
      prismaMock.$transaction.mockResolvedValue([{}, {}]);
      prismaMock.sysTenant.update.mockResolvedValue({} as any);

      const result = await service.restoreVersion('file-1', 'v1', 'admin');

      expect(result.code).toBe(200);
    });

    it('should throw error when target version not found', async () => {
      prismaMock.sysUpload.findUnique.mockResolvedValue(null);

      await expect(
        service.restoreVersion('file-1', 'not-exist', 'admin'),
      ).rejects.toThrow(BusinessException);
    });
  });

  describe('getAccessToken', () => {
    it('should generate access token', async () => {
      prismaMock.sysUpload.findUnique.mockResolvedValue({
        uploadId: 'file-1',
        tenantId: mockTenantId,
        delFlag: '0',
      } as any);

      const result = await service.getAccessToken('file-1');

      expect(result.code).toBe(200);
      expect(result.data.token).toBe('test-token');
    });

    it('should return error when file not found', async () => {
      prismaMock.sysUpload.findUnique.mockResolvedValue(null);

      const result = await service.getAccessToken('not-exist');

      expect(result.code).toBe(500);
    });
  });

  describe('getStorageStats', () => {
    it('should return storage statistics', async () => {
      prismaMock.sysTenant.findUnique.mockResolvedValue({
        storageQuota: 1000,
        storageUsed: 500,
        companyName: 'Test Company',
      } as any);

      const result = await service.getStorageStats();

      expect(result.code).toBe(200);
      expect(result.data.percentage).toBe(50);
    });

    it('should handle zero quota', async () => {
      prismaMock.sysTenant.findUnique.mockResolvedValue({
        storageQuota: 0,
        storageUsed: 0,
        companyName: 'Test',
      } as any);

      const result = await service.getStorageStats();

      expect(result.code).toBe(200);
      expect(result.data.percentage).toBe(0);
    });

    it('should return error when tenant not found', async () => {
      prismaMock.sysTenant.findUnique.mockResolvedValue(null);

      const result = await service.getStorageStats();

      expect(result.code).toBe(500);
    });
  });
});
