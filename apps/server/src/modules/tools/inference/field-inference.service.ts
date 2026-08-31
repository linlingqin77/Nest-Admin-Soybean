import { Injectable, Logger } from '@nestjs/common';
import { GenConstants } from 'src/shared/constants/gen.constant';
import { DbColumnDto } from '../datasource/dto';

/**
 * 字段推断规则接口
 *
 * @description 定义字段推断规则的结构
 */
export interface IFieldInferenceRule {
  /** 规则名称 */
  name: string;
  /** 匹配模式 */
  pattern: RegExp;
  /** 应用规则后的字段属性 */
  apply: (column: DbColumnDto) => Partial<IInferredColumn>;
  /** 规则优先级（数字越小优先级越高） */
  priority?: number;
}

/**
 * 推断后的列配置接口
 *
 * @description 字段推断引擎输出的列配置
 */
export interface IInferredColumn {
  /** 列名 */
  columnName: string;
  /** 列注释 */
  columnComment: string;
  /** 列类型 */
  columnType: string;
  /** Java 字段名（驼峰命名） */
  javaField: string;
  /** Java 类型 */
  javaType: string;
  /** HTML 控件类型 */
  htmlType: string;
  /** 字典类型 */
  dictType: string;
  /** 查询类型 */
  queryType: string;
  /** 是否主键 */
  isPk: string;
  /** 是否自增 */
  isIncrement: string;
  /** 是否必填 */
  isRequired: string;
  /** 是否插入字段 */
  isInsert: string;
  /** 是否编辑字段 */
  isEdit: string;
  /** 是否列表字段 */
  isList: string;
  /** 是否查询字段 */
  isQuery: string;
}

/**
 * 字段推断服务
 *
 * @description 根据字段名称和类型智能推断 UI 组件和验证规则
 * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 3.9
 */
@Injectable()
export class FieldInferenceService {
  private readonly logger = new Logger(FieldInferenceService.name);
  private rules: IFieldInferenceRule[] = [];

  constructor() {
    this.initDefaultRules();
  }

  /**
   * 初始化默认推断规则
   *
   * @description 按照需求文档定义的规则初始化
   * 规则按优先级从低到高排序，后应用的规则会覆盖先应用的规则
   * 因此更具体的规则应该有更高的优先级（更大的数字）
   */
  private initDefaultRules(): void {
    this.rules = [
      // Requirement 3.7: 名称字段设置模糊查询（最低优先级，只影响 queryType）
      {
        name: 'name-like',
        pattern: /name/i,
        apply: () => ({
          queryType: GenConstants.QUERY_LIKE,
        }),
        priority: 10,
      },
      // Requirement 3.5: 文件字段设置文件上传控件（较低优先级）
      {
        name: 'file-upload',
        pattern: /file/i,
        apply: () => ({
          htmlType: GenConstants.HTML_FILE_UPLOAD,
        }),
        priority: 20,
      },
      // Requirement 3.3: 时间和日期字段设置日期控件
      {
        name: 'time-datetime',
        pattern: /time|date/i,
        apply: () => ({
          htmlType: GenConstants.HTML_DATETIME,
          javaType: GenConstants.TYPE_DATE,
          queryType: GenConstants.QUERY_BETWEEN,
        }),
        priority: 30,
      },
      // Requirement 3.2: 类型和性别字段设置下拉框
      {
        name: 'type-select',
        pattern: /type/i,
        apply: () => ({
          htmlType: GenConstants.HTML_SELECT,
        }),
        priority: 40,
      },
      {
        name: 'sex-select',
        pattern: /sex/i,
        apply: () => ({
          htmlType: GenConstants.HTML_SELECT,
          dictType: 'sys_user_sex',
        }),
        priority: 40,
      },
      // Requirement 3.6: 内容和备注字段设置富文本或文本域
      {
        name: 'content-editor',
        pattern: /content/i,
        apply: () => ({
          htmlType: GenConstants.HTML_EDITOR,
        }),
        priority: 50,
      },
      {
        name: 'remark-textarea',
        pattern: /remark/i,
        apply: () => ({
          htmlType: GenConstants.HTML_TEXTAREA,
        }),
        priority: 50,
      },
      // Requirement 3.4: 图片和头像字段设置图片上传控件（高优先级，覆盖 file）
      {
        name: 'image-upload',
        pattern: /image|avatar/i,
        apply: () => ({
          htmlType: GenConstants.HTML_IMAGE_UPLOAD,
        }),
        priority: 60,
      },
      // Requirement 3.1: 状态字段设置单选框（最高优先级）
      {
        name: 'status-radio',
        pattern: /status/i,
        apply: () => ({
          htmlType: GenConstants.HTML_RADIO,
          dictType: 'sys_normal_disable',
        }),
        priority: 70,
      },
    ];

    // 按优先级排序（从低到高，后应用的规则覆盖先应用的）
    this.rules.sort((a, b) => (a.priority || 100) - (b.priority || 100));
  }

  /**
   * 注册自定义推断规则
   *
   * @param rule 推断规则
   */
  registerRule(rule: IFieldInferenceRule): void {
    this.rules.push(rule);
    this.rules.sort((a, b) => (a.priority || 100) - (b.priority || 100));
    this.logger.log(`注册自定义推断规则: ${rule.name}`);
  }

  /**
   * 获取所有推断规则
   *
   * @returns 推断规则列表
   */
  getRules(): IFieldInferenceRule[] {
    return [...this.rules];
  }

  /**
   * 推断单个字段
   *
   * @param column 数据库列信息
   * @returns 推断后的列配置
   * Requirements: 3.1-3.9
   */
  inferColumn(column: DbColumnDto): IInferredColumn {
    const columnName = column.columnName;
    const lowerColumnName = columnName.toLowerCase();

    // 初始化基础配置
    const inferred: IInferredColumn = {
      columnName: column.columnName,
      columnComment: column.columnComment || column.columnName,
      columnType: column.columnType,
      javaField: this.toCamelCase(columnName),
      javaType: this.inferJavaType(column.columnType),
      htmlType: this.inferHtmlTypeByColumnType(column.columnType, column.maxLength),
      dictType: '',
      queryType: GenConstants.QUERY_EQ,
      isPk: column.isPrimaryKey ? GenConstants.REQUIRE : GenConstants.NOT_REQUIRE,
      isIncrement: column.isAutoIncrement ? GenConstants.REQUIRE : GenConstants.NOT_REQUIRE,
      isRequired: GenConstants.NOT_REQUIRE,
      isInsert: GenConstants.REQUIRE,
      isEdit: GenConstants.REQUIRE,
      isList: GenConstants.REQUIRE,
      isQuery: GenConstants.REQUIRE,
    };

    // Requirement 3.9: 根据 NOT NULL 约束推断 isRequired
    // 如果列不可空且没有默认值，则为必填
    if (!column.isNullable && !column.defaultValue) {
      inferred.isRequired = GenConstants.REQUIRE;
    }

    // Requirement 3.8: 主键且自增字段排除插入表单
    if (column.isPrimaryKey && column.isAutoIncrement) {
      inferred.isInsert = GenConstants.NOT_REQUIRE;
      inferred.isEdit = GenConstants.REQUIRE;
      inferred.isQuery = GenConstants.REQUIRE;
      inferred.isList = GenConstants.REQUIRE;
    }

    // 排除系统字段
    if (this.isSystemColumn(lowerColumnName)) {
      inferred.isInsert = GenConstants.NOT_REQUIRE;
      inferred.isEdit = GenConstants.NOT_REQUIRE;
      inferred.isList = GenConstants.NOT_REQUIRE;
      inferred.isQuery = GenConstants.NOT_REQUIRE;
    }

    // 应用推断规则
    for (const rule of this.rules) {
      if (rule.pattern.test(lowerColumnName)) {
        const applied = rule.apply(column);
        Object.assign(inferred, applied);
        this.logger.debug(`应用规则 ${rule.name} 到字段 ${columnName}`);
      }
    }

    return inferred;
  }

  /**
   * 批量推断字段
   *
   * @param columns 数据库列信息列表
   * @returns 推断后的列配置列表
   */
  inferColumns(columns: DbColumnDto[]): IInferredColumn[] {
    return columns.map((column) => this.inferColumn(column));
  }

  /**
   * 根据列类型推断 Java 类型
   *
   * @param columnType 数据库列类型
   * @returns Java 类型
   */
  private inferJavaType(columnType: string): string {
    const lowerType = columnType.toLowerCase();

    // 时间类型
    if (this.matchesAny(lowerType, GenConstants.COLUMNTYPE_TIME)) {
      return GenConstants.TYPE_DATE;
    }

    // 数字类型
    if (this.matchesAny(lowerType, GenConstants.COLUMNTYPE_NUMBER)) {
      return GenConstants.TYPE_NUMBER;
    }

    // 默认字符串类型
    return GenConstants.TYPE_STRING;
  }

  /**
   * 根据列类型推断 HTML 控件类型
   *
   * @param columnType 数据库列类型
   * @param maxLength 最大长度
   * @returns HTML 控件类型
   */
  private inferHtmlTypeByColumnType(columnType: string, maxLength?: number): string {
    const lowerType = columnType.toLowerCase();

    // 文本类型
    if (this.matchesAny(lowerType, GenConstants.COLUMNTYPE_TEXT)) {
      return GenConstants.HTML_TEXTAREA;
    }

    // 字符串类型，根据长度判断
    if (this.matchesAny(lowerType, GenConstants.COLUMNTYPE_STR)) {
      if (maxLength && maxLength >= 500) {
        return GenConstants.HTML_TEXTAREA;
      }
      return GenConstants.HTML_INPUT;
    }

    // 时间类型
    if (this.matchesAny(lowerType, GenConstants.COLUMNTYPE_TIME)) {
      return GenConstants.HTML_DATETIME;
    }

    // 默认输入框
    return GenConstants.HTML_INPUT;
  }

  /**
   * 判断是否为系统字段
   *
   * @param columnName 列名（小写）
   * @returns 是否为系统字段
   */
  private isSystemColumn(columnName: string): boolean {
    const systemColumns = [
      'create_by',
      'create_time',
      'update_by',
      'update_time',
      'del_flag',
      'createby',
      'createtime',
      'updateby',
      'updatetime',
      'delflag',
    ];
    return systemColumns.includes(columnName);
  }

  /**
   * 检查字符串是否匹配数组中的任意项
   *
   * @param str 待检查字符串
   * @param arr 匹配数组
   * @returns 是否匹配
   */
  private matchesAny(str: string, arr: string[]): boolean {
    return arr.some((item) => str.includes(item.toLowerCase()));
  }

  /**
   * 将下划线命名转换为驼峰命名
   *
   * @param str 下划线命名字符串
   * @returns 驼峰命名字符串
   */
  private toCamelCase(str: string): string {
    return str.toLowerCase().replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
  }
}
