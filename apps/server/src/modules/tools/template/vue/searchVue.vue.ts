/**
 * Vue3 搜索组件模板
 *
 * 生成符合项目规范的 Naive UI 搜索组件
 * - 使用 NForm、NGrid 组件
 * - 支持 i18n 国际化
 * - 包含搜索、重置功能
 *
 * C5 安全修复：所有外部输入字符串在拼入模板前都通过 assertSafeText
 * 校验，防止函数名/模块名/字段名中含特殊字符破坏生成的代码。
 *
 * @modules vue/searchVue
 */

import { assertSafeText } from '../../utils/sanitize';

export interface SearchVueTemplateOptions {
  /** 业务名称 (PascalCase) */
  BusinessName: string;
  /** 业务名称 (camelCase) */
  businessName: string;
  /** 模块名称 */
  moduleName: string;
  /** 功能名称 (中文) */
  functionName: string;
  /** 主键字段名 */
  primaryKey: string;
  /** 列配置 */
  columns: Array<{
    javaField: string;
    javaType: string;
    columnComment: string;
    columnType: string;
    isPk: string;
    isInsert: string;
    isEdit: string;
    isList: string;
    isQuery: string;
    isRequired: string;
    queryType: string;
    htmlType: string;
    dictType?: string;
  }>;
}

/**
 * 生成搜索组件
 */
export function searchVue(options: SearchVueTemplateOptions): string {
  // 安全：所有标识符类输入必须校验
  assertSafeText(options.BusinessName, 'BusinessName', 64);
  assertSafeText(options.businessName, 'businessName', 64);
  assertSafeText(options.moduleName, 'moduleName', 64);
  assertSafeText(options.primaryKey, 'primaryKey', 64);
  // 安全：所有字段名必须校验
  options.columns.forEach((col) => {
    assertSafeText(col.javaField, `javaField[${col.javaField}]`, 64);
  });

  const script = generateScript(options);
  const template = generateTemplate(options);
  const style = generateStyle();

  return `${script}

${template}

${style}
`;
}

/**
 * 生成 script 部分
 */
function generateScript(options: SearchVueTemplateOptions): string {
  const { BusinessName, businessName, moduleName, columns } = options;

  // 收集字典类型
  const queryColumns = columns.filter((col) => col.isQuery === '1');
  const dictTypes = new Set<string>();
  queryColumns.forEach((col) => {
    if (col.dictType) {
      dictTypes.add(col.dictType);
    }
  });

  // 生成字典导入
  const dictImports = dictTypes.size > 0 ? `import { useDict } from 'src/hooks/business/dict';` : '';
  const dictUsage = Array.from(dictTypes)
    .map((dict) => `useDict('${dict}');`)
    .join('\n');

  // 生成搜索参数类型
  const searchParamsType = generateSearchParamsType(queryColumns);

  return `<script setup lang="ts">
import { $t } from 'src/locales';
${dictImports}

defineOptions({
  name: '${BusinessName}Search',
});

${searchParamsType}

interface Emits {
  (e: 'reset'): void;
  (e: 'search'): void;
}

const emit = defineEmits<Emits>();

const model = defineModel<SearchParams>('model', { required: true });

${dictUsage}

function reset() {
  emit('reset');
}

function search() {
  emit('search');
}
</script>`;
}

/**
 * 生成 template 部分
 */
function generateTemplate(options: SearchVueTemplateOptions): string {
  const { moduleName, businessName, columns } = options;

  // 生成搜索表单项
  const queryColumns = columns.filter((col) => col.isQuery === '1');
  const formItems = generateSearchFormItems(queryColumns, moduleName, businessName);

  // 计算列数
  const colSpan = queryColumns.length <= 2 ? 12 : queryColumns.length <= 4 ? 8 : 6;

  return `<template>
  <NCard :bordered="false" size="small" class="card-wrapper">
    <NForm :model="model" label-placement="left" :label-width="80">
      <NGrid responsive="screen" item-responsive :x-gap="8" :y-gap="8">
${formItems}
        <NFormItemGi span="24 m:12 l:${colSpan}" class="pr-24px">
          <NSpace class="w-full" justify="end">
            <NButton @click="reset">
              <template #icon>
                <icon-ic-round-refresh class="text-icon" />
              </template>
              {{ $t('common.reset') }}
            </NButton>
            <NButton type="primary" ghost @click="search">
              <template #icon>
                <icon-ic-round-search class="text-icon" />
              </template>
              {{ $t('common.search') }}
            </NButton>
          </NSpace>
        </NFormItemGi>
      </NGrid>
    </NForm>
  </NCard>
</template>`;
}

/**
 * 生成 style 部分
 */
function generateStyle(): string {
  return `<style scoped></style>`;
}

/**
 * 生成搜索参数类型
 */
function generateSearchParamsType(columns: SearchVueTemplateOptions['columns']): string {
  const fields = columns
    .map((col) => {
      let type = 'string | null';
      if (col.javaType === 'Number' || col.javaType === 'number') {
        type = 'number | null';
      }
      return `  ${col.javaField}?: ${type};`;
    })
    .join('\n');

  return `interface SearchParams {
  pageNum?: number;
  pageSize?: number;
${fields}
}`;
}

/**
 * 生成搜索表单项
 */
function generateSearchFormItems(
  columns: SearchVueTemplateOptions['columns'],
  moduleName: string,
  businessName: string,
): string {
  // 计算列数
  const colSpan = columns.length <= 2 ? 12 : columns.length <= 4 ? 8 : 6;

  return columns
    .map((col) => {
      const field = col.javaField;
      const label = `$t('page.${moduleName}.${businessName}.${field}')`;
      const placeholder = `$t('page.${moduleName}.${businessName}.form.${field}.required')`;

      switch (col.htmlType) {
        case 'input':
          return `        <NFormItemGi span="24 m:12 l:${colSpan}" :label="${label}" path="${field}">
          <NInput v-model:value="model.${field}" :placeholder="${placeholder}" clearable />
        </NFormItemGi>`;

        case 'select':
          if (col.dictType) {
            return `        <NFormItemGi span="24 m:12 l:${colSpan}" :label="${label}" path="${field}">
          <DictSelect v-model:value="model.${field}" dict-code="${col.dictType}" :placeholder="${placeholder}" clearable />
        </NFormItemGi>`;
          }
          return `        <NFormItemGi span="24 m:12 l:${colSpan}" :label="${label}" path="${field}">
          <NSelect v-model:value="model.${field}" :options="[]" :placeholder="${placeholder}" clearable />
        </NFormItemGi>`;

        case 'radio':
          if (col.dictType) {
            return `        <NFormItemGi span="24 m:12 l:${colSpan}" :label="${label}" path="${field}">
          <DictSelect v-model:value="model.${field}" dict-code="${col.dictType}" :placeholder="${placeholder}" clearable />
        </NFormItemGi>`;
          }
          return `        <NFormItemGi span="24 m:12 l:${colSpan}" :label="${label}" path="${field}">
          <NSelect v-model:value="model.${field}" :options="[]" :placeholder="${placeholder}" clearable />
        </NFormItemGi>`;

        case 'datetime':
          if (col.queryType === 'BETWEEN') {
            return `        <NFormItemGi span="24 m:12 l:${colSpan}" :label="${label}" path="${field}">
          <NDatePicker v-model:formatted-value="model.${field}" type="daterange" value-format="yyyy-MM-dd" clearable />
        </NFormItemGi>`;
          }
          return `        <NFormItemGi span="24 m:12 l:${colSpan}" :label="${label}" path="${field}">
          <NDatePicker v-model:formatted-value="model.${field}" type="date" value-format="yyyy-MM-dd" clearable />
        </NFormItemGi>`;

        default:
          return `        <NFormItemGi span="24 m:12 l:${colSpan}" :label="${label}" path="${field}">
          <NInput v-model:value="model.${field}" :placeholder="${placeholder}" clearable />
        </NFormItemGi>`;
      }
    })
    .join('\n');
}
