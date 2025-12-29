import { Test, TestingModule } from '@nestjs/testing';
import { OperlogService } from 'src/module/monitor/operlog/operlog.service';
import { FileManagerController } from './file-manager.controller';
import { FileManagerService } from './file-manager.service';
import { Response } from 'express';

describe('FileManagerController', () => {
  let controller: FileManagerController;
  let service: FileManagerService;

  const mockFileManagerService = {
    createFolder: jest.fn(),
    updateFolder: jest.fn(),
    deleteFolder: jest.fn(),
    listFolders: jest.fn(),
    getFolderTree: jest.fn(),
    listFiles: jest.fn(),
    moveFiles: jest.fn(),
    renameFile: jest.fn(),
    deleteFiles: jest.fn(),
    getFileDetail: jest.fn(),
    createShare: jest.fn(),
    getShare: jest.fn(),
    downloadShare: jest.fn(),
    cancelShare: jest.fn(),
    myShares: jest.fn(),
    getRecycleList: jest.fn(),
    restoreFiles: jest.fn(),
    clearRecycle: jest.fn(),
    getFileVersions: jest.fn(),
    restoreVersion: jest.fn(),
    getAccessToken: jest.fn(),
    downloadFile: jest.fn(),
    batchDownload: jest.fn(),
    getStorageStats: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FileManagerController],
      providers: [
        {
          provide: FileManagerService,
          useValue: mockFileManagerService,
        },
        {
          provide: OperlogService,
          useValue: { create: jest.fn() },
        },
      ],
    }).compile();

    controller = module.get<FileManagerController>(FileManagerController);
    service = module.get<FileManagerService>(FileManagerService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createFolder', () => {
    it('should create a folder', async () => {
      const createDto = { folderName: '测试文件夹', parentId: 0 };
      const mockResult = { code: 200, data: { folderId: 1 } };
      mockFileManagerService.createFolder.mockResolvedValue(mockResult);

      const result = await controller.createFolder(createDto, 'admin');

      expect(result).toEqual(mockResult);
      expect(service.createFolder).toHaveBeenCalledWith(createDto, 'admin');
    });
  });

  describe('updateFolder', () => {
    it('should update a folder', async () => {
      const updateDto = { folderId: 1, folderName: '更新文件夹' };
      const mockResult = { code: 200, msg: '更新成功' };
      mockFileManagerService.updateFolder.mockResolvedValue(mockResult);

      const result = await controller.updateFolder(updateDto, 'admin');

      expect(result).toEqual(mockResult);
      expect(service.updateFolder).toHaveBeenCalledWith(updateDto, 'admin');
    });
  });

  describe('deleteFolder', () => {
    it('should delete a folder', async () => {
      const mockResult = { code: 200, msg: '删除成功' };
      mockFileManagerService.deleteFolder.mockResolvedValue(mockResult);

      const result = await controller.deleteFolder('1', 'admin');

      expect(result).toEqual(mockResult);
      expect(service.deleteFolder).toHaveBeenCalledWith(1, 'admin');
    });
  });

  describe('listFolders', () => {
    it('should return folder list', async () => {
      const query = { parentId: 0 };
      const mockResult = { code: 200, data: [] };
      mockFileManagerService.listFolders.mockResolvedValue(mockResult);

      const result = await controller.listFolders(query);

      expect(result).toEqual(mockResult);
      expect(service.listFolders).toHaveBeenCalledWith(query);
    });
  });

  describe('getFolderTree', () => {
    it('should return folder tree', async () => {
      const mockResult = { code: 200, data: [] };
      mockFileManagerService.getFolderTree.mockResolvedValue(mockResult);

      const result = await controller.getFolderTree();

      expect(result).toEqual(mockResult);
      expect(service.getFolderTree).toHaveBeenCalled();
    });
  });

  describe('listFiles', () => {
    it('should return file list', async () => {
      const query = { folderId: 0, pageNum: 1, pageSize: 10 };
      const mockResult = { code: 200, data: { rows: [], total: 0 } };
      mockFileManagerService.listFiles.mockResolvedValue(mockResult);

      const result = await controller.listFiles(query);

      expect(result).toEqual(mockResult);
      expect(service.listFiles).toHaveBeenCalledWith(query);
    });
  });

  describe('moveFiles', () => {
    it('should move files', async () => {
      const moveDto = { uploadIds: ['1', '2'], targetFolderId: 1 };
      const mockResult = { code: 200, msg: '移动成功' };
      mockFileManagerService.moveFiles.mockResolvedValue(mockResult);

      const result = await controller.moveFiles(moveDto, 'admin');

      expect(result).toEqual(mockResult);
      expect(service.moveFiles).toHaveBeenCalledWith(moveDto, 'admin');
    });
  });

  describe('renameFile', () => {
    it('should rename a file', async () => {
      const renameDto = { uploadId: '1', newFileName: '新文件名.txt' };
      const mockResult = { code: 200, msg: '重命名成功' };
      mockFileManagerService.renameFile.mockResolvedValue(mockResult);

      const result = await controller.renameFile(renameDto, 'admin');

      expect(result).toEqual(mockResult);
      expect(service.renameFile).toHaveBeenCalledWith(renameDto, 'admin');
    });
  });

  describe('deleteFiles', () => {
    it('should delete files', async () => {
      const uploadIds = ['1', '2'];
      const mockResult = { code: 200, msg: '删除成功' };
      mockFileManagerService.deleteFiles.mockResolvedValue(mockResult);

      const result = await controller.deleteFiles(uploadIds, 'admin');

      expect(result).toEqual(mockResult);
      expect(service.deleteFiles).toHaveBeenCalledWith(uploadIds, 'admin');
    });
  });

  describe('getFileDetail', () => {
    it('should return file detail', async () => {
      const mockResult = { code: 200, data: { uploadId: '1', fileName: 'test.txt' } };
      mockFileManagerService.getFileDetail.mockResolvedValue(mockResult);

      const result = await controller.getFileDetail('1');

      expect(result).toEqual(mockResult);
      expect(service.getFileDetail).toHaveBeenCalledWith('1');
    });
  });

  describe('createShare', () => {
    it('should create a share link', async () => {
      const createDto = { uploadId: '1', shareCode: '1234' };
      const mockResult = { code: 200, data: { shareId: 'share-1' } };
      mockFileManagerService.createShare.mockResolvedValue(mockResult);

      const result = await controller.createShare(createDto, 'admin');

      expect(result).toEqual(mockResult);
      expect(service.createShare).toHaveBeenCalledWith(createDto, 'admin');
    });
  });

  describe('getShare', () => {
    it('should return share info', async () => {
      const mockResult = { code: 200, data: { shareInfo: {}, fileInfo: {} } };
      mockFileManagerService.getShare.mockResolvedValue(mockResult);

      const result = await controller.getShare('share-1', '1234');

      expect(result).toEqual(mockResult);
      expect(service.getShare).toHaveBeenCalledWith({ shareId: 'share-1', shareCode: '1234' });
    });
  });

  describe('downloadShare', () => {
    it('should download shared file', async () => {
      const mockResult = { code: 200, msg: '下载成功' };
      mockFileManagerService.downloadShare.mockResolvedValue(mockResult);

      const result = await controller.downloadShare('share-1');

      expect(result).toEqual(mockResult);
      expect(service.downloadShare).toHaveBeenCalledWith('share-1');
    });
  });

  describe('cancelShare', () => {
    it('should cancel a share', async () => {
      const mockResult = { code: 200, msg: '取消成功' };
      mockFileManagerService.cancelShare.mockResolvedValue(mockResult);

      const result = await controller.cancelShare('share-1', 'admin');

      expect(result).toEqual(mockResult);
      expect(service.cancelShare).toHaveBeenCalledWith('share-1', 'admin');
    });
  });

  describe('myShares', () => {
    it('should return user shares', async () => {
      const mockResult = { code: 200, data: [] };
      mockFileManagerService.myShares.mockResolvedValue(mockResult);

      const result = await controller.myShares('admin');

      expect(result).toEqual(mockResult);
      expect(service.myShares).toHaveBeenCalledWith('admin');
    });
  });

  describe('getRecycleList', () => {
    it('should return recycle bin files', async () => {
      const query = { pageNum: 1, pageSize: 10 };
      const mockResult = { code: 200, data: { rows: [], total: 0 } };
      mockFileManagerService.getRecycleList.mockResolvedValue(mockResult);

      const result = await controller.getRecycleList(query);

      expect(result).toEqual(mockResult);
      expect(service.getRecycleList).toHaveBeenCalledWith(query);
    });
  });

  describe('restoreFiles', () => {
    it('should restore files from recycle bin', async () => {
      const uploadIds = ['1', '2'];
      const mockResult = { code: 200, msg: '恢复成功' };
      mockFileManagerService.restoreFiles.mockResolvedValue(mockResult);

      const result = await controller.restoreFiles(uploadIds, 'admin');

      expect(result).toEqual(mockResult);
      expect(service.restoreFiles).toHaveBeenCalledWith(uploadIds, 'admin');
    });
  });

  describe('clearRecycle', () => {
    it('should permanently delete files', async () => {
      const uploadIds = ['1', '2'];
      const mockResult = { code: 200, msg: '删除成功' };
      mockFileManagerService.clearRecycle.mockResolvedValue(mockResult);

      const result = await controller.clearRecycle(uploadIds, 'admin');

      expect(result).toEqual(mockResult);
      expect(service.clearRecycle).toHaveBeenCalledWith(uploadIds, 'admin');
    });
  });

  describe('getFileVersions', () => {
    it('should return file version history', async () => {
      const mockResult = { code: 200, data: { currentVersion: 1, versions: [] } };
      mockFileManagerService.getFileVersions.mockResolvedValue(mockResult);

      const result = await controller.getFileVersions('1');

      expect(result).toEqual(mockResult);
      expect(service.getFileVersions).toHaveBeenCalledWith('1');
    });
  });

  describe('restoreVersion', () => {
    it('should restore to a specific version', async () => {
      const mockResult = { code: 200, data: { newVersion: 2 } };
      mockFileManagerService.restoreVersion.mockResolvedValue(mockResult);

      const result = await controller.restoreVersion('1', 'version-1', 'admin');

      expect(result).toEqual(mockResult);
      expect(service.restoreVersion).toHaveBeenCalledWith('1', 'version-1', 'admin');
    });
  });

  describe('getAccessToken', () => {
    it('should return access token', async () => {
      const mockResult = { code: 200, data: { token: 'token-123', expiresIn: 1800 } };
      mockFileManagerService.getAccessToken.mockResolvedValue(mockResult);

      const result = await controller.getAccessToken('1');

      expect(result).toEqual(mockResult);
      expect(service.getAccessToken).toHaveBeenCalledWith('1');
    });
  });

  describe('downloadFile', () => {
    it('should download a file', async () => {
      const mockResponse = {} as Response;
      mockFileManagerService.downloadFile.mockResolvedValue(undefined);

      await controller.downloadFile('1', 'token-123', mockResponse);

      expect(service.downloadFile).toHaveBeenCalledWith('1', 'token-123', mockResponse);
    });
  });

  describe('batchDownload', () => {
    it('should batch download files', async () => {
      const uploadIds = ['1', '2'];
      const mockResponse = {} as Response;
      mockFileManagerService.batchDownload.mockResolvedValue(undefined);

      await controller.batchDownload(uploadIds, mockResponse);

      expect(service.batchDownload).toHaveBeenCalledWith(uploadIds, mockResponse);
    });
  });

  describe('getStorageStats', () => {
    it('should return storage statistics', async () => {
      const mockResult = {
        code: 200,
        data: { used: 500, quota: 1000, percentage: 50, remaining: 500 },
      };
      mockFileManagerService.getStorageStats.mockResolvedValue(mockResult);

      const result = await controller.getStorageStats();

      expect(result).toEqual(mockResult);
      expect(service.getStorageStats).toHaveBeenCalled();
    });
  });
});
