import { Injectable, Logger } from '@nestjs/common';
import { Response } from 'express';
import { PrismaService } from 'src/prisma/prisma.service';
import { BusinessException } from 'src/common/exceptions';
import { ResponseCode } from 'src/common/response';
import { DelFlagEnum } from 'src/common/enum';

/**
 * 导出格式枚举
 */
export enum ExportFormat {
  /** JSON 格式 */
  JSON = 'json',
  /** CSV 格式 */
  CSV = 'csv',
}

/**
 * 导出数据类型枚举
 */
export enum ExportDataType {
  /** 用户数据 */
  USERS = 'users',
  /** 角色数据 */
  ROLES = 'roles',
  /** 部门数据 */
  DEPTS = 'depts',
  /** 菜单数据 */
  MENUS = 'menus',
  /** 岗位数据 */
  POSTS = 'posts',
  /** 字典类型 */
  DICT_TYPES = 'dictTypes',
  /** 字典数据 */
  DICT_DATA = 'dictData',
  /** 配置数据 */
  CONFIGS = 'configs',
  /** 通知公告 */
  NOTICES = 'notices',
  /** 全部数据 */
  ALL = 'all',
}

/**
 * 导出选项接口
 */
export interface ExportOptions {
  /** 导出格式 */
  format: ExportFormat;
  /** 导出数据类型 */
  dataTypes: ExportDataType[];
  /** 是否包含已删除数据 */
  includeDeleted?: boolean;
  /** 是否脱敏敏感数据 */
  maskSensitiveData?: boolean;
}

/**
 * 租户导出数据接口
 */
export interface TenantExportData {
  /** 导出时间 */
  exportTime: string;
  /** 租户ID */
  tenantId: string;
  /** 租户信息 */
  tenantInfo?: Record<string, unknown>;
  /** 用户数据 */
  users?: Record<string, unknown>[];
  /** 角色数据 */
  roles?: Record<string, unknown>[];
  /** 部门数据 */
  depts?: Record<string, unknown>[];
  /** 菜单数据 */
  menus?: Record<string, unknown>[];
  /** 岗位数据 */
  posts?: Record<string, unknown>[];
  /** 字典类型 */
  dictTypes?: Record<string, unknown>[];
  /** 字典数据 */
  dictData?: Record<string, unknown>[];
  /** 配置数据 */
  configs?: Record<string, unknown>[];
  /** 通知公告 */
  notices?: Record<string, unknown>[];
}

/**
 * CSV 列配置
 */
interface CsvColumn {
  header: string;
  key: string;
}

/**
 * 租户数据导出服务 (需求 5.3)
 *
 * 提供租户数据导出功能：
 * - 支持 JSON 格式导出
 * - 支持 CSV 格式导出
 * - 支持选择性导出数据类型
 * - 支持敏感数据脱敏
 */
@Injectable()
export class TenantExportService {
  private readonly logger = new Logger(TenantExportService.name);

  constructor(private readonly prismaService: PrismaService) {}

  /**
   * 导出租户数据
   *
   * @param tenantId 租户ID
   * @param options 导出选项
   * @param res Express Response 对象（可选，用于流式导出）
   * @returns 导出数据或直接写入响应
   */
  async exportTenantData(
    tenantId: string,
    options: ExportOptions,
    res?: Response,
  ): Promise<TenantExportData | void> {
    if (!tenantId) {
      throw new BusinessException(ResponseCode.BAD_REQUEST, '租户ID不能为空');
    }

    // 验证租户是否存在
    const tenant = await this.prismaService.sysTenant.findUnique({
      where: { tenantId },
    });

    if (!tenant) {
      throw new BusinessException(ResponseCode.NOT_FOUND, '租户不存在');
    }

    this.logger.log(`开始导出租户 ${tenantId} 的数据，格式: ${options.format}`);

    // 收集导出数据
    const exportData = await this.collectExportData(tenantId, options);

    // 根据格式导出
    if (options.format === ExportFormat.JSON) {
      return this.exportAsJson(exportData, res);
    } else if (options.format === ExportFormat.CSV) {
      return this.exportAsCsv(exportData, options.dataTypes, res);
    }

    return exportData;
  }

  /**
   * 收集导出数据
   */
  private async collectExportData(
    tenantId: string,
    options: ExportOptions,
  ): Promise<TenantExportData> {
    const delFlagFilter = options.includeDeleted
      ? {}
      : { delFlag: DelFlagEnum.NORMAL };

    const exportData: TenantExportData = {
      exportTime: new Date().toISOString(),
      tenantId,
    };

    const dataTypes = options.dataTypes.includes(ExportDataType.ALL)
      ? Object.values(ExportDataType).filter((t) => t !== ExportDataType.ALL)
      : options.dataTypes;

    // 获取租户基本信息
    const tenant = await this.prismaService.sysTenant.findUnique({
      where: { tenantId },
    });
    if (tenant) {
      exportData.tenantInfo = this.sanitizeTenantInfo(tenant);
    }

    // 并行获取各类数据
    const promises: Promise<void>[] = [];

    if (dataTypes.includes(ExportDataType.USERS)) {
      promises.push(
        this.prismaService.sysUser
          .findMany({
            where: { tenantId, ...delFlagFilter },
          })
          .then((users) => {
            exportData.users = users.map((u) =>
              options.maskSensitiveData ? this.maskUserData(u) : this.sanitizeRecord(u),
            );
          }),
      );
    }

    if (dataTypes.includes(ExportDataType.ROLES)) {
      promises.push(
        this.prismaService.sysRole
          .findMany({
            where: { tenantId, ...delFlagFilter },
          })
          .then((roles) => {
            exportData.roles = roles.map((r) => this.sanitizeRecord(r));
          }),
      );
    }

    if (dataTypes.includes(ExportDataType.DEPTS)) {
      promises.push(
        this.prismaService.sysDept
          .findMany({
            where: { tenantId, ...delFlagFilter },
          })
          .then((depts) => {
            exportData.depts = depts.map((d) => this.sanitizeRecord(d));
          }),
      );
    }

    if (dataTypes.includes(ExportDataType.MENUS)) {
      promises.push(
        this.prismaService.sysMenu
          .findMany({
            where: { tenantId, ...delFlagFilter },
          })
          .then((menus) => {
            exportData.menus = menus.map((m) => this.sanitizeRecord(m));
          }),
      );
    }

    if (dataTypes.includes(ExportDataType.POSTS)) {
      promises.push(
        this.prismaService.sysPost
          .findMany({
            where: { tenantId, ...delFlagFilter },
          })
          .then((posts) => {
            exportData.posts = posts.map((p) => this.sanitizeRecord(p));
          }),
      );
    }

    if (dataTypes.includes(ExportDataType.DICT_TYPES)) {
      promises.push(
        this.prismaService.sysDictType
          .findMany({
            where: { tenantId, ...delFlagFilter },
          })
          .then((dictTypes) => {
            exportData.dictTypes = dictTypes.map((dt) => this.sanitizeRecord(dt));
          }),
      );
    }

    if (dataTypes.includes(ExportDataType.DICT_DATA)) {
      promises.push(
        this.prismaService.sysDictData
          .findMany({
            where: { tenantId, ...delFlagFilter },
          })
          .then((dictData) => {
            exportData.dictData = dictData.map((dd) => this.sanitizeRecord(dd));
          }),
      );
    }

    if (dataTypes.includes(ExportDataType.CONFIGS)) {
      promises.push(
        this.prismaService.sysConfig
          .findMany({
            where: { tenantId, ...delFlagFilter },
          })
          .then((configs) => {
            exportData.configs = configs.map((c) => this.sanitizeRecord(c));
          }),
      );
    }

    if (dataTypes.includes(ExportDataType.NOTICES)) {
      promises.push(
        this.prismaService.sysNotice
          .findMany({
            where: { tenantId, ...delFlagFilter },
          })
          .then((notices) => {
            exportData.notices = notices.map((n) => this.sanitizeRecord(n));
          }),
      );
    }

    await Promise.all(promises);

    this.logger.log(`租户 ${tenantId} 数据收集完成`);
    return exportData;
  }

  /**
   * 导出为 JSON 格式
   */
  private exportAsJson(
    data: TenantExportData,
    res?: Response,
  ): TenantExportData | void {
    if (res) {
      const filename = `tenant_${data.tenantId}_${this.getDateString()}.json`;
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(JSON.stringify(data, null, 2));
      return;
    }
    return data;
  }

  /**
   * 导出为 CSV 格式
   */
  private exportAsCsv(
    data: TenantExportData,
    dataTypes: ExportDataType[],
    res?: Response,
  ): TenantExportData | void {
    if (!res) {
      return data;
    }

    // 确定要导出的数据类型
    const types = dataTypes.includes(ExportDataType.ALL)
      ? Object.values(ExportDataType).filter((t) => t !== ExportDataType.ALL)
      : dataTypes;

    // 选择第一个有数据的类型进行导出
    let csvContent = '';
    let exportedType = '';

    for (const type of types) {
      const records = this.getDataByType(data, type);
      if (records && records.length > 0) {
        csvContent = this.convertToCsv(records, type);
        exportedType = type;
        break;
      }
    }

    if (!csvContent) {
      csvContent = '无数据';
      exportedType = 'empty';
    }

    const filename = `tenant_${data.tenantId}_${exportedType}_${this.getDateString()}.csv`;
    
    // 添加 BOM 以支持 Excel 正确识别 UTF-8
    const bom = '\uFEFF';
    
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(bom + csvContent);
  }

  /**
   * 根据类型获取数据
   */
  private getDataByType(
    data: TenantExportData,
    type: ExportDataType,
  ): Record<string, unknown>[] | undefined {
    switch (type) {
      case ExportDataType.USERS:
        return data.users;
      case ExportDataType.ROLES:
        return data.roles;
      case ExportDataType.DEPTS:
        return data.depts;
      case ExportDataType.MENUS:
        return data.menus;
      case ExportDataType.POSTS:
        return data.posts;
      case ExportDataType.DICT_TYPES:
        return data.dictTypes;
      case ExportDataType.DICT_DATA:
        return data.dictData;
      case ExportDataType.CONFIGS:
        return data.configs;
      case ExportDataType.NOTICES:
        return data.notices;
      default:
        return undefined;
    }
  }

  /**
   * 转换为 CSV 格式
   */
  private convertToCsv(
    records: Record<string, unknown>[],
    type: ExportDataType,
  ): string {
    if (!records || records.length === 0) {
      return '';
    }

    const columns = this.getCsvColumns(type);
    
    // 生成表头
    const header = columns.map((col) => this.escapeCsvValue(col.header)).join(',');
    
    // 生成数据行
    const rows = records.map((record) => {
      return columns
        .map((col) => {
          const value = record[col.key];
          return this.escapeCsvValue(this.formatCsvValue(value));
        })
        .join(',');
    });

    return [header, ...rows].join('\n');
  }

  /**
   * 获取 CSV 列配置
   */
  private getCsvColumns(type: ExportDataType): CsvColumn[] {
    switch (type) {
      case ExportDataType.USERS:
        return [
          { header: '用户ID', key: 'userId' },
          { header: '用户名', key: 'userName' },
          { header: '昵称', key: 'nickName' },
          { header: '邮箱', key: 'email' },
          { header: '手机号', key: 'phonenumber' },
          { header: '性别', key: 'sex' },
          { header: '状态', key: 'status' },
          { header: '创建时间', key: 'createTime' },
        ];
      case ExportDataType.ROLES:
        return [
          { header: '角色ID', key: 'roleId' },
          { header: '角色名称', key: 'roleName' },
          { header: '权限字符', key: 'roleKey' },
          { header: '排序', key: 'roleSort' },
          { header: '状态', key: 'status' },
          { header: '创建时间', key: 'createTime' },
        ];
      case ExportDataType.DEPTS:
        return [
          { header: '部门ID', key: 'deptId' },
          { header: '部门名称', key: 'deptName' },
          { header: '父部门ID', key: 'parentId' },
          { header: '排序', key: 'orderNum' },
          { header: '负责人', key: 'leader' },
          { header: '状态', key: 'status' },
        ];
      case ExportDataType.MENUS:
        return [
          { header: '菜单ID', key: 'menuId' },
          { header: '菜单名称', key: 'menuName' },
          { header: '父菜单ID', key: 'parentId' },
          { header: '路径', key: 'path' },
          { header: '组件', key: 'component' },
          { header: '权限标识', key: 'perms' },
          { header: '状态', key: 'status' },
        ];
      case ExportDataType.POSTS:
        return [
          { header: '岗位ID', key: 'postId' },
          { header: '岗位编码', key: 'postCode' },
          { header: '岗位名称', key: 'postName' },
          { header: '排序', key: 'postSort' },
          { header: '状态', key: 'status' },
        ];
      case ExportDataType.DICT_TYPES:
        return [
          { header: '字典ID', key: 'dictId' },
          { header: '字典名称', key: 'dictName' },
          { header: '字典类型', key: 'dictType' },
          { header: '状态', key: 'status' },
        ];
      case ExportDataType.DICT_DATA:
        return [
          { header: '字典编码', key: 'dictCode' },
          { header: '字典类型', key: 'dictType' },
          { header: '字典标签', key: 'dictLabel' },
          { header: '字典值', key: 'dictValue' },
          { header: '排序', key: 'dictSort' },
          { header: '状态', key: 'status' },
        ];
      case ExportDataType.CONFIGS:
        return [
          { header: '配置ID', key: 'configId' },
          { header: '配置名称', key: 'configName' },
          { header: '配置键', key: 'configKey' },
          { header: '配置值', key: 'configValue' },
          { header: '系统内置', key: 'configType' },
        ];
      case ExportDataType.NOTICES:
        return [
          { header: '公告ID', key: 'noticeId' },
          { header: '公告标题', key: 'noticeTitle' },
          { header: '公告类型', key: 'noticeType' },
          { header: '状态', key: 'status' },
          { header: '创建时间', key: 'createTime' },
        ];
      default:
        return [];
    }
  }

  /**
   * 转义 CSV 值
   */
  private escapeCsvValue(value: string): string {
    if (!value) return '';
    
    // 如果包含逗号、引号或换行符，需要用引号包裹
    if (value.includes(',') || value.includes('"') || value.includes('\n') || value.includes('\r')) {
      // 将引号替换为两个引号
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  }

  /**
   * 格式化 CSV 值
   */
  private formatCsvValue(value: unknown): string {
    if (value === null || value === undefined) {
      return '';
    }
    if (value instanceof Date) {
      return value.toISOString();
    }
    if (typeof value === 'object') {
      return JSON.stringify(value);
    }
    return String(value);
  }

  /**
   * 获取日期字符串
   */
  private getDateString(): string {
    return new Date().toISOString().split('T')[0].replace(/-/g, '');
  }

  /**
   * 清理记录（移除敏感字段）
   */
  private sanitizeRecord(record: Record<string, unknown>): Record<string, unknown> {
    const sanitized = { ...record };
    // 移除密码字段
    delete sanitized.password;
    return sanitized;
  }

  /**
   * 清理租户信息
   */
  private sanitizeTenantInfo(tenant: Record<string, unknown>): Record<string, unknown> {
    const sanitized = { ...tenant };
    // 移除内部字段
    delete sanitized.id;
    return sanitized;
  }

  /**
   * 脱敏用户数据
   */
  private maskUserData(user: Record<string, unknown>): Record<string, unknown> {
    const masked = this.sanitizeRecord(user);
    
    // 脱敏手机号
    if (masked.phonenumber && typeof masked.phonenumber === 'string') {
      masked.phonenumber = this.maskPhone(masked.phonenumber);
    }
    
    // 脱敏邮箱
    if (masked.email && typeof masked.email === 'string') {
      masked.email = this.maskEmail(masked.email);
    }
    
    return masked;
  }

  /**
   * 脱敏手机号
   */
  private maskPhone(phone: string): string {
    if (!phone || phone.length < 7) return phone;
    return phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2');
  }

  /**
   * 脱敏邮箱
   */
  private maskEmail(email: string): string {
    if (!email || !email.includes('@')) return email;
    const [local, domain] = email.split('@');
    const maskedLocal = local.length > 2 
      ? local[0] + '**' + local.slice(-1) 
      : '**';
    return `${maskedLocal}@${domain}`;
  }

  /**
   * 导出单一数据类型为 JSON
   *
   * @param tenantId 租户ID
   * @param dataType 数据类型
   * @param res Express Response 对象
   */
  async exportSingleTypeAsJson(
    tenantId: string,
    dataType: ExportDataType,
    res: Response,
  ): Promise<void> {
    await this.exportTenantData(
      tenantId,
      {
        format: ExportFormat.JSON,
        dataTypes: [dataType],
        includeDeleted: false,
        maskSensitiveData: true,
      },
      res,
    );
  }

  /**
   * 导出单一数据类型为 CSV
   *
   * @param tenantId 租户ID
   * @param dataType 数据类型
   * @param res Express Response 对象
   */
  async exportSingleTypeAsCsv(
    tenantId: string,
    dataType: ExportDataType,
    res: Response,
  ): Promise<void> {
    await this.exportTenantData(
      tenantId,
      {
        format: ExportFormat.CSV,
        dataTypes: [dataType],
        includeDeleted: false,
        maskSensitiveData: true,
      },
      res,
    );
  }

  /**
   * 导出全部租户数据为 JSON
   *
   * @param tenantId 租户ID
   * @param res Express Response 对象
   */
  async exportAllAsJson(tenantId: string, res: Response): Promise<void> {
    await this.exportTenantData(
      tenantId,
      {
        format: ExportFormat.JSON,
        dataTypes: [ExportDataType.ALL],
        includeDeleted: false,
        maskSensitiveData: true,
      },
      res,
    );
  }

  /**
   * 获取导出数据（不写入响应）
   *
   * @param tenantId 租户ID
   * @param options 导出选项
   * @returns 导出数据
   */
  async getExportData(
    tenantId: string,
    options: Partial<ExportOptions> = {},
  ): Promise<TenantExportData> {
    const fullOptions: ExportOptions = {
      format: options.format || ExportFormat.JSON,
      dataTypes: options.dataTypes || [ExportDataType.ALL],
      includeDeleted: options.includeDeleted ?? false,
      maskSensitiveData: options.maskSensitiveData ?? true,
    };

    const result = await this.exportTenantData(tenantId, fullOptions);
    return result as TenantExportData;
  }
}
