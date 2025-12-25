<script setup lang="ts">
import { ref } from 'vue';
import { NDatePicker, NSpace } from 'naive-ui';
import { useNaiveForm } from '@/hooks/common/form';
import { $t } from '@/locales';

defineOptions({
  name: 'JobLogSearch',
});

interface Emits {
  (e: 'reset'): void;
  (e: 'search'): void;
}

const emit = defineEmits<Emits>();

const { formRef, validate, restoreValidation } = useNaiveForm();

const model = defineModel<Api.Monitor.JobLogSearchParams>('model', { required: true });

const dateRange = ref<[string, string] | null>(null);

function onDateRangeUpdate(value: [string, string] | null) {
  const params = model.value.params ?? {};
  if (value && value.length === 2) {
    [params.beginTime, params.endTime] = value;
  } else {
    params.beginTime = undefined;
    params.endTime = undefined;
  }
  model.value.params = params;
}

async function reset() {
  dateRange.value = null;
  await restoreValidation();
  emit('reset');
}

async function search() {
  await validate();
  emit('search');
}
</script>

<template>
  <NCard :bordered="false" size="small" class="table-search card-wrapper">
    <NCollapse>
      <NCollapseItem title="搜索" name="job-log-search">
        <NForm ref="formRef" :model="model" label-placement="left" :label-width="80">
          <NGrid responsive="screen" item-responsive>
            <NFormItemGi span="24 s:12 m:6" label="任务名称" path="jobName" class="pr-24px">
              <NInput v-model:value="model.jobName" placeholder="请输入任务名称" clearable />
            </NFormItemGi>
            <NFormItemGi span="24 s:12 m:6" label="任务组名" path="jobGroup" class="pr-24px">
              <DictSelect
                v-model:value="model.jobGroup"
                placeholder="请选择任务组名"
                dict-code="sys_job_group"
                clearable
              />
            </NFormItemGi>
            <NFormItemGi span="24 s:12 m:6" label="执行状态" path="status" class="pr-24px">
              <DictSelect
                v-model:value="model.status"
                placeholder="请选择执行状态"
                dict-code="sys_common_status"
                clearable
              />
            </NFormItemGi>
            <NFormItemGi span="24 s:12 m:6" label="执行时间" path="createTime" class="pr-24px">
              <NDatePicker
                v-model:formatted-value="dateRange"
                type="datetimerange"
                value-format="yyyy-MM-dd HH:mm:ss"
                clearable
                @update:formatted-value="onDateRangeUpdate"
              />
            </NFormItemGi>
            <NFormItemGi span="24" class="pr-24px">
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
      </NCollapseItem>
    </NCollapse>
  </NCard>
</template>

<style scoped></style>
