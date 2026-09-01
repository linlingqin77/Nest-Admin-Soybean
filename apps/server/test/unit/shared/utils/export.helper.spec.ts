import { ExportHelper, ExportConfigFactory } from '@/shared/utils/export.helper';

describe('ExportHelper', () => {
  describe('createStatusDict', () => {
    it('should return status dictionary', () => {
      const dict = ExportHelper.createStatusDict();
      expect(dict).toEqual({
        '0': '正常',
        '1': '停用',
      });
    });
  });

  describe('createYesNoDict', () => {
    it('should return yes/no dictionary', () => {
      const dict = ExportHelper.createYesNoDict();
      expect(dict).toEqual({
        Y: '是',
        N: '否',
      });
    });
  });

  describe('createDelFlagDict', () => {
    it('should return delete flag dictionary', () => {
      const dict = ExportHelper.createDelFlagDict();
      expect(dict).toEqual({
        '0': '正常',
        '1': '已删除',
      });
    });
  });

  describe('createSexDict', () => {
    it('should return sex dictionary', () => {
      const dict = ExportHelper.createSexDict();
      expect(dict).toEqual({
        '0': '男',
        '1': '女',
        '2': '未知',
      });
    });
  });
});

describe('ExportConfigFactory', () => {
  describe('createUserExportConfig', () => {
    it('should return user export platform/config', () => {
      const mockConfig = ExportConfigFactory.createUserExportConfig();
      expect(mockConfig.sheetName).toBe('用户数据');
      expect(mockConfig.columns).toHaveLength(8);
      expect(mockConfig.columns[0].dataIndex).toBe('userId');
      expect(mockConfig.dictMap?.status).toBeDefined();
    });
  });

  describe('createRoleExportConfig', () => {
    it('should return role export platform/config', () => {
      const mockConfig = ExportConfigFactory.createRoleExportConfig();
      expect(mockConfig.sheetName).toBe('角色数据');
      expect(mockConfig.columns).toHaveLength(6);
      expect(mockConfig.columns[0].dataIndex).toBe('roleId');
    });
  });

  describe('createTenantExportConfig', () => {
    it('should return tenant export platform/config', () => {
      const mockConfig = ExportConfigFactory.createTenantExportConfig();
      expect(mockConfig.sheetName).toBe('租户数据');
      expect(mockConfig.columns).toHaveLength(11);
      expect(mockConfig.columns[0].dataIndex).toBe('tenantId');
    });
  });

  describe('createConfigExportConfig', () => {
    it('should return platform/config export platform/config', () => {
      const mockConfig = ExportConfigFactory.createConfigExportConfig();
      expect(mockConfig.sheetName).toBe('参数管理');
      expect(mockConfig.columns).toHaveLength(5);
      expect(mockConfig.dictMap?.configType).toBeDefined();
    });
  });

  describe('createDictTypeExportConfig', () => {
    it('should return dict type export platform/config', () => {
      const mockConfig = ExportConfigFactory.createDictTypeExportConfig();
      expect(mockConfig.sheetName).toBe('字典数据');
      expect(mockConfig.columns).toHaveLength(4);
    });
  });

  describe('createPostExportConfig', () => {
    it('should return post export platform/config', () => {
      const mockConfig = ExportConfigFactory.createPostExportConfig();
      expect(mockConfig.sheetName).toBe('岗位数据');
      expect(mockConfig.columns).toHaveLength(5);
    });
  });
});
