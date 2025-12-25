<script setup lang="ts">
import { computed } from 'vue';

defineOptions({
  name: 'JobDetailDrawer',
});

interface Props {
  /** the row data */
  rowData?: Api.Monitor.Job | null;
}

const props = defineProps<Props>();

const visible = defineModel<boolean>('visible', {
  default: false,
});

function closeDrawer() {
  visible.value = false;
}

function getMisfirePolicyText(value?: string) {
  const map: Record<string, string> = {
    '0': '默认策略',
    '1': '立即执行',
    '2': '执行一次',
    '3': '放弃执行',
  };
  return map[value || ''] || '-';
}

function getConcurrentText(value?: string) {
  return value === '0' ? '允许' : '禁止';
}

function getStatusText(value?: string) {
  return value === '0' ? '正常' : '暂停';
}
</script>

<template>
  <NDrawer v-model:show="visible" display-directive="show" :width="600" class="max-w-90%">
    <NDrawerContent title="任务详情" :native-scrollbar="false" closable>
      <NDescriptions label-placement="left" :column="2" bordered>
        <NDescriptionsItem label="任务编号">
          {{ rowData?.jobId ?? '-' }}
        </NDescriptionsItem>
        <NDescriptionsItem label="任务名称">
          {{ rowData?.jobName ?? '-' }}
        </NDescriptionsItem>
        <NDescriptionsItem label="任务分组">
          <DictTag :value="rowData?.jobGroup" dict-code="sys_job_group" />
        </NDescriptionsItem>
        <NDescriptionsItem label="创建时间">
          {{ rowData?.createTime ?? '-' }}
        </NDescriptionsItem>
        <NDescriptionsItem label="cron表达式">
          {{ rowData?.cronExpression ?? '-' }}
        </NDescriptionsItem>
        <NDescriptionsItem label="下次执行时间">
          {{ rowData?.nextValidTime ?? '-' }}
        </NDescriptionsItem>
        <NDescriptionsItem label="调用目标方法" :span="2">
          {{ rowData?.invokeTarget ?? '-' }}
        </NDescriptionsItem>
        <NDescriptionsItem label="任务状态">
          {{ getStatusText(rowData?.status) }}
        </NDescriptionsItem>
        <NDescriptionsItem label="是否并发">
          {{ getConcurrentText(rowData?.concurrent) }}
        </NDescriptionsItem>
        <NDescriptionsItem label="执行策略" :span="2">
          {{ getMisfirePolicyText(rowData?.misfirePolicy) }}
        </NDescriptionsItem>
      </NDescriptions>
      <template #footer>
        <NButton @click="closeDrawer">关闭</NButton>
      </template>
    </NDrawerContent>
  </NDrawer>
</template>

<style scoped></style>
