<script setup lang="ts">
import { ref, watch } from 'vue';
import dayjs from 'dayjs';
import CronExpressionParser from 'cron-parser';

defineOptions({
  name: 'CronResult',
});

interface Props {
  expression: string;
}

const props = defineProps<Props>();

const nextTimes = ref<string[]>([]);
const errorMsg = ref('');

function calculateNextTimes() {
  nextTimes.value = [];
  errorMsg.value = '';

  if (!props.expression) {
    return;
  }

  try {
    // cron-parser 只支持 5 位或 6 位的 cron 表达式
    // 我们的表达式是 7 位（包含秒和年），需要转换
    const parts = props.expression.trim().split(/\s+/);
    let cronExp = props.expression;

    // 如果是 7 位，去掉年份字段
    if (parts.length === 7) {
      cronExp = parts.slice(0, 6).join(' ');
    }

    const interval = CronExpressionParser.parse(cronExp, {
      currentDate: new Date(),
    });

    const times: string[] = [];
    for (let i = 0; i < 10; i++) {
      const next = interval.next();
      times.push(dayjs(next.toDate()).format('YYYY-MM-DD HH:mm:ss'));
    }
    nextTimes.value = times;
  } catch (err) {
    errorMsg.value = err instanceof Error ? err.message : '无效的 Cron 表达式';
  }
}

watch(
  () => props.expression,
  () => {
    calculateNextTimes();
  },
  { immediate: true },
);
</script>

<template>
  <NCard size="small" title="最近10次执行时间">
    <template v-if="errorMsg">
      <NAlert type="error" :title="errorMsg" />
    </template>
    <template v-else-if="nextTimes.length > 0">
      <div class="grid grid-cols-2 gap-8px">
        <div v-for="(time, index) in nextTimes" :key="index" class="text-14px">{{ index + 1 }}. {{ time }}</div>
      </div>
    </template>
    <template v-else>
      <NEmpty description="请输入有效的 Cron 表达式" />
    </template>
  </NCard>
</template>

<style scoped></style>
