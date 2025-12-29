/**
 * Namespace Api
 *
 * All backend api type
 */
declare namespace Api {
  /**
   * namespace Tool
   *
   * backend api module: "tool"
   */
  namespace Tool {
    /** 生成模板 */
    type TplCategory = 'crud' | 'tree' | 'sub';

    /** TypeScript类型 */
    type TsType = 'number' | 'string' | 'boolean' | 'Date' | 'object';

    /** 查询方式 */
    type QueryType = 'EQ' | 'NE' | 'GT' | 'GE' | 'LT' | 'LE' | 'LIKE' | 'BETWEEN' | 'IN' | 'NOT_IN';

    /** 显示类型 */
    type HtmlType =
      | 'input'
      | 'textarea'
      | 'select'
      | 'radio'
      | 'checkbox'
      | 'datetime'
      | 'date'
      | 'time'
      | 'upload'
      | 'editor'
      | 'number'
      | 'imageUpload'
      | 'fileUpload'
      | 'switch'
      | 'slider'
      | 'rate'
      | 'colorPicker'
      | 'treeSelect'
      | 'cascader'
      | 'transfer';

    /**
     * 生成代码方式
     *
     * - ZIP: zip压缩包
     * - PATH: 自定义路径
     */
    type GenType = 'ZIP' | 'PATH';

    /** 代码生成业务表 */
    export type GenTable = Common.CommonRecord<{
      /** 表ID */
      tableId?: CommonType.IdType;
      /** 表名称 */
      tableName: string;
      /** 表描述 */
      tableComment: string;
      /** 关联子表的表名 */
      subTableName?: string;
      /** 子表关联的外键名 */
      subTableFkName?: string;
      /** 实体类名称(首字母大写) */
      className: string;
      /** 使用的模板（crud单表操作 tree树表操作 sub主子表操作） */
      tplCategory?: TplCategory;
      /** 前端模板类型 */
      tplWebType?: string;
      /** 生成包路径 */
      packageName: string;
      /** 生成模块名 */
      moduleName: string;
      /** 生成业务名 */
      businessName: string;
      /** 生成功能名 */
      functionName: string;
      /** 生成作者 */
      functionAuthor: string;
      /** 生成代码方式（ZIP压缩包 PATH自定义路径） */
      genType?: GenType;
      /** 生成路径（不填默认项目路径） */
      genPath?: string;
      /** 其它生成选项 */
      options?: string;
      /** 备注 */
      remark?: string;
      /** 表列信息 */
      columns?: GenTableColumn[];
      /** 主键信息 */
      pkColumn?: GenTableColumn;
      /** 树编码字段 */
      treeCode?: string;
      /** 树父编码字段 */
      treeParentCode?: string;
      /** 树名称字段 */
      treeName?: string;
      /** 上级菜单ID */
      parentMenuId?: CommonType.IdType;
      /** 上级菜单名称 */
      parentMenuName?: string;
      /** 其他参数 */
      params?: { [key: string]: any };
    }>;

    /** 代码生成业务字段 */
    export type GenTableColumn = Common.CommonRecord<{
      /** 字段ID */
      columnId?: CommonType.IdType;
      /** 归属表ID */
      tableId?: CommonType.IdType;
      /** 列名称 */
      columnName?: string;
      /** 列描述 */
      columnComment?: string;
      /** 列类型 */
      columnType?: string;
      /** TypeScript类型 */
      tsType?: TsType;
      /** TypeScript属性名 */
      tsField?: string;
      /** 是否主键（Y是 N否） */
      isPk?: Common.YesOrNoStatus;
      /** 是否自增（Y是 N否） */
      isIncrement?: Common.YesOrNoStatus;
      /** 是否必填（Y是 N否） */
      isRequired?: Common.YesOrNoStatus;
      /** 是否为插入字段（Y是 N否） */
      isInsert?: Common.YesOrNoStatus;
      /** 是否编辑字段（Y是 N否） */
      isEdit?: Common.YesOrNoStatus;
      /** 是否列表字段（Y是 N否） */
      isList?: Common.YesOrNoStatus;
      /** 是否查询字段（Y是 N否） */
      isQuery?: Common.YesOrNoStatus;
      /** 查询方式 */
      queryType?: QueryType;
      /** 显示类型 */
      htmlType?: HtmlType;
      /** 字典类型 */
      dictType?: string;
      /** 默认值 */
      columnDefault?: string;
      /** 排序 */
      sort?: number;
      /** 是否导出字段 */
      isExport?: Common.YesOrNoStatus;
      /** 是否导入字段 */
      isImport?: Common.YesOrNoStatus;
      /** 列宽度 */
      columnWidth?: number;
      /** 列对齐方式 */
      columnAlign?: 'left' | 'center' | 'right';
      /** 是否可排序 */
      columnSortable?: Common.YesOrNoStatus;
    }>;

    /** gen table search params */
    type GenTableSearchParams = CommonType.RecordNullable<
      Pick<GenTable, 'tableName' | 'tableComment'> &
        Common.CommonSearchParams & {
          params?: {
            beginTime?: string;
            endTime?: string;
          };
        }
    >;

    /** gen table list */
    type GenTableList = Common.PaginatingQueryRecord<GenTable>;

    /** gen table db search params */
    type GenTableDbSearchParams = CommonType.RecordNullable<
      Pick<GenTable, 'tableName' | 'tableComment'> & Common.CommonSearchParams
    >;

    /** gen table preview */
    type GenTablePreview = Record<string, string>;

    /** gen table db list */
    type GenTableDbList = Common.PaginatingQueryRecord<
      Common.CommonRecord<Pick<GenTable, 'tableName' | 'tableComment'>>
    >;

    /** gen table info */
    type GenTableInfo = {
      /** 字段信息 */
      rows: GenTableColumn[];
      /** 生成信息 */
      tables?: GenTable[];
      /** 基本信息 */
      info: GenTable;
    };

    /** 数据权限类型 */
    type DataScopeType = 'ALL' | 'CUSTOM' | 'DEPT' | 'DEPT_AND_CHILD' | 'SELF';

    /** 企业级功能配置选项 */
    type GenOptions = {
      // 树表配置
      treeCode?: string;
      treeParentCode?: string;
      treeName?: string;
      parentMenuId?: number;
      parentMenuName?: string;

      // 数据权限配置
      enableDataScope?: boolean;
      dataScopeColumn?: string;
      dataScopeType?: DataScopeType;

      // 导入导出配置
      enableExport?: boolean;
      enableImport?: boolean;
      exportFields?: string[];
      importFields?: string[];
      exportFileName?: string;

      // 多租户配置
      enableTenant?: boolean;
      tenantColumn?: string;

      // 审计日志配置
      enableOperlog?: boolean;
      operlogTitle?: string;

      // 高级查询配置
      enableAdvancedSearch?: boolean;
      defaultSortField?: string;
      defaultSortOrder?: 'asc' | 'desc';

      // 前端增强配置
      enableColumnResize?: boolean;
      enableColumnToggle?: boolean;
      enableInlineEdit?: boolean;
      enableBatchEdit?: boolean;
      tableHeight?: number;

      // API 文档配置
      apiGroup?: string;
      apiDescription?: string;

      // 代码质量配置
      enableUnitTest?: boolean;
      enableE2ETest?: boolean;
    };
  }
}
