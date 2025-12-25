<script setup lang="ts">
import { computed } from 'vue';

defineOptions({
  name: 'JobLogDetailDrawer',
});

interface Props {
  /** the row data */
  rowData?: Api.Monitor.JobLog | null;
}

const props = defineProps<Props>();

const visible = defineModel<boolean>('visible', {
  default: false,
});

function closeDrawer() {
  visible.value = false;
}

function getStatusText(value?: string) {
  return value === '0' ? '成功' : '失败';
}
</script>

<template>
  <NDrawer v-model:show="visible" display-directive="show" :width="600" class="max-w-90%">
    <NDrawerContent title="调度日志详情" :native-scrollbar="false" closable>
      <NDescriptions label-placement="left" :column="2" bordered>
        <NDescriptionsItem label="日志序号">
          {{ rowData?.jobLogId ?? '-' }}
        </NDescriptionsItem>
        <NDescriptionsItem label="任务名称">
          {{ rowData?.jobName ?? '-' }}
        </NDescriptionsItem>
        <NDescriptionsItem label="任务分组">
          <DictTag :value="rowData?.jobGroup" dict-code="sys_job_group" />
        </NDescriptionsItem>
        <NDescriptionsItem label="执行时间">
          {{ rowData?.createTime ?? '-' }}
        </NDescriptionsItem>
        <NDescriptionsItem label="调用方法" :span="2">
          {{ rowData?.invokeTarget ?? '-' }}
        </NDescriptionsItem>
        <NDescriptionsItem label="日志信息" :span="2">
          {{ rowData?.jobMessage ?? '-' }}
        </NDescriptionsItem>
        <NDescriptionsItem label="执行状态">
          <NTag :type="rowData?.status === '0' ? 'success' : 'error'">
            {{ getStatusText(rowData?.status) }}
          </NTag>
        </NDescriptionsItem>
        <NDescriptionsItem v-if="rowData?.status === '1'" label="异常信息" :span="2">
          <NText type="error">{{ rowData?.exceptionInfo ?? '-' }}</NText>
        </NDescriptionsItem>
      </NDescriptions>
      <template #footer>
        <NButton @click="closeDrawer">关闭</NButton>
      </template>
    </NDrawerContent>
  </NDrawer>
</template>

<style scoped></style>
