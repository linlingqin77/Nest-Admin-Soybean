<script setup lang="ts">
import { computed, reactive, watch } from 'vue';
import { useLoading } from '@sa/hooks';
import { fetchCreateJob, fetchGetJobDetail, fetchUpdateJob } from '@/service/api/monitor/job';
import { useFormRules, useNaiveForm } from '@/hooks/common/form';
import { $t } from '@/locales';

defineOptions({
  name: 'JobOperateDrawer',
});

interface Props {
  /** the type of operation */
  operateType: NaiveUI.TableOperateType;
  /** the edit row data */
  rowData?: Api.Monitor.Job | null;
}

const props = defineProps<Props>();

interface Emits {
  (e: 'submitted'): void;
  (e: 'showCron', value: string): void;
}

const emit = defineEmits<Emits>();

const visible = defineModel<boolean>('visible', {
  default: false,
});

const { loading, startLoading, endLoading } = useLoading();
const { formRef, validate, restoreValidation } = useNaiveForm();
const { createRequiredRule } = useFormRules();

const title = computed(() => {
  const titles: Record<NaiveUI.TableOperateType, string> = {
    add: '新增任务',
    edit: '编辑任务',
  };
  return titles[props.operateType];
});

type Model = Api.Monitor.JobOperateParams;

const model: Model = reactive(createDefaultModel());

function createDefaultModel(): Model {
  return {
    jobId: null,
    jobName: '',
    jobGroup: 'DEFAULT',
    invokeTarget: '',
    cronExpression: '',
    misfirePolicy: '1',
    concurrent: '1',
    status: '0',
  };
}

type RuleKey = Extract<keyof Model, 'jobName' | 'invokeTarget' | 'cronExpression'>;

const rules: Record<RuleKey, App.Global.FormRule[]> = {
  jobName: [createRequiredRule('请输入任务名称')],
  invokeTarget: [createRequiredRule('请输入调用目标')],
  cronExpression: [createRequiredRule('请输入cron表达式')],
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

function handleShowCron() {
  emit('showCron', model.cronExpression || '');
}

function handleCronChange(cron: string) {
  model.cronExpression = cron;
}

async function handleSubmit() {
  await validate();

  startLoading();
  try {
    if (props.operateType === 'add') {
      await fetchCreateJob(model);
    } else if (props.operateType === 'edit') {
      await fetchUpdateJob(model);
    }

    window.$message?.success(props.operateType === 'add' ? $t('common.addSuccess') : $t('common.updateSuccess'));
    closeDrawer();
    emit('submitted');
  } catch {
    // error handled by request interceptor
  } finally {
    endLoading();
  }
}

watch(visible, () => {
  if (visible.value) {
    handleUpdateModelWhenEdit();
    restoreValidation();
  }
});

// 暴露方法供父组件调用
defineExpose({
  handleCronChange,
});
</script>

<template>
  <NDrawer v-model:show="visible" display-directive="show" :width="600" class="max-w-90%">
    <NDrawerContent :title="title" :native-scrollbar="false" closable>
      <NSpin :show="loading">
        <NForm ref="formRef" :model="model" :rules="rules" label-placement="left" :label-width="100">
          <NFormItem label="任务名称" path="jobName">
            <NInput v-model:value="model.jobName" placeholder="请输入任务名称" />
          </NFormItem>
          <NFormItem label="任务分组" path="jobGroup">
            <DictSelect v-model:value="model.jobGroup" dict-code="sys_job_group" placeholder="请选择任务分组" />
          </NFormItem>
          <NFormItem label="调用方法" path="invokeTarget">
            <template #label>
              <span class="flex items-center gap-4px">
                调用方法
                <NTooltip trigger="hover">
                  <template #trigger>
                    <icon-mdi-help-circle class="cursor-help text-14px" />
                  </template>
                  <div>
                    Bean调用示例：ryTask.ryParams('ry')
                    <br />
                    Class类调用示例：com.ruoyi.quartz.task.RyTask.ryParams('ry')
                    <br />
                    参数说明：支持字符串，布尔类型，长整型，浮点型，整型
                  </div>
                </NTooltip>
              </span>
            </template>
            <NInput v-model:value="model.invokeTarget" placeholder="请输入调用目标字符串" />
          </NFormItem>
          <NFormItem label="cron表达式" path="cronExpression">
            <NInputGroup>
              <NInput v-model:value="model.cronExpression" placeholder="请输入cron执行表达式" />
              <NButton type="primary" @click="handleShowCron">生成表达式</NButton>
            </NInputGroup>
          </NFormItem>
          <NFormItem v-if="operateType === 'edit'" label="状态" path="status">
            <DictRadio v-model:value="model.status" dict-code="sys_job_status" />
          </NFormItem>
          <NFormItem label="执行策略" path="misfirePolicy">
            <NRadioGroup v-model:value="model.misfirePolicy">
              <NRadioButton value="1">立即执行</NRadioButton>
              <NRadioButton value="2">执行一次</NRadioButton>
              <NRadioButton value="3">放弃执行</NRadioButton>
            </NRadioGroup>
          </NFormItem>
          <NFormItem label="是否并发" path="concurrent">
            <NRadioGroup v-model:value="model.concurrent">
              <NRadioButton value="0">允许</NRadioButton>
              <NRadioButton value="1">禁止</NRadioButton>
            </NRadioGroup>
          </NFormItem>
        </NForm>
      </NSpin>
      <template #footer>
        <NSpace justify="end">
          <NButton @click="closeDrawer">取消</NButton>
          <NButton type="primary" :loading="loading" @click="handleSubmit">确定</NButton>
        </NSpace>
      </template>
    </NDrawerContent>
  </NDrawer>
</template>

<style scoped></style>
