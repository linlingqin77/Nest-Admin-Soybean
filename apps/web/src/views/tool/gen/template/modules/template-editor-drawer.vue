<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue';
import * as monaco from 'monaco-editor';
import { fetchTemplateCreateTemplate, fetchTemplateUpdateTemplate, fetchTemplateValidateTemplate } from '@/service/api';
import { useFormRules, useNaiveForm } from '@/hooks/common/form';
import { $t } from '@/locales';

defineOptions({
  name: 'TemplateEditorDrawer'
});

interface Props {
  /** the type of operation */
  operateType: NaiveUI.TableOperateType;
  /** the edit row data */
  rowData?: Api.Tool.Template | null;
  /** the group id for new template */
  groupId?: number;
}

const props = defineProps<Props>();

interface Emits {
  (e: 'submitted'): void;
}

const emit = defineEmits<Emits>();

const visible = defineModel<boolean>('visible', {
  default: false
});

const { formRef, validate, restoreValidation } = useNaiveForm();
const { createRequiredRule } = useFormRules();

const title = computed(() => {
  const titles: Record<NaiveUI.TableOperateType, string> = {
    add: '新增模板',
    edit: '编辑模板'
  };
  return titles[props.operateType];
});

// 模板语言选项
const languageOptions = [
  { label: 'TypeScript', value: 'typescript' },
  { label: 'Vue', value: 'vue' },
  { label: 'SQL', value: 'sql' }
];

// Monaco 编辑器语言映射
const monacoLanguageMap: Record<'typescript' | 'vue' | 'sql', string> = {
  typescript: 'typescript',
  vue: 'html',
  sql: 'sql'
};

type Model = {
  id?: number;
  groupId: number;
  name: string;
  fileName: string;
  filePath: string;
  content: string;
  language: 'typescript' | 'vue' | 'sql';
  sort: number;
  status: string;
};

const model: Model = reactive(createDefaultModel());

function createDefaultModel(): Model {
  return {
    groupId: props.groupId || 0,
    name: '',
    fileName: '',
    filePath: '',
    content: '',
    language: 'typescript',
    sort: 0,
    status: '0'
  };
}

type RuleKey = Extract<keyof Model, 'name' | 'fileName' | 'filePath' | 'content' | 'language'>;

const rules: Record<RuleKey, App.Global.FormRule> = {
  name: createRequiredRule('请输入模板名称'),
  fileName: createRequiredRule('请输入输出文件名'),
  filePath: createRequiredRule('请输入输出路径'),
  content: createRequiredRule('请输入模板内容'),
  language: createRequiredRule('请选择模板语言')
};

// Monaco 编辑器相关
const editorContainer = ref<HTMLElement | null>(null);
let editor: monaco.editor.IStandaloneCodeEditor | null = null;

// 验证结果
const validateResult = ref<{
  valid: boolean;
  variables: string[];
  warnings: string[];
} | null>(null);
const validateLoading = ref(false);

function initEditor() {
  if (!editorContainer.value) return;

  editor = monaco.editor.create(editorContainer.value, {
    value: model.content,
    language: monacoLanguageMap[model.language],
    theme: 'vs-dark',
    automaticLayout: true,
    minimap: { enabled: false },
    fontSize: 14,
    lineNumbers: 'on',
    scrollBeyondLastLine: false,
    wordWrap: 'on',
    tabSize: 2
  });

  editor.onDidChangeModelContent(() => {
    model.content = editor?.getValue() || '';
  });
}

function disposeEditor() {
  if (editor) {
    editor.dispose();
    editor = null;
  }
}

function updateEditorLanguage() {
  if (editor) {
    const monacoModel = editor.getModel();
    if (monacoModel) {
      monaco.editor.setModelLanguage(monacoModel, monacoLanguageMap[model.language]);
    }
  }
}

function updateEditorContent() {
  if (editor && editor.getValue() !== model.content) {
    editor.setValue(model.content);
  }
}

function handleUpdateModelWhenEdit() {
  if (props.operateType === 'add') {
    Object.assign(model, createDefaultModel());
    model.groupId = props.groupId || 0;
    return;
  }

  if (props.operateType === 'edit' && props.rowData) {
    Object.assign(model, {
      id: props.rowData.id,
      groupId: props.rowData.groupId,
      name: props.rowData.name,
      fileName: props.rowData.fileName,
      filePath: props.rowData.filePath,
      content: props.rowData.content,
      language: props.rowData.language,
      sort: props.rowData.sort,
      status: props.rowData.status
    });
  }
}

function closeDrawer() {
  visible.value = false;
}

async function handleValidate() {
  if (!model.content) {
    window.$message?.warning('请先输入模板内容');
    return;
  }

  validateLoading.value = true;
  try {
    const { data } = await fetchTemplateValidateTemplate({ content: model.content });
    validateResult.value = data as any;
    if (data?.valid) {
      window.$message?.success('模板语法验证通过');
    } else {
      window.$message?.error('模板语法验证失败');
    }
  } catch {
    // error handled by request interceptor
  } finally {
    validateLoading.value = false;
  }
}

async function handleSubmit() {
  await validate();

  try {
    if (props.operateType === 'add') {
      const createData: Api.Tool.TemplateOperateParams = {
        groupId: model.groupId,
        name: model.name,
        fileName: model.fileName,
        filePath: model.filePath,
        content: model.content,
        language: model.language,
        sort: model.sort
      };
      await fetchTemplateCreateTemplate(createData);
    } else if (props.operateType === 'edit' && model.id) {
      const updateData: Api.Tool.TemplateOperateParams = {
        name: model.name,
        fileName: model.fileName,
        filePath: model.filePath,
        content: model.content,
        language: model.language,
        sort: model.sort,
        status: model.status as Api.Common.EnableStatus
      };
      await fetchTemplateUpdateTemplate(model.id, updateData as any);
    }

    window.$message?.success(props.operateType === 'add' ? $t('common.addSuccess') : $t('common.updateSuccess'));
    closeDrawer();
    emit('submitted');
  } catch {
    // error handled by request interceptor
  }
}

// 插入变量
function insertVariable(variable: string) {
  if (editor) {
    const selection = editor.getSelection();
    if (selection) {
      editor.executeEdits('insert-variable', [
        {
          range: selection,
          text: `\${${variable}}`
        }
      ]);
    }
  }
}

// 支持的变量列表
const supportedVariables = [
  { name: 'tableName', description: '表名' },
  { name: 'className', description: '类名' },
  { name: 'businessName', description: '业务名' },
  { name: 'moduleName', description: '模块名' },
  { name: 'functionName', description: '功能名' },
  { name: 'author', description: '作者' },
  { name: 'datetime', description: '日期时间' },
  { name: 'tenantAware', description: '是否租户感知' },
  { name: 'primaryKey', description: '主键字段' },
  { name: 'columns', description: '列信息列表' },
  { name: 'pkColumn', description: '主键列' },
  { name: 'pkJavaField', description: '主键字段名' },
  { name: 'pkJavaType', description: '主键类型' },
  { name: 'packageName', description: '包名' },
  { name: 'tableComment', description: '表注释' }
];

watch(visible, async newVal => {
  if (newVal) {
    handleUpdateModelWhenEdit();
    restoreValidation();
    validateResult.value = null;
    await nextTick();
    if (!editor) {
      initEditor();
    } else {
      updateEditorContent();
      updateEditorLanguage();
    }
  }
});

watch(
  () => model.language,
  () => {
    updateEditorLanguage();
  }
);

onMounted(() => {
  // Editor will be initialized when drawer opens
});

onBeforeUnmount(() => {
  disposeEditor();
});
</script>

<template>
  <NDrawer v-model:show="visible" :title="title" display-directive="show" :width="900" class="max-w-95%">
    <NDrawerContent :title="title" :native-scrollbar="false" closable>
      <NForm ref="formRef" :model="model" :rules="rules" label-placement="left" :label-width="100">
        <NGrid :cols="2" :x-gap="16">
          <NFormItemGi label="模板名称" path="name">
            <NInput v-model:value="model.name" placeholder="请输入模板名称" />
          </NFormItemGi>
          <NFormItemGi label="模板语言" path="language">
            <NSelect v-model:value="model.language" :options="languageOptions" placeholder="请选择模板语言" />
          </NFormItemGi>
          <NFormItemGi label="输出文件名" path="fileName">
            <NInput v-model:value="model.fileName" placeholder="如: ${businessName}.controller.ts" />
          </NFormItemGi>
          <NFormItemGi label="输出路径" path="filePath">
            <NInput v-model:value="model.filePath" placeholder="如: server/src/module/${moduleName}" />
          </NFormItemGi>
          <NFormItemGi label="排序号" path="sort">
            <NInputNumber v-model:value="model.sort" :min="0" placeholder="排序号" class="w-full" />
          </NFormItemGi>
          <NFormItemGi v-if="operateType === 'edit'" label="状态" path="status">
            <NRadioGroup v-model:value="model.status">
              <NSpace>
                <NRadio value="0">正常</NRadio>
                <NRadio value="1">停用</NRadio>
              </NSpace>
            </NRadioGroup>
          </NFormItemGi>
        </NGrid>

        <NFormItem label="模板内容" path="content">
          <div class="w-full">
            <div class="mb-8px flex items-center justify-between">
              <NSpace>
                <NPopover trigger="click" placement="bottom-start">
                  <template #trigger>
                    <NButton size="small" secondary>
                      <template #icon>
                        <SvgIcon icon="material-symbols:code" />
                      </template>
                      插入变量
                    </NButton>
                  </template>
                  <div class="max-h-300px overflow-auto">
                    <div
                      v-for="v in supportedVariables"
                      :key="v.name"
                      class="cursor-pointer rounded px-12px py-6px hover:bg-gray-100 dark:hover:bg-gray-700"
                      @click="insertVariable(v.name)"
                    >
                      <div class="text-primary font-mono">${{ v.name }}</div>
                      <div class="text-12px text-gray-500">{{ v.description }}</div>
                    </div>
                  </div>
                </NPopover>
                <NButton size="small" secondary :loading="validateLoading" @click="handleValidate">
                  <template #icon>
                    <SvgIcon icon="material-symbols:check-circle-outline" />
                  </template>
                  验证语法
                </NButton>
              </NSpace>
              <NSpace v-if="validateResult">
                <NTag v-if="validateResult.valid" type="success" size="small">语法正确</NTag>
                <NTag v-else type="error" size="small">语法错误</NTag>
                <NTag v-if="validateResult.variables.length > 0" type="info" size="small">
                  使用变量: {{ validateResult.variables.length }}
                </NTag>
              </NSpace>
            </div>
            <div ref="editorContainer" class="h-400px w-full border border-gray-300 rounded dark:border-gray-600" />
            <div v-if="validateResult?.warnings.length" class="mt-8px">
              <NAlert type="warning" title="警告">
                <ul class="m-0 pl-16px">
                  <li v-for="(warning, index) in validateResult.warnings" :key="index">{{ warning }}</li>
                </ul>
              </NAlert>
            </div>
          </div>
        </NFormItem>
      </NForm>
      <template #footer>
        <NSpace :size="16">
          <NButton @click="closeDrawer">{{ $t('common.cancel') }}</NButton>
          <NButton type="primary" @click="handleSubmit">{{ $t('common.confirm') }}</NButton>
        </NSpace>
      </template>
    </NDrawerContent>
  </NDrawer>
</template>

<style scoped></style>
