import { Response } from 'express';
import { ExportTable } from './export';

/**
 * 导出列配置
 */
export interface ExportColumn {
  /** 列标题 */
  title: string;
  /** 数据字段名 */
  dataIndex: string;
  /** 列宽度 */
  width?: number;
}

/**
 * 导出配置
 */
export interface ExportConfig<T> {
  /** 工作表名称 */
  sheetName: string;
  /** 列配置 */
  columns: ExportColumn[];
  /** 字典映射（用于状态等字段的转换） */
  dictMap?: Record<string, Record<string, string>>;
  /** 数据转换函数 */
  transform?: (item: T) => Record<string, unknown>;
}

/**
 * 导出辅助类
 *
 * @description 提供通用的数据导出逻辑，减少 Service 层的重复代码
 * 支持 Excel 导出，自动处理字典映射和数据转换
 *
 * @example
 * ```typescript
 * // 定义导出配置
 * const exportConfig: ExportConfig<SysUser> = {
 *   sheetName: '用户数据',
 *   columns: [
 *     { title: '用户ID', dataIndex: 'userId' },
 *     { title: '用户名', dataIndex: 'userName', width: 15 },
 *     { title: '状态', dataIndex: 'status' },
 *   ],
 *   dictMap: {
 *     status: { '0': '正常', '1': '停用' },
 *   },
 * };
 *
 * // 执行导出
 * await ExportHelper.export(res, data, exportConfig);
 * ```
 */
export class ExportHelper {
  /**
   * 导出数据为 Excel 文件
   * @param res Express Response 对象
   * @param data 要导出的数据
   * @param config 导出配置
   */
  static async export<T extends Record<string, unknown>>(res: Response, data: T[], config: ExportConfig<T>): Promise<void> {
    // 转换数据
    const transformedData = config.transform ? data.map(config.transform) : data;

    // 构建导出选项
    const options = {
      sheetName: config.sheetName,
      data: transformedData as Record<string, unknown>[],
      header: config.columns.map((col) => ({
        title: col.title,
        dataIndex: col.dataIndex,
        width: col.width,
      })),
      dictMap: config.dictMap,
    };

    await ExportTable(options, res);
  }

  /**
   * 创建常用的状态字典映射
   */
  static createStatusDict(): Record<string, string> {
    return {
      '0': '正常',
      '1': '停用',
    };
  }

  /**
   * 创建是否字典映射
   */
  static createYesNoDict(): Record<string, string> {
    return {
      Y: '是',
      N: '否',
    };
  }

  /**
   * 创建删除标志字典映射
   */
  static createDelFlagDict(): Record<string, string> {
    return {
      '0': '正常',
      '1': '已删除',
    };
  }

  /**
   * 创建性别字典映射
   */
  static createSexDict(): Record<string, string> {
    return {
      '0': '男',
      '1': '女',
      '2': '未知',
    };
  }
}

/**
 * 预定义的导出配置工厂
 *
 * @description 提供常用模块的导出配置，减少重复定义
 */
export class ExportConfigFactory {
  /**
   * 创建用户导出配置
   */
  static createUserExportConfig(): ExportConfig<Record<string, unknown>> {
    return {
      sheetName: '用户数据',
      columns: [
        { title: '用户编号', dataIndex: 'userId' },
        { title: '登录名称', dataIndex: 'userName', width: 15 },
        { title: '用户昵称', dataIndex: 'nickName', width: 15 },
        { title: '部门', dataIndex: 'deptName', width: 15 },
        { title: '手机号码', dataIndex: 'phonenumber', width: 15 },
        { title: '邮箱', dataIndex: 'email', width: 20 },
        { title: '状态', dataIndex: 'status' },
        { title: '创建时间', dataIndex: 'createTime', width: 20 },
      ],
      dictMap: {
        status: ExportHelper.createStatusDict(),
      },
    };
  }

  /**
   * 创建角色导出配置
   */
  static createRoleExportConfig(): ExportConfig<Record<string, unknown>> {
    return {
      sheetName: '角色数据',
      columns: [
        { title: '角色编号', dataIndex: 'roleId' },
        { title: '角色名称', dataIndex: 'roleName', width: 15 },
        { title: '权限字符', dataIndex: 'roleKey' },
        { title: '显示顺序', dataIndex: 'roleSort' },
        { title: '状态', dataIndex: 'status' },
        { title: '创建时间', dataIndex: 'createTime', width: 15 },
      ],
      dictMap: {
        status: ExportHelper.createStatusDict(),
      },
    };
  }

  /**
   * 创建租户导出配置
   */
  static createTenantExportConfig(): ExportConfig<Record<string, unknown>> {
    return {
      sheetName: '租户数据',
      columns: [
        { title: '租户编号', dataIndex: 'tenantId' },
        { title: '企业名称', dataIndex: 'companyName' },
        { title: '联系人', dataIndex: 'contactUserName' },
        { title: '联系电话', dataIndex: 'contactPhone' },
        { title: '统一社会信用代码', dataIndex: 'licenseNumber' },
        { title: '地址', dataIndex: 'address' },
        { title: '套餐名称', dataIndex: 'packageName' },
        { title: '过期时间', dataIndex: 'expireTime' },
        { title: '账号数量', dataIndex: 'accountCount' },
        { title: '状态', dataIndex: 'status' },
        { title: '创建时间', dataIndex: 'createTime' },
      ],
      dictMap: {
        status: ExportHelper.createStatusDict(),
      },
    };
  }

  /**
   * 创建配置参数导出配置
   */
  static createConfigExportConfig(): ExportConfig<Record<string, unknown>> {
    return {
      sheetName: '参数管理',
      columns: [
        { title: '参数主键', dataIndex: 'configId' },
        { title: '参数名称', dataIndex: 'configName' },
        { title: '参数键名', dataIndex: 'configKey' },
        { title: '参数键值', dataIndex: 'configValue' },
        { title: '系统内置', dataIndex: 'configType' },
      ],
      dictMap: {
        configType: ExportHelper.createYesNoDict(),
      },
    };
  }

  /**
   * 创建字典类型导出配置
   */
  static createDictTypeExportConfig(): ExportConfig<Record<string, unknown>> {
    return {
      sheetName: '字典数据',
      columns: [
        { title: '字典主键', dataIndex: 'dictId' },
        { title: '字典名称', dataIndex: 'dictName' },
        { title: '字典类型', dataIndex: 'dictType' },
        { title: '状态', dataIndex: 'status' },
      ],
      dictMap: {
        status: ExportHelper.createStatusDict(),
      },
    };
  }

  /**
   * 创建岗位导出配置
   */
  static createPostExportConfig(): ExportConfig<Record<string, unknown>> {
    return {
      sheetName: '岗位数据',
      columns: [
        { title: '岗位序号', dataIndex: 'postId' },
        { title: '岗位编码', dataIndex: 'postCode' },
        { title: '岗位名称', dataIndex: 'postName' },
        { title: '岗位排序', dataIndex: 'postSort' },
        { title: '状态', dataIndex: 'status' },
      ],
      dictMap: {
        status: ExportHelper.createStatusDict(),
      },
    };
  }
}
