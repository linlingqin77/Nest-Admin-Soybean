<script setup lang="ts">
import { computed, reactive, watch } from 'vue';
import { fetchSmsChannelCreate, fetchSmsChannelUpdate } from '@/service/api';
import type { CreateSmsChannelRequestDto, UpdateSmsChannelRequestDto } from '@/service/api-gen';
import { useFormRules, useNaiveForm } from '@/hooks/common/form';
import { $t } from '@/locales';

defineOptions({
  name: 'SmsChannelOperateDrawer'
});

interface Props {
  /** the type of operation */
  operateType: NaiveUI.TableOperateType;
  /** the edit row data */
  rowData?: Api.System.SmsChannel | null;
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
    add: '新增短信渠道',
    edit: '编辑短信渠道'
  };
  return titles[props.operateType];
});

type Model = Api.System.SmsChannelOperateParams;

const model: Model = reactive(createDefaultModel());

function createDefaultModel(): Model {
  return {
    id: null,
    code: null,
    name: '',
    signature: '',
    apiKey: '',
    apiSecret: '',
    callbackUrl: '',
    status: '0',
    remark: ''
  };
}

const channelCodeOptions = [
  { label: '阿里云', value: 'aliyun' },
  { label: '腾讯云', value: 'tencent' },
  { label: '华为云', value: 'huawei' },
  { label: '七牛云', value: 'qiniu' },
  { label: '云片', value: 'yunpian' }
];

type RuleKey = Extract<keyof Model, 'code' | 'name' | 'signature' | 'apiKey' | 'apiSecret' | 'status'>;

const rules: Record<RuleKey, App.Global.FormRule> = {
  code: createRequiredRule('渠道编码不能为空'),
  name: createRequiredRule('渠道名称不能为空'),
  signature: createRequiredRule('短信签名不能为空'),
  apiKey: createRequiredRule('API Key不能为空'),
  apiSecret: createRequiredRule('API Secret不能为空'),
  status: createRequiredRule('状态不能为空')
};

function handleUpdateModelWhenEdit() {
  if (props.operateType === 'add') {
    Object.assign(model, createDefaultModel());
    return;
  }

  if (props.operateType === 'edit' && props.rowData) {
    Object.assign(model, props.rowData);
  }
}

function closeDrawer() {
  visible.value = false;
}

async function handleSubmit() {
  await validate();

  try {
    if (props.operateType === 'add') {
      const { code, name, signature, apiKey, apiSecret, callbackUrl, status, remark } = model;
      await fetchSmsChannelCreate({
        code,
        name,
        signature,
        apiKey,
        apiSecret,
        callbackUrl,
        status,
        remark
      } as Api.System.SmsChannel);
    } else if (props.operateType === 'edit') {
      await fetchSmsChannelUpdate(model as Api.System.SmsChannel);
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
  <NDrawer v-model:show="visible" :title="title" display-directive="show" :width="500" class="max-w-90%">
    <NDrawerContent :title="title" :native-scrollbar="false" closable>
      <NForm ref="formRef" :model="model" :rules="rules" label-placement="left" :label-width="100">
        <NFormItem label="渠道编码" path="code">
          <NSelect
            v-model:value="model.code"
            :options="channelCodeOptions"
            placeholder="请选择渠道编码"
            :disabled="props.operateType === 'edit'"
          />
        </NFormItem>
        <NFormItem label="渠道名称" path="name">
          <NInput v-model:value="model.name" placeholder="请输入渠道名称" />
        </NFormItem>
        <NFormItem label="短信签名" path="signature">
          <NInput v-model:value="model.signature" placeholder="请输入短信签名" />
        </NFormItem>
        <NFormItem label="API Key" path="apiKey">
          <NInput v-model:value="model.apiKey" placeholder="请输入API Key" />
        </NFormItem>
        <NFormItem label="API Secret" path="apiSecret">
          <NInput
            v-model:value="model.apiSecret"
            type="password"
            show-password-on="click"
            placeholder="请输入API Secret"
          />
        </NFormItem>
        <NFormItem label="回调地址" path="callbackUrl">
          <NInput v-model:value="model.callbackUrl" placeholder="请输入回调地址（可选）" />
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
