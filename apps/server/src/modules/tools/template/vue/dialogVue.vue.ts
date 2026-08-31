/**
 * Vue3 操作抽屉模板
 *
 * 生成符合项目规范的 Naive UI 操作抽屉组件
 * - 使用 NDrawer、NForm 组件
 * - 使用 useNaiveForm hook
 * - 支持 i18n 国际化
 * - 包含新增、编辑功能
 *
 * @modules vue/dialogVue
 */

import { indexScriptDicts } from './indexVue.vue';

export interface DialogVueTemplateOptions {
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
  /** 表注释 */
  tableComment?: string;
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
 * 生成操作抽屉组件
 */
export function dialogVue(options: DialogVueTemplateOptions): string {
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
function generateScript(options: DialogVueTemplateOptions): string {
  const { BusinessName, businessName, moduleName, functionName, primaryKey, columns } = options;

  // 收集字典类型
  const dictTypes = new Set<string>();
  columns.forEach((col) => {
    if (col.dictType && (col.isInsert === '1' || col.isEdit === '1')) {
      dictTypes.add(col.dictType);
    }
  });

  // 生成字典导入
  const dictImports = dictTypes.size > 0 ? `import { useDict } from 'src/hooks/business/dict';` : '';
  const dictUsage = Array.from(dictTypes)
    .map((dict) => `useDict('${dict}');`)
    .join('\n');

  // 生成表单字段
  const editColumns = columns.filter((col) => (col.isInsert === '1' || col.isEdit === '1') && col.isPk !== '1');
  const formFields = generateFormFields(editColumns);
  const defaultModel = generateDefaultModel(editColumns);
  const rules = generateRules(editColumns, moduleName, businessName);

  return `<script setup lang="ts">
import { computed, reactive, watch } from 'vue';
import { useLoading } from '@sa/hooks';
import {
  fetchCreate${BusinessName},
  fetchUpdate${BusinessName},
  fetch${BusinessName}Detail,
} from 'src/service/api/${moduleName}/${businessName}';
import type {
  ${BusinessName}Record,
  Create${BusinessName}Params,
  Update${BusinessName}Params,
} from 'src/service/api/${moduleName}/${businessName}';
import { useFormRules, useNaiveForm } from 'src/hooks/common/form';
${dictImports}
import { $t } from 'src/locales';

defineOptions({
  name: '${BusinessName}OperateDrawer',
});

interface Props {
  /** 操作类型 */
  operateType: NaiveUI.TableOperateType;
  /** 编辑行数据 */
  rowData?: ${BusinessName}Record | null;
}

const props = defineProps<Props>();

interface Emits {
  (e: 'submitted'): void;
}

const emit = defineEmits<Emits>();

const visible = defineModel<boolean>('visible', {
  default: false,
});

${dictUsage}

const { loading, startLoading, endLoading } = useLoading();
const { formRef, validate, restoreValidation } = useNaiveForm();
const { createRequiredRule } = useFormRules();

const title = computed(() => {
  const titles: Record<NaiveUI.TableOperateType, string> = {
    add: $t('page.${moduleName}.${businessName}.add${BusinessName}'),
    edit: $t('page.${moduleName}.${businessName}.edit${BusinessName}'),
  };
  return titles[props.operateType];
});

type Model = Partial<Create${BusinessName}Params & Update${BusinessName}Params> & { ${primaryKey}?: CommonType.IdType };

const model: Model = reactive(createDefaultModel());

function createDefaultModel(): Model {
  return {
${defaultModel}
  };
}

${rules}

/** 获取详情 */
async function getDetail(${primaryKey}: CommonType.IdType) {
  startLoading();
  try {
    const { data } = await fetch${BusinessName}Detail(${primaryKey});
    if (data) {
      Object.assign(model, data);
    }
  } catch (error) {
    // 错误消息已在请求工具中显示
  } finally {
    endLoading();
  }
}

/** 处理编辑时的数据更新 */
function handleUpdateModelWhenEdit() {
  if (props.operateType === 'add') {
    Object.assign(model, createDefaultModel());
    return;
  }

  if (props.operateType === 'edit' && props.rowData) {
    getDetail(props.rowData.${primaryKey}!);
  }
}

/** 关闭抽屉 */
function closeDrawer() {
  visible.value = false;
}

/** 提交表单 */
async function handleSubmit() {
  await validate();

  try {
    if (props.operateType === 'add') {
      await fetchCreate${BusinessName}(model as Create${BusinessName}Params);
    } else if (props.operateType === 'edit') {
      await fetchUpdate${BusinessName}(model as Update${BusinessName}Params);
    }

    window.$message?.success(
      props.operateType === 'add' ? $t('common.addSuccess') : $t('common.updateSuccess'),
    );
    closeDrawer();
    emit('submitted');
  } catch (error) {
    // 错误消息已在请求工具中显示
  }
}

watch(visible, () => {
  if (visible.value) {
    handleUpdateModelWhenEdit();
    restoreValidation();
  }
});
</script>`;
}

/**
 * 生成 template 部分
 */
function generateTemplate(options: DialogVueTemplateOptions): string {
  const { BusinessName, businessName, moduleName, columns } = options;

  // 生成表单项
  const editColumns = columns.filter((col) => (col.isInsert === '1' || col.isEdit === '1') && col.isPk !== '1');
  const formItems = generateFormItems(editColumns, moduleName, businessName);

  return `<template>
  <NDrawer v-model:show="visible" display-directive="show" :width="500" class="max-w-90%">
    <NDrawerContent :title="title" :native-scrollbar="false" closable>
      <NSpin :show="loading">
        <NForm ref="formRef" :model="model" :rules="rules" label-placement="left" :label-width="100">
${formItems}
        </NForm>
      </NSpin>
      <template #footer>
        <NSpace :size="16">
          <NButton @click="closeDrawer">{{ $t('common.cancel') }}</NButton>
          <NButton type="primary" @click="handleSubmit">{{ $t('common.save') }}</NButton>
        </NSpace>
      </template>
    </NDrawerContent>
  </NDrawer>
</template>`;
}

/**
 * 生成 style 部分
 */
function generateStyle(): string {
  return `<style scoped></style>`;
}

/**
 * 生成表单字段定义
 */
function generateFormFields(columns: DialogVueTemplateOptions['columns']): string {
  return columns
    .map((col) => {
      const field = col.javaField;
      let type = 'string';

      switch (col.javaType) {
        case 'Number':
        case 'number':
          type = 'number';
          break;
        case 'Boolean':
        case 'boolean':
          type = 'boolean';
          break;
        default:
          type = 'string';
      }

      return `  ${field}: ${type === 'string' ? "''" : type === 'number' ? 'undefined' : 'false'};`;
    })
    .join('\n');
}

/**
 * 生成默认模型
 */
function generateDefaultModel(columns: DialogVueTemplateOptions['columns']): string {
  return columns
    .map((col) => {
      const field = col.javaField;
      let defaultValue = "''";

      switch (col.htmlType) {
        case 'checkbox':
          defaultValue = '[]';
          break;
        case 'input':
        case 'textarea':
        case 'editor':
        case 'select':
        case 'radio':
          defaultValue = "''";
          break;
        case 'datetime':
          defaultValue = 'null';
          break;
        default:
          if (col.javaType === 'Number' || col.javaType === 'number') {
            defaultValue = 'undefined';
          } else {
            defaultValue = "''";
          }
      }

      return `    ${field}: ${defaultValue},`;
    })
    .join('\n');
}

/**
 * 生成验证规则
 */
function generateRules(columns: DialogVueTemplateOptions['columns'], moduleName: string, businessName: string): string {
  const requiredColumns = columns.filter((col) => col.isRequired === '1');

  if (requiredColumns.length === 0) {
    return `const rules = {};`;
  }

  const ruleFields = requiredColumns
    .map((col) => {
      const field = col.javaField;
      const isArray = col.htmlType === 'checkbox';
      const ruleType = isArray ? ", type: 'array' as const" : '';
      return `  ${field}: [{ ...createRequiredRule($t('page.${moduleName}.${businessName}.form.${field}.required'))${ruleType} }],`;
    })
    .join('\n');

  return `const rules: Record<string, App.Global.FormRule[]> = {
${ruleFields}
};`;
}

/**
 * 生成表单项
 */
function generateFormItems(
  columns: DialogVueTemplateOptions['columns'],
  moduleName: string,
  businessName: string,
): string {
  return columns
    .map((col) => {
      const field = col.javaField;
      const label = `$t('page.${moduleName}.${businessName}.${field}')`;
      const placeholder = `$t('page.${moduleName}.${businessName}.form.${field}.required')`;

      switch (col.htmlType) {
        case 'input':
          return `          <NFormItem :label="${label}" path="${field}">
            <NInput v-model:value="model.${field}" :placeholder="${placeholder}" />
          </NFormItem>`;

        case 'textarea':
          return `          <NFormItem :label="${label}" path="${field}">
            <NInput v-model:value="model.${field}" type="textarea" :placeholder="${placeholder}" />
          </NFormItem>`;

        case 'editor':
          return `          <NFormItem :label="${label}" path="${field}">
            <NInput v-model:value="model.${field}" type="textarea" :rows="4" :placeholder="${placeholder}" />
          </NFormItem>`;

        case 'select':
          if (col.dictType) {
            return `          <NFormItem :label="${label}" path="${field}">
            <DictSelect v-model:value="model.${field}" dict-code="${col.dictType}" :placeholder="${placeholder}" />
          </NFormItem>`;
          }
          return `          <NFormItem :label="${label}" path="${field}">
            <NSelect v-model:value="model.${field}" :options="[]" :placeholder="${placeholder}" />
          </NFormItem>`;

        case 'radio':
          if (col.dictType) {
            return `          <NFormItem :label="${label}" path="${field}">
            <DictRadio v-model:value="model.${field}" dict-code="${col.dictType}" />
          </NFormItem>`;
          }
          return `          <NFormItem :label="${label}" path="${field}">
            <NRadioGroup v-model:value="model.${field}">
              <NRadio value="1">选项1</NRadio>
              <NRadio value="0">选项2</NRadio>
            </NRadioGroup>
          </NFormItem>`;

        case 'checkbox':
          if (col.dictType) {
            return `          <NFormItem :label="${label}" path="${field}">
            <DictCheckbox v-model:value="model.${field}" dict-code="${col.dictType}" />
          </NFormItem>`;
          }
          return `          <NFormItem :label="${label}" path="${field}">
            <NCheckboxGroup v-model:value="model.${field}">
              <NCheckbox value="1">选项1</NCheckbox>
              <NCheckbox value="0">选项2</NCheckbox>
            </NCheckboxGroup>
          </NFormItem>`;

        case 'datetime':
          return `          <NFormItem :label="${label}" path="${field}">
            <NDatePicker v-model:formatted-value="model.${field}" type="datetime" value-format="yyyy-MM-dd HH:mm:ss" clearable />
          </NFormItem>`;

        case 'imageUpload':
          return `          <NFormItem :label="${label}" path="${field}">
            <ImageUpload v-model:value="model.${field}" />
          </NFormItem>`;

        case 'fileUpload':
          return `          <NFormItem :label="${label}" path="${field}">
            <FileUpload v-model:value="model.${field}" />
          </NFormItem>`;

        default:
          return `          <NFormItem :label="${label}" path="${field}">
            <NInput v-model:value="model.${field}" :placeholder="${placeholder}" />
          </NFormItem>`;
      }
    })
    .join('\n');
}
