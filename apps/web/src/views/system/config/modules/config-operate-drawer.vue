<script setup lang="ts">
import { computed, reactive, watch } from 'vue';
import { fetchConfigCreate, fetchConfigUpdate } from '@/service/api';
import { useFormRules, useNaiveForm } from '@/hooks/common/form';
import { $t } from '@/locales';

defineOptions({
  name: 'ConfigOperateDrawer'
});

interface Props {
  /** the type of operation */
  operateType: NaiveUI.TableOperateType;
  /** the edit row data */
  rowData?: Api.System.Config | null;
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
    add: $t('page.system.config.addConfig'),
    edit: $t('page.system.config.editConfig')
  };
  return titles[props.operateType];
});

type Model = {
  configId?: number;
  configName: string;
  configKey: string;
  configValue: string;
  configType: string;
  remark: string;
};

const model: Model = reactive(createDefaultModel());

function createDefaultModel(): Model {
  return {
    configName: '',
    configKey: '',
    configValue: '',
    configType: 'Y',
    remark: ''
  };
}

type RuleKey = Extract<keyof Model, 'configId' | 'configName' | 'configKey' | 'configValue' | 'configType'>;

const rules: Record<RuleKey, App.Global.FormRule> = {
  configId: createRequiredRule($t('page.system.config.form.configId.required')),
  configName: createRequiredRule($t('page.system.config.form.configName.required')),
  configKey: createRequiredRule($t('page.system.config.form.configKey.required')),
  configValue: createRequiredRule($t('page.system.config.form.configValue.required')),
  configType: createRequiredRule($t('page.system.config.form.configType.required'))
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

  // request
  try {
    if (props.operateType === 'add') {
      const { configName, configKey, configValue, configType, remark } = model;
      const createData: Api.System.ConfigOperateParams = {
        configName,
        configKey,
        configValue,
        configType: configType as 'Y' | 'N' | null,
        remark
      };
      await fetchConfigCreate(createData);
    } else if (props.operateType === 'edit') {
      const { configId, configName, configKey, configValue, configType, remark } = model;
      const updateData: Api.System.ConfigOperateParams = {
        configId: configId!,
        configName,
        configKey,
        configValue,
        configType: configType as Api.Common.YesOrNoStatus | null,
        remark
      };
      await fetchConfigUpdate(updateData);
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
  <NDrawer v-model:show="visible" :title="title" display-directive="show" :width="800" class="max-w-90%">
    <NDrawerContent :title="title" :native-scrollbar="false" closable>
      <NForm ref="formRef" :model="model" :rules="rules">
        <NFormItem :label="$t('page.system.config.configName')" path="configName">
          <NInput v-model:value="model.configName" :placeholder="$t('page.system.config.form.configName.required')" />
        </NFormItem>
        <NFormItem :label="$t('page.system.config.configKey')" path="configKey">
          <NInput v-model:value="model.configKey" :placeholder="$t('page.system.config.form.configKey.required')" />
        </NFormItem>
        <NFormItem :label="$t('page.system.config.configValue')" path="configValue">
          <NInput
            v-model:value="model.configValue"
            :rows="3"
            :placeholder="$t('page.system.config.form.configValue.required')"
          />
        </NFormItem>
        <NFormItem :label="$t('page.system.config.configType')" path="configType">
          <DictRadio v-model:value="model.configType" dict-code="sys_yes_no" />
        </NFormItem>
        <NFormItem :label="$t('page.system.config.remark')" path="remark">
          <NInput
            v-model:value="model.remark"
            :rows="3"
            type="textarea"
            :placeholder="$t('page.system.config.form.remark.required')"
          />
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
