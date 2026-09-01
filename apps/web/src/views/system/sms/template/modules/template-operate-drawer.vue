<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue';
import { fetchSmsChannelGetEnabledChannels, fetchSmsTemplateCreate, fetchSmsTemplateUpdate } from '@/service/api';
import type { CreateSmsTemplateRequestDto, UpdateSmsTemplateRequestDto } from '@/service/api-gen';
import { useFormRules, useNaiveForm } from '@/hooks/common/form';
import { $t } from '@/locales';

defineOptions({
  name: 'SmsTemplateOperateDrawer'
});

interface Props {
  /** the type of operation */
  operateType: NaiveUI.TableOperateType;
  /** the edit row data */
  rowData?: Api.System.SmsTemplate | null;
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

const channelOptions = ref<{ label: string; value: number }[]>([]);

const templateTypeOptions = [
  { label: '验证码', value: 1 },
  { label: '通知', value: 2 },
  { label: '营销', value: 3 }
];

async function loadChannelOptions() {
  try {
    const { data } = await fetchSmsChannelGetEnabledChannels();
    if (data && Array.isArray(data)) {
      channelOptions.value = data.map((item: any) => ({
        label: item.name,
        value: item.id as number
      }));
    }
  } catch {
    // error handled by request interceptor
  }
}

onMounted(() => {
  loadChannelOptions();
});

const title = computed(() => {
  const titles: Record<NaiveUI.TableOperateType, string> = {
    add: '新增短信模板',
    edit: '编辑短信模板'
  };
  return titles[props.operateType];
});

type Model = Api.System.SmsTemplateOperateParams;

const model: Model = reactive(createDefaultModel());

function createDefaultModel(): Model {
  return {
    id: null,
    channelId: null,
    code: '',
    name: '',
    content: '',
    params: [],
    apiTemplateId: '',
    type: 1,
    status: '0',
    remark: ''
  };
}

type RuleKey = Extract<keyof Model, 'channelId' | 'code' | 'name' | 'content' | 'apiTemplateId' | 'type' | 'status'>;

const rules: Record<RuleKey, App.Global.FormRule> = {
  channelId: createRequiredRule('短信渠道不能为空'),
  code: createRequiredRule('模板编码不能为空'),
  name: createRequiredRule('模板名称不能为空'),
  content: createRequiredRule('模板内容不能为空'),
  apiTemplateId: createRequiredRule('第三方模板ID不能为空'),
  type: createRequiredRule('模板类型不能为空'),
  status: createRequiredRule('状态不能为空')
};

// 动态标签输入
const paramsInputValue = ref('');
const paramsInputVisible = ref(false);

function handleParamsClose(index: number) {
  if (model.params) {
    model.params.splice(index, 1);
  }
}

function handleParamsConfirm() {
  if (paramsInputValue.value && model.params) {
    if (!model.params.includes(paramsInputValue.value)) {
      model.params.push(paramsInputValue.value);
    }
  }
  paramsInputVisible.value = false;
  paramsInputValue.value = '';
}

function handleUpdateModelWhenEdit() {
  if (props.operateType === 'add') {
    Object.assign(model, createDefaultModel());
    return;
  }

  if (props.operateType === 'edit' && props.rowData) {
    Object.assign(model, {
      ...props.rowData,
      params: props.rowData.params ? [...props.rowData.params] : []
    });
  }
}

function closeDrawer() {
  visible.value = false;
}

async function handleSubmit() {
  await validate();

  try {
    if (props.operateType === 'add') {
      const { channelId, code, name, content, params, apiTemplateId, type, status, remark } = model;
      await fetchSmsTemplateCreate({
        channelId,
        code,
        name,
        content,
        params: params ? JSON.stringify(params) : undefined,
        apiTemplateId,
        type,
        status,
        remark
      } as Api.System.SmsTemplate);
    } else if (props.operateType === 'edit') {
      const updateData = { ...model, params: model.params ? JSON.stringify(model.params) : undefined };
      await fetchSmsTemplateUpdate(updateData as Api.System.SmsTemplate);
    }

    window.$message?.success(props.operateType === 'add' ? $t('common.addSuccess') : $t('common.updateSuccess'));
    closeDrawer();
    emit('submitted');
  } catch {
    // error handled by request interceptor
  }
}

watch(visible, () => {
  if (visible.value) {
    handleUpdateModelWhenEdit();
    restoreValidation();
  }
});
</script>

<template>
  <NDrawer v-model:show="visible" :title="title" display-directive="show" :width="600" class="max-w-90%">
    <NDrawerContent :title="title" :native-scrollbar="false" closable>
      <NForm ref="formRef" :model="model" :rules="rules" label-placement="left" :label-width="100">
        <NFormItem label="短信渠道" path="channelId">
          <NSelect
            v-model:value="model.channelId"
            :options="channelOptions"
            placeholder="请选择短信渠道"
            :disabled="props.operateType === 'edit'"
          />
        </NFormItem>
        <NFormItem label="模板编码" path="code">
          <NInput v-model:value="model.code" placeholder="请输入模板编码" :disabled="props.operateType === 'edit'" />
        </NFormItem>
        <NFormItem label="模板名称" path="name">
          <NInput v-model:value="model.name" placeholder="请输入模板名称" />
        </NFormItem>
        <NFormItem label="第三方模板ID" path="apiTemplateId">
          <NInput v-model:value="model.apiTemplateId" placeholder="请输入第三方平台的模板ID" />
        </NFormItem>
        <NFormItem label="模板类型" path="type">
          <NSelect v-model:value="model.type" :options="templateTypeOptions" placeholder="请选择模板类型" />
        </NFormItem>
        <NFormItem label="模板内容" path="content">
          <NInput
            v-model:value="model.content"
            type="textarea"
            :rows="4"
            placeholder="请输入模板内容，变量使用 {变量名} 格式"
          />
        </NFormItem>
        <NFormItem label="参数列表" path="params">
          <div class="flex flex-wrap gap-8px">
            <NTag v-for="(param, index) in model.params" :key="param" closable @close="handleParamsClose(index)">
              {{ param }}
            </NTag>
            <NInput
              v-if="paramsInputVisible"
              v-model:value="paramsInputValue"
              size="small"
              style="width: 100px"
              autofocus
              @blur="handleParamsConfirm"
              @keyup.enter="handleParamsConfirm"
            />
            <NButton v-else size="small" dashed @click="paramsInputVisible = true">
              <template #icon>
                <icon-material-symbols:add-rounded />
              </template>
              添加参数
            </NButton>
          </div>
        </NFormItem>
        <NFormItem label="状态" path="status">
          <DictRadio v-model:value="model.status" dict-code="sys_normal_disable" />
        </NFormItem>
        <NFormItem label="备注" path="remark">
          <NInput v-model:value="model.remark" type="textarea" placeholder="请输入备注" />
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
