import { transformRecordToOption } from '@/utils/common';

/** enable status */
export const enableStatusRecord: Record<Api.Common.EnableStatus, string> = {
  NORMAL: '正常',
  DISABLED: '停用',
};

export const enableStatusOptions = transformRecordToOption(enableStatusRecord);

/** yes or no status */
export const yesOrNoStatusRecord: Record<Api.Common.YesOrNoStatus, string> = {
  YES: '是',
  NO: '否',
};

export const yesOrNoStatusOptions = transformRecordToOption(yesOrNoStatusRecord);

/** menu type */
export const menuTypeRecord: Record<Api.System.MenuType, string> = {
  DIRECTORY: '目录',
  MENU: '菜单',
  BUTTON: '按钮',
};

export const menuTypeOptions = transformRecordToOption(menuTypeRecord);

/** menu is frame */
export const menuIsFrameRecord: Record<Api.System.IsMenuFrame, string> = {
  '0': '是',
  '1': '否',
  '2': 'iframe',
};

export const menuIsFrameOptions = transformRecordToOption(menuIsFrameRecord);

/** menu icon type */
export const menuIconTypeRecord: Record<Api.System.IconType, string> = {
  '1': 'iconify',
  '2': '本地图标',
};

export const menuIconTypeOptions = transformRecordToOption(menuIconTypeRecord);

/** gen TypeScript type */
export const genTsTypeRecord: Record<Api.Tool.TsType, string> = {
  number: 'number',
  string: 'string',
  boolean: 'boolean',
  Date: 'Date',
  object: 'object',
};

export const genTsTypeOptions = transformRecordToOption(genTsTypeRecord);

/** gen java type (for compatibility) */
export const genJavaTypeRecord = {
  Long: 'Long',
  String: 'String',
  Integer: 'Integer',
  Double: 'Double',
  BigDecimal: 'BigDecimal',
  Date: 'Date',
  Boolean: 'Boolean',
};

export const genJavaTypeOptions = transformRecordToOption(genJavaTypeRecord);

/** gen query type */
export const genQueryTypeRecord: Record<Api.Tool.QueryType, string> = {
  EQ: '=',
  NE: '!=',
  GT: '>',
  GE: '>=',
  LT: '<',
  LE: '<=',
  LIKE: 'LIKE',
  BETWEEN: 'BETWEEN',
  IN: 'IN',
  NOT_IN: 'NOT IN',
};

export const genQueryTypeOptions = transformRecordToOption(genQueryTypeRecord);

/** gen html type */
export const genHtmlTypeRecord: Record<Api.Tool.HtmlType, string> = {
  input: '文本框',
  textarea: '文本域',
  select: '下拉框',
  radio: '单选框',
  checkbox: '复选框',
  datetime: '日期时间控件',
  date: '日期控件',
  time: '时间控件',
  number: '数字框',
  switch: '开关',
  imageUpload: '图片上传',
  fileUpload: '文件上传',
  upload: '文件上传',
  editor: '富文本控件',
  slider: '滑块',
  rate: '评分',
  colorPicker: '颜色选择器',
  treeSelect: '树选择',
  cascader: '级联选择',
  transfer: '穿梭框',
};

export const genHtmlTypeOptions = transformRecordToOption(genHtmlTypeRecord);

/** gen type */
export const genTypeRecord: Record<Api.Tool.GenType, string> = {
  ZIP: 'ZIP 压缩包',
  PATH: '自定义路径',
};

export const genTypeOptions = transformRecordToOption(genTypeRecord);

/** gen type */
export const genTplCategoryRecord: Record<Api.Tool.TplCategory, string> = {
  crud: '单表（增删改查）',
  tree: '树表（增删改查）',
  sub: '主子表（增删改查）',
};

export const genTplCategoryOptions = transformRecordToOption(genTplCategoryRecord);

/** oss config is https */
export const ossConfigIsHttpsRecord: Record<Api.Common.YesOrNoStatus, string> = {
  YES: 'https://',
  NO: 'http://',
};

export const ossConfigIsHttpsOptions = transformRecordToOption(ossConfigIsHttpsRecord);

/** oss access policy */
export const ossAccessPolicyRecord: Record<Api.System.OssAccessPolicy, string> = {
  '0': '私有',
  '1': '公有',
  '2': '自定义',
};

export const ossAccessPolicyOptions = transformRecordToOption(ossAccessPolicyRecord);

/** data scope */
export const dataScopeRecord: Record<Api.System.DataScope, string> = {
  ALL: '全部数据权限',
  CUSTOM: '自定数据权限',
  DEPT: '本部门数据权限',
  DEPT_AND_CHILD: '本部门及以下数据权限',
  SELF: '仅本人数据权限',
};

export const dataScopeOptions = transformRecordToOption(dataScopeRecord);
